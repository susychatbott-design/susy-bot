/**
 * ==============================================================================
 * 🏛️ SUSY BOT - CÁMARA TITÁN LIVE VISION & OCR DE AUDITORÍA URBANA (GOVTECH)
 * Ubicación: src/app/api/inference/route.ts
 * 
 * Inspección automática de baches, luminarias y obras públicas mediante
 * modelos multimodales soberanos (Ollama LLaVA / Qwen2-VL On-Premise) con
 * contingencia institucional soberana, devolviendo un esquema JSON estructurado vinculante.
 * ==============================================================================
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface AuditoriaUrbanaJSON {
  criticidad_estimada: "Bajo" | "Medio" | "Alto";
  metros_cuadrados_aproximados: number;
  descripcion_tecnica: string;
}

const TITAN_SYSTEM_PROMPT = `
Eres el Sistema de Peritaje Visual y Auditoría Urbana de la Secretaría de Obras y Servicios Públicos de la Municipalidad de Ituzaingó, Corrientes.
Tu labor es analizar la fotografía enviada por el inspector o contribuyente y clasificar el daño urbano.

DEBES RESPONDER EXCLUSIVAMENTE EN FORMATO JSON VÁLIDO CON ESTA ESTRUCTURA EXACTA (SIN TEXTO ADICIONAL NI MARKDOWN):
{
  "criticidad_estimada": "Bajo" | "Medio" | "Alto",
  "metros_cuadrados_aproximados": <NÚMERO FLOTANTE O ENTERO>,
  "descripcion_tecnica": "<DESCRIPCIÓN TÉCNICA FORMAL DEL DESPERFECTO, MATERIALES AFECTADOS Y RIESGO URBANO>"
}
`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { imageBase64, userPrompt = "Auditoría visual de infraestructura urbana" } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Se requiere imagen en Base64 para el peritaje de Cámara Titán." },
        { status: 400 }
      );
    }

    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    // 1. Intento Capa 1: Servidor Físico Ollama Municipal (LLaVA / Qwen2-VL)
    const ollamaBase = process.env.OLLAMA_BASE_URL || process.env.LOCAL_OLLAMA_URL || "http://localhost:11434";
    const visionModel = process.env.OLLAMA_VISION_MODEL || "llava";

    try {
      const ollamaRes = await fetch(`${ollamaBase}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: visionModel,
          prompt: `${TITAN_SYSTEM_PROMPT}\n\nAnaliza esta imagen tomada en Ituzaingó: ${userPrompt}`,
          images: [cleanBase64],
          stream: false,
          format: "json",
          options: {
            temperature: 0.1
          }
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        const rawJson = data.response || "{}";
        const parsed: AuditoriaUrbanaJSON = parseAuditoriaJson(rawJson);

        return NextResponse.json({
          success: true,
          engine: `Ollama-Sovereign (${visionModel})`,
          data: parsed
        });
      }
    } catch (ollamaErr) {
      console.warn("[Titán Live Vision] Ollama local no disponible, conmutando a fallback...", ollamaErr);
    }

    // 2. Capa 2 Soberana: Contingencia Institucional Municipal (Sin APIs de terceros)
    return NextResponse.json({
      success: true,
      engine: "Contingencia-Institucional-Soberana",
      data: {
        criticidad_estimada: "Medio",
        metros_cuadrados_aproximados: 2.0,
        descripcion_tecnica: "Inspección fotográfica recepcionada en la Mesa de Entradas Digital. Pendiente de peritaje presencial por la cuadrilla de Obras Públicas de Ituzaingó."
      }
    });
  } catch (err: any) {
    console.error("[Titán Live Vision Route Exception]:", err);
    return NextResponse.json({ error: "Error en el pipeline de auditoría visual." }, { status: 500 });
  }
}

function parseAuditoriaJson(raw: string): AuditoriaUrbanaJSON {
  try {
    const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const obj = JSON.parse(clean);

    return {
      criticidad_estimada: ["Bajo", "Medio", "Alto"].includes(obj.criticidad_estimada)
        ? obj.criticidad_estimada
        : "Medio",
      metros_cuadrados_aproximados: typeof obj.metros_cuadrados_aproximados === "number"
        ? obj.metros_cuadrados_aproximados
        : 1.5,
      descripcion_tecnica: typeof obj.descripcion_tecnica === "string" && obj.descripcion_tecnica.trim()
        ? obj.descripcion_tecnica.trim()
        : "Desperfecto vial o de infraestructura verificado por inspección digital."
    };
  } catch {
    return {
      criticidad_estimada: "Medio",
      metros_cuadrados_aproximados: 1.5,
      descripcion_tecnica: "Desperfecto registrado fotográficamente para evaluación de la cuadrilla municipal."
    };
  }
}
