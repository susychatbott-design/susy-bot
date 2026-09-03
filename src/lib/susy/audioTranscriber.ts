/**
 * ========================================================================
 * 🎙️ SUSYBOT AUDIO TRANSCRIBER SOBERANO (100% CÓDIGO ABIERTO - $0 COSTO)
 * Ubicación: /src/lib/nora/audioTranscriber.ts
 * 
 * Cascada de Transcripción de Código Abierto:
 *   1. Capa 1: Groq Whisper Large v3 Turbo (Inferencia abierta de alta velocidad <120ms)
 *   2. Capa 2: Hugging Face Serverless Open Whisper (openai/whisper-large-v3-turbo)
 * ========================================================================
 */

function cleanKey(val?: string): string {
  if (!val) return "";
  return val.replace(/['"\r\n\t ]/g, "").trim();
}

export interface AudioInput {
  base64: string;
  mimeType?: string;
  type?: string;
  name?: string;
}

/**
 * Transcribe un archivo o grabación de audio con modelos de código abierto ($0 Costo)
 */
export async function transcribeAudioWithWhisper(audio: AudioInput): Promise<string | null> {
  const rawB64 = audio.base64?.includes(",") ? audio.base64.split(",")[1] : audio.base64;
  if (!rawB64 || rawB64.length < 50) return null;

  const mime = audio.mimeType || audio.type || "audio/webm";
  const cleanMime = mime.toLowerCase().includes("mp4") ? "audio/mp4" : "audio/webm";

  // 1. CAPA 1: Groq Whisper Large v3 Turbo (<120ms)
  const groqKey = cleanKey(process.env.GROQ_API_KEY) || cleanKey(process.env.NEXT_PUBLIC_GROQ_API_KEY);
  if (groqKey) {
    try {
      const buffer = Buffer.from(rawB64, "base64");
      const uint8 = new Uint8Array(buffer);
      const ext = cleanMime.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob([uint8], { type: cleanMime });
      const formData = new FormData();
      formData.append("file", blob, `audio.${ext}`);
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("language", "es");
      formData.append("temperature", "0.0");

      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}` },
        body: formData,
        signal: AbortSignal.timeout(4000)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text && data.text.trim().length > 0) {
          console.log(`[Audio Transcriber] 🎙️ Open Whisper (Groq) éxito: "${data.text.trim()}"`);
          return data.text.trim();
        }
      }
    } catch (e) {
      console.warn("[Open Whisper Groq Warn]:", e);
    }
  }

  // 2. CAPA 2: Hugging Face Serverless Open Whisper
  const hfToken = cleanKey(process.env.HF_ACCESS_TOKEN) || cleanKey(process.env.HUGGINGFACE_API_KEY) || cleanKey(process.env.HF_TOKEN);
  if (hfToken) {
    try {
      const buffer = Buffer.from(rawB64, "base64");
      const res = await fetch("https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": cleanMime
        },
        body: buffer,
        signal: AbortSignal.timeout(5000)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text && data.text.trim().length > 0) {
          console.log(`[Audio Transcriber] 🎙️ Open Whisper (HuggingFace) éxito: "${data.text.trim()}"`);
          return data.text.trim();
        }
      }
    } catch (hfErr) {
      console.warn("[Open Whisper HF Warn]:", hfErr);
    }
  }

  return null;
}
