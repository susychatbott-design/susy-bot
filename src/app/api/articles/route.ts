/**
 * ========================================================================
 * 📰 SUSYBOT ARTICLES API — Noticias y Gacetillas Municipales
 * Ubicación: /src/app/api/articles/route.ts
 *
 * GET ?limit=N → Devuelve las últimas N noticias municipales.
 * Intenta leer desde la tabla `susy_noticias` en Supabase.
 * Si no existe o falla, retorna noticias de alta calidad embebidas.
 * NUNCA lanza error — siempre responde con { articles: [...] }
 * ========================================================================
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 60;

/** Noticias embebidas de alta calidad para el modo offline/fallback */
const STATIC_MUNICIPAL_NEWS = [
  {
    id: "mn_001",
    title: "Centro Cultural Ituzaingó: Agenda Artística Confirmada",
    subtitle: "Obra de teatro, chamamé y feria de artesanos este fin de semana",
    content:
      "El Centro Cultural de Ituzaingó (Corrientes y Belgrano) presenta 'El Viento Trae Recuerdos' el sábado y domingo a las 20:30 hs. Entrada libre y gratuita. Además, chamamé al atardecer en la Costanera y feria de artesanos en Plaza San Martín.",
    created_at: new Date().toISOString(),
    category: "cultura",
  },
  {
    id: "mn_002",
    title: "Renovación de Licencias de Conducir en Rentas Municipal",
    subtitle: "Horario ampliado de lunes a viernes de 7:00 a 13:00 hs",
    content:
      "La Municipalidad de Ituzaingó informa que la renovación y primera licencia de conducir se tramita en la Dirección de Rentas, Palacio Municipal. Requisitos: DNI original, libre deuda municipal y arancel vigente. Turnos presenciales.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    category: "tramites",
  },
  {
    id: "mn_003",
    title: "Operativo de Poda y Luminarias Barriales",
    subtitle: "Cuadrillas municipales recorren los barrios Norte y Sur",
    content:
      "El Municipio informa que las cuadrillas de Obras Públicas realizan tareas de poda y reposición de luminarias en los barrios Norte y Sur. Para reportar luminarias apagadas o árboles peligrosos, llamar al número municipal o usar el asistente Susy.",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    category: "servicios",
  },
  {
    id: "mn_004",
    title: "Turismo en Ituzaingó: Temporada de Pesca del Surubí",
    subtitle: "El río Paraná convoca a pescadores de todo el país",
    content:
      "Ituzaingó, a orillas del Paraná y embalse de Yacyretá, es epicentro de la pesca deportiva del surubí. La temporada está en su pico máximo. El municipio ofrece información de guías habilitados y campings disponibles.",
    created_at: new Date(Date.now() - 259200000).toISOString(),
    category: "turismo",
  },
  {
    id: "mn_005",
    title: "Programa de Inclusión Digital: Talleres Gratuitos de IA",
    subtitle: "Susy, la inteligencia cívica, llegó a los barrios",
    content:
      "El Municipio lanzó talleres de capacitación digital gratuitos con Susy, el asistente de IA municipal. Los vecinos aprenden a realizar trámites en línea, consultar guardias médicas y denunciar incidentes de forma ágil desde el celular.",
    created_at: new Date(Date.now() - 345600000).toISOString(),
    category: "innovacion",
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "5", 10), 20);

    // Intentar leer desde Supabase (tabla susy_noticias si existe)
    const supabase = createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("susy_noticias")
        .select("id, title, subtitle, content, created_at, category")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return NextResponse.json(
          { articles: data },
          {
            headers: {
              "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
            },
          }
        );
      }
    }

    // Fallback: noticias embebidas estáticas de alta calidad
    return NextResponse.json(
      { articles: STATIC_MUNICIPAL_NEWS.slice(0, limit) },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err: any) {
    console.error("[Articles API] Error:", err);
    return NextResponse.json({ articles: [] }, { status: 200 });
  }
}
