/**
 * ========================================================================
 * 📊 SUSYBOT TELEMETRY & SLA BENCHMARK LOGGER
 * Ubicación: /src/lib/nora/telemetry.ts
 * Registra métricas de rendimiento y SLAs en background sin bloquear la inferencia
 * ========================================================================
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface NoraPerformanceMetric {
  sessionId?: string | null;
  userId?: string;
  interactionMode: "voice" | "visual" | "text" | "live_vision";
  sttLatencyMs?: number;
  ttftLatencyMs?: number;
  ttsLatencyMs?: number;
  totalLatencyMs: number;
  modelProvider: string;
  modelName: string;
  accessibilityProfile?: "general" | "inclusion_tea" | "blindness_vision_loss" | "docente" | "catedra";
  taskType?: string;
  taskStepNumber?: number;
  taskTotalSteps?: number;
  taskCompleted?: boolean;
  visionConfidenceScore?: number;
  ocrDetected?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Registra asíncronamente una métrica de rendimiento en Supabase
 */
export function recordPerformanceMetric(metric: NoraPerformanceMetric): void {
  // Ejecución en segundo plano sin 'await' para latencia cero en la respuesta al usuario
  Promise.resolve().then(async () => {
    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("susybot_performance_metrics").insert([
        {
          session_id: metric.sessionId || null,
          user_id: metric.userId || "anonymous",
          interaction_mode: metric.interactionMode,
          stt_latency_ms: metric.sttLatencyMs || null,
          ttft_latency_ms: metric.ttftLatencyMs || null,
          tts_latency_ms: metric.ttsLatencyMs || null,
          total_latency_ms: metric.totalLatencyMs,
          model_provider: metric.modelProvider,
          model_name: metric.modelName,
          accessibility_profile: metric.accessibilityProfile || "general",
          task_type: metric.taskType || null,
          task_step_number: metric.taskStepNumber || null,
          task_total_steps: metric.taskTotalSteps || null,
          task_completed: metric.taskCompleted || false,
          vision_confidence_score: metric.visionConfidenceScore || null,
          ocr_detected: metric.ocrDetected || false,
          metadata: metric.metadata || {}
        }
      ]);
    } catch (err) {
      console.warn("[Telemetry] Error registrando métrica en segundo plano:", err);
    }
  });
}
