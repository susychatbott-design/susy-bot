/**
 * ========================================================================
 * 🔍 MOTOR DE BÚSQUEDA HÍBRIDA RAG (FASE 11 - SUPABASE FREE TIER)
 * Ubicación: /src/lib/nora/hybridRag.ts
 * 
 * Combina similitud semántica (pgvector) con búsqueda de texto completo BM25
 * (Postgres tsvector/tsquery en español) mediante Reciprocal Rank Fusion (RRF).
 * ========================================================================
 */

export interface HybridSearchResult {
  id: string | number;
  title: string;
  content: string;
  category?: string;
  source_url?: string;
  created_at?: string;
  score: number;
  match_type: "semantic" | "keyword" | "hybrid";
}

/**
 * Ejecuta búsqueda híbrida en Supabase con tolerancia a fallos
 */
export async function fetchHybridRAGDocuments(
  supabase: any,
  query: string,
  embeddingVector: number[] | null = null,
  limit: number = 6
): Promise<HybridSearchResult[]> {
  if (!supabase || !query || !query.trim()) return [];

  const cleanQuery = query.trim().replace(/[^\w\s\dáéíóúÁÉÍÓÚñÑ]/gi, " ");

  // 1. Intentar invocación RPC de Búsqueda Híbrida nativa en Postgres si existe la función
  if (embeddingVector && embeddingVector.length > 0) {
    try {
      const { data: rpcResults, error: rpcError } = await supabase.rpc("match_articles_hybrid", {
        query_text: cleanQuery,
        query_embedding: embeddingVector,
        match_count: limit,
        fulltext_weight: 0.35,
        semantic_weight: 0.65
      });

      if (!rpcError && rpcResults && rpcResults.length > 0) {
        return rpcResults.map((r: any) => ({
          id: r.id,
          title: r.title || "Documento",
          content: r.excerpt || r.content || "",
          category: r.category || "GENERAL",
          source_url: r.external_url || "https://nexativanews.com.ar",
          created_at: r.created_at,
          score: r.score || 1.0,
          match_type: "hybrid"
        }));
      }
    } catch (e) {
      console.warn("[Hybrid RAG RPC Fallback]:", e);
    }
  }

  // 2. Fallback Híbrido en Cliente: Búsqueda BM25 Fulltext + ILIKE en Postgres
  try {
    const searchTerms = cleanQuery.split(/\s+/).filter(w => w.length > 2);
    let dbQuery = supabase
      .from("articles")
      .select("id, title, excerpt, content, category, external_url, created_at");

    if (searchTerms.length > 0) {
      // Intentar textSearch en español o ilike
      const textQueryFilter = searchTerms.join(" & ");
      const { data: ftsData, error: ftsErr } = await supabase
        .from("articles")
        .select("id, title, excerpt, content, category, external_url, created_at")
        .textSearch("title", textQueryFilter, { config: "spanish", type: "websearch" })
        .limit(limit);

      if (!ftsErr && ftsData && ftsData.length > 0) {
        return ftsData.map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.excerpt || a.content || "",
          category: a.category,
          source_url: a.external_url,
          created_at: a.created_at,
          score: 0.9,
          match_type: "keyword"
        }));
      }
    }

    // Fallback: Artículos más recientes
    const { data: recentData } = await dbQuery
      .order("created_at", { ascending: false })
      .limit(limit);

    if (recentData && recentData.length > 0) {
      return recentData.map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.excerpt || a.content || "",
        category: a.category,
        source_url: a.external_url,
        created_at: a.created_at,
        score: 0.7,
        match_type: "keyword"
      }));
    }

  } catch (err) {
    console.warn("[Hybrid RAG Direct Query Warning]:", err);
  }

  return [];
}
