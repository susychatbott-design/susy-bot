/**
 * ==============================================================================
 * 🏛️ SUSY BOT - GESTOR DE HARDWARE DE AUDIO Y ACCESIBILIDAD UNIVERSAL (DUA)
 * Ubicación: src/lib/susy/audio/SusyAudioHardware.ts
 * 
 * Diseñado para terminales cívicas, tótems públicos y dispositivos de contribuyentes.
 * Protocolo de Coexistencia con Lectores de Pantalla Gubernamentales (TalkBack / VoiceOver).
 * ==============================================================================
 */

export type AudioChimeType = "alerta_defensa_civil" | "tramite_iniciado" | "tramite_completado";

export class SusyAudioHardware {
  private static instance: SusyAudioHardware;
  private audioCtx: AudioContext | null = null;
  private isCancellingTTS: boolean = false;
  private isScreenReaderActive: boolean = false;
  private screenReaderWatchdog: NodeJS.Timeout | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  private constructor() {}

  public static getInstance(): SusyAudioHardware {
    if (!SusyAudioHardware.instance) {
      SusyAudioHardware.instance = new SusyAudioHardware();
    }
    return SusyAudioHardware.instance;
  }

  /**
   * Obtiene o inicializa de forma segura el contexto compartido de audio Web Audio API
   */
  public async getAudioContext(): Promise<AudioContext> {
    if (typeof window === "undefined") {
      throw new Error("SusyAudioHardware solo puede ejecutarse en el entorno del navegador.");
    }

    if (!this.audioCtx || this.audioCtx.state === "closed") {
      const AudioCtxConstructor = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxConstructor({ latencyHint: "interactive" });
    }

    if (this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  /**
   * Configura la bandera de coexistencia con lectores de accesibilidad estatal (TalkBack / VoiceOver)
   */
  public setScreenReaderCoexistence(isActive: boolean): void {
    this.isScreenReaderActive = isActive;
    if (isActive) {
      this.cancelSpeechImmediately("Coexistencia con Lector de Pantalla de Accesibilidad Ciudadana activada");
    }
  }

  /**
   * Emite un aviso acústico suave para personas con disminución visual sin crear nuevas instancias de AudioContext
   */
  public async playChime(type: AudioChimeType): Promise<void> {
    try {
      const ctx = await this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = "sine";

      if (type === "tramite_iniciado") {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "tramite_completado") {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(783.99, now + 0.08);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === "alerta_defensa_civil") {
        // Tono bitonal de alta atención para emergencias municipales
        osc.type = "triangle";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(660, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        osc.start(now);
        osc.stop(now + 0.24);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch (e) {
      console.warn("[SusyAudioHardware Chime Safe-Bypass]:", e);
    }
  }

  /**
   * Cancela de inmediato cualquier locución en curso protegiendo contra race conditions
   */
  public cancelSpeechImmediately(reason: string = "Detención administrativa"): Promise<void> {
    return new Promise((resolve) => {
      this.clearWatchdog();
      this.activeUtterance = null;

      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return resolve();
      }

      if (this.isCancellingTTS) return resolve();
      this.isCancellingTTS = true;

      try {
        window.speechSynthesis.cancel();
      } catch {}

      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if (!window.speechSynthesis.speaking || checks > 8) {
          clearInterval(interval);
          this.isCancellingTTS = false;
          try { window.speechSynthesis.resume(); } catch {}
          resolve();
        }
      }, 25);
    });
  }

  /**
   * Emite respuesta hablada con Watchdog de 400ms para priorizar el lector de pantalla del contribuyente
   */
  public async speakInstitutionalAnnouncement(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    // Si el contribuyente tiene lector de pantalla activado, no emitir síntesis para no pisar el canal
    if (this.isScreenReaderActive) {
      onStart?.();
      onEnd?.();
      return;
    }

    await this.cancelSpeechImmediately("Preparación de nueva locución oficial");

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }

    const cleanText = text
      .replace(/[*#_`~[\]()]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.activeUtterance = utterance;
    utterance.lang = "es-AR";
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const argVoice = voices.find(v => v.lang.startsWith("es-AR") || v.lang.startsWith("es-419") || v.lang.startsWith("es"));
    if (argVoice) utterance.voice = argVoice;

    // 🛡️ Watchdog Centinela de 400ms: Si se detecta interacción del lector TalkBack/VoiceOver, cortar de inmediato
    this.screenReaderWatchdog = setTimeout(() => {
      if (this.isScreenReaderActive) {
        this.cancelSpeechImmediately("Watchdog de 400ms: Prioridad cedida al Lector de Pantalla del Estado");
      }
    }, 400);

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      this.clearWatchdog();
      this.activeUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      this.clearWatchdog();
      this.activeUtterance = null;
      console.warn("[SusyAudioHardware Speech Warning]:", e);
      onEnd?.();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.clearWatchdog();
      onEnd?.();
    }
  }

  private clearWatchdog(): void {
    if (this.screenReaderWatchdog) {
      clearTimeout(this.screenReaderWatchdog);
      this.screenReaderWatchdog = null;
    }
  }

  /**
   * Cierre total y liberación de descriptores de hardware
   */
  public destroy(): void {
    this.cancelSpeechImmediately("Destrucción de instancia de hardware");
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }
}

// Alias de retrocompatibilidad arquitectónica institucional
export { SusyAudioHardware as AudioHardwareManager };

