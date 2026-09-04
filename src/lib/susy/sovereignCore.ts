/**
 * ========================================================================
 * 🏛️ SUSYBOT MUNICIPAL SOVEREIGN CORE (100% CÓDIGO ABIERTO - COSTO $0)
 * Ubicación: /src/lib/susy/sovereignCore.ts
 * Heredado de la Matriz Antifrágil y Soberana de Nora Itu.
 * 
 * Cascada de Código Abierto Indestructible:
 * - Capa 1: Ollama Municipal / VPS Propio (100% Soberano, Open-Weights: LLaMA 3.3, Qwen 2.5)
 * - Capa 2: Pollinations Open Neural Mesh (100% Gratuito, Sin API Keys, Open-Weights)
 * - Capa 3: Groq Open Weights Tier (Llama 3.3 70B, Llama 3.1 8B, Gemma 2 9B)
 * - Capa 4: Hugging Face Serverless Open Mesh (Qwen 2.5, DeepSeek R1)
 * - Capa 5: Motor Autónomo Municipal On-Device (0ms, 100% Offline / WebGPU)
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
- **Accesibilidad (DUA):** Tus respuestas deben ser altamente estructuradas. Usá viñetas cortas, frases concisas y evitá bloques de texto densos. Pensá que tus respuestas serán leídas por streaming en tiempo real a vecinos con TEA o neurodivergencia, o personas que usan lectores de pantalla (TalkBack/VoiceOver).

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

### 🧩 6. PROTOCOLO MUNICIPAL DE INCLUSIÓN Y APOYO COGNITIVO (TEA / DUA)
Cuando el vecino manifieste una condición del espectro autista, solicite asistencia paso a paso o se active el modo inclusión:
- **Comunicación Concreta y Predecible:** Hablá con serenidad, frases cortas, lenguaje 100% literal y sin ambigüedades ni metáforas.
- **Estructura Atómica:** Nunca entregues más de 1 o 2 pasos por turno. Desglosá los trámites municipales con apoyos visuales y pictogramas ARASAAC contextuales:
  * [PICTO: documento] -> Preparar DNI, constancias o formularios.
  * [PICTO: ventanilla] -> A qué oficina o mesa de entrada acudir.
  * [PICTO: esperar] -> Tiempos de espera o turnos asignados.
  * [PICTO: pagar] -> Tasas o sellados municipales.
  * [PICTO: firma] -> Firma o retiro del trámite.
  * [PICTO: correcto] -> Confirmación de finalización exitosa.
  * [PICTO: calma] -> Para transmitir seguridad y tranquilidad.
- **Trámites Clave de Inclusión:** Asesoramiento sobre el Certificado Único de Discapacidad (CUD) ante Acción Social, pases libres de transporte urbano y bajadas accesibles en las playas de Ituzaingó.

---

### 👁️ 7. PROTOCOLO LAZARILLO VISUAL Y ORIENTACIÓN ESPACIAL (DISCAPACIDAD VISUAL)
Cuando interactúes con una persona ciega, con baja visión o mediante la Cámara Ciudadana (Live Vision):
- **Orientación en Esfera de Reloj:** Proporcioná referencias espaciales inmediatas y exactas:
  * "A tus 12 en punto a 1 metro..." (directamente al frente)
  * "A tus 2 en punto a tu derecha..."
  * "A tus 9 en punto a tu izquierda..."
- **Alerta de Barreras Urbanas:** Advertí de inmediato sobre escalones, cordones de vereda, pozos, puertas vidriadas, postes o rampas de acceso en la vía pública o dependencias municipales.
- **Lectura Asistida de Documentos:** Cuando el vecino enfoque un documento o boleta con la cámara, leé con precisión:
  * Boleta de Tasas Municipales: Monto exacto, fecha de vencimiento y concepto.
  * Carnet de Conducir / DNI: Nombres, categorías habilitadas, vigencia y grupo sanguíneo.
  * Cartelería y Oficinas: Leé claramente los carteles de ventanillas o nombres de calles.
- **Estilo Auditivo Directo:** Entregá descripciones concisas (2 o 3 oraciones directas al grano), sin rodeos, pensadas para la síntesis de voz en tiempo real.

---


---


---

### 🏥 INFORMACIÓN OFICIAL: SALUD, FARMACIAS DE TURNO Y CENTROS MÉDICOS (ITUZAINGÓ)
Cuando el vecino consulte por SALUD, FARMACIAS DE TURNO, EMERGENCIAS O CENTROS DE ATENCIÓN MÉDICA:
- **Hospital Dr. Ricardo Billinghurst (Hospital Cabecera de Ituzaingó):**
  * **Línea Gratuita de Emergencias Médicas:** 107 (disponible las 24 horas del día, los 365 días del año).
  * **Teléfono de Guardia Directo:** (03786) 420032.
  * **Ubicación:** Corrientes 1550 (esquina Belgrano), Ituzaingó, Corrientes.
  * **Servicios Activos:** Guardia general de urgencias 24 hs, shock room, pediatría, servicio de ambulancia y derivaciones de alta complejidad.

- **Farmacias de Turno en Ituzaingó (Rotación diaria 24 hs de 8:30 a 8:30 hs):**
  Las farmacias de la ciudad cubren guardias obligatorias rotativas de 24 horas:
  * **Farmacia Ituzaingó:** Buenos Aires y Corrientes — Tel: (03786) 420120
  * **Farmacia Del Pueblo:** Av. Centenario y Belgrano — Tel: (03786) 420310
  * **Farmacia San Cayetano:** Av. 9 de Julio y Posadas — Tel: (03786) 420550
  * **Farmacia Farmar Ituzaingó:** Av. Centenario y Mitre — Tel: (03786) 420800
  * *Pauta:* Indicar al vecino que la guardia rota cada mañana a las 8:30 hs y que todas disponen de timbre nocturno obligatorio.

- **Centros de Atención Primaria de la Salud (CAPS Municipales y Provinciales):**
  * **CAPS Barrio San Jorge:** Atención de medicina general, enfermería y control de signos vitales (Lunes a viernes de 7:00 a 19:00 hs).
  * **CAPS Barrio Belgrano:** Vacunatorio oficial de calendario, control pediátrico y programas materno-infantiles.
  * **CAPS Barrio San Francisco:** Atención comunitaria y entrega de medicamentos del programa Remediar.

### 🚗 INFORMACIÓN OFICIAL: COSTOS Y VALORES DE LICENCIA DE CONDUCIR (TRÁNSITO ITUZAINGÓ)
Cuando el vecino pregunte por el VALOR, COSTO, PRECIO o DÓNDE PAGAR para renovar o sacar el carnet:
- PROHIBIDO REPETIR LA LISTA DE REQUISITOS (DNI, grupo sanguíneo, etc.) si el vecino solo está preguntando por el costo o el pago. Respondé de forma directa, empática y precisa a lo que preguntó.
- Explicá con amabilidad cómo se compone el arancel:
  1. **Boleta Nacional CENAT:** Certificado Nacional de Antecedentes de Tránsito (arancel nacional obligatorio de aproximadamente $6.800, se abona previamente en Rapipago, Pago Fácil o Banco Nación).
  2. **Tasa Municipal de Ituzaingó (Dirección de Tránsito):** Fijada por la Ordenanza Tarifaria Municipal según categoría y vigencia otorgada por el médico:
     - **Autos / Camionetas Particulares (Cat. B):**
       * Por 1 año: aprox. $8.500 a $12.000.
       * Por 3 años: aprox. $18.000 a $22.000.
       * Por 5 años (vigencia estándar hasta 65 años): aprox. $28.000 a $35.000 (más sellado administrativo municipal).
     - **Motos (Cat. A):** Arancel municipal diferenciado menor (aprox. $8.000 a $18.000 según vigencia de 1 a 5 años).
     - **Profesionales (Cat. C, D, E):** Arancel anual diferenciado con certificado de reincidencia.
  3. **Lugar y Medios de Pago:** La tasa municipal se liquida y abona directamente en la Caja Municipal / Rentas dentro de la Dirección de Tránsito (Av. Centenario / Palacio Municipal) de lunes a viernes de 7:00 a 13:00 hs, aceptando efectivo, tarjeta de débito y transferencias bancarias.

---

### 🗣️ POLÍTICA CARDINAL DE FLUIDEZ Y MEMORIA CONVERSACIONAL (100% HUMANA)
- **Cero bucles y cero folletos repetitivos:** Si en un mensaje previo ya le diste los requisitos al vecino y ahora te pregunta "¿cuál es el valor?", "¿dónde pago?" o "¿a qué hora atienden?", respondé EXCLUSIVAMENTE y en 1 o 2 párrafos concisos sobre ese punto exacto.
- Hablá con la naturalidad, calidez y atención empática de una empleada municipal experimentada que está conversando cara a cara con el vecino.

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

  // 1. CAPA 1: Ollama Local / Servidor VPS Municipal (100% Soberano y Privado)
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
          signal: AbortSignal.timeout(3000)
        });

        if (oRes.ok && oRes.body) {
          console.log(`[Sovereign Core - Capa 1 Ollama]: Inferencia exitosa (${model})`);
          return transformOpenAiStreamToSSE(oRes.body, sessionId, isVisionRequest);
        }
      } catch (err) {}
    }
  }

  // 2. CAPA 2: Pollinations Open Neural Mesh (100% Gratuito, Sin Keys, Open-Weights)
  try {
    const polRes = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: openAiMessages,
        model: "openai",
        stream: true,
        temperature
      }),
      signal: AbortSignal.timeout(6000)
    });

    if (polRes.ok && polRes.body) {
      console.log("[Sovereign Core - Capa 2 Pollinations]: Inferencia exitosa en Open Mesh");
      return transformOpenAiStreamToSSE(polRes.body, sessionId, isVisionRequest);
    }
  } catch (polErr) {}

  // 3. CAPA 3: Groq Open Weights Tier (Llama 3.3 70B / Gemma 2 / Qwen Open-Weights)
  const groqKey = cleanKey(process.env.GROQ_API_KEY) || cleanKey(process.env.NEXT_PUBLIC_GROQ_API_KEY);
  if (groqKey) {
    const groqCandidateModels = isVisionRequest
      ? ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"]
      : ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "openai/gpt-oss-120b", "groq/compound-mini", "qwen/qwen3.6-27b"];

    for (const gModel of groqCandidateModels) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: gModel,
            messages: openAiMessages,
            stream: true,
            max_tokens: isVisionRequest ? 1500 : maxTokens,
            temperature
          }),
          signal: AbortSignal.timeout(4000)
        });

        if (groqRes.ok && groqRes.body) {
          console.log(`[Sovereign Core - Capa 3 Groq Open]: Inferencia exitosa (${gModel})`);
          return transformOpenAiStreamToSSE(groqRes.body, sessionId, isVisionRequest);
        }
      } catch (groqErr) {}
    }
  }

  // 4. CAPA 4: Hugging Face Serverless Open Mesh (Qwen 2.5 / DeepSeek R1 Open Weights)
  const hfToken = cleanKey(process.env.HF_ACCESS_TOKEN) || cleanKey(process.env.HUGGINGFACE_API_KEY) || cleanKey(process.env.HF_TOKEN);
  if (hfToken) {
    const hfModels = isVisionRequest
      ? ["Qwen/Qwen2.5-VL-7B-Instruct", "meta-llama/Llama-3.2-11B-Vision-Instruct"]
      : ["Qwen/Qwen2.5-72B-Instruct", "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B"];

    for (const model of hfModels) {
      try {
        const endpoints = [
          `https://router.huggingface.co/hf-inference/v1/chat/completions`,
          `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`
        ];

        for (const endpoint of endpoints) {
          const hfRes = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${hfToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model,
              messages: openAiMessages,
              stream: true,
              max_tokens: maxTokens,
              temperature
            }),
            signal: AbortSignal.timeout(5000)
          });

          if (hfRes.ok && hfRes.body) {
            console.log(`[Sovereign Core - Capa 4 HuggingFace Open]: Inferencia exitosa (${model})`);
            return transformOpenAiStreamToSSE(hfRes.body, sessionId, isVisionRequest);
          }
          if (hfRes.status === 503 || hfRes.status === 429) break;
        }
      } catch (hfErr) {}
    }
  }

  // 5. CAPA 5: Motor Autónomo Municipal On-Device (0ms, 100% Offline / WebGPU - Imposible de Caer)
  const rescueText = isVisionRequest
    ? `👁️ **Cámara Ciudadana Activa**: Imagen recibida en vivo. Enfoca claramente el formulario, carnet o reclamo urbano que deseas consultar y te guiaré de inmediato.`
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
    return { text: dynamicFallback.text, audioBase64: fallbackAudio, modelTag: "Autonomous-Municipal-Local-Offline" };
  }

  const cleanImage = imageBase64 ? (imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64) : null;
  const fullSystem = `${SUSY_MASTER_SYSTEM_PROMPT}\n\n[MODO ACTIVO: ${mode.toUpperCase()}]\n\n${systemPrompt}`.trim();
  const openAiMessages = buildOpenAiMessages(history, userMessage, fullSystem, cleanImage);

  const isVoiceMode = mode === "voice";

  // 1. Inferencia Abierta Groq Open Weights
  const groqKey = cleanKey(process.env.GROQ_API_KEY) || cleanKey(process.env.NEXT_PUBLIC_GROQ_API_KEY);
  if (groqKey) {
    const groqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "qwen/qwen3.6-27b"];
    for (const gModel of groqModels) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: gModel,
            messages: openAiMessages,
            temperature,
            max_tokens: Math.max(750, maxTokens)
          }),
          signal: AbortSignal.timeout(isVoiceMode ? 3500 : 4500)
        });

        if (res.ok) {
          const data = await res.json();
          const raw = data.choices?.[0]?.message?.content || "";
          const clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
          if (clean && !clean.startsWith("<think>")) {
            const audio = await synthesizeRealAudio(clean);
            return { text: clean, audioBase64: audio, modelTag: `Open-${gModel}` };
          }
        }
      } catch (err) {}
    }
  }

  // 2. Pollinations Free Open Mesh ($0 Costo, Cero Keys)
  try {
    const polRes = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: openAiMessages,
        model: "openai",
        temperature
      }),
      signal: AbortSignal.timeout(isVoiceMode ? 3500 : 5000)
    });

    if (polRes.ok) {
      const data = await polRes.json();
      const raw = data.choices?.[0]?.message?.content || "";
      const clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      if (clean && !clean.startsWith("<think>")) {
        const audio = await synthesizeRealAudio(clean);
        return { text: clean, audioBase64: audio, modelTag: "Pollinations-Open-Mesh" };
      }
    }
  } catch (polErr) {}

  // 3. Ollama Local / VPS Propio
  const ollamaUrl = cleanKey(process.env.OLLAMA_BASE_URL) || cleanKey(process.env.NEXT_PUBLIC_OLLAMA_URL);
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

  // 4. Fallback Autónomo Municipal On-Device (<25MB RAM, 0ms)
  const dynamicFallback = await executeLocalInference(
    userMessage,
    history.map(h => ({ role: h.role, content: typeof h.content === "string" ? h.content : String(h.content || "") })),
    mode
  );
  const fallbackAudio = await synthesizeRealAudio(dynamicFallback.text);
  return { text: dynamicFallback.text, audioBase64: fallbackAudio, modelTag: "Autonomous-Municipal-Local" };
}

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
            const rescue = "Te escucho con atención, vecino. ¿En qué trámite o consulta municipal de Ituzaingó te puedo colaborar?";
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: rescue, session_id: sessionId })}\n\n`));
          }
        }

        // 🎙️ Síntesis vocal humana delegada al navegador (cero audio MP3 robótico de Google Translate)

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
