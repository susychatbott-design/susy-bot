/**
 * ========================================================================
 * 🏛️ SUSYBOT MUNICIPAL - ROUTER DE ACCESIBILIDAD, TEA Y LAZARILLO CIUDADANO
 * Ubicación: /src/lib/susy/educationalRouter.ts
 * 
 * 1. Inclusión Cognitiva (TEA / DUA) adaptada a gestiones de la ciudad.
 * 2. Lazarillo Visual y lectura de trámites para personas no videntes.
 * ========================================================================
 */

import {
  MUNICIPAL_TEA_ACCESSIBILITY_GUIDE,
  MUNICIPAL_LAZARILLO_FRAMEWORK
} from "./curricularFramework";

export function resolveAdaptiveEducationalContext(arg1: any, arg2?: any): string {
  const userMessage = typeof arg1 === "string" ? arg1 : (typeof arg2 === "string" ? arg2 : "");
  const contextData = typeof arg1 === "object" ? arg1 : (typeof arg2 === "object" ? arg2 : {});

  const lower = (userMessage || "").toLowerCase();
  const explicitMode = contextData?.mode?.toLowerCase() || "";

  // 1. MODO LAZARILLO VISUAL Y ORIENTACIÓN ESPACIAL (Discapacidad Visual / Cámara en Vivo / No Videntes)
  const isLazarillo = explicitMode === "lazarillo" || explicitMode === "visual" ||
    ["lazarillo", "ciego", "no vidente", "discapacidad visual", "baja vision", "baja visión", "describir imagen", "qué ves", "que ves", "guíame", "guiame", "qué hay enfrente", "que hay enfrente", "obstaculo", "obstáculo", "escalon", "escalón", "leer boleta", "leer carnet", "leer documento"].some(w => lower.includes(w));

  if (isLazarillo) {
    return `\n${MUNICIPAL_LAZARILLO_FRAMEWORK}\n`;
  }

  // 2. MODO INCLUSIÓN COGNITIVA Y APOYO EN TRÁMITES (TEA / Neurodivergencia / DUA)
  const isInclusion = explicitMode === "inclusion" || 
    ["autismo", "asperger", "tea", "espectro autista", "neurodivergente", "pictograma", "pictogramas", "arasaac", "apoyo visual", "literal", "sin metaforas", "sin metáforas", "paso a paso", "concreto", "sencillo", "cud", "discapacidad"].some(w => lower.includes(w));

  if (isInclusion) {
    return `\n${MUNICIPAL_TEA_ACCESSIBILITY_GUIDE}\n`;
  }

  return "";
}
