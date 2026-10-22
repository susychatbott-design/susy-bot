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
 * SusyHeader: Cabecera dinámica de Susy Bot Municipal (Ituzaingó).
 * Muestra estado de red en vivo (Online / Off-Grid), selector de modo cognitivo
 * (Concierge Municipal / Lazarillo / TEA), telemetría del motor STT, accesos rápidos
 * a módulos municipales y botón de pánico SOS que dispara el protocolo híbrido (Cloud / SMS).
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
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
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
    setShowExportMenu(false);
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
      // Si no hay contactos personalizados, abrir el modal de emergencia municipal (107 / 100 / 103 / 911)
      if (onTriggerSOSModal) {
        onTriggerSOSModal(undefined);
      }
    } finally {
      setIsDispatchingSOS(false);
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 w-full z-40 bg-slate-950/95 backdrop-blur-md shrink-0 border-b border-white/10 px-2 sm:px-4 flex items-center justify-between box-border"
      style={{
        paddingTop: "max(8px, env(safe-area-inset-top))",
        paddingBottom: "8px",
        minHeight: "58px",
      }}
    >
      {/* BLOQUE IZQUIERDO: HISTORIAL, IDENTIDAD MUNICIPAL & SELECTOR DE PERFIL COGNITIVO */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 min-w-0">
        {onToggleHistory && (
          <button
            type="button"
            onClick={onToggleHistory}
            className="min-w-[44px] min-h-[44px] p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-white/10 transition-colors flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
            title="Abrir historial de sesiones ciudadanas"
            aria-label="Abrir historial de sesiones ciudadanas"
          >
            <Menu size={18} />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <img
            src="/icons/icon-192x192.png"
            alt="Susy Bot Ituzaingó"
            className="w-8 h-8 rounded-full border border-indigo-500/50 object-cover shadow-sm shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="hidden lg:block">
            <div className="text-xs font-extrabold text-white tracking-wide leading-none">
              SUSY BOT • ITUZAINGÓ
            </div>
            <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
              Nexora One • IA Cívica Municipal
            </div>
          </div>
        </div>

        {/* SELECTOR DE MODO COGNITIVO (EJECUTIVO / LAZARILLO / TEA) */}
        <div
          className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10 gap-0.5 sm:gap-1 shrink-0"
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
                className={`min-h-[36px] flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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

      {/* BLOQUE DERECHO: RED, TELEMETRÍA STT, MÓDULOS MUNICIPALES, SOS Y LLAMADA EN VIVO */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* ESTADO DE RED (ONLINE / OFF-GRID) */}
        <div
          className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${
            isOnline
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse"
          }`}
          title={
            isOnline
              ? "Conectado a la Red Municipal y Digesto Cloud"
              : "Modo Autónomo Off-Grid Activo (Resiliencia Local)"
          }
        >
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="hidden xl:inline">{isOnline ? "Online" : "Off-Grid"}</span>
        </div>

        {/* TELEMETRÍA DEL MOTOR DE VOZ STT */}
        <div
          className={`hidden 2xl:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border ${
            audioEngine === "native-edge"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              audioEngine === "native-edge" ? "bg-amber-400" : "bg-indigo-400"
            }`}
          />
          <span>{audioEngine === "native-edge" ? "STT: Edge" : "STT: Whisper"}</span>
        </div>

        {isStreaming && (
          <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Procesando</span>
          </div>
        )}

        {/* ACCESOS RÁPIDOS MUNICIPALES (OFICINAS / GUÍA COMERCIAL / PRENSA) */}
        {onToggleOfficesGrid && (
          <button
            type="button"
            onClick={onToggleOfficesGrid}
            className="hidden lg:flex items-center justify-center min-w-[38px] min-h-[38px] p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Secretarías y Oficinas Municipales de Ituzaingó"
          >
            <Building2 size={15} />
          </button>
        )}

        {onOpenCommerceGuide && (
          <button
            type="button"
            onClick={onOpenCommerceGuide}
            className="hidden lg:flex items-center justify-center min-w-[38px] min-h-[38px] p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 hover:text-amber-200 border border-amber-500/20 transition-colors cursor-pointer"
            title="Guía Comercial Oficial de Ituzaingó"
          >
            <Store size={15} />
          </button>
        )}

        {onOpenPressModal && (
          <button
            type="button"
            onClick={onOpenPressModal}
            className="hidden xl:flex items-center justify-center min-w-[38px] min-h-[38px] p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-sky-300 hover:text-sky-200 border border-sky-500/20 transition-colors cursor-pointer"
            title="Boletín y Gacetillas de Prensa Municipal"
          >
            <Newspaper size={15} />
          </button>
        )}

        {/* MENÚ DE EXPORTACIÓN DOCUMENTAL (WORD / PDF / PPTX) */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setShowExportMenu((v) => !v)}
            className="min-w-[38px] min-h-[38px] p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-white/10 transition-colors flex items-center justify-center cursor-pointer"
            title="Exportar conversación (Word, PDF, PowerPoint)"
            aria-label="Exportar conversación"
          >
            <FileDown size={15} />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-1.5 w-36 bg-slate-900 border border-white/15 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
              <button
                type="button"
                onClick={() => handleExport("word")}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <span>Word (.doc)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport("pdf")}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <span>Documento PDF</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport("pptx")}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <span>PowerPoint (.pptx)</span>
              </button>
            </div>
          )}
        </div>

        {/* BOTÓN COMPARTIR / SINCRONIZAR TÓTEM QR */}
        {onOpenShareModal && (
          <button
            type="button"
            onClick={onOpenShareModal}
            className="hidden sm:flex min-w-[38px] min-h-[38px] p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 transition-colors items-center justify-center cursor-pointer"
            title="Compartir o vincular por Código QR"
            aria-label="Compartir o vincular por Código QR"
          >
            <Share2 size={15} />
          </button>
        )}

        {/* 🚨 BOTÓN DE PÁNICO SOS (PROTOCOLO HÍBRIDO CLOUD / SMS SATELITAL) */}
        <button
          type="button"
          onClick={handlePanicSOSClick}
          disabled={isDispatchingSOS}
          className="min-w-[48px] min-h-[48px] flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-extrabold shadow-lg shadow-rose-950/50 border border-rose-400/40 transition-all cursor-pointer shrink-0"
          title="Botón de Pánico SOS y Emergencias de Ituzaingó (107 / 100 / 103)"
          aria-label="Activar protocolo de emergencia SOS"
        >
          <Siren size={16} className={isDispatchingSOS ? "animate-spin" : "animate-pulse"} />
          <span>SOS</span>
        </button>

        {/* 📞 LLAMADA DE VOZ EN TIEMPO REAL — SIEMPRE VISIBLE EN MÓVIL Y ESCRITORIO (48x48px+) */}
        <button
          type="button"
          onClick={onOpenCallModal}
          className="flex items-center justify-center gap-1.5 min-w-[48px] min-h-[48px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-extrabold shadow-md shadow-emerald-950/40 border border-emerald-400/30 transition-all cursor-pointer shrink-0"
          title="Llamada de voz en vivo con Susy Bot"
          aria-label="Iniciar llamada de voz en vivo con Susy Bot"
        >
          <PhoneCall size={16} />
          <span>Llamar</span>
        </button>
      </div>
    </header>
  );
}

export default SusyHeader;
