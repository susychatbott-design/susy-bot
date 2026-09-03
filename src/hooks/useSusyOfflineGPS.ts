"use client";

import { useEffect, useState, useCallback } from 'react';

export interface GPSCoords {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number | null;
  heading?: number | null;
}

export const useSusyOfflineGPS = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [coords, setCoords] = useState<GPSCoords | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!('geolocation' in navigator)) {
      setGpsError('El dispositivo no cuenta con sensor de geolocalización.');
      return;
    }

    setIsLocating(true);

    // Monitoreo GPS Satelital continuo (de baja latencia y alta precisión)
    let watchId: number | null = null;

    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading
          });
          setGpsError(null);
          setIsLocating(false);
        },
        (error) => {
          let msg = 'Error obteniendo posición GPS.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              msg = 'Permiso de ubicación denegado por el usuario.';
              break;
            case error.POSITION_UNAVAILABLE:
              msg = 'Señal satelital GPS no disponible en este momento.';
              break;
            case error.TIMEOUT:
              msg = 'Tiempo de espera de señal GPS agotado.';
              break;
          }
          setGpsError(msg);
          setIsLocating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 5000
        }
      );
    } catch (err: any) {
      setGpsError(err.message || 'Error iniciando sensor GPS.');
      setIsLocating(false);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const refreshLocation = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setGpsError(null);
        setIsLocating(false);
      },
      (err) => {
        setGpsError(err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return { isOnline, coords, gpsError, isLocating, refreshLocation };
};
