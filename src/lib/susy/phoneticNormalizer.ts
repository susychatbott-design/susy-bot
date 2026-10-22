/**
 * ========================================================================
 * 🗣️ NORMALIZADOR FONÉTICO Y PROSODIA HUMANA DE SUSYBOT
 * Ubicación: /src/lib/nora/phoneticNormalizer.ts
 * 
 * Propósito:
 * 1. Pronunciación perfecta de marcas y siglas (Nexora One -> "Néxora Uan").
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
    .replace(/\bNexora\s*One\b/gi, "Néxora Uan")
    .replace(/\bMyJNexoraVisual\b/gi, "Néxora Uan")
    .replace(/\bMyJNexora\b/gi, "Néxora Uan")
    .replace(/\bNexoraVisual\b/gi, "Néxora Uan")
    .replace(/\bNexora\b/gi, "Néxora")
    .replace(/\bSusybot\b/gi, "Susy")
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

  // 2. Eliminación de Etiquetas de Sistema, Function Calling y Bloques entre Corchetes
  text = text
    .replace(/\[(?:CALL_FUNCTION|RECLAMO|PICTO|INSTRUCCI[OÓ]N|DIRECTIVA|MODO|CONSEJO|ESTADO)[^\]]*\]/gi, "")
    .replace(/\[RECLAMO REGISTRADO[^\]]*\]/gi, "Reclamo registrado oficialmente en el sistema municipal.")
    .replace(/\[[^\]]{1,80}\]/g, "") // Limpiar cualquier corchete residual corto
    .replace(/<[^>]*>/g, ""); // Limpiar tags HTML

  // 3. Eliminación Completa de Emojis y Pictogramas (Causantes de cuelgues en SpeechSynthesis móvil)
  text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F2FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, "");

  // 4. Limpieza Profunda de Estructuras Markdown que provocan pausas y excepciones
  text = text
    .replace(/^#+\s+/gm, "") // Encabezados #, ##
    .replace(/[*_~`#$|>]/g, "") // Símbolos de formato markdown
    .replace(/["“”«»]/g, "") // Comillas tipográficas
    .replace(/^\s*[-•*]\s+/gm, ", ") // Viñetas convertidas en comas suaves
    .replace(/^\s*\d+\.\s+/gm, ", ") // Listas numeradas convertidas en pausas suaves
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Enlaces markdown
    .replace(/:\s*\n/g, ": ") // Dos puntos seguidos de salto
    .replace(/\n{2,}/g, ". ") // Saltos dobles como punto y seguido
    .replace(/\n/g, " ") // Saltos simples como espacio
    .replace(/\s{2,}/g, " "); // Espacios múltiples

  // 5. Suavizado de Puntuación
  text = text
    .replace(/\.{2,}/g, ".")
    .replace(/,{2,}/g, ",")
    .replace(/([,;])\s*([.?!])/g, "$2")
    .replace(/\s+([,.:;?!])/g, "$1")
    .trim();

  return text;
}
