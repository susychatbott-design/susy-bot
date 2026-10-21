// src/lib/llm/types.ts
import { SusyMode } from "../prompts/types";
import { LLMToolDefinition } from "../prompts/functionCallingSchema";

export type SusyLLMProviderId =
  | "ollama-local"
  | "groq"
  | "pollinations"
  | "huggingface"
  | "webgpu-local";

export interface SpatialAlertPayload {
  clockPosition: string;
  distance: string;
  alertLevel: "info" | "warning" | "danger";
}

export interface UnifiedLLMResponse {
  text: string;
  spatialAlerts?: SpatialAlertPayload[];
  suggestedActions?: string[];
  providerUsed: SusyLLMProviderId;
  latencyMs: number;
}

export interface LLMHistoryItem {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMRequestParams {
  systemPrompt: string;
  userMessage: string;
  history?: LLMHistoryItem[];
  temperature: number;
  maxTokens: number;
  mode: SusyMode;
  imageBase64?: string | null;
  visualTelemetry?: string | null;
  sessionId?: string | null;
  tools?: LLMToolDefinition[];
}

export interface LLMAdapter {
  id: SusyLLMProviderId;
  isAvailable(): boolean;
  generate(params: LLMRequestParams): Promise<UnifiedLLMResponse>;
  generateStream?(params: LLMRequestParams): Promise<ReadableStream<Uint8Array> | null>;
}
