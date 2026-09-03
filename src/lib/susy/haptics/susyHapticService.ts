/**
 * ========================================================================
 * 📳 NORA HAPTIC SERVICE (FEEDBACK TÁCTIL Y NAVEGACIÓN LAZARILLO)
 * Ubicación: src/lib/nora/haptics/susyHapticService.ts
 * ========================================================================
 */

export type HapticPatternType =
  | 'SUCCESS_AVANCE'
  | 'ALERT_PELIGRO'
  | 'CONFIRM_VOZ'
  | 'OBSTACULO_DISTANCIA'
  | 'STOP';

export type HapticIntensityMode = 'NORMAL' | 'SUAVE_TEA' | 'MUTED';

// Patrones en milisegundos: [vibración, silencio, vibración, silencio...]
const HAPTIC_PATTERNS_NORMAL: Record<Exclude<HapticPatternType, 'STOP'>, number[]> = {
  SUCCESS_AVANCE: [120], // 1 pulso corto y limpio de avance seguro
  CONFIRM_VOZ: [70, 50, 70], // 2 pulsos rápidos de confirmación táctil
  ALERT_PELIGRO: [300, 100, 300, 100, 450], // 3 pulsos intensos de peligro/freno inminente
  OBSTACULO_DISTANCIA: [150, 100, 150] // Advertencia de proximidad moderada
};

// Patrones adaptados para hipersensibilidad táctil (personas con TEA)
const HAPTIC_PATTERNS_SUAVE: Record<Exclude<HapticPatternType, 'STOP'>, number[]> = {
  SUCCESS_AVANCE: [45],
  CONFIRM_VOZ: [35, 40, 35],
  ALERT_PELIGRO: [120, 80, 120],
  OBSTACULO_DISTANCIA: [60, 60, 60]
};

export const triggerHapticFeedback = (
  patternType: HapticPatternType,
  intensity: HapticIntensityMode = 'NORMAL'
): void => {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  if (intensity === 'MUTED') return;

  try {
    if (patternType === 'STOP') {
      navigator.vibrate(0);
      return;
    }

    const patternSet = intensity === 'SUAVE_TEA' ? HAPTIC_PATTERNS_SUAVE : HAPTIC_PATTERNS_NORMAL;
    const pattern = patternSet[patternType];

    // Cancelar vibraciones residuales previas antes de despachar el nuevo patrón
    navigator.vibrate(0);
    navigator.vibrate(pattern);
  } catch (error) {
    console.warn('[Haptics Warning]:', error);
  }
};
