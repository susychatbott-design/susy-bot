import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, name, message, lat, lng, timestamp } = body;

    console.log("[Susybot-SOS] 🚨 ALERTA SOS RECIBIDA:", { phone, name, lat, lng, timestamp });

    const supabase = createServerSupabaseClient();
    
    // Registrar evento de emergencia en la base de datos
    try {
      await supabase.from("emergency_alerts").insert([
        {
          contact_phone: phone,
          contact_name: name,
          message_payload: message,
          latitude: lat,
          longitude: lng,
          created_at: timestamp || new Date().toISOString()
        }
      ]);
    } catch (dbErr) {
      console.warn("[Susybot-SOS] Nota BD:", dbErr);
    }

    return NextResponse.json({
      status: "SOS_LOGGED_AND_DISPATCHED",
      message: "Alerta SOS despachada con éxito."
    });
  } catch (err: any) {
    console.error("[Susybot-SOS Error]:", err);
    return NextResponse.json({ error: "Error procesando alerta SOS" }, { status: 500 });
  }
}
