"use client";

import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface TEAPictogramItem {
  id: string;
  token: string;
  emoji: string;
  arasaacId: number;
  label: string;
  prompt: string;
  category: "municipal" | "necesidades" | "emociones" | "respuestas";
  bgColor: string;
  borderColor: string;
}

export const SUSY_ARASAAC_PICTOGRAMS: TEAPictogramItem[] = [
  {
    id: "documento",
    token: "documento",
    emoji: "🪪",
    arasaacId: 2465,
    label: "Documento / DNI",
    prompt: "El vecino seleccionó el pictograma [PICTO: documento]. Necesito saber qué documentos o DNI debo llevar para mi trámite municipal. Explícame paso a paso con lenguaje literal.",
    category: "municipal",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/30 hover:border-sky-400",
  },
  {
    id: "ventanilla",
    token: "ventanilla",
    emoji: "🏛️",
    arasaacId: 6516,
    label: "Oficina / Ventanilla",
    prompt: "El vecino seleccionó el pictograma [PICTO: ventanilla]. ¿A qué oficina o ventanilla municipal debo ir en Ituzaingó? Responde en pasos cortos y literales.",
    category: "municipal",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30 hover:border-indigo-400",
  },
  {
    id: "esperar",
    token: "esperar",
    emoji: "⏳",
    arasaacId: 36914,
    label: "Turno / Esperar",
    prompt: "El vecino seleccionó el pictograma [PICTO: esperar]. Quiero pedir un turno municipal sin hacer fila larga. Guíame paso a paso.",
    category: "municipal",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30 hover:border-amber-400",
  },
  {
    id: "pagar",
    token: "pagar",
    emoji: "💳",
    arasaacId: 6554,
    label: "Pagar / Tasa",
    prompt: "El vecino seleccionó el pictograma [PICTO: pagar]. ¿Cuánto cuesta y dónde se paga este trámite municipal? Responde de forma muy breve y literal.",
    category: "municipal",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30 hover:border-emerald-400",
  },
  {
    id: "firma",
    token: "firma",
    emoji: "✍️",
    arasaacId: 9016,
    label: "Firmar / Retirar",
    prompt: "El vecino seleccionó el pictograma [PICTO: firma]. ¿Dónde firmo o retiro mi carnet o permiso municipal?",
    category: "municipal",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30 hover:border-purple-400",
  },
  {
    id: "salud",
    token: "salud",
    emoji: "🏥",
    arasaacId: 3249,
    label: "Hospital / Salud",
    prompt: "El vecino seleccionó el pictograma [PICTO: salud]. Necesito información del Hospital Billinghurst o farmacias de turno en Ituzaingó. Responde claro y literal.",
    category: "necesidades",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30 hover:border-rose-400",
  },
  {
    id: "ayuda",
    token: "ayuda",
    emoji: "🫂",
    arasaacId: 37418,
    label: "Necesito Ayuda",
    prompt: "El vecino seleccionó el pictograma [PICTO: ayuda]. Necesito ayuda sencilla y paso a paso.",
    category: "necesidades",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30 hover:border-rose-400",
  },
  {
    id: "calma",
    token: "calma",
    emoji: "🛋️",
    arasaacId: 35665,
    label: "Pausa / Calma",
    prompt: "El vecino seleccionó el pictograma [PICTO: calma]. Necesito una pausa tranquila sin sobrecarga de información.",
    category: "emociones",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30 hover:border-teal-400",
  },
  {
    id: "correcto",
    token: "correcto",
    emoji: "✅",
    arasaacId: 5526,
    label: "Sí / Entendido",
    prompt: "Sí, estoy de acuerdo. Muéstrame el siguiente paso.",
    category: "respuestas",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30 hover:border-emerald-400",
  },
  {
    id: "no",
    token: "no",
    emoji: "❌",
    arasaacId: 5528,
    label: "No",
    prompt: "No, gracias. Quiero otra opción simple.",
    category: "respuestas",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30 hover:border-red-400",
  },
  {
    id: "opcion_1",
    token: "opcion_1",
    emoji: "1️⃣",
    arasaacId: 2627,
    label: "Opción 1",
    prompt: "Elijo la opción 1.",
    category: "respuestas",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/30 hover:border-sky-400",
  },
  {
    id: "opcion_2",
    token: "opcion_2",
    emoji: "2️⃣",
    arasaacId: 2628,
    label: "Opción 2",
    prompt: "Elijo la opción 2.",
    category: "respuestas",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30 hover:border-blue-400",
  },
];

/**
 * Extrae los tokens `[PICTO: nombre]` emitidos en la última respuesta del LLM
 * para destacarlos visualmente con imágenes ARASAAC estandarizadas.
 */
export function extractActivePictoTokens(text?: string): TEAPictogramItem[] {
  if (!text) return [];
  const regex = /\[PICTO:\s*([a-zA-Z0-9_áéíóúÁÉÍÓÚ]+)\]/gi;
  const foundTokens = new Set<string>();
  let match: RegExpExecArray | null = regex.exec(text);

  while (match !== null) {
    foundTokens.add(match[1].toLowerCase().trim());
    match = regex.exec(text);
  }

  if (foundTokens.size === 0) return [];

  return SUSY_ARASAAC_PICTOGRAMS.filter((item) => foundTokens.has(item.token.toLowerCase()));
}

export interface SusyTEABoardProps {
  onSelectPictogram: (label: string, prompt: string) => void;
  lastAssistantMessage?: string;
  isLoading?: boolean;
}

/**
 * SusyTEABoard: Tablero de Comunicación Aumentativa y Alternativa (CAA / TEA).
 * Renderiza los tokens `[PICTO: ...]` con pictogramas oficiales ARASAAC (con fallback emoji offline)
 * y ofrece una botonera táctil de hit-box amplio (>= 48x48px) libre de sobrecarga sensorial.
 */
export function SusyTEABoard({
  onSelectPictogram,
  lastAssistantMessage = "",
  isLoading = false,
}: SusyTEABoardProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const activeMessagePictos = useMemo(
    () => extractActivePictoTokens(lastAssistantMessage),
    [lastAssistantMessage]
  );

  const handleImageError = (id: string): void => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div
      className="fixed left-0 right-0 w-full border-t border-sky-500/25 bg-slate-900/95 backdrop-blur-md px-3 py-2 z-40"
      style={{
        bottom: "calc(4.25rem + env(safe-area-inset-bottom))",
      }}
      role="region"
      aria-label="Tablero de Pictogramas TEA y Comunicación Aumentativa"
    >
      {/* SECCIÓN DE SECUENCIA VISUAL EXTRAÍDA DEL MENSAJE ACTUAL ([PICTO: ...]) */}
      {activeMessagePictos.length > 0 && (
        <div className="mb-2 p-2 rounded-xl bg-sky-950/50 border border-sky-500/30 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-sky-300 shrink-0 px-1">
            Secuencia Visual:
          </span>
          {activeMessagePictos.map((picto) => {
            const arasaacUrl = `https://static.arasaac.org/pictograms/${picto.arasaacId}/${picto.arasaacId}_300.png`;
            const useEmojiFallback = Boolean(failedImages[picto.id]);

            return (
              <div
                key={`seq-${picto.id}`}
                className="flex items-center gap-1.5 bg-slate-900/90 border border-sky-400/40 px-2.5 py-1 rounded-lg shrink-0"
              >
                {!useEmojiFallback ? (
                  <img
                    src={arasaacUrl}
                    alt={picto.label}
                    className="w-7 h-7 object-contain bg-white rounded p-0.5"
                    onError={() => handleImageError(picto.id)}
                  />
                ) : (
                  <span className="text-lg">{picto.emoji}</span>
                )}
                <span className="text-xs font-bold text-white">{picto.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* CABECERA COMPACTA DEL TABLERO */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
          <span>🧩</span>
          <span>Tablero TEA / ARASAAC (Toca un pictograma para responder)</span>
        </span>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] text-slate-300 hover:text-sky-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-white/10 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? "Compactar" : "Ver cuadrícula"}</span>
          {isExpanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
      </div>

      {/* CUADRÍCULA EXPANDIDA O TIRA HORIZONTAL ACCESIBLE (HIT-BOX >= 48x48px) */}
      {isExpanded ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-52 overflow-y-auto pb-1">
          {SUSY_ARASAAC_PICTOGRAMS.map((item) => {
            const arasaacUrl = `https://static.arasaac.org/pictograms/${item.arasaacId}/${item.arasaacId}_300.png`;
            const useEmoji = Boolean(failedImages[item.id]);

            return (
              <button
                key={item.id}
                type="button"
                disabled={isLoading}
                onClick={() => onSelectPictogram(item.label, item.prompt)}
                aria-label={`Pictograma: ${item.label}`}
                className={`min-h-[64px] flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-95 cursor-pointer select-none ${item.bgColor} ${item.borderColor} ${
                  isLoading ? "opacity-50 pointer-events-none" : "hover:bg-opacity-25"
                }`}
              >
                {!useEmoji ? (
                  <img
                    src={arasaacUrl}
                    alt={item.label}
                    className="w-9 h-9 object-contain bg-white rounded-md p-0.5 mb-1 shadow-xs"
                    onError={() => handleImageError(item.id)}
                  />
                ) : (
                  <span className="text-2xl mb-1 select-none">{item.emoji}</span>
                )}
                <span className="text-[11px] font-semibold text-white text-center leading-tight truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-sky-500/20">
          {SUSY_ARASAAC_PICTOGRAMS.map((item) => {
            const arasaacUrl = `https://static.arasaac.org/pictograms/${item.arasaacId}/${item.arasaacId}_300.png`;
            const useEmoji = Boolean(failedImages[item.id]);

            return (
              <button
                key={item.id}
                type="button"
                disabled={isLoading}
                onClick={() => onSelectPictogram(item.label, item.prompt)}
                aria-label={`Pictograma: ${item.label}`}
                className={`min-h-[48px] flex items-center gap-2 px-3 py-2 rounded-xl border shrink-0 transition-all active:scale-95 cursor-pointer select-none ${item.bgColor} ${item.borderColor} ${
                  isLoading ? "opacity-50 pointer-events-none" : "hover:bg-opacity-25"
                }`}
              >
                {!useEmoji ? (
                  <img
                    src={arasaacUrl}
                    alt={item.label}
                    className="w-7 h-7 object-contain bg-white rounded p-0.5 shrink-0"
                    onError={() => handleImageError(item.id)}
                  />
                ) : (
                  <span className="text-xl select-none">{item.emoji}</span>
                )}
                <span className="text-xs font-semibold text-white whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SusyTEABoard;
