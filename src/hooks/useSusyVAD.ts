"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface SusyVADOptions {
  onSpeechStart?: () => void;
  onSpeechEnd?: (audioBlob: Blob) => void;
  onVADMisfire?: () => void;
  positiveSpeechThreshold?: number; // Umbral de confianza de voz (default: 0.82)
  negativeSpeechThreshold?: number; // Umbral de silencio (default: 0.4)
  redemptionMs?: number;            // Milisegundos de tolerancia antes de cerrar la frase (default: 600)
  enabled?: boolean;
  isSystemSpeaking?: boolean;       // Estado informativo de si Susy está emitiendo voz
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
  stream?: MediaStream;
  additionalAudioConstraints?: MediaTrackConstraints;
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
 * Restricciones de Cancelación de Eco Acústico (AEC) obligatorias para True Barge-in
 */
const AEC_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

/**
 * KILL SWITCH DE HARDWARE (0ms + doble cancelación a los 50ms para Chrome/Android)
 */
function triggerImmediateHardwareBargeIn(): void {
  if (typeof window === "undefined") return;

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
      // Ignorar
    }
  }

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

/**
 * useSusyVAD: Hook de Voice Activity Detection con True Barge-in y Cancelación de Eco Acústico (AEC).
 *
 * - Permanece activo mientras Susy habla para permitir interrupción natural por voz (True Barge-in).
 * - Fuerza `audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }` en `getUserMedia`.
 * - Dispara el Kill Switch de doble cancelación (0ms y +50ms) en cuanto detecta la voz del usuario.
 */
export function useSusyVAD(options: SusyVADOptions = {}) {
  const {
    onSpeechStart,
    onSpeechEnd,
    onVADMisfire,
    positiveSpeechThreshold = 0.82,
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

  const onSpeechStartRef = useRef(onSpeechStart);
  const onSpeechEndRef = useRef(onSpeechEnd);
  const onVADMisfireRef = useRef(onVADMisfire);
  const isSystemSpeakingRef = useRef<boolean>(isSystemSpeaking);

  useEffect(() => {
    onSpeechStartRef.current = onSpeechStart;
    onSpeechEndRef.current = onSpeechEnd;
    onVADMisfireRef.current = onVADMisfire;
  }, [onSpeechStart, onSpeechEnd, onVADMisfire]);

  useEffect(() => {
    isSystemSpeakingRef.current = isSystemSpeaking;
  }, [isSystemSpeaking]);

  const myvadRef = useRef<MicVADInstance | null>(null);
  const isInitializingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

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

  // Detector VAD con Web Audio API + AEC (True Barge-in en PC y Móvil)
  const startNativeWebAudioVAD = useCallback(async (): Promise<void> => {
    stopNativeFallbackVAD();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
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
    // Filtro pasa-banda centrado en voz humana cercana (120Hz - 3200Hz) para rechazar graves/agudos de parlante
    const highpass = audioCtx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 120;

    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 3200;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.2;

    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(analyser);

    const timeData = new Float32Array(analyser.fftSize);
    let consecutiveVoiceFrames = 0;

    setState({
      isListening: true,
      userSpeaking: false,
      isModelLoaded: true,
      error: null,
    });

    const monitorLoop = (): void => {
      if (!isMountedRef.current || !nativeAudioCtxRef.current) return;

      analyser.getFloatTimeDomainData(timeData);
      let sumSquares = 0;
      for (let i = 0; i < timeData.length; i++) {
        sumSquares += timeData[i] * timeData[i];
      }
      const rms = Math.sqrt(sumSquares / timeData.length);
      const now = performance.now();

      // Si Susy está hablando, exigimos un umbral ligeramente mayor de voz cercana con AEC activo
      const activeThreshold = isSystemSpeakingRef.current ? 0.048 : 0.032;
      const silenceThreshold = 0.016;

      if (!isSpeakingNativeRef.current) {
        if (rms >= activeThreshold) {
          consecutiveVoiceFrames += 1;
          // 3 frames consecutivos (~48ms) confirman voz humana e ignoran clicks transitorios
          if (consecutiveVoiceFrames >= 3) {
            consecutiveVoiceFrames = 0;
            isSpeakingNativeRef.current = true;
            speechStartTsRef.current = now;
            silenceStartTsRef.current = null;

            // 🚨 TRUE BARGE-IN: Cortar reproducción de Susy inmediatamente
            triggerImmediateHardwareBargeIn();
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
                const duration = performance.now() - speechStartTsRef.current;
                const blob = new Blob(nativeChunksRef.current, { type: mimeType });
                if (duration >= 320 && blob.size > 1200) {
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
          consecutiveVoiceFrames = 0;
        }
      } else {
        if (rms < silenceThreshold) {
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
  }, [redemptionMs, stopNativeFallbackVAD]);

  const startVAD = useCallback(async (): Promise<void> => {
    if (typeof window === "undefined") return;

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
      // Adquirir stream con Cancelación de Eco Acústico (AEC) estricta antes de pasar a MicVAD
      const aecStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      nativeStreamRef.current = aecStream;

      const vadModuleName = "@ricky0123/vad-web";
      const vadModule = (await import(/* webpackIgnore: true */ vadModuleName)) as unknown as VadWebModule;

      const vad = await vadModule.MicVAD.new({
        stream: aecStream,
        additionalAudioConstraints: AEC_AUDIO_CONSTRAINTS,
        positiveSpeechThreshold,
        negativeSpeechThreshold,
        redemptionMs,
        onSpeechStart: () => {
          if (!isMountedRef.current) return;
          // 🚨 TRUE BARGE-IN: Kill Switch inmediato
          triggerImmediateHardwareBargeIn();
          setState((prev) => ({ ...prev, userSpeaking: true }));
          if (onSpeechStartRef.current) onSpeechStartRef.current();
        },
        onSpeechEnd: (audio: Float32Array) => {
          if (!isMountedRef.current) return;
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

  useEffect(() => {
    isMountedRef.current = true;
    if (enabled) {
      startVAD().catch(() => {});
    } else {
      pauseVAD();
    }

    return () => {
      isMountedRef.current = false;
      destroyVAD();
    };
  }, [enabled, startVAD, pauseVAD, destroyVAD]);

  return {
    ...state,
    startVAD,
    pauseVAD,
    destroyVAD,
  };
}

export { useSusyVAD as useNoraVAD };
