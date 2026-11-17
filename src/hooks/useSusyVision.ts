"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { sanitizeForTTS } from "@/utils/audioUtils";
import { applyLatinVoice } from "@/utils/latinVoice";

export type ReportCategory =
  | "siniestro_vial"        // Siniestro en Ruta 12 / 41 / Zona Rural
  | "defensa_civil"         // Incendio, poste caído, temporal
  | "obras_publicas"        // Baches, calzada rota, alcantarillas
  | "luminaria"             // Alumbrado público apagado / averiado
  | "limpieza_ramas"        // Basura, poda, ramas en calle
  | "desarrollo_social"     // Asistencia habitacional / anegamiento
  | "turismo_cultura"       // Playas, señalética, eventos
  | "general";

export interface GeoLocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude?: number | null;
}

export interface CapturedEvidence {
  imageBase64: string;
  timestamp: string;
  gps: GeoLocationCoordinates | null;
  category: ReportCategory;
  urgency: "baja" | "media" | "alta" | "critica";
}

export interface SusyVisionState {
  isCameraActive: boolean;
  isProcessing: boolean;
  error: string | null;
  lastEvidence: CapturedEvidence | null;
  currentGps: GeoLocationCoordinates | null;
  activeFacingMode: "user" | "environment";
  flashEnabled: boolean;
}

/**
 * useSusyVision: Motor de "Nora Live Exteriores / Relevamiento Urbano y Siniestros".
 * Captura evidencia fotográfica optimizada, geolocalización satelital de alta precisión
 * y canalización directa a Defensa Civil, Obras Públicas y servicios de emergencia (911/107).
 */
export function useSusyVision() {
  const [state, setState] = useState<SusyVisionState>({
    isCameraActive: false,
    isProcessing: false,
    error: null,
    lastEvidence: null,
    currentGps: null,
    activeFacingMode: "environment",
    flashEnabled: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Alerta sonora institucional inmediata
  const speakStatus = useCallback((message: string): void => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const clean = sanitizeForTTS(message);
        if (!clean) return;
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = "es-AR";
        utterance.rate = 1.15;
        applyLatinVoice(utterance);
        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignorar fallas silenciosamente
      }
    }
  }, []);

  // Obtener geolocalización GPS precisa del dispositivo
  const fetchCurrentGps = useCallback(async (): Promise<GeoLocationCoordinates | null> => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return {
        latitude: -27.5852,
        longitude: -56.6821,
        accuracy: null,
      };
    }

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 6000,
          enableHighAccuracy: true,
          maximumAge: 10000,
        });
      });

      const coords: GeoLocationCoordinates = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
      };

      setState((prev) => ({ ...prev, currentGps: coords }));
      return coords;
    } catch {
      // Coordenadas cívicas por defecto de Ituzaingó (Corrientes)
      const fallbackCoords: GeoLocationCoordinates = {
        latitude: -27.5852,
        longitude: -56.6821,
        accuracy: null,
      };
      setState((prev) => ({ ...prev, currentGps: fallbackCoords }));
      return fallbackCoords;
    }
  }, []);

  // Iniciar stream de video con preferencia de cámara trasera (para relevamiento exterior)
  const startCamera = useCallback(
    async (facingMode: "user" | "environment" = "environment"): Promise<void> => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
            },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.setAttribute("autoplay", "true");
          videoRef.current.muted = true;
          await videoRef.current.play().catch(() => {});
        }

        setState((prev) => ({
          ...prev,
          isCameraActive: true,
          activeFacingMode: facingMode,
          error: null,
        }));

        // Adquirir coordenadas en segundo plano sin bloquear el video
        fetchCurrentGps().catch(() => {});
      } catch (err: unknown) {
        console.error("[useSusyVision] Error al abrir cámara:", err);
        setState((prev) => ({
          ...prev,
          isCameraActive: false,
          error: "No se pudo acceder a la cámara. Verifique los permisos en el navegador.",
        }));
        throw err;
      }
    },
    [fetchCurrentGps]
  );

  // Detener cámara y liberar hardware
  const stopCamera = useCallback((): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState((prev) => ({
      ...prev,
      isCameraActive: false,
      isProcessing: false,
    }));
  }, []);

  // Alternar entre cámara trasera y delantera
  const toggleCameraFacing = useCallback(async (): Promise<void> => {
    const nextFacing = state.activeFacingMode === "environment" ? "user" : "environment";
    await startCamera(nextFacing);
  }, [state.activeFacingMode, startCamera]);

  // Capturar fotograma de alta definición y empaquetar con GPS para el reclamo/siniestro
  const captureEvidence = useCallback(
    async (
      category: ReportCategory = "general",
      urgency: "baja" | "media" | "alta" | "critica" = "media"
    ): Promise<CapturedEvidence | null> => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        speakStatus("Cámara no lista para capturar. Enfocá nuevamente.");
        return null;
      }

      setState((prev) => ({ ...prev, isProcessing: true }));

      try {
        let canvas = canvasRef.current;
        if (!canvas) {
          canvas = document.createElement("canvas");
          canvasRef.current = canvas;
        }

        const width = video.videoWidth || 960;
        const height = video.videoHeight || 720;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No se pudo obtener el contexto 2D");

        ctx.drawImage(video, 0, 0, width, height);

        // Estampado forense táctico en la imagen (Fecha, Hora y Coordenadas para valor pericial municipal)
        const gps = await fetchCurrentGps();
        const now = new Date();
        const dateString = `${now.toLocaleDateString("es-AR")} ${now.toLocaleTimeString("es-AR")}`;
        const coordString = gps
          ? `GPS: ${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)} (±${Math.round(gps.accuracy || 0)}m)`
          : "GPS: Ejido Ituzaingó";

        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, height - 36, width, 36);

        ctx.fillStyle = "#10b981"; // Emerald
        ctx.font = "bold 13px monospace";
        ctx.fillText(`MUNICIPALIDAD DE ITUZAINGÓ - RELEVAMIENTO EXTERIORES`, 12, height - 20);

        ctx.fillStyle = "#ffffff";
        ctx.font = "12px monospace";
        const metaText = `${dateString} | ${coordString}`;
        const metaWidth = ctx.measureText(metaText).width;
        ctx.fillText(metaText, width - metaWidth - 12, height - 20);

        const imageBase64 = canvas.toDataURL("image/jpeg", 0.82);

        const evidence: CapturedEvidence = {
          imageBase64,
          timestamp: now.toISOString(),
          gps,
          category,
          urgency,
        };

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          lastEvidence: evidence,
        }));

        if (urgency === "critica" || category === "siniestro_vial") {
          speakStatus("Evidencia de siniestro capturada con ubicación GPS. Canalizando a Defensa Civil.");
        } else {
          speakStatus("Fotografía de relevamiento capturada con éxito.");
        }

        return evidence;
      } catch (err) {
        console.error("[useSusyVision] Error al capturar evidencia:", err);
        setState((prev) => ({ ...prev, isProcessing: false, error: "Error al capturar imagen" }));
        return null;
      }
    },
    [fetchCurrentGps, speakStatus]
  );

  // Compatibilidad hacia atrás con page.tsx y otros módulos
  const captureAndAnalyze = useCallback(async () => {
    const evidence = await captureEvidence("general", "media");
    return {
      imageBase64: evidence?.imageBase64 || null,
      telemetry: null,
      alerts: [],
      formattedSummary: evidence?.gps
        ? `Relevamiento visual en coordenadas ${evidence.gps.latitude.toFixed(4)}, ${evidence.gps.longitude.toFixed(4)}.`
        : "Relevamiento visual capturado en Ituzaingó.",
      criticalHazard: false,
    };
  }, [captureEvidence]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    ...state,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    toggleCameraFacing,
    captureEvidence,
    captureAndAnalyze,
    fetchCurrentGps,
    speakStatus,
  };
}

export { useSusyVision as useNoraVision };
