"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  PhoneCall,
  Zap,
  Eye,
  Puzzle,
  FileDown,
  Share2,
  Siren,
  Wifi,
  WifiOff,
  Building2,
  Store,
  Newspaper,
  MoreVertical,
} from "lucide-react";
import { SusyMode, SusyProfileId, resolveCanonicalProfileId } from "@/lib/prompts";
import { exportNoraCleanWord, exportNoraCleanPdf, exportNoraCleanPptx } from "@/lib/exportUtils";
import { ChatMessage } from "@/hooks/useSusyChat";
import { AudioEngineType } from "@/hooks/useSusyAudio";
import { dispatchSOS, SOSResult } from "@/lib/susy/protocols/sosDispatcher";

export interface SusyHeaderProps {
  currentMode: SusyMode;
  onModeChange: (mode: SusyProfileId) => void;
  onOpenCallModal: () => void;
  onOpenShareModal?: () => void;
  onToggleHistory?: () => void;
  onTriggerSOSModal?: (sosResult?: SOSResult) => void;
  onOpenCommerceGuide?: () => void;
  onOpenPressModal?: () => void;
  onToggleOfficesGrid?: () => void;
  messages: ChatMessage[];
  isStreaming?: boolean;
  audioEngine?: AudioEngineType;
  deviceLatitude?: number | null;
  deviceLongitude?: number | null;
}

const MODE_CONFIGS: Record<
  SusyProfileId,
  { label: string; shortLabel: string; icon: React.ReactNode }
> = {
  executive: {
    label: "Concierge Municipal",
    shortLabel: "Municipal",
    icon: <Zap size={14} />,
  },
  lazarillo: {
    label: "Lazarillo Visual",
    shortLabel: "Lazarillo",
    icon: <Eye size={14} />,
  },
  tea: {
    label: "Inclusión TEA",
    shortLabel: "TEA",
    icon: <Puzzle size={14} />,
  },
};

/**
 * SusyHeader: Cabecera Mobile-First 100% adaptativa de Susy Bot Municipal (Nexora One).
 * - Los botones críticos ("Llamar" y "SOS") están SIEMPRE visibles en todas las resoluciones (min 48x48px).
 * - Las herramientas secundarias (Oficinas, Guía Comercial, Prensa, Exportar Word/PDF/PPTX, Compartir QR)
 *   se agrupan en un menú desplegable accesible desde móvil y escritorio sin desbordar la pantalla.
 */
export function SusyHeader({
  currentMode,
  onModeChange,
  onOpenCallModal,
  onOpenShareModal,
  onToggleHistory,
  onTriggerSOSModal,
  onOpenCommerceGuide,
  onOpenPressModal,
  onToggleOfficesGrid,
  messages,
  isStreaming = false,
  audioEngine = "cloud-whisper",
  deviceLatitude = null,
  deviceLongitude = null,
}: SusyHeaderProps) {
  const [showActionsMenu, setShowActionsMenu] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isDispatchingSOS, setIsDispatchingSOS] = useState<boolean>(false);

  const canonicalMode = resolveCanonicalProfileId(currentMode);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);

    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const formatConversationForExport = (): string => {
    if (messages.length === 0) return "Sin mensajes registrados.";
    return messages
      .map((m) => `### ${m.role === "user" ? "Vecino" : "Susy Bot"}:\n${m.content}\n`)
      .join("\n\n");
  };

  const handleExport = (type: "word" | "pdf" | "pptx"): void => {
    setShowActionsMenu(false);
    const content = formatConversationForExport();
    if (type === "word") {
      exportNoraCleanWord("Reporte Municipal - Susy Bot Ituzaingó", content);
    }
    if (type === "pdf") {
      exportNoraCleanPdf("Reporte Municipal - Susy Bot Ituzaingó", content);
    }
    if (type === "pptx") {
      exportNoraCleanPptx("Informe Municipal Susy Bot", content).catch(() => {});
    }
  };

  // Disparo del Protocolo SOS Híbrido (Online Cloud / Offline SMS Satelital)
  const handlePanicSOSClick = async (): Promise<void> => {
    if (isDispatchingSOS) return;
    setIsDispatchingSOS(true);

    try {
      const result = await dispatchSOS({
        lat: deviceLatitude,
        lng: deviceLongitude,
        isOnline,
        customNote: "Activación de Botón de Pánico SOS desde Cabecera Susy Bot",
      });

      if (onTriggerSOSModal) {
        onTriggerSOSModal(result);
      } else if (result.method === "SMS" && result.smsUri && typeof window !== "undefined") {
        window.location.href = result.smsUri;
      }
    } catch {
      if (onTriggerSOSModal) {
        onTriggerSOSModal(undefined);
      }
    } finally {
      setIsDispatchingSOS(false);
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 w-full max-w-full z-40 bg-slate-950/95 backdrop-blur-md shrink-0 border-b border-white/10 px-2 sm:px-4 pb-2 pt-[max(16px,env(safe-area-inset-top))] flex items-center justify-between gap-1 sm:gap-2 box-border"
    >
      {/* BLOQUE IZQUIERDO: HISTORIAL & SELECTOR DE MODO COGNITIVO */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-0">
        {onToggleHistory && (
          <button
            type="button"
            onClick={onToggleHistory}
            className="flex items-center justify-center min-w-[42px] min-h-[42px] sm:min-w-[48px] sm:min-h-[48px] p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-white/10 transition-colors cursor-pointer active:scale-95 shrink-0"
            title="Abrir historial de sesiones ciudadanas"
            aria-label="Abrir historial de sesiones ciudadanas"
          >
            <Menu size={19} />
          </button>
        )}

        {/* SELECTOR DE MODO COGNITIVO (EJECUTIVO / LAZARILLO / TEA) */}
        <div
          className="flex items-center bg-slate-900/90 p-0.5 sm:p-1 rounded-xl border border-white/10 gap-0.5 sm:gap-1 shrink-0"
          role="group"
          aria-label="Selección de perfil de asistencia ciudadana"
        >
          {(["executive", "lazarillo", "tea"] as const).map((m) => {
            const isSelected = canonicalMode === m;
            const cfg = MODE_CONFIGS[m];

            return (
              <button
                key={m}
                type="button"
                onClick={() => onModeChange(m)}
                aria-pressed={isSelected}
                title={cfg.label}
                className={`min-w-[34px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center gap-1 px-1.5 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600/35 text-indigo-200 border border-indigo-500/40 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cfg.icon}
                <span className="hidden md:inline">{cfg.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BLOQUE DERECHO: BOTONES CRÍTICOS SIEMPRE VISIBLES (LLAMAR + SOS) Y MENÚ AGRUPADO */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* INDICADOR DE ESTADO DE RED (EN ESCRITORIO Y TABLET) */}
        <div
          className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${
            isOnline
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse"
          }`}
          title={
            isOnline
              ? `Conectado • Motor ${audioEngine === "native-edge" ? "Edge" : "Whisper"}`
              : "Modo Autónomo Off-Grid Activo"
          }
        >
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span className="hidden lg:inline">{isOnline ? "Online" : "Off-Grid"}</span>
        </div>

        {isStreaming && (
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="hidden sm:inline">Procesando</span>
          </div>
        )}

        {/* 🚨 BOTÓN CRÍTICO 1: PÁNICO SOS (SIEMPRE VISIBLE EN MÓVIL Y PC) */}
        <button
          type="button"
          onClick={handlePanicSOSClick}
          disabled={isDispatchingSOS}
          className="flex items-center justify-center gap-1 min-w-[44px] min-h-[42px] sm:min-w-[48px] sm:min-h-[48px] px-2.5 sm:px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-extrabold shadow-lg shadow-rose-950/50 border border-rose-400/40 transition-all cursor-pointer shrink-0"
          title="Botón de Pánico SOS y Emergencias de Ituzaingó (107 / 100 / 103)"
          aria-label="Activar protocolo de emergencia SOS"
        >
          <Siren size={16} className={isDispatchingSOS ? "animate-spin" : "animate-pulse"} />
          <span>SOS</span>
        </button>

        {/* 📞 BOTÓN CRÍTICO 2: LLAMADA DE VOZ EN TIEMPO REAL (SIEMPRE VISIBLE EN MÓVIL Y PC) */}
        <button
          type="button"
          onClick={onOpenCallModal}
          className="flex items-center justify-center gap-1 min-w-[44px] min-h-[42px] sm:min-w-[48px] sm:min-h-[48px] px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-extrabold shadow-md shadow-emerald-950/40 border border-emerald-400/30 transition-all cursor-pointer shrink-0"
          title="Llamada de voz en vivo con Susy Bot"
          aria-label="Iniciar llamada de voz en vivo con Susy Bot"
        >
          <PhoneCall size={16} />
          <span>Llamar</span>
        </button>

        {/* MENÚ AGRUPADO DE HERRAMIENTAS MUNICIPALES Y EXPORTACIÓN (MÓVIL Y ESCRITORIO) */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowActionsMenu((v) => !v)}
            className="flex items-center justify-center min-w-[40px] min-h-[42px] sm:min-w-[48px] sm:min-h-[48px] p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-white/10 transition-colors cursor-pointer active:scale-95"
            title="Más herramientas municipales, exportar y compartir"
            aria-label="Abrir menú de herramientas municipales y exportación"
          >
            <MoreVertical size={18} />
          </button>

          {showActionsMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden py-1.5 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                Módulos Municipales
              </div>

              {onToggleOfficesGrid && (
                <button
                  type="button"
                  onClick={() => {
                    setShowActionsMenu(false);
                    onToggleOfficesGrid();
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                >
                  <Building2 size={15} className="text-indigo-400" />
                  <span>Secretarías y Oficinas</span>
                </button>
              )}

              {onOpenCommerceGuide && (
                <button
                  type="button"
                  onClick={() => {
                    setShowActionsMenu(false);
                    onOpenCommerceGuide();
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                >
                  <Store size={15} className="text-amber-400" />
                  <span>Guía Comercial Ituzaingó</span>
                </button>
              )}

              {onOpenPressModal && (
                <button
                  type="button"
                  onClick={() => {
                    setShowActionsMenu(false);
                    onOpenPressModal();
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                >
                  <Newspaper size={15} className="text-sky-400" />
                  <span>Boletín de Prensa Oficial</span>
                </button>
              )}

              {onOpenShareModal && (
                <button
                  type="button"
                  onClick={() => {
                    setShowActionsMenu(false);
                    onOpenShareModal();
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                >
                  <Share2 size={15} className="text-emerald-400" />
                  <span>Compartir / Código QR</span>
                </button>
              )}

              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-y border-white/10 mt-1">
                Exportar Conversación
              </div>

              <button
                type="button"
                onClick={() => handleExport("word")}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
              >
                <FileDown size={14} className="text-sky-400" />
                <span>Descargar Word (.doc)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport("pdf")}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
              >
                <FileDown size={14} className="text-rose-400" />
                <span>Imprimir / Guardar PDF</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport("pptx")}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
              >
                <FileDown size={14} className="text-amber-400" />
                <span>Presentación PowerPoint (.pptx)</span>
              </button>

              <div className="px-3.5 py-2 bg-slate-950/90 border-t border-white/10 text-[10px] text-slate-400">
                <div className="font-bold text-slate-200">Nexora One</div>
                <div>Tel: 3786414533</div>
                <div className="truncate">mjnexora.visual@gmail.com</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default SusyHeader;
