/**
 * ========================================================================
 * 🏛️ SUSYBOT UNIFIED SCHEMAS (JSON SCHEMA ESTÁNDAR 100% ABIERTO)
 * Ubicación: /src/lib/nora/schemas.ts
 * ========================================================================
 */

export interface VideoCampaignDirective {
  base_scene_prompt: string;
  surreal_intervention: string;
  camera_movement: string;
  target_model: 'wan-2.1' | 'hunyuan-video' | 'cogvideo';
}

export const NoraUnifiedResponseSchema = {
  type: "object",
  properties: {
    reply: { 
      type: "string", 
      description: "Respuesta conversacional empática, humana, usando el estilo impecable de un recepcionista de hotel 5 estrellas." 
    },
    freeze: { 
      type: "boolean", 
      description: "True si el usuario plantea un reclamo legal formal, una amenaza o una queja grave que requiera atención humana." 
    },
    report: {
      type: "object",
      nullable: true,
      description: "Campos extraídos automáticamente si el usuario demuestra intenciones comerciales claras (leads).",
      properties: {
        rubro_cliente: { type: "string" },
        whatsapp_comercial: { type: "string" },
        producto_interes: { type: "string" }
      }
    },
    video_campaign_directive: {
      type: "object",
      nullable: true,
      description: "Parámetros técnicos en inglés para generación de video Faux-CGI de surrealismo monumental.",
      properties: {
        base_scene_prompt: { type: "string", description: "Descripción naturalista de la escena base en inglés." },
        surreal_intervention: { type: "string", description: "Efecto surrealista gigante (25-30m) en inglés." },
        camera_movement: { type: "string", description: "Movimiento de cámara cinematográfico." },
        target_model: { type: "string", description: "Motor open-source óptimo: wan-2.1 | hunyuan-video." }
      }
    }
  },
  required: ["reply", "freeze"]
};
