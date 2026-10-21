"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface DeviceLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  province?: string;
  country?: string;
  timestamp?: number;
}

export interface UseSusyDeviceCapabilitiesOptions {
  userName?: string;
  autoRequestWakeLock?: boolean;
  enableGeolocation?: boolean;
}

export interface SusyDeviceCapabilitiesState {
  isWakeLockActive: boolean;
  isWakeLockSupported: boolean;
  userName: string;
  location: DeviceLocationData | null;
  locationError: string | null;
}

interface WakeLockSentinelLike extends EventTarget {
  readonly released: boolean;
  release: () => Promise<void>;
}

interface WakeLockContainer {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
}

/**
 * useSusyDeviceCapabilities: Hook para potenciar la experiencia móvil ciudadana (PWA/Browser).
 *
 * Prestaciones:
 * 1. Screen Wake Lock API con guarda isAcquiringWakeLockRef: Impide que la pantalla del celular se apague
 *    durante llamadas en vivo, Modo Lazarillo o uso de la Cámara Titán.
 * 2. Identidad del Ciudadano: Personalización con calidez humana e institucional.
 * 3. Geolocalización No Bloqueante: Aporte de coordenadas con fallback automático al Palacio Municipal
 *    de Ituzaingó, Corrientes (-27.5833, -56.6833).
 */
export function useSusyDeviceCapabilities(options: UseSusyDeviceCapabilitiesOptions = {}) {
  const {
    userName: initialUserName = "Vecino",
    autoRequestWakeLock = false,
    enableGeolocation = true,
  } = options;

  const [state, setState] = useState<SusyDeviceCapabilitiesState>({
    isWakeLockActive: false,
    isWakeLockSupported: false,
    userName: initialUserName,
    location: null,
    locationError: null,
  });

  const wakeLockSentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const isAcquiringWakeLockRef = useRef<boolean>(false);

  // 1. GESTIÓN DE SCREEN WAKE LOCK API (CON PARQUEO DE CONCURRENCIA)
  const requestWakeLock = useCallback(async (): Promise<boolean> => {
    if (
      typeof window === "undefined" ||
      !("wakeLock" in navigator) ||
      document.visibilityState !== "visible"
    ) {
      return false;
    }

    if (isAcquiringWakeLockRef.current) return false;

    try {
      if (wakeLockSentinelRef.current && !wakeLockSentinelRef.current.released) {
        return true;
      }

      isAcquiringWakeLockRef.current = true;
      const nav = navigator as unknown as WakeLockContainer;
      if (!nav.wakeLock) return false;

      const sentinel = await nav.wakeLock.request("screen");
      wakeLockSentinelRef.current = sentinel;

      sentinel.addEventListener("release", () => {
        wakeLockSentinelRef.current = null;
        setState((prev) => ({ ...prev, isWakeLockActive: false }));
      });

      setState((prev) => ({ ...prev, isWakeLockActive: true }));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[useSusyDeviceCapabilities] WakeLock no adquirido:", msg);
      setState((prev) => ({ ...prev, isWakeLockActive: false }));
      return false;
    } finally {
      isAcquiringWakeLockRef.current = false;
    }
  }, []);

  const releaseWakeLock = useCallback(async (): Promise<void> => {
    if (wakeLockSentinelRef.current && !wakeLockSentinelRef.current.released) {
      try {
        await wakeLockSentinelRef.current.release();
      } catch (err: unknown) {
        console.warn("[useSusyDeviceCapabilities] Error al liberar WakeLock:", err);
      }
      wakeLockSentinelRef.current = null;
    }
    setState((prev) => ({ ...prev, isWakeLockActive: false }));
  }, []);

  useEffect(() => {
    const isSupported = typeof window !== "undefined" && "wakeLock" in navigator;
    setState((prev) => ({ ...prev, isWakeLockSupported: isSupported }));

    if (autoRequestWakeLock && isSupported) {
      requestWakeLock().catch(() => {});
    }

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible" && autoRequestWakeLock) {
        requestWakeLock().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock().catch(() => {});
    };
  }, [autoRequestWakeLock, requestWakeLock, releaseWakeLock]);

  // 2. CAPTURA DE GEOLOCALIZACIÓN NO BLOQUEANTE (FALLBACK ITUZAINGÓ, CORRIENTES)
  const refreshLocation = useCallback((): void => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState((prev) => ({
        ...prev,
        locationError: "Geolocalización no soportada en este navegador.",
        location: {
          latitude: -27.5833,
          longitude: -56.6833,
          accuracy: 10,
          city: "Ituzaingó",
          province: "Corrientes",
          country: "Argentina",
        },
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: DeviceLocationData = {
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
          accuracy: Math.round(pos.coords.accuracy),
          city: "Ituzaingó",
          province: "Corrientes",
          country: "Argentina",
          timestamp: pos.timestamp,
        };
        setState((prev) => ({ ...prev, location: coords, locationError: null }));
      },
      (err) => {
        console.warn("[useSusyDeviceCapabilities] Ubicación GPS no disponible:", err.message);
        setState((prev) => ({
          ...prev,
          locationError: err.message,
          location: {
            latitude: -27.5833,
            longitude: -56.6833,
            accuracy: 10,
            city: "Ituzaingó",
            province: "Corrientes",
            country: "Argentina",
          },
        }));
      },
      {
        enableHighAccuracy: false,
        timeout: 6000,
        maximumAge: 120000,
      }
    );
  }, []);

  useEffect(() => {
    if (enableGeolocation) {
      refreshLocation();
    }
  }, [enableGeolocation, refreshLocation]);

  // 3. ACTUALIZACIÓN DEL NOMBRE DEL CIUDADANO
  const setUserName = useCallback((name: string): void => {
    const cleanName = name.trim();
    if (cleanName) {
      setState((prev) => ({ ...prev, userName: cleanName }));
    }
  }, []);

  return {
    ...state,
    requestWakeLock,
    releaseWakeLock,
    refreshLocation,
    setUserName,
  };
}

export { useSusyDeviceCapabilities as useNoraDeviceCapabilities };
