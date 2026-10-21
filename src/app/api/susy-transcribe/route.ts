import { NextResponse } from "next/server";
import { transcribeAudioWithWhisper } from "@/lib/susy/audioTranscriber";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/susy-transcribe
 * Endpoint STT de Baja Latencia para useSusyAudio y useSusyVAD.
 * Recibe un FormData con "file" (Blob WebM o WAV de 16kHz) y lo transcribe
 * mediante la cascada soberana Open Whisper (Groq Whisper Large v3 Turbo -> HF Whisper).
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("file");

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { ok: false, error: "No se proporcionó ningún archivo de audio válido." },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = audioFile.type || "audio/webm";

    const transcribedText = await transcribeAudioWithWhisper({
      base64: base64Audio,
      mimeType,
      name: "voice_capture.webm",
    });

    if (!transcribedText) {
      return NextResponse.json(
        { ok: false, error: "No se detectó voz reconocible en el segmento de audio." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ok: true,
      text: transcribedText,
      language: "es",
      modelUsed: "whisper-large-v3-turbo",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al transcribir el audio";
    console.error("[/api/susy-transcribe Error]:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(): Promise<Response> {
  return NextResponse.json({ ok: true, service: "susy-transcribe" });
}
