/**
 * ============================================================================
 * 🧠 SUSY — MOTOR DE CALIBRACIÓN EMPÁTICA (PNL) PARA ATENCIÓN AL VECINO
 * Ubicación: src/lib/susy/pnl/susyPnlEngine.ts
 *
 * Adaptación de la arquitectura agéntica de Nexora One (pnl_analyzer + nora_brain)
 * al contexto de la Municipalidad de Ituzaingó, Corrientes.
 *
 * Diferencias deliberadas respecto de Nexora:
 * - 100% determinista y síncrono (< 2 ms). NO hace una segunda llamada al LLM:
 *   en una llamada en vivo cada milisegundo cuenta.
 * - Las regex se usan sin flag /g en `.test()` (en Nexora el flag /g + test()
 *   conserva `lastIndex` entre llamadas y produce detecciones alternadas erróneas).
 * - El "coaching ontológico" se reemplaza por un protocolo de atención pública:
 *   VALIDAR → RESOLVER → PRÓXIMO PASO CONCRETO.
 * - Se agrega detección de URGENCIA municipal (riesgo para personas o bienes).
 * ============================================================================
 */

export type SusySensoryChannel = "VISUAL" | "AUDITORY" | "KINESTHETIC" | "DIGITAL";
export type SusyEmotionalTone = "CALM" | "FEAR" | "ANGER" | "SADNESS" | "JOY" | "CONFUSION";
export type SusyConfidence = "HIGH" | "NEUTRAL" | "LOW";
export type SusyUrgency = "NORMAL" | "ALTA" | "CRITICA";

export interface SusyPnlProfile {
  sensoryChannel: SusySensoryChannel;
  emotionalTone: SusyEmotionalTone;
  confidenceLevel: SusyConfidence;
  urgency: SusyUrgency;
  fillerWords: string[];
  /** Parámetros sugeridos para la síntesis de voz (Web Speech API / TTS). */
  voice: { rate: number; pitch: number };
}

// ── Predicados sensoriales (conteo con String.match + /g: seguro, match no usa lastIndex) ──
const PREDICATES: Record<SusySensoryChannel, RegExp> = {
  VISUAL: /\b(veo|ver|vi|vista|mir[aáo]|mirar|claro|clara|foto|imagen|cartel|se ve|aspecto|oscuro|oscuridad)\b/gi,
  AUDITORY: /\b(escucho|escuch[eé]|oigo|o[ií]|ruido|suena|son[oó]|dijeron|me dijeron|llam[eé]|tono|volumen|hablar)\b/gi,
  KINESTHETIC: /\b(siento|sent[ií]|pesado|cansad[oa]|harto|harta|agobiad[oa]|preocupad[oa]|nervios[oa]|me duele|dolor|fr[ií]o|calor|mojad[oa])\b/gi,
  DIGITAL: /\b(requisitos?|pasos?|n[uú]mero|monto|cu[aá]nto|costo|plazo|fecha|horario|formulario|expediente|ordenanza|tasa)\b/gi,
};

// ── Clima emocional (sin /g: se usan con .test()) ──
const EMOTIONAL_MARKERS: Array<[SusyEmotionalTone, RegExp]> = [
  ["FEAR", /\b(miedo|temor|p[aá]nico|asustad[oa]|peligro|me da miedo|inseguro|insegura|desesperad[oa])\b/i],
  ["ANGER", /\b(bronca|indignad[oa]|harto|harta|podrid[oa]|cansad[oa] de|una verg[uü]enza|nadie hace nada|siempre lo mismo|in[uú]til|me tienen|reclam[eé] (mil|varias|muchas) veces)\b/i],
  ["SADNESS", /\b(triste|angustiad[oa]|no doy m[aá]s|perd[ií] todo|sin trabajo|no tengo para|solo|sola|abandonad[oa])\b/i],
  ["CONFUSION", /\b(no entiendo|confundid[oa]|no s[eé] (qu[eé]|c[oó]mo|d[oó]nde|a qui[eé]n)|perdid[oa]|me mandaron de un lado|no me explicaron)\b/i],
  ["JOY", /\b(gracias|genial|b[aá]rbaro|excelente|buen[ií]simo|qu[eé] bueno|joya|espectacular|contento|contenta)\b/i],
];

// ── Urgencia municipal: riesgo real para personas o bienes ──
const CRITICAL_MARKERS =
  /\b(incendio|fuego|se (est[aá] )?quema|cable (ca[ií]do|suelto|cortado)|electrocut|inundaci[oó]n|se inund|agua (adentro|hasta)|accidente|herid[oa]|choque|[aá]rbol ca[ií]do|se cay[oó] (un|el) [aá]rbol|derrumbe|explosi[oó]n|olor a gas|p[eé]rdida de gas|violencia|me (est[aá]n )?pegando|desaparecid[oa])\b/i;
const HIGH_MARKERS =
  /\b(urgente|urgencia|ya mismo|hace (d[ií]as|semanas)|sin (luz|agua)|corte de (luz|agua)|cloaca|desborde|pozo (enorme|peligroso)|chicos? en peligro|adulto mayor|discapacidad|no puedo salir)\b/i;

const FILLER_PATTERN = /\b(este|eh|em|o sea|viste|tipo|bueno|no s[eé]|digamos|es como que)\b/gi;
const LOW_CONFIDENCE = /\b(no s[eé]|quiz[aá]s|tal vez|capaz|no estoy segur[oa]|creo que|me parece)\b/i;
const HIGH_CONFIDENCE = /\b(seguro|segura|exactamente|necesito|quiero|definitivamente)\b/i;

function countMatches(text: string, re: RegExp): number {
  const m = text.match(re);
  return m ? m.length : 0;
}

/** Calibración determinista del interlocutor. Seguro de llamar en cada turno (< 2 ms). */
export function analyzeVecino(input: string): SusyPnlProfile {
  const text = (input || "").trim();

  // 1. Canal sensorial (desempate: DIGITAL es el neutro por defecto en trámites)
  let sensoryChannel: SusySensoryChannel = "DIGITAL";
  let best = 0;
  (Object.keys(PREDICATES) as SusySensoryChannel[]).forEach((ch) => {
    const score = countMatches(text, PREDICATES[ch]);
    if (score > best) {
      best = score;
      sensoryChannel = ch;
    }
  });

  // 2. Urgencia (prima sobre todo lo demás)
  const urgency: SusyUrgency = CRITICAL_MARKERS.test(text)
    ? "CRITICA"
    : HIGH_MARKERS.test(text)
      ? "ALTA"
      : "NORMAL";

  // 3. Clima emocional (primer marcador que aplica, en orden de prioridad)
  let emotionalTone: SusyEmotionalTone = "CALM";
  for (const [tone, re] of EMOTIONAL_MARKERS) {
    if (re.test(text)) {
      emotionalTone = tone;
      break;
    }
  }
  if (urgency === "CRITICA" && emotionalTone === "CALM") emotionalTone = "FEAR";

  // 4. Muletillas y certeza
  const fillerWords = Array.from(new Set((text.match(FILLER_PATTERN) || []).map((f) => f.toLowerCase())));
  let confidenceLevel: SusyConfidence = "NEUTRAL";
  if (LOW_CONFIDENCE.test(text) || fillerWords.length >= 2) confidenceLevel = "LOW";
  else if (HIGH_CONFIDENCE.test(text)) confidenceLevel = "HIGH";

  return {
    sensoryChannel,
    emotionalTone,
    confidenceLevel,
    urgency,
    fillerWords,
    voice: computeVoiceParams(emotionalTone, confidenceLevel, urgency),
  };
}

/**
 * Modulación de voz (heredada de nora_brain, recalibrada para atención pública).
 * Rango acotado para que el cambio se perciba natural y nunca "robótico".
 */
export function computeVoiceParams(
  tone: SusyEmotionalTone,
  confidence: SusyConfidence,
  urgency: SusyUrgency
): { rate: number; pitch: number } {
  if (urgency === "CRITICA") return { rate: 1.0, pitch: 0.98 }; // firme, claro, sin apuro ni dramatismo
  if (tone === "FEAR" || tone === "SADNESS") return { rate: 0.9, pitch: 0.96 }; // pausado y contenedor
  if (tone === "ANGER") return { rate: 0.94, pitch: 0.97 }; // sereno, sin sonar condescendiente
  if (tone === "CONFUSION" || confidence === "LOW") return { rate: 0.92, pitch: 1.0 }; // un paso a la vez
  if (tone === "JOY") return { rate: 1.06, pitch: 1.03 };
  return { rate: 1.03, pitch: 1.01 };
}

/**
 * Módulo fijo de personalidad y cadencia oral (se suma al prompt de sistema).
 * Toma la "oralidad viva" de Nora y la lleva al habla litoraleña / correntina.
 */
export const SUSY_ORAL_CADENCE_MODULE = `
## CADENCIA ORAL Y MODISMOS (ESPAÑOL RIOPLATENSE / LITORALEÑO)
- Hablás SIEMPRE en español, con voseo ("vos", "podés", "tenés", "fijate"). Nunca respondas en otro idioma, aunque te escriban en otro.
- Sonás como una vecina de Ituzaingó que trabaja en el Municipio: cálida, resolutiva y respetuosa.
- Podés abrir con conectores naturales cuando suman ("Mirá,", "Dale,", "Perfecto,", "Quedate tranquilo,", "Ahora mismo lo vemos."), sin repetir siempre el mismo.
- Frases cortas, separadas por comas y puntos para que la voz respire. Nada de listas, asteriscos, emojis ni símbolos en una respuesta hablada.
- Leé los números como se dicen: "siete a trece horas", no "7-13 hs".
- Entre 2 y 4 oraciones. Si el tema es largo, das lo esencial y ofrecés seguir.
`;

/** Bloque dinámico por turno: le dice al modelo cómo calibrarse con ESTE vecino. */
export function buildSusyPnlContext(p: SusyPnlProfile): string {
  const lines: string[] = ["\n[CALIBRACIÓN EMPÁTICA DEL VECINO EN ESTE TURNO]"];

  if (p.urgency === "CRITICA") {
    lines.push(
      "- URGENCIA CRÍTICA (posible riesgo para personas o bienes). Primero la seguridad: indicá en una frase qué hacer YA (alejarse, no tocar cables, salir del agua) y los números de emergencia: Bomberos 100, Policía 101, Emergencias médicas 107, Defensa Civil 103. Después ofrecé registrar el reclamo. Cero rodeos."
    );
  } else if (p.urgency === "ALTA") {
    lines.push("- Urgencia ALTA: priorizá registrar el reclamo o el trámite ahora mismo y decí el plazo o el próximo paso concreto.");
  }

  switch (p.emotionalTone) {
    case "ANGER":
      lines.push(
        "- El vecino está molesto. Validá su enojo sin justificar al Municipio ni discutir (\"Tenés toda la razón en estar molesto\"), y pasá inmediatamente a la acción concreta. Nunca le pidas que se calme."
      );
      break;
    case "FEAR":
    case "SADNESS":
      lines.push("- El vecino está angustiado. Contené primero con una frase cálida y breve, después resolvé. Tono pausado.");
      break;
    case "CONFUSION":
      lines.push("- El vecino está confundido. Un solo paso por vez, en orden, y confirmá que se entendió antes de seguir.");
      break;
    case "JOY":
      lines.push("- El vecino está conforme. Acompañá el buen clima con naturalidad y ofrecé algo más en qué ayudar.");
      break;
    default:
      break;
  }

  switch (p.sensoryChannel) {
    case "VISUAL":
      lines.push("- Canal visual: usá referencias que se puedan imaginar (\"la oficina que está frente a la plaza\").");
      break;
    case "AUDITORY":
      lines.push("- Canal auditivo: ritmo claro, repetí el dato clave al final.");
      break;
    case "KINESTHETIC":
      lines.push("- Canal kinestésico: validá cómo se siente antes de dar datos.");
      break;
    case "DIGITAL":
      lines.push("- Canal racional: datos precisos y ordenados (requisitos, horario, costo, plazo).");
      break;
  }

  if (p.confidenceLevel === "LOW") {
    lines.push("- Duda o vacila: oraciones más cortas y ofrecé hacerlo vos por él (\"Si querés, te lo gestiono yo ahora\").");
  }

  lines.push("- Protocolo: VALIDAR → RESOLVER → PRÓXIMO PASO CONCRETO. Si podés emitir un turno, permiso provisorio o reclamo, ofrecelo.");
  return lines.join("\n");
}
