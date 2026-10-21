"use client";

import React, { useEffect, useRef } from "react";
import { X, Sun, Moon, AlertTriangle, Compass, ShieldAlert } from "lucide-react";
import { SpatialAlert, OpticalTelemetry } from "@/hooks/useSusyVision";

export interface SusyVisionViewportProps {
  isCameraActive: boolean;
  onCloseCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  alerts: SpatialAlert[];
  telemetry: OpticalTelemetry | null;
  isProcessing?: boolean;
  criticalHazardDetected?: boolean;
}

/**
 * SusyVisionViewport: Interfaz inmersiva de la Cámara Titán.
 * Consume los estados y refs de useSusyVision, dibuja un overlay visual en tiempo real
 * para los bounding boxes de TensorFlow.js (COCO-SSD) y despliega las alertas en esfera de 360°.
 */
export function SusyVisionViewport({
  isCameraActive,
  onCloseCamera,
  videoRef,
  canvasRef,
  alerts,
  telemetry,
  isProcessing = false,
  criticalHazardDetected = false,
}: SusyVisionViewportProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isLowLight = telemetry?.ambientLight === "Baja iluminación ambiental";

  // Dibujar bounding boxes de COCO-SSD en el canvas superpuesto
  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    const width = 320;
    const height = 240;
    overlay.width = width;
    overlay.height = height;

    ctx.clearRect(0, 0, width, height);

    if (!isCameraActive || alerts.length === 0) return;

    for (const alert of alerts) {
      if (!alert.rawBbox) continue;
      const [x, y, bw, bh] = alert.rawBbox;

      const strokeColor =
        alert.alertLevel === "danger"
          ? "#f43f5e"
          : alert.alertLevel === "warning"
          ? "#f59e0b"
          : "#10b981";

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = alert.alertLevel === "danger" ? 3 : 2;
      ctx.strokeRect(x, y, bw, bh);

      // Etiqueta superior del bounding box
      const tagText = `${alert.label.toUpperCase()} (${alert.clockPosition})`;
      ctx.font = "bold 10px sans-serif";
      const textMetrics = ctx.measureText(tagText);
      const tagHeight = 16;
      const tagY = Math.max(0, y - tagHeight);

      ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
      ctx.fillRect(x, tagY, textMetrics.width + 10, tagHeight);

      ctx.fillStyle = strokeColor;
      ctx.fillText(tagText, x + 5, tagY + 11);
    }
  }, [alerts, isCameraActive]);

  return (
    <div
      className={`fixed top-16 right-3 sm:right-5 w-76 sm:w-80 bg-slate-900/95 border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md transition-all duration-300 ${
        criticalHazardDetected
          ? "border-rose-500 ring-2 ring-rose-500/40"
          : "border-white/20"
      } ${
        isCameraActive
          ? "opacity-100 scale-100 pointer-events-auto"
          : "opacity-0 scale-95 pointer-events-none hidden"
      }`}
      style={{ zIndex: 999 }}
      role="region"
      aria-label="Visor de Cámara Titán y Telemetría Espacial"
    >
      {/* HEADER DEL HUD */}
      <div className="px-3 py-2 bg-slate-950/90 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
          <span
            className={`w-2 h-2 rounded-full ${
              criticalHazardDetected ? "bg-rose-500 animate-ping" : "bg-emerald-400 animate-ping"
            }`}
          />
          <span>
            {criticalHazardDetected ? "¡PELIGRO FRONTAL DETECTADO!" : "Cámara Titán • Esfera 360°"}
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseCamera}
          className="text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
          title="Apagar Cámara Titán"
          aria-label="Apagar Cámara Titán"
        >
          <X size={15} />
        </button>
      </div>

      {/* FEED DE VIDEO + CANVAS OCULTO DE CAPTURA + CANVAS SUPERPUESTO DE BOUNDING BOXES */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {/* Canvas interno de muestreo para useSusyVision */}
        <canvas ref={canvasRef} className="sr-only" aria-hidden="true" />
        {/* Canvas superpuesto visible para los Bounding Boxes de COCO-SSD */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none object-cover"
        />

        {criticalHazardDetected && (
          <div className="absolute top-2 left-2 right-2 bg-rose-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg animate-pulse">
            <ShieldAlert size={14} className="shrink-0" />
            <span>¡ALTO! Obstáculo o muro a menos de 1 metro</span>
          </div>
        )}

        {isProcessing && (
          <div className="absolute bottom-1.5 right-2 bg-slate-950/75 px-2 py-0.5 rounded text-[10px] font-medium text-emerald-300">
            Escaneando entorno...
          </div>
        )}
      </div>

      {/* PANEL DE TELEMETRÍA Y ALERTAS ESPACIALES */}
      <div className="p-3 text-[11px] space-y-2 bg-slate-900">
        {/* CONDICIONES AMBIENTALES */}
        <div className="flex items-center justify-between text-slate-400 border-b border-white/5 pb-1.5">
          <span className="flex items-center gap-1">
            {isLowLight ? (
              <Moon size={12} className="text-amber-400" />
            ) : (
              <Sun size={12} className="text-sky-400" />
            )}
            <span>{telemetry?.ambientLight || "Iluminación clara"}</span>
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <Compass size={12} className="text-indigo-400" />
            <span>Reloj Horario</span>
          </span>
        </div>

        {/* LISTADO DE OBJETOS DETECTADOS CON COORDENADAS HORARIAS Y METROS */}
        {alerts.length > 0 ? (
          <div className="space-y-1">
            {alerts.slice(0, 3).map((alert, index) => (
              <div
                key={`${alert.label}-${index}`}
                className={`p-1.5 rounded-lg flex items-start gap-1.5 ${
                  alert.alertLevel === "danger"
                    ? "bg-rose-600/30 border border-rose-500 text-rose-200 animate-pulse font-bold"
                    : alert.alertLevel === "warning"
                    ? "bg-amber-500/15 border border-amber-500/30 text-amber-300"
                    : "bg-slate-800/80 border border-white/5 text-slate-200"
                }`}
              >
                {alert.alertLevel === "danger" || alert.alertLevel === "warning" ? (
                  <AlertTriangle
                    size={13}
                    className={`shrink-0 mt-0.5 ${
                      alert.alertLevel === "danger" ? "text-rose-400" : "text-amber-400"
                    }`}
                  />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                )}
                <div className="leading-tight">
                  <span className="font-semibold capitalize">{alert.label}</span>{" "}
                  <span className="text-slate-400">a tus</span>{" "}
                  <span className="text-indigo-300 font-medium">{alert.clockPosition}</span>{" "}
                  <span className="text-slate-400">({alert.distance})</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-300 font-medium py-1 text-center">
            {telemetry?.frontalPathStatus || "Paso frontal despejado a las 12 en punto."}
          </div>
        )}
      </div>
    </div>
  );
}

export default SusyVisionViewport;
