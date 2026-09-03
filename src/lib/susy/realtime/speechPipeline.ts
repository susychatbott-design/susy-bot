/**
 * ========================================================================
 * 🎙️ SUSYBOT REALTIME SPEECH PIPELINE (COSTO $0 - ZERO LATENCY - ROBUST)
 * Ubicación: /src/lib/nora/realtime/speechPipeline.ts
 * ========================================================================
 */

export interface RealtimeVoiceConfig {
  onTranscript: (text: string, isFinal: boolean) => void;
  onAssistantSpeechStart: () => void;
  onAssistantSpeechEnd: () => void;
  onUserInterruption: () => void;
  voiceUri?: string;
  lang?: string;
}

export class NoraRealtimeOrchestrator {
  private recognition: any = null;
  public isSpeaking = false;
  public isListening = false;
  private isRestarting = false;
  private ttsQueue: string[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private abortController: AbortController | null = null;
  private config: RealtimeVoiceConfig;
  private silenceTimer: any = null;
  private lastSpokenText: string = "";

  constructor(config: RealtimeVoiceConfig) {
    this.config = config;
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("[Realtime Speech] SpeechRecognition no está soportado en este navegador.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.config.lang || "es-AR";

    this.recognition.onstart = () => {
      this.isListening = true;
      this.isRestarting = false;
    };

    this.recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      const activeText = (final || interim).trim();

      // 🛑 BARGE-IN: Si el usuario habla mientras Nora reproduce sonido, cortar de inmediato
      if (activeText.length > 1 && this.isSpeaking) {
        this.interruptAssistant();
      }

      if (activeText) {
        this.lastSpokenText = activeText;
        this.config.onTranscript(activeText, Boolean(final));

        // Detector de silencio inteligente: Si pasan 1000ms sin nuevas palabras, disparar como final
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        this.silenceTimer = setTimeout(() => {
          if (this.lastSpokenText.trim().length > 1 && !this.isSpeaking) {
            this.config.onTranscript(this.lastSpokenText.trim(), true);
            this.lastSpokenText = "";
          }
        }, 1100);
      }
    };

    this.recognition.onerror = (err: any) => {
      if (err.error === "not-allowed") {
        console.warn("[Realtime Speech] Permiso de micrófono denegado.");
        this.isListening = false;
      }
    };

    this.recognition.onend = () => {
      // Auto-reinicio suave sólo si sigue en llamada y Nora no está hablando
      if (this.isListening && !this.isRestarting && !this.isSpeaking) {
        this.isRestarting = true;
        setTimeout(() => {
          try {
            if (this.isListening && !this.isSpeaking) {
              this.recognition?.start();
            }
          } catch {}
          this.isRestarting = false;
        }, 300);
      }
    };
  }

  /**
   * Inicia la captura limpia de micrófono
   */
  public async start() {
    this.isListening = true;
    this.lastSpokenText = "";
    try {
      this.recognition?.start();
    } catch {}
  }

  /**
   * Detiene la captura y limpia recursos
   */
  public stop() {
    this.isListening = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.interruptAssistant();
    try {
      this.recognition?.stop();
    } catch {}
  }

  /**
   * 🛑 INTERRUPCIÓN INSTANTÁNEA (BARGE-IN)
   */
  public interruptAssistant() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.ttsQueue = [];
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.config.onUserInterruption();
  }

  /**
   * 🗣️ ENCOLADO Y REPRODUCCIÓN DE ORACIONES
   */
  public enqueueTextChunk(textChunk: string) {
    const cleanText = textChunk
      .replace(/[*#_~`>]/g, "") // Limpiar caracteres Markdown
      .replace(/\|+/g, " ")
      .trim();

    if (!cleanText) return;
    this.ttsQueue.push(cleanText);
    if (!this.isSpeaking) {
      this.playNextChunk();
    }
  }

  private playNextChunk() {
    if (this.ttsQueue.length === 0) {
      this.isSpeaking = false;
      this.config.onAssistantSpeechEnd();
      // Reanudar escucha al terminar de hablar Nora
      if (this.isListening) {
        try {
          this.recognition?.start();
        } catch {}
      }
      return;
    }

    this.isSpeaking = true;
    this.config.onAssistantSpeechStart();

    // Pausar temporalmente el reconocimiento mientras Nora habla para evitar eco
    try {
      this.recognition?.stop();
    } catch {}

    const nextText = this.ttsQueue.shift()!;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.playNextChunk();
      return;
    }

    try {
      window.speechSynthesis.resume();
    } catch {}

    this.currentUtterance = new SpeechSynthesisUtterance(nextText);
    this.currentUtterance.lang = this.config.lang || "es-AR";

    // Asignación inteligente de voz neuronal local
    if (this.config.voiceUri) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find((v) => v.voiceURI === this.config.voiceUri);
      if (selectedVoice) this.currentUtterance.voice = selectedVoice;
    }

    this.currentUtterance.rate = 1.05;
    this.currentUtterance.pitch = 1.0;

    this.currentUtterance.onend = () => {
      this.currentUtterance = null;
      this.playNextChunk();
    };

    this.currentUtterance.onerror = (e) => {
      console.warn("[TTS Chunk Error]:", e);
      this.currentUtterance = null;
      this.playNextChunk();
    };

    try {
      window.speechSynthesis.speak(this.currentUtterance);
    } catch (e) {
      console.warn("[SpeechSynthesis speak error]:", e);
      this.playNextChunk();
    }
  }

  public setAbortController(controller: AbortController) {
    this.abortController = controller;
  }

  public updateVoice(voiceUri: string) {
    this.config.voiceUri = voiceUri;
  }
}

/**
 * ⚡ STREAMING & CHUNKING CON Intl.Segmenter
 */
export async function manejarStreamingNora(
  userInput: string,
  orchestrator: NoraRealtimeOrchestrator,
  history: { role: string; content: string }[] = [],
  mode: string = "general"
): Promise<string> {
  const controller = new AbortController();
  orchestrator.setAbortController(controller);

  let fullAssistantText = "";

  try {
    const response = await fetch("/api/realtime-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userInput,
        history,
        mode
      }),
      signal: controller.signal
    });

    if (!response.ok || !response.body) {
      const errorMsg = "Disculpame, tuve un micro corte en el enlace. ¿Podrías repetirme eso?";
      orchestrator.enqueueTextChunk(errorMsg);
      return errorMsg;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let textoAcumulado = "";
    const segmenter = typeof Intl !== "undefined" && (Intl as any).Segmenter
      ? new (Intl as any).Segmenter("es", { granularity: "sentence" })
      : null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunkTexto = decoder.decode(value, { stream: true });
      textoAcumulado += chunkTexto;
      fullAssistantText += chunkTexto;

      if (segmenter) {
        const segments = Array.from(segmenter.segment(textoAcumulado)) as any[];
        if (segments.length > 1) {
          for (let i = 0; i < segments.length - 1; i++) {
            const fraseLista = segments[i].segment || segments[i].text;
            orchestrator.enqueueTextChunk(fraseLista);
            textoAcumulado = textoAcumulado.slice(fraseLista.length);
          }
        }
      } else {
        // Fallback si no hay Intl.Segmenter (corte por signos de puntuación)
        const match = textoAcumulado.match(/([\s\S]*?[.?!;\n])\s*([\s\S]*)/);
        if (match && match[1]) {
          orchestrator.enqueueTextChunk(match[1]);
          textoAcumulado = match[2] || "";
        }
      }
    }

    if (textoAcumulado.trim()) {
      orchestrator.enqueueTextChunk(textoAcumulado);
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("[Realtime] Stream abortado por interrupción del usuario.");
    } else {
      console.error("[Realtime Router Error]:", error);
      orchestrator.enqueueTextChunk("A ver, continuemos con lo que me decías.");
    }
  }

  return fullAssistantText;
}
