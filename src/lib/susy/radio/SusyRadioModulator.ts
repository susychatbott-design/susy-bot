/**
 * ==============================================================================
 * 📻 SUSY BOT - MOTOR DE MODULACIÓN DE AUDIO ANALÓGICO AM/FM Y PASARELA RDS
 * Ubicación: src/lib/susy/radio/SusyRadioModulator.ts
 * 
 * Genera tramas RDS para sintonizadores FM y señales acústicas AFSK (Bell 202)
 * transmitibles por equipos de radiodifusión comercial en situaciones de catástrofe.
 * Propiedad Intelectual: MyJNexoraVisual
 * ==============================================================================
 */

export class SusyRadioModulator {
  private static instance: SusyRadioModulator;

  private constructor() {}

  public static getInstance(): SusyRadioModulator {
    if (!SusyRadioModulator.instance) {
      SusyRadioModulator.instance = new SusyRadioModulator();
    }
    return SusyRadioModulator.instance;
  }

  /**
   * Transforma un texto de emergencia oficial en tramas RDS normalizadas (Bloques de 8 caracteres).
   * Formato compatible con encoders estándar de radiodifusión FM (PS - Program Service).
   */
  public formatRDSText(alertText: string): string[] {
    const cleanText = alertText
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
    const prefix = "SUSY: ";
    const fullMessage = `${prefix}${cleanText}   `;
    const chunks: string[] = [];

    for (let i = 0; i < fullMessage.length; i += 8) {
      chunks.push(fullMessage.slice(i, i + 8).padEnd(8, " "));
    }
    return chunks;
  }

  /**
   * Convierte un string de datos en un silbido AFSK (Bell 202 Standard) usando la Web Audio API nativa.
   * Modula en frecuencias de 1200Hz (Mark) y 2200Hz (Space) a 1200 baudios por el parlante/consola.
   */
  public async generateAFSKAudioTone(dataString: string, outputAudioContext: AudioContext): Promise<void> {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(JSON.stringify({ s: dataString }));
    
    // Asegurar que el contexto de audio esté activo (evitar bloqueo de autoplay)
    if (outputAudioContext.state === "suspended") {
      await outputAudioContext.resume();
    }

    const bitDuration = 1 / 1200; // 1200 Baudios (~0.833 ms por bit)
    let scheduledTime = outputAudioContext.currentTime + 0.05;

    const osc = outputAudioContext.createOscillator();
    const gainNode = outputAudioContext.createGain();

    osc.type = "sine";
    osc.connect(gainNode);
    gainNode.connect(outputAudioContext.destination);

    // 1. Prefacio de sincronización (Preamble de 16 bits alternados para despertar receptores)
    for (let p = 0; p < 16; p++) {
      const freq = p % 2 === 0 ? 1200 : 2200;
      osc.frequency.setValueAtTime(freq, scheduledTime);
      scheduledTime += bitDuration;
    }

    // 2. Modulación bit a bit del payload institucional
    for (const byte of bytes) {
      for (let bit = 0; bit < 8; bit++) {
        const bitValue = (byte >> bit) & 1;
        const frequency = bitValue === 1 ? 1200 : 2200; // 1200Hz = Mark, 2200Hz = Space
        
        osc.frequency.setValueAtTime(frequency, scheduledTime);
        scheduledTime += bitDuration;
      }
    }

    // 3. Envolvente suave de ganancia para evitar chasquidos acústicos
    const startTime = outputAudioContext.currentTime + 0.02;
    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
    gainNode.gain.setValueAtTime(0.25, scheduledTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, scheduledTime + 0.05);

    return new Promise((resolve) => {
      osc.onended = () => {
        try {
          osc.disconnect();
          gainNode.disconnect();
        } catch (e) {}
        resolve();
      };

      osc.start(startTime);
      osc.stop(scheduledTime + 0.05);
    });
  }
}
