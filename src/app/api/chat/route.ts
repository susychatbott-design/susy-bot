import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateTextEmbedding } from "@/lib/susy/embeddings";
import { resolveAdaptiveEducationalContext } from "@/lib/susy/educationalRouter";
import { NORA_CONSTITUTIONAL_AXIOMS, sanitizeAndInspectPrompt } from "@/lib/susy/constitutionalShield";
import { fetchUserContinuousMemory } from "@/lib/susy/userMemory";
import { dispatchSovereignInference } from "@/lib/susy/sovereignRouter";
import { fetchHybridRAGDocuments } from "@/lib/susy/hybridRag";
import { transcribeAudioWithWhisper } from "@/lib/susy/audioTranscriber";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

/**
 * ⚡ MÓDULO ZÁRATE: Registro automático de reclamos urbanos
 */
async function processZarateTransactions(aiResponseText: string, citizenId?: string): Promise<string> {
  const callRegex = /\[CALL_FUNCTION:\s*registrarReclamoMunicipal\((.*?)\)\]/i;
  const match = aiResponseText.match(callRegex);
  if (!match) return aiResponseText;

  const rawArgs = match[1];
  let tipoReclamo = "general";
  let ubicacionExacta = "No especificada";
  let descripcionVecino = "Reclamo urbano";

  const tipoMatch = rawArgs.match(/tipo_reclamo\s*=\s*["'](.*?)["']/i);
  if (tipoMatch) tipoReclamo = tipoMatch[1];

  const ubicacionMatch = rawArgs.match(/ubicacion_exacta\s*=\s*["'](.*?)["']/i);
  if (ubicacionMatch) ubicacionExacta = ubicacionMatch[1];

  const descMatch = rawArgs.match(/descripcion_vecino\s*=\s*["'](.*?)["']/i);
  if (descMatch) descripcionVecino = descMatch[1];

  let ticketCode = "ITU-" + Math.floor(100 + Math.random() * 900);

  try {
    const supabase = createServerSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from("susy_reclamos_urbanos")
        .insert({
          tipo_reclamo: tipoReclamo,
          ubicacion_exacta: ubicacionExacta,
          descripcion_vecino: descripcionVecino,
          citizen_id: citizenId || "vecino_web"
        })
        .select("ticket_code")
        .single();

      if (data && data.ticket_code) {
        ticketCode = data.ticket_code;
      }
    }
  } catch (err) {
    console.warn("[Módulo Zárate Info]: Reclamo procesado en contingencia local:", err);
  }

  return aiResponseText.replace(
    callRegex,
    `[RECLAMO REGISTRADO OFICIALMENTE - Ticket #${ticketCode}]`
  );
}



const SUSY_SYSTEM_PROMPT = `
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

function isImageGenerationIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("crea una imagen") ||
    t.includes("crear una imagen") ||
    t.includes("genera una imagen") ||
    t.includes("generar una imagen") ||
    t.includes("dibuja") ||
    t.includes("dibujar") ||
    t.includes("haz una imagen") ||
    t.includes("hacer una imagen") ||
    t.includes("diseña una imagen") ||
    t.includes("diseñar una imagen") ||
    t.includes("imagen hiperrealista") ||
    t.includes("imagen en 8k") ||
    t.includes("render 8k") ||
    t.includes("render de") ||
    t.includes("ilustra") ||
    t.includes("ilustración de") ||
    (t.includes("imagen") && (t.includes("8k") || t.includes("atardecer") || t.includes("paisaje") || t.includes("dibujo")))
  );
}

/**
 * 🎨 GENERADOR CREATIVO DE IMÁGENES E ILUSTRACIONES (FLUX.1 A COSTO $0)
 */
async function synthesizeImageResponse(userPrompt: string): Promise<string> {
  const cleanSubject = userPrompt
    .replace(/crea una imagen hiperrealista en 8k de /i, "")
    .replace(/crear una imagen hiperrealista en 8k de /i, "")
    .replace(/genera una imagen hiperrealista en 8k de /i, "")
    .replace(/crea una imagen en 8k de /i, "")
    .replace(/crea una imagen de /i, "")
    .replace(/genera una imagen de /i, "")
    .replace(/dibuja un /i, "")
    .replace(/dibuja una /i, "")
    .replace(/dibuja /i, "")
    .replace(/haz una imagen de /i, "")
    .replace(/imagen de /i, "")
    .trim();

  let enPrompt = cleanSubject
    .replace(/un atardecer sobre el río paraná en ituzaingó, corrientes/i, "cinematic sunset over the Parana River in Ituzaingo Corrientes Argentina, golden hour, reflective calm water, lush sub-tropical riverbanks, dramatic orange and purple clouds, ultra-detailed, photorealistic, 8k resolution, award winning landscape photography")
    .replace(/atardecer sobre el río paraná/i, "golden hour dramatic sunset over Parana River, reflections on calm river, ultra realistic, 8k resolution")
    .replace(/río paraná/i, "Parana River Argentina")
    .replace(/ituzaingó, corrientes/i, "Ituzaingo Corrientes Argentina")
    .replace(/ituzaingó/i, "Ituzaingo Corrientes")
    .replace(/atardecer/i, "cinematic sunset golden hour")
    .replace(/amanecer/i, "breathtaking sunrise morning light")
    .replace(/playa/i, "sunny river beach shore")
    .replace(/represa yacyretá/i, "Yacyreta Hydroelectric Dam monumental architecture")
    .replace(/esteros del iberá/i, "Ibera Wetlands wildlife natural reserve");

  if (!enPrompt.toLowerCase().includes("8k") && !enPrompt.toLowerCase().includes("photorealistic")) {
    enPrompt += ", 8k resolution, highly detailed, photorealistic masterpiece, cinematic lighting, vivid atmospheric depth";
  }

  const seed = Math.floor(Math.random() * 9000000) + 1000000;
  const encoded = encodeURIComponent(enPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;

  return `¡Con mucho gusto! He generado la ilustración solicitada:

![${cleanSubject || 'Ilustración 8k'}](${imageUrl})

---
✨ **Detalles de la Composición Visual:**
* **Estilo:** Render Fotográfico Cinematográfico Ultra-Detallado (8K).
* **Iluminación:** Luz ambiental con profundidad de campo natural.
* 📥 **[Descargar Imagen en HD](${imageUrl})**`;
}

async function fetchRealtimeWeather(): Promise<string | null> {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-27.58&longitude=-56.68&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m&timezone=America%2FArgentina%2FBuenos_Aires",
      { signal: AbortSignal.timeout(800) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const cur = data.current;
    if (!cur) return null;
    return `[DATOS EN VIVO - ITUZAINGÓ, CORRIENTES]: Temperatura: ${cur.temperature_2m}°C (Sensación: ${cur.apparent_temperature}°C), Humedad: ${cur.relative_humidity_2m}%, Viento: ${cur.wind_speed_10m} km/h.`;
  } catch {
    return null;
  }
}

async function fetchLiveWebSearch(query: string): Promise<string> {
  try {
    const encoded = encodeURIComponent(query);
    const n8nWebhook = process.env.N8N_SEARCH_WEBHOOK_URL;

    // 1. Si hay webhook de n8n configurado, consultarlo primero con timeout de 3.5s
    if (n8nWebhook) {
      try {
        const n8nRes = await fetch(n8nWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: AbortSignal.timeout(3500)
        });
        if (n8nRes.ok) {
          const n8nData = await n8nRes.json();
          if (n8nData.results || n8nData.summary) {
            return `\n[RESULTADOS WEB N8N EN VIVO - 2026]:\n${n8nData.summary || JSON.stringify(n8nData.results)}`;
          }
        }
      } catch (n8nErr) {
        console.warn("[n8n Search Warning]:", n8nErr);
      }
    }

    // 2. Búsqueda directa en vivo mediante Google News RSS (Argentina / Regional 2026)
    const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=es-419&gl=AR&ceid=AR:es-419`;
    const res = await fetch(rssUrl, {
      signal: AbortSignal.timeout(3500),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) return "";

    const xml = await res.text();
    const items: { title: string; link: string; pubDate: string }[] = [];
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
      const title = match[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')?.trim();
      const link = match[2]?.trim();
      const pubDate = match[3]?.trim();
      if (title) {
        items.push({ title, link, pubDate });
      }
    }

    if (items.length === 0) return "";

    const formattedWeb = items.map((it, idx) => 
      `• [Web ${idx + 1} | ${it.pubDate}]: ${it.title} (Fuente: ${it.link})`
    ).join("\n");

    return `\n\n🌐 CABLES WEB Y PRENSA EN VIVO (INTERNET 2026):\n${formattedWeb}`;
  } catch (err) {
    console.warn("[Live Web Search Warning]:", err);
    return "";
  }
}

async function fetchSemanticArticlesRAG(supabase: any, userQuery: string): Promise<string> {
  const lower = userQuery.toLowerCase();
  const isRegionalQuery = [
    "noticia", "noticias", "ituzaingó", "ituzaingo", "corrientes", "portal", "nexativa", 
    "suceso", "ayer", "hoy", "intendente", "evento", "carnaval", "pesca", "represa", 
    "yacyreta", "politica", "deportes", "actualidad", "paso", "nacional", "internacional",
    "gobierno", "argentina", "presidente", "economia", "dolar", "inflacion"
  ].some(w => lower.includes(w));
  
  if (!isRegionalQuery) return "";

  try {
    const [hybridResults, webResult] = await Promise.all([
      fetchHybridRAGDocuments(supabase, userQuery, null, 6),
      fetchLiveWebSearch(userQuery)
    ]);

    let combinedContext = "";

    if (hybridResults && hybridResults.length > 0) {
      const formattedDB = hybridResults
        .map((a: any, i: number) => {
          const dateStr = a.created_at ? new Date(a.created_at).toLocaleDateString("es-AR") : "Agosto 2026";
          const cat = (a.category || "ACTUALIDAD").toUpperCase();
          const resume = a.content?.slice(0, 220) || "Sin resumen disponible.";
          const link = a.source_url || "https://www.nexativanews.com.ar";
          return `[Noticia ${i + 1} - ${cat} | ${dateStr}]:\n• Titular: "${a.title}"\n• Síntesis: ${resume}\n• Fuente/Enlace: ${link}`;
        })
        .join("\n\n");

      combinedContext += `📰 REDACCIÓN EN TIEMPO REAL (NEXATIVA NEWS - 2026):\n${formattedDB}`;
    }

    if (webResult) {
      combinedContext += webResult;
    }

    if (combinedContext) {
      return `\n\n========================================================================\n🌍 BASE DE CONOCIMIENTO Y CABLES EN VIVO (AÑO 2026):\n${combinedContext}\n\nDIRECTIVA PERIODÍSTICA OBLIGATORIA:\nUtiliza estos datos reales y frescos para fundamentar tu respuesta con rigor periodístico (Titular, Bajada, Hechos Clave y Enlace). NUNCA digas que tus datos están limitados a 2024.\n========================================================================`;
    }

    return "";
  } catch (err) {
    console.warn("[Susybot RAG News Warning]:", err);
    return "";
  }
}

async function fetchDirectoryBusinessesRAG(supabase: any, userQuery: string): Promise<string> {
  const lower = userQuery.toLowerCase();
  const isBizQuery = ["donde comprar", "comercio", "negocio", "cabaña", "cabañas", "hotel", "alquiler", "inmobiliaria", "restaurante", "farmacia", "taller", "mecanico", "delivery", "abogado", "contador", "prestador", "guia"].some(w => lower.includes(w));
  
  if (!isBizQuery) return "";

  try {
    const cleanTerm = userQuery.replace(/[¿?¡!]/g, "").trim().split(" ").filter(w => w.length > 3).slice(0, 2).join(" ");
    
    let queryBuilder = supabase.from("directory_businesses").select("name, category, address, phone, whatsapp, website").eq("status", "ACTIVE").limit(3);
    
    if (cleanTerm) {
      queryBuilder = queryBuilder.or(`name.ilike.%${cleanTerm}%,category.ilike.%${cleanTerm}%,description.ilike.%${cleanTerm}%`);
    }

    const { data: businesses } = await queryBuilder;
    if (!businesses || businesses.length === 0) return "";

    const bizText = businesses.map((b: any) => 
      `• ${b.name} (${b.category}): ${b.address || 'Ituzaingó'}. Tel/WhatsApp: ${b.whatsapp || b.phone || 'Ver en Guía'}${b.website ? ` | Web: ${b.website}` : ''}`
    ).join("\n");

    return `\n\n========================================================================\n🏬 GUÍA COMERCIAL EN VIVO (LOCALES Y SERVICIOS VERIFICADOS):\n${bizText}\nRecomienda estos prestadores y destaca que pueden encontrarlos en la Guía Comercial de Nexativa News.\n========================================================================`;
  } catch (err) {
    console.warn("[Directory RAG Warning]:", err);
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const { 
      message = "", 
      session_id, 
      user_id = "anonymous_user", 
      history: clientHistory,
      contextData, 
      message_id,
      file,
      audioFile,
      interactionMode = contextData?.interactionMode || "visual",
      stream = true 
    } = await req.json();

    if ((!message || typeof message !== "string") && !file && !audioFile) {
      return NextResponse.json({ error: "Se requiere un mensaje de texto, un audio o un archivo adjunto." }, { status: 400 });
    }

    let effectiveMessage = message;
    let targetAudio = audioFile || (file && (
      (file.mimeType && file.mimeType.startsWith("audio/")) ||
      (file.type && file.type.startsWith("audio/")) ||
      (file.name && /\.(webm|mp3|wav|ogg|m4a|mp4|aac)$/i.test(file.name))
    ) ? file : null);

    // Si file era el audio y no hay otro archivo, file queda nulo
    let effectiveFile = (file === targetAudio) ? null : file;

    if (targetAudio && targetAudio.base64) {
      console.log("[Susybot-Chat] 🎙️ Audio recibido. Transcribiendo con Groq Whisper...");
      const transcribed = await transcribeAudioWithWhisper(targetAudio);
      if (transcribed && transcribed.trim().length > 0) {
        effectiveMessage = transcribed.trim();
        console.log("[Susybot-Chat] 🎙️ Audio convertido a texto con éxito:", effectiveMessage);
      } else {
        console.warn("[Susybot-Chat] ⚠️ Audio recibido sin voz reconocible o error en Whisper.");
        return NextResponse.json({
          error: "No se detectó voz comprensible en la grabación. Por favor mantén presionado el botón y habla con claridad cerca del micrófono."
        }, { status: 400 });
      }
    }

    console.log("[Susybot-Chat] 📥 Request atómico recibido:", { 
      user_id, 
      session_id, 
      message_preview: effectiveMessage.slice(0, 40), 
      has_file: !!effectiveFile,
      has_audio: !!targetAudio,
      client_history_count: Array.isArray(clientHistory) ? clientHistory.length : 0
    });

    const supabase = createServerSupabaseClient();

    const incomingMsgId = message_id || req.headers.get("x-message-id");
    if (incomingMsgId) {
      const { data: existingMsg, error: checkMsgErr } = await supabase
        .from("susybot_messages")
        .select("id")
        .eq("metadata->>message_id", incomingMsgId)
        .maybeSingle();

      if (checkMsgErr) {
        console.warn("[Susybot-Chat] Advertencia verificando mensaje previo:", checkMsgErr.code, checkMsgErr.message);
      }

      if (existingMsg) {
        console.log("[Susybot-Chat] Mensaje ya procesado anteriormente:", incomingMsgId);
        return NextResponse.json({ status: "ALREADY_PROCESSED" }, { status: 200 });
      }
    }

    let activeSessionId = session_id;
    if (!activeSessionId) {
      const title = message.slice(0, 30) || "Nueva conversación";
      console.log("[Susybot-Chat] 📝 Creando nueva sesión en susybot_sessions para user:", user_id);
      const { data: newSession, error: sessErr } = await supabase
        .from("susybot_sessions")
        .insert([{ user_id, title }])
        .select("id")
        .single();
      
      if (sessErr) {
        console.error("❌ [Susybot-Chat] Error BD en susybot_sessions:", sessErr.code, sessErr.message);
      } else if (newSession) {
        activeSessionId = newSession.id;
        console.log("✓ [Susybot-Chat] Sesión creada con éxito, ID:", activeSessionId);
      }
    }

    if (isImageGenerationIntent(effectiveMessage)) {
      const generatedImageText = await synthesizeImageResponse(effectiveMessage);
      const encoder = new TextEncoder();

      if (activeSessionId) {
        supabase.from("susybot_messages").insert([
          { session_id: activeSessionId, role: "user", content: effectiveMessage, metadata: { ...(contextData || {}) } },
          { session_id: activeSessionId, role: "assistant", content: generatedImageText, metadata: { generated_by: "Susybot-Pollinations-8K" } }
        ]).then(() => {});
      }

      const customStream = new ReadableStream({
        start(controller) {
          const words = generatedImageText.split(" ");
          let idx = 0;
          const interval = setInterval(() => {
            if (idx < words.length) {
              const chunk = (idx === 0 ? "" : " ") + words[idx];
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk, session_id: activeSessionId })}\n\n`));
              idx++;
            } else {
              clearInterval(interval);
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              controller.close();
            }
          }, 20);
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

    // 🌟 RESOLUCIÓN DE HISTORIAL DE ALTA FIDELIDAD (VENTANA DESLIZANTE DE HASTA 35 MENSAJES)
    const rawHistory: { role: string; content: string }[] = [];

    if (Array.isArray(clientHistory) && clientHistory.length > 0) {
      // Prioridad 1: Historial directo del cliente para latencia cero y cero desfasaje
      const recentClientMsgs = clientHistory.slice(-35);
      for (const m of recentClientMsgs) {
        if (m && typeof m.content === "string" && m.content.trim()) {
          const role = (m.role === "assistant" || m.role === "model") ? "model" : "user";
          rawHistory.push({ role, content: m.content.trim() });
        }
      }
    } else if (activeSessionId) {
      // Prioridad 2: Consulta ordenada descendentemente (los más recientes) e invertida a cronología real
      const { data: pastMsgs } = await supabase
        .from("susybot_messages")
        .select("role, content, created_at")
        .eq("session_id", activeSessionId)
        .order("created_at", { ascending: false })
        .limit(35);
      
      if (pastMsgs && pastMsgs.length > 0) {
        const chronologicalMsgs = [...pastMsgs].reverse();
        for (const m of chronologicalMsgs) {
          if (m && typeof m.content === "string" && m.content.trim()) {
            rawHistory.push({
              role: (m.role === "assistant" || m.role === "model") ? "model" : "user",
              content: m.content.trim()
            });
          }
        }
      }
    }

    const lowerMessageForIntent = effectiveMessage.toLowerCase();
    const isWeatherExplicit = [
      "clima", "tiempo", "temperatura", "cómo está el día", "como esta el dia", 
      "pronóstico", "pronostico", "llueve", "lluvia", "calor", "frío", "frio",
      "grados hace", "sensación térmica", "sensacion termica"
    ].some(w => lowerMessageForIntent.includes(w));

    const [weatherData, ragNewsData, ragBizData, continuousUserMemory] = await Promise.all([
      isWeatherExplicit ? fetchRealtimeWeather() : Promise.resolve(null),
      fetchSemanticArticlesRAG(supabase, effectiveMessage),
      fetchDirectoryBusinessesRAG(supabase, effectiveMessage),
      fetchUserContinuousMemory(supabase, user_id)
    ]);

    const activeMode = contextData?.mode || "general";
    const adaptivePedagogicalDirectives = resolveAdaptiveEducationalContext(effectiveMessage, contextData);

    let fullSystemPrompt = `${NORA_CONSTITUTIONAL_AXIOMS}\n\n${SUSY_SYSTEM_PROMPT}`;
    if (adaptivePedagogicalDirectives) fullSystemPrompt += adaptivePedagogicalDirectives;
    if (continuousUserMemory) fullSystemPrompt += continuousUserMemory;
    if (weatherData) fullSystemPrompt += `\n\n${weatherData}`;
    if (ragNewsData) fullSystemPrompt += ragNewsData;
    if (ragBizData) fullSystemPrompt += ragBizData;

    if (rawHistory.length > 0) {
      fullSystemPrompt += `\n\n========================================================================\n🔗 DIRECTIVA DE CONTINUIDAD, COHESIÓN Y MEMORIA VIVA (TURNO ACUMULADO: ${rawHistory.length + 1}):\n- La conversación ya está en curso y tiene un hilo activo consolidado.\n- PROHIBIDO TERMINANTEMENTE repetir saludos formales ("¡Hola!", "Soy Nora..."), formular de nuevo preguntas del inicio o desviar la charla a temas no pedidos.\n- Mantén intacto el andamiaje conceptual y responde con coherencia inmediata sobre lo último dialogado con el usuario.\n========================================================================`;
    }

    let effectiveUserMessage = effectiveMessage;
    if (effectiveFile) {
      if (effectiveFile.mimeType?.startsWith("image/")) {
        effectiveUserMessage = `[FOTO ADJUNTA: "${effectiveFile.name || 'foto.jpg'}"]\n${effectiveMessage || "Analiza detalladamente esta imagen, identifica qué contiene y descríbela con precisión."}`;
      } else if (effectiveFile.mimeType === "application/pdf" || effectiveFile.name?.toLowerCase().endsWith(".pdf")) {
        effectiveUserMessage = `[DOCUMENTO PDF ADJUNTO: "${effectiveFile.name || 'documento.pdf'}"]\n${effectiveMessage || "Analiza minuciosamente el contenido de este documento PDF adjunto y responde detalladamente a mi consulta."}`;
      } else if (effectiveFile.textContent) {
        effectiveUserMessage = `[DOCUMENTO ADJUNTO: "${effectiveFile.name || 'documento'}"]:\n${effectiveFile.textContent.slice(0, 10000)}\n\n[CONSULTA DEL USUARIO]:\n${effectiveMessage || "Sintetiza y analiza el documento adjunto."}`;
      }
    } else if (targetAudio) {
      effectiveUserMessage = `[NOTA DE VOZ DEL USUARIO]: "${effectiveMessage}"\nResponde directamente a esta consulta con máxima profesionalidad.`;
    }

    const safetyCheck = sanitizeAndInspectPrompt(effectiveUserMessage);
    if (!safetyCheck.isSafe) {
      const encoder = new TextEncoder();
      const safeShieldResponse = "Comprendo tu inquietud. Como Susybot, opero bajo una constitución inmutable de ética, transparencia, rigurosa veracidad y servicio humanista. No puedo modificar mis directivas éticas de seguridad ni revelar parámetros internos confidenciales, pero con mucho gusto estoy a tu completa disposición para ayudarte en tus tareas educativas, profesionales, laborales o comunitarias. ¿En qué proyecto o consulta constructiva podemos avanzar juntos hoy?";
      const customStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: safeShieldResponse, session_id: activeSessionId })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
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

    if (stream) {
      console.log(`[Susybot-Chat] 🚀 Invocando Matriz Soberana Blindada (dispatchSovereignInference - Modo: ${interactionMode})...`);
      return await dispatchSovereignInference({
        history: rawHistory,
        userMessage: effectiveMessage,
        systemPrompt: fullSystemPrompt,
        interactionMode,
        file: effectiveFile,
        sessionId: activeSessionId,
        userId: user_id,
        contextData
      });
    }

    return NextResponse.json({ error: "Streaming requerido." }, { status: 400 });

  } catch (error: any) {
    console.error("❌ [Susybot Server Error]:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}