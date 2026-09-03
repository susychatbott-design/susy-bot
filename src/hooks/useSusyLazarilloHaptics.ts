"use client";

import { useCallback, useRef, useState, useEffect } from 'react';
import {
  triggerHapticFeedback,
  HapticPatternType,
  HapticIntensityMode
} from '@/lib/susy/haptics/susyHapticService';

export const useSusyLazarilloHaptics = (initialIntensity: HapticIntensityMode = 'NORMAL') => {
  const alertIntervalRef = useRef<any>(null);
  const [intensity, setIntensity] = useState<HapticIntensityMode>(initialIntensity);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nora_haptic_intensity') as HapticIntensityMode;
      if (stored) setIntensity(stored);
    }
  }, []);

  const changeIntensity = useCallback((mode: HapticIntensityMode) => {
    setIntensity(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nora_haptic_intensity', mode);
    }
    // Pulso de prueba
    if (mode !== 'MUTED') {
      triggerHapticFeedback('CONFIRM_VOZ', mode);
    }
  }, []);

  // Detener de inmediato todo estímulo táctil
  const clearHapticAlerts = useCallback(() => {
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = null;
    }
    triggerHapticFeedback('STOP', intensity);
  }, [intensity]);

  // Emitir un pulso háptico único (Éxito, Avance o Confirmación de Voz)
  const emitSinglePulse = useCallback(
    (type: 'SUCCESS_AVANCE' | 'CONFIRM_VOZ' | 'OBSTACULO_DISTANCIA') => {
      triggerHapticFeedback(type, intensity);
    },
    [intensity]
  );

  // Activar un bucle de alerta de peligro intermitente (Alerta Crítica Peatonal)
  // Útil para cuando la visión detecta un pozo, escalón o semáforo en rojo
  const startDangerAlertLoop = useCallback(() => {
    if (alertIntervalRef.current) return;

    // Disparar primer pulso inmediatamente
    triggerHapticFeedback('ALERT_PELIGRO', intensity);

    // Mantener el ciclo activo cada 2.5 segundos hasta que se ordene detenerse
    alertIntervalRef.current = setInterval(() => {
      triggerHapticFeedback('ALERT_PELIGRO', intensity);
    }, 2500);
  }, [intensity]);

  // Limpieza al desmontar componente
  useEffect(() => {
    return () => {
      clearHapticAlerts();
    };
  }, [clearHapticAlerts]);

  return {
    intensity,
    changeIntensity,
    emitSinglePulse,
    startDangerAlertLoop,
    clearHapticAlerts
  };
};
