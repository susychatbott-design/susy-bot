"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { sanitizeForTTS } from "@/utils/audioUtils";

export interface SusyLiveHistoryEntry {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface UseSusyLiveOptions {
  wsUrl?: string;
  wsTimeoutMs?: number; // Timeout máximo de espera del WebSocket antes de conmutar a TTS SO (default: 3000ms)
  crossfadeOverlapMs?: number; // Solapamiento entre chunks (default: 18ms) para prosodia continua sin clics
  messages?: SusyLiveHistoryEntry[]; // Historial completo del chat principal (chat.messages) para memoria continua
  sessionId?: string | null;
  mode?: string;
  onTranscriptReady?: (transcript: string) => void;
  onAssistantChunk?: (textChunk: string, fullResponseSoFar: string) => void;
  onAssistantComplete?: (fullResponse: string, userTranscript: string) => void;
}

export interface SusyLiveState {
  isLiveActive: boolean;
  isWsConnected: boolean;
  isUsingFallback: boolean;
  isListening: boolean;
  isUserSpeaking: boolean;
  isProcessingLLM: boolean;
  isSpeaking: boolean;
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

const NOISE_OR_HALLUCINATION_PATTERNS = [
  "gracias por ver",
  "subtítulos por",
  "subtitulos por",
  "amara.org",
  "suscríbete",
  "suscribete",
  "transcripción por",
  "transcripcion por",
  "música de fondo",
  "[música]",
  "(música)",
  "[risas]",
  "[aplausos]",
  "silencio",
];

function isUselessOrNoiseTranscript(raw: string): boolean {
  if (!raw) return true;
  const cleanAlphaNum = raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();

  // Bloqueador estricto: ignorar strings vacíos, nulos o de menos de 3 caracteres reales
  if (!cleanAlphaNum || cleanAlphaNum.length < 3) {
    return true;
  }

  // Ignorar interjecciones de ruido o carraspeos aislados tras Barge-in
  if (/^(eh|ah|oh|uh|mm|mmm|hm|hmm|ajá|aja|tos|ruido|sonido)$/i.test(cleanAlphaNum)) {
    return true;
  }

  // Ignorar alucinaciones clásicas de Whisper ante silencios
  if (
    cleanAlphaNum.length < 35 &&
    NOISE_OR_HALLUCINATION_PATTERNS.some((pat) => cleanAlphaNum.includes(pat))
  ) {
    return true;
  }

  return false;
}

/**
 * Segmenta un texto en frases atómicas limpias para síntesis de emergencia (`window.speechSynthesis`).
 */
function splitIntoFallbackSentences(rawText: string): string[] {
  const clean = sanitizeForTTS(rawText);
  if (!clean) return [];

  const parts = clean
    .split(/(?<=[.!?;:])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return parts.length > 0 ? parts : [clean];
}

/**
 * ============================================================================
 * ⚡ useSusyLive: HOOK AISLADO DE PIPELINE DE VOZ ULTRARRÁPIDA (< 500ms)
 * Ubicación: src/hooks/useSusyLive.ts
 * Desarrollado por Nexora One (Tel: 3786414533 • mjnexora.visual@gmail.com)
 *
 * Hotfix Fase 7.3 Incluido:
 * - Fallback Instantáneo en `ws.onerror` y `ws.onclose` (ej. `ECONNREFUSED` por
 *   servidor apagado) sin esperar al timeout de 3000ms.
 * - Síntesis de emergencia inmediata (`window.speechSynthesis`) iterando sobre
 *   la respuesta de texto acumulada de Groq con cola secuencial y watchdog por frase.
 * - Desbloqueo garantizado de VAD (Manos Libres): al terminar el ciclo (éxito o fallo),
 *   `isProcessingLLM`, `isSpeaking` e `isPlayingAudio` se establecen en `false`
 *   para reanudar la escucha automáticamente.
 * ============================================================================
 */
export function useSusyLive(options: UseSusyLiveOptions = {}) {
  const {
    wsUrl = "ws://localhost:3010/tts-stream",
    wsTimeoutMs = 3000,
    crossfadeOverlapMs = 18,
    messages = [],
    sessionId = null,
    mode = "executive",
    onTranscriptReady,
    onAssistantChunk,
    onAssistantComplete,
  } = options;

  const [state, setState] = useState<SusyLiveState>({
    isLiveActive: false,
    isWsConnected: false,
    isUsingFallback: false,
    isListening: false,
    isUserSpeaking: false,
    isProcessingLLM: false,
    isSpeaking: false,
    isPlayingAudio: false,
    liveLatencyMs: null,
    lastTranscript: "",
    lastResponse: "",
    error: null,
  });

  // Referencias de Memoria Conversacional Sincronizada con chat.messages
  const conversationHistoryRef = useRef<SusyLiveHistoryEntry[]>(messages);
  const sessionIdRef = useRef<string | null>(sessionId);
  const modeRef = useRef<string>(mode);

  useEffect(() => {
    if (Array.isArray(messages) && messages.length > 0) {
      conversationHistoryRef.current = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
    }
  }, [messages]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Referencias WebSocket, Timeouts y LLM Streaming
  const wsRef = useRef<WebSocket | null>(null);
  const wsFallbackModeRef = useRef<boolean>(false);
  const wsResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFallbackTextsRef = useRef<Map<number, string>>(new Map());
  const accumulatedGroqTextRef = useRef<string>("");
  const spokenFallbackTextRef = useRef<string>("");
  const isLlmStreamingRef = useRef<boolean>(false);
  const llmAbortRef = useRef<AbortController | null>(null);
  const chunkCounterRef = useRef<number>(0);
  const speechEndTimestampRef = useRef<number>(0);
  const firstAudioRecordedRef = useRef<boolean>(false);

  // Referencias de Cola Secuencial para `window.speechSynthesis` (Fallback de Emergencia)
  const fallbackQueueRef = useRef<string[]>([]);
  const isFallbackSpeakingRef = useRef<boolean>(false);
  const activeFallbackUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const fallbackWatchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const clearFallbackWatchdog = useCallback((): void => {
    if (fallbackWatchdogTimerRef.current !== null) {
      clearTimeout(fallbackWatchdogTimerRef.current);
      fallbackWatchdogTimerRef.current = null;
    }
  }, []);

  /**
   * 🔓 DESBLOQUEO GARANTIZADO DE VAD (MANOS LIBRES):
   * Asegura que al finalizar la reproducción (por WebSocket o Fallback), o ante cualquier error,
   * `isProcessingLLM`, `isSpeaking` e `isPlayingAudio` queden en `false` y el AudioContext del VAD esté activo.
   */
  const unlockVadAndResetAudioState = useCallback((): void => {
    isFallbackSpeakingRef.current = false;
    activeFallbackUtteranceRef.current = null;
    isSpeakingRef.current = false;

    if (vadAudioCtxRef.current && vadAudioCtxRef.current.state === "suspended") {
      vadAudioCtxRef.current.resume().catch(() => {});
    }

    setState((prev) => ({
      ...prev,
      isProcessingLLM: false,
      isSpeaking: false,
      isPlayingAudio: false,
    }));
  }, []);

  /**
   * Procesa secuencialmente la cola de frases del Fallback (`window.speechSynthesis`).
   * Mantiene referencia viva al `SpeechSynthesisUtterance` para evitar recolección de basura (GC)
   * en Chromium y cuenta con un watchdog por frase para que jamás quede bloqueado el VAD.
   */
  const drainFallbackSpeechQueue = useCallback((): void => {
    clearFallbackWatchdog();

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      fallbackQueueRef.current = [];
      unlockVadAndResetAudioState();
      return;
    }

    const nextSentence = fallbackQueueRef.current.shift();
    if (!nextSentence) {
      if (!isLlmStreamingRef.current && scheduledSourcesRef.current.size === 0) {
        unlockVadAndResetAudioState();
      } else {
        isFallbackSpeakingRef.current = false;
      }
      return;
    }

    isFallbackSpeakingRef.current = true;

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(nextSentence);
      activeFallbackUtteranceRef.current = utterance;
      utterance.lang = "es-AR";
      utterance.rate = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith("es-ar") &&
            (v.name.toLowerCase().includes("elena") ||
              v.name.toLowerCase().includes("natural") ||
              v.name.toLowerCase().includes("google"))
        ) ||
        voices.find(
          (v) =>
            (v.lang.toLowerCase().startsWith("es-419") ||
              v.lang.toLowerCase().startsWith("es-us") ||
              v.lang.toLowerCase().startsWith("es-mx")) &&
            (v.name.toLowerCase().includes("natural") ||
              v.name.toLowerCase().includes("sabina") ||
              v.name.toLowerCase().includes("paulina"))
        ) ||
        voices.find((v) => v.lang.toLowerCase().startsWith("es"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang || "es-AR";
      }

      const maxSentenceDurationMs = Math.min(
        16000,
        Math.max(3500, nextSentence.length * 90)
      );

      let settled = false;
      const advanceNext = (): void => {
        if (settled) return;
        settled = true;
        clearFallbackWatchdog();
        activeFallbackUtteranceRef.current = null;
        drainFallbackSpeechQueue();
      };

      fallbackWatchdogTimerRef.current = setTimeout(() => {
        advanceNext();
      }, maxSentenceDurationMs);

      utterance.onstart = () => {
        if (!firstAudioRecordedRef.current && speechEndTimestampRef.current > 0) {
          firstAudioRecordedRef.current = true;
          const ttfaMs = Math.round(performance.now() - speechEndTimestampRef.current);
          setState((prev) => ({
            ...prev,
            isProcessingLLM: false,
            isSpeaking: true,
            isPlayingAudio: true,
            liveLatencyMs: ttfaMs,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isProcessingLLM: false,
            isSpeaking: true,
            isPlayingAudio: true,
          }));
        }
      };

      utterance.onend = () => {
        advanceNext();
      };

      utterance.onerror = () => {
        advanceNext();
      };

      setState((prev) => ({
        ...prev,
        isProcessingLLM: false,
        isSpeaking: true,
        isPlayingAudio: true,
      }));

      window.speechSynthesis.speak(utterance);
    } catch {
      activeFallbackUtteranceRef.current = null;
      drainFallbackSpeechQueue();
    }
  }, [clearFallbackWatchdog, unlockVadAndResetAudioState]);

  /**
   * Reproductor Fallback del Sistema Operativo (`window.speechSynthesis`)
   * Itera sobre las oraciones del texto recibido y las encola de forma segura.
   */
  const speakWithOsFallback = useCallback(
    (rawText: string): void => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        unlockVadAndResetAudioState();
        return;
      }

      const sentences = splitIntoFallbackSentences(rawText);
      if (sentences.length === 0) {
        if (!isLlmStreamingRef.current && !isFallbackSpeakingRef.current) {
          unlockVadAndResetAudioState();
        }
        return;
      }

      for (const sentence of sentences) {
        fallbackQueueRef.current.push(sentence);
      }

      if (!isFallbackSpeakingRef.current) {
        drainFallbackSpeechQueue();
      }
    },
    [drainFallbackSpeechQueue, unlockVadAndResetAudioState]
  );

  /**
   * Activa de inmediato la síntesis de emergencia (`window.speechSynthesis`)
   * iterando sobre los fragmentos pendientes o la respuesta acumulada de Groq.
   */
  const activateImmediateEmergencyFallback = useCallback(
    (explicitText?: string): void => {
      clearWsResponseTimeout();
      wsFallbackModeRef.current = true;

      setState((prev) => ({
        ...prev,
        isWsConnected: false,
        isUsingFallback: true,
      }));

      const pendingChunks = Array.from(pendingFallbackTextsRef.current.values());
      pendingFallbackTextsRef.current.clear();

      let textToSpeak = "";
      if (explicitText && explicitText.trim().length > 0) {
        textToSpeak = explicitText.trim();
      } else if (pendingChunks.length > 0) {
        textToSpeak = pendingChunks.join(" ").trim();
      } else if (accumulatedGroqTextRef.current.trim().length > spokenFallbackTextRef.current.length) {
        textToSpeak = accumulatedGroqTextRef.current
          .slice(spokenFallbackTextRef.current.length)
          .trim();
      }

      if (textToSpeak.length > 0) {
        spokenFallbackTextRef.current = accumulatedGroqTextRef.current;
        speakWithOsFallback(textToSpeak);
      } else if (!isLlmStreamingRef.current && !isFallbackSpeakingRef.current) {
        unlockVadAndResetAudioState();
      }
    },
    [clearWsResponseTimeout, speakWithOsFallback, unlockVadAndResetAudioState]
  );

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

  const scheduleIncomingAudioBuffer = useCallback(
    async (rawPacket: ArrayBuffer): Promise<void> => {
      clearWsResponseTimeout();
      if (rawPacket.byteLength <= 8) return;

      const audioCtx = ensurePlaybackAudioContext();
      const view = new DataView(rawPacket);
      const chunkId = view.getUint32(0, true);
      const sampleRate = view.getUint32(4, true) || 22050;
      const resolvedChunkText = pendingFallbackTextsRef.current.get(chunkId);
      if (resolvedChunkText) {
        spokenFallbackTextRef.current += " " + resolvedChunkText;
      }
      pendingFallbackTextsRef.current.delete(chunkId);

      const pcmByteLength = rawPacket.byteLength - 8;
      const sampleCount = Math.floor(pcmByteLength / 2);
      if (sampleCount <= 0) return;

      const audioBuffer = audioCtx.createBuffer(1, sampleCount, sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      let byteOffset = 8;
      for (let i = 0; i < sampleCount; i++, byteOffset += 2) {
        const int16 = view.getInt16(byteOffset, true);
        channelData[i] = int16 < 0 ? int16 / 32768.0 : int16 / 32767.0;
      }

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
          isSpeaking: true,
          isPlayingAudio: true,
          liveLatencyMs: ttfaMs,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isProcessingLLM: false,
          isSpeaking: true,
          isPlayingAudio: true,
        }));
      }

      sourceNode.onended = () => {
        scheduledSourcesRef.current.delete(sourceNode);
        if (
          scheduledSourcesRef.current.size === 0 &&
          !isLlmStreamingRef.current &&
          pendingFallbackTextsRef.current.size === 0
        ) {
          unlockVadAndResetAudioState();
        }
      };

      sourceNode.start(startTime);
    },
    [
      clearWsResponseTimeout,
      crossfadeOverlapMs,
      ensurePlaybackAudioContext,
      unlockVadAndResetAudioState,
    ]
  );

  /**
   * Kill Switch del Pipeline Live (Barge-in 0ms):
   * 1. Envía inmediatamente `{ "type": "interrupt" }` por el WebSocket para matar el TTS local.
   * 2. Vacía la cola de buffers de audio (`scheduledSourcesRef.current.forEach(source => source.stop())`).
   * 3. Aborta el stream actual del LLM (`llmAbortRef.current?.abort()`).
   */
  const interruptLivePlayback = useCallback((): void => {
    clearWsResponseTimeout();
    clearFallbackWatchdog();
    pendingFallbackTextsRef.current.clear();
    fallbackQueueRef.current = [];
    isFallbackSpeakingRef.current = false;
    activeFallbackUtteranceRef.current = null;
    isLlmStreamingRef.current = false;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: "interrupt" }));
      } catch {
        // Ignorar error de socket
      }
    }

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
      isProcessingLLM: false,
      isSpeaking: false,
      isPlayingAudio: false,
    }));
  }, [clearFallbackWatchdog, clearWsResponseTimeout]);

  // =========================================================================
  // 2. CONEXIÓN AL SERVIDOR WEBSOCKET TTS CON FALLBACK INSTANTÁNEO EN ONERROR/ONCLOSE
  // =========================================================================
  const connectWebSocket = useCallback((): void => {
    if (typeof window === "undefined") return;
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";

      const connTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          wsFallbackModeRef.current = true;
          try {
            ws.close();
          } catch {
            // Ignorar
          }
          activateImmediateEmergencyFallback();
        }
      }, wsTimeoutMs);

      ws.onopen = () => {
        clearTimeout(connTimeout);
        wsFallbackModeRef.current = false;
        setState((prev) => ({
          ...prev,
          isWsConnected: true,
          isUsingFallback: false,
          error: null,
        }));
      };

      ws.onmessage = (event: MessageEvent) => {
        if (event.data instanceof ArrayBuffer) {
          clearWsResponseTimeout();
          scheduleIncomingAudioBuffer(event.data).catch(() => {});
          return;
        }

        if (typeof event.data === "string") {
          try {
            const msg = JSON.parse(event.data) as WsControlPayload;
            if (msg.type === "fallback_required") {
              clearWsResponseTimeout();
              wsFallbackModeRef.current = true;
              if (msg.chunkId !== undefined) {
                pendingFallbackTextsRef.current.delete(msg.chunkId);
              }
              activateImmediateEmergencyFallback(msg.text);
            } else if (msg.type === "chunk_done") {
              if (
                !isLlmStreamingRef.current &&
                pendingFallbackTextsRef.current.size === 0 &&
                scheduledSourcesRef.current.size === 0 &&
                !isFallbackSpeakingRef.current
              ) {
                unlockVadAndResetAudioState();
              }
            }
          } catch {
            // Ignorar
          }
        }
      };

      // 🚨 FALLBACK INSTANTÁNEO (0ms): Si `ECONNREFUSED` o error de red ocurre, no esperar 3000ms
      ws.onerror = () => {
        clearTimeout(connTimeout);
        activateImmediateEmergencyFallback();
      };

      ws.onclose = () => {
        clearTimeout(connTimeout);
        wsRef.current = null;
        activateImmediateEmergencyFallback();
      };

      wsRef.current = ws;
    } catch {
      activateImmediateEmergencyFallback();
    }
  }, [
    wsUrl,
    wsTimeoutMs,
    activateImmediateEmergencyFallback,
    clearWsResponseTimeout,
    scheduleIncomingAudioBuffer,
    unlockVadAndResetAudioState,
  ]);

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

              activateImmediateEmergencyFallback();
            }, wsTimeoutMs);
          }
        } catch {
          pendingFallbackTextsRef.current.delete(chunkId);
          activateImmediateEmergencyFallback(clean);
        }
      } else {
        wsFallbackModeRef.current = true;
        setState((prev) =>
          prev.isUsingFallback ? prev : { ...prev, isWsConnected: false, isUsingFallback: true }
        );
        spokenFallbackTextRef.current += " " + clean;
        speakWithOsFallback(clean);
      }
    },
    [wsTimeoutMs, activateImmediateEmergencyFallback, speakWithOsFallback]
  );

  // =========================================================================
  // 3. FLUJO GROQ WHISPER -> GROQ LLAMA 3.3 STREAMING (CON MEMORIA Y FILTRO >= 3 CHARS)
  // =========================================================================
  const processAudioUtterance = useCallback(
    async (audioBlob: Blob): Promise<void> => {
      speechEndTimestampRef.current = performance.now();
      firstAudioRecordedRef.current = false;
      accumulatedGroqTextRef.current = "";
      spokenFallbackTextRef.current = "";
      isLlmStreamingRef.current = true;

      const controller = new AbortController();
      llmAbortRef.current = controller;

      const llmWatchdog = setTimeout(() => {
        try {
          controller.abort();
        } catch {
          // Ignorar
        }
        isLlmStreamingRef.current = false;
        if (!isFallbackSpeakingRef.current && scheduledSourcesRef.current.size === 0) {
          unlockVadAndResetAudioState();
        } else {
          setState((prev) => ({ ...prev, isProcessingLLM: false }));
        }
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
          isLlmStreamingRef.current = false;
          unlockVadAndResetAudioState();
          return;
        }

        const sttData = (await sttRes.json()) as { text?: string };
        const transcript = (sttData.text || "").trim();

        // 🛡️ BLOQUEADOR ESTRICTO: No enviar strings vacíos, nulos o < 3 caracteres al LLM
        if (isUselessOrNoiseTranscript(transcript)) {
          isLlmStreamingRef.current = false;
          unlockVadAndResetAudioState();
          return;
        }

        setState((prev) => ({ ...prev, lastTranscript: transcript }));
        if (onTranscriptReady) onTranscriptReady(transcript);

        // Construir el historial completo de la conversación (chat.messages + turnos previos)
        const priorHistory = conversationHistoryRef.current
          .filter((m) => m.content && m.content.trim().length > 0)
          .slice(-20)
          .map((m) => ({
            role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
            content: m.content.trim(),
          }));

        const fullMessagesPayload = [
          ...priorHistory,
          { role: "user" as const, content: transcript },
        ];

        // Actualizar inmediatamente la memoria en vivo con el turno del usuario
        conversationHistoryRef.current = fullMessagesPayload;

        // Paso B: Consultar LLM con stream: true e historial completo (`messages` y `history`)
        const llmRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: transcript,
            userText: transcript,
            messages: fullMessagesPayload,
            history: priorHistory,
            session_id: sessionIdRef.current || undefined,
            sessionId: sessionIdRef.current || undefined,
            mode: modeRef.current || "executive",
            interactionMode: "voice",
            contextData: {
              mode: modeRef.current || "executive",
              interactionMode: "voice",
            },
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
          const boundaryRegex = /([.!?;:\n]+)\s+/;
          let match = boundaryRegex.exec(sentenceBuffer);

          while (match !== null) {
            const cutIndex = match.index + match[1].length;
            const candidate = sentenceBuffer.slice(0, cutIndex).trim();

            if (candidate.length >= 14) {
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
          accumulatedGroqTextRef.current = fullAssistantText;
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

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const rawChunk = decoder.decode(value, { stream: true });
            if (!rawChunk) continue;

            if (rawChunk.includes("data:") || sseLineBuffer.length > 0) {
              sseLineBuffer += rawChunk;
              const lines = sseLineBuffer.split("\n");
              sseLineBuffer = lines.pop() || "";

              for (const rawLine of lines) {
                const trimmed = rawLine.trim();
                if (!trimmed || trimmed.startsWith(":")) continue;

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

        isLlmStreamingRef.current = false;
        flushSentenceBuffer(true);

        if (fullAssistantText.trim().length > 0) {
          conversationHistoryRef.current = [
            ...conversationHistoryRef.current,
            { role: "assistant", content: fullAssistantText.trim() },
          ];

          // Defensa extra: si el WebSocket cayó y nada entró en cola de audio, sintetizar inmediatamente el texto acumulado
          if (
            wsFallbackModeRef.current &&
            !isFallbackSpeakingRef.current &&
            fallbackQueueRef.current.length === 0 &&
            spokenFallbackTextRef.current.trim().length === 0
          ) {
            spokenFallbackTextRef.current = fullAssistantText;
            speakWithOsFallback(fullAssistantText);
          }
        } else {
          unlockVadAndResetAudioState();
        }

        setState((prev) => ({
          ...prev,
          isProcessingLLM: false,
          lastResponse: fullAssistantText,
        }));
        if (onAssistantComplete && fullAssistantText.trim().length > 0) {
          onAssistantComplete(fullAssistantText.trim(), transcript);
        }
      } catch (err: unknown) {
        isLlmStreamingRef.current = false;
        if (err instanceof DOMException && err.name === "AbortError") {
          unlockVadAndResetAudioState();
          return;
        }
        const msg = err instanceof Error ? err.message : "Error en Susy Live Pipeline";
        setState((prev) => ({
          ...prev,
          isProcessingLLM: false,
          isSpeaking: false,
          isPlayingAudio: false,
          error: msg,
        }));
      } finally {
        clearTimeout(llmWatchdog);
        isLlmStreamingRef.current = false;
        // Si no hay audio ni síntesis en curso ni chunks pendientes de WebSocket, liberar estados inmediatamente
        if (
          !isFallbackSpeakingRef.current &&
          fallbackQueueRef.current.length === 0 &&
          scheduledSourcesRef.current.size === 0 &&
          pendingFallbackTextsRef.current.size === 0
        ) {
          unlockVadAndResetAudioState();
        } else {
          setState((prev) =>
            prev.isProcessingLLM ? { ...prev, isProcessingLLM: false } : prev
          );
        }
      }
    },
    [
      onTranscriptReady,
      onAssistantChunk,
      onAssistantComplete,
      sendTextChunkToTtsServer,
      speakWithOsFallback,
      unlockVadAndResetAudioState,
    ]
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
    isLlmStreamingRef.current = false;

    clearWsResponseTimeout();
    clearFallbackWatchdog();
    pendingFallbackTextsRef.current.clear();
    fallbackQueueRef.current = [];
    isFallbackSpeakingRef.current = false;
    activeFallbackUtteranceRef.current = null;

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
      isSpeaking: false,
      isPlayingAudio: false,
      isProcessingLLM: false,
    }));
  }, [clearFallbackWatchdog, clearWsResponseTimeout]);

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
      isSpeaking: false,
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
      const redemptionSilenceMs = 550;

      setState((prev) => ({
        ...prev,
        isLiveActive: true,
        isListening: true,
        error: null,
      }));

      const loop = (): void => {
        if (!vadAudioCtxRef.current) return;
        if (vadAudioCtxRef.current.state === "suspended") {
          vadAudioCtxRef.current.resume().catch(() => {});
        }

        analyser.getFloatTimeDomainData(timeData);
        let sumSq = 0;
        for (let i = 0; i < timeData.length; i++) {
          sumSq += timeData[i] * timeData[i];
        }
        const rms = Math.sqrt(sumSq / timeData.length);
        const now = performance.now();

        const isSystemSpeakingNow =
          scheduledSourcesRef.current.size > 0 || isFallbackSpeakingRef.current;
        const threshold = isSystemSpeakingNow ? 0.052 : 0.032;

        if (!isSpeakingRef.current) {
          if (rms >= threshold) {
            consecutiveVoiceFrames += 1;
            if (consecutiveVoiceFrames >= 4) {
              consecutiveVoiceFrames = 0;
              isSpeakingRef.current = true;
              speechStartTs = now;
              silenceStartTs = null;

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
                // Ignorar ruidos cortos (< 420ms o < 1500 bytes) tras una interrupción Barge-in
                if (duration >= 420 && blob.size > 1500) {
                  processAudioUtterance(blob).catch(() => {});
                } else {
                  unlockVadAndResetAudioState();
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
        isSpeaking: false,
        isPlayingAudio: false,
        error: msg,
      }));
    }
  }, [
    ensurePlaybackAudioContext,
    connectWebSocket,
    onSpeechStart,
    processAudioUtterance,
    unlockVadAndResetAudioState,
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
    connectWebSocket,
    sendTextChunkToTtsServer,
    speakWithOsFallback,
  };
}
