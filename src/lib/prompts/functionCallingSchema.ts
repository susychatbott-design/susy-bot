/**
 * ============================================================================
 * 🏛️ SUSY BOT — ESQUEMA DE HERRAMIENTAS Y FUNCTION CALLING MUNICIPAL
 * Ubicación: src/lib/prompts/functionCallingSchema.ts
 *
 * Define los contratos formales JSON Schema (OpenAI / Llama 3.3 / Qwen 2.5 Tools)
 * y los extractores deterministas de llamadas transaccionales para:
 * 1. registrarReclamoMunicipal (Obras Públicas, Luminarias, Bacheo, Limpieza)
 * 2. emitirTurno (Turnos inteligentes para Tránsito, Rentas, Acción Social)
 * 3. emitirPermisoProvisorio (Poda, Carga y Descarga, Libre Deuda con QR)
 * ============================================================================
 */

export type TipoReclamoMunicipal =
  | "infraestructura"
  | "luminaria"
  | "bromatologia"
  | "transito"
  | "limpieza"
  | "general";

export type DependenciaMunicipal =
  | "transito"
  | "rentas"
  | "accion_social"
  | "comercio"
  | "obras_publicas"
  | "mesa_entradas";

export interface ReclamoMunicipalArgs {
  tipo_reclamo: TipoReclamoMunicipal;
  ubicacion_exacta: string;
  descripcion_vecino: string;
}

export interface EmitirTurnoArgs {
  nombre_vecino: string;
  dni: string;
  dependencia: DependenciaMunicipal;
  tramite: string;
  horario_sugerido: string;
}

export interface EmitirPermisoProvisorioArgs {
  nombre_vecino: string;
  dni: string;
  domicilio: string;
  motivo: "poda" | "carga_descarga" | "mudanza" | "ocupacion_calzada";
}

export interface ToolParameterProperty {
  type: "string" | "number" | "boolean";
  description: string;
  enum?: string[];
}

export interface LLMToolDefinition {
  type: "function";
  function: {
    name: "registrarReclamoMunicipal" | "emitirTurno" | "emitirPermisoProvisorio";
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, ToolParameterProperty>;
      required: string[];
    };
  };
}

export const SUSY_MUNICIPAL_TOOLS_SCHEMA: LLMToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "registrarReclamoMunicipal",
      description:
        "Registra formalmente un reclamo urbano vinculante en la Municipalidad de Ituzaingó (baches, luminarias apagadas, recolección de ramas, bromatología o tránsito) y genera un ticket #ITU-XXX.",
      parameters: {
        type: "object",
        properties: {
          tipo_reclamo: {
            type: "string",
            description: "Categoría técnica del reclamo municipal.",
            enum: [
              "infraestructura",
              "luminaria",
              "bromatologia",
              "transito",
              "limpieza",
              "general",
            ],
          },
          ubicacion_exacta: {
            type: "string",
            description:
              "Calle, intersección, altura o barrio exacto en Ituzaingó (ej: 'Centenario y Mitre' o 'Barrio San Jorge').",
          },
          descripcion_vecino: {
            type: "string",
            description: "Descripción clara del desperfecto reportado por el ciudadano.",
          },
        },
        required: ["tipo_reclamo", "ubicacion_exacta", "descripcion_vecino"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "emitirTurno",
      description:
        "Asigna un turno oficial de atención presencial en dependencias de la Municipalidad de Ituzaingó (lunes a viernes de 07:00 a 13:00 hs).",
      parameters: {
        type: "object",
        properties: {
          nombre_vecino: {
            type: "string",
            description: "Nombre y apellido completo del vecino solicitante.",
          },
          dni: {
            type: "string",
            description: "Número de Documento Nacional de Identidad.",
          },
          dependencia: {
            type: "string",
            description: "Secretaría o Dirección municipal destinataria del turno.",
            enum: [
              "transito",
              "rentas",
              "accion_social",
              "comercio",
              "obras_publicas",
              "mesa_entradas",
            ],
          },
          tramite: {
            type: "string",
            description:
              "Trámite específico a realizar (ej: 'Renovación Licencia Conducir Cat B', 'Libre Deuda', 'Trámite CUD').",
          },
          horario_sugerido: {
            type: "string",
            description: "Fecha y franja horaria entre las 07:00 y 13:00 hs.",
          },
        },
        required: ["nombre_vecino", "dni", "dependencia", "tramite", "horario_sugerido"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "emitirPermisoProvisorio",
      description:
        "Emite una constancia o permiso municipal provisorio válido por 72 horas con código QR verificable (poda responsable, mudanza, carga y descarga).",
      parameters: {
        type: "object",
        properties: {
          nombre_vecino: {
            type: "string",
            description: "Nombre y apellido del frentista o responsable.",
          },
          dni: {
            type: "string",
            description: "DNI del solicitante.",
          },
          domicilio: {
            type: "string",
            description: "Dirección física exacta donde se ejecutará la tarea en Ituzaingó.",
          },
          motivo: {
            type: "string",
            description: "Tipo de permiso provisorio solicitado.",
            enum: ["poda", "carga_descarga", "mudanza", "ocupacion_calzada"],
          },
        },
        required: ["nombre_vecino", "dni", "domicilio", "motivo"],
      },
    },
  },
];

/**
 * Directiva textual inyectable para modelos que operan por Inline Function Calling Tag
 * o como refuerzo determinista junto al JSON Schema de Tools.
 */
export function buildFunctionCallingPromptDirective(): string {
  return `
================================================================================
⚡ CAPACIDAD TRANSACCIONAL MUNICIPAL (FUNCTION CALLING VINCULANTE - ITUZAINGÓ)
================================================================================
1. RECLAMOS URBANOS:
   Cuando el vecino reporte un bache, pozo, luminaria apagada, poste caído, basura o ramas, incluye en tu respuesta la etiqueta exacta:
   [CALL_FUNCTION: registrarReclamoMunicipal(tipo_reclamo="infraestructura", ubicacion_exacta="...", descripcion_vecino="...")]
   - Valores válidos para tipo_reclamo: "infraestructura" | "luminaria" | "bromatologia" | "transito" | "limpieza" | "general".

2. TURNOS MUNICIPALES:
   Cuando el vecino confirme Nombre, DNI y trámite para agendar turno (lunes a viernes de 07:00 a 13:00 hs), incluye la etiqueta:
   [CALL_FUNCTION: emitirTurno(nombre_vecino="...", dni="...", dependencia="transito", tramite="...", horario_sugerido="...")]
================================================================================
`.trim();
}
