/**
 * ============================================================================
 * 🏛️ SUSY BOT — ROUTER LLM DE 5 CAPAS & INTERCEPTOR SSE DE RAZONAMIENTO
 * Ubicación: src/lib/llm/susyRouter.ts
 *
 * Cascada de Inferencia Soberana de 5 Capas:
 *   Capa 1: Ollama Local / VPS Municipal (100% Soberano, LLaMA 3.3 / Qwen 2.5 / LLaVA)
 *   Capa 2: Groq Open-Weights LPU (Llama 3.3 70B / Llama 3.1 8B / Llama 3.2 Vision)
 *   Capa 3: Pollinations Open Neural Mesh (100% Gratuito, Sin API Keys)
 *   Capa 4: Hugging Face Serverless Open Mesh (Qwen 2.5 72B / DeepSeek R1 Distill)
 *   Capa 5: Motor Autónomo Municipal On-Device (WebGPU / Local Engine en 0ms)
 *
 * Incluye un Interceptor Stateful de Streaming (SSE) que descarta silenciosamente
 * todos los bloques <think>...</think> y <thinking>...</thinking> en tiempo real
 * para proteger la UI ciudadana cuando intervienen modelos de razonamiento (DeepSeek R1 / Qwen).
 * ============================================================================
 */

import { executeLocalInference } from "@/lib/susy/webgpu/localEngine";
import { LLMAdapter, LLMHistoryItem, LLMRequestParams, SusyLLMProviderId, UnifiedLLMResponse } from "./types";

interface OpenAIChatMessageContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

interface OpenAIChatMessage {
  role: "system" | "user" | "assistant";
  content: string | OpenAIChatMessageContentPart[];
}

interface OpenAIChatCompletionResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}

interface OpenAIStreamDeltaResponse {
  choices?: {
    delta?: {
      content?: string;
    };
  }[];
}

function cleanEnvKey(val?: string): string {
  if (!val) return "";
  return val.replace(/['"\r\n\t ]/g, "").trim();
}

/**
 * Sanitiza salidas estáticas de modelos eliminando bloques <think> y <thinking>
 */
export function sanitizeModelOutput(rawText: string): string {
  if (!rawText) return "";
  return rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/^Thinking:?\s*/i, "")
    .trim();
}

/**
 * Construye el array de mensajes compatible con el estándar OpenAI / Ollama / Groq / Pollinations
 */
function buildMessagesPayload(
  systemPrompt: string,
  userMessage: string,
  history: LLMHistoryItem[] = [],
  imageBase64?: string | null
): OpenAIChatMessage[] {
  const messages: OpenAIChatMessage[] = [{ role: "system", content: systemPrompt }];

  for (const h of history.slice(-8)) {
    if (!h.content || !h.content.trim()) continue;
    messages.push({
      role: h.role === "assistant" ? "assistant" : "user",
      content: h.content.trim(),
    });
  }

  const cleanB64 = imageBase64
    ? imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64
    : null;

  if (cleanB64) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userMessage || "Analiza esta imagen con precisión." },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanB64}` } },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: userMessage,
    });
  }

  return messages;
}

/**
 * 🛡️ INTERCEPTOR STATEFUL DE STREAMING (SSE):
 * Transforma un stream OpenAI/Groq/Ollama/HF en un stream SSE limpio para Susy Bot,
 * reteniendo y descartando herméticamente cualquier secuencia `<think>...</think>`
 * o `<thinking>...</thinking>` (ej: DeepSeek R1 / Qwen) sin bloquear los tokens visibles.
 */
export function createSanitizedSSEStreamResponse(
  upstreamBody: ReadableStream<Uint8Array>,
  providerUsed: SusyLLMProviderId,
  sessionId?: string | null
): Response {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const sanitizedStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstreamBody.getReader();
      let lineBuffer = "";
      let accumulatedVisibleText = "";
      let isInsideThinkBlock = false;

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keep-alive\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 2500);

      const stripAndEmitDelta = (rawDelta: string): void => {
        let work = rawDelta.replace(/<thinking>/gi, "<think>").replace(/<\/thinking>/gi, "</think>");

        while (work.length > 0) {
          if (!isInsideThinkBlock) {
            const startIdx = work.toLowerCase().indexOf("<think>");
            if (startIdx === -1) {
              accumulatedVisibleText += work;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text: work, session_id: sessionId, provider: providerUsed })}\n\n`
                )
              );
              break;
            } else {
              const beforeThink = work.slice(0, startIdx);
              if (beforeThink) {
                accumulatedVisibleText += beforeThink;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ text: beforeThink, session_id: sessionId, provider: providerUsed })}\n\n`
                  )
                );
              }
              isInsideThinkBlock = true;
              work = work.slice(startIdx + "<think>".length);
            }
          } else {
            const endIdx = work.toLowerCase().indexOf("</think>");
            if (endIdx === -1) {
              // Todo el resto del chunk pertenece al pensamiento interno: descartar silenciosamente
              break;
            } else {
              isInsideThinkBlock = false;
              work = work.slice(endIdx + "</think>".length);
            }
          }
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          lineBuffer += decoder.decode(value, { stream: true });
          const lines = lineBuffer.split("\n");
          lineBuffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;

            const payloadStr = trimmed.slice(6).trim();
            if (payloadStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(payloadStr) as OpenAIStreamDeltaResponse;
              const delta = parsed.choices?.[0]?.delta?.content || "";
              if (delta) {
                stripAndEmitDelta(delta);
              }
            } catch {
              // Ignorar líneas SSE malformadas
            }
          }
        }

        if (isInsideThinkBlock && !accumulatedVisibleText.trim()) {
          const rescueMsg =
            "Te escucho con atención, vecino. ¿En qué trámite o consulta municipal de Ituzaingó te puedo colaborar?";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: rescueMsg, session_id: sessionId, provider: providerUsed })}\n\n`
            )
          );
        }

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } catch (err: unknown) {
        console.warn("[SusyLLMRouter Stream Interceptor Warn]:", err);
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } finally {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(sanitizedStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Susy-Provider": providerUsed,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPA 1: OLLAMA LOCAL / VPS MUNICIPAL ADAPTER
// ═══════════════════════════════════════════════════════════════════════════
export class OllamaMunicipalAdapter implements LLMAdapter {
  id: SusyLLMProviderId = "ollama-local";

  private getBaseUrl(): string {
    return (
      cleanEnvKey(process.env.LOCAL_OLLAMA_URL) ||
      cleanEnvKey(process.env.OLLAMA_BASE_URL) ||
      cleanEnvKey(process.env.NEXT_PUBLIC_OLLAMA_URL)
    );
  }

  isAvailable(): boolean {
    return process.env.DISABLE_OLLAMA !== "true" && Boolean(this.getBaseUrl());
  }

  async generate(params: LLMRequestParams): Promise<UnifiedLLMResponse> {
    const baseUrl = this.getBaseUrl() || "http://localhost:11434";
    const isVision = Boolean(params.imageBase64);
    const model = isVision
      ? cleanEnvKey(process.env.OLLAMA_VISION_MODEL) || "llava"
      : cleanEnvKey(process.env.OLLAMA_TEXT_MODEL) || "llama3.3";

    const messages = buildMessagesPayload(
      params.systemPrompt,
      params.userMessage,
      params.history,
      params.imageBase64
    );

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      throw new Error(`Ollama respondió HTTP ${res.status}`);
    }

    const data = (await res.json()) as OpenAIChatCompletionResponse;
    const raw = data.choices?.[0]?.message?.content || "";
    const text = sanitizeModelOutput(raw);
    if (!text) throw new Error("Ollama devolvió respuesta vacía");

    return {
      text,
      providerUsed: "ollama-local",
      latencyMs: 0,
    };
  }

  async generateStream(params: LLMRequestParams): Promise<ReadableStream<Uint8Array> | null> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) return null;

    const isVision = Boolean(params.imageBase64);
    const candidates = isVision
      ? [cleanEnvKey(process.env.OLLAMA_VISION_MODEL) || "llava", "qwen2.5-vl"]
      : [cleanEnvKey(process.env.OLLAMA_TEXT_MODEL) || "llama3.3", "llama3.2"];

    const messages = buildMessagesPayload(
      params.systemPrompt,
      params.userMessage,
      params.history,
      params.imageBase64
    );

    for (const model of candidates) {
      try {
        const res = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages,
            stream: true,
            temperature: params.temperature,
            max_tokens: params.maxTokens,
          }),
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok && res.body) {
          return res.body;
        }
      } catch {
        // Intentar siguiente modelo local
      }
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPA 2: GROQ OPEN-WEIGHTS LPU ADAPTER
// ═══════════════════════════════════════════════════════════════════════════
export class GroqOpenWeightsAdapter implements LLMAdapter {
  id: SusyLLMProviderId = "groq";

  private getApiKey(): string {
    return cleanEnvKey(process.env.GROQ_API_KEY) || cleanEnvKey(process.env.NEXT_PUBLIC_GROQ_API_KEY);
  }

  isAvailable(): boolean {
    return Boolean(this.getApiKey());
  }

  async generate(params: LLMRequestParams): Promise<UnifiedLLMResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error("GROQ_API_KEY no configurada");

    const isVision = Boolean(params.imageBase64);
    const models = isVision
      ? ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"]
      : ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

    const messages = buildMessagesPayload(
      params.systemPrompt,
      params.userMessage,
      params.history,
      params.imageBase64
    );

    let lastErr: unknown = null;
    for (const model of models) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            stream: false,
            temperature: params.temperature,
            max_tokens: params.maxTokens,
          }),
          signal: AbortSignal.timeout(2800),
        });

        if (!res.ok) throw new Error(`Groq ${model} HTTP ${res.status}`);

        const data = (await res.json()) as OpenAIChatCompletionResponse;
        const raw = data.choices?.[0]?.message?.content || "";
        const text = sanitizeModelOutput(raw);
        if (text) {
          return { text, providerUsed: "groq", latencyMs: 0 };
        }
      } catch (err: unknown) {
        lastErr = err;
      }
    }

    throw lastErr instanceof Error ? lastErr : new Error("Fallo en modelos Groq");
  }

  async generateStream(params: LLMRequestParams): Promise<ReadableStream<Uint8Array> | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    const isVision = Boolean(params.imageBase64);
    const models = isVision
      ? ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"]
      : ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

    const messages = buildMessagesPayload(
      params.systemPrompt,
      params.userMessage,
      params.history,
      params.imageBase64
    );

    for (const model of models) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            stream: true,
            temperature: params.temperature,
            max_tokens: isVision ? 1200 : params.maxTokens,
          }),
          signal: AbortSignal.timeout(2800),
        });

        if (res.ok && res.body) {
          return res.body;
        }
      } catch {
        // Rotar al siguiente modelo
      }
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPA 3: POLLINATIONS OPEN NEURAL MESH ADAPTER ($0 COSTO, SIN KEYS)
// ═══════════════════════════════════════════════════════════════════════════
export class PollinationsMeshAdapter implements LLMAdapter {
  id: SusyLLMProviderId = "pollinations";

  isAvailable(): boolean {
    return true;
  }

  async generate(params: LLMRequestParams): Promise<UnifiedLLMResponse> {
    const messages = buildMessagesPayload(
      params.systemPrompt,
      params.userMessage,
      params.history,
      params.imageBase64
    );

    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        model: "openai",
        stream: false,
        temperature: params.temperature,
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) throw new Error(`Pollinations HTTP ${res.status}`);
    const data = (await res.json()) as OpenAIChatCompletionResponse;
    const text = sanitizeModelOutput(data.choices?.[0]?.message?.content || "");
    if (!text) throw new Error("Pollinations devolvió respuesta vacía");

    return { text, providerUsed: "pollinations", latencyMs: 0 };
  }

  async generateStream(params: LLMRequestParams): Promise<ReadableStream<Uint8Array> | null> {
    try {
      const messages = buildMessagesPayload(
        params.systemPrompt,
        params.userMessage,
        params.history,
        params.imageBase64
      );

      const res = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          model: "openai",
          stream: true,
          temperature: params.temperature,
        }),
        signal: AbortSignal.timeout(3200),
      });

      if (res.ok && res.body) {
        return res.body;
      }
    } catch {
      // Continuar a capa 4
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPA 4: HUGGING FACE SERVERLESS OPEN MESH ADAPTER (QWEN 2.5 / DEEPSEEK R1)
// ═══════════════════════════════════════════════════════════════════════════
export class HuggingFaceOpenAdapter implements LLMAdapter {
  id: SusyLLMProviderId = "huggingface";

  private getToken(): string {
    return (
      cleanEnvKey(process.env.HF_ACCESS_TOKEN) ||
      cleanEnvKey(process.env.HUGGINGFACE_API_KEY) ||
      cleanEnvKey(process.env.HF_TOKEN)
    );
  }

  isAvailable(): boolean {
    return Boolean(this.getToken());
  }

  async generate(params: LLMRequestParams): Promise<UnifiedLLMResponse> {
    const token = this.getToken();
    if (!token) throw new Error("HF Token ausente");

    const isVision = Boolean(params.imageBase64);
    const models = isVision
      ? ["Qwen/Qwen2.5-VL-7B-Instruct"]
      : ["Qwen/Qwen2.5-72B-Instruct", "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B"];

    const messages = buildMessagesPayload(
      params.systemPrompt,
      params.userMessage,
      params.history,
      params.imageBase64
    );

    for (const model of models) {
      try {
        const res = await fetch("https://router.huggingface.co/hf-inference/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            stream: false,
            temperature: params.temperature,
            max_tokens: params.maxTokens,
          }),
          signal: AbortSignal.timeout(5000),
        });

        if (res.ok) {
          const data = (await res.json()) as OpenAIChatCompletionResponse;
          const text = sanitizeModelOutput(data.choices?.[0]?.message?.content || "");
          if (text) {
            return { text, providerUsed: "huggingface", latencyMs: 0 };
          }
        }
      } catch {
        // Probar siguiente modelo
      }
    }
    throw new Error("Hugging Face Open Mesh no disponible");
  }

  async generateStream(params: LLMRequestParams): Promise<ReadableStream<Uint8Array> | null> {
    const token = this.getToken();
    if (!token) return null;

    const isVision = Boolean(params.imageBase64);
    const models = isVision
      ? ["Qwen/Qwen2.5-VL-7B-Instruct"]
      : ["Qwen/Qwen2.5-72B-Instruct", "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B"];

    const messages = buildMessagesPayload(
      params.systemPrompt,
      params.userMessage,
      params.history,
      params.imageBase64
    );

    for (const model of models) {
      try {
        const res = await fetch("https://router.huggingface.co/hf-inference/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            stream: true,
            temperature: params.temperature,
            max_tokens: params.maxTokens,
          }),
          signal: AbortSignal.timeout(5000),
        });

        if (res.ok && res.body) {
          return res.body;
        }
      } catch {
        // Continuar
      }
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPA 5: MOTOR AUTÓNOMO MUNICIPAL ON-DEVICE (WEBGPU / LOCAL ENGINE 0MS)
// ═══════════════════════════════════════════════════════════════════════════
export class WebGPULocalMunicipalAdapter implements LLMAdapter {
  id: SusyLLMProviderId = "webgpu-local";

  isAvailable(): boolean {
    return true;
  }

  async generate(params: LLMRequestParams): Promise<UnifiedLLMResponse> {
    const mappedMode =
      params.mode === "lazarillo" || params.mode === "no_videntes"
        ? "visual"
        : params.mode === "tea"
        ? "inclusion"
        : "general";

    const localResult = await executeLocalInference(
      params.userMessage,
      (params.history || []).map((h) => ({ role: h.role, content: h.content })),
      mappedMode
    );

    return {
      text: sanitizeModelOutput(localResult.text),
      providerUsed: "webgpu-local",
      latencyMs: 0,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ORQUESTADOR MAESTRO DE LA CASCADA DE 5 CAPAS (SusyLLMRouter)
// ═══════════════════════════════════════════════════════════════════════════
export class SusyLLMRouter {
  private adapters: LLMAdapter[];

  constructor(adapters?: LLMAdapter[]) {
    this.adapters = adapters || [
      new OllamaMunicipalAdapter(),
      new GroqOpenWeightsAdapter(),
      new PollinationsMeshAdapter(),
      new HuggingFaceOpenAdapter(),
      new WebGPULocalMunicipalAdapter(),
    ];
  }

  /**
   * Ejecuta inferencia unificada en cascada (Capas 1 a 5) devolviendo texto limpio de <think>
   */
  async routeInference(params: LLMRequestParams): Promise<UnifiedLLMResponse> {
    for (const adapter of this.adapters) {
      if (!adapter.isAvailable()) continue;

      const start = performance.now();
      try {
        const response = await adapter.generate(params);
        return {
          ...response,
          text: sanitizeModelOutput(response.text),
          latencyMs: Math.round(performance.now() - start),
        };
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.warn(`[SusyLLMRouter] Falló capa ${adapter.id}: ${errMsg}. Conmutando...`);
      }
    }

    return {
      text: "Operando en modo autónomo municipal de emergencia. Mis sensores locales y guías de Ituzaingó continúan activos.",
      spatialAlerts: [],
      suggestedActions: ["Consultar teléfonos de emergencia", "Reintentar conexión"],
      providerUsed: "webgpu-local",
      latencyMs: 0,
    };
  }

  /**
   * Ejecuta inferencia en Streaming SSE en cascada (Capas 1 a 5) con filtrado en vivo de <think>...</think>
   */
  async routeStreamInference(params: LLMRequestParams): Promise<Response> {
    for (const adapter of this.adapters) {
      if (!adapter.isAvailable() || !adapter.generateStream) continue;

      try {
        const streamBody = await adapter.generateStream(params);
        if (streamBody) {
          return createSanitizedSSEStreamResponse(streamBody, adapter.id, params.sessionId);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[SusyLLMRouter Stream] Falló capa ${adapter.id}: ${msg}. Conmutando...`);
      }
    }

    // Capa 5 Fallback garantizado en formato SSE
    const fallbackResponse = await new WebGPULocalMunicipalAdapter().generate(params);
    const encoder = new TextEncoder();
    const fallbackStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              text: fallbackResponse.text,
              session_id: params.sessionId,
              provider: "webgpu-local",
            })}\n\n`
          )
        );
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      },
    });

    return new Response(fallbackStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Susy-Provider": "webgpu-local",
      },
    });
  }
}

export const susyLLMRouter = new SusyLLMRouter();
export { SusyLLMRouter as NoraLLMRouter };
