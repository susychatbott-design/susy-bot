/**
 * ========================================================================
 * 🏛️ SUSYBOT MUNICIPAL - ROUTER SOBERANO DE INFERENCIA MUNICIPAL (ITUZAINGÓ)
 * Ubicación: /src/lib/susy/sovereignRouter.ts
 * 
 * 100% CÓDIGO ABIERTO - CERO APIS DE TERCEROS - SOBERANÍA TECNOLÓGICA TOTAL
 * 
 * 1. Capa 1: Servidor Municipal On-Premise con Ollama
 * 2. Capa 2: Motor Autónomo Municipal On-Device (WebGPU / Local)
 * ========================================================================
 */

import { NORA_CONSTITUTIONAL_AXIOMS } from "@/lib/susy/constitutionalShield";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { processSovereignAttachment } from "@/lib/susy/documentExtractor";
import { executeSovereignStream } from "@/lib/susy/sovereignCore";

export interface SovereignMessage {
  role: "system" | "user" | "assistant";
  content: string | SovereignContentPart[];
}

export interface SovereignContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
}

export interface SovereignFileAttachment {
  name?: string;
  mimeType?: string;
  type?: string;
  base64?: string;
  url?: string;
  storage_url?: string;
  textContent?: string;
}

export type NoraInteractionMode = "visual" | "voice";

export const SUSY_VOICE_MODE_PROMPT = `
========================================================================
🎙️ PROTOCOLO DE VOZ SUSYBOT (DIRECTORA DE ATENCIÓN AL VECINO - ITUZAINGÓ)
========================================================================
Sos Susy, la Directora Virtual de Atención al Vecino e Innovación Urbana de la Municipalidad de Ituzaingó, Corrientes.
Tu voz y trato deben ser 100% humanos, cálidos, acogedores y sumamente profesionales.
Guías al ciudadano con serenidad, paciencia y eficacia en trámites cívicos, reclamos barriales, farmacias y turismo.

DIRECTIVAS ORALES:
1. Explica con calidez humana, lenguaje claro y accesible.
2. PROHIBIDO TOTALMENTE el uso de Markdown, negritas (**), asteriscos, títulos (#) o viñetas en audio.
3. DIRECTIVA ANTI-BUCLE: No saludes reiteradamente si la conversación ya está en curso. Responde de forma directa, empática y resolutiva.
4. Asistencia a personas no videntes o con TEA: Sé concreta, predecible y da referencias espaciales claras ("frente a ti", "a tu derecha").
`;
export const NORA_VOICE_MODE_PROMPT = SUSY_VOICE_MODE_PROMPT;

export const SUSY_VISUAL_MODE_PROMPT = `
========================================================================
👁️ PROTOCOLO VISUAL SUSYBOT: CÁMARA TITÁN — LAZARILLO ESPACIAL UNIVERSAL
========================================================================
Eres Susy, la inteligencia cívica y espacial de Ituzaingó. Estás operando en "Modo Lazarillo / Cámara Titán".
Tu objetivo primordial es asistir al usuario (que puede ser una persona ciega o con baja visión) a entender su entorno físico exacto EN TIEMPO REAL.

REGLAS ABSOLUTAS DE INFERENCIA:
1. SI ES UN ESPACIO ABIERTO O HABITACIÓN: Describe la arquitectura, objetos y obstáculos usando la analogía de las agujas del reloj espacial (12 en punto = adelante, 3 = derecha, 9 = izquierda, 6 = atrás). Ejemplo: "Tenés una mesa de madera a tus 2 en punto, a un metro de distancia. Cuidado con una silla en tu trayectoria a las 11 en punto".
2. SI ES UN DOCUMENTO O TRÁMITE: Analízalo en el acto. Si está inclinado o invertido, indicalo de inmediato ("El papel está de cabeza, giralo 180 grados", "Acercalo 10 centímetros"). Lee los datos clave (tasas, montos, nombres) de forma concisa.
3. SI ES VÍA PÚBLICA O ENTORNO URBANO: Alerta con precisión sobre cordones, escalones, desniveles, bicicletas, vehículos, pozos o puertas abiertas en el trayecto a las 12 en punto.
4. TONO: Cálido, directo, litoraleño/correntino, de confianza y extremadamente táctico. No uses introducciones vacías ("Veo un..."). Ve directo a la acción y la descripción espacial.
5. BREVEDAD ATÓMICA: Cada oración debe tener menos de 15 palabras para que el motor TTS mobile la flusha instantáneamente sin cortes.
`;
export const NORA_VISUAL_MODE_PROMPT = SUSY_VISUAL_MODE_PROMPT;

export interface SovereignRouterParams {
  history?: { role: string; content: string }[];
  userMessage: string;
  systemPrompt?: string;
  interactionMode?: NoraInteractionMode;
  file?: SovereignFileAttachment | null;
  temperature?: number;
  maxTokens?: number;
  sessionId?: string | null;
  userId?: string;
  contextData?: any;
}

/**
 * Normaliza y formatea el archivo adjunto a un Data URL estandarizado
 */
function prepareImageDataUrl(file: SovereignFileAttachment): string | null {
  if (file.base64 && (file.mimeType?.startsWith("image/") || file.type?.startsWith("image/"))) {
    const mime = (file.mimeType || file.type || "image/jpeg").split(";")[0].trim();
    const cleanB64 = file.base64.includes(",") ? file.base64.split(",")[1] : file.base64;
    return `data:${mime};base64,${cleanB64}`;
  }
  if (file.storage_url || file.url) {
    return file.storage_url || file.url || null;
  }
  return null;
}

/**
 * Ensambla el array de mensajes para APIs compatibles con OpenAI/Qwen/Llama
 */
function assembleMessages(
  history: { role: string; content: string }[] = [],
  userMessage: string,
  systemPrompt: string = "",
  imageDataUrl: string | null = null,
  extractedDocContext: string = "",
  interactionMode: NoraInteractionMode = "visual"
): SovereignMessage[] {
  const modePrompt = interactionMode === "voice" ? NORA_VOICE_MODE_PROMPT : NORA_VISUAL_MODE_PROMPT;
  const fullSystemPrompt = `${NORA_CONSTITUTIONAL_AXIOMS}\n\n${modePrompt}\n\n${systemPrompt}`.trim();

  const messages: SovereignMessage[] = [
    { role: "system", content: fullSystemPrompt }
  ];

  for (const h of history) {
    if (!h.content || !h.content.trim()) continue;
    messages.push({
      role: h.role === "assistant" || h.role === "model" ? "assistant" : "user",
      content: h.content
    });
  }

  let finalUserContent: string | SovereignContentPart[] = userMessage;

  if (imageDataUrl) {
    const defaultVisionPrompt = interactionMode === "voice"
      ? "Describe brevemente en 1 o 2 oraciones qué hay en esta imagen para una persona no vidente."
      : "Analiza detalladamente esta imagen, describe con precisión lo que observas y ofrece una explicación clara, útil y didáctica.";

    finalUserContent = [
      {
        type: "text",
        text: userMessage || defaultVisionPrompt
      },
      {
        type: "image_url",
        image_url: { url: imageDataUrl }
      }
    ];
  } else if (extractedDocContext) {
    finalUserContent = `${extractedDocContext}\n[CONSULTA DEL USUARIO]:\n${userMessage || "Analiza minuciosamente el documento adjunto y entrega tus conclusiones estructuradas."}`;
  }

  messages.push({
    role: "user",
    content: finalUserContent
  });

  return messages;
}

/**
 * CAPA 1: Ollama Local / VPS Bridge (Solo si LOCAL_OLLAMA_URL está explícitamente configurado)
 */
async function tryOllamaLocal(messages: SovereignMessage[], isVision: boolean): Promise<ReadableStream | null> {
  const ollamaHost = process.env.LOCAL_OLLAMA_URL || process.env.OLLAMA_HOST;
  if (!ollamaHost) return null; // No intentar en Vercel si no hay host explícito

  const candidateModels = isVision
    ? [process.env.OLLAMA_VISION_MODEL || "llama3.2-vision", "qwen2.5-vl", "llava"]
    : [process.env.OLLAMA_TEXT_MODEL || "llama3.3", "qwen2.5", "llama3.2"];

  const endpoint = `${ollamaHost.replace(/\/+$/, "")}/v1/chat/completions`;

  for (const preferredModel of candidateModels) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: preferredModel,
          messages,
          stream: true,
          temperature: 0.3
        }),
        signal: AbortSignal.timeout(1500)
      });

      if (res.ok && res.body) {
        console.log(`[Sovereign Router - Capa Local]: Inferencia en Nodo Local (${preferredModel})`);
        return res.body;
      }
    } catch {}
  }
  return null;
}

/**
 * 🏛️ DESPACHADOR MAESTRO UNIVERSAL DE INFERENCIA SOBERANA
 */
export async function dispatchSovereignInference(params: SovereignRouterParams): Promise<Response> {
  const {
    history = [],
    userMessage,
    systemPrompt = "",
    interactionMode = "visual",
    file = null,
    sessionId = null
  } = params;

  const attachmentData = processSovereignAttachment(file);
  const imageDataUrl = prepareImageDataUrl(file || {});

  let effectiveUserText = userMessage;
  if (attachmentData.structuredContext) {
    effectiveUserText = `${attachmentData.structuredContext}\n\n[CONSULTA DEL USUARIO]:\n${userMessage}`;
  }

  const cleanImageB64 = imageDataUrl && imageDataUrl.includes(",") ? imageDataUrl.split(",")[1] : null;

  return await executeSovereignStream({
    history: history.map(h => ({
      role: (h.role === "assistant" || h.role === "model") ? "assistant" : "user",
      content: typeof h.content === "string" ? h.content : String(h.content || "")
    })),
    userMessage: effectiveUserText,
    systemPrompt,
    mode: interactionMode as any,
    imageBase64: cleanImageB64,
    file,
    sessionId
  });
}
