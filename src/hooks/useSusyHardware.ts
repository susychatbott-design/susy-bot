"use client";

import { useRef, useCallback, useState, useEffect } from "react";

export type NoraHardwareMode = "visual" | "voice";

export interface NoraHardwareState {
  currentMode: NoraHardwareMode;
  isCameraActive: boolean;
  isMicActive: boolean;
  isAudioPlaying: boolean;
  hardwareError: string | null;
}

export function useSusyHardware(initialMode: NoraHardwareMode = "visual") {
  const [currentMode, setCurrentMode] = useState<NoraHardwareMode>(initialMode);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [hardwareError, setHardwareError] = useState<string | null>(null);

  // Referencias a los Streams de hardware
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const activeAudioContextRef = useRef<AudioContext | null>(null);

  // Detiene todas las pistas de un MediaStream
  const stopMediaStream = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    try {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
    } catch (e) {}
  }, []);

  // Libera la cámara y el procesamiento visual
  const releaseCamera = useCallback(() => {
    if (videoStreamRef.current) {
      stopMediaStream(videoStreamRef.current);
      videoStreamRef.current = null;
    }
    setIsCameraActive(false);
  }, [stopMediaStream]);

  // Libera el micrófono y cierra AudioContext si corresponde
  const releaseMicrophone = useCallback(() => {
    if (audioStreamRef.current) {
      stopMediaStream(audioStreamRef.current);
      audioStreamRef.current = null;
    }
    if (activeAudioContextRef.current && activeAudioContextRef.current.state !== "closed") {
      try {
        activeAudioContextRef.current.close();
      } catch (e) {}
      activeAudioContextRef.current = null;
    }
    setIsMicActive(false);
  }, [stopMediaStream]);

  // Libera todos los dispositivos de hardware
  const releaseAllHardware = useCallback(() => {
    releaseCamera();
    releaseMicrophone();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setIsAudioPlaying(false);
    setHardwareError(null);
  }, [releaseCamera, releaseMicrophone]);

  // Adquiere la cámara de forma segura (Modo Visual)
  const acquireCamera = useCallback(
    async (facingMode: "user" | "environment" = "environment"): Promise<MediaStream | null> => {
      try {
        setHardwareError(null);
        if (videoStreamRef.current) {
          releaseCamera();
        }

        let stream: MediaStream | null = null;

        // 1. Intentar con facingMode ideal (ideal para móviles con cámara trasera/frontal)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode ? { ideal: facingMode } : undefined,
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 24, max: 30 }
            },
            audio: false
          });
        } catch (firstErr) {
          console.warn("[HardwareManager] Reintentando con configuración de cámara universal:", firstErr);
          // 2. Fallback universal (laptops, PCs de escritorio con webcam USB o sensor único)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }

        videoStreamRef.current = stream;
        setIsCameraActive(true);
        return stream;
      } catch (err: any) {
        console.warn("[HardwareManager] Error al adquirir cámara:", err);
        const msg = err.name === "NotAllowedError"
          ? "Permiso de cámara denegado. Por favor permite el acceso en tu navegador."
          : err.name === "NotReadableError"
          ? "La cámara está ocupada por otra aplicación. Ciérrala y vuelve a intentar."
          : "No se pudo iniciar la cámara en este dispositivo.";
        setHardwareError(msg);
        setIsCameraActive(false);
        return null;
      }
    },
    [releaseCamera]
  );

  // Adquiere el micrófono con filtros de audio de grado profesional (Modo Voz / WebRTC)
  const acquireMicrophone = useCallback(async (): Promise<MediaStream | null> => {
    try {
      setHardwareError(null);
      // En Modo Voz continuo, liberamos la cámara para maximizar ancho de banda y evitar interferencia
      if (videoStreamRef.current) {
        releaseCamera();
      }

      if (audioStreamRef.current) {
        releaseMicrophone();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000
        },
        video: false
      });

      audioStreamRef.current = stream;
      setIsMicActive(true);
      return stream;
    } catch (err: any) {
      console.warn("[HardwareManager] Error al adquirir micrófono:", err);
      const msg = err.name === "NotAllowedError"
        ? "Permiso de micrófono denegado."
        : "No se pudo conectar el micrófono.";
      setHardwareError(msg);
      setIsMicActive(false);
      return null;
    }
  }, [releaseCamera, releaseMicrophone]);

  const wakeLockSentinelRef = useRef<any>(null);

  // Mantiene la pantalla encendida activamente (Screen Wake Lock API)
  const acquireWakeLock = useCallback(async () => {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      try {
        if (!wakeLockSentinelRef.current || wakeLockSentinelRef.current.released) {
          wakeLockSentinelRef.current = await (navigator as any).wakeLock.request("screen");
          wakeLockSentinelRef.current.addEventListener("release", () => {
            console.log("[WakeLock] Screen Wake Lock liberado");
          });
          console.log("[WakeLock] Screen Wake Lock activado con éxito");
        }
      } catch (err) {
        console.warn("[WakeLock] Error solicitando Wake Lock:", err);
      }
    }
  }, []);

  // Libera el Screen Wake Lock
  const releaseWakeLock = useCallback(() => {
    if (wakeLockSentinelRef.current) {
      try {
        wakeLockSentinelRef.current.release();
      } catch (e) {}
      wakeLockSentinelRef.current = null;
    }
  }, []);

  // Cambia de modo de manera segura y limpia los recursos del modo anterior
  const switchMode = useCallback(
    (newMode: NoraHardwareMode) => {
      if (newMode === currentMode) return;

      if (newMode === "voice") {
        // Al pasar a modo voz: apagamos la cámara para evitar saturación y colisiones
        releaseCamera();
      } else {
        // Al pasar a modo visual: liberamos streams de audio continuo exclusivos si existían
        releaseMicrophone();
      }

      setCurrentMode(newMode);
      try {
        localStorage.setItem("susybot_interaction_mode", newMode);
      } catch (e) {}
    },
    [currentMode, releaseCamera, releaseMicrophone]
  );

  // Cargar modo preferido de localStorage al montar y escuchar visibilidad
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("susybot_interaction_mode") as NoraHardwareMode | null;
      if (savedMode && (savedMode === "visual" || savedMode === "voice")) {
        setCurrentMode(savedMode);
      }
    } catch (e) {}

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && (isCameraActive || isMicActive)) {
        await acquireWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
      releaseAllHardware();
    };
  }, [releaseAllHardware, acquireWakeLock, releaseWakeLock, isCameraActive, isMicActive]);

  return {
    currentMode,
    isCameraActive,
    isMicActive,
    isAudioPlaying,
    hardwareError,
    videoStreamRef,
    audioStreamRef,
    activeAudioContextRef,
    switchMode,
    acquireCamera,
    acquireMicrophone,
    releaseCamera,
    releaseMicrophone,
    releaseAllHardware,
    acquireWakeLock,
    releaseWakeLock,
    setIsAudioPlaying
  };
}
