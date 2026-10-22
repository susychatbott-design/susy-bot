"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SusyMode } from "@/lib/prompts/types";
import { sanitizeForTTS } from "@/utils/audioUtils";

export type AudioEngineType = "cloud-whisper" | "native-edge";

export interface SusyAudioState {
  isRecording: boolean;
  isTranscribing: boolean;
  isSpeaking: boolean;
  activeEngine: AudioEngineType;
  transcript: string;
  error: string | null;
}

export interface UseSusyAudioOptions {
  onTranscriptionComplete?: (text: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  defaultMode?: SusyMode;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

/**
 * Selector estricto de Voz Argentina / Cono Sur (Cero acento de España)
 */
export function selectBestArgentineNaturalVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const isSpainVoice = (v: SpeechSynthesisVoice): boolean => {
    const l = (v.lang || "").toLowerCase();
    const n = (v.name || "").toLowerCase();
    return (
      l.includes("es-es") ||
      l.includes("es_es") ||
      n.includes("spain") ||
      n.includes("españa") ||
      n.includes("helena") ||
      n.includes("monica") ||
      n.includes("laura") ||
      n.includes("pablo")
    );
  };

  // 1. Prioridad máxima: Voz Argentina Natural / Neuronal (es-AR, Elena Argentina, Tomas, Brenda, etc.)
  const argVoice = voices.find((v) => {
    if (isSpainVoice(v)) return false;
    const l = (v.lang || "").toLowerCase();
    const n = (v.name || "").toLowerCase();
    return (
      l.includes("es-ar") ||
      l.includes("es_ar") ||
      n.includes("argentina") ||
      n.includes("tomas") ||
      n.includes("brenda") ||
      n.includes("diego") ||
      (n.includes("elena") && l.includes("es-ar"))
    );
  });
  if (argVoice) return argVoice;

  // 2. Segunda prioridad: Voces Neuronales / Naturales Latinoamericanas (es-419, es-MX, es-US, es-UY, Sabina, Paulina, Dalia)
  const latamNatural = voices.find((v) => {
    if (isSpainVoice(v)) return false;
    const l = (v.lang || "").toLowerCase();
    const n = (v.name || "").toLowerCase();
    return (
      (n.includes("natural") || n.includes("online") || n.includes("google")) &&
      (l.startsWith("es-419") ||
        l.startsWith("es-mx") ||
        l.startsWith("es-us") ||
        l.startsWith("es-uy") ||
        l.startsWith("es-cl"))
    );
  });
  if (latamNatural) return latamNatural;

  // 3. Tercera prioridad: Voces expresivas latinoamericanas
  const latamStandard = voices.find((v) => {
    if (isSpainVoice(v)) return false;
    const l = (v.lang || "").toLowerCase();
    const n = (v.name || "").toLowerCase();
    return (
      l.includes("es-419") ||
      l.includes("es-us") ||
      l.includes("es-mx") ||
      l.includes("es-uy") ||
      l.includes("es-cl") ||
      n.includes("sabina") ||
      n.includes("paulina") ||
      n.includes("dalia") ||
      n.includes("jimena") ||
      n.includes("latino")
    );
  });
  if (latamStandard) return latamStandard;

  // 4. Cuarta prioridad: Cualquier voz en español que no sea de España
  const anyNonSpain = voices.find((v) => {
    const l = (v.lang || "").toLowerCase();
    return l.startsWith("es") && !isSpainVoice(v);
  });
  if (anyNonSpain) return anyNonSpain;

  return voices.find((v) => (v.lang || "").toLowerCase().startsWith("es")) || voices[0] || null;
}

/**
 * useSusyAudio: Hook de Grado Industrial "Zero-Weight Hybrid Edge" para Susy Bot.
 *
 * 1. STT Dual Resiliente:
 *    - Primario: /api/susy-transcribe (Open Whisper Large v3 Turbo) con timeout estricto de 4000ms.
 *    - Respaldo Instantáneo (0 MB / 0ms): Web Speech API (SpeechRecognition) en es-AR.
 *
 * 2. TTS Humano Adaptativo Rioplatense/Latinoamericano:
 *    - Calibración acústica por modo cognitivo:
 *      * "lazarillo": ágil y directo (rate 1.15, pitch 1.02)
 *      * "tea": pausado, articulado y libre de sobrecarga sensorial (rate 0.90, pitch 0.98)
 *      * "executive" / "general": concierge municipal cálida (rate 1.05, pitch 1.00)
 */
export function useSusyAudio(options: UseSusyAudioOptions = {}) {
  const { onTranscriptionComplete, onSpeechStart, onSpeechEnd, defaultMode = "executive" } = options;

  const [state, setState] = useState<SusyAudioState>({
    isRecording: false,
    isTranscribing: false,
    isSpeaking: false,
    activeEngine: "cloud-whisper",
    transcript: "",
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const nativeRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const nativeTranscriptBufferRef = useRef<string>("");
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeHtmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioContextRef = useRef<AudioContext | null>(null);
  const activeBufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const activeModeRef = useRef<SusyMode>(defaultMode);

  const selectBestNaturalVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    return selectBestArgentineNaturalVoice(voices);
  }, []);

  /**
   * KILL SWITCH ABSOLUTO (TRUE BARGE-IN):
   * 1. window.speechSynthesis.cancel() ejecutado 2 veces separadas por 50ms (mitiga bug de Chrome/Android).
   * 2. Recorre todos los HTMLAudioElement en ref y en el DOM (document.querySelectorAll('audio')),
   *    ejecutando .pause(), .currentTime = 0 y .src = "".
   * 3. Si existe un AudioContext activo, ejecuta .suspend() y .close().
   */
  const stopPlayback = useCallback((): void => {
    if (typeof window !== "undefined") {
      if ("speechSynthesis" in window) {
        try {
          window.speechSynthesis.pause();
          window.speechSynthesis.cancel();
          setTimeout(() => {
            try {
              window.speechSynthesis.cancel();
            } catch {
              // Ignorar
            }
          }, 50);
        } catch {
          // Ignorar errores de cancelación
        }
      }

      // Detener cualquier nodo AudioBufferSourceNode activo
      if (activeBufferSourceRef.current) {
        try {
          activeBufferSourceRef.current.stop();
          activeBufferSourceRef.current.disconnect();
        } catch {
          // Ignorar si ya estaba detenido
        }
        activeBufferSourceRef.current = null;
      }

      // Suspender y cerrar AudioContext de reproducción TTS si existiera
      if (activeAudioContextRef.current) {
        try {
          const ctx = activeAudioContextRef.current;
          activeAudioContextRef.current = null;
          if (ctx.state === "running") {
            ctx.suspend().catch(() => {});
          }
          ctx.close().catch(() => {});
        } catch {
          // Ignorar
        }
      }

      // Detener instancia <audio> en ref
      if (activeHtmlAudioRef.current) {
        try {
          activeHtmlAudioRef.current.pause();
          activeHtmlAudioRef.current.currentTime = 0;
          activeHtmlAudioRef.current.src = "";
        } catch {
          // Ignorar
        }
        activeHtmlAudioRef.current = null;
      }

      // Barrido de todos los HTMLAudioElement en el DOM
      if (typeof document !== "undefined") {
        const audioElements = document.querySelectorAll("audio");
        audioElements.forEach((el) => {
          try {
            el.pause();
            el.currentTime = 0;
            el.src = "";
          } catch {
            // Ignorar
          }
        });
      }
    }

    currentUtteranceRef.current = null;
    setState((prev) => (prev.isSpeaking ? { ...prev, isSpeaking: false } : prev));
  }, []);

  // Alias de compatibilidad
  const stopSpeaking = stopPlayback;

  // Síntesis de voz con calibración acústica adaptativa al modo cognitivo
  const speakText = useCallback(
    (text: string, onEnd?: () => void, overrideMode?: SusyMode): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          resolve();
          return;
        }

        stopPlayback();

        const cleanText = sanitizeForTTS(text);
        if (!cleanText) {
          resolve();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "es-AR";

        const currentMode = overrideMode || activeModeRef.current;
        if (currentMode === "lazarillo" || currentMode === "no_videntes") {
          utterance.rate = 1.15;
          utterance.pitch = 1.02;
        } else if (currentMode === "tea") {
          utterance.rate = 0.90;
          utterance.pitch = 0.98;
        } else {
          utterance.rate = 1.05;
          utterance.pitch = 1.00;
        }

        const naturalVoice = selectBestNaturalVoice();
        if (naturalVoice) {
          utterance.voice = naturalVoice;
          utterance.lang = naturalVoice.lang || "es-AR";
        }

        utterance.onstart = () => {
          setState((prev) => ({ ...prev, isSpeaking: true }));
        };

        utterance.onend = () => {
          setState((prev) => ({ ...prev, isSpeaking: false }));
          if (onEnd) onEnd();
          resolve();
        };

        utterance.onerror = (e) => {
          console.warn("[useSusyAudio] Error en SpeechSynthesis:", e);
          setState((prev) => ({ ...prev, isSpeaking: false }));
          if (onEnd) onEnd();
          resolve();
        };

        currentUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      });
    },
    [selectBestNaturalVoice, stopPlayback]
  );

  // Inicializar motor de reconocimiento nativo Web Speech (Edge Fallback en paralelo)
  const initNativeRecognition = useCallback((): BrowserSpeechRecognition | null => {
    if (typeof window === "undefined") return null;

    const win = window as unknown as WindowWithSpeechRecognition;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return null;

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "es-AR";

      recognition.onspeechstart = () => {
        // Barge-in inmediato si el motor nativo detecta voz del vecino
        stopPlayback();
        if (onSpeechStart) onSpeechStart();
      };

      recognition.onspeechend = () => {
        if (onSpeechEnd) onSpeechEnd();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        nativeTranscriptBufferRef.current = (final || interim).trim();
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn("[useSusyAudio Native STT]:", event.error);
      };

      return recognition;
    } catch {
      return null;
    }
  }, [onSpeechStart, onSpeechEnd]);

  // Iniciar captura de audio dual (Web Speech Edge + MediaRecorder Whisper) — Barge-in manual
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      // Barge-in manual: cortar inmediatamente cualquier reproducción de Susy antes de abrir el mic
      stopPlayback();
      nativeTranscriptBufferRef.current = "";

      if (!nativeRecognitionRef.current) {
        nativeRecognitionRef.current = initNativeRecognition();
      }
      try {
        nativeRecognitionRef.current?.start();
      } catch {
        // Ignorar si ya estaba iniciado
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100);
      setState((prev) => ({
        ...prev,
        isRecording: true,
        error: null,
        activeEngine: "cloud-whisper",
      }));
    } catch (err: unknown) {
      console.error("[useSusyAudio] Error iniciando micrófono:", err);
      setState((prev) => ({
        ...prev,
        isRecording: false,
        error: "No se pudo acceder al micrófono. Verifica los permisos del navegador.",
      }));
    }
  }, [stopSpeaking, initNativeRecognition]);

  // Detener grabación y procesar con estrategia dual STT (Cloud Whisper 4000ms -> Native Edge 0ms)
  const stopRecordingAndTranscribe = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        nativeRecognitionRef.current?.stop();
      } catch {
        // No-op
      }

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setState((prev) => ({ ...prev, isRecording: false }));
        const fallbackText = nativeTranscriptBufferRef.current.trim();
        if (fallbackText) {
          setState((prev) => ({ ...prev, activeEngine: "native-edge", transcript: fallbackText }));
          if (onTranscriptionComplete) onTranscriptionComplete(fallbackText);
          resolve(fallbackText);
          return;
        }
        resolve(null);
        return;
      }

      recorder.onstop = async () => {
        recorder.stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        if (audioBlob.size < 1500) {
          const nativeText = nativeTranscriptBufferRef.current.trim();
          if (nativeText) {
            setState((prev) => ({
              ...prev,
              isRecording: false,
              isTranscribing: false,
              activeEngine: "native-edge",
              transcript: nativeText,
            }));
            if (onTranscriptionComplete) onTranscriptionComplete(nativeText);
            resolve(nativeText);
            return;
          }
          setState((prev) => ({ ...prev, isRecording: false, isTranscribing: false }));
          resolve(null);
          return;
        }

        setState((prev) => ({ ...prev, isRecording: false, isTranscribing: true }));

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 4000);

        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.webm");

          const response = await fetch("/api/susy-transcribe", {
            method: "POST",
            body: formData,
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = (await response.json()) as { text?: string };
          const recognizedText = data.text?.trim() || "";

          if (!recognizedText && nativeTranscriptBufferRef.current.trim()) {
            throw new Error("Cloud Whisper devolvió texto vacío, conmutando a Edge");
          }

          setState((prev) => ({
            ...prev,
            isTranscribing: false,
            activeEngine: "cloud-whisper",
            transcript: recognizedText,
          }));

          if (onTranscriptionComplete) onTranscriptionComplete(recognizedText);
          resolve(recognizedText);
        } catch (err: unknown) {
          clearTimeout(timeoutId);
          const msg = err instanceof Error ? err.message : String(err);
          console.warn("[useSusyAudio STT Failover -> Native Edge]:", msg);

          const nativeText = nativeTranscriptBufferRef.current.trim();
          if (nativeText) {
            setState((prev) => ({
              ...prev,
              isTranscribing: false,
              activeEngine: "native-edge",
              transcript: nativeText,
            }));
            if (onTranscriptionComplete) onTranscriptionComplete(nativeText);
            resolve(nativeText);
            return;
          }

          setState((prev) => ({
            ...prev,
            isTranscribing: false,
            error: "No se pudo procesar la voz por red ni localmente.",
          }));
          resolve(null);
        }
      };

      recorder.stop();
    });
  }, [onTranscriptionComplete]);

  // Cancelar grabación activa sin procesar
  const cancelRecording = useCallback((): void => {
    try {
      nativeRecognitionRef.current?.stop();
    } catch {}
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    nativeTranscriptBufferRef.current = "";
    setState((prev) => ({ ...prev, isRecording: false, isTranscribing: false }));
  }, []);

  // Actualizar el modo cognitivo activo para la calibración acústica
  const setCognitiveMode = useCallback((newMode: SusyMode): void => {
    activeModeRef.current = newMode;
  }, []);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      try {
        nativeRecognitionRef.current?.stop();
      } catch {}
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current.stop();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Transcribir un Blob de audio arbitrario (ej. generado por useSusyVAD en WAV de 16kHz)
  const transcribeAudioBlob = useCallback(
    async (blob: Blob): Promise<string | null> => {
      setState((prev) => ({ ...prev, isTranscribing: true }));
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 4000);

      try {
        const formData = new FormData();
        const extension = blob.type.includes("wav") ? "audio.wav" : "audio.webm";
        formData.append("file", blob, extension);

        const response = await fetch("/api/susy-transcribe", {
          method: "POST",
          body: formData,
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as { text?: string };
        const recognizedText = data.text?.trim() || "";

        setState((prev) => ({
          ...prev,
          isTranscribing: false,
          activeEngine: "cloud-whisper",
          transcript: recognizedText,
        }));

        if (onTranscriptionComplete && recognizedText) {
          onTranscriptionComplete(recognizedText);
        }

        return recognizedText;
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[useSusyAudio transcribeAudioBlob fallback]:", msg);
        const fallback = nativeTranscriptBufferRef.current.trim();
        if (fallback) {
          setState((prev) => ({
            ...prev,
            isTranscribing: false,
            activeEngine: "native-edge",
            transcript: fallback,
          }));
          if (onTranscriptionComplete) onTranscriptionComplete(fallback);
          return fallback;
        }

        setState((prev) => ({
          ...prev,
          isTranscribing: false,
          error: "No se pudo transcribir el audio.",
        }));
        return null;
      }
    },
    [onTranscriptionComplete]
  );

  return {
    ...state,
    isPlaying: state.isSpeaking,
    startRecording,
    stopRecordingAndTranscribe,
    transcribeAudioBlob,
    cancelRecording,
    speakText,
    stopPlayback,
    stopSpeaking,
    setCognitiveMode,
    selectBestNaturalVoice,
  };
}

export { useSusyAudio as useNoraAudio };
