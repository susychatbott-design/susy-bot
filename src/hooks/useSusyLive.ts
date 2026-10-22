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
 * ============================================================================
 * ⚡ useSusyLive: HOOK AISLADO DE PIPELINE DE VOZ ULTRARRÁPIDA (< 500ms)
 * Ubicación: src/hooks/useSusyLive.ts
 * Desarrollado por Nexora One (Tel: 3786414533 • mjnexora.visual@gmail.com)
 *
 * Hotfix Fase 7.4 Incluido:
 * - Sentence Buffering para Web Speech API: En modo Fallback acumula los chunks
 *   de texto entrantes en un buffer temporal y solo extrae y sintetiza oraciones
 *   completas cuando detecta puntuación fuerte (`.`, `?`, `!`, o `\n`) o al
 *   cerrar el stream de Groq.
 * - Prevención de Garbage Collection en Chrome: Guarda todas las instancias activas
 *   de `SpeechSynthesisUtterance` en `useRef<SpeechSynthesisUtterance[]>([])`
 *   durante su reproducción para evitar que V8 las destruya antes de emitir audio.
 * - Sincronización de Estados VAD: Mantiene `isSpeaking = true` mientras el Fallback
 *   está leyendo cada oración (pausando la auto-activación del VAD para que no se
 *   escuche a sí mismo) y lo restablece a `false` al terminar.
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

  // 🛡️ FASE 7.4 & 7.5: Sentence Buffering, Prevención de GC en Chrome y Epoch de Barge-in
  const fallbackTextBufferRef = useRef<string>("");
  const fallbackSentenceQueueRef = useRef<string[]>([]);
  const activeUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const isFallbackSpeakingRef = useRef<boolean>(false);
  const fallbackWatchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackBargeInEpochRef = useRef<number>(0);
  const fallbackSpeechStartTsRef = useRef<number>(0);

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
    activeUtterancesRef.current = [];
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
   * Reproduce secuencialmente las oraciones completas extraídas por el Sentence Buffer.
   * Guarda cada instancia de `SpeechSynthesisUtterance` en `activeUtterancesRef.current`
   * (`useRef<SpeechSynthesisUtterance[]>`) para impedir que el Garbage Collector de Chrome
   * la destruya antes o durante la emisión de voz.
   */
  const playNextSentenceFromFallbackQueue = useCallback((): void => {
    clearFallbackWatchdog();

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      fallbackSentenceQueueRef.current = [];
      activeUtterancesRef.current = [];
      unlockVadAndResetAudioState();
      return;
    }

    const nextSentence = fallbackSentenceQueueRef.current.shift();
    if (!nextSentence) {
      // Si ya no quedan oraciones en cola ni utterances activos y el stream LLM terminó, liberar VAD
      if (
        activeUtterancesRef.current.length === 0 &&
        !isLlmStreamingRef.current &&
        scheduledSourcesRef.current.size === 0
      ) {
        unlockVadAndResetAudioState();
      } else if (activeUtterancesRef.current.length === 0) {
        isFallbackSpeakingRef.current = false;
      }
      return;
    }

    const cleanSentence = sanitizeForTTS(nextSentence);
    if (!cleanSentence) {
      playNextSentenceFromFallbackQueue();
      return;
    }

    isFallbackSpeakingRef.current = true;
    setState((prev) => ({
      ...prev,
      isProcessingLLM: false,
      isSpeaking: true,
      isPlayingAudio: true,
    }));

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanSentence);
      // 🛡️ Prevención de Garbage Collection en Chrome: retener en el array useRef<SpeechSynthesisUtterance[]>
      activeUtterancesRef.current.push(utterance);

      utterance.lang = "es-AR";
      utterance.rate = 1.04;
      utterance.pitch = 1.02;

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
        18000,
        Math.max(4000, cleanSentence.length * 95)
      );

      const currentEpoch = fallbackBargeInEpochRef.current;
      let settled = false;
      const finalizeUtteranceAndAdvance = (): void => {
        if (settled) return;
        settled = true;
        clearFallbackWatchdog();
        activeUtterancesRef.current = activeUtterancesRef.current.filter(
          (u) => u !== utterance
        );
        // Si hubo un Barge-in (cambio de epoch) o se desactivó el Fallback, NO avanzar a la siguiente oración
        if (fallbackBargeInEpochRef.current !== currentEpoch || !isFallbackSpeakingRef.current) {
          return;
        }
        playNextSentenceFromFallbackQueue();
      };

      fallbackWatchdogTimerRef.current = setTimeout(() => {
        finalizeUtteranceAndAdvance();
      }, maxSentenceDurationMs);

      utterance.onstart = () => {
        if (fallbackBargeInEpochRef.current !== currentEpoch) {
          return;
        }
        isFallbackSpeakingRef.current = true;
        fallbackSpeechStartTsRef.current = performance.now();
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
        finalizeUtteranceAndAdvance();
      };

      utterance.onerror = () => {
        finalizeUtteranceAndAdvance();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      playNextSentenceFromFallbackQueue();
    }
  }, [clearFallbackWatchdog, unlockVadAndResetAudioState]);

  /**
   * 🧩 SENTENCE BUFFERING PARA WEB SPEECH API (FASE 7.4):
   * Acumula los `textChunks` entrantes en `fallbackTextBufferRef.current`.
   * Solo cuando detecta un signo de puntuación fuerte (`.`, `?`, `!`, o `\n`)
   * —o cuando `flushRemaining = true` al finalizar el stream de Groq— extrae
   * la oración completa, la encola y dispara `playNextSentenceFromFallbackQueue()`.
   */
  const speakWithOsFallback = useCallback(
    (rawTextChunk: string, flushRemaining = false): void => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        unlockVadAndResetAudioState();
        return;
      }

      if (rawTextChunk) {
        const needsSpace =
          fallbackTextBufferRef.current.length > 0 &&
          !/\s$/.test(fallbackTextBufferRef.current) &&
          !/^\s/.test(rawTextChunk);
        fallbackTextBufferRef.current += (needsSpace ? " " : "") + rawTextChunk;
      }

      // Extraer únicamente oraciones completas delimitadas por puntuación fuerte (., ?, !, \n)
      const strongSentenceRegex = /([^.?!\n]+[.?!\n]+)/;
      let match = strongSentenceRegex.exec(fallbackTextBufferRef.current);

      while (match !== null) {
        const fullSentence = match[1].trim();
        const cutIdx = match.index + match[1].length;
        fallbackTextBufferRef.current = fallbackTextBufferRef.current
          .slice(cutIdx)
          .trimStart();

        if (fullSentence.length > 0) {
          fallbackSentenceQueueRef.current.push(fullSentence);
        }
        match = strongSentenceRegex.exec(fallbackTextBufferRef.current);
      }

      // Al terminar el stream de Groq (flushRemaining = true), vaciar cualquier remanente final
      if (flushRemaining && fallbackTextBufferRef.current.trim().length > 0) {
        const remainder = fallbackTextBufferRef.current.trim();
        fallbackTextBufferRef.current = "";
        if (remainder.length > 0) {
          fallbackSentenceQueueRef.current.push(remainder);
        }
      }

      if (fallbackSentenceQueueRef.current.length > 0 && !isFallbackSpeakingRef.current) {
        playNextSentenceFromFallbackQueue();
      } else if (
        flushRemaining &&
        fallbackSentenceQueueRef.current.length === 0 &&
        activeUtterancesRef.current.length === 0 &&
        !isFallbackSpeakingRef.current &&
        !isLlmStreamingRef.current
      ) {
        unlockVadAndResetAudioState();
      }
    },
    [playNextSentenceFromFallbackQueue, unlockVadAndResetAudioState]
  );

  /**
   * Activa de inmediato la síntesis de emergencia (`window.speechSynthesis`)
   * pasando el texto acumulado por el Sentence Buffer.
   */
  const activateImmediateEmergencyFallback = useCallback(
    (explicitText?: string, flushAll = false): void => {
      clearWsResponseTimeout();
      wsFallbackModeRef.current = true;

      setState((prev) => ({
        ...prev,
        isWsConnected: false,
        isUsingFallback: true,
      }));

      const pendingChunks = Array.from(pendingFallbackTextsRef.current.values());
      pendingFallbackTextsRef.current.clear();

      let textToFeed = "";
      if (explicitText && explicitText.trim().length > 0) {
        textToFeed = explicitText.trim();
      } else if (pendingChunks.length > 0) {
        textToFeed = pendingChunks.join(" ").trim();
      } else if (
        accumulatedGroqTextRef.current.trim().length >
        spokenFallbackTextRef.current.length
      ) {
        textToFeed = accumulatedGroqTextRef.current
          .slice(spokenFallbackTextRef.current.length)
          .trim();
      }

      if (textToFeed.length > 0) {
        spokenFallbackTextRef.current = accumulatedGroqTextRef.current;
        speakWithOsFallback(textToFeed, flushAll || !isLlmStreamingRef.current);
      } else if (flushAll && fallbackTextBufferRef.current.trim().length > 0) {
        speakWithOsFallback("", true);
      } else if (
        !isLlmStreamingRef.current &&
        !isFallbackSpeakingRef.current &&
        activeUtterancesRef.current.length === 0 &&
        fallbackSentenceQueueRef.current.length === 0
      ) {
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
   * Kill Switch del Pipeline Live (Barge-in 0ms - Fase 7.5):
   * 1. Ejecuta `window.speechSynthesis.cancel()` de forma síncrona e invalida callbacks de utterances.
   * 2. Vacía `fallbackSentenceQueueRef`, `fallbackTextBufferRef` y `activeUtterancesRef`.
   * 3. Reinicia `isFallbackSpeakingRef.current = false` e `isSpeaking = false`.
   * 4. Envía `{ "type": "interrupt" }` por WebSocket y detiene los buffers Web Audio.
   * 5. Dispara invariablemente `llmAbortRef.current?.abort()` para cortar el stream de Groq.
   */
  const interruptLivePlayback = useCallback((): void => {
    fallbackBargeInEpochRef.current += 1;
    clearWsResponseTimeout();
    clearFallbackWatchdog();

    // Desvincular callbacks antes de limpiar la cola para que `onend`/`onerror` no disparen la siguiente oración en bucle
    activeUtterancesRef.current.forEach((u) => {
      u.onstart = null;
      u.onend = null;
      u.onerror = null;
    });

    // 🛡️ FASE 7.6: Parche de resiliencia Anti-Crash de Web Speech API (Android/iOS/Safari/Chrome):
    // Verificar si está hablando o pausado, ejecutar `resume()` justo antes de `cancel()` para destrabar el motor
    // y vaciar los arrays de memoria.
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          window.speechSynthesis.cancel();
        }
      } catch {
        // Ignorar
      }
    }

    pendingFallbackTextsRef.current.clear();
    fallbackSentenceQueueRef.current = [];
    fallbackTextBufferRef.current = "";
    activeUtterancesRef.current = [];
    accumulatedGroqTextRef.current = "";
    spokenFallbackTextRef.current = "";
    isFallbackSpeakingRef.current = false;
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

    llmAbortRef.current?.abort();
    llmAbortRef.current = null;

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
                !isFallbackSpeakingRef.current &&
                activeUtterancesRef.current.length === 0
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
    (textChunk: string, forceFlush = false): void => {
      if (!textChunk && !forceFlush) return;

      if (
        !wsFallbackModeRef.current &&
        wsRef.current &&
        wsRef.current.readyState === WebSocket.OPEN
      ) {
        const clean = sanitizeForTTS(textChunk);
        if (!clean) return;

        chunkCounterRef.current += 1;
        const chunkId = chunkCounterRef.current;
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

              activateImmediateEmergencyFallback(undefined, forceFlush);
            }, wsTimeoutMs);
          }
        } catch {
          pendingFallbackTextsRef.current.delete(chunkId);
          activateImmediateEmergencyFallback(textChunk, forceFlush);
        }
      } else {
        wsFallbackModeRef.current = true;
        setState((prev) =>
          prev.isUsingFallback ? prev : { ...prev, isWsConnected: false, isUsingFallback: true }
        );
        spokenFallbackTextRef.current += " " + textChunk;
        speakWithOsFallback(textChunk, forceFlush);
      }
    },
    [wsTimeoutMs, activateImmediateEmergencyFallback, speakWithOsFallback]
  );

  // =========================================================================
  // 3. FLUJO GROQ WHISPER -> GROQ LLAMA 3.3 STREAMING (CON SENTENCE BUFFERING)
  // =========================================================================
  const processAudioUtterance = useCallback(
    async (audioBlob: Blob): Promise<void> => {
      speechEndTimestampRef.current = performance.now();
      firstAudioRecordedRef.current = false;
      accumulatedGroqTextRef.current = "";
      spokenFallbackTextRef.current = "";
      fallbackTextBufferRef.current = "";
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
        if (
          !isFallbackSpeakingRef.current &&
          activeUtterancesRef.current.length === 0 &&
          scheduledSourcesRef.current.size === 0
        ) {
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

        // Envolver únicamente por signos de puntuación fuerte (., ?, !, \n)
        const flushSentenceBuffer = (forceAll = false): void => {
          if (controller.signal.aborted) {
            sentenceBuffer = "";
            return;
          }
          const strongBoundaryRegex = /([^.?!\n]+[.?!\n]+)/;
          let match = strongBoundaryRegex.exec(sentenceBuffer);

          while (match !== null) {
            const candidate = match[1].trim();
            const cutIndex = match.index + match[1].length;
            sentenceBuffer = sentenceBuffer.slice(cutIndex).trimStart();

            if (candidate.length > 0 && !controller.signal.aborted) {
              sendTextChunkToTtsServer(candidate, false);
            }
            match = strongBoundaryRegex.exec(sentenceBuffer);
          }

          if (forceAll && !controller.signal.aborted && sentenceBuffer.trim().length > 0) {
            sendTextChunkToTtsServer(sentenceBuffer.trim(), true);
            sentenceBuffer = "";
          } else if (forceAll && !controller.signal.aborted) {
            sendTextChunkToTtsServer("", true);
          }
        };

        const ingestTextDelta = (delta: string): void => {
          if (!delta || controller.signal.aborted) return;
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
            if (controller.signal.aborted) break;
            const { done, value } = await reader.read();
            if (done || controller.signal.aborted) break;

            const rawChunk = decoder.decode(value, { stream: true });
            if (!rawChunk) continue;

            if (rawChunk.includes("data:") || sseLineBuffer.length > 0) {
              sseLineBuffer += rawChunk;
              const lines = sseLineBuffer.split("\n");
              sseLineBuffer = lines.pop() || "";

              for (const rawLine of lines) {
                if (controller.signal.aborted) break;
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
          if (
            controller.signal.aborted ||
            (streamErr instanceof DOMException && streamErr.name === "AbortError")
          ) {
            isLlmStreamingRef.current = false;
            return;
          }
          console.warn("[useSusyLive] Interrupción en lectura de chunks Groq:", streamErr);
        }

        // Si hubo Barge-in (abort), cortar inmediatamente sin volcar buffers viejos al Fallback
        if (controller.signal.aborted) {
          isLlmStreamingRef.current = false;
          return;
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
            activeUtterancesRef.current.length === 0 &&
            fallbackSentenceQueueRef.current.length === 0 &&
            spokenFallbackTextRef.current.trim().length === 0
          ) {
            spokenFallbackTextRef.current = fullAssistantText;
            speakWithOsFallback(fullAssistantText, true);
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
        if (
          !isFallbackSpeakingRef.current &&
          activeUtterancesRef.current.length === 0 &&
          fallbackSentenceQueueRef.current.length === 0 &&
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
    // Incrementar epoch de Barge-in para bloquear cualquier callback asíncrono residual del Fallback
    fallbackBargeInEpochRef.current += 1;

    // 1. Limpieza Total en el Kill Switch del Fallback con parche Anti-Crash (resume() + cancel())
    activeUtterancesRef.current.forEach((u) => {
      u.onstart = null;
      u.onend = null;
      u.onerror = null;
    });

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          window.speechSynthesis.cancel();
        }
      } catch {
        // Ignorar
      }
    }

    fallbackSentenceQueueRef.current = [];
    fallbackTextBufferRef.current = "";
    activeUtterancesRef.current = [];
    accumulatedGroqTextRef.current = "";
    spokenFallbackTextRef.current = "";
    pendingFallbackTextsRef.current.clear();
    isFallbackSpeakingRef.current = false;

    // 2. Sincronización del AbortController para detener la generación de Groq de la pregunta vieja
    llmAbortRef.current?.abort();
    llmAbortRef.current = null;
    isLlmStreamingRef.current = false;

    clearWsResponseTimeout();
    clearFallbackWatchdog();

    // 3. Enviar inmediatamente { "type": "interrupt" } por WebSocket para matar el proceso TTS local
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: "interrupt" }));
      } catch {
        // Ignorar
      }
    }

    // 4. Vaciar la cola de buffers de audio (scheduledSourcesRef.current.forEach(source => source.stop()))
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

        const now = performance.now();

        // Lockout acústico breve (380ms) al arrancar una oración Fallback para descartar el transitorio inicial del altavoz
        if (
          isFallbackSpeakingRef.current &&
          now - fallbackSpeechStartTsRef.current < 380
        ) {
          consecutiveVoiceFrames = 0;
          vadRafRef.current = requestAnimationFrame(loop);
          return;
        }

        analyser.getFloatTimeDomainData(timeData);
        let sumSq = 0;
        for (let i = 0; i < timeData.length; i++) {
          sumSq += timeData[i] * timeData[i];
        }
        const rms = Math.sqrt(sumSq / timeData.length);

        const isSystemSpeakingNow =
          scheduledSourcesRef.current.size > 0 ||
          isFallbackSpeakingRef.current ||
          activeUtterancesRef.current.length > 0;
        // Durante reproducción (WS o Fallback), exigir umbral más alto y más frames sostenidos para permitir Barge-in real sin auto-escucharse
        const threshold = isSystemSpeakingNow ? 0.065 : 0.032;
        const requiredFrames = isSystemSpeakingNow ? 6 : 4;

        if (!isSpeakingRef.current) {
          if (rms >= threshold) {
            consecutiveVoiceFrames += 1;
            if (consecutiveVoiceFrames >= requiredFrames) {
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
