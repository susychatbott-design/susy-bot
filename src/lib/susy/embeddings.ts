/**
 * ========================================================================
 * 🧠 SUSYBOT VECTOR EMBEDDINGS (100% CÓDIGO ABIERTO - OLLAMA / HUGGING FACE)
 * Ubicación: /src/lib/nora/embeddings.ts
 * ========================================================================
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";

function cleanKey(val?: string): string {
  if (!val) return "";
  return val.replace(/['"\r\n\t ]/g, "").trim();
}

/**
 * Genera vector embedding (768/384 dim) con modelos abiertos (Ollama nomic-embed / HF bge-small)
 */
export async function generateTextEmbedding(text: string): Promise<number[] | null> {
  const cleanText = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 4000);
  if (!cleanText) return null;

  // 1. Capa 1: Ollama Local (nomic-embed-text / all-minilm / bge-m3)
  const ollamaUrl = cleanKey(process.env.OLLAMA_BASE_URL) || cleanKey(process.env.NEXT_PUBLIC_OLLAMA_URL);
  if (ollamaUrl) {
    try {
      const res = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "nomic-embed-text",
          prompt: cleanText
        }),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.embedding)) {
          return data.embedding;
        }
      }
    } catch {}
  }

  // 2. Capa 2: Hugging Face Open Serverless Feature Extraction
  const hfToken = cleanKey(process.env.HF_ACCESS_TOKEN) || cleanKey(process.env.HUGGINGFACE_API_KEY) || cleanKey(process.env.HF_TOKEN);
  if (hfToken) {
    try {
      const res = await fetch("https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: cleanText }),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const embedding = await res.json();
        if (Array.isArray(embedding)) {
          return embedding;
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Fragmenta y guarda la memoria semántica de un artículo en Supabase (pgvector)
 */
export async function indexArticleSemanticMemory(articleId: string, title: string, content: string, category: string = "local"): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();
    const fullText = `${title}\n\n${content.replace(/<[^>]+>/g, ' ')}`;
    const embedding = await generateTextEmbedding(fullText);

    if (!embedding || !supabase) {
      return false;
    }

    const { error } = await supabase
      .from("article_embeddings")
      .insert({
        article_id: articleId,
        chunk_content: fullText.substring(0, 2000),
        metadata: { title, category, indexed_at: new Date().toISOString() },
        embedding: embedding
      });

    if (error) {
      console.error("[Memory Index Supabase Error]:", error);
      return false;
    }

    console.log(`[Memory Index Success] ✅ Artículo "${title}" indexado vectorialmente.`);
    return true;
  } catch (err: any) {
    console.error("[Memory Index Exception]:", err);
    return false;
  }
}

/**
 * Procesa asíncronamente en segundo plano un lote de artículos recién insertados
 */
export function autoIndexArticlesAsync(articles: Array<{ id: string; title: string; content?: string; category?: string }>): void {
  if (!articles || articles.length === 0) return;

  Promise.allSettled(
    articles.map(article => 
      indexArticleSemanticMemory(
        article.id, 
        article.title || "Sin título", 
        article.content || "", 
        article.category || "local"
      )
    )
  ).then(results => {
    const success = results.filter(r => r.status === "fulfilled" && r.value).length;
    console.log(`[Auto-Indexing Async] 🚀 Indexación finalizada: ${success}/${articles.length} procesados.`);
  }).catch(err => {
    console.warn("[Auto-Indexing Async Warning] Fallo en procesamiento en segundo plano:", err);
  });
}
