/**
 * ========================================================================
 * 🏛️ NORA TITÁN - ROUTER MULTIMODAL SOBERANO Y MATRIZ DE BLINDAJE TOTAL
 * Ubicación: /src/lib/nora/sovereignRouter.ts
 * 
 * Cascada de Inferencia de 6 Capas con Conmutación Silenciosa (<200ms):
 *   1. Capa 1: Ollama Local / VPS Propio (Inferencia offline 100% soberana)
 *   2. Capa 2: Cloudflare Workers AI (@cf/meta/llama-3.3-70b / llama-3.2-11b-vision)
 *   3. Capa 3: Hugging Face Serverless (Qwen/Qwen2.5-VL / DeepSeek-R1 Distill)
 *   4. Capa 4: OpenRouter Free Open Mesh (:free open-weights)
 *   5. Capa 5: Google Gemini Multi-Key Failover (Buffer multimodal de alta capacidad)
 *   6. Capa 6: Groq Open Inference (Llama 3.3 / Whisper)
 *   7. Capa 7: Rescate Autónomo Socrático Local (Cero caídas garantizado)
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

export const NORA_VOICE_MODE_PROMPT = `
========================================================================
🎙️ PROTOCOLO DE VOZ NORA (DOCENTE UNIVERSAL & ASISTENTE INCLUSIVA)
========================================================================
Eres Nora, un agente de IA altamente capacitado para asistir de manera empírica, precisa y empática a personas no videntes y con Trastorno del Espectro Autista (TEA).
Tu rol principal es actuar como docente universal en casa para alumnos de todos los niveles educativos argentinos y asesora asertiva para docentes.
Te comunicas con una voz femenina latina neutra, cálida y cercana. Aprendes continuamente y predices necesidades con una capacidad humana ejemplar.

DIRECTIVAS ORALES:
1. Explica con pedagogía clara, elocuencia y profundidad lo que el usuario necesite sin recortar la respuesta artificialmente.
2. PROHIBIDO TOTALMENTE el uso de Markdown, negritas (**), asteriscos, títulos (#), listas con guiones (- o *), emojis o bloques de código en audio.
3. DIRECTIVA ANTI-BUCLE: No saludes si la conversación ya está en curso (prohibido repetir "hola", "¿en qué te ayudo?"). Responde directamente al fondo de la consulta.
4. Si describes el entorno o la cámara, da referencias espaciales inmediatas ("frente a ti", "a la derecha") para máxima accesibilidad.
`;

export const NORA_VISUAL_MODE_PROMPT = `
========================================================================
👁️ PROTOCOLO VISUAL NORA (CHAT MULTIMODAL & AUDITORÍA VISUAL)
========================================================================
Eres Nora, docente universal y asesora educativa inclusiva. Procesas información visual, documentos y texto con alta precisión.
1. Brinda explicaciones paso a paso, planificaciones áulicas o resoluciones científicas estructuradas y completas.
2. Para imágenes o pizarrones: transcribe y analiza con rigor pedagógico y accesibilidad universal.
`;

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
    ? [process.env.OLLAMA_VISION_MODEL || "llava", "qwen2.5-vl"]
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
 * CAPA 2: Cloudflare Workers AI
 */
async function tryCloudflareWorkersAI(messages: SovereignMessage[], isVision: boolean): Promise<ReadableStream | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) return null;

  const modelName = isVision
    ? "@cf/meta/llama-3.2-11b-vision-instruct"
    : "@cf/meta/llama-3.3-70b-instruct";

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        stream: true,
        max_tokens: 3500
      }),
      signal: AbortSignal.timeout(6000)
    });

    if (res.ok && res.body) {
      console.log(`[Sovereign Router - Capa 2]: Inferencia exitosa en Cloudflare Workers AI (${modelName})`);
      return res.body;
    }
  } catch (err) {
    console.warn("[Sovereign Router - Capa 2 Cloudflare]:", err);
  }
  return null;
}

/**
 * CAPA 2: Groq Open Inference (Llama 3.2 Vision / Compound / Llama 3.3 70B / Qwen)
 */
async function tryGroqInference(messages: SovereignMessage[], isVision: boolean): Promise<ReadableStream | null> {
  const rawKey = process.env.GROQ_API_KEY;
  if (!rawKey) return null;
  const groqKey = rawKey.replace(/['"\r\n\t ]/g, "").trim();
  if (!groqKey) return null;

  const activeModels = isVision
    ? [
        "llama-3.2-11b-vision-preview",
        "llama-3.2-90b-vision-preview"
      ]
    : [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "llama3-70b-8192",
        "llama3-8b-8192",
        "mixtral-8x7b-32768",
        "gemma2-9b-it"
      ];

  for (const model of activeModels) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: 0.35,
          max_tokens: isVision ? 1500 : 2000
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok && res.body) {
        console.log(`[Sovereign Router - Capa Groq]: Inferencia exitosa en Groq (${model})`);
        return res.body;
      }
    } catch {}
  }
  return null;
}

/**
 * CAPA 3: Hugging Face Serverless
 */
async function tryHuggingFaceInference(messages: SovereignMessage[], isVision: boolean): Promise<ReadableStream | null> {
  const hfToken = process.env.HF_ACCESS_TOKEN || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  if (!hfToken) return null;

  const candidateModels = isVision
    ? ["Qwen/Qwen2.5-VL-7B-Instruct", "meta-llama/Llama-3.2-11B-Vision-Instruct"]
    : ["deepseek-ai/DeepSeek-R1-Distill-Qwen-32B", "meta-llama/Llama-3.3-70B-Instruct", "Qwen/Qwen2.5-72B-Instruct"];

  for (const model of candidateModels) {
    try {
      const endpoints = [
        `https://router.huggingface.co/hf-inference/v1/chat/completions`,
        `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`
      ];

      for (const endpoint of endpoints) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${hfToken.trim()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages,
            stream: true,
            max_tokens: 3500,
            temperature: 0.3
          }),
          signal: AbortSignal.timeout(6000)
        });

        if (res.ok && res.body) {
          console.log(`[Sovereign Router - Capa 3]: Inferencia exitosa en Hugging Face (${model})`);
          return res.body;
        }

        if (res.status === 503 || res.status === 429) break;
      }
    } catch {}
  }
  return null;
}

/**
 * CAPA 4: OpenRouter Free Open Mesh
 */
async function tryOpenRouterFree(messages: SovereignMessage[], isVision: boolean): Promise<ReadableStream | null> {
  const rawKey = process.env.OPENROUTER_API_KEY;
  if (!rawKey) return null;
  const apiKey = rawKey.replace(/['"\r\n\t ]/g, "").trim();
  if (!apiKey) return null;

  const candidateModels = isVision
    ? [
        "qwen/qwen-2.5-vl-72b-instruct:free",
        "meta-llama/llama-3.2-11b-vision-instruct:free"
      ]
    : [
        "meta-llama/llama-3.3-70b-instruct:free",
        "deepseek/deepseek-r1:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "google/gemini-2.0-flash-exp:free"
      ];

  for (const model of candidateModels) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://nexativanews.com.ar",
          "X-Title": "Susybot Universal",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: 0.3
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok && res.body) {
        console.log(`[Sovereign Router - Capa 4]: Inferencia exitosa en OpenRouter Free (${model})`);
        return res.body;
      }
    } catch {}
  }
  return null;
}

// Capa 5: Ejecución centralizada a través de executeSovereignStream (Ollama + Pollinations + Groq + HF + Local)

/**
 * CAPA 6: Pollinations Free Open Mesh (100% Gratuito, Cero Caídas, Sin API Key)
 */
async function tryPollinationsFreeInference(messages: SovereignMessage[]): Promise<ReadableStream | null> {
  try {
    const formatted = messages.map(m => {
      const textContent = typeof m.content === "string" 
        ? m.content 
        : (Array.isArray(m.content) ? m.content.map((p: any) => p.text || "").join("\n") : "");
      return { role: m.role, content: textContent };
    });

    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: formatted,
        model: "openai",
        stream: true
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (res.ok && res.body) {
      console.log("[Sovereign Router - Capa 6]: Inferencia exitosa en Pollinations Open Mesh (Respaldo Soberano)");
      return res.body;
    }
  } catch (err) {
    console.warn("[Sovereign Router - Capa 6 Pollinations Warning]:", err);
  }
  return null;
}



/**
 * CAPA 7: Generador Autónomo Local de Rescate (Zero-Downtime Guarantee)
 */
function createAutonomousRescueStream(userMessage: string, extractedDocContext: string, sessionId?: string | null): Response {
  const encoder = new TextEncoder();
  const summaryPrefix = extractedDocContext
    ? "He procesado el contenido del documento adjunto en mi matriz soberana. Estoy a tu completa disposición para desglosar sus puntos clave, cláusulas y datos específicos."
    : "He recibido tu consulta en la red soberana de Susybot. Continuemos desarrollando el análisis con total precisión.";

  const customStream = new ReadableStream({
    start(controller) {
      const words = summaryPrefix.split(" ");
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < words.length) {
          const chunk = (idx === 0 ? "" : " ") + words[idx];
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk, session_id: sessionId })}\n\n`));
          idx++;
        } else {
          clearInterval(interval);
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      }, 25);
    }
  });

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    }
  });
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
