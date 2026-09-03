"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseNoraWakeWordOptions {
  onWakeWordDetected: (phrase: string) => void;
  enabled?: boolean;
  onStateChange?: (isListening: boolean) => void;
}

export function useSusyWakeWord({
  onWakeWordDetected,
  enabled = true,
  onStateChange
}: UseNoraWakeWordOptions) {
  const [isWakeWordActive, setIsWakeWordActive] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const isEnabledRef = useRef<boolean>(enabled);
  const onDetectedRef = useRef(onWakeWordDetected);

  useEffect(() => {
    isEnabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    onDetectedRef.current = onWakeWordDetected;
  }, [onWakeWordDetected]);

  // Lista de patrones de palabras clave de activación
  const WAKE_PATTERNS = [
    /^(hola\s+)?nora\b/i,
    /\bnora\s+te\s+necesito\b/i,
    /\bnora\s+ayudame\b/i,
    /\bnora\s+ayúdame\b/i,
    /\bnora\s+emergencia\b/i,
    /\bnora\s+donde\s+estoy\b/i,
    /\bnora\s+dónde\s+estoy\b/i,
    /\bllamando\s+a\s+nora\b/i,
    /\bdespertar\s+nora\b/i
  ];

  const checkWakeWord = useCallback((transcript: string) => {
    const clean = transcript.trim().toLowerCase();
    for (const pattern of WAKE_PATTERNS) {
      if (pattern.test(clean)) {
        return true;
      }
    }
    return false;
  }, []);

  const startListening = useCallback(async () => {
    if (typeof window === "undefined" || !isEnabledRef.current) return;

    // 1. Inicializar Reconocimiento Continuo de Palabras Clave
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch {}
        }

        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "es-AR";

        recognition.onstart = () => {
          setIsWakeWordActive(true);
          setPermissionGranted(true);
          onStateChange?.(true);
        };

        recognition.onresult = (event: any) => {
          if (!isEnabledRef.current) return;

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0]?.transcript || "";
            if (checkWakeWord(transcript)) {
              console.log("[WakeWord] ⚡ ¡Activación detectada por voz! Frase:", transcript);
              try { recognition.abort(); } catch {}
              onDetectedRef.current(transcript);
              return;
            }
          }
        };

        recognition.onerror = (e: any) => {
          if (e.error === "not-allowed") {
            setPermissionGranted(false);
            setIsWakeWordActive(false);
          }
        };

        recognition.onend = () => {
          // Auto-reinicio suave si sigue habilitado
          if (isEnabledRef.current) {
            setTimeout(() => {
              try {
                if (isEnabledRef.current) {
                  recognition.start();
                }
              } catch {}
            }, 500);
          } else {
            setIsWakeWordActive(false);
            onStateChange?.(false);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn("[WakeWord SpeechRec Init Warn]:", err);
      }
    }

    // 2. Cargar AudioWorkletProcessor de respaldo de bajo consumo
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        try {
          await ctx.audioWorklet.addModule("/audio-processors/nora-wakeword-processor.js");
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });

          micStreamRef.current = stream;
          const source = ctx.createMediaStreamSource(stream);
          const workletNode = new AudioWorkletNode(ctx, "nora-wakeword-processor");
          workletNodeRef.current = workletNode;

          source.connect(workletNode);
          workletNode.connect(ctx.destination);

          workletNode.port.onmessage = (e) => {
            if (e.data.type === "VOICE_ACTIVITY_START") {
              // Actividad de voz detectada en segundo plano
            }
          };
        } catch (workletErr) {
          // Si el navegador bloquea AudioWorklet, el reconocimiento SpeechRec continúa
          console.log("[WakeWord AudioWorklet]: Usando reconocimiento fonético primario.");
        }
      }
    } catch {}
  }, [checkWakeWord, onStateChange]);

  const stopListening = useCallback(() => {
    setIsWakeWordActive(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    onStateChange?.(false);
  }, [onStateChange]);

  useEffect(() => {
    if (enabled) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [enabled, startListening, stopListening]);

  return {
    isWakeWordActive,
    permissionGranted,
    startListening,
    stopListening
  };
}
