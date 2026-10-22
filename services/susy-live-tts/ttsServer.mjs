/**
 * ============================================================================
 * ⚡ SUSY LIVE TTS — MICROSERVICIO WEBSOCKET DE BAJA LATENCIA (< 500ms)
 * Ubicación: services/susy-live-tts/ttsServer.mjs
 * Endpoint: ws://localhost:3010/tts-stream
 *
 * Arquitectura:
 * - Servidor WebSocket RFC 6455 nativo en Node.js (sin dependencias pesadas).
 * - Recibe micro-chunks de texto JSON desde `useSusyLive.ts` a medida que
 *   Groq (Llama 3.3) los transmite en streaming:
 *   `{ type: "synthesize", text: "Hola vecino,", chunkId: 1, voice: "es_AR-daniela-high" }`
 * - Invoca en tiempo real el binario local de `piper` (`--output-raw`, PCM 16-bit
 *   mono a 22050Hz) o el worker local de `kokoro-onnx` por `stdin`/`stdout` y
 *   emite tramas binarias WebSocket inmediatamente al navegador.
 * - Soporta `{ type: "interrupt" }` para abortar en 0ms el proceso hijo activo
 *   cuando ocurre Barge-in del usuario.
 * ============================================================================
 */

import http from "node:http";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const PORT = Number(process.env.SUSY_LIVE_TTS_PORT || 3010);
const PIPER_BIN = process.env.PIPER_BIN_PATH || "piper";
const PIPER_MODEL = process.env.PIPER_MODEL_PATH || "./models/es_AR-daniela-high.onnx";
const SAMPLE_RATE = 22050;

/**
 * Codifica un frame WebSocket RFC 6455 (Servidor -> Cliente, sin máscara)
 * @param {Buffer} payload
 * @param {number} opcode 0x01 = texto JSON, 0x02 = audio binario PCM/WAV
 */
function encodeWsFrame(payload, opcode = 0x02) {
  const length = payload.length;
  let header;

  if (length < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x80 | opcode;
    header[1] = length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  return Buffer.concat([header, payload]);
}

/**
 * Decodifica un frame WebSocket entrante (Cliente -> Servidor, enmascarado)
 * @param {Buffer} buffer
 */
function decodeWsFrame(buffer) {
  if (buffer.length < 2) return null;
  const opcode = buffer[0] & 0x0f;
  const isMasked = Boolean(buffer[1] & 0x80);
  let payloadLength = buffer[1] & 0x7f;
  let offset = 2;

  if (payloadLength === 126) {
    if (buffer.length < 4) return null;
    payloadLength = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    if (buffer.length < 10) return null;
    payloadLength = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }

  const maskLength = isMasked ? 4 : 0;
  if (buffer.length < offset + maskLength + payloadLength) return null;

  let mask = null;
  if (isMasked) {
    mask = buffer.subarray(offset, offset + 4);
    offset += 4;
  }

  const payload = Buffer.from(buffer.subarray(offset, offset + payloadLength));
  if (isMasked && mask) {
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= mask[i % 4];
    }
  }

  return {
    opcode,
    payload,
    totalBytes: offset + payloadLength,
  };
}

/**
 * Empaqueta una cabecera binaria de 8 bytes antes del bloque PCM16:
 * - Bytes 0..3: chunkId (UInt32LE)
 * - Bytes 4..7: sampleRate (UInt32LE, ej. 22050)
 * - Bytes 8..N: Muestras PCM 16-bit signed Little-Endian
 */
function buildBinaryAudioPacket(chunkId, sampleRate, pcm16Buffer) {
  const metaHeader = Buffer.alloc(8);
  metaHeader.writeUInt32LE(chunkId >>> 0, 0);
  metaHeader.writeUInt32LE(sampleRate >>> 0, 4);
  return Buffer.concat([metaHeader, pcm16Buffer]);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      service: "Susy Live TTS Streaming Server (Piper/Kokoro)",
      developer: "Nexora One",
      endpoint: `ws://localhost:${PORT}/tts-stream`,
      status: "online",
    })
  );
});

server.on("upgrade", (req, socket) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname !== "/tts-stream") {
    socket.destroy();
    return;
  }

  const key = req.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return;
  }

  const acceptHash = crypto
    .createHash("sha1")
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest("base64");

  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptHash}`,
      "\r\n",
    ].join("\r\n")
  );

  /** @type {import("node:child_process").ChildProcessWithoutNullStreams | null} */
  let activeTtsProcess = null;
  let incomingBuffer = Buffer.alloc(0);

  const killActiveTts = () => {
    if (activeTtsProcess) {
      try {
        activeTtsProcess.kill("SIGKILL");
      } catch {
        // Ignorar
      }
      activeTtsProcess = null;
    }
  };

  const sendJsonMessage = (obj) => {
    if (socket.destroyed) return;
    const raw = Buffer.from(JSON.stringify(obj), "utf8");
    socket.write(encodeWsFrame(raw, 0x01));
  };

  sendJsonMessage({
    type: "ready",
    engine: "piper-kokoro-local",
    sampleRate: SAMPLE_RATE,
  });

  socket.on("data", (chunk) => {
    incomingBuffer = Buffer.concat([incomingBuffer, chunk]);

    while (incomingBuffer.length > 0) {
      const frame = decodeWsFrame(incomingBuffer);
      if (!frame) break;

      incomingBuffer = incomingBuffer.subarray(frame.totalBytes);

      // 0x08 = Close frame
      if (frame.opcode === 0x08) {
        killActiveTts();
        socket.end();
        return;
      }

      // 0x01 = Text frame (JSON command)
      if (frame.opcode === 0x01) {
        try {
          const message = JSON.parse(frame.payload.toString("utf8"));

          if (message.type === "interrupt") {
            killActiveTts();
            sendJsonMessage({ type: "interrupted" });
            continue;
          }

          if (message.type === "synthesize" && typeof message.text === "string") {
            const cleanText = message.text.trim();
            const chunkId = Number(message.chunkId || 1);
            if (!cleanText) continue;

            // Ejecutar Piper TTS en modo streaming raw (PCM 16-bit mono @ 22050Hz)
            const proc = spawn(PIPER_BIN, [
              "--model",
              PIPER_MODEL,
              "--output-raw",
            ]);
            activeTtsProcess = proc;

            proc.stdout.on("data", (pcmData) => {
              if (socket.destroyed) return;
              // Asegurar alineación par de 16 bits (2 bytes por muestra)
              const evenLen = pcmData.length - (pcmData.length % 2);
              if (evenLen <= 0) return;
              const packet = buildBinaryAudioPacket(
                chunkId,
                SAMPLE_RATE,
                pcmData.subarray(0, evenLen)
              );
              socket.write(encodeWsFrame(packet, 0x02));
            });

            proc.on("error", (err) => {
              sendJsonMessage({
                type: "fallback_required",
                chunkId,
                text: cleanText,
                reason: err.message,
              });
            });

            proc.on("close", () => {
              if (activeTtsProcess === proc) {
                activeTtsProcess = null;
              }
              sendJsonMessage({ type: "chunk_done", chunkId });
            });

            proc.stdin.write(`${cleanText}\n`);
            proc.stdin.end();
          }
        } catch {
          // Ignorar JSON malformado
        }
      }
    }
  });

  socket.on("close", () => {
    killActiveTts();
  });

  socket.on("error", () => {
    killActiveTts();
  });
});

server.listen(PORT, () => {
  console.log(
    `⚡ [Susy Live TTS Server] Escuchando en ws://localhost:${PORT}/tts-stream (Piper/Kokoro Raw PCM 22050Hz)`
  );
});
