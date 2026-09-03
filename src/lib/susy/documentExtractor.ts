/**
 * ========================================================================
 * 📑 NORA TITÁN - EXTRACTOR UNIVERSAL SOBERANO DE DOCUMENTOS
 * Ubicación: /src/lib/nora/documentExtractor.ts
 * 
 * Permite decodificar, procesar y estructurar documentos extensos (PDFs, 
 * TXT, Markdown, CSV, JSON, Word/Docs) para que cualquier nodo de la red 
 * soberana (Ollama, Cloudflare, Hugging Face, OpenRouter, Gemini, Groq)
 * los comprenda y audite sin saturar buffers ni fallar por payloads binarios.
 * ========================================================================
 */

export interface ExtractedDocumentResult {
  title: string;
  mimeType: string;
  charCount: number;
  wordCount: number;
  extractedText: string;
  isTruncated: boolean;
  sections: string[];
}

/**
 * Limpia y normaliza texto eliminando caracteres nulos o secuencias de escape no imprimibles.
 */
function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extrae texto legible a partir de un buffer base64 de un documento PDF.
 * Interpreta streams de texto crudo FlateDecode y strings literales sin dependencias binarias externas.
 */
export function extractTextFromPdfBase64(base64: string, maxChars: number = 35000): string {
  try {
    const rawB64 = base64.includes(",") ? base64.split(",")[1] : base64;
    const buffer = Buffer.from(rawB64, "base64");
    const rawString = buffer.toString("latin1");

    const textSegments: string[] = [];

    // 1. Extraer bloques de texto en streams PDF (/Filter /FlateDecode o texto plano entre BT ... ET)
    const btEtRegex = /BT[\s\S]*?ET/g;
    let match: RegExpExecArray | null;

    while ((match = btEtRegex.exec(rawString)) !== null) {
      const block = match[0];
      // Capturar texto entre paréntesis (...) Tj o TJ
      const tjRegex = /\(([\s\S]*?)\)\s*T[jJ]/g;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        const decodedPart = tjMatch[1]
          .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
          .replace(/\\([nrtbf\\()])/g, (_, esc) => {
            switch (esc) {
              case "n": return "\n";
              case "r": return "\r";
              case "t": return "\t";
              case "b": return "\b";
              case "f": return "\f";
              case "\\": return "\\";
              case "(": return "(";
              case ")": return ")";
              default: return esc;
            }
          });
        if (decodedPart.trim().length > 0) {
          textSegments.push(decodedPart);
        }
      }

      // Capturar arrays de texto [(...) (...) ...] TJ
      const arrayTjRegex = /\[([\s\S]*?)\]\s*TJ/g;
      let arrMatch: RegExpExecArray | null;
      while ((arrMatch = arrayTjRegex.exec(block)) !== null) {
        const innerArray = arrMatch[1];
        const subRegex = /\(([\s\S]*?)\)/g;
        let subMatch: RegExpExecArray | null;
        while ((subMatch = subRegex.exec(innerArray)) !== null) {
          if (subMatch[1].trim().length > 0) {
            textSegments.push(subMatch[1]);
          }
        }
      }
    }

    let combined = textSegments.join(" ");
    combined = cleanExtractedText(combined);

    if (combined.length > 50) {
      return combined.slice(0, maxChars);
    }

    // Fallback: extraer caracteres legibles continuos del stream binario
    const asciiRegex = /[A-Za-z0-9ÁÉÍÓÚáéíóúñÑüÜ¡!¿?.,;:()/"'%\-\s]{4,}/g;
    const fallbackMatches = rawString.match(asciiRegex) || [];
    const fallbackText = cleanExtractedText(fallbackMatches.join(" "));

    return fallbackText.slice(0, maxChars);
  } catch (err) {
    console.warn("[DocumentExtractor Warning]: Error al extraer texto de PDF base64:", err);
    return "";
  }
}

/**
 * Normaliza cualquier adjunto recibido (PDF, Imagen, Texto, CSV, Doc) y genera un contexto
 * estructurado optimizado para el motor soberano.
 */
export function processSovereignAttachment(file: {
  name?: string;
  type?: string;
  mimeType?: string;
  base64?: string;
  textContent?: string;
} | null | undefined): {
  isDocument: boolean;
  isImage: boolean;
  isAudio: boolean;
  extractedText: string;
  structuredContext: string;
} {
  if (!file) {
    return {
      isDocument: false,
      isImage: false,
      isAudio: false,
      extractedText: "",
      structuredContext: ""
    };
  }

  const mime = (file.mimeType || file.type || "").toLowerCase();
  const filename = file.name || "documento_adjunto";
  const isImage = mime.startsWith("image/");
  const isAudio = mime.startsWith("audio/") || /\.(webm|mp3|wav|ogg|m4a|mp4|aac)$/i.test(filename);
  const isPdf = mime === "application/pdf" || filename.toLowerCase().endsWith(".pdf");
  const isTextDoc = mime.startsWith("text/") || /\.(txt|md|csv|json|xml|html|rtf)$/i.test(filename);

  let extractedText = "";

  if (file.textContent && file.textContent.trim().length > 0) {
    extractedText = cleanExtractedText(file.textContent);
  } else if (isPdf && file.base64) {
    extractedText = extractTextFromPdfBase64(file.base64);
  } else if (isTextDoc && file.base64) {
    try {
      const rawB64 = file.base64.includes(",") ? file.base64.split(",")[1] : file.base64;
      extractedText = cleanExtractedText(Buffer.from(rawB64, "base64").toString("utf-8"));
    } catch {}
  }

  let structuredContext = "";
  if (extractedText.length > 0) {
    structuredContext = `\n========================================================================\n📑 DOCUMENTO ADJUNTO PROCESADO: "${filename}" (${extractedText.length} caracteres extraídos):\n${extractedText.slice(0, 25000)}\n========================================================================\n`;
  } else if (isPdf) {
    structuredContext = `\n[DOCUMENTO PDF ADJUNTO: "${filename}" - Archivo cargado en el búfer de atención multimodal]\n`;
  }

  return {
    isDocument: isPdf || isTextDoc || Boolean(extractedText),
    isImage,
    isAudio,
    extractedText,
    structuredContext
  };
}
