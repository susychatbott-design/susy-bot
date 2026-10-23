"use client";

/**
 * ============================================================================
 * 🌎 SELECTOR ESTRICTO DE VOZ LATINA PARA WEB SPEECH API (FASE 7.7)
 * Desarrollado por Nexora One (Tel: 3786414533 • mjnexora.visual@gmail.com)
 *
 * - Prioriza es-AR → es-MX → es-US → es-419 → resto de Latinoamérica.
 * - Jamás devuelve una voz de España (es-ES). Si solo existe es-ES, devuelve
 *   `null` y fuerza `utterance.lang` latino para que el motor del SO elija.
 * - Normaliza códigos Android (`es_AR`) y mayúsculas/minúsculas.
 * - Cachea voces y escucha `voiceschanged` (Chrome carga las voces async).
 * ============================================================================
 */

export const LATIN_LANG_PRIORITY = ["es-ar", "es-mx", "es-us", "es-419"] as const;
const SECONDARY_LATIN_LANGS = ["es-uy", "es-cl", "es-co", "es-pe", "es-py", "es-ve"];
export const DEFAULT_LATIN_LANG = "es-MX";

let cachedVoices: SpeechSynthesisVoice[] = [];
let listenerAttached = false;

function normalizeLang(lang: string | undefined | null): string {
  return (lang || "").toLowerCase().replace(/_/g, "-");
}

function isSpainVoice(v: SpeechSynthesisVoice): boolean {
  const l = normalizeLang(v.lang);
  const n = (v.name || "").toLowerCase();
  if (l === "es-es") return true;
  // Si el código de idioma es explícitamente latino, confiar en él
  if ((LATIN_LANG_PRIORITY as readonly string[]).includes(l) || SECONDARY_LATIN_LANGS.includes(l)) {
    return false;
  }
  return /spain|españa|espana|castilian|castellano|\bhelena\b|\bmonica\b|\bmónica\b|\blaura\b|\bpablo\b|\blucia\b|\bconchita\b|\benrique\b/.test(n);
}

function scoreNaturalness(v: SpeechSynthesisVoice): number {
  const n = (v.name || "").toLowerCase();
  let score = 0;
  if (/natural|neural|online|enhanced|premium/.test(n)) score += 3;
  if (/google/.test(n)) score += 2;
  if (/female|elena|paulina|sabina|dalia|jimena|brenda|valentina/.test(n)) score += 1;
  return score;
}

/** Inicializa la caché de voces y el listener `voiceschanged`. Seguro de llamar múltiples veces. */
export function primeLatinVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  try {
    const current = window.speechSynthesis.getVoices();
    if (current.length > 0) cachedVoices = current;
    if (!listenerAttached) {
      listenerAttached = true;
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        const refreshed = window.speechSynthesis.getVoices();
        if (refreshed.length > 0) cachedVoices = refreshed;
      });
    }
  } catch {
    // Ignorar
  }
  return cachedVoices;
}

/** Devuelve la mejor voz latina disponible o `null` (nunca es-ES). */
export function selectLatinSpanishVoice(
  voices: SpeechSynthesisVoice[] = primeLatinVoices()
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const candidates = voices.filter((v) => !isSpainVoice(v));

  for (const target of LATIN_LANG_PRIORITY) {
    const matches = candidates
      .filter((v) => normalizeLang(v.lang) === target)
      .sort((a, b) => scoreNaturalness(b) - scoreNaturalness(a));
    if (matches.length > 0) return matches[0];
  }

  const secondary = candidates
    .filter((v) => SECONDARY_LATIN_LANGS.includes(normalizeLang(v.lang)))
    .sort((a, b) => scoreNaturalness(b) - scoreNaturalness(a));
  if (secondary.length > 0) return secondary[0];

  const anyLatin = candidates
    .filter((v) => {
      const l = normalizeLang(v.lang);
      return l.startsWith("es") && l !== "es-es";
    })
    .sort((a, b) => scoreNaturalness(b) - scoreNaturalness(a));
  return anyLatin[0] || null;
}

/** Aplica voz y `lang` latinos a un utterance. Si no hay voz latina, fuerza `lang` latino. */
export function applyLatinVoice(utterance: SpeechSynthesisUtterance): SpeechSynthesisVoice | null {
  const latinVoice = selectLatinSpanishVoice();
  if (latinVoice) {
    utterance.voice = latinVoice;
    const l = normalizeLang(latinVoice.lang);
    utterance.lang = l && l !== "es" ? latinVoice.lang.replace(/_/g, "-") : DEFAULT_LATIN_LANG;
  } else {
    utterance.lang = DEFAULT_LATIN_LANG;
  }
  return latinVoice;
}

/**
 * ⚡ CHUNKING DE BAJA LATENCIA PARA TTS:
 * Extrae fragmentos pronunciables de un buffer sin esperar al punto final.
 * - Delimitadores fuertes: `.` `?` `!` `\n` y también `,` `:` `;` (Fase 7.7 – flush por comas).
 *   La coma / dos puntos solo cortan si van seguidos de espacio, para no partir "1,5" ni "10:30".
 * - `minSoftChars` permite exigir un largo mínimo antes de cortar en coma (default 1 = siempre).
 * - En el primer fragmento de la respuesta, corta tras ≥ `firstChunkWords` palabras
 *   en el último espacio para emitir sonido lo antes posible.
 * - Corte duro en el último espacio si el buffer supera `maxChars` sin puntuación.
 */
export function extractSpeakableChunks(
  buffer: string,
  options: { isFirstChunk?: boolean; minSoftChars?: number; firstChunkWords?: number; maxChars?: number } = {}
): { chunks: string[]; rest: string } {
  const { minSoftChars = 1, firstChunkWords = 5, maxChars = 140 } = options;
  let isFirst = options.isFirstChunk ?? false;
  const chunks: string[] = [];
  let rest = buffer;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Delimitadores fuertes de Fase 7.7: punto, signo de interrogación/exclamación, salto de línea, coma (,) y dos puntos (:)
    const strong = /(?:[.?!\n]+|[,:;]+(?=\s|$))/.exec(rest);
    const strongIdx = strong ? strong.index + strong[0].length : -1;

    let cutAt = strongIdx >= minSoftChars ? strongIdx : -1;

    if (cutAt === -1 && isFirst) {
      const words = rest.trim().split(/\s+/);
      // Requiere un espacio final para no cortar una palabra a medio llegar del stream
      if (words.length > firstChunkWords && /\s$/.test(rest)) {
        cutAt = rest.length;
      }
    }

    if (cutAt === -1 && rest.length > maxChars) {
      const lastSpace = rest.lastIndexOf(" ", maxChars);
      cutAt = lastSpace > 20 ? lastSpace + 1 : maxChars;
    }

    if (cutAt === -1) break;

    const piece = rest.slice(0, cutAt).trim();
    rest = rest.slice(cutAt).trimStart();
    if (piece.length > 0) {
      chunks.push(piece);
      isFirst = false;
    }
  }

  return { chunks, rest };
}

/** Detecta si una transcripción es eco de la propia voz de Susy (solapamiento léxico alto). */
export function isLikelyAssistantEcho(transcript: string, assistantText: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);
  const tWords = norm(transcript);
  if (tWords.length < 3 || !assistantText) return false;
  const aSet = new Set(norm(assistantText));
  if (aSet.size === 0) return false;
  const overlap = tWords.filter((w) => aSet.has(w)).length;
  return overlap / tWords.length >= 0.75;
}
