"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Bot,
  Calendar,
  CheckCircle2,
  MapPin,
  Megaphone,
  MessageSquarePlus,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  AGENDA_INTENDENTE_ITUZAINGO,
  AgenteMunicipalEspecialista,
  HumorSocialBarrio,
  ITUZAINGO_CORRIENTES_IDENTITY,
  obtenerTermometroBarrial,
  registrarPulsoSocialBarrial,
  TREN_AGENTICO_SUSY,
} from "@/lib/susy/municipal/ituzaingoCommandCenter";

export function PanelTrenAgenticoYBarrios() {
  const [barrios, setBarrios] = useState<HumorSocialBarrio[]>(() => obtenerTermometroBarrial());
  const [filtroZona, setFiltroZona] = useState<string>("TODAS");
  const [textoSimulacion, setTextoSimulacion] = useState<string>("");
  const [barrioSeleccionado, setBarrioSeleccionado] = useState<string>("Casco Céntrico");
  const [ultimoImpacto, setUltimoImpacto] = useState<string | null>(null);

  useEffect(() => {
    setBarrios(obtenerTermometroBarrial());
  }, []);

  const promedioAprobacion = Math.round(
    barrios.reduce((acc, b) => acc + b.indiceAprobacion, 0) / (barrios.length || 1)
  );
  const totalMenciones24h = barrios.reduce((acc, b) => acc + b.mencionesRedes24h, 0);
  const barriosAtencion = barrios.filter(
    (b) => b.clima === "ATENCION_REQUERIDA" || b.clima === "URGENTE"
  ).length;

  const barriosFiltrados =
    filtroZona === "TODAS" ? barrios : barrios.filter((b) => b.zona === filtroZona);

  const handleIngestarMencionRedes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoSimulacion.trim()) return;
    const res = registrarPulsoSocialBarrial(textoSimulacion, barrioSeleccionado);
    setBarrios(obtenerTermometroBarrial());
    setUltimoImpacto(
      `Pulso procesado por NEX-ITU-PRENSA-01 en ${res.barrioImpactado}: emoción ${res.perfilDetectado} → Nuevo índice ${res.nuevoIndice}%`
    );
    setTextoSimulacion("");
  };

  return (
    <div className="space-y-6 text-left">
      {/* CABECERA EJECUTIVA: SUSY DIRECTORA DE PRENSA + TREN AGÉNTICO */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-lg shrink-0 bg-slate-950">
            <img
              src="/icons/susy-avatar-portrait.png"
              alt="Susy — Directora de Prensa y Coordinadora del Tren Agéntico"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase">
              <Sparkles size={11} />
              <span>Tren Agéntico Nexora One • Ituzaingó, Corrientes</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white mt-1">
              Dirección de Prensa, Agenda del Intendente y Termómetro Social por Barrio
            </h2>
            <p className="text-xs text-slate-300">
              Intendente: <strong className="text-white">{ITUZAINGO_CORRIENTES_IDENTITY.intendenteActual}</strong> • Viceintendente:{" "}
              <strong className="text-white">{ITUZAINGO_CORRIENTES_IDENTITY.viceintendenteActual}</strong> • Sede:{" "}
              {ITUZAINGO_CORRIENTES_IDENTITY.direccionPalacio}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 w-full md:w-auto shrink-0">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">Ánimo Global</span>
            <span className="text-lg font-extrabold text-emerald-400">{promedioAprobacion}%</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">Menciones 24h</span>
            <span className="text-lg font-extrabold text-sky-400">{totalMenciones24h}</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">Focos Barriales</span>
            <span className="text-lg font-extrabold text-amber-400">{barriosAtencion}</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: TREN AGÉNTICO MUNICIPAL (7 AGENTES BAJO EL MANDO DE SUSY) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Bot size={17} className="text-emerald-400" />
              Tren Agéntico Municipal: 7 Puestos Clave del Ejido de Ituzaingó
            </h3>
            <p className="text-xs text-slate-400">
              Escuadrón de agentes autónomos coordinados por Susy cubriendo Prensa, Obras, Tránsito, Rentas, Turismo, Acción Social y Defensa Civil.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {TREN_AGENTICO_SUSY.map((ag: AgenteMunicipalEspecialista) => (
            <div
              key={ag.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-[10px] font-mono font-bold text-sky-300">
                    {ag.codigoAgente}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      ag.estadoOperativo === "GUARDIA_24HS"
                        ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                        : ag.estadoOperativo === "ACTIVO_EN_TERRENO"
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {ag.estadoOperativo.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-2xl">{ag.icono}</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {ag.nombrePuesto}
                    </h4>
                    <p className="text-[11px] text-emerald-400 font-medium">{ag.secretaria}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{ag.misionPrincipal}</p>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300">
                  <strong className="text-sky-300 block mb-0.5">Último parte a Susy:</strong>
                  {ag.ultimoReporteASusy}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  Hoy: <strong className="text-white">{ag.kpisTiempoReal.casosResueltosHoy} gestiones</strong>
                </span>
                <span>
                  Resp: <strong className="text-emerald-400">{ag.kpisTiempoReal.tiempoRespuestaPromedioMin} min</strong>
                </span>
                <span>
                  Eficacia: <strong className="text-sky-400">{ag.kpisTiempoReal.indiceEfectividadPct}%</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: AGENDA OFICIAL DEL INTENDENTE Y EJECUTIVO MUNICIPAL */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Calendar size={17} className="text-sky-400" />
              Agenda Oficial de Actividades del Intendente ({ITUZAINGO_CORRIENTES_IDENTITY.intendenteActual})
            </h3>
            <p className="text-xs text-slate-400">
              Sincronizada en tiempo real con el motor de voz y chat de Susy para informar a vecinos y medios de prensa.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold self-start">
            Dirección de Prensa Activa
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AGENDA_INTENDENTE_ITUZAINGO.map((act) => (
            <div
              key={act.id}
              className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between gap-2"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-sky-400">{act.fechaHora}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      act.estado === "En curso"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {act.estado}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white">{act.titulo}</h4>
                <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <MapPin size={12} />
                  {act.barrioOLugar} • {act.areaInvolucrada}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">{act.resumenPrensa}</p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <strong className="text-slate-200">Impacto vecinal:</strong> {act.beneficioVecinos}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 3: ESCÁNER EN VIVO DE HUMOR SOCIAL EN REDES Y TERMÓMETRO POR BARRIO */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Activity size={17} className="text-emerald-400" />
              Termómetro de Ánimo Social por Barrio (20 Barrios Oficiales de Ituzaingó, Corrientes)
            </h3>
            <p className="text-xs text-slate-400">
              Relevamiento de redes sociales, grupos barriales y calibración PNL de consultas ciudadanas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              "TODAS",
              "Centro / Costanera",
              "Complejos Habitacionales",
              "Norte / Yacyretá",
              "Sur / Ruta 12",
            ].map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setFiltroZona(z)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                  filtroZona === z
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        {/* Simulador / Ingestor en vivo de publicaciones de redes sociales para pruebas de campo */}
        <form
          onSubmit={handleIngestarMencionRedes}
          className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <select
            value={barrioSeleccionado}
            onChange={(e) => setBarrioSeleccionado(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 shrink-0"
          >
            {barrios.map((b) => (
              <option key={b.id} value={b.barrio}>
                {b.barrio}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={textoSimulacion}
            onChange={(e) => setTextoSimulacion(e.target.value)}
            placeholder="Ingresar publicación de redes o comentario vecinal para calibrar ánimo del barrio en vivo..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500"
          />

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <MessageSquarePlus size={14} />
            <span>Escanear Ánimo PNL</span>
          </button>
        </form>

        {ultimoImpacto && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{ultimoImpacto}</span>
          </div>
        )}

        {/* Grilla de los 20 Barrios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {barriosFiltrados.map((b) => (
            <div
              key={b.id}
              className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between gap-2.5"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-semibold">{b.zona}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.clima === "POSITIVO"
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : b.clima === "ESTABLE"
                        ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {b.clima.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-white">{b.barrio}</h4>
                  <span
                    className={`text-base font-extrabold ${
                      b.indiceAprobacion >= 78
                        ? "text-emerald-400"
                        : b.indiceAprobacion >= 70
                        ? "text-sky-400"
                        : "text-amber-400"
                    }`}
                  >
                    {b.indiceAprobacion}%
                  </span>
                </div>

                {/* Barra de ánimo */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      b.indiceAprobacion >= 78
                        ? "bg-emerald-500"
                        : b.indiceAprobacion >= 70
                        ? "bg-sky-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${b.indiceAprobacion}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-300 leading-snug">{b.tendenciaPrincipal}</p>

                <div className="flex flex-wrap gap-1 pt-1">
                  {b.principalesTemasRedes.map((t, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span>{b.mencionesRedes24h} menciones</span>
                <span className="font-mono text-sky-400">{b.agenteAsignadoCodigo}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
