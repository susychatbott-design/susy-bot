import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/sync
 * Genera un token efímero y un PIN de 6 dígitos con 5 minutos de TTL.
 */
export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await req.json().catch(() => ({}));
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
    const desktopSocketId = body.desktop_socket_id ? `${body.desktop_socket_id}_PIN_${pinCode}` : `PIN_${pinCode}`;

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("susybot_sync_tokens")
      .insert([
        {
          desktop_socket_id: desktopSocketId,
          status: "PENDING",
          expires_at: expiresAt
        }
      ])
      .select("token_id, expires_at")
      .single();

    if (error || !data) {
      console.warn("[Susybot Sync POST Fallback]:", error);
      const fallbackTokenId = `sync_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
      return NextResponse.json({
        token_id: fallbackTokenId,
        pin_code: pinCode,
        expires_at: expiresAt,
        sync_url: `https://nexativanews.com.ar/susybot?sync_token=${fallbackTokenId}`
      });
    }

    return NextResponse.json({
      token_id: data.token_id,
      pin_code: pinCode,
      expires_at: data.expires_at,
      sync_url: `https://nexativanews.com.ar/susybot?sync_token=${data.token_id}`
    });
  } catch (err: any) {
    console.error("[Susybot Sync POST Exception]:", err);
    return NextResponse.json({ error: "Error generando token de sincronización" }, { status: 500 });
  }
}

/**
 * GET /api/sync?token_id=... o ?pin_code=...
 * Consulta el estado del token efímero (Sondeo / Long-polling).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get("token_id");
    const pinCode = searchParams.get("pin_code");

    if (!tokenId && !pinCode) {
      return NextResponse.json({ error: "token_id o pin_code requerido" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    let query = supabase.from("susybot_sync_tokens").select("token_id, user_id, session_id, status, expires_at, desktop_socket_id");

    if (tokenId) {
      query = query.eq("token_id", tokenId);
    } else if (pinCode) {
      query = query.ilike("desktop_socket_id", `%PIN_${pinCode}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (error || !data) {
      return NextResponse.json({ status: "PENDING" });
    }

    const isExpired = new Date(data.expires_at).getTime() < Date.now();
    if (isExpired) {
      return NextResponse.json({ status: "EXPIRED" });
    }

    if (data.status === "AUTHORIZED") {
      await supabase
        .from("susybot_sync_tokens")
        .update({ status: "CONSUMED" })
        .eq("token_id", data.token_id);

      return NextResponse.json({
        status: "AUTHORIZED",
        token_id: data.token_id,
        user_id: data.user_id,
        session_id: data.session_id
      });
    }

    return NextResponse.json({ status: data.status, token_id: data.token_id });
  } catch (err: any) {
    console.error("[Susybot Sync GET Exception]:", err);
    return NextResponse.json({ error: "Error consultando estado" }, { status: 500 });
  }
}

/**
 * PUT /api/sync
 * Invocado para autorizar sincronización (por QR token_id o por PIN de 6 dígitos).
 */
export async function PUT(req: Request) {
  try {
    const { token_id, pin_code, user_id, session_id } = await req.json();

    if ((!token_id && !pin_code) || !user_id) {
      return NextResponse.json({ error: "Identificador (token o pin) y user_id son obligatorios" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    let query = supabase.from("susybot_sync_tokens").select("token_id, expires_at, status, desktop_socket_id");

    if (token_id) {
      query = query.eq("token_id", token_id);
    } else if (pin_code) {
      query = query.ilike("desktop_socket_id", `%PIN_${pin_code.trim()}%`);
    }

    const { data: tokenRecord, error: checkError } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (checkError || !tokenRecord) {
      return NextResponse.json({ error: "Código PIN o Token no encontrado o expirado" }, { status: 404 });
    }

    if (new Date(tokenRecord.expires_at).getTime() < Date.now() || tokenRecord.status !== "PENDING") {
      return NextResponse.json({ error: "El código QR o PIN ha expirado. Genera uno nuevo en tu PC." }, { status: 410 });
    }

    const { error: updateError } = await supabase
      .from("susybot_sync_tokens")
      .update({
        user_id,
        session_id: session_id || null,
        status: "AUTHORIZED"
      })
      .eq("token_id", tokenRecord.token_id);

    if (updateError) {
      return NextResponse.json({ error: "No se pudo autorizar la sincronización" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      token_id: tokenRecord.token_id,
      message: "¡Sincronización autorizada con éxito! Tu computadora ya está conectada."
    });
  } catch (err: any) {
    console.error("[Susybot Sync PUT Exception]:", err);
    return NextResponse.json({ error: "Error autorizando sincronización" }, { status: 500 });
  }
}
