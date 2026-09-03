/**
 * ========================================================================
 * 🧠 MOTOR DE MEMORIA CONTINUA Y PERFIL EVOLUTIVO DEL USUARIO
 * Ubicación: /src/lib/nora/userMemory.ts
 * 
 * Permite que Nora recuerde hechos clave, preferencias, profesiones y proyectos
 * del usuario a través del tiempo y entre múltiples dispositivos.
 * ========================================================================
 */

import { SupabaseClient } from "@supabase/supabase-js";

export interface UserMemoryItem {
  id?: string;
  user_id: string;
  category: "perfil" | "proyecto" | "preferencia" | "aprendizaje";
  content: string;
  created_at?: string;
}

/**
 * Recupera los recuerdos y contexto continuo del usuario
 */
export async function fetchUserContinuousMemory(supabase: SupabaseClient, userId: string): Promise<string> {
  if (!userId || userId === "anonymous_user") return "";

  try {
    const { data: memories, error } = await supabase
      .from("susybot_user_memories")
      .select("category, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error || !memories || memories.length === 0) {
      return "";
    }

    let memoryBlock = "\n\n[MEMORIA CONTINUA Y RECUERDOS EVOLUTIVOS DEL USUARIO]:\n";
    memories.forEach((m, idx) => {
      memoryBlock += `- [${m.category.toUpperCase()}]: ${m.content}\n`;
    });
    memoryBlock += "Usa estos recuerdos para personalizar tu ayuda, mantener el hilo de proyectos pasados y brindar un trato cercano y profesional.\n";

    return memoryBlock;
  } catch (err) {
    console.warn("[User Memory Fetch Warning]:", err);
    return "";
  }
}

/**
 * Guarda un hecho o recuerdo relevante sobre el usuario en segundo plano
 */
export async function recordUserMemory(
  supabase: SupabaseClient,
  userId: string,
  category: "perfil" | "proyecto" | "preferencia" | "aprendizaje",
  content: string
): Promise<void> {
  if (!userId || userId === "anonymous_user" || !content || content.trim().length < 5) return;

  try {
    await supabase.from("susybot_user_memories").insert([
      {
        user_id: userId,
        category,
        content: content.trim()
      }
    ]);
  } catch (err) {
    console.warn("[User Memory Save Warning]:", err);
  }
}
