import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { text = "", voice = "es-la" } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Texto requerido para síntesis." }, { status: 400 });
    }

    // Limpiar texto de código, URLs y símbolos para el sintetizador
    const cleanSpeechText = text
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[(.*?)\]\([^\s)]+\)/g, "$1")
      .replace(/```[\s\S]*?```/g, " Bloque de código. ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\|+/g, " ")
      .replace(/^[-\s:|+]{3,}$/gm, " ")
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, "")
      .replace(/#{1,6}\s+/g, "")
      .replace(/[*_~`]/g, "")
      .replace(/[-*]\s+/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 450);

    if (!cleanSpeechText) {
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    const hfToken = process.env.HF_ACCESS_TOKEN || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

    if (hfToken) {
      const ttsCandidates = [
        "https://router.huggingface.co/hf-inference/models/hexgrad/Kokoro-82M",
        "https://api-inference.huggingface.co/models/hexgrad/Kokoro-82M",
        "https://router.huggingface.co/hf-inference/models/facebook/mms-tts-spa",
        "https://api-inference.huggingface.co/models/facebook/mms-tts-spa"
      ];

      for (const endpoint of ttsCandidates) {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfToken.trim()}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              inputs: cleanSpeechText,
              parameters: {
                voice: voice === "es-la" ? "af_nicole" : "af_sky",
                language: "es"
              }
            }),
            signal: AbortSignal.timeout(3500)
          });

          if (res.ok) {
            const audioBuffer = await res.arrayBuffer();
            const contentType = res.headers.get("content-type") || "audio/wav";
            return new Response(audioBuffer, {
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600",
                "X-Synthesizer": "Kokoro-82M-Neural"
              }
            });
          }
        } catch (err) {
          // Continuar al siguiente endpoint o fallback
        }
      }
    }

    // Si HF no está activo o está frío, responder con señal de fallback
    return NextResponse.json({ fallback: true }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ fallback: true }, { status: 200 });
  }
}
