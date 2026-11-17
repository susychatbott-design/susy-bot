"use client";

import React, { useState } from "react";
import {
  X,
  Camera,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Siren,
  PhoneCall,
  Flame,
  CheckCircle2,
  Send,
  Loader2,
  FileCheck2,
} from "lucide-react";
import {
  ReportCategory,
  CapturedEvidence,
  GeoLocationCoordinates,
} from "@/hooks/useSusyVision";

export interface SusyVisionViewportProps {
  isCameraActive: boolean;
  onCloseCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  isProcessing?: boolean;
  currentGps?: GeoLocationCoordinates | null;
  onEvidenceCaptured?: (evidence: CapturedEvidence, categoryNote: string) => void;
  onToggleFacingMode?: () => void;
}

const CATEGORY_CHIPS: {
  id: ReportCategory;
  label: string;
  icon: React.ElementType;
  color: string;
  isUrgent?: boolean;
}[] = [
  {
    id: "siniestro_vial",
    label: "Siniestro / Ruta 12 y 41",
    icon: Siren,
    color: "bg-rose-600/30 text-rose-300 border-rose-500/50 hover:bg-rose-600/50",
    isUrgent: true,
  },
  {
    id: "defensa_civil",
    label: "Defensa Civil / Incendios",
    icon: Flame,
    color: "bg-amber-600/30 text-amber-300 border-amber-500/50 hover:bg-amber-600/50",
    isUrgent: true,
  },
  {
    id: "obras_publicas",
    label: "Bache / Calzada Rota",
    icon: AlertTriangle,
    color: "bg-blue-600/30 text-blue-300 border-blue-500/50 hover:bg-blue-600/50",
  },
  {
    id: "luminaria",
    label: "Alumbrado Público",
    icon: AlertTriangle,
    color: "bg-yellow-600/30 text-yellow-300 border-yellow-500/50 hover:bg-yellow-600/50",
  },
  {
    id: "limpieza_ramas",
    label: "Limpieza y Poda",
    icon: FileCheck2,
    color: "bg-emerald-600/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/50",
  },
  {
    id: "desarrollo_social",
    label: "Desarrollo Social / Asistencia",
    icon: FileCheck2,
    color: "bg-purple-600/30 text-purple-300 border-purple-500/50 hover:bg-purple-600/50",
  },
];

/**
 * SusyVisionViewport: HUD Táctico "Nora Live Exteriores / Relevamiento Municipal y Siniestros".
 * Proporciona retículo fotográfico, estampado pericial forense, selector de área
 * y botón de enlace directo al 911 / 107 para contingencias viales o rurales críticas.
 */
export function SusyVisionViewport({
  isCameraActive,
  onCloseCamera,
  videoRef,
  isProcessing = false,
  currentGps,
  onEvidenceCaptured,
  onToggleFacingMode,
}: SusyVisionViewportProps) {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>("obras_publicas");
  const [previewCaptured, setPreviewCaptured] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);

  if (!isCameraActive) return null;

  const currentCategoryData = CATEGORY_CHIPS.find((c) => c.id === selectedCategory);
  const isCritical = currentCategoryData?.isUrgent || false;

  const handleSnapEvidence = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    try {
      const canvas = document.createElement("canvas");
      const w = video.videoWidth || 960;
      const h = video.videoHeight || 720;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, w, h);

      // Estampado forense táctico
      const now = new Date();
      const dateString = `${now.toLocaleDateString("es-AR")} ${now.toLocaleTimeString("es-AR")}`;
      const coordString = currentGps
        ? `GPS: ${currentGps.latitude.toFixed(5)}, ${currentGps.longitude.toFixed(5)}`
        : "GPS: Ituzaingó";

      ctx.fillStyle = "rgba(0, 0, 0, 0.70)";
      ctx.fillRect(0, h - 38, w, 38);

      ctx.fillStyle = "#10b981";
      ctx.font = "bold 13px monospace";
      ctx.fillText("MUNICIPALIDAD DE ITUZAINGÓ - RELEVAMIENTO EXTERIORES", 14, h - 22);

      ctx.fillStyle = "#ffffff";
      ctx.font = "12px monospace";
      const meta = `${dateString} | ${coordString} | CAT: ${selectedCategory.toUpperCase()}`;
      const textLen = ctx.measureText(meta).width;
      ctx.fillText(meta, w - textLen - 14, h - 22);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setPreviewCaptured(dataUrl);
    } catch (e) {
      console.warn("[HUD Exteriores] Error al capturar:", e);
    }
  };

  const handleConfirmAndSend = async () => {
    if (!previewCaptured) return;
    setIsSubmitting(true);

    const now = new Date().toISOString();
    const evidence: CapturedEvidence = {
      imageBase64: previewCaptured,
      timestamp: now,
      gps: currentGps || null,
      category: selectedCategory,
      urgency: isCritical ? "critica" : "media",
    };

    if (onEvidenceCaptured) {
      onEvidenceCaptured(evidence, selectedCategory);
    }

    // Si es un siniestro vial o defensa civil, enviar notificación automática al endpoint SOS
    if (isCritical) {
      try {
        await fetch("/api/sos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: "relevamiento_nora_live",
            name: `Siniestro detectado en ${selectedCategory}`,
            message: `Reporte fotográfico de siniestro relevado en vivo con geolocalización.`,
            lat: currentGps?.latitude || -27.5852,
            lng: currentGps?.longitude || -56.6821,
            category: selectedCategory,
            timestamp: now,
          }),
        });
      } catch {
        // Ignorar falla de red secundaria
      }
    }

    setIsSubmitting(false);
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setPreviewCaptured(null);
      onCloseCamera();
    }, 2200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
      role="region"
      aria-label="Cámara Nora Live Exteriores - Relevamiento Urbano y Siniestros"
    >
      <div className="w-full max-w-xl bg-slate-950 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* HEADER DE LA CÁMARA */}
        <div className="px-4 py-3 bg-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase">
              Nora Live Exteriores • Ituzaingó
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleFacingMode && (
              <button
                type="button"
                onClick={onToggleFacingMode}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                title="Cambiar cámara (delantera/trasera)"
              >
                <RefreshCw size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={onCloseCamera}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400"
              title="Cerrar cámara"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* CONTENEDOR DE VIDEO / RETÍCULO */}
        <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
          {previewCaptured ? (
            <img
              src={previewCaptured}
              alt="Evidencia fotográfica capturada"
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* RETÍCULO TÁCTICO DE ENCUADRE */}
          {!previewCaptured && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className={`w-4/5 h-4/5 border-2 rounded-2xl border-dashed transition-colors ${
                  isCritical ? "border-rose-500/70" : "border-emerald-400/50"
                }`}
              />
              <div className="absolute w-8 h-8 border-t-2 border-l-2 border-white/60 top-6 left-6" />
              <div className="absolute w-8 h-8 border-t-2 border-r-2 border-white/60 top-6 right-6" />
              <div className="absolute w-8 h-8 border-b-2 border-l-2 border-white/60 bottom-6 left-6" />
              <div className="absolute w-8 h-8 border-b-2 border-r-2 border-white/60 bottom-6 right-6" />
            </div>
          )}

          {/* OVERLAY DE GPS EN TIEMPO REAL */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-[11px] text-emerald-300 font-mono">
            <MapPin size={12} className="text-emerald-400 shrink-0" />
            <span>
              {currentGps
                ? `${currentGps.latitude.toFixed(4)}, ${currentGps.longitude.toFixed(4)}`
                : "Obteniendo satélites GPS..."}
            </span>
          </div>

          {/* BOTÓN RÁPIDO DE CONTACTO AL 911 / 107 SI HAY SINIESTRO */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <a
              href="tel:911"
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-lg shadow-rose-950/80 cursor-pointer"
              title="Llamar al 911 Emergencias Policiales"
            >
              <PhoneCall size={12} />
              <span>911</span>
            </a>
            <a
              href="tel:107"
              className="px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1 shadow-lg shadow-red-950/80 cursor-pointer"
              title="Llamar al 107 SAME / Hospital"
            >
              <Siren size={12} />
              <span>107</span>
            </a>
          </div>
        </div>

        {/* SELECTOR DE CATEGORÍA DE PROBLEMÁTICA */}
        <div className="p-3 bg-slate-900/90 border-t border-white/10 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Clasificar Reporte Urbano o Siniestro:
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_CHIPS.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? `${cat.color} ring-1 ring-white/30 scale-105`
                      : "bg-slate-800/80 border-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon size={13} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* BOTONERA INFERIOR: DISPARAR / CONFIRMAR */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {previewCaptured ? (
              <>
                <button
                  type="button"
                  onClick={() => setPreviewCaptured(null)}
                  disabled={isSubmitting || reportSuccess}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Tomar otra
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndSend}
                  disabled={isSubmitting || reportSuccess}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all ${
                    reportSuccess
                      ? "bg-emerald-600 text-white"
                      : isCritical
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/60"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Canalizando a Mesa de Entradas...</span>
                    </>
                  ) : reportSuccess ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>¡Reporte Enviado al Dashboard!</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>
                        {isCritical ? "Enviar Alerta Crítica a Defensa Civil" : "Enviar a Cuadrilla Municipal"}
                      </span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSnapEvidence}
                disabled={isProcessing}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl transition-all ${
                  isCritical
                    ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                }`}
              >
                <Camera size={18} />
                <span>Capturar Evidencia y Ubicación GPS</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SusyVisionViewport;
