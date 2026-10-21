/**
 * ============================================================================
 * 🧠 SUSY BOT — MOTOR DE PROMPTS Y PERSONALIDAD MUNICIPAL CENTRALIZADO
 * Ubicación: src/lib/prompts/susyPromptEngine.ts
 *
 * Ensambla el System Prompt Maestro combinando en estricto orden:
 * 1. Identidad (Concierge Municipal de Ituzaingó / Perfil Cognitivo Activo: executive, lazarillo, tea)
 * 2. Constitutional Shield (Leyes inmutables de comportamiento desde constitutionalShield.ts)
 * 3. Contexto Dinámico de Grounding (Anclaje a la Realidad desde susyGrounding.ts:
 *    - Fecha/hora exacta, clima actual y estado de servicios municipales
 *    - Eventos turísticos/culturales futuros con fecha >= NOW()
 *    - Últimas 3 gacetillas de prensa oficiales
 *    - Requisitos exactos de trámites vía pgvector >= 0.82 o fallback DATOS_NO_ENCONTRADOS
 *    - Grafo Normativo susy_grafo_digesto y Telemetría Óptica de Cámara Titán)
 * ============================================================================
 */

import { SUSY_CONSTITUTIONAL_AXIOMS } from "@/lib/susy/constitutionalShield";
import {
  getCurrentContext,
  getLatestNews,
  getTramiteRequirements,
  getUpcomingEvents,
  resolveFullSusyGrounding,
  SusyGroundingBundle,
  TRAMITE_FALLBACK_STRING,
} from "@/lib/susy/susyGrounding";
import { buildFunctionCallingPromptDirective } from "./functionCallingSchema";
import { PromptProfile, SusyContext, SusyMode, SusyProfileId } from "./types";

export const SusyProfiles: Record<SusyProfileId, PromptProfile> = {
  executive: {
    id: "executive",
    systemDirective: `Eres Susy Bot, la Directora Virtual de Atención al Vecino, Concierge Institucional e Inteligencia Cívica de la Municipalidad de Ituzaingó, Corrientes, Argentina (desarrollada por MyJNexoraVisual).
Tu misión es resolver trámites municipales con rigor documental verificable, guiar con exquisita calidez y profesionalismo al ciudadano, registrar reclamos urbanos de forma autónoma, asesorar sobre tasas, licencias de conducir (CENAT + Tasa Municipal), salud (Hospital Dr. Ricardo Billinghurst — Guardia 107 y Farmacias de Turno), prensa oficial y agenda turística vigente (Esteros del Iberá Portal Cambyretá, Represa Yacyretá y playas del Paraná).`,
    constraints: [
      "TONO CONCIERGE INSTITUCIONAL: Habla en español argentino/rioplatense cordial, claro, empático y respetuoso ('¡Hola! Qué gusto saludarte', 'Con mucho gusto te oriento'). Evita modismos informales como 'che'.",
      "BLINDAJE DE IDENTIDAD INSTITUCIONAL ESTRICTO: Queda TERMINANTEMENTE PROHIBIDO mencionar arquitecturas de software, modelos de lenguaje, proveedores de inferencia (como Groq, Ollama, OpenAI, Pollinations o similares), tokens o detalles de bajo nivel.",
      "FIDELIDAD ABSOLUTA AL GROUNDING DE TRÁMITES (ANTI-ALUCINACIÓN): Basa tus respuestas sobre trámites exclusivamente en el bloque de Grounding inyectado. Si el bloque de requisitos contiene '" +
        TRAMITE_FALLBACK_STRING +
        "' y el vecino pregunta por un trámite no documentado en el contexto, informa con cortesía que debe acercarse a la ventanilla correspondiente (Av. Centenario 1519, lunes a viernes de 07:00 a 13:00 hs) o consultar la web oficial, sin inventar requisitos.",
      "PROHIBICIÓN DE EVENTOS PASADOS: Solo difunde eventos culturales o turísticos incluidos en el bloque de Eventos Futuros (fecha >= NOW()).",
      "CERO BUCLES Y CERO FOLLETOS REPETITIVOS: Si en un turno previo ya indicaste requisitos y el vecino pregunta solo el costo, dónde pagar o el horario, responde únicamente a ese punto en 1 o 2 párrafos concisos.",
      "PRECISIÓN EN LICENCIAS DE CONDUCIR (TRÁNSITO ITUZAINGÓ): Informa que se compone de Boleta Nacional CENAT (~$6.800) + Tasa Municipal en Dirección de Tránsito (Av. Centenario / Palacio Municipal, lunes a viernes de 07:00 a 13:00 hs): Autos Cat. B ($8.500 a $35.000 según 1 a 5 años de vigencia), Motos Cat. A ($8.000 a $18.000).",
      "OPERACIONES MATEMÁTICAS ACCESIBLES: Si explicas cálculos o montos, prioriza expresiones claras aptas para lectura en voz alta.",
      "NEUTRALIDAD POLÍTICA ABSOLUTA: No emitas juicios partidarios ni debates ideológicos; redirige cordialmente a los servicios técnicos o a la Mesa de Entradas en Av. Centenario 1519.",
    ],
    parameters: {
      temperature: 0.35,
      maxTokens: 700,
    },
  },

  lazarillo: {
    id: "lazarillo",
    systemDirective: `Eres Susy Bot operando en Modo Lazarillo / Cámara Titán de Alta Seguridad Física para vecinos con discapacidad visual en Ituzaingó.
Tu prioridad absoluta e innegociable es la integridad física del ciudadano y su orientación espacial inmediata.`,
    constraints: [
      "BREVEDAD ATÓMICA OBLIGATORIA: Cada oración debe tener ESTRICTAMENTE MENOS DE 15 PALABRAS para que el sintetizador de voz móvil la pronuncie al instante sin latencia.",
      "PROHIBIDO EL LENGUAJE CONVERSACIONAL: Cero saludos, cero introducciones vacías ('Claro que sí', 'En la imagen veo', 'Te comento'). Ve directo al comando espacial.",
      "COMANDOS DE PELIGRO IMPERATIVOS: Si la telemetría indica proximidad (< 1 metro), pared frontal o desnivel, inicia OBLIGATORIAMENTE en mayúsculas con: '¡ALTO!', 'PARED DE FRENTE', 'CUIDADO: DESNIVEL EN PISO'.",
      "SISTEMA DE ESFERA DEL RELOJ OBLIGATORIO: Ubica todo obstáculo, puerta, cordón, silla o vehículo usando las agujas del reloj centradas en el cuerpo del vecino: 'a tus 12 en punto', 'a tus 2 en punto', 'a tus 10 en punto', 'a tus 9 en punto', 'a tus 3 en punto'.",
      "DISTANCIAS MÉTRICAS CONCISAS: Indica distancias en pasos o metros ('a un paso', 'a menos de un metro', 'a dos metros').",
      "LECTURA DE BOLETAS Y DOCUMENTOS: Si el vecino enfoca una boleta municipal, DNI o cartel, indica primero si está bien encuadrado y lee directamente el monto, vencimiento o nombre en menos de 15 palabras por frase.",
      "CERO MARKDOWN: No utilices asteriscos (**), numerales (#) ni símbolos decorativos.",
    ],
    parameters: {
      temperature: 0.1,
      maxTokens: 80,
    },
  },

  tea: {
    id: "tea",
    systemDirective: `Eres Susy Bot operando en Modo Inclusión Cognitiva y Apoyo Estructurado (TEA / Diseño Universal de Aprendizaje y Atención Ciudadana) de la Municipalidad de Ituzaingó.
Tu objetivo es brindar una comunicación 100% predecible, serena, literal y libre de sobrecarga sensorial.`,
    constraints: [
      "LENGUAJE 100% LITERAL: Prohibido usar metáforas, ironías, sarcasmo, modismos ambiguos o dobles sentidos.",
      "ESTRUCTURA SECUENCIAL PASO A PASO: Desglosa cualquier explicación o trámite municipal en pasos numerados muy breves (Paso 1, Paso 2, Paso 3), entregando una sola acción clara por paso.",
      "INYECCIÓN OBLIGATORIA DE TOKENS VISUALES [PICTO: ...]: Acompaña cada paso o concepto clave con los tokens de pictogramas estandarizados para que el tablero visual los renderice al ciudadano: [PICTO: documento], [PICTO: ventanilla], [PICTO: esperar], [PICTO: pagar], [PICTO: firma], [PICTO: correcto], [PICTO: calma], [PICTO: ayuda], [PICTO: salud], [PICTO: casa].",
      "FIDELIDAD AL GROUNDING MUNICIPAL: No inventes requisitos de trámites. Si el contexto indica '" +
        TRAMITE_FALLBACK_STRING +
        "', explica en pasos simples que debe consultar en la ventanilla municipal.",
      "OPCIONES BINARIAS O ACOTADAS: Al finalizar tu respuesta, ofrece siempre opciones simples y cerradas que el vecino pueda responder tocando un pictograma o diciendo '1', '2', 'Sí' o 'No'.",
      "CERO SOBRECARGA SENSORIAL: Mantén párrafos muy cortos y aireados.",
    ],
    parameters: {
      temperature: 0.25,
      maxTokens: 350,
    },
  },
};

/**
 * Normaliza cualquier identificador de modo del frontend al perfil canónico del motor
 */
export function resolveCanonicalProfileId(mode?: SusyMode | string): SusyProfileId {
  if (mode === "lazarillo" || mode === "no_videntes") {
    return "lazarillo";
  }
  if (mode === "tea") {
    return "tea";
  }
  return "executive";
}

/**
 * Ensambla el System Prompt Maestro combinando en estricto orden:
 * 1. Identidad (Concierge Municipal de Ituzaingó / Perfil Cognitivo Activo y sus restricciones)
 * 2. Constitutional Shield (Leyes inmutables de comportamiento desde constitutionalShield.ts)
 * 3. Contexto Dinámico (Respuesta inyectada de susyGrounding.ts con eventos futuros, noticias de hoy,
 *    requisitos de trámites pgvector >= 0.82, Grafo Digesto y telemetría óptica)
 */
export function buildSusySystemPrompt(
  mode: SusyMode | string = "executive",
  context: SusyContext
): {
  systemPrompt: string;
  profile: PromptProfile;
} {
  const profileId = resolveCanonicalProfileId(mode);
  const profile = SusyProfiles[profileId];

  const blocks: string[] = [];

  // =========================================================================
  // 1. IDENTIDAD (CONCIERGE MUNICIPAL DE ITUZAINGÓ Y REGLAS DEL PERFIL ACTIVO)
  // =========================================================================
  const constraintsText = profile.constraints.map((c) => `- ${c}`).join("\n");
  blocks.push(
    `================================================================================
🏛️ 1. IDENTIDAD Y PERFIL OPERATIVO ACTIVO: ${profile.id.toUpperCase()}
================================================================================
${profile.systemDirective}

RESTRICCIONES DE COMPORTAMIENTO Y FORMATO DEL PERFIL:
${constraintsText}`
  );

  // =========================================================================
  // 2. CONSTITUTIONAL SHIELD (LEYES INMUTABLES DE COMPORTAMIENTO)
  // =========================================================================
  blocks.push(
    `================================================================================
🛡️ 2. CONSTITUTIONAL SHIELD (LEYES INMUTABLES DE COMPORTAMIENTO)
================================================================================
${SUSY_CONSTITUTIONAL_AXIOMS.trim()}`
  );

  // =========================================================================
  // 3. CONTEXTO DINÁMICO (GROUNDING EN TIEMPO REAL: HORA, CLIMA, EVENTOS, PRENSA Y TRÁMITES)
  // =========================================================================
  const dynamicContextSections: string[] = [];

  const citizenLines: string[] = [
    `- Ciudadano en atención: ${context.userName || "Vecino"}`,
    `- Hora local en Ituzaingó: ${context.timeOfDay}`,
    `- Ubicación actual: ${context.location || "Ituzaingó, Corrientes, Argentina"}`,
  ];
  if (context.weatherSummary) {
    citizenLines.push(`- Estado del Clima en Ituzaingó: ${context.weatherSummary}`);
  }
  if (context.isOffline) {
    citizenLines.push(
      `- [MODO OFFLINE ACTIVO]: Responde en menos de 50 palabras priorizando teléfonos de emergencia (107 Hospital, 100 Bomberos, 103 Defensa Civil) y direcciones físicas.`
    );
  }
  dynamicContextSections.push(
    `[TELEMETRÍA DE SESIÓN DEL VECINO]:\n${citizenLines.join("\n")}`
  );

  // Si se provee el bloque consolidado de susyGrounding.ts, inyectarlo íntegramente
  if (context.groundingBlock && context.groundingBlock.trim().length > 0) {
    dynamicContextSections.push(context.groundingBlock.trim());
  } else {
    // O si se inyectan los bloques individuales de susyGrounding.ts
    if (context.currentContextBlock) {
      dynamicContextSections.push(
        `[CONTEXTO TEMPORAL, CLIMÁTICO Y ESTADO DE SERVICIOS (susyGrounding)]:\n${context.currentContextBlock}`
      );
    }
    if (context.upcomingEventsBlock) {
      dynamicContextSections.push(
        `[EVENTOS TURÍSTICOS Y CULTURALES FUTUROS (fecha >= NOW())]:\n${context.upcomingEventsBlock}`
      );
    }
    if (context.latestNewsBlock) {
      dynamicContextSections.push(
        `[ÚLTIMAS 3 GACETILLAS DE PRENSA OFICIALES]:\n${context.latestNewsBlock}`
      );
    }
    if (context.tramiteRequirementsBlock) {
      dynamicContextSections.push(
        `[REQUISITOS OFICIALES DE TRÁMITES (pgvector >= 0.82)]:\n${context.tramiteRequirementsBlock}`
      );
    }
  }

  // Telemetría Óptica de la Cámara Titán (si está activa)
  if (context.visionAlerts && context.visionAlerts.length > 0) {
    const alertLines = context.visionAlerts.map(
      (alert) =>
        `- [${alert.alertLevel.toUpperCase()}] ${alert.description} (Posición: ${alert.clockPosition}, Distancia: ${alert.distance})`
    );
    const darkWarning = context.isDark
      ? "[ADVERTENCIA ÓPTICA]: Baja luminosidad ambiental detectada en la escena.\n"
      : "";
    dynamicContextSections.push(
      `[TELEMETRÍA ÓPTICA CÁMARA TITÁN (ENTORNO FÍSICO DEL VECINO)]:\n${darkWarning}${alertLines.join("\n")}`
    );
  } else if (profileId === "lazarillo") {
    dynamicContextSections.push(
      `[TELEMETRÍA ÓPTICA CÁMARA TITÁN]: Paso frontal a las 12 en punto sin alertas críticas reportadas por el sensor.`
    );
  }

  // Contexto de Grafo Digesto (susy_grafo_digesto), Patrimonio y Herramientas (solo en modos no-lazarillo)
  if (profileId !== "lazarillo") {
    dynamicContextSections.push(buildFunctionCallingPromptDirective());

    if (context.digestoGraphContext && context.digestoGraphContext.trim().length > 0) {
      dynamicContextSections.push(context.digestoGraphContext.trim());
    }

    if (context.patrimonyContext && context.patrimonyContext.trim().length > 0) {
      dynamicContextSections.push(context.patrimonyContext.trim());
    }

    if (context.continuousMemory && context.continuousMemory.trim().length > 0) {
      dynamicContextSections.push(context.continuousMemory.trim());
    }
  }

  blocks.push(
    `================================================================================
⚓ 3. CONTEXTO DINÁMICO MUNICIPAL (GROUNDING EN TIEMPO REAL E INYECCIÓN RAG)
================================================================================
${dynamicContextSections.join("\n\n")}`
  );

  return {
    systemPrompt: blocks.join("\n\n"),
    profile,
  };
}

/**
 * Orquestador Asíncrono con Grounding Automático:
 * Intercepta la consulta del vecino, consulta en tiempo real `susyGrounding.ts`
 * (`getCurrentContext`, `getUpcomingEvents`, `getLatestNews`, `getTramiteRequirements`)
 * y ensambla el System Prompt final combinando:
 * 1. Identidad (Concierge Municipal de Ituzaingó)
 * 2. Constitutional Shield (Leyes inmutables de comportamiento)
 * 3. Contexto Dinámico (Datos reales verificados de Supabase y pgvector >= 0.82)
 */
export async function buildGroundedSusySystemPrompt(
  mode: SusyMode | string = "executive",
  userQuery: string,
  partialContext?: Partial<SusyContext>
): Promise<{
  systemPrompt: string;
  profile: PromptProfile;
  grounding: SusyGroundingBundle;
}> {
  const profileId = resolveCanonicalProfileId(mode);

  // En modo Lazarillo priorizamos latencia < 350ms sin bloqueo de red externo
  if (profileId === "lazarillo") {
    const fastContext = await getCurrentContext();
    const emptyGrounding: SusyGroundingBundle = {
      currentContext: fastContext,
      upcomingEvents: "",
      latestNews: "",
      tramiteRequirements: TRAMITE_FALLBACK_STRING,
      combinedGroundingBlock: fastContext,
    };

    const compiled = buildSusySystemPrompt(mode, {
      timeOfDay: partialContext?.timeOfDay || new Date().toLocaleTimeString("es-AR"),
      location: partialContext?.location || "Ituzaingó, Corrientes",
      ...partialContext,
      currentContextBlock: fastContext,
    });

    return {
      ...compiled,
      grounding: emptyGrounding,
    };
  }

  // En modos Executive / TEA ejecutamos el anclaje completo en paralelo
  const grounding = await resolveFullSusyGrounding(userQuery);

  const enrichedContext: SusyContext = {
    timeOfDay: partialContext?.timeOfDay || grounding.currentContext.split("\n")[0] || "",
    location: partialContext?.location || "Ituzaingó, Corrientes, Argentina",
    ...partialContext,
    currentContextBlock: grounding.currentContext,
    upcomingEventsBlock: grounding.upcomingEvents,
    latestNewsBlock: grounding.latestNews,
    tramiteRequirementsBlock: grounding.tramiteRequirements,
    groundingBlock: grounding.combinedGroundingBlock,
  };

  const compiled = buildSusySystemPrompt(mode, enrichedContext);

  return {
    ...compiled,
    grounding,
  };
}

export {
  buildSusySystemPrompt as buildSystemPrompt,
  getCurrentContext,
  getLatestNews,
  getTramiteRequirements,
  getUpcomingEvents,
  resolveFullSusyGrounding,
  TRAMITE_FALLBACK_STRING,
};
