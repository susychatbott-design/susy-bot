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
  isCameraActive: boolean;
  onToggleCamera: () => void;
  isLoading: boolean;
  selectedImageBase64: string | null;
  onSelectImage: (base64: string | null, fileName?: string, mimeType?: string) => void;
  placeholder?: string;
}

/**
 * SusyControlFooter: Barra inferior de control multimodal accesible (DUA).
 * Todos los botones interactivos respetan un hit-box mínimo de 48x48px (WCAG 2.1 AAA / Diseño Universal)
 * e integra controles para Cámara Titán, adjuntos, micrófono STT dual y escucha manos libres VAD.
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
      className="fixed bottom-0 left-0 right-0 w-full z-50 border-t border-white/10 bg-slate-950/95 backdrop-blur-md p-2 sm:p-3 sm:px-6 box-border"
      style={{
        paddingBottom: "max(10px, env(safe-area-inset-bottom))",
      }}
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

      {/* BARRA MULTIMODAL DE HIT-BOX ACCESIBLE (MIN 48x48px) */}
      <div className="w-full max-w-5xl mx-auto flex items-center gap-1.5 sm:gap-2 bg-slate-900/95 border border-white/15 rounded-2xl px-2 py-1.5 shadow-inner">
        {/* 1. BOTÓN CÁMARA TITÁN (48x48px) */}
        <button
          type="button"
          onClick={onToggleCamera}
          className={`min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
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

        {/* 2. BOTÓN ADJUNTAR IMAGEN / BOLETA (48x48px) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
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

        {/* 3. BOTÓN MICRÓFONO STT DUAL (48x48px) */}
        <button
          type="button"
          onClick={onToggleRecording}
          className={`min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
            isRecording
              ? "bg-rose-500/25 text-rose-400 border border-rose-500/40 animate-pulse"
              : isTranscribing
              ? "bg-amber-500/20 text-amber-300"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
          title={isRecording ? "Detener grabación y transcribir" : "Hablar por micrófono"}
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

        {/* 4. BOTÓN OPCIONAL VAD MANOS LIBRES (48x48px) */}
        {onToggleVAD && (
          <button
            type="button"
            onClick={onToggleVAD}
            className={`hidden sm:flex min-w-[48px] min-h-[48px] rounded-xl items-center justify-center transition-all shrink-0 cursor-pointer ${
              isVADListening
                ? isUserSpeakingVAD
                  ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400 animate-pulse"
                  : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title={
              isVADListening
                ? "Desactivar escucha continua manos libres (VAD)"
                : "Activar escucha continua manos libres con Barge-in (VAD)"
            }
            aria-label="Alternar detección automática de voz VAD"
            aria-pressed={isVADListening}
          >
            <AudioWaveform size={20} />
          </button>
        )}

        {/* 5. CAMPO DE TEXTO MANUAL ACCESIBLE */}
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

        {/* 6. BOTÓN ENVIAR (48x48px) */}
        <button
          type="button"
          onClick={onSendMessage}
          disabled={!canSend}
          className={`min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center transition-all shrink-0 ${
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
    </footer>
  );
}

export default SusyControlFooter;
