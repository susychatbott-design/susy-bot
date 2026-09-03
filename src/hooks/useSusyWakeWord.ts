import { useEffect, useRef, useState, useCallback } from 'react';

interface UseNoraWakeWordProps {
  onWakeWordDetected: (phrase?: string) => void;
  enabled: boolean;
}

export const useSusyWakeWord = ({ onWakeWordDetected, enabled }: UseNoraWakeWordProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const onDetectedRef = useRef(onWakeWordDetected);

  useEffect(() => {
    onDetectedRef.current = onWakeWordDetected;
  }, [onWakeWordDetected]);

  // Patrones fonéticos para frases compuestas ("Nora te necesito", "Hola Nora", "Nora ayúdame")
  const WAKE_PATTERNS = [
    /^(hola\s+)?nora\b/i,
    /\bnora\s+te\s+necesito\b/i,
    /\bnora\s+ayudame\b/i,
    /\bnora\s+ayúdame\b/i,
    /\bnora\s+emergencia\b/i,
    /\bnora\s+donde\s+estoy\b/i,
    /\bllamando\s+a\s+nora\b/i
  ];

  const checkPhrase = useCallback((transcript: string) => {
    const clean = transcript.trim().toLowerCase();
    return WAKE_PATTERNS.some((pattern) => pattern.test(clean));
  }, []);

  const stopListening = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      stopListening();
      return;
    }

    let isMounted = true;

    async function initWakeWord() {
      try {
        // 1. Obtener stream con DSP activo
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;

        // 2. AudioContext sin conectar a destination para evitar feedback
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioCtx({ latencyHint: 'interactive' });
        audioContextRef.current = audioContext;

        try {
          await audioContext.audioWorklet.addModule('/worklets/nora-wake-word-processor.js');

          const source = audioContext.createMediaStreamSource(stream);
          const workletNode = new AudioWorkletNode(audioContext, 'nora-wake-word-processor');
          workletNodeRef.current = workletNode;

          workletNode.port.onmessage = (event) => {
            if (event.data?.event === 'WAKE_WORD_DETECTED' && enabled) {
              console.log('[WakeWord Worklet] ⚡ Cadencia silábica NO-RA detectada.');
              onDetectedRef.current('Nora');
            }
          };

          // ⚠️ Conectar solo a workletNode (NUNCA a audioContext.destination)
          source.connect(workletNode);
        } catch (workletErr) {
          console.warn('[WakeWord Worklet Warning]:', workletErr);
        }

        // 3. Reconocedor complementario para frases compuestas ("Nora te necesito")
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          try {
            const recognition = new SpeechRec();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'es-AR';

            recognition.onresult = (event: any) => {
              if (!enabled) return;
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                const text = event.results[i][0]?.transcript || '';
                if (checkPhrase(text)) {
                  console.log('[WakeWord SpeechRec] 🎙️ Frase clave detectada:', text);
                  onDetectedRef.current(text);
                  return;
                }
              }
            };

            recognition.onend = () => {
              if (isMounted && enabled) {
                setTimeout(() => {
                  try { if (isMounted && enabled) recognition.start(); } catch {}
                }, 600);
              }
            };

            recognition.start();
            recognitionRef.current = recognition;
          } catch {}
        }

        setIsListening(true);
      } catch (error) {
        console.error('Error inicializando el Wake Word de Nora:', error);
        setIsListening(false);
      }
    }

    initWakeWord();

    return () => {
      isMounted = false;
      stopListening();
    };
  }, [checkPhrase, enabled, stopListening]);

  return { isListening };
};
