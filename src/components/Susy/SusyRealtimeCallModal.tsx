"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PhoneOff, Sparkles, Volume2, VolumeX, Mic, Hand, Radio, AlertTriangle, Play, Send } from "lucide-react";
import { useSusyOfflineGPS } from "@/hooks/useSusyOfflineGPS";
import { dispatchSOS } from "@/lib/susy/protocols/sosDispatcher";
import { useSusyLazarilloHaptics } from "@/hooks/useSusyLazarilloHaptics";
import { executeLocalInference } from "@/lib/susy/webgpu/localEngine";
import { normalizePhoneticTextForSpeech } from "@/lib/susy/phoneticNormalizer";
import { useSusyLive } from "@/hooks/useSusyLive";
import {
  applyLatinVoice,
  extractSpeakableChunks,
  isLikelyAssistantEcho,
  primeLatinVoices,
} from "@/utils/latinVoice";
import { analyzeVecino } from "@/lib/susy/pnl/susyPnlEngine";

interface SusyRealtimeCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoiceUri?: string;
  activeMode?: string;
  onMessageLogged?: (userText: string, assistantText: string) => void;
  initialHistory?: { role: string; content: string }[];
  isUsingFallback?: boolean;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export default function SusyRealtimeCallModal({
  isOpen,
  onClose,
  selectedVoiceUri,
  activeMode = "general",
  onMessageLogged,
  initialHistory = [],
  isUsingFallback = false
}: SusyRealtimeCallModalProps) {
  const { isOnline, coords } = useSusyOfflineGPS();
  const { emitSinglePulse, startDangerAlertLoop, clearHapticAlerts } = useSusyLazarilloHaptics();
  const susyLive = useSusyLive({
    wsUrl: "",
    wsTimeoutMs: 0,
    mode: activeMode,
  });
  const isTtsFallbackActive = isUsingFallback || susyLive.isUsingFallback;

  const [isEngineReady, setIsEngineReady] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [callState, setCallState] = useState<"connecting" | "listening" | "thinking" | "speaking">("connecting");
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [assistantText, setAssistantText] = useState<string>("");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isTriggeringSOS, setIsTriggeringSOS] = useState<boolean>(false);
  const [typedMessage, setTypedMessage] = useState<string>("");

  // Modos de interacción y accesibilidad (Flujo Continuo / Manos Libres por defecto)
  const [interactionMode, setInteractionMode] = useState<"hands_free" | "push_to_talk">("hands_free");
  const interactionModeRef = useRef<"hands_free" | "push_to_talk">(interactionMode);
  const [isPushTalking, setIsPushTalking] = useState<boolean>(false);
  const [accessibleAnnouncement, setAccessibleAnnouncement] = useState<string>("Llamada con Susy iniciada. Te escucha.");
  const [micError, setMicError] = useState<string | null>(null);

  // 🎧 Modo Coexistencia con Lector de Pantalla del Sistema (TalkBack / VoiceOver)
  const [useSystemScreenReader, setUseSystemScreenReader] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("susy_use_system_screen_reader") === "true";
      } catch {}
    }
    return false;
  });

  const toggleSystemScreenReader = useCallback(() => {
    setUseSystemScreenReader((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("susy_use_system_screen_reader", String(next));
        } catch {}
      }
      setAccessibleAnnouncement(
        next
          ? "Modo Lector del Sistema activado. Las respuestas serán leídas por TalkBack o VoiceOver."
          : "Modo Lector del Sistema desactivado. Susy hablará con su sintetizador de voz."
      );
      return next;
    });
  }, []);

  // Control de estado y memoria de conversación
  const isSusySpeakingRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const historyRef = useRef<{ role: string; content: string }[]>(initialHistory || []);

  useEffect(() => {
    if (initialHistory && initialHistory.length > 0) {
      historyRef.current = [...initialHistory];
    }
  }, [initialHistory]);
  const activeModeRef = useRef<string>(activeMode);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const liveTranscriptRef = useRef<string>("");
  const recognitionRef = useRef<any>(null);

  // Audio Pipeline Refs (Web Audio API Nativa)
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // VAD Calibrado Antirruido y Filtro de Interrupciones (VAD Watchdog 700ms)
  const isSpeakingRef = useRef<boolean>(false);
  const silenceStartRef = useRef<number | null>(null);
  const noiseFloorRef = useRef<number>(14);
  const speechStartTimeRef = useRef<number>(0);
  const voiceStartRef = useRef<number | null>(null);
  const cooldownTimerRef = useRef<any>(null);
  const interruptionSoundStartRef = useRef<number | null>(null);
  const lastInterruptedResponseRef = useRef<{ text: string; timestamp: number } | null>(null);
  const lastCompletedAssistantTextRef = useRef<string>("");
  const vadLockoutUntilRef = useRef<number>(0);

  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  useEffect(() => {
    interactionModeRef.current = interactionMode;
  }, [interactionMode]);

  // 🔔 Tono auditivo suave para personas no videntes
  const playAccessibleChime = useCallback((type: "start" | "end" | "connected") => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = audioContextRef.current || new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      const now = ctx.currentTime;

      if (type === "start") {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "end") {
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(390, now + 0.1);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "connected") {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    } catch {}
  }, []);

  // 2. Temporizador de llamada y Screen Wake Lock
  const callWakeLockRef = useRef<any>(null);

  const requestCallWakeLock = useCallback(async () => {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      try {
        if (!callWakeLockRef.current || callWakeLockRef.current.released) {
          callWakeLockRef.current = await (navigator as any).wakeLock.request("screen");
          console.log("[Susy Call] Screen Wake Lock activo durante la llamada");
        }
      } catch (err) {
        console.warn("[Susy Call] Wake Lock aviso:", err);
      }
    }
  }, []);

  const releaseCallWakeLock = useCallback(() => {
    if (callWakeLockRef.current) {
      try {
        callWakeLockRef.current.release();
      } catch (e) {}
      callWakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    let timer: any = null;
    if (isOpen) {
      requestCallWakeLock();
      const handleVis = async () => {
        if (document.visibilityState === "visible" && isOpen) {
          await requestCallWakeLock();
        }
      };
      document.addEventListener("visibilitychange", handleVis);

      if (isEngineReady) {
        setCallDuration(0);
        timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
      }

      return () => {
        document.removeEventListener("visibilitychange", handleVis);
        releaseCallWakeLock();
        if (timer) clearInterval(timer);
      };
    } else {
      releaseCallWakeLock();
    }
  }, [isOpen, isEngineReady, requestCallWakeLock, releaseCallWakeLock]);

  const speechHeartbeatRef = useRef<any>(null);
  const speechKeepAliveRef = useRef<any>(null);
  const sentenceWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const fallbackSentenceQueueRef = useRef<string[]>([]);
  const fallbackTextBufferRef = useRef<string>("");
  const isFallbackSpeakingRef = useRef<boolean>(false);
  const fallbackEpochRef = useRef<number>(0);
  const llmAbortRef = useRef<AbortController | null>(null);
  const activeVoiceParamsRef = useRef<{ rate: number; pitch: number }>({ rate: 1.03, pitch: 1.01 });

  useEffect(() => {
    // Eliminado el intento de WebSocket a ws://localhost:3010 que disparaba el cartel falso "TTS Local Desconectado"
  }, [isOpen]);

  const clearSpeechHeartbeat = useCallback(() => {
    if (speechHeartbeatRef.current) {
      clearTimeout(speechHeartbeatRef.current);
      speechHeartbeatRef.current = null;
    }
    if (speechKeepAliveRef.current) {
      clearInterval(speechKeepAliveRef.current);
      speechKeepAliveRef.current = null;
    }
    if (sentenceWatchdogRef.current) {
      clearTimeout(sentenceWatchdogRef.current);
      sentenceWatchdogRef.current = null;
    }
  }, []);

  // Reanudar escucha limpia tras delay de seguridad
  const resumeListening = useCallback(() => {
    clearSpeechHeartbeat();
    activeUtterancesRef.current = [];
    isSusySpeakingRef.current = false;
    isSpeakingRef.current = false;
    isProcessingRef.current = false;
    silenceStartRef.current = null;
    setCallState("listening");
    setAccessibleAnnouncement("Susy te escucha.");

    // Reactivar AudioContext si fue suspendido por el navegador en móvil
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {});
    }

    // Reactivar micrófono de forma limpia
    if (micGainNodeRef.current && audioContextRef.current) {
      try {
        micGainNodeRef.current.gain.setValueAtTime(1.0, audioContextRef.current.currentTime);
      } catch {}
    }
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });
    }

    // 🎙️ Reactivar SpeechRecognition nativo de forma inmediata
    if (typeof window !== "undefined") {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch {}
          try { recognitionRef.current.start(); } catch {}
        }
      } catch {}
    }
  }, [clearSpeechHeartbeat]);

  const resetSpeechHeartbeat = useCallback((durationMs?: number) => {
    clearSpeechHeartbeat();
    const timeout = durationMs || 35000;
    speechHeartbeatRef.current = setTimeout(() => {
      // Solo recuperar si realmente se excedió el tiempo total estimado de la locución
      if (isSusySpeakingRef.current) {
        console.warn("[Susy Voice Heartbeat] Fin de tiempo de seguridad de locución. Liberando canal...");
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try { window.speechSynthesis.cancel(); } catch {}
        }
        activeUtterancesRef.current = [];
        isSusySpeakingRef.current = false;
        resumeListening();
        setAccessibleAnnouncement("Canal de audio restablecido. Susy te escucha.");
      }
    }, timeout);
  }, [clearSpeechHeartbeat, resumeListening]);

  // 3. Kill Switch / Barge-in: Detener audio de Susy y limpiar cola Fallback con parche Anti-Crash (Fase 7.6)
  const stopSusySpeech = useCallback((allowNativeCancel = true) => {
    fallbackEpochRef.current += 1;
    clearSpeechHeartbeat();

    // Desvincular eventos de utterances activos para evitar avance en bucle de la cola de oraciones
    activeUtterancesRef.current.forEach((u) => {
      u.onstart = null;
      u.onend = null;
      u.onerror = null;
    });

    // 🛡️ FASE 7.6: Parche de resiliencia estándar de Web Speech API:
    // Verificar si está hablando o pausado, ejecutar `resume()` justo antes de `cancel()` para destrabar Safari/Chrome
    if (allowNativeCancel && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          window.speechSynthesis.cancel();
        }
      } catch {}
    }

    fallbackSentenceQueueRef.current = [];
    fallbackTextBufferRef.current = "";
    activeUtterancesRef.current = [];
    isFallbackSpeakingRef.current = false;
    isSusySpeakingRef.current = false;

    susyLive.interruptLivePlayback();

    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
        currentAudioSourceRef.current.disconnect();
      } catch {}
      currentAudioSourceRef.current = null;
    }
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    llmAbortRef.current?.abort();
    llmAbortRef.current = null;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearHapticAlerts();
  }, [clearHapticAlerts, clearSpeechHeartbeat, susyLive.interruptLivePlayback]);

  // Cierre limpio de llamada y liberación total de hardware
  const handleCleanExit = useCallback(() => {
    stopSusySpeech();
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => {
        t.stop();
        t.enabled = false;
      });
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsEngineReady(false);
    onClose();
  }, [onClose, stopSusySpeech]);

  // 5. Reproducción de Audio Completa y Fonéticamente Humana (Con Sentence Buffering y Prevención GC)
  const playRealSusyAudio = useCallback(
    async (_audioBase64: string | null, fullText: string, customPhoneticText?: string) => {
      if (isMuted || !fullText || !fullText.trim()) {
        resumeListening();
        return;
      }

      // No invocar .cancel() antes de hablar para no crashear el motor TTS de Chrome móvil (Fase 7.6)
      stopSusySpeech(false);
      isSusySpeakingRef.current = true;
      liveTranscriptRef.current = "";

      // Pausar reconocimiento nativo mientras Susy habla para que no se auto-escuche ni bloquee el sintetizador SO
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      setCallState("speaking");
      setAssistantText(fullText);
      lastCompletedAssistantTextRef.current = fullText;

      const spokenText = normalizePhoneticTextForSpeech(fullText || customPhoneticText || "");

      // 🎧 MODO COEXISTENCIA DE AUDIO: Si usa TalkBack o VoiceOver, no reproducir SpeechSynthesis de la app
      if (useSystemScreenReader) {
        isSusySpeakingRef.current = false;
        setAccessibleAnnouncement(`Susy responde: ${spokenText}`);
        setTimeout(() => {
          resumeListening();
        }, Math.min(8000, Math.max(2000, spokenText.length * 40)));
        return;
      }

      setAccessibleAnnouncement("Susy está respondiendo.");

      // Reproducción continua de oraciones completas con Keep-Alive anti-freeze para Chrome móvil
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          // Dividir exclusivamente por puntuación de oraciones reales (. ? ! \n), nunca en comas
          // para evitar que en Android Chrome se congele o quede muda tras 4 palabras
          const cleanSentences = spokenText
            .replace(/([.!?]+|\n+)/g, "$1\n")
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

          fallbackSentenceQueueRef.current =
            cleanSentences.length > 0 ? [...cleanSentences] : [spokenText];
          isFallbackSpeakingRef.current = true;
          // 🛡️ LOCKOUT VAD DE 2200ms: Protege a Susy de auto-interrumpirse con su propio parlante en el celular
          vadLockoutUntilRef.current = Date.now() + 2200;

          const estimatedDurationMs = Math.max(18000, Math.round((spokenText.length / 6) * 1000) + 8000);

          primeLatinVoices();

          resetSpeechHeartbeat(estimatedDurationMs);

          // 💓 KEEP-ALIVE PULSE PARA ANDROID / CHROME:
          // En móviles Chrome pone en pausa el sintetizador cada 2-3 segundos si no se pulsa .resume().
          if (speechKeepAliveRef.current) {
            clearInterval(speechKeepAliveRef.current);
          }
          speechKeepAliveRef.current = setInterval(() => {
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
              if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
              }
            }
          }, 2000);

          const currentEpoch = fallbackEpochRef.current;

          const playSentenceQueue = () => {
            if (
              fallbackEpochRef.current !== currentEpoch ||
              !isSusySpeakingRef.current ||
              !isFallbackSpeakingRef.current
            ) {
              return;
            }

            if (sentenceWatchdogRef.current) {
              clearTimeout(sentenceWatchdogRef.current);
              sentenceWatchdogRef.current = null;
            }

            const sentence = fallbackSentenceQueueRef.current.shift();
            if (!sentence) {
              clearSpeechHeartbeat();
              activeUtterancesRef.current = [];
              isFallbackSpeakingRef.current = false;
              isSusySpeakingRef.current = false;
              vadLockoutUntilRef.current = Date.now() + 500;
              if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
              cooldownTimerRef.current = setTimeout(() => {
                resumeListening();
              }, 350);
              return;
            }

            const utterance = new SpeechSynthesisUtterance(sentence);
            // 🛡️ Prevención de Garbage Collection en Chrome: guardar en array useRef<SpeechSynthesisUtterance[]>
            activeUtterancesRef.current.push(utterance);

            utterance.rate = activeVoiceParamsRef.current.rate;
            utterance.pitch = activeVoiceParamsRef.current.pitch;

            // 🌎 FASE 7.7: Forzar voz latina (es-AR / es-MX / es-US / es-419), nunca es-ES
            applyLatinVoice(utterance);

            let advanced = false;
            const advanceToNextSentence = () => {
              if (advanced) return;
              advanced = true;
              if (sentenceWatchdogRef.current) {
                clearTimeout(sentenceWatchdogRef.current);
                sentenceWatchdogRef.current = null;
              }
              activeUtterancesRef.current = activeUtterancesRef.current.filter(
                (u) => u !== utterance
              );
              if (
                fallbackEpochRef.current !== currentEpoch ||
                !isSusySpeakingRef.current ||
                !isFallbackSpeakingRef.current
              ) {
                return;
              }
              playSentenceQueue();
            };

            const maxSentenceMs = Math.min(14000, Math.max(3500, sentence.length * 90));
            sentenceWatchdogRef.current = setTimeout(() => {
              advanceToNextSentence();
            }, maxSentenceMs);

            utterance.onend = () => {
              advanceToNextSentence();
            };

            utterance.onerror = (err) => {
              console.warn("[SpeechSynthesis Chunk Error]:", err);
              advanceToNextSentence();
            };

            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
            window.speechSynthesis.speak(utterance);
          };

          playSentenceQueue();
          return;
        } catch (e) {
          console.warn("[SpeechSynthesis Error]:", e);
          clearSpeechHeartbeat();
          resumeListening();
        }
      } else {
        resumeListening();
      }
    },
    [clearSpeechHeartbeat, isMuted, resetSpeechHeartbeat, resumeListening, stopSusySpeech, useSystemScreenReader]
  );

  // 6. Protocolo SOS Lazarillo Híbrido
  const handleExecuteSOS = useCallback(
    async (customNote?: string) => {
      setIsTriggeringSOS(true);
      startDangerAlertLoop();
      setAccessibleAnnouncement("Activando protocolo de auxilio y geolocalización SOS...");
      try {
        const result = await dispatchSOS({
          lat: coords?.lat,
          lng: coords?.lng,
          isOnline,
          customNote
        });

        if (result.method === "SMS" && result.smsUri) {
          setTimeout(() => {
            window.location.href = result.smsUri!;
          }, 1500);
        }
      } catch (err: any) {
        console.warn("[SOS Trigger Warning]:", err);
        window.location.href = "tel:911";
      } finally {
        setIsTriggeringSOS(false);
      }
    },
    [coords, isOnline, startDangerAlertLoop]
  );

  // 7. Enviar audio con Telemetría
  const sendVoiceAudioTurn = useCallback(
    async (audioBlob: Blob, mimeType: string) => {
      if (isProcessingRef.current) return;

      const clientText = liveTranscriptRef.current.trim();
      liveTranscriptRef.current = ""; // Limpieza atómica inmediata

      const cleanClientAlpha = clientText.replace(/[^\p{L}\p{N}\s]/gu, "").trim();
      if (audioBlob.size < 1200 && cleanClientAlpha.length < 3) {
        setCallState("listening");
        return;
      }

      stopSusySpeech(false);
      isProcessingRef.current = true;
      setCallState("thinking");
      setAccessibleAnnouncement("Susy está procesando tu consulta...");
      playAccessibleChime("end");
      setUserTranscript(cleanClientAlpha.length >= 3 ? `"${clientText}"` : "Escuchando tu consulta...");

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = ((reader.result as string) || "").split(",")[1];
        if (!base64 && cleanClientAlpha.length < 3) {
          isProcessingRef.current = false;
          resumeListening();
          return;
        }

        try {
          const controller = new AbortController();
          abortControllerRef.current = controller;
          llmAbortRef.current = controller;

          let text = "";
          let phoneticText = "";
          let resAudio: string | null = null;
          let transcribedUserText = cleanClientAlpha.length >= 3 ? clientText : "";

          try {
            const interruptedContext = lastInterruptedResponseRef.current;
            // 🧠 FASE 7.7: El contexto interrumpido se consume una sola vez; no debe arrastrarse a turnos nuevos
            lastInterruptedResponseRef.current = null;
            const proxyAbort = new AbortController();
            const proxyTimeout = setTimeout(() => proxyAbort.abort(), 7500);

            const onParentAbort = () => proxyAbort.abort();
            controller.signal.addEventListener("abort", onParentAbort, { once: true });

            try {
              const res = await fetch("/api/realtime-proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  message: transcribedUserText,
                  audioBase64: base64,
                  mimeType,
                  history: historyRef.current.slice(-16),
                  messages: historyRef.current.slice(-16),
                  mode: activeModeRef.current,
                  lastInterruptedResponse: interruptedContext,
                }),
                signal: proxyAbort.signal,
              });

              if (res.ok) {
                const data = await res.json();
                const candidateTranscript = (data.transcribedUserText || transcribedUserText || "").trim();
                const cleanCandidate = candidateTranscript.replace(/[^\p{L}\p{N}\s]/gu, "").trim();

                // 🛡️ Bloqueador de transcripciones vacías o menores a 3 caracteres tras Barge-in
                if (cleanCandidate.length < 3 || candidateTranscript === "[Sonido detectado]") {
                  isProcessingRef.current = false;
                  resumeListening();
                  return;
                }

                // 🛡️ FASE 7.7: Descartar eco de la propia voz de Susy capturado durante el Barge-in
                if (isLikelyAssistantEcho(candidateTranscript, lastCompletedAssistantTextRef.current)) {
                  isProcessingRef.current = false;
                  resumeListening();
                  return;
                }

                text = data.text || "";
                phoneticText = data.phoneticText || "";
                resAudio = data.audioBase64 || null;
                transcribedUserText = candidateTranscript;
                if (data.voiceParams && typeof data.voiceParams.rate === "number") {
                  activeVoiceParamsRef.current = data.voiceParams;
                } else {
                  activeVoiceParamsRef.current = analyzeVecino(candidateTranscript).voice;
                }
              } else {
                throw new Error("HTTP_FAILED");
              }
            } finally {
              clearTimeout(proxyTimeout);
              controller.signal.removeEventListener("abort", onParentAbort);
            }
          } catch (fetchErr: any) {
            if (controller.signal.aborted) {
              throw new DOMException("Aborted", "AbortError");
            }

            const fallbackQuery = (transcribedUserText || clientText || "").trim();
            const cleanFallback = fallbackQuery.replace(/[^\p{L}\p{N}\s]/gu, "").trim();

            // Si la interrupción fue ruido o tiene menos de 3 caracteres, ignorar y volver a escuchar sin saludar de nuevo
            if (cleanFallback.length < 3) {
              isProcessingRef.current = false;
              resumeListening();
              return;
            }

            activeVoiceParamsRef.current = analyzeVecino(fallbackQuery).voice;

            if (typeof navigator === "undefined" || navigator.onLine) {
              try {
                const chatTimeoutCtrl = new AbortController();
                const chatTimer = setTimeout(() => chatTimeoutCtrl.abort(), 6500);
                const priorHistory = historyRef.current.slice(-16);
                const chatRes = await fetch("/api/chat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    message: fallbackQuery,
                    userText: fallbackQuery,
                    history: priorHistory,
                    messages: [...priorHistory, { role: "user", content: fallbackQuery }],
                    mode: activeModeRef.current,
                    interactionMode: "voice",
                  }),
                  signal: chatTimeoutCtrl.signal,
                });
                clearTimeout(chatTimer);

                if (chatRes.ok) {
                  const rawBody = await chatRes.text();
                  text = rawBody
                    .split("\n")
                    .map((line) => {
                      const trimmed = line.trim();
                      if (trimmed.startsWith("data:")) {
                        const payload = trimmed.slice(5).trim();
                        if (payload === "[DONE]") return "";
                        try {
                          const parsed = JSON.parse(payload);
                          return parsed.text || parsed.content || "";
                        } catch {
                          return payload;
                        }
                      }
                      return line;
                    })
                    .join("")
                    .trim();
                  transcribedUserText = fallbackQuery;
                }
              } catch (chatErr) {
                console.warn("[Voice Modal] Fallback /api/chat warning:", chatErr);
              }
            }

            if (!text) {
              const localRes = await Promise.race([
                executeLocalInference(
                  fallbackQuery,
                  historyRef.current,
                  activeModeRef.current
                ),
                new Promise<{ text: string }>((resolve) =>
                  setTimeout(
                    () =>
                      resolve({
                        text: "Te escucho vecino. Decime qué detalle necesitás sobre ese trámite o consulta municipal.",
                      }),
                    2800
                  )
                ),
              ]);
              text = localRes.text;
              transcribedUserText = fallbackQuery;
            }
          }

          if (transcribedUserText && !transcribedUserText.includes("Escuchando") && !transcribedUserText.includes("[Sonido")) {
            setUserTranscript(`"${transcribedUserText}"`);
            historyRef.current.push({ role: "user", content: transcribedUserText });

            if (/\b(emergencia|auxilio|socorro|me caí|me perdi|me perdí|ayuda urgente)\b/i.test(transcribedUserText)) {
              handleExecuteSOS(transcribedUserText);
              return;
            }
          }

          if (text) {
            historyRef.current.push({ role: "assistant", content: text });
            if (historyRef.current.length > 20) {
              historyRef.current = historyRef.current.slice(-20);
            }
            if (onMessageLogged) {
              onMessageLogged(transcribedUserText || "🎙️ [Voz]", text);
            }
            playRealSusyAudio(resAudio, text, phoneticText);
          } else {
            resumeListening();
          }
        } catch (err: any) {
          if (err.name !== "AbortError") {
            console.error("[Realtime Voice Error]:", err);
          }
          resumeListening();
        } finally {
          isProcessingRef.current = false;
        }
      };

      reader.readAsDataURL(audioBlob);
    },
    [handleExecuteSOS, onMessageLogged, playAccessibleChime, playRealSusyAudio, resumeListening, stopSusySpeech]
  );

  // 8. Inicialización Asíncrona Controlada por User Gesture (Tap Físico)
  const startUnifiedAudioEngine = useCallback(async () => {
    if (isEngineReady) return;
    setIsInitializing(true);
    setMicError(null);

    // 🔓 FASE 7.6: Audio Primer (Desbloqueo Silencioso síncrono sin llamar a .cancel() que crashea Chrome móvil)
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const primer = new SpeechSynthesisUtterance("");
        primer.volume = 0;
        activeUtterancesRef.current.push(primer);
        primer.onend = () => {
          activeUtterancesRef.current = activeUtterancesRef.current.filter((u) => u !== primer);
        };
        window.speechSynthesis.speak(primer);
      } catch (e) {
        console.warn("[SpeechSynthesis Gesture Unlock Warning]:", e);
      }
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = audioContextRef.current || new AudioCtx({ latencyHint: "interactive" });
      audioContextRef.current = audioCtx;

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      // Stream de Micrófono con Fallback Progresivo Seguro
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (e1) {
        console.warn("[Mic Init with constraints failed, trying basic audio:true]:", e1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e2) {
          console.error("[Mic Access Denied / Not Available]:", e2);
          throw new Error("MIC_DENIED");
        }
      }

      if (!stream) throw new Error("MIC_DENIED");
      micStreamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);

      // 🎧 CADENA DSP DE AISLAMIENTO ACÚSTICO ANTIRRUIDO (Web Audio API)
      // 1. Filtro Pasa-Altos (High-Pass ~80Hz): Elimina viento, soplidos y retumbes de tráfico/colectivos
      const highPassFilter = audioCtx.createBiquadFilter();
      highPassFilter.type = "highpass";
      highPassFilter.frequency.setValueAtTime(80, audioCtx.currentTime);
      highPassFilter.Q.setValueAtTime(0.707, audioCtx.currentTime);

      // 2. Filtro Pasa-Bajos (Low-Pass ~3400Hz): Aísla la banda de voz humana contra chillidos y frecuencias parásitas
      const lowPassFilter = audioCtx.createBiquadFilter();
      lowPassFilter.type = "lowpass";
      lowPassFilter.frequency.setValueAtTime(3400, audioCtx.currentTime);
      lowPassFilter.Q.setValueAtTime(0.707, audioCtx.currentTime);

      // GainNode de Control Permanente
      const micGain = audioCtx.createGain();
      micGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
      micGainNodeRef.current = micGain;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.2;

      // Destino procesado para MediaRecorder (aislamiento acústico limpio para Whisper STT)
      const cleanAudioDest = audioCtx.createMediaStreamDestination();

      source.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lowPassFilter.connect(micGain);
      micGain.connect(analyser);
      micGain.connect(cleanAudioDest);
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      let recorder: MediaRecorder | null = null;

      const createAndStartRecorder = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          return;
        }
        audioChunksRef.current = [];
        speechStartTimeRef.current = Date.now();
        recorder = new MediaRecorder(cleanAudioDest.stream, { mimeType });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          const clientText = liveTranscriptRef.current.trim();
          if (blob.size > 80 || clientText) {
            sendVoiceAudioTurn(blob, mimeType);
          } else {
            setCallState("listening");
          }
        };

        recorder.start(350);
        mediaRecorderRef.current = recorder;
      };

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const SILENCE_TIMEOUT_MS = 550;
      const MAX_SPEECH_DURATION_MS = 12000;

      setIsEngineReady(true);
      setCallState("listening");
      setMicError(null);
      playAccessibleChime("connected");
      emitSinglePulse("CONFIRM_VOZ");
      setAccessibleAnnouncement("Conectado con Susy. Lista para escucharte.");

      // Saludo audible inmediato al conectar para confirmar canal de voz activo en celular y escritorio
      setTimeout(() => {
        if (micStreamRef.current && !isProcessingRef.current) {
          playRealSusyAudio(null, "Hola vecino, ya te escucho. Decime en qué te puedo ayudar hoy.");
        }
      }, 250);

      // Inicializar SpeechRecognition nativo en paralelo solo en escritorio (en Android/iOS compite por el hardware del micrófono con MediaRecorder)
      const isMobileDevice =
        typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      if (typeof window !== "undefined" && !isMobileDevice) {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          try {
            const rec = new SpeechRec();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = "es-AR";
            let speechRecCommitTimer: ReturnType<typeof setTimeout> | null = null;
            rec.onresult = (e: any) => {
              if (isProcessingRef.current || Date.now() < vadLockoutUntilRef.current) return;
              let cur = "";
              for (let i = e.resultIndex; i < e.results.length; ++i) {
                cur += e.results[i][0].transcript;
              }
              const cleanCur = cur.trim();
              if (!cleanCur) return;

              // 🛡️ SINCRONIZACIÓN DE ESTADOS VAD: Ignorar entradas automáticas mientras el Fallback lee la oración
              if (isSusySpeakingRef.current) {
                return;
              }

              liveTranscriptRef.current = cleanCur;
              setUserTranscript(`"${cleanCur}"`);

              // En PC: asegurar que tras 800ms de pausa luego de STT se envíe el turno inmediatamente
              if (speechRecCommitTimer) clearTimeout(speechRecCommitTimer);
              speechRecCommitTimer = setTimeout(() => {
                if (isProcessingRef.current || isSusySpeakingRef.current) return;
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                  isSpeakingRef.current = false;
                  silenceStartRef.current = null;
                  mediaRecorderRef.current.stop();
                } else if (liveTranscriptRef.current.trim().length >= 2) {
                  isSpeakingRef.current = false;
                  silenceStartRef.current = null;
                  sendVoiceAudioTurn(new Blob([], { type: mimeType }), mimeType);
                }
              }, 800);
            };

            rec.onerror = (err: any) => {
              console.warn("[SpeechRecognition Warning]:", err?.error);
              if (err?.error !== "aborted" && micStreamRef.current && !isSusySpeakingRef.current) {
                setTimeout(() => {
                  try { rec.start(); } catch {}
                }, 400);
              }
            };

            rec.onend = () => {
              if (micStreamRef.current && !isSusySpeakingRef.current && !isProcessingRef.current) {
                try { rec.start(); } catch {}
              }
            };

            try { rec.start(); } catch {}
            recognitionRef.current = rec;
          } catch {}
        }
      }

      const monitorAudioLoop = () => {
        if (!micStreamRef.current) return;

        analyser.getByteFrequencyData(dataArray);

        // Medir energía exclusivamente dentro de la banda vocal humana filtrada (80Hz - 3400Hz -> bins 1..24)
        const voiceBandEnd = Math.min(dataArray.length, 24);
        let sum = 0;
        for (let i = 1; i < voiceBandEnd; i++) {
          sum += dataArray[i];
        }
        const avg = sum / Math.max(1, voiceBandEnd - 1);
        setAudioLevel(Math.min(100, Math.round(avg * 1.4)));

        const now = Date.now();

        // 🛡️ Calibración continua del piso de ruido ambiental (Adaptive Noise Floor)
        if (!isSpeakingRef.current && !isSusySpeakingRef.current && !isProcessingRef.current && now >= vadLockoutUntilRef.current) {
          noiseFloorRef.current = Math.min(32, Math.max(6, noiseFloorRef.current * 0.95 + avg * 0.05));
        }

        // 🛡️ LOCKOUT INICIAL DE 380ms POST-INICIO DE TTS
        if (now < vadLockoutUntilRef.current) {
          interruptionSoundStartRef.current = null;
          voiceStartRef.current = null;
          animFrameRef.current = requestAnimationFrame(monitorAudioLoop);
          return;
        }

        // 🛡️ BARGE-IN EN MODO FALLBACK:
        // Si Susy está hablando y el usuario interrumpe con voz humana sostenida por encima del umbral de Barge-in,
        // ejecutar el Kill Switch inmediato (`window.speechSynthesis.cancel()`, vaciar colas y abortar LLM) y grabar la nueva consulta.
        if (isSusySpeakingRef.current) {
          if (interactionModeRef.current === "hands_free") {
            // El umbral debe ser claramente superior al audio emitido por el parlante del celular
            const bargeInThreshold = Math.max(38, noiseFloorRef.current + 22);
            if (avg > bargeInThreshold) {
              if (interruptionSoundStartRef.current === null) {
                interruptionSoundStartRef.current = now;
              } else if (now - interruptionSoundStartRef.current >= 450) {
                interruptionSoundStartRef.current = null;
                lastInterruptedResponseRef.current = {
                  text: lastCompletedAssistantTextRef.current,
                  timestamp: now,
                };
                stopSusySpeech();
                susyLive.onSpeechStart();
                isSpeakingRef.current = true;
                voiceStartRef.current = null;
                silenceStartRef.current = null;
                speechStartTimeRef.current = now;
                createAndStartRecorder();
                setCallState("listening");
              }
            } else {
              interruptionSoundStartRef.current = null;
            }
          }
          animFrameRef.current = requestAnimationFrame(monitorAudioLoop);
          return;
        }

        if (isProcessingRef.current) {
          animFrameRef.current = requestAnimationFrame(monitorAudioLoop);
          return;
        }

        if (interactionModeRef.current === "push_to_talk") {
          animFrameRef.current = requestAnimationFrame(monitorAudioLoop);
          return;
        }

        // Umbral dinámico adaptativo calibrado según el entorno real con DSP activo
        const dynamicThreshold = Math.max(12, noiseFloorRef.current + 6);

        if (avg > dynamicThreshold) {
          silenceStartRef.current = null;
          if (!isSpeakingRef.current) {
            if (voiceStartRef.current === null) {
              voiceStartRef.current = now;
            } else if (now - voiceStartRef.current >= 200) {
              // 🛡️ Detección de habla humana sostenida (>200ms) para descartar ruidos y clics breves
              isSpeakingRef.current = true;
              voiceStartRef.current = null;
              speechStartTimeRef.current = now;
              createAndStartRecorder();
              setCallState("listening");
            }
          }
        } else {
          voiceStartRef.current = null;
          if (isSpeakingRef.current) {
            if (silenceStartRef.current === null) {
              silenceStartRef.current = now;
            } else if (now - silenceStartRef.current > SILENCE_TIMEOUT_MS) {
              isSpeakingRef.current = false;
              silenceStartRef.current = null;
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
              }
            }
          }
        }

        if (isSpeakingRef.current && now - speechStartTimeRef.current > MAX_SPEECH_DURATION_MS) {
          isSpeakingRef.current = false;
          silenceStartRef.current = null;
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        }

        animFrameRef.current = requestAnimationFrame(monitorAudioLoop);
      };

      monitorAudioLoop();
    } catch (err: any) {
      console.warn("[Audio Engine Init Error]:", err);
      const msg = err?.name === "NotAllowedError" || err?.message === "MIC_DENIED"
        ? "Por favor permite el acceso al micrófono en tu navegador y vuelve a presionar el botón."
        : "No se pudo conectar el micrófono. Por favor verifica los permisos.";
      setMicError(msg);
      setIsEngineReady(false);
    } finally {
      setIsInitializing(false);
    }
  }, [emitSinglePulse, interactionMode, isEngineReady, playAccessibleChime, sendVoiceAudioTurn]);

  // Auto-conexión suave al abrir el modal (aprovecha el gesto de clic del usuario)
  useEffect(() => {
    if (isOpen && !isEngineReady && !isInitializing) {
      startUnifiedAudioEngine().catch(() => {});
    }
  }, [isOpen, isEngineReady, isInitializing, startUnifiedAudioEngine]);

  // Cleanup de seguridad al desmontar
  useEffect(() => {
    return () => {
      stopSusySpeech();
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => {
          t.stop();
          t.enabled = false;
        });
        micStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [stopSusySpeech]);

  // 9. Controles Push-to-Talk con Desbloqueo Explícito
  const handlePushTalkStart = async () => {
    if (!isEngineReady) {
      await startUnifiedAudioEngine();
      return;
    }

    if (callState === "speaking") stopSusySpeech();
    setIsPushTalking(true);
    emitSinglePulse("CONFIRM_VOZ");

    if (micStreamRef.current) {
      if (micGainNodeRef.current && audioContextRef.current) {
        micGainNodeRef.current.gain.setValueAtTime(1.0, audioContextRef.current.currentTime);
      }
      micStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      audioChunksRef.current = [];
      const recorder = new MediaRecorder(micStreamRef.current, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size > 1000) {
          sendVoiceAudioTurn(blob, mimeType);
        } else {
          setCallState("listening");
        }
      };

      recorder.start(80);
      mediaRecorderRef.current = recorder;
    }
  };

  const handlePushTalkEnd = () => {
    setIsPushTalking(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  // 💬 Envío de texto dentro del Modo Voz sin perder el audio
  const handleSendTypedMessage = async () => {
    if (!typedMessage.trim() || callState === "thinking") return;
    const textToSend = typedMessage.trim();
    setTypedMessage("");

    if (callState === "speaking") stopSusySpeech();
    setCallState("thinking");
    setUserTranscript(textToSend);
    setAccessibleAnnouncement(`Enviando: ${textToSend}`);

    if (onMessageLogged) {
      onMessageLogged(textToSend, "");
    }

    try {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 6500);
      const res = await fetch("/api/realtime-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyRef.current.slice(-6),
          mode: activeModeRef.current,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          if (data.voiceParams && typeof data.voiceParams.rate === "number") {
            activeVoiceParamsRef.current = data.voiceParams;
          } else {
            activeVoiceParamsRef.current = analyzeVecino(textToSend).voice;
          }
          setAssistantText(data.text);
          historyRef.current.push({ role: "user", content: textToSend });
          historyRef.current.push({ role: "assistant", content: data.text });
          if (onMessageLogged) onMessageLogged(textToSend, data.text);
          await playRealSusyAudio(data.audioBase64 || null, data.text, data.phoneticText);
        } else {
          resumeListening();
        }
      } else {
        resumeListening();
      }
    } catch (e) {
      console.warn("[Typed Voice Turn Error]:", e);
      resumeListening();
    }
  };

  // 🔄 Recuperación de AudioContext al volver a la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && audioContextRef.current) {
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume().catch(() => {});
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // ⌨️ Accesibilidad por Teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && (e.target as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault();
        if (interactionMode === "push_to_talk" && !isPushTalking) {
          handlePushTalkStart();
        } else if (callState === "speaking") {
          stopSusySpeech();
        }
      } else if (e.code === "Escape") {
        handleCleanExit();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && interactionMode === "push_to_talk" && isPushTalking && (e.target as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault();
        handlePushTalkEnd();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isOpen, callState, interactionMode, isPushTalking, handleCleanExit, stopSusySpeech]);

  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Llamada de voz en vivo con Susy"
      className="fixed inset-0 z-50 w-full h-dvh max-h-dvh flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-2xl animate-fade-in select-none overflow-hidden"
      style={{
        paddingBottom: "max(10px, env(safe-area-inset-bottom))",
        paddingTop: "max(10px, env(safe-area-inset-top))",
      }}
    >
      {/* Región Dinámica Asertiva para TalkBack (Android) y VoiceOver (iOS) */}
      <div 
        id="susy-call-a11y-live-region"
        role="status" 
        aria-live="assertive" 
        aria-atomic="true" 
        className="sr-only"
      >
        {accessibleAnnouncement}
      </div>

      <div className="relative w-full max-w-md max-h-[calc(100dvh-20px)] sm:max-h-[92dvh] overflow-y-auto bg-gradient-to-b from-slate-900 via-[#070b14] to-slate-950 border border-cyan-500/30 rounded-3xl shadow-2xl p-4 sm:p-6 flex flex-col items-center justify-between gap-2">
        
        {/* Cabecera del Modal */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                Susybot Voz en Vivo
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">HD</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {isOnline ? "En Línea (Soberano)" : "Modo Offline"} • {formatDuration(callDuration)}
              </p>
            </div>
          </div>

          <button
            onClick={handleCleanExit}
            role="button"
            aria-label="Finalizar y cerrar llamada con Susy"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Pantalla Previa de Conexión Segura si no se ha hecho tap */}
        {!isEngineReady ? (
          <div className="my-auto flex flex-col items-center justify-center w-full py-6 text-center space-y-4">
            <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 shadow-xl shadow-emerald-500/30">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-900">
                <img
                  src="/icons/susy-avatar-portrait.png"
                  alt="Susy — Directora de Atención al Vecino y Prensa de Ituzaingó"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h4 className="text-white font-bold text-base">Susy • Atención al Vecino y Prensa</h4>
              <p className="text-[11px] text-emerald-400 font-semibold">
                Municipalidad de Ituzaingó, Corrientes
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tocá el botón para conversar en manos libres con Susy sobre trámites, permisos QR, agenda del Intendente o reclamos barriales.
              </p>
              {micError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs text-center animate-fadeIn">
                  ⚠️ {micError}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  try {
                    const primer = new SpeechSynthesisUtterance("");
                    primer.volume = 0;
                    window.speechSynthesis.speak(primer);
                  } catch {}
                }
                startUnifiedAudioEngine();
              }}
              role="button"
              aria-label="Iniciar llamada de voz con Susy"
              disabled={isInitializing}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 hover:opacity-90 active:scale-95 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play size={18} className="fill-slate-950" />
              <span>{isInitializing ? "Conectando micrófono..." : "Iniciar Llamada en Vivo"}</span>
            </button>
          </div>
        ) : (
          <>
            {/* INDICADOR DE ESTADO EN VIVO ULTRA CLARO (ESTILO LLAMADA TELEFÓNICA PURA) */}
            <div className="w-full flex items-center justify-center mt-1">
              <div
                role="status"
                aria-live="polite"
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-2 border shadow-md transition-all ${
                  callState === "speaking"
                    ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-200"
                    : callState === "thinking"
                    ? "bg-purple-500/25 border-purple-400/50 text-purple-200 animate-pulse"
                    : isSpeakingRef.current || audioLevel > 16
                    ? "bg-emerald-500/25 border-emerald-400/60 text-emerald-200"
                    : "bg-slate-900/90 border-emerald-500/30 text-emerald-300"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    callState === "speaking"
                      ? "bg-cyan-400 animate-ping"
                      : callState === "thinking"
                      ? "bg-purple-400 animate-ping"
                      : "bg-emerald-400 animate-pulse"
                  }`}
                />
                <span>
                  {callState === "speaking"
                    ? "🗣️ SUSY ESTÁ RESPONDIENDO (Hablá o tocá su foto para interrumpirla)"
                    : callState === "thinking"
                    ? "⚡ PROCESANDO TU CONSULTA EN VIVO..."
                    : isSpeakingRef.current || audioLevel > 16
                    ? "🎙️ ESCUCHANDO TU VOZ EN VIVO..."
                    : "🟢 MICRÓFONO ABIERTO — HABLÁ CON NORMALIDAD"}
                </span>
              </div>
            </div>

            {/* Orb Central Reactivo Accesible */}
            <div className="flex-1 w-full flex flex-col items-center justify-center py-3">
              <div className="relative flex items-center justify-center">
                <button
                  type="button"
                  role="button"
                  aria-label={`Estado de Susy: ${
                    callState === "speaking"
                      ? "Respondiendo a tu consulta. Toca para interrumpir."
                      : callState === "thinking"
                      ? "Procesando respuesta"
                      : isSpeakingRef.current
                      ? "Escuchando tu voz. Toca para enviar consulta."
                      : "En espera. Habla cuando desees."
                  }`}
                  aria-pressed={callState === "speaking" || isSpeakingRef.current}
                  onClick={() => {
                    if (callState === "speaking") {
                      if (lastCompletedAssistantTextRef.current) {
                        lastInterruptedResponseRef.current = {
                          text: lastCompletedAssistantTextRef.current,
                          timestamp: Date.now()
                        };
                      }
                      stopSusySpeech();
                      resumeListening();
                      playAccessibleChime("start");
                    } else if (callState === "thinking") {
                      if (abortControllerRef.current) {
                        abortControllerRef.current.abort();
                        abortControllerRef.current = null;
                      }
                      isProcessingRef.current = false;
                      resumeListening();
                      playAccessibleChime("start");
                    } else if (isSpeakingRef.current || (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording")) {
                      isSpeakingRef.current = false;
                      silenceStartRef.current = null;
                      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                        mediaRecorderRef.current.stop();
                      }
                    } else {
                      isSpeakingRef.current = false;
                      silenceStartRef.current = null;
                      resumeListening();
                      playAccessibleChime("start");
                    }
                  }}
                  className={`w-32 h-32 sm:w-38 sm:h-38 rounded-full transition-all duration-100 flex items-center justify-center cursor-pointer ${
                    callState === "speaking"
                      ? "bg-gradient-to-tr from-cyan-400 via-emerald-400 to-teal-300 shadow-2xl shadow-cyan-500/50 scale-105 ring-4 ring-cyan-400/40"
                      : callState === "thinking"
                      ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 animate-pulse shadow-2xl shadow-purple-500/50 ring-4 ring-purple-400/40"
                      : isSpeakingRef.current || audioLevel > 16
                      ? "bg-gradient-to-tr from-emerald-400 to-cyan-500 shadow-2xl shadow-emerald-500/50 scale-105 ring-4 ring-emerald-400/50"
                      : "bg-gradient-to-tr from-emerald-600/70 via-slate-800 to-teal-600/70 ring-2 ring-emerald-500/40"
                  }`}
                  style={{
                    transform: `scale(${1 + (audioLevel / 100) * 0.22})`
                  }}
                >
                  <div className="absolute inset-1.5 rounded-full bg-slate-950/90 overflow-hidden flex flex-col items-center justify-center text-center">
                    <img
                      src="/icons/susy-avatar-portrait.png"
                      alt="Susy — En llamada"
                      className="w-full h-full object-cover object-top opacity-95"
                    />
                  </div>
                </button>
              </div>

              {/* Barra Visual de Nivel de Voz (Vúmetro en Vivo) */}
              <div className="w-48 mt-3 flex flex-col items-center gap-1">
                <div className="w-full h-2 rounded-full bg-slate-800/90 overflow-hidden border border-slate-700/70">
                  <div
                    className={`h-full rounded-full transition-all duration-75 ${
                      callState === "speaking"
                        ? "bg-cyan-400"
                        : callState === "thinking"
                        ? "bg-purple-400 w-full animate-pulse"
                        : "bg-emerald-400"
                    }`}
                    style={{
                      width:
                        callState === "thinking"
                          ? "100%"
                          : `${Math.max(8, Math.min(100, audioLevel * 1.6))}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {callState === "speaking"
                    ? "Tocá la foto de Susy si querés interrumpirla"
                    : callState === "thinking"
                    ? "Conectando con el Centro de Mando de Ituzaingó..."
                    : userTranscript
                    ? "Pausa breve para que Susy te responda (o tocá su foto para enviar ya)"
                    : "Manos Libres Activo • No hace falta apretar ningún botón"}
                </span>
              </div>

              {/* Subtítulos en Vivo de lo que decís vos y lo que responde Susy */}
              <div className="w-full mt-3 px-2 min-h-[82px] flex flex-col items-center justify-center gap-2">
                {userTranscript && (
                  <div className="w-full max-w-sm px-3 py-2 rounded-xl bg-slate-900/95 border border-emerald-500/30 text-center">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 block">
                      🎙️ Lo que te escucho decir:
                    </span>
                    <p className="text-xs text-white font-medium italic">
                      {userTranscript}
                    </p>
                  </div>
                )}

                {callState === "thinking" ? (
                  <p className="text-xs text-purple-300 font-semibold animate-pulse" role="status">
                    ⚡ Susy está elaborando tu respuesta...
                  </p>
                ) : assistantText ? (
                  <div className="w-full max-w-sm bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-3 shadow-lg flex flex-col items-center gap-1.5 text-center">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400 block">
                      🗣️ Respuesta de Susy:
                    </span>
                    <p className="text-xs text-emerald-200 font-medium leading-relaxed">
                      "{assistantText}"
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Entrada de Texto Auxiliar Discreta */}
              <div className="w-full flex items-center gap-2 mt-1 px-1">
                <input
                  type="text"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && typedMessage.trim()) {
                      handleSendTypedMessage();
                    }
                  }}
                  aria-label="Escribe tu consulta por texto para la llamada"
                  placeholder="O escribí un dato puntual acá (ej. DNI o calle)..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-cyan-500 transition-colors"
                />
                <button
                  onClick={handleSendTypedMessage}
                  role="button"
                  aria-label="Enviar texto a Susy"
                  disabled={!typedMessage.trim() || callState === "thinking"}
                  className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 disabled:opacity-30 text-slate-950 font-bold transition-all cursor-pointer shrink-0 shadow-md shadow-cyan-500/20"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Barra Inferior */}
        <div className="w-full flex items-center justify-between pt-3 border-t border-slate-800/60 mt-auto">
          <button
            onClick={() => {
              if (isMuted) {
                setIsMuted(false);
              } else {
                stopSusySpeech();
                setIsMuted(true);
              }
            }}
            role="button"
            aria-pressed={isMuted}
            aria-label={isMuted ? "Reanudar micrófono y voz de Susy" : "Silenciar micrófono y voz de Susy"}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            }`}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Botón SOS Lazarillo Inmediato */}
          <button
            onClick={() => handleExecuteSOS("Solicitud manual de auxilio")}
            disabled={isTriggeringSOS}
            role="button"
            aria-label="Activar protocolo de auxilio y geolocalización SOS"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-rose-600/40 border border-rose-400/40 cursor-pointer transition-all animate-pulse"
          >
            <AlertTriangle size={14} />
            <span>{isTriggeringSOS ? "Enviando..." : "SOS AUXILIO"}</span>
          </button>

          <button
            onClick={handleCleanExit}
            role="button"
            aria-label="Finalizar llamada con Susy"
            className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
          >
            <PhoneOff size={18} />
          </button>
        </div>

        {/* Firma Nexora One y Aviso de Transparencia de IA */}
        <div className="w-full pt-2 text-center text-[10px] text-slate-400/90 leading-snug">
          Desarrollado por <strong className="text-slate-200">Nexora One</strong> (Tel: 3786414533) • Susy es una IA: puede cometer errores y no reemplaza la intervención humana.
        </div>

      </div>
    </div>
  );
}
