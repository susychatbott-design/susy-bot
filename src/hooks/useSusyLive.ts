"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { sanitizeForTTS } from "@/utils/audioUtils";

export interface UseSusyLiveOptions {
  wsUrl?: string;
  wsTimeoutMs?: number; // Timeout máximo de espera del WebSocket antes de conmutar a TTS SO (default: 3000ms)
  crossfadeOverlapMs?: number; // Solapamiento entre chunks (default: 18ms) para prosodia continua sin clics
  onTranscriptReady?: (transcript: string) => void;
  onAssistantChunk?: (textChunk: string, fullResponseSoFar: string) => void;
  onAssistantComplete?: (fullResponse: string) => void;
}

export interface SusyLiveState {
  isLiveActive: boolean;
  isWsConnected: boolean;
  isListening: boolean;
  isUserSpeaking: boolean;
  isProcessingLLM: boolean;
  isPlayingAudio: boolean;
  liveLatencyMs: number | null;
  lastTranscript: string;
  lastResponse: string;
  error: string | null;
}

interface WsControlPayload {
  type: "ready" | "chunk_done" | "interrupted" | "fallback_required";
  chunkId?: number;
  text?: string;
  sampleRate?: number;
  reason?: string;
}

/**
 * ============================================================================
 * ⚡ useSusyLive: HOOK AISLADO DE PIPELINE DE VOZ ULTRARRÁPIDA (< 500ms)
 * Ubicación: src/hooks/useSusyLive.ts
 * Desarrollado por Nexora One (Tel: 3786414533 • mjnexora.visual@gmail.com)
 *
 * Hotfix Fase 7.1 Incluido:
 * - Timeout estricto de 3000ms en WebSocket (`ws://localhost:3010/tts-stream`) con
 *   fallback automático a `window.speechSynthesis` y liberación inmediata del estado
 *   de "pensando" (`isProcessingLLM: false`).
 * - Soporte híbrido para streams SSE (`data: {...}`) y streams de texto plano de Groq,
 *   envuelto en un bloque `try / catch / finally` a prueba de fallos silenciosos.
 * - True Barge-in en Modo Live: al detectar `onSpeechStart`:
 *   1. Envía `{ "type": "interrupt" }` por WebSocket para matar el proceso TTS local.
 *   2. Vacía y detiene la cola de buffers (`scheduledSourcesRef.current.forEach(s => s.stop())`).
 *   3. Aborta el stream actual del LLM (`llmAbortRef.current?.abort()`).
 * ============================================================================
 */
export function useSusyLive(options: UseSusyLiveOptions = {}) {
  const {
    wsUrl = "ws://localhost:3010/tts-stream",
    wsTimeoutMs = 3000,
    crossfadeOverlapMs = 18,
    onTranscriptReady,
    onAssistantChunk,
    onAssistantComplete,
  } = options;

  const [state, setState] = useState<SusyLiveState>({
    isLiveActive: false,
    isWsConnected: false,
    isListening: false,
    isUserSpeaking: false,
    isProcessingLLM: false,
    isPlayingAudio: false,
    liveLatencyMs: null,
    lastTranscript: "",
    lastResponse: "",
    error: null,
  });

  // Referencias WebSocket, Timeouts de 3000ms y LLM Streaming
  const wsRef = useRef<WebSocket | null>(null);
  const wsFallbackModeRef = useRef<boolean>(false);
  const wsResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFallbackTextsRef = useRef<Map<number, string>>(new Map());
  const llmAbortRef = useRef<AbortController | null>(null);
  const chunkCounterRef = useRef<number>(0);
  const speechEndTimestampRef = useRef<number>(0);
  const firstAudioRecordedRef = useRef<boolean>(false);

  // Referencias del Reproductor Secuencial con Solapamiento (Web Audio API)
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  // Referencias de Captura de Micrófono y VAD en vivo
  const micStreamRef = useRef<MediaStream | null>(null);
  const vadAudioCtxRef = useRef<AudioContext | null>(null);
  const vadRafRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const isSpeakingRef = useRef<boolean>(false);

  const clearWsResponseTimeout = useCallback((): void => {
    if (wsResponseTimerRef.current !== null) {
      clearTimeout(wsResponseTimerRef.current);
      wsResponseTimerRef.current = null;
    }
  }, []);

  /**
   * Reproductor Fallback del Sistema Operativo (`window.speechSynthesis`)
   * Se activa automáticamente si `ws://localhost:3010/tts-stream` no responde en 3000ms
   * o si el microservicio local no está corriendo.
   */
  const speakWithOsFallback = useCallback((rawText: string): void => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setState((prev) => ({ ...prev, isProcessingLLM: false, isPlayingAudio: false }));
      return;
    }

    const clean = sanitizeForTTS(rawText);
    if (!clean) {
      setState((prev) => ({ ...prev, isProcessingLLM: false }));
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = "es-AR";
      utterance.rate = 1.06;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith("es-ar") &&
            (v.name.toLowerCase().includes("elena") ||
              v.name.toLowerCase().includes("natural") ||
              v.name.toLowerCase().includes("google"))
        ) || voices.find((v) => v.lang.toLowerCase().startsWith("es"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        if (!firstAudioRecordedRef.current && speechEndTimestampRef.current > 0) {
          firstAudioRecordedRef.current = true;
          const ttfaMs = Math.round(performance.now() - speechEndTimestampRef.current);
          setState((prev) => ({
            ...prev,
            isProcessingLLM: false,
            isPlayingAudio: true,
            liveLatencyMs: ttfaMs,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isProcessingLLM: false,
            isPlayingAudio: true,
          }));
        }
      };

      utterance.onend = () => {
        if (!window.speechSynthesis.speaking) {
          setState((prev) => ({ ...prev, isPlayingAudio: false, isProcessingLLM: false }));
        }
      };

      utterance.onerror = () => {
        setState((prev) => ({ ...prev, isPlayingAudio: false, isProcessingLLM: false }));
      };

      setState((prev) => ({ ...prev, isProcessingLLM: false, isPlayingAudio: true }));
      window.speechSynthesis.speak(utterance);
    } catch {
      setState((prev) => ({ ...prev, isPlayingAudio: false, isProcessingLLM: false }));
    }
  }, []);

  // =========================================================================
  // 1. MOTOR DE REPRODUCCIÓN DE BUFFER SECUENCIAL CON CROSSFADE (WEB AUDIO API)
  // =========================================================================
  const ensurePlaybackAudioContext = useCallback((): AudioContext => {
    if (!playbackCtxRef.current || playbackCtxRef.current.state === "closed") {
      playbackCtxRef.current = new AudioContext({ sampleRate: 22050 });
      nextStartTimeRef.current = 0;
    }
    if (playbackCtxRef.current.state === "suspended") {
      playbackCtxRef.current.resume().catch(() => {});
    }
    return playbackCtxRef.current;
  }, []);

  /**
   * Convierte un paquete binario PCM 16-bit Little-Endian (con cabecera de 8 bytes:
   * chunkId UInt32LE + sampleRate UInt32LE) en un `AudioBuffer` con rampa de fade-in y
   * fade-out suave, y lo agenda solapando `crossfadeOverlapMs` con el chunk anterior.
   */
  const scheduleIncomingAudioBuffer = useCallback(
    async (rawPacket: ArrayBuffer): Promise<void> => {
      clearWsResponseTimeout();
      if (rawPacket.byteLength <= 8) return;

      const audioCtx = ensurePlaybackAudioContext();
      const view = new DataView(rawPacket);
      const chunkId = view.getUint32(0, true);
      const sampleRate = view.getUint32(4, true) || 22050;
      pendingFallbackTextsRef.current.delete(chunkId);

      const pcmByteLength = rawPacket.byteLength - 8;
      const sampleCount = Math.floor(pcmByteLength / 2);
      if (sampleCount <= 0) return;

      const audioBuffer = audioCtx.createBuffer(1, sampleCount, sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      // Conversión de Int16LE a Float32 [-1.0, 1.0]
      let byteOffset = 8;
      for (let i = 0; i < sampleCount; i++, byteOffset += 2) {
        const int16 = view.getInt16(byteOffset, true);
        channelData[i] = int16 < 0 ? int16 / 32768.0 : int16 / 32767.0;
      }

      // Aplicar envolvente de Crossfade (Fade-in y Fade-out cosenoidal de ~18ms) para unión sin clics
      const overlapSec = crossfadeOverlapMs / 1000;
      const fadeSamples = Math.min(
        Math.floor(sampleRate * overlapSec),
        Math.floor(sampleCount / 4)
      );

      for (let i = 0; i < fadeSamples; i++) {
        const gain = 0.5 * (1 - Math.cos((Math.PI * i) / fadeSamples));
        channelData[i] *= gain;
        channelData[sampleCount - 1 - i] *= gain;
      }

      // Crear y programar AudioBufferSourceNode con solapamiento temporal
      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      const leadSafetySec = 0.012;

      const startTime =
        nextStartTimeRef.current > now + overlapSec
          ? nextStartTimeRef.current - overlapSec
          : now + leadSafetySec;

      nextStartTimeRef.current = startTime + audioBuffer.duration;
      scheduledSourcesRef.current.add(sourceNode);

      if (!firstAudioRecordedRef.current && speechEndTimestampRef.current > 0) {
        firstAudioRecordedRef.current = true;
        const ttfaMs = Math.round(performance.now() - speechEndTimestampRef.current);
        setState((prev) => ({
          ...prev,
          isProcessingLLM: false,
          isPlayingAudio: true,
          liveLatencyMs: ttfaMs,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isProcessingLLM: false,
          isPlayingAudio: true,
        }));
      }

      sourceNode.onended = () => {
        scheduledSourcesRef.current.delete(sourceNode);
        if (scheduledSourcesRef.current.size === 0) {
          setState((prev) => ({ ...prev, isPlayingAudio: false }));
        }
      };

      sourceNode.start(startTime);
    },
    [clearWsResponseTimeout, crossfadeOverlapMs, ensurePlaybackAudioContext]
  );

  /**
   * Kill Switch del Pipeline Live (Barge-in 0ms):
   * 1. Envía inmediatamente `{ "type": "interrupt" }` por el WebSocket para matar el TTS local.
   * 2. Vacía la cola de buffers de audio (`scheduledSourcesRef.current.forEach(source => source.stop())`).
   * 3. Aborta el stream actual del LLM (`llmAbortRef.current?.abort()`).
   */
  const interruptLivePlayback = useCallback((): void => {
    clearWsResponseTimeout();
    pendingFallbackTextsRef.current.clear();

    // 1. Enviar { "type": "interrupt" } por WebSocket para matar el proceso TTS local
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: "interrupt" }));
      } catch {
        // Ignorar error de socket
      }
    }

    // 2. Vaciar la cola de buffers de audio programados en Web Audio API
    scheduledSourcesRef.current.forEach((source) => {
      try {
        source.onended = null;
        source.stop();
        source.disconnect();
      } catch {
        // Ignorar si el nodo ya se detuvo
      }
    });
    scheduledSourcesRef.current.clear();

    if (playbackCtxRef.current) {
      nextStartTimeRef.current = playbackCtxRef.current.currentTime;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignorar
      }
    }

    // 3. Abortar el stream actual del LLM en Groq
    if (llmAbortRef.current) {
      try {
        llmAbortRef.current.abort();
      } catch {
        // Ignorar
      }
      llmAbortRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isPlayingAudio: false,
      isProcessingLLM: false,
    }));
  }, [clearWsResponseTimeout]);

  // =========================================================================
  // 2. CONEXIÓN AL SERVIDOR WEBSOCKET TTS CON TIMEOUT DE 3000ms Y FALLBACK
  // =========================================================================
  const connectWebSocket = useCallback((): void => {
    if (typeof window === "undefined") return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";

      // Timeout de conexión de 3000ms: si no abre en 3s, abortar WS y activar fallback TTS del sistema
      const connTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          wsFallbackModeRef.current = true;
          try {
            ws.close();
          } catch {
            // Ignorar
          }
          setState((prev) => ({
            ...prev,
            isWsConnected: false,
            isProcessingLLM: false,
          }));
        }
      }, wsTimeoutMs);

      ws.onopen = () => {
        clearTimeout(connTimeout);
        wsFallbackModeRef.current = false;
        setState((prev) => ({ ...prev, isWsConnected: true, error: null }));
      };

      ws.onmessage = (event: MessageEvent) => {
        clearWsResponseTimeout();

        if (event.data instanceof ArrayBuffer) {
          scheduleIncomingAudioBuffer(event.data).catch(() => {});
          return;
        }

        if (typeof event.data === "string") {
          try {
            const msg = JSON.parse(event.data) as WsControlPayload;
            if (msg.type === "fallback_required") {
              wsFallbackModeRef.current = true;
              if (msg.chunkId !== undefined) {
                pendingFallbackTextsRef.current.delete(msg.chunkId);
              }
              if (msg.text) {
                speakWithOsFallback(msg.text);
              } else {
                setState((prev) => ({ ...prev, isProcessingLLM: false }));
              }
            }
          } catch {
            // Ignorar tramas de control malformadas
          }
        }
      };

      ws.onerror = () => {
        clearTimeout(connTimeout);
        wsFallbackModeRef.current = true;
        setState((prev) => ({
          ...prev,
          isWsConnected: false,
        }));
      };

      ws.onclose = () => {
        clearTimeout(connTimeout);
        setState((prev) => ({ ...prev, isWsConnected: false }));
      };

      wsRef.current = ws;
    } catch {
      wsFallbackModeRef.current = true;
      setState((prev) => ({ ...prev, isWsConnected: false }));
    }
  }, [wsUrl, wsTimeoutMs, clearWsResponseTimeout, scheduleIncomingAudioBuffer, speakWithOsFallback]);

  /**
   * Envía un fragmento de texto al WebSocket TTS con un watchdog de 3000ms.
   * Si el WebSocket no responde en 3000ms, aborta el streaming por WS y conmuta
   * automáticamente al TTS del sistema operativo (`window.speechSynthesis`),
   * liberando el estado de "pensando".
   */
  const sendTextChunkToTtsServer = useCallback(
    (textChunk: string): void => {
      const clean = sanitizeForTTS(textChunk);
      if (!clean) return;

      chunkCounterRef.current += 1;
      const chunkId = chunkCounterRef.current;

      if (
        !wsFallbackModeRef.current &&
        wsRef.current &&
        wsRef.current.readyState === WebSocket.OPEN
      ) {
        pendingFallbackTextsRef.current.set(chunkId, clean);

        try {
          wsRef.current.send(
            JSON.stringify({
              type: "synthesize",
              chunkId,
              text: clean,
            })
          );

          // Watchdog de 3000ms: si el servidor WS no responde a tiempo, abortar WS y usar TTS del SO
          if (wsResponseTimerRef.current === null) {
            wsResponseTimerRef.current = setTimeout(() => {
              wsResponseTimerRef.current = null;
              wsFallbackModeRef.current = true;

              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                try {
                  wsRef.current.send(JSON.stringify({ type: "interrupt" }));
                } catch {
                  // Ignorar
                }
              }

              const pendingChunks = Array.from(pendingFallbackTextsRef.current.values());
              pendingFallbackTextsRef.current.clear();

              setState((prev) => ({
                ...prev,
                isProcessingLLM: false,
              }));

              if (pendingChunks.length > 0) {
                speakWithOsFallback(pendingChunks.join(" "));
              }
            }, wsTimeoutMs);
          }
        } catch {
          wsFallbackModeRef.current = true;
          pendingFallbackTextsRef.current.delete(chunkId);
          speakWithOsFallback(clean);
        }
      } else {
        speakWithOsFallback(clean);
      }
    },
    [wsTimeoutMs, speakWithOsFallback]
  );

  // =========================================================================
  // 3. FLUJO GROQ WHISPER -> GROQ LLAMA 3.3 STREAMING -> CHUNKER TTS
  // =========================================================================
  const processAudioUtterance = useCallback(
    async (audioBlob: Blob): Promise<void> => {
      speechEndTimestampRef.current = performance.now();
      firstAudioRecordedRef.current = false;

      const controller = new AbortController();
      llmAbortRef.current = controller;

      // Watchdog global para evitar que cualquier bloqueo de red deje congelado el estado "pensando"
      const llmWatchdog = setTimeout(() => {
        try {
          controller.abort();
        } catch {
          // Ignorar
        }
        setState((prev) => ({
          ...prev,
          isProcessingLLM: false,
        }));
      }, 10000);

      try {
        setState((prev) => ({ ...prev, isProcessingLLM: true, error: null }));

        // Paso A: Transcribir con Whisper en Groq (/api/susy-transcribe)
        const formData = new FormData();
        formData.append("file", audioBlob, "susy_live.webm");

        const sttRes = await fetch("/api/susy-transcribe", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!sttRes.ok) {
          throw new Error(`Error STT (${sttRes.status})`);
        }

        const sttData = (await sttRes.json()) as { text?: string };
        const transcript = (sttData.text || "").trim();
        if (!transcript || transcript.length < 2) {
          setState((prev) => ({ ...prev, isProcessingLLM: false }));
          return;
        }

        setState((prev) => ({ ...prev, lastTranscript: transcript }));
        if (onTranscriptReady) onTranscriptReady(transcript);

        // Paso B: Consultar LLM con stream: true y despachar micro-cláusulas al servidor WebSocket TTS
        const llmRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: transcript,
            userText: transcript,
            mode: "executive",
            interactionMode: "voice",
          }),
          signal: controller.signal,
        });

        if (!llmRes.ok || !llmRes.body) {
          throw new Error(`Error LLM Stream (${llmRes.status})`);
        }

        const reader = llmRes.body.getReader();
        const decoder = new TextDecoder();
        let sseLineBuffer = "";
        let sentenceBuffer = "";
        let fullAssistantText = "";

        const flushSentenceBuffer = (forceAll = false): void => {
          const boundaryRegex = /([.!?;:\n,]+)\s+/;
          let match = boundaryRegex.exec(sentenceBuffer);

          while (match !== null) {
            const cutIndex = match.index + match[1].length;
            const candidate = sentenceBuffer.slice(0, cutIndex).trim();

            if (candidate.length >= 16) {
              sendTextChunkToTtsServer(candidate);
              sentenceBuffer = sentenceBuffer.slice(cutIndex).trimStart();
              match = boundaryRegex.exec(sentenceBuffer);
            } else {
              break;
            }
          }

          if (forceAll && sentenceBuffer.trim().length > 0) {
            sendTextChunkToTtsServer(sentenceBuffer.trim());
            sentenceBuffer = "";
          }
        };

        const ingestTextDelta = (delta: string): void => {
          if (!delta) return;
          fullAssistantText += delta;
          sentenceBuffer += delta;
          setState((prev) => ({
            ...prev,
            isProcessingLLM: false,
            lastResponse: fullAssistantText,
          }));
          if (onAssistantChunk) {
            onAssistantChunk(delta, fullAssistantText);
          }
          flushSentenceBuffer(false);
        };

        // Recepción robusta de chunks de Groq con try/catch interno para evitar congelamiento silencioso
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const rawChunk = decoder.decode(value, { stream: true });
            if (!rawChunk) continue;

            // Soportar tanto formato SSE ("data: {...}") como texto plano directo de /api/chat
            if (rawChunk.includes("data:") || sseLineBuffer.length > 0) {
              sseLineBuffer += rawChunk;
              const lines = sseLineBuffer.split("\n");
              sseLineBuffer = lines.pop() || "";

              for (const rawLine of lines) {
                const trimmed = rawLine.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith("data:")) {
                  const dataStr = trimmed.slice(5).trim();
                  if (dataStr === "[DONE]") continue;
                  try {
                    const parsed = JSON.parse(dataStr) as {
                      text?: string;
                      content?: string;
                      delta?: string;
                    };
                    const piece = parsed.text ?? parsed.content ?? parsed.delta ?? "";
                    if (piece) ingestTextDelta(piece);
                  } catch {
                    ingestTextDelta(dataStr);
                  }
                } else {
                  ingestTextDelta(rawLine);
                }
              }
            } else {
              ingestTextDelta(rawChunk);
            }
          }
        } catch (streamErr: unknown) {
          if (!(streamErr instanceof DOMException && streamErr.name === "AbortError")) {
            console.warn("[useSusyLive] Interrupción en lectura de chunks Groq:", streamErr);
          }
        }

        if (sseLineBuffer.trim().length > 0 && !sseLineBuffer.trim().startsWith("data:")) {
          ingestTextDelta(sseLineBuffer);
          sseLineBuffer = "";
        }

        flushSentenceBuffer(true);
        setState((prev) => ({
          ...prev,
          isProcessingLLM: false,
          lastResponse: fullAssistantText,
        }));
        if (onAssistantComplete && fullAssistantText) {
          onAssistantComplete(fullAssistantText);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setState((prev) => ({ ...prev, isProcessingLLM: false }));
          return;
        }
        const msg = err instanceof Error ? err.message : "Error en Susy Live Pipeline";
        setState((prev) => ({
          ...prev,
          isProcessingLLM: false,
          error: msg,
        }));
      } finally {
        clearTimeout(llmWatchdog);
        setState((prev) => (prev.isProcessingLLM ? { ...prev, isProcessingLLM: false } : prev));
      }
    },
    [onTranscriptReady, onAssistantChunk, onAssistantComplete, sendTextChunkToTtsServer]
  );

  // =========================================================================
  // 4. CAPTURA DE MICRÓFONO CON AEC Y DETECTOR DE SILENCIOS (VAD EN VIVO + BARGE-IN)
  // =========================================================================
  const onSpeechStart = useCallback((): void => {
    // 1. Enviar inmediatamente { "type": "interrupt" } por WebSocket para matar el proceso TTS local
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: "interrupt" }));
      } catch {
        // Ignorar
      }
    }

    // 2. Vaciar la cola de buffers de audio (scheduledSourcesRef.current.forEach(source => source.stop()))
    scheduledSourcesRef.current.forEach((source) => {
      try {
        source.onended = null;
        source.stop();
        source.disconnect();
      } catch {
        // Ignorar
      }
    });
    scheduledSourcesRef.current.clear();

    // 3. Abortar el stream actual del LLM (llmAbortRef.current?.abort())
    llmAbortRef.current?.abort();
    llmAbortRef.current = null;

    clearWsResponseTimeout();
    pendingFallbackTextsRef.current.clear();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignorar
      }
    }

    setState((prev) => ({
      ...prev,
      isUserSpeaking: true,
      isPlayingAudio: false,
      isProcessingLLM: false,
    }));
  }, [clearWsResponseTimeout]);

  const stopLiveSession = useCallback((): void => {
    interruptLivePlayback();

    if (vadRafRef.current !== null) {
      cancelAnimationFrame(vadRafRef.current);
      vadRafRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignorar
      }
    }
    mediaRecorderRef.current = null;

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    if (vadAudioCtxRef.current) {
      vadAudioCtxRef.current.close().catch(() => {});
      vadAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // Ignorar
      }
      wsRef.current = null;
    }

    isSpeakingRef.current = false;
    setState((prev) => ({
      ...prev,
      isLiveActive: false,
      isListening: false,
      isUserSpeaking: false,
      isProcessingLLM: false,
      isPlayingAudio: false,
    }));
  }, [interruptLivePlayback]);

  const startLiveSession = useCallback(async (): Promise<void> => {
    try {
      ensurePlaybackAudioContext();
      connectWebSocket();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const audioCtx = new AudioContext();
      vadAudioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.2;
      source.connect(analyser);

      const timeData = new Float32Array(analyser.fftSize);
      let silenceStartTs: number | null = null;
      let speechStartTs = 0;
      let consecutiveVoiceFrames = 0;
      const redemptionSilenceMs = 520;

      setState((prev) => ({
        ...prev,
        isLiveActive: true,
        isListening: true,
        error: null,
      }));

      const loop = (): void => {
        if (!vadAudioCtxRef.current) return;

        analyser.getFloatTimeDomainData(timeData);
        let sumSq = 0;
        for (let i = 0; i < timeData.length; i++) {
          sumSq += timeData[i] * timeData[i];
        }
        const rms = Math.sqrt(sumSq / timeData.length);
        const now = performance.now();

        const isSystemSpeakingNow =
          scheduledSourcesRef.current.size > 0 ||
          (typeof window !== "undefined" &&
            "speechSynthesis" in window &&
            window.speechSynthesis.speaking);
        const threshold = isSystemSpeakingNow ? 0.048 : 0.03;

        if (!isSpeakingRef.current) {
          if (rms >= threshold) {
            consecutiveVoiceFrames += 1;
            if (consecutiveVoiceFrames >= 3) {
              consecutiveVoiceFrames = 0;
              isSpeakingRef.current = true;
              speechStartTs = now;
              silenceStartTs = null;

              // Disparar protocolo estricto de Barge-in en Modo Live
              onSpeechStart();

              recordedChunksRef.current = [];
              const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : "audio/webm";
              const recorder = new MediaRecorder(stream, { mimeType });
              recorder.ondataavailable = (ev: BlobEvent) => {
                if (ev.data.size > 0) recordedChunksRef.current.push(ev.data);
              };
              recorder.onstop = () => {
                const duration = performance.now() - speechStartTs;
                const blob = new Blob(recordedChunksRef.current, { type: mimeType });
                if (duration >= 280 && blob.size > 1000) {
                  processAudioUtterance(blob).catch(() => {});
                }
              };
              mediaRecorderRef.current = recorder;
              recorder.start(80);
            }
          } else {
            consecutiveVoiceFrames = 0;
          }
        } else {
          if (rms < 0.016) {
            if (silenceStartTs === null) {
              silenceStartTs = now;
            } else if (now - silenceStartTs >= redemptionSilenceMs) {
              isSpeakingRef.current = false;
              silenceStartTs = null;
              setState((prev) => ({ ...prev, isUserSpeaking: false }));

              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                try {
                  mediaRecorderRef.current.stop();
                } catch {
                  // Ignorar
                }
              }
            }
          } else {
            silenceStartTs = null;
          }
        }

        vadRafRef.current = requestAnimationFrame(loop);
      };

      vadRafRef.current = requestAnimationFrame(loop);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo iniciar Modo Live";
      setState((prev) => ({
        ...prev,
        isLiveActive: false,
        isListening: false,
        isProcessingLLM: false,
        error: msg,
      }));
    }
  }, [
    ensurePlaybackAudioContext,
    connectWebSocket,
    onSpeechStart,
    processAudioUtterance,
  ]);

  const toggleLiveMode = useCallback(async (): Promise<void> => {
    if (state.isLiveActive) {
      stopLiveSession();
    } else {
      await startLiveSession();
    }
  }, [state.isLiveActive, startLiveSession, stopLiveSession]);

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, [stopLiveSession]);

  return {
    ...state,
    startLiveSession,
    stopLiveSession,
    toggleLiveMode,
    interruptLivePlayback,
    onSpeechStart,
  };
}
