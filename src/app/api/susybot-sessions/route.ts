/**
 * ========================================================================
 * 🗂️ SUSYBOT SESSIONS API — CRUD de Sesiones y Mensajes
 * Ubicación: /src/app/api/susybot-sessions/route.ts
 *
 * GET  ?user_id=xxx        → Lista de sesiones del usuario
 * GET  ?session_id=xxx     → Mensajes de una sesión específica
 * DELETE ?session_id=xxx   → Elimina sesión y sus mensajes
 * ========================================================================
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const sessionId = searchParams.get("session_id");

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ sessions: [], messages: [] }, { status: 200 });
    }

    // Modo 1: Listar sesiones de un usuario
    if (userId) {
      const { data, error } = await supabase
        .from("susybot_sessions")
        .select("id, title, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("[Sessions API] Error listando sesiones:", error.message);
        return NextResponse.json({ sessions: [] }, { status: 200 });
      }

      return NextResponse.json({ sessions: data || [] });
    }

    // Modo 2: Mensajes de una sesión específica
    if (sessionId) {
      const { data, error } = await supabase
        .from("susybot_messages")
        .select("id, role, content, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("[Sessions API] Error cargando mensajes:", error.message);
        return NextResponse.json({ messages: [] }, { status: 200 });
      }

      return NextResponse.json({ messages: data || [] });
    }

    return NextResponse.json({ sessions: [], messages: [] }, { status: 200 });
  } catch (err: any) {
    console.error("[Sessions API] Error inesperado:", err);
    return NextResponse.json({ sessions: [], messages: [] }, { status: 200 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "session_id requerido" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Eliminar mensajes primero (FK constraint)
    await supabase
      .from("susybot_messages")
      .delete()
      .eq("session_id", sessionId);

    // Luego eliminar la sesión
    const { error } = await supabase
      .from("susybot_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      console.error("[Sessions API] Error eliminando sesión:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[Sessions API] Error inesperado en DELETE:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
