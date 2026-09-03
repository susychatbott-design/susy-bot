/**
 * ========================================================================
 * 👁️ SUSYBOT LIVE - AUDITORÍA VISUAL Y CÁMARA TITÁN EN TIEMPO REAL
 * Ubicación: /src/app/api/live/route.ts
 * ========================================================================
 */

import { NextResponse } from "next/server";
import { executeSovereignStream } from "@/lib/susy/sovereignCore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { imageBase64, userPrompt = "", mode = "visual" } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Frame de imagen requerido para Cámara Titán." }, { status: 400 });
    }

    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const isBlindOrLazarillo = mode === "inclusion" || ["ciego", "no vidente", "lazarillo", "vision", "visión", "guiame", "guíame", "camino"].some(w => (userPrompt || "").toLowerCase().includes(w));

    let queryDirective: string;
    if (userPrompt && userPrompt.trim() && !["describir", "describe", "qué ves", "que ves"].includes(userPrompt.trim().toLowerCase())) {
      queryDirective = isBlindOrLazarillo
        ? `[MODO LAZARILLO VISUAL NO VIDENTE - TOMA EN VIVO]: El usuario pregunta: "${userPrompt.trim()}". Responde de inmediato con precisión espacial ('A tus 12 en punto...', 'A tu derecha...'), alertando sobre obstáculos o describiendo el objeto con exactitud en 2 oraciones concisas.`
        : `[CONSULTA DEL USUARIO EN VIVO]: "${userPrompt.trim()}". Responde de inmediato con base en la captura de la Cámara Titán.`;
    } else {
      queryDirective = `[MODO LAZARILLO VISUAL EN VIVO]: Actúa como una guía y lazarillo de alta precisión para una persona no vidente. Describe de inmediato en 2 o 3 oraciones concisas qué hay en la escena física en frente: obstáculos, objetos, personas, puertas o desniveles, usando orientación de esfera de reloj ('A tus 12 en punto...', 'A tus 2 en punto...'). Si hay texto legible, léelo directamente. Si el camino está libre, indícalo con claridad.`;
    }

    return await executeSovereignStream({
      userMessage: queryDirective,
      imageBase64: cleanBase64,
      mode: (mode || "visual") as any,
      maxTokens: 400,
      temperature: 0.2
    });
  } catch (error: any) {
    console.error("❌ [Titán Live Route Error]:", error);
    return NextResponse.json({ error: "Error en el pipeline visual de Cámara Titán." }, { status: 500 });
  }
}
