"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface SusyVADOptions {
  onSpeechStart?: () => void;
  onSpeechEnd?: (audioBlob: Blob) => void;
  onVADMisfire?: () => void;
  positiveSpeechThreshold?: number; // Umbral de confianza de voz (default: 0.85)
  negativeSpeechThreshold?: number; // Umbral de silencio (default: 0.4)
  redemptionMs?: number;            // Milisegundos de tolerancia antes de cerrar la frase (default: 600)
  enabled?: boolean;
  isSystemSpeaking?: boolean;       // 🔒 MUTEX ANTI-FEEDBACK LOOP: Si Susy está hablando, pausar/ignorar el VAD automático
}

export interface SusyVADState {
  isListening: boolean;
  userSpeaking: boolean;
  isModelLoaded: boolean;
  error: string | null;
}

interface MicVADInstance {
  start: () => Promise<void> | void;
  pause: () => Promise<void> | void;
  destroy: () => Promise<void> | void;
}

interface MicVADOptions {
  positiveSpeechThreshold: number;
  negativeSpeechThreshold: number;
  redemptionMs: number;
  onSpeechStart: () => void;
  onSpeechEnd: (audio: Float32Array) => void;
  onVADMisfire: () => void;
}

interface VadWebModule {
  MicVAD: {
    new: (options: MicVADOptions) => Promise<MicVADInstance>;
  };
}

/**
 * useSusyVAD: Hook de Voice Activity Detection con Mutex de Exclusión Mutua Anti-Feedback.
 *
 * Reglas de Ingeniería Acústica Móvil:
 * 1. MUTEX ESTRICTO (`isSystemSpeaking`): Si `audio.isSpeaking` o `audio.isPlaying` es `true` (o si
 *    `window.speechSynthesis.speaking` está activo), el detector automático VAD entra en pausa
 *    (`pauseVAD`) e ignora cualquier evento de `onSpeechStart` / `onSpeechEnd` más una ventana de
 *    amortiguamiento de reverberación de 550ms al finalizar la locución de Susy.
 * 2. Restricciones de Hardware Forzadas: `{ echoCancellation: true, noiseSuppression: true, autoGainControl: false }`.
 *    `autoGainControl: false` evita que el micrófono del celular amplifique el eco residual del altavoz.
 */
export function useSusyVAD(options: SusyVADOptions = {}) {
  const {
    onSpeechStart,
    onSpeechEnd,
    onVADMisfire,
    positiveSpeechThreshold = 0.85,
    negativeSpeechThreshold = 0.4,
    redemptionMs = 600,
    enabled = false,
    isSystemSpeaking = false,
  } = options;

  const [state, setState] = useState<SusyVADState>({
    isListening: false,
    userSpeaking: false,
    isModelLoaded: false,
    error: null,
  });

  // Guardar callbacks en refs para no reiniciar el ciclo de vida del VAD en cada re-render
  const onSpeechStartRef = useRef(onSpeechStart);
  const onSpeechEndRef = useRef(onSpeechEnd);
  const onVADMisfireRef = useRef(onVADMisfire);

  useEffect(() => {
    onSpeechStartRef.current = onSpeechStart;
    onSpeechEndRef.current = onSpeechEnd;
    onVADMisfireRef.current = onVADMisfire;
  }, [onSpeechStart, onSpeechEnd, onVADMisfire]);

  // 🔒 Candado Mutex contra Feedback Loop (Susy escuchándose a sí misma)
  const isSystemSpeakingRef = useRef<boolean>(isSystemSpeaking);
  const lastSystemSpeechEndedTsRef = useRef<number>(0);
  const ECHO_GUARD_COOLDOWN_MS = 550;

  useEffect(() => {
    if (isSystemSpeakingRef.current && !isSystemSpeaking) {
      lastSystemSpeechEndedTsRef.current = performance.now();
    }
    isSystemSpeakingRef.current = isSystemSpeaking;
  }, [isSystemSpeaking]);

  // Verifica si el altavoz del sistema está emitiendo voz o dentro de la ventana de reverberación
  const isLockedBySystemOutput = useCallback((): boolean => {
    if (isSystemSpeakingRef.current) return true;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        return true;
      }
    }
    const elapsedSinceEnd = performance.now() - lastSystemSpeechEndedTsRef.current;
    if (lastSystemSpeechEndedTsRef.current > 0 && elapsedSinceEnd < ECHO_GUARD_COOLDOWN_MS) {
      return true;
    }
    return false;
  }, []);

  const myvadRef = useRef<MicVADInstance | null>(null);
  const isInitializingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // Recursos para el Fallback Nativo Web Audio API
  const nativeStreamRef = useRef<MediaStream | null>(null);
  const nativeAudioCtxRef = useRef<AudioContext | null>(null);
  const nativeRafIdRef = useRef<number | null>(null);
  const nativeRecorderRef = useRef<MediaRecorder | null>(null);
  const nativeChunksRef = useRef<Blob[]>([]);
  const isSpeakingNativeRef = useRef<boolean>(false);
  const silenceStartTsRef = useRef<number | null>(null);
  const speechStartTsRef = useRef<number>(0);

  // Convierte Float32Array a un Blob WAV estándar de 16kHz
  const float32ToWavBlob = useCallback((audioData: Float32Array, sampleRate = 16000): Blob => {
    const buffer = new ArrayBuffer(44 + audioData.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string): void => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + audioData.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, audioData.length * 2, true);

    let offset = 44;
    for (let i = 0; i < audioData.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([view], { type: "audio/wav" });
  }, []);

  const stopNativeFallbackVAD = useCallback((): void => {
    if (nativeRafIdRef.current !== null) {
      cancelAnimationFrame(nativeRafIdRef.current);
      nativeRafIdRef.current = null;
    }
    if (nativeRecorderRef.current && nativeRecorderRef.current.state !== "inactive") {
      try {
        nativeRecorderRef.current.stop();
      } catch {
        // Ignorar
      }
    }
    nativeRecorderRef.current = null;
    if (nativeStreamRef.current) {
      nativeStreamRef.current.getTracks().forEach((t) => t.stop());
      nativeStreamRef.current = null;
    }
    if (nativeAudioCtxRef.current) {
      nativeAudioCtxRef.current.close().catch(() => {});
      nativeAudioCtxRef.current = null;
    }
    isSpeakingNativeRef.current = false;
    silenceStartTsRef.current = null;
  }, []);

  // Detector VAD Nativo con Mutex Anti-Feedback y autoGainControl: false
  const startNativeWebAudioVAD = useCallback(async (): Promise<void> => {
    stopNativeFallbackVAD();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
      },
    });

    if (!isMountedRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    nativeStreamRef.current = stream;
    const audioCtx = new AudioContext();
    nativeAudioCtxRef.current = audioCtx;

    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.25;
    source.connect(analyser);

    const timeData = new Float32Array(analyser.fftSize);
    const rmsSpeechThreshold = 0.045;
    const rmsSilenceThreshold = 0.02;

    setState({
      isListening: true,
      userSpeaking: false,
      isModelLoaded: true,
      error: null,
    });

    const monitorLoop = (): void => {
      if (!isMountedRef.current || !nativeAudioCtxRef.current) return;

      // 🔒 MUTEX ANTI-FEEDBACK: Si Susy está hablando o en ventana de reverberación, ignorar entrada
      if (isLockedBySystemOutput()) {
        if (isSpeakingNativeRef.current) {
          isSpeakingNativeRef.current = false;
          silenceStartTsRef.current = null;
          setState((prev) => (prev.userSpeaking ? { ...prev, userSpeaking: false } : prev));
        }
        nativeRafIdRef.current = requestAnimationFrame(monitorLoop);
        return;
      }

      analyser.getFloatTimeDomainData(timeData);
      let sumSquares = 0;
      for (let i = 0; i < timeData.length; i++) {
        sumSquares += timeData[i] * timeData[i];
      }
      const rms = Math.sqrt(sumSquares / timeData.length);
      const now = performance.now();

      if (!isSpeakingNativeRef.current) {
        if (rms >= rmsSpeechThreshold) {
          isSpeakingNativeRef.current = true;
          speechStartTsRef.current = now;
          silenceStartTsRef.current = null;

          setState((prev) => ({ ...prev, userSpeaking: true }));
          if (onSpeechStartRef.current) {
            onSpeechStartRef.current();
          }

          try {
            nativeChunksRef.current = [];
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
              ? "audio/webm;codecs=opus"
              : "audio/webm";
            const recorder = new MediaRecorder(stream, { mimeType });
            recorder.ondataavailable = (ev: BlobEvent) => {
              if (ev.data.size > 0) nativeChunksRef.current.push(ev.data);
            };
            recorder.onstop = () => {
              // Si durante la grabación se activó el TTS del sistema, descartar el chunk para evitar eco
              if (isLockedBySystemOutput()) {
                return;
              }
              const duration = performance.now() - speechStartTsRef.current;
              const blob = new Blob(nativeChunksRef.current, { type: mimeType });
              if (duration >= 350 && blob.size > 1500) {
                if (onSpeechEndRef.current) onSpeechEndRef.current(blob);
              } else {
                if (onVADMisfireRef.current) onVADMisfireRef.current();
              }
            };
            nativeRecorderRef.current = recorder;
            recorder.start(100);
          } catch {
            // Ignorar
          }
        }
      } else {
        if (rms < rmsSilenceThreshold) {
          if (silenceStartTsRef.current === null) {
            silenceStartTsRef.current = now;
          } else if (now - silenceStartTsRef.current >= redemptionMs) {
            isSpeakingNativeRef.current = false;
            silenceStartTsRef.current = null;
            setState((prev) => ({ ...prev, userSpeaking: false }));

            if (nativeRecorderRef.current && nativeRecorderRef.current.state !== "inactive") {
              try {
                nativeRecorderRef.current.stop();
              } catch {
                // Ignorar
              }
            }
          }
        } else {
          silenceStartTsRef.current = null;
        }
      }

      nativeRafIdRef.current = requestAnimationFrame(monitorLoop);
    };

    nativeRafIdRef.current = requestAnimationFrame(monitorLoop);
  }, [redemptionMs, stopNativeFallbackVAD, isLockedBySystemOutput]);

  // Iniciar el listener de VAD en el navegador con guardas de concurrencia y Mutex Anti-Feedback
  const startVAD = useCallback(async (): Promise<void> => {
    if (typeof window === "undefined" || isLockedBySystemOutput()) return;

    if (myvadRef.current) {
      try {
        await myvadRef.current.start();
        if (isMountedRef.current) {
          setState((prev) => ({ ...prev, isListening: true, error: null }));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[useSusyVAD] Error reanudando VAD:", msg);
      }
      return;
    }

    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    try {
      const vadModuleName = "@ricky0123/vad-web";
      const vadModule = (await import(/* webpackIgnore: true */ vadModuleName)) as unknown as VadWebModule;

      const vad = await vadModule.MicVAD.new({
        positiveSpeechThreshold,
        negativeSpeechThreshold,
        redemptionMs,
        onSpeechStart: () => {
          // 🔒 MUTEX: Ignorar si Susy está hablando por el altavoz
          if (!isMountedRef.current || isLockedBySystemOutput()) return;
          setState((prev) => ({ ...prev, userSpeaking: true }));
          if (onSpeechStartRef.current) onSpeechStartRef.current();
        },
        onSpeechEnd: (audio: Float32Array) => {
          // 🔒 MUTEX: Descartar audio capturado mientras Susy hablaba
          if (!isMountedRef.current || isLockedBySystemOutput()) {
            setState((prev) => ({ ...prev, userSpeaking: false }));
            return;
          }
          setState((prev) => ({ ...prev, userSpeaking: false }));
          const wavBlob = float32ToWavBlob(audio, 16000);
          if (onSpeechEndRef.current) onSpeechEndRef.current(wavBlob);
        },
        onVADMisfire: () => {
          if (!isMountedRef.current) return;
          setState((prev) => ({ ...prev, userSpeaking: false }));
          if (onVADMisfireRef.current) onVADMisfireRef.current();
        },
      });

      if (!isMountedRef.current) {
        await vad.destroy();
        return;
      }

      myvadRef.current = vad;
      await vad.start();

      setState({
        isListening: true,
        userSpeaking: false,
        isModelLoaded: true,
        error: null,
      });
    } catch {
      try {
        await startNativeWebAudioVAD();
      } catch (fallbackErr: unknown) {
        const msg =
          fallbackErr instanceof Error ? fallbackErr.message : "Error al inicializar micrófono VAD";
        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            isListening: false,
            error: msg,
          }));
        }
      }
    } finally {
      isInitializingRef.current = false;
    }
  }, [
    positiveSpeechThreshold,
    negativeSpeechThreshold,
    redemptionMs,
    float32ToWavBlob,
    startNativeWebAudioVAD,
    isLockedBySystemOutput,
  ]);

  const pauseVAD = useCallback((): void => {
    if (myvadRef.current) {
      myvadRef.current.pause();
    }
    stopNativeFallbackVAD();
    setState((prev) => ({ ...prev, isListening: false, userSpeaking: false }));
  }, [stopNativeFallbackVAD]);

  const destroyVAD = useCallback((): void => {
    if (myvadRef.current) {
      myvadRef.current.destroy();
      myvadRef.current = null;
    }
    stopNativeFallbackVAD();
    setState({
      isListening: false,
      userSpeaking: false,
      isModelLoaded: false,
      error: null,
    });
  }, [stopNativeFallbackVAD]);

  // 🔒 Ciclo de vida controlado por `enabled` y el Mutex `isSystemSpeaking`
  useEffect(() => {
    isMountedRef.current = true;

    // Si Susy está hablando (isSystemSpeaking === true), pausar inmediatamente el VAD para cortar el Feedback Loop
    if (!enabled || isSystemSpeaking) {
      pauseVAD();
    } else {
      const resumeTimer = setTimeout(() => {
        if (isMountedRef.current && enabled && !isSystemSpeakingRef.current) {
          startVAD().catch(() => {});
        }
      }, ECHO_GUARD_COOLDOWN_MS);
      return () => clearTimeout(resumeTimer);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [enabled, isSystemSpeaking, startVAD, pauseVAD]);

  // Limpieza definitiva al desmontar el componente
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      destroyVAD();
    };
  }, [destroyVAD]);

  return {
    ...state,
    startVAD,
    pauseVAD,
    destroyVAD,
  };
}

export { useSusyVAD as useNoraVAD };
