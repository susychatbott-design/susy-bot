// src/lib/prompts/types.ts

export type SusyMode = "executive" | "lazarillo" | "tea" | "general" | "docente" | "no_videntes";
export type SusyProfileId = "executive" | "lazarillo" | "tea";

export interface SusyVisionAlertSummary {
  clockPosition: string;
  distance: string;
  alertLevel: "info" | "warning" | "danger";
  description: string;
}

export interface SusyContext {
  timeOfDay: string;                   // ej: "Miércoles, 21 de Octubre de 2026, 18:19 hs"
  location: string;                    // ej: "Ituzaingó, Corrientes"
  userName?: string;                   // ej: "Vecino" o "Javier"
  weatherSummary?: string;             // Clima actual de Ituzaingó (Open-Meteo)
  currentContextBlock?: string;        // Contexto inyectado por getCurrentContext() de susyGrounding.ts
  upcomingEventsBlock?: string;        // Eventos futuros (fecha >= NOW()) de getUpcomingEvents()
  latestNewsBlock?: string;            // Últimas 3 gacetillas de getLatestNews()
  tramiteRequirementsBlock?: string;   // Requisitos verificados (pgvector >= 0.82) de getTramiteRequirements()
  groundingBlock?: string;             // Bloque consolidado de susyGrounding.ts
  digestoGraphContext?: string;        // Nodos normativos expandidos desde susy_grafo_digesto (GraphRAG)
  patrimonyContext?: string;           // Contexto histórico y patrimonial de Ituzaingó
  continuousMemory?: string;           // Memoria continua del ciudadano
  visionAlerts?: SusyVisionAlertSummary[];
  isDark?: boolean;
  isOffline?: boolean;
}

export interface PromptProfile {
  id: SusyProfileId;
  systemDirective: string;
  constraints: string[];
  parameters: {
    temperature: number;
    maxTokens: number;
  };
}
