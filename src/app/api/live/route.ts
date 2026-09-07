/**
 * ========================================================================
 * 👁️ SUSYBOT LIVE — CÁMARA TITÁN: VISIÓN ESPACIAL UNIVERSAL
 * Ubicación: /src/app/api/live/route.ts
 *
 * Pipeline multimodal sin restricciones de tipo de documento.
 * Acepta cualquier frame JPEG/PNG Base64 y lo envía directamente al LMM.
 * Modo Lazarillo activo por defecto para usuarios con discapacidad visual.
 * ========================================================================
 */

import { NextResponse } from "next/server";
import { executeSovereignStream } from "@/lib/susy/sovereignCore";
import { applyReputationalShield } from "@/lib/susy/security/susyReputationalPatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 30;

/**
 * Construye la directiva visual universal según el contexto del usuario.
 * No hay restricción por tipo de escena: acepta habitaciones, calles,
 * documentos, naturales, interiores, exteriores — cualquier entorno físico.
 */
function buildVisualDirective(userPrompt: string, mode: string): string {
  const prompt = (userPrompt || "").trim();
  const isLazarilloMode =
    mode === "inclusion" ||
    [
      "ciego",
      "no vidente",
      "lazarillo",
      "visión",
      "vision",
      "guiame",
      "guíame",
      "camino",
      "donde estoy",
      "qué hay",
      "que hay",
      "qué veo",
      "que veo",
    ].some((w) => prompt.toLowerCase().includes(w));

  // El usuario hizo una pregunta específica
  if (prompt && !["describir", "describe", "qué ves", "que ves"].includes(prompt.toLowerCase())) {
    return isLazarilloMode
      ? `[CÁMARA TITÁN — MODO LAZARILLO / VISIÓN ESPACIAL ACTIVA]:
Pregunta del usuario: "${prompt}"
DIRECTIVAS ABSOLUTAS DE RESPUESTA:
1. ESPACIO ABIERTO o HABITACIÓN: Describe obstáculos y objetos usando la esfera de reloj (12 = adelante, 3 = derecha, 9 = izquierda, 6 = atrás). Ejemplo: "Mesa de madera a tus 2 en punto, a un metro. Silla peligrosa a las 11 en punto."
2. DOCUMENTO o TRÁMITE: Analízalo de inmediato. Si está invertido, indica exactamente cuánto girarlo. Lee valores clave (montos, fechas, nombres) en voz alta de forma concisa.
3. VÍA PÚBLICA o CALLE: Alerta cordones, escalones, desniveles, bicicletas, autos y personas en el trayecto a 12 en punto.
4. TONO: Cálido, directo, litoraleño. Sin introducciones vacías. Ve directo a la acción espacial.
5. LONGITUD: Máximo 2 oraciones operativas de menos de 15 palabras cada una.`
      : `[CÁMARA TITÁN — ANÁLISIS MULTIMODAL EN VIVO]:
Consulta: "${prompt}"
Respondé de forma táctica, concisa y resolutiva basándote en la escena capturada. Máximo 2 oraciones breves.`;
  }

  // Sin prompt específico: análisis espacial proactivo universal
  return `[CÁMARA TITÁN — MODO LAZARILLO / ESCANEO ESPACIAL PROACTIVO]:
Sos Susy, lazarillo táctico de alta precisión. El usuario puede ser una persona ciega o con baja visión.
DIRECTIVAS ABSOLUTAS:
1. ESPACIO FÍSICO (habitación, cocina, calle, patio, pasillo): Identifica los 3 elementos más relevantes para la navegación segura usando esfera de reloj y distancia en metros o pasos.
2. DOCUMENTO (papel, formulario, boleta, DNI, recibo): Detecta orientación al instante ("invertido — girá 180°", "inclinado — enderezalo") y leé los datos clave.
3. ZONA DESPEJADA: Confirmá con seguridad ("Camino libre a tus 12 en punto por 3 metros aproximados").
4. TONO: Cálido, correntino, de confianza, extremadamente táctico. Sin frases genéricas de relleno.
5. LONGITUD: Máximo 2 oraciones operativas de menos de 15 palabras cada una.`;
}

export async function POST(req: Request) {
  try {
    const { imageBase64, userPrompt = "", mode = "visual", sessionId } = await req.json();

    const shield = await applyReputationalShield(userPrompt, sessionId);
    if (shield.isAttack) {
      return new Response(JSON.stringify({ text: shield.neutralResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Frame de imagen requerido para Cámara Titán." },
        { status: 400 }
      );
    }

    // Limpieza del Base64 — soporta data URLs y raw Base64
    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    const queryDirective = buildVisualDirective(userPrompt, mode);

    return await executeSovereignStream({
      userMessage: queryDirective,
      imageBase64: cleanBase64,
      mode: "visual" as any,
      maxTokens: 400,
      temperature: 0.2,
    });
  } catch (error: any) {
    console.error("❌ [Titán Live Route Error]:", error);
    return NextResponse.json(
      { error: "Error en el pipeline visual de Cámara Titán." },
      { status: 500 }
    );
  }
}
