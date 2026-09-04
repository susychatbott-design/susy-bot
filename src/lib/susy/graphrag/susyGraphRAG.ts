/**
 * ==============================================================================
 * 🏛️ SUSY BOT - MOTOR DE GRAPHRAG RELACIONAL SOBRE PGVECTOR (GOVTECH)
 * Ubicación: src/lib/susy/graphrag/susyGraphRAG.ts
 * 
 * Expande consultas del contribuyente cruzando ordenanzas vinculadas mediante
 * CTE recursivas en PostgreSQL, erradicando alucinaciones en el Digesto Municipal.
 * ==============================================================================
 */

import { SupabaseClient } from "@supabase/supabase-js";

export interface GraphRAGNodeResult {
  profundidad: number;
  nodo_origen: string;
  tipo_relacion: string;
  nodo_destino: string;
  normativa: string;
  similitud_coseno: number;
  ruta_grafo: string;
}

export interface GraphRAGContextOptions {
  threshold?: number;
  maxSeeds?: number;
  maxDepth?: number;
}

/**
 * Consulta el Grafo del Digesto Municipal en Supabase mediante CTE recursivo
 */
export async function queryMunicipalGraphRAG(
  supabase: SupabaseClient | null,
  queryEmbedding: number[] | null,
  rawQueryText: string,
  options: GraphRAGContextOptions = {}
): Promise<{ contextText: string; nodes: GraphRAGNodeResult[] }> {
  if (!supabase) {
    return { contextText: "", nodes: [] };
  }

  const threshold = options.threshold ?? 0.5;
  const maxSeeds = options.maxSeeds ?? 3;
  const maxDepth = options.maxDepth ?? 2;

  // 1. Invocación RPC GraphRAG si hay embedding vectorial
  if (queryEmbedding && queryEmbedding.length > 0) {
    try {
      const { data, error } = await supabase.rpc("buscar_graphrag_digesto_recursivo", {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        max_seed_nodes: maxSeeds,
        max_depth: maxDepth
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        const nodes: GraphRAGNodeResult[] = data;
        const formattedContext = formatGraphResultsToContext(nodes);
        return { contextText: formattedContext, nodes };
      }
    } catch (rpcErr) {
      console.warn("[GraphRAG RPC Fallback]:", rpcErr);
    }
  }

  // 2. Fallback Relacional sin Vectores (Búsqueda por coincidencia de términos en grafo)
  try {
    const cleanTerms = rawQueryText
      .replace(/[¿?¡!]/g, "")
      .trim()
      .split(/\s+/)
      .filter(t => t.length > 3);

    if (cleanTerms.length > 0) {
      const filterClause = cleanTerms.map(t => `entidad_origen.ilike.%${t}%,entidad_destino.ilike.%${t}%,contenido_normativo.ilike.%${t}%`).join(",");

      const { data: textRows, error: textErr } = await supabase
        .from("susy_grafo_digesto")
        .select("entidad_origen, relacion, entidad_destino, contenido_normativo")
        .or(filterClause)
        .eq("is_active", true)
        .limit(5);

      if (!textErr && textRows && textRows.length > 0) {
        const simulatedNodes: GraphRAGNodeResult[] = textRows.map((r, i) => ({
          profundidad: 1,
          nodo_origen: r.entidad_origen,
          tipo_relacion: r.relacion,
          nodo_destino: r.entidad_destino,
          normativa: r.contenido_normativo,
          similitud_coseno: 1.0,
          ruta_grafo: `${r.entidad_origen} --[${r.relacion}]--> ${r.entidad_destino}`
        }));

        return {
          contextText: formatGraphResultsToContext(simulatedNodes),
          nodes: simulatedNodes
        };
      }
    }
  } catch (textErr) {
    console.warn("[GraphRAG Text Fallback]:", textErr);
  }

  return { contextText: "", nodes: [] };
}

/**
 * Formatea los nodos del grafo en un bloque estructurado para el prompt de la IA
 */
function formatGraphResultsToContext(nodes: GraphRAGNodeResult[]): string {
  if (!nodes || nodes.length === 0) return "";

  const lines = nodes.map((n, idx) => {
    return `[Norma Vinculada #${idx + 1} | Salto: Nivel ${n.profundidad}]:
• Conexión: ${n.ruta_grafo}
• Marco Legal: "${n.normativa}"`;
  });

  return `\n\n========================================================================
📜 DIGESTO MUNICIPAL EXPANDIDO POR GRAFO DE CONOCIMIENTO (GRAPHRAG):
${lines.join("\n\n")}

DIRECTIVA VINCULANTE:
Fundamenta tu respuesta obligatoriamente en estas leyes, tasas y normativas correlacionadas.
Si una actividad exige tasa o carnet según el grafo, adviértelo con claridad al contribuyente.
========================================================================\n`;
}
