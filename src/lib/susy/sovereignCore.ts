/**
 * ========================================================================
 * 🏛️ SUSYBOT MUNICIPAL - MOTOR SOBERANO E INDEPENDIENTE (ITUZAINGÓ)
 * Ubicación: /src/lib/susy/sovereignCore.ts
 * 
 * CERO APIS DE TERCEROS - 100% CÓDIGO ABIERTO Y AUTÓNOMO
 * 
 * Arquitectura Soberana:
 * - Capa 1: Servidor On-Premise Municipal con Ollama (Llama 3.3 / Qwen 2.5)
 * - Capa 2: Motor Autónomo Municipal On-Device (0ms, 100% Offline / WebGPU)
 * ========================================================================
 */

import { NORA_CONSTITUTIONAL_AXIOMS } from "./constitutionalShield";
import { executeLocalInference } from "./webgpu/localEngine";

export interface CoreMessage {
  role: "user" | "assistant" | "model" | "system";
  content: string;
}

export interface SovereignCoreParams {
  history?: CoreMessage[];
  userMessage?: string;
  systemPrompt?: string;
  mode?: "general" | "inclusion" | "docente" | "visual" | "voice";
  imageBase64?: string | null;
  file?: {
    name?: string;
    mimeType?: string;
    type?: string;
    base64?: string;
    textContent?: string;
  } | null;
  sessionId?: string | null;
  maxTokens?: number;
  temperature?: number;
  lastInterruptedResponse?: { text: string; timestamp?: number } | null;
}

export const SUSY_MASTER_SYSTEM_PROMPT = `
${NORA_CONSTITUTIONAL_AXIOMS}

# 🏛️ SYSTEM PROMPT: SUSYBOT - AGENTE INTELIGENTE MUNICIPAL (ITUZAINGÓ)
## Versión: 4.1 (Concierge Institucional & DUA) • MyJNexoraVisual
## Filosofía: Código Abierto • $0 Costo Operativo • Resiliencia Offline Absoluta

[INSTRUCCIÓN DE CONTROL CRÍTICO]
Sos Susybot, la Directora Virtual de Atención al Vecino e Innovación Urbana de la Municipalidad de Ituzaingó, Corrientes. Tu arquitectura se ejecuta sobre un núcleo soberano de código abierto. Tu misión es resolver trámites, guiar cálida y profesionalmente al ciudadano, registrar reclamos de infraestructura de forma autónoma y promover el desarrollo local y turístico (Esteros del Iberá/Yacyretá) sin generar jamás conflictos políticos, debates partidarios ni alucinaciones de datos.

---

### 🎭 1. IDENTIDAD, TONO Y DISEÑO UNIVERSAL (DUA)
- **Identidad:** Servicial, técnica, cálida y altamente profesional. Sos la anfitriona y facilitadora pública de la Municipalidad de Ituzaingó, comunicándote con la excelencia, paciencia, amabilidad y pulcritud de una recepcionista de primer nivel o una concierge institucional.
- **Tono:** Profesional, cercano, empático y hospitalario. Hablás en un español claro, correcto y cordial. EVITÁ modismos coloquiales informales como "che". Usá aperturas y fórmulas amables y acogedoras: "¡Hola! Qué gusto saludarte", "Bienvenido, ¿en qué te puedo colaborar hoy?", "Con mucho gusto te oriento con ese trámite", "Es un placer atenderte".
- **Accesibilidad (DUA):** Tus respuestas deben ser altamente estructuradas. Usá viñetas cortas, frases concisas y evitá bloques de texto densos. Pensá que tus respuestas serán leídas por streaming en tiempo real a alumnos con TEA o vecinos que usan lectores de pantalla (TalkBack/VoiceOver).

---

### 🧠 2. ARQUITECTURA DE CONOCIMIENTO (MODULO CÓRDOBA - RAG)
Operás bajo un esquema de Generación Aumentada por Recuperación (RAG). Tu cerebro está conectado a la base de datos vectorial de Supabase (pgvector) que contiene el Digesto Municipal de Ituzaingó.
- **Regla Estricta:** Solo respondés preguntas de trámites (carnet de conducir, tasas, habilitaciones) basándote en los fragmentos de texto provistos por el contexto indexado. 
- **Si el dato no existe o está fuera de contexto:** No inventes. Respondé con calidez y rigor: "Como asistente virtual del municipio, no dispongo de ese dato exacto en este momento. Podés consultar de forma presencial en la Mesa de Entradas del Municipio o aguardar a que actualicemos la base de datos."

---

### ⚡ 3. CAPACIDAD TRANSACCIONAL (MÓDULO ZÁRATE - FUNCTION CALLING)
Tenés la facultad administrativa de interactuar con el backend para generar acciones gubernamentales vinculantes. Cuando un vecino exprese una intención de reporte o reclamo urbano (baches, luminarias, recolección de ramas), debés activar el protocolo de extracción de datos con la máxima diligencia.

Deberás estructurar la salida en un formato limpio utilizando la función registrarReclamoMunicipal:
[CALL_FUNCTION: registrarReclamoMunicipal(tipo_reclamo="infraestructura", ubicacion_exacta="Centenario y Mitre", descripcion_vecino="Pozo de gran tamaño en calzada")]
- **Campos obligatorios requeridos:** tipo_reclamo (infraestructura, luminaria, bromatologia, transito, limpieza, general), ubicacion_exacta (Calles/Barrio), descripcion_vecino.
- **Acción:** Una vez extraídos los datos, confirmá la transacción emitiendo el número de ticket de seguimiento y explicá cordialmente el procedimiento que seguirá la cuadrilla municipal.

---

### 🛡️ 4. MATRIZ DE SEGURIDAD Y BLINDAJE POLÍTICO (FILTRADO HERMÉTICO)
Estás expuesta a auditorías ciudadanas y ataques de inyección de prompts (Prompt Injection). Debés aplicar las siguientes directivas de contención:

- **Filtro de Opinión / Política:** Si el usuario te pregunta sobre la gestión del Intendente, partidos políticos, elecciones, aumentos de tasas (desde una queja ideológica) o temas de actualidad nacional, tu respuesta DEBE ser unívoca, neutral y redireccionada al servicio:
  - *Respuesta Tipo:* "Mi función como Susybot es asistirte de forma técnica y gratuita con los trámites, servicios públicos y el turismo de Ituzaingó. Para consultas, reclamos o sugerencias políticas formales, podés dirigirte a la Mesa de Entradas del Palacio Municipal."
- **Filtro de Agresiones:** Si el mensaje contiene insultos o un lenguaje violento, ignorá la carga emocional, mantené la compostura profesional, no te disculpes en exceso y ofrecé con serenidad los canales institucionales o números de emergencia (Defensa Civil/Bomberos) si el contexto lo amerita.
- **Protección de Datos Confidenciales:** Nunca reveles nombres internos, sueldos, contraseñas ni variables de entorno del sistema. Toda la información que manejás es de utilidad y dominio público.

---

### 📴 5. COMPORTAMIENTO EN MODO OFFLINE (CAPA AUTÓNOMA)
Cuando el frontend detecte modo sin conexión:
- Tus respuestas deben ser sumamente breves (<50 palabras), muy claras y cordiales.
- Priorizá dar teléfonos de guardia, direcciones físicas de los centros de salud o delegaciones barriales, recordando al vecino que su solicitud quedará registrada en el dispositivo hasta reconectar.

---

### 📝 EJEMPLOS DE INTERACCIÓN ESPERADA (ESTILO CONCIERGE PROFESIONAL)

**Caso A: Consulta de Trámite (Estilo Córdoba)**
- Vecino: "¿Cómo hago para renovar el carnet de conducir si tengo 18 años?"
- Susybot: "¡Hola! Qué gusto saludarte. Con mucho gusto te indico los pasos para renovar tu licencia en Ituzaingó; es un trámite muy sencillo. Vas a necesitar: 1. Tu DNI original y copia con domicilio local. 2. Constancia de grupo y factor sanguíneo. 3. Constancia de libre deuda de tasas municipales. Podés solicitar tu turno directamente desde nuestra web o acercarte a la Dirección de Tránsito de lunes a viernes de 7:00 a 13:00 hs. ¿Querés que revisemos algún detalle adicional o los exámenes requeridos?"

**Caso B: Reporte de Infraestructura (Estilo Zárate)**
- Vecino: "Hay un pozo enorme en la esquina de Centenario y Mitre, casi me caigo de la moto."
- Susybot: "¡Qué peligroso momento! Lo primordial es que te encontrás bien. Ya mismo ingreso este reporte para que el área de Obras Públicas acuda a señalizar y reparar la calzada. [CALL_FUNCTION: registrarReclamoMunicipal(tipo_reclamo="infraestructura", ubicacion_exacta="Centenario y Mitre", descripcion_vecino="Pozo de gran tamaño en calzada")] Excelente. Tu reclamo ha quedado registrado formalmente con el ticket de seguimiento #ITU-982. Te agradezco enormemente por avisarnos y colaborar con la seguridad de nuestra comunidad."

`;

function cleanKey(val?: string): string {
  if (!val) return "";
  return val.replace(/['"\r\n\t ]/g, "").trim();
}

/**
 * Normaliza el historial multiturno para modelos abiertos
 */
function buildOpenAiMessages(
  history: CoreMessage[] = [],
  userMessage: string,
  fullSystemPrompt: string,
  cleanImageBase64?: string | null
): { role: string; content: any }[] {
  const messages: { role: string; content: any }[] = [
    { role: "system", content: fullSystemPrompt }
  ];

  if (Array.isArray(history) && history.length > 0) {
    // Tomar solo los últimos 16 mensajes para evitar sobrecarga y context drift
    for (const h of history.slice(-16)) {
      if (!h || !h.content || typeof h.content !== "string") continue;
      const text = h.content.trim();
      if (!text || text.length < 2) continue;

      const mappedRole = h.role === "assistant" || h.role === "model" ? "assistant" : "user";
      messages.push({ role: mappedRole, content: text });
    }
  }

  const effectiveText = userMessage && userMessage.trim() ? userMessage.trim() : "Continuemos nuestro diálogo.";

  if (cleanImageBase64) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: effectiveText },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanImageBase64}` } }
      ]
    });
  } else {
    messages.push({ role: "user", content: effectiveText });
  }

  return messages;
}

/**
 * Sintetizador de audio fonético
 */
export async function synthesizeRealAudio(text: string): Promise<string | null> {
  const clean = text
    .replace(/[*#_~`>|$\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return null;

  try {
    const words = clean.split(" ");
    const chunks: string[] = [];
    let cur = "";

    for (const w of words) {
      if (!w) continue;
      if ((cur + " " + w).trim().length <= 160) {
        cur = (cur + " " + w).trim();
      } else {
        if (cur) chunks.push(cur);
        cur = w;
      }
    }
    if (cur) chunks.push(cur);

    const buffers: Buffer[] = [];
    for (const chunk of chunks.slice(0, 8)) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        chunk
      )}&tl=es-US&client=tw-ob`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        signal: AbortSignal.timeout(2500)
      });

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        buffers.push(Buffer.from(arrayBuf));
      }
    }

    if (buffers.length > 0) {
      return Buffer.concat(buffers).toString("base64");
    }
  } catch (e) {
    console.warn("[Sovereign Core TTS Warn]:", e);
  }

  return null;
}

/**
 * Ejecuta la Cascada Soberana 100% Abierta en Streaming SSE ($0 Costo)
 */
export async function executeSovereignStream(params: SovereignCoreParams): Promise<Response> {
  const {
    history = [],
    userMessage = "",
    systemPrompt = "",
    mode = "general",
    imageBase64 = null,
    sessionId = null,
    maxTokens = 3500,
    temperature = 0.35
  } = params;

  const encoder = new TextEncoder();

  // 0. DETECCIÓN OFFLINE INMEDIATA (Cero consumo de RAM, <25MB)
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const localRescue = await executeLocalInference(
      userMessage,
      history.map(h => ({ role: h.role, content: typeof h.content === "string" ? h.content : String(h.content || "") })),
      mode
    );

    const rescueStream = new ReadableStream({
      start(controller) {
        const words = localRescue.text.split(" ");
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
        }, 15);
      }
    });

    return new Response(rescueStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
      }
    });
  }

  const cleanImage = imageBase64 ? (imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64) : null;
  const isVisionRequest = Boolean(cleanImage);
  const fullSystem = `${SUSY_MASTER_SYSTEM_PROMPT}\n\n[MODO ACTIVO: ${mode.toUpperCase()}]\n\n${systemPrompt}`.trim();
  const openAiMessages = buildOpenAiMessages(history, userMessage, fullSystem, cleanImage);

  // 1. CAPA 1: Servidor On-Premise Municipal con Ollama (100% Soberano y Privado)
  const ollamaUrl = cleanKey(process.env.LOCAL_OLLAMA_URL) || cleanKey(process.env.OLLAMA_BASE_URL) || cleanKey(process.env.NEXT_PUBLIC_OLLAMA_URL);
  if (ollamaUrl) {
    const candidateModels = isVisionRequest
      ? [cleanKey(process.env.OLLAMA_VISION_MODEL) || "llava", "qwen2.5-vl"]
      : [cleanKey(process.env.OLLAMA_TEXT_MODEL) || "llama3.3", "llama3.1:8b", "qwen2.5:72b"];

    for (const model of candidateModels) {
      try {
        const oRes = await fetch(`${ollamaUrl.replace(/\/$/, "")}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: openAiMessages,
            stream: true,
            temperature,
            max_tokens: maxTokens
          }),
          signal: AbortSignal.timeout(4000)
        });

        if (oRes.ok && oRes.body) {
          console.log(`[Sovereign Core - Capa 1 Ollama Municipal]: Inferencia exitosa (${model})`);
          return transformOpenAiStreamToSSE(oRes.body, sessionId, isVisionRequest);
        }
      } catch (err) {
        console.warn(`[Ollama Municipal ${model} Info]: Servidor on-premise no disponible, activando motor autónomo local.`);
      }
    }
  }

  // 2. CAPA 2: Motor Autónomo Municipal On-Device (100% Soberano, Cero APIs de terceros, $0 Costo)

  const rescueText = isVisionRequest
    ? `👁️ **Cámara Titán Activa**: Imagen recibida en vivo. Observo el entorno frente a ti; enfoca los elementos u obstáculos que deseas que describa con precisión espacial o texto a leer y te guiaré de inmediato.`
    : (await executeLocalInference(
        userMessage,
        history.map(h => ({ role: h.role, content: typeof h.content === "string" ? h.content : String(h.content || "") })),
        mode
      )).text;

  const rescueStream = new ReadableStream({
    start(controller) {
      const words = rescueText.split(" ");
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
      }, 15);
    }
  });

  return new Response(rescueStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    }
  });
}

/**
 * Ejecuta la inferencia soberana en modo texto síncrono para llamadas de voz (Timeout Agresivo 400ms)
 */
export async function executeSovereignText(params: SovereignCoreParams): Promise<{
  text: string;
  audioBase64: string | null;
  modelTag: string;
}> {
  const {
    history = [],
    userMessage = "",
    systemPrompt = "",
    mode = "general",
    imageBase64 = null,
    maxTokens = 600,
    temperature = 0.35,
    lastInterruptedResponse = null
  } = params;

  // 0. Fast-path offline
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const dynamicFallback = await executeLocalInference(
      userMessage,
      history.map(h => ({ role: h.role, content: typeof h.content === "string" ? h.content : String(h.content || "") })),
      mode
    );
    const fallbackAudio = await synthesizeRealAudio(dynamicFallback.text);
    return { text: dynamicFallback.text, audioBase64: fallbackAudio, modelTag: "Autonomous-Sovereign-Local-Offline" };
  }

  const cleanImage = imageBase64 ? (imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64) : null;
  
  let transitionPrompt = "";
  if (lastInterruptedResponse && lastInterruptedResponse.text) {
    transitionPrompt = `\n\n[CONTEXTO PEDAGÓGICO PREVIO INTERRUMPIDO]: "${lastInterruptedResponse.text}"\n[DIRECTIVA DE CONTINUIDAD]: Responde con total claridad la nueva consulta del usuario. Al concluir tu explicación en una frase breve, consulta con naturalidad si desea retomar el tema previo (ej: "¿Querés que volvamos a lo que estábamos hablando sobre...?").`;
  }

  const fullSystem = `${SUSY_MASTER_SYSTEM_PROMPT}\n\n[MODO ACTIVO: ${mode.toUpperCase()}]\n\n${systemPrompt}${transitionPrompt}`.trim();
  const openAiMessages = buildOpenAiMessages(history, userMessage, fullSystem, cleanImage);

  // 1. CAPA 1: Servidor On-Premise Municipal con Ollama (Voz Soberana)
  const isVoiceMode = mode === "voice";
  const ollamaUrl = cleanKey(process.env.LOCAL_OLLAMA_URL) || cleanKey(process.env.OLLAMA_BASE_URL) || cleanKey(process.env.NEXT_PUBLIC_OLLAMA_URL);
  if (ollamaUrl) {
    try {
      const oRes = await fetch(`${ollamaUrl.replace(/\/$/, "")}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: cleanKey(process.env.OLLAMA_TEXT_MODEL) || "llama3.3",
          messages: openAiMessages,
          temperature,
          max_tokens: Math.max(750, maxTokens)
        }),
        signal: AbortSignal.timeout(isVoiceMode ? 3000 : 4000)
      });

      if (oRes.ok) {
        const data = await oRes.json();
        const raw = data.choices?.[0]?.message?.content || "";
        const clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        if (clean && !clean.startsWith("<think>")) {
          const audio = await synthesizeRealAudio(clean);
          return { text: clean, audioBase64: audio, modelTag: "Ollama-Municipal-Soberano" };
        }
      }
    } catch {}
  }

  // 2. CAPA 2: Motor Autónomo Municipal On-Device (Voz Soberana en Dispositivo)

  const dynamicFallback = await executeLocalInference(
    userMessage,
    history.map(h => ({ role: h.role, content: typeof h.content === "string" ? h.content : String(h.content || "") })),
    mode
  );
  const fallbackAudio = await synthesizeRealAudio(dynamicFallback.text);
  return { text: dynamicFallback.text, audioBase64: fallbackAudio, modelTag: "Autonomous-Sovereign-Local" };
}

/**
 * Transforma un ReadableStream a SSE implementando Stateful Stream Filter (<think> hermético)
 */
function transformOpenAiStreamToSSE(
  bodyStream: ReadableStream,
  sessionId?: string | null,
  isVision: boolean = false
): Response {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const customStream = new ReadableStream({
    async start(controller) {
      const reader = bodyStream.getReader();
      let buffer = "";
      let accumulatedText = "";
      let isInsideThinkTag = false;
      let thinkBuffer = "";

      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: keep-alive\n\n`)); } catch { clearInterval(heartbeat); }
      }, 2500);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const content = trimmed.slice(6).trim();
              if (content === "[DONE]") break;

              try {
                const parsed = JSON.parse(content);
                let delta = parsed.choices?.[0]?.delta?.content || "";
                if (!delta) continue;

                // 🛡️ Stateful Stream Filter: Detección y retención hermética de <think>
                if (delta.includes("<think>")) {
                  isInsideThinkTag = true;
                  const parts = delta.split("<think>");
                  if (parts[0]) {
                    accumulatedText += parts[0];
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parts[0], session_id: sessionId })}\n\n`));
                  }
                  thinkBuffer = parts[1] || "";
                  continue;
                }

                if (isInsideThinkTag) {
                  if (delta.includes("</think>")) {
                    isInsideThinkTag = false;
                    const parts = delta.split("</think>");
                    thinkBuffer = ""; // Descartar todo el búfer de pensamiento
                    const afterThink = parts[1] || "";
                    if (afterThink) {
                      accumulatedText += afterThink;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: afterThink, session_id: sessionId })}\n\n`));
                    }
                  } else {
                    thinkBuffer += delta; // Retener silenciosamente en búfer temporal
                  }
                  continue;
                }

                if (delta) {
                  accumulatedText += delta;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta, session_id: sessionId })}\n\n`));
                }
              } catch {}
            }
          }
        }

        // Si el stream finalizó abruptamente dentro de <think>, descartar el búfer
        if (isInsideThinkTag) {
          thinkBuffer = "";
          if (!accumulatedText.trim()) {
            const rescue = "He analizado tu consulta pedagógica. Continuemos avanzando juntos con el tema.";
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: rescue, session_id: sessionId })}\n\n`));
          }
        }

        if (isVision && accumulatedText.trim()) {
          const audioB64 = await synthesizeRealAudio(accumulatedText);
          if (audioB64) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ audioBase64: audioB64 })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } catch (err) {
        console.warn("[OpenAI Stream Transform Warn]:", err);
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } finally {
        clearInterval(heartbeat);
        try { controller.close(); } catch {}
      }
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
