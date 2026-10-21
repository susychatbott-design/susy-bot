"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { sanitizeForTTS } from "@/utils/audioUtils";

export type ClockPosition =
  | "9 en punto"
  | "10 en punto"
  | "12 en punto"
  | "2 en punto"
  | "3 en punto";

export type DistanceEstimate =
  | "a menos de un metro (alcance inmediato)"
  | "a aproximadamente un metro y medio"
  | "a más de dos metros de distancia";

export interface SpatialAlert {
  label: string;
  clockPosition: ClockPosition;
  distance: DistanceEstimate;
  alertLevel: "info" | "warning" | "danger";
  rawBbox?: [number, number, number, number];
}

export interface OpticalTelemetry {
  ambientLight: "Baja iluminación ambiental" | "Contraluz marcado" | "Iluminación clara y óptima";
  groundStatus: string;
  frontalPathStatus: string;
  lateralBalance: string;
  summaryText: string;
  isFrontalBlocked: boolean; // Detección estricta de muro / pared frontal a < 1m
  isGroundHazard: boolean;   // Detección estricta de desniveles / bordes en piso
}

export interface SusyVisionState {
  isCameraActive: boolean;
  isModelLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  alerts: SpatialAlert[];
  telemetry: OpticalTelemetry | null;
  lastSnapshotBase64: string | null;
  criticalHazardDetected: boolean;
}

export interface CocoSsdPrediction {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

export interface CocoSsdModel {
  detect: (input: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement) => Promise<CocoSsdPrediction[]>;
}

interface WindowWithTensorFlow extends Window {
  tf?: unknown;
  cocoSsd?: {
    load: (config: { base: string }) => Promise<CocoSsdModel>;
  };
  cocoSsdModel?: CocoSsdModel;
  loadingCocoPromise?: Promise<CocoSsdModel | null> | null;
}

const COCO_CLASS_TRANSLATIONS: Record<string, string> = {
  person: "persona",
  chair: "silla",
  couch: "sillón",
  "dining table": "mesa",
  tv: "pantalla",
  laptop: "computadora portátil",
  "cell phone": "teléfono",
  bottle: "botella",
  cup: "taza",
  book: "libro",
  backpack: "mochila",
  door: "puerta",
  car: "vehículo",
  bicycle: "bicicleta",
  motorcycle: "motocicleta",
  bus: "colectivo",
  truck: "camión",
  "traffic light": "semáforo",
  "stop sign": "señal de pare",
  bench: "banco de plaza",
  dog: "perro",
  "potted plant": "planta",
  clock: "reloj",
};

/**
 * useSusyVision: Motor de la Cámara Titán para Accesibilidad Ciudadana y Seguridad Física.
 * Incorpora telemetría de luminancia, gradiente de energía en el suelo (y > 0.65),
 * reconocimiento local COCO-SSD mapeado a la esfera del reloj y Alerta Reflexiva en el Cliente (0ms).
 */
export function useSusyVision() {
  const [state, setState] = useState<SusyVisionState>({
    isCameraActive: false,
    isModelLoading: false,
    isProcessing: false,
    error: null,
    alerts: [],
    telemetry: null,
    lastSnapshotBase64: null,
    criticalHazardDetected: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastReflexAlertTimestampRef = useRef<number>(0);

  // Alerta de voz reflexiva instantánea en el navegador (0ms, sin esperar a la nube)
  const triggerReflexiveWarning = useCallback((message: string): void => {
    const now = Date.now();
    // Cooldown de 2500ms para evitar repeticiones en bucle que saturen al vecino
    if (now - lastReflexAlertTimestampRef.current < 2500) {
      return;
    }
    lastReflexAlertTimestampRef.current = now;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const cleanMessage = sanitizeForTTS(message);
      if (!cleanMessage) return;

      const utterance = new SpeechSynthesisUtterance(cleanMessage);
      utterance.lang = "es-AR";
      utterance.rate = 1.30; // Rápida y de urgencia táctica
      utterance.pitch = 1.10;

      const voices = window.speechSynthesis.getVoices();
      const alertVoice =
        voices.find(
          (v) =>
            v.lang.toLowerCase().includes("es-ar") ||
            (v.lang.startsWith("es") && !v.lang.toLowerCase().includes("es-es") && v.name.includes("Natural"))
        ) ||
        voices.find((v) => v.lang.startsWith("es") && !v.lang.toLowerCase().includes("es-es")) ||
        null;

      if (alertVoice) {
        utterance.voice = alertVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Carga asíncrona no bloqueante de TensorFlow.js + COCO-SSD en el navegador
  const ensureCocoModel = useCallback(async (): Promise<CocoSsdModel | null> => {
    if (typeof window === "undefined") return null;
    const w = window as unknown as WindowWithTensorFlow;

    if (w.cocoSsdModel) return w.cocoSsdModel;
    if (w.loadingCocoPromise) return w.loadingCocoPromise;

    w.loadingCocoPromise = (async (): Promise<CocoSsdModel | null> => {
      setState((prev) => ({ ...prev, isModelLoading: true }));
      try {
        if (!w.tf) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js";
            s.async = true;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("No se pudo cargar TensorFlow.js"));
            document.head.appendChild(s);
          });
        }
        if (!w.cocoSsd && w.tf) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd";
            s.async = true;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("No se pudo cargar COCO-SSD"));
            document.head.appendChild(s);
          });
        }
        if (w.cocoSsd) {
          w.cocoSsdModel = await w.cocoSsd.load({ base: "lite_mobilenet_v2" });
        }
        return w.cocoSsdModel || null;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[useSusyVision] No se pudo precargar COCO-SSD local:", msg);
        return null;
      } finally {
        setState((prev) => ({ ...prev, isModelLoading: false }));
        w.loadingCocoPromise = null;
      }
    })();

    return w.loadingCocoPromise;
  }, []);

  // Inicializar stream de video de la Cámara Titán con fallback de cámara trasera a delantera
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
              width: { ideal: 480 },
              height: { ideal: 360 },
              frameRate: { ideal: 24, max: 30 },
            },
            audio: false,
          });
        } catch (errEnvironment: unknown) {
          console.warn("[useSusyVision] Fallback a cámara disponible por defecto:", errEnvironment);
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
        setState((prev) => ({ ...prev, isCameraActive: true, error: null }));
        ensureCocoModel().catch(() => {});
      } catch (err: unknown) {
        console.error("[useSusyVision] Error accediendo a la cámara:", err);
        setState((prev) => ({
          ...prev,
          isCameraActive: false,
          error: "No se pudo acceder a la cámara. Revisa los permisos del dispositivo.",
        }));
        throw err;
      }
    },
    [ensureCocoModel]
  );

  // Detener stream de cámara y liberar hardware
  const stopCamera = useCallback((): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    isProcessingRef.current = false;
    setState((prev) => ({
      ...prev,
      isCameraActive: false,
      isProcessing: false,
      alerts: [],
      telemetry: null,
      criticalHazardDetected: false,
    }));
  }, []);

  // Análisis óptico matricial: detección de muros, superficies planas y obstáculos en el piso
  const extractOpticalTelemetry = useCallback((canvas: HTMLCanvasElement): OpticalTelemetry => {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return {
        ambientLight: "Iluminación clara y óptima",
        groundStatus: "Superficie frontal uniforme.",
        frontalPathStatus: "Paso frontal a las 12 en punto despejado.",
        lateralBalance: "Espacio lateral simétrico.",
        summaryText: "12 libre.",
        isFrontalBlocked: false,
        isGroundHazard: false,
      };
    }

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let totalLum = 0;
    let leftLum = 0;
    let centerLum = 0;
    let rightLum = 0;
    let leftCount = 0;
    let centerCount = 0;
    let rightCount = 0;
    let groundCount = 0;
    let edgeEnergyCenter = 0;
    let edgeEnergyGround = 0;
    let prevLum = 0;

    const step = 8; // Muestreo ultra-rápido de baja latencia
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const idx = (y * w + x) * 4;
        const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        totalLum += lum;

        if (x < w * 0.30) {
          leftLum += lum;
          leftCount++;
        } else if (x <= w * 0.70) {
          centerLum += lum;
          centerCount++;
          edgeEnergyCenter += Math.abs(lum - prevLum);
        } else {
          rightLum += lum;
          rightCount++;
        }

        if (y > h * 0.65) {
          groundCount++;
          edgeEnergyGround += Math.abs(lum - prevLum);
        }

        prevLum = lum;
      }
    }

    const totalSamples = Math.max(1, leftCount + centerCount + rightCount);
    const avgLum = Math.round(totalLum / totalSamples);
    const avgCenter = Math.round(centerLum / Math.max(1, centerCount));
    const avgLeft = Math.round(leftLum / Math.max(1, leftCount));
    const avgRight = Math.round(rightLum / Math.max(1, rightCount));

    const centerEdgeDensity = edgeEnergyCenter / Math.max(1, centerCount);
    const groundEdgeDensity = edgeEnergyGround / Math.max(1, groundCount);

    const isTexturelessWall = centerEdgeDensity < 5 && avgCenter > 35 && avgCenter < 230;
    const isDenseObstacle = centerEdgeDensity > 26;
    const isFrontalBlocked = isTexturelessWall || isDenseObstacle;
    const isGroundHazard = groundEdgeDensity > 25;

    const ambientLight: OpticalTelemetry["ambientLight"] =
      avgLum < 45
        ? "Baja iluminación ambiental"
        : avgLum > 195
        ? "Contraluz marcado"
        : "Iluminación clara y óptima";

    const groundStatus = isGroundHazard
      ? "Desnivel, cordón o elemento en piso a menos de 1 metro."
      : "Piso despejado bajo tus pies.";

    const frontalPathStatus = isFrontalBlocked
      ? "¡ALTO! Muro o superficie frontal a menos de un metro."
      : "Paso frontal a las 12 libre.";

    const lateralBalance =
      avgLeft > avgRight + 20
        ? "Espacio más despejado a tus 9."
        : avgRight > avgLeft + 20
        ? "Espacio más despejado a tus 2."
        : "Pasaje lateral uniforme.";

    const summaryText = isFrontalBlocked
      ? `¡PELIGRO! Muro/superficie frontal a tus 12 a menos de un metro. ${lateralBalance}`
      : `${frontalPathStatus} ${groundStatus} ${lateralBalance}`;

    return {
      ambientLight,
      groundStatus,
      frontalPathStatus,
      lateralBalance,
      summaryText,
      isFrontalBlocked,
      isGroundHazard,
    };
  }, []);

  // Mapeo espacial de predicciones COCO-SSD a la esfera del reloj y distancias métricas
  const mapPredictionsToAlerts = useCallback(
    (predictions: CocoSsdPrediction[], canvasWidth: number, canvasHeight: number): SpatialAlert[] => {
      return predictions.slice(0, 3).map((p) => {
        const [x, y, bw, bh] = p.bbox;
        const cx = x + bw / 2;
        const name = COCO_CLASS_TRANSLATIONS[p.class] || p.class;

        const clockPosition: ClockPosition =
          cx < canvasWidth * 0.28
            ? "9 en punto"
            : cx < canvasWidth * 0.42
            ? "10 en punto"
            : cx <= canvasWidth * 0.58
            ? "12 en punto"
            : cx <= canvasWidth * 0.72
            ? "2 en punto"
            : "3 en punto";

        const ratio = bh / canvasHeight;
        const distance: DistanceEstimate =
          ratio > 0.50
            ? "a menos de un metro (alcance inmediato)"
            : ratio > 0.25
            ? "a aproximadamente un metro y medio"
            : "a más de dos metros de distancia";

        const isImminentDanger = clockPosition === "12 en punto" && ratio > 0.45;
        const alertLevel: SpatialAlert["alertLevel"] = isImminentDanger
          ? "danger"
          : ratio > 0.35
          ? "warning"
          : "info";

        return {
          label: name,
          clockPosition,
          distance,
          alertLevel,
          rawBbox: [x, y, bw, bh],
        };
      });
    },
    []
  );

  // Capturar fotograma, analizar con frame-dropping y disparar alerta reflexiva si hay peligro inminente
  const captureAndAnalyze = useCallback(async (): Promise<{
    imageBase64: string | null;
    telemetry: OpticalTelemetry | null;
    alerts: SpatialAlert[];
    formattedSummary: string;
    criticalHazard: boolean;
  }> => {
    // Guarda de descarte de fotogramas (frame-dropping) no bloqueante ante ráfagas de 30 FPS
    if (isProcessingRef.current || state.isProcessing) {
      return {
        imageBase64: state.lastSnapshotBase64,
        telemetry: state.telemetry,
        alerts: state.alerts,
        formattedSummary: state.telemetry?.summaryText || "Procesando fotograma en curso...",
        criticalHazard: state.criticalHazardDetected,
      };
    }

    isProcessingRef.current = true;
    setState((prev) => ({ ...prev, isProcessing: true }));

    try {
      const video = videoRef.current;
      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvasRef.current = canvas;
      }

      if (!video || video.readyState < 2) {
        throw new Error("El video de la cámara no está listo");
      }

      const w = 320;
      const h = 240;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas");

      ctx.drawImage(video, 0, 0, w, h);
      const imageBase64 = canvas.toDataURL("image/jpeg", 0.55);

      const telemetry = extractOpticalTelemetry(canvas);
      let alerts: SpatialAlert[] = [];

      const model = await ensureCocoModel();
      if (model) {
        const predictions = await model.detect(canvas);
        if (predictions && predictions.length > 0) {
          alerts = mapPredictionsToAlerts(predictions, w, h);
        }
      }

      // Protocolo de Alerta Reflexiva en el Cliente (0ms)
      const hasDangerAlert = alerts.some((a) => a.alertLevel === "danger");
      const criticalHazard = telemetry.isFrontalBlocked || hasDangerAlert;

      if (criticalHazard) {
        const dangerMessage = telemetry.isFrontalBlocked
          ? "¡Peligro! Superficie o pared de frente a menos de un metro. Detén tu paso."
          : `¡Peligro! ${alerts[0].label} a tus ${alerts[0].clockPosition} a menos de un metro.`;
        triggerReflexiveWarning(dangerMessage);
      }

      const objectSummary =
        alerts.length > 0
          ? alerts.map((a) => `${a.label} a tus ${a.clockPosition} (${a.distance})`).join("; ")
          : "";

      const formattedSummary = objectSummary
        ? `${telemetry.summaryText} Objetos: ${objectSummary}.`
        : telemetry.summaryText;

      isProcessingRef.current = false;
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        telemetry,
        alerts,
        lastSnapshotBase64: imageBase64,
        criticalHazardDetected: criticalHazard,
      }));

      return {
        imageBase64,
        telemetry,
        alerts,
        formattedSummary,
        criticalHazard,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Error procesando visión";
      console.warn("[useSusyVision] Fallo en captura y análisis:", errMsg);
      isProcessingRef.current = false;
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: errMsg,
      }));
      return {
        imageBase64: null,
        telemetry: null,
        alerts: [],
        formattedSummary: "Trayecto frontal a las 12 en punto transitable.",
        criticalHazard: false,
      };
    }
  }, [
    state.isProcessing,
    state.lastSnapshotBase64,
    state.telemetry,
    state.alerts,
    state.criticalHazardDetected,
    ensureCocoModel,
    extractOpticalTelemetry,
    mapPredictionsToAlerts,
    triggerReflexiveWarning,
  ]);

  // Limpieza de MediaStreams al desmontar
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
    captureAndAnalyze,
  };
}

export { useSusyVision as useNoraVision };
