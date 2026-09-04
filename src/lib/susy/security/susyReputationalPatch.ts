import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export interface ModerationResult {
  isAttack: boolean;
  category: "limpio" | "insulto" | "difamacion_politica";
  neutralResponse?: string;
}

export async function applyReputationalShield(
  input: string,
  sessionId?: string
): Promise<ModerationResult> {
  if (!input || typeof input !== "string") {
    return { isAttack: false, category: "limpio" };
  }

  const text = input.toLowerCase().trim();
  const insultos = ["maldito", "corrupto", "ladrones", "inútiles", "forros", "hdp"];
  const tintesPoliticos = ["intendente chorro", "fraude", "campaña política", "gasto público ilegal", "acomodados"];

  let category: ModerationResult["category"] = "limpio";
  let isAttack = false;

  if (insultos.some(word => text.includes(word))) {
    category = "insulto";
    isAttack = true;
  } else if (tintesPoliticos.some(word => text.includes(word))) {
    category = "difamacion_politica";
    isAttack = true;
  }

  if (isAttack) {
    try {
      const supabaseAdmin = getAdminClient();
      if (supabaseAdmin) {
        supabaseAdmin
          .from("susy_cuarentena_reputacional")
          .insert([{
            session_id: sessionId || null,
            input_ciudadano: input,
            categoria_ataque: category,
            nivel_riesgo: category === "difamacion_politica" ? "alto" : "medio"
          }])
          .then(({ error }) => {
            if (error) console.error("⚠️ Error en cuarentena Supabase:", error.message);
          });
      }
    } catch (err) {
      console.error("Falla amortiguada en resguardo de auditoría:", err);
    }

    return {
      isAttack: true,
      category,
      neutralResponse: "Como asistente oficial de la Municipalidad de Ituzaingó, estoy facultada únicamente para asistirle en trámites ciudadanos, gestión de reclamos urbanos y consultas del digesto municipal. La Municipalidad promueve el intercambio responsable y respetuoso. Si desea asentar una solicitud técnica de obras o servicios, por favor proporcione los datos correspondientes."
    };
  }

  return { isAttack: false, category: "limpio" };
}
