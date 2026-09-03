/**
 * ========================================================================
 * 🗣️ NORMALIZADOR FONÉTICO Y PROSODIA HUMANA DE NORA
 * Ubicación: /src/lib/nora/phoneticNormalizer.ts
 * 
 * Propósito:
 * 1. Pronunciación perfecta de marcas y siglas (MyJNexoraVisual -> "Eme y Jota Néxora Visual").
 * 2. Erradicar pausas robóticas eliminando viñetas, markdown y saltos de línea abruptos.
 * 3. Garantizar cadencia y respiración natural en el habla.
 * ========================================================================
 */

/**
 * Convierte texto en bruto de IA en habla fonética fluida y humana
 */
export function normalizePhoneticTextForSpeech(rawText: string): string {
  if (!rawText || !rawText.trim()) return "";

  let text = rawText;

  // 1. Reemplazos Fonéticos de Marca y Acrónimos Clave
  text = text
    .replace(/\bMyJNexoraVisual\b/gi, "Eme y Jota Néxora Visual")
    .replace(/\bMyJNexora\b/gi, "Eme y Jota Néxora")
    .replace(/\bNexoraVisual\b/gi, "Néxora Visual")
    .replace(/\bNexora\b/gi, "Néxora")
    .replace(/\bSusybot\b/gi, "Nora Itu")
    .replace(/\bItuzaingó\b/g, "Ituzaingó")
    .replace(/\bTEA\b/g, "condición del espectro autista")
    .replace(/\bDUA\b/g, "Diseño Universal para el Aprendizaje")
    .replace(/\bPPI\b/g, "Proyecto Pedagógico Individual")
    .replace(/\bIA\b/g, "Inteligencia Artificial")
    .replace(/\bPDF\b/g, "documento P D F")
    .replace(/\bSOS\b/g, "S O S")
    .replace(/\bkm\/h\b/gi, "kilómetros por hora")
    .replace(/\bkm\b/gi, "kilómetros")
    .replace(/\bhs\b/gi, "horas");

  // 2. Limpieza de Estructuras Markdown que provocan pausas robóticas
  text = text
    .replace(/^#+\s+/gm, "") // Encabezados #, ##
    .replace(/[*_~`#$|>]/g, "") // Símbolos de formato
    .replace(/^\s*[-•*]\s+/gm, ", ") // Viñetas convertidas en comas suaves
    .replace(/^\s*\d+\.\s+/gm, ", ") // Listas numeradas convertidas en pausas suaves
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Enlaces markdown
    .replace(/:\s*\n/g, ": ") // Dos puntos seguidos de salto
    .replace(/\n{2,}/g, ". ") // Saltos dobles como punto y seguido
    .replace(/\n/g, " ") // Saltos simples como espacio
    .replace(/\s{2,}/g, " "); // Espacios múltiples

  // 3. Suavizado de Puntuación
  text = text
    .replace(/\.{2,}/g, ".")
    .replace(/,{2,}/g, ",")
    .replace(/([,;])\s*([.?!])/g, "$2")
    .replace(/\s+([,.:;?!])/g, "$1")
    .trim();

  return text;
}
