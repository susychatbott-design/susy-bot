"use client";

import React, { useRef } from "react";
import {
  Mic,
  MicOff,
  Camera,
  Image as ImageIcon,
  Send,
  Loader2,
  X,
  AudioWaveform,
  PhoneCall,
  Zap,
} from "lucide-react";

export interface SusyControlFooterProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onSendMessage: () => void;
  isRecording: boolean;
  isTranscribing?: boolean;
  onToggleRecording: () => void;
  isVADListening?: boolean;
  isUserSpeakingVAD?: boolean;
  onToggleVAD?: () => void;
  onOpenCallModal?: () => void;
  isLiveModeActive?: boolean;
  liveLatencyMs?: number | null;
  onToggleLiveMode?: () => void;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  isLoading: boolean;
  selectedImageBase64: string | null;
  onSelectImage: (base64: string | null, fileName?: string, mimeType?: string) => void;
  placeholder?: string;
}

/**
 * SusyControlFooter: Barra inferior Mobile-First de control multimodal accesible (DUA).
 * - Todos los botones de acción tienen un hit-box mínimo de 48x48px con padding táctil `p-3`.
 * - En pantallas móviles se organiza en 2 filas compactas dentro del contenedor seguro (`env(safe-area-inset-bottom)`)
 *   para que el botón de Llamada, Modo Live ⚡, Cámara, Micrófono e Input jamás queden cortados fuera de pantalla.
 * - Muestra la firma oficial de Nexora One (Tel: 3786414533 • mjnexora.visual@gmail.com).
 */
export function SusyControlFooter({
  inputText,
  onInputChange,
  onSendMessage,
  isRecording,
  isTranscribing = false,
  onToggleRecording,
  isVADListening = false,
  isUserSpeakingVAD = false,
  onToggleVAD,
  onOpenCallModal,
  isLiveModeActive = false,
  liveLatencyMs = null,
  onToggleLiveMode,
  isCameraActive,
  onToggleCamera,
  isLoading,
  selectedImageBase64,
  onSelectImage,
  placeholder = "Escribí tu consulta municipal, trámite o reclamo...",
}: SusyControlFooterProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onSelectImage(reader.result, file.name, file.type);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const canSend =
    !isLoading &&
    (inputText.trim().length > 0 || selectedImageBase64 !== null || isCameraActive);

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 w-full z-40 border-t border-white/10 bg-slate-950/95 backdrop-blur-md p-2 sm:p-3 sm:px-6 box-border pb-[max(12px,env(safe-area-inset-bottom))]"
    >
      {/* PREVIEW DE IMAGEN / DOCUMENTO ADJUNTO */}
      {selectedImageBase64 && (
        <div className="mb-2 inline-flex items-center gap-2 bg-slate-900 border border-indigo-500/30 px-3 py-1.5 rounded-xl max-w-full truncate">
          <img
            src={selectedImageBase64}
            alt="Adjunto"
            className="w-7 h-7 object-cover rounded-md shrink-0"
          />
          <span className="text-xs font-medium text-slate-200 truncate">
            Fotografía / Boleta lista para peritaje
          </span>
          <button
            type="button"
            onClick={() => onSelectImage(null)}
            className="text-slate-400 hover:text-rose-400 p-1 shrink-0 cursor-pointer"
            title="Quitar imagen adjunta"
            aria-label="Quitar imagen adjunta"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* BARRA MULTIMODAL DE HIT-BOX ACCESIBLE (MIN 48x48px CON PADDING p-3, 100% VISIBLE EN MÓVIL Y PC) */}
      <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 bg-slate-900/95 border border-white/15 rounded-2xl p-1.5 sm:p-2 shadow-inner">
        {/* FILA DE ACCIONES RÁPIDAS MULTIMODALES (SIEMPRE VISIBLES EN MÓVIL SIN CORTES HORIZONTALES) */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {/* 1. BOTÓN CÁMARA TITÁN (48x48px, p-3) */}
          <button
            type="button"
            onClick={onToggleCamera}
            className={`flex min-w-[48px] min-h-[48px] p-3 rounded-xl items-center justify-center transition-all shrink-0 cursor-pointer ${
              isCameraActive
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
            title={
              isCameraActive
                ? "Apagar Cámara Titán"
                : "Encender Cámara Titán (Lazarillo / Lectura de Boletas)"
            }
            aria-label={isCameraActive ? "Apagar cámara" : "Encender cámara"}
            aria-pressed={isCameraActive}
          >
            <Camera size={20} />
          </button>

          {/* 2. BOTÓN ADJUNTAR IMAGEN / BOLETA (48x48px, p-3) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-w-[48px] min-h-[48px] p-3 rounded-xl items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Adjuntar foto de reclamo urbano, carnet o boleta municipal"
            aria-label="Adjuntar fotografía o documento"
          >
            <ImageIcon size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />

          {/* 3. BOTÓN DE LLAMADA EN VIVO ACCESIBLE EN MÓVIL Y PC (48x48px, p-3) */}
          {onOpenCallModal && (
            <button
              type="button"
              onClick={onOpenCallModal}
              className="flex min-w-[48px] min-h-[48px] px-3 py-2.5 rounded-xl items-center justify-center gap-1.5 bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/50 transition-all shrink-0 cursor-pointer active:scale-95 text-xs font-extrabold"
              title="Iniciar llamada de voz en tiempo real con Susy Bot"
              aria-label="Iniciar llamada de voz en tiempo real con Susy Bot"
            >
              <PhoneCall size={18} />
              <span className="inline sm:hidden">Llamar</span>
            </button>
          )}

          {/* 4. BOTÓN EXPERIMENTAL FEATURE FLAG: MODO LIVE ⚡ (<500ms PIPER/KOKORO + GROQ) */}
          {onToggleLiveMode && (
            <button
              type="button"
              onClick={onToggleLiveMode}
              className={`flex min-w-[48px] min-h-[48px] px-2.5 py-2 rounded-xl items-center justify-center gap-1 transition-all shrink-0 cursor-pointer text-xs font-extrabold ${
                isLiveModeActive
                  ? "bg-amber-500/25 text-amber-300 border border-amber-400/60 shadow-md shadow-amber-950/50 animate-pulse"
                  : "text-amber-300/80 hover:text-amber-200 hover:bg-slate-800 border border-amber-500/20"
              }`}
              title={
                isLiveModeActive
                  ? `Desactivar Modo Live ⚡ (Volver al motor estándar)${
                      liveLatencyMs ? ` • TTFA: ${liveLatencyMs}ms` : ""
                    }`
                  : "Activar Modo Live ⚡ Experimental (Groq + Piper/Kokoro <500ms)"
              }
              aria-label="Alternar Modo Live Experimental de baja latencia"
              aria-pressed={isLiveModeActive}
            >
              <Zap size={16} />
              <span>Live ⚡</span>
            </button>
          )}

          {/* 5. BOTÓN VAD MANOS LIBRES (48x48px, p-3) */}
          {onToggleVAD && !isLiveModeActive && (
            <button
              type="button"
              onClick={onToggleVAD}
              className={`flex min-w-[48px] min-h-[48px] p-3 rounded-xl items-center justify-center transition-all shrink-0 cursor-pointer ${
                isVADListening
                  ? isUserSpeakingVAD
                    ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400 animate-pulse"
                    : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
              title={
                isVADListening
                  ? "Desactivar escucha continua manos libres (True Barge-in VAD)"
                  : "Activar escucha continua manos libres (True Barge-in VAD)"
              }
              aria-label="Alternar detección automática de voz VAD"
              aria-pressed={isVADListening}
            >
              <AudioWaveform size={20} />
            </button>
          )}
        </div>

        {/* FILA PRINCIPAL DE ENTRADA DE VOZ Y TEXTO (MICRÓFONO + INPUT + ENVIAR) */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full flex-1">
          {/* 6. BOTÓN MICRÓFONO STT DUAL / BARGE-IN (48x48px, p-3) */}
          <button
            type="button"
            onClick={onToggleRecording}
            className={`flex min-w-[48px] min-h-[48px] p-3 rounded-xl items-center justify-center transition-all shrink-0 cursor-pointer ${
              isRecording
                ? "bg-rose-500/25 text-rose-400 border border-rose-500/40 animate-pulse"
                : isTranscribing
                ? "bg-amber-500/20 text-amber-300"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
            title={isRecording ? "Detener grabación y transcribir" : "Hablar por micrófono (Barge-in)"}
            aria-label={isRecording ? "Detener grabación de voz" : "Iniciar grabación de voz"}
            aria-pressed={isRecording}
          >
            {isTranscribing ? (
              <Loader2 size={20} className="animate-spin" />
            ) : isRecording ? (
              <MicOff size={20} />
            ) : (
              <Mic size={20} />
            )}
          </button>

          {/* 7. CAMPO DE TEXTO MANUAL ACCESIBLE */}
          <input
            ref={textInputRef}
            type="text"
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? "Escuchando tu voz..."
                : isTranscribing
                ? "Transcribiendo audio..."
                : placeholder
            }
            className="flex-1 min-w-0 min-h-[48px] bg-transparent border-none text-white text-sm sm:text-base outline-none px-2 placeholder:text-slate-400"
            aria-label="Mensaje para Susy Bot"
          />

          {/* 8. BOTÓN ENVIAR (48x48px, p-3) */}
          <button
            type="button"
            onClick={onSendMessage}
            disabled={!canSend}
            className={`flex min-w-[48px] min-h-[48px] p-3 rounded-xl items-center justify-center transition-all shrink-0 ${
              canSend
                ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md shadow-indigo-950/50 active:scale-95"
                : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
            }`}
            title="Enviar consulta a Susy Bot"
            aria-label="Enviar consulta"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={19} />
            )}
          </button>
        </div>
      </div>

      {/* FIRMA INSTITUCIONAL Y CONTACTO TÉCNICO NEXORA ONE */}
      <div className="w-full max-w-5xl mx-auto mt-1.5 px-2 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
        <span>
          Desarrollado por <strong className="text-slate-200">Nexora One</strong> • Municipalidad de Ituzaingó
        </span>
        <span>
          Contacto Técnico:{" "}
          <a href="tel:3786414533" className="text-indigo-400 hover:underline font-medium">
            3786414533
          </a>{" "}
          •{" "}
          <a
            href="mailto:mjnexora.visual@gmail.com"
            className="text-indigo-400 hover:underline font-medium"
          >
            mjnexora.visual@gmail.com
          </a>
        </span>
      </div>
    </footer>
  );
}
