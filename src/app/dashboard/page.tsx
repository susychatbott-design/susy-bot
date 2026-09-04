"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  BarChart3, 
  Calendar, 
  Clock, 
  FileText, 
  ShieldCheck, 
  Newspaper, 
  MapPin,
  Store, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Sparkles, 
  Download, 
  Printer, 
  RefreshCw,
  Eye,
  Sliders
} from "lucide-react";
import { 
  municipalStore, 
  MunicipalTurno, 
  PermisoProvisorio, 
  GacetillaPrensa,
  TipoPermisoProvisorio
} from "@/lib/susy/municipal/municipalActions";
import { MUNICIPAL_DEPARTMENTS } from "@/lib/susy/municipal/departmentsData";
import MunicipalDocumentModal from "@/components/Susy/MunicipalDocumentModal";
import MunicipalLocationCard from "@/components/Susy/MunicipalLocationCard";
import MunicipalCommerceGuide from "@/components/Susy/MunicipalCommerceGuide";
import { MUNICIPAL_COMMERCE_LIST } from "@/lib/susy/municipal/departmentsData";

export default function MunicipalDashboardPage() {
  const [activeTab, setActiveTab] = useState<"metricas" | "turnos" | "permisos" | "prensa" | "comercio" | "mapa">("metricas");
  
  // Estados de datos
  const [turnos, setTurnos] = useState<MunicipalTurno[]>([]);
  const [permisos, setPermisos] = useState<PermisoProvisorio[]>([]);
  const [gacetillas, setGacetillas] = useState<GacetillaPrensa[]>([]);
  
  // Modal de documento imprimible
  const [selectedDoc, setSelectedDoc] = useState<{
    type: "turno" | "permiso";
    turno?: MunicipalTurno;
    permiso?: PermisoProvisorio;
  } | null>(null);

  // Formulario nuevo permiso provisorio
  const [showNewPermisoModal, setShowNewPermisoModal] = useState(false);
  const [nuevoPermisoData, setNuevoPermisoData] = useState({
    tipo: "poda_ramas" as TipoPermisoProvisorio,
    titularNombre: "",
    titularDni: "",
    titularDomicilio: "",
    titularTelefono: "",
    motivoDetalle: "",
    validezHoras: 72
  });

  // Formulario nueva gacetilla
  const [showNewGacetillaModal, setShowNewGacetillaModal] = useState(false);
  const [nuevaGacetillaData, setNuevaGacetillaData] = useState({
    titulo: "",
    bajada: "",
    categoria: "Institucional" as const,
    cuerpo: "",
    voceroCita: "",
    contactoPrensa: "prensa@ituzaingo.gob.ar • Tel: (03786) 420780",
    publicado: true
  });

  // Carga inicial
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setTurnos(municipalStore.getTurnos());
    setPermisos(municipalStore.getPermisos());
    setGacetillas(municipalStore.getGacetillas());
  };

  const handleCrearPermiso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPermisoData.titularNombre || !nuevoPermisoData.titularDni) return;

    const creado = municipalStore.addPermiso(nuevoPermisoData);
    refreshData();
    setShowNewPermisoModal(false);
    setSelectedDoc({ type: "permiso", permiso: creado });
  };

  const handleCrearGacetilla = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaGacetillaData.titulo || !nuevaGacetillaData.cuerpo) return;

    municipalStore.addGacetilla(nuevaGacetillaData);
    refreshData();
    setShowNewGacetillaModal(false);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar del Dashboard */}
      <header className="h-16 border-b border-slate-800 bg-[#0c121e]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Volver a Susy</span>
          </Link>

          <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xl">🏛️</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Centro de Gestión Municipal
                </h1>
                <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-bold uppercase">
                  Ituzaingó
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden xs:block">
                Panel Soberano de Trámites, Turnos, Permisos y Prensa
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            className="p-2 rounded-xl text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 border border-slate-800 transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw size={15} />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Sistema Soberano Activo</span>
            <span className="sm:hidden">En Línea</span>
          </div>
        </div>
      </header>

      {/* Navegación por Pestañas */}
      <div className="bg-[#090e18] border-b border-slate-800/80 px-4 sm:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar py-2 shrink-0">
        {[
          { id: "metricas", label: "Métricas & Tráfico", icon: BarChart3 },
          { id: "turnos", label: `Turnos (${turnos.length})`, icon: Clock },
          { id: "permisos", label: `Permisos con QR (${permisos.length})`, icon: ShieldCheck },
          { id: "prensa", label: `Gacetillas de Prensa (${gacetillas.length})`, icon: Newspaper },
          { id: "comercio", label: `Guía Comercial (${MUNICIPAL_COMMERCE_LIST.length})`, icon: Store },
          { id: "mapa", label: "Mapa de Oficinas", icon: MapPin }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-sky-600 text-white shadow-md shadow-sky-500/25"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* PESTAÑA 1: MÉTRICAS */}
        {activeTab === "metricas" && (
          <div className="space-y-6">
            {/* Tarjetas KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-400 font-semibold block">Secretarías Georreferenciadas</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block">12</span>
                <span className="text-[10px] text-emerald-400 font-medium mt-1 block">100% Coordenadas Ituzaingó</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-400 font-semibold block">Turnos Ciudadanos Activos</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1 block">{turnos.length}</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Tránsito, Rentas y Acción Social</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-400 font-semibold block">Permisos Provisorios con QR</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1 block">{permisos.length}</span>
                <span className="text-[10px] text-emerald-400 mt-1 block">Validados ante inspectores</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-400 font-semibold block">Gacetillas de Prensa Emitidas</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-sky-400 mt-1 block">{gacetillas.length}</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Difusión municipal oficial</span>
              </div>
            </div>

            {/* Accesos Rápidos para Funcionarios */}
            <div className="bg-gradient-to-br from-sky-950/40 via-indigo-950/30 to-slate-900 border border-sky-800/40 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="max-w-2xl space-y-2 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  <Sparkles size={13} />
                  <span>Innovación Municipal 2026</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Descongestión Administrativa y Gobierno Digital
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Susy Bot atiende las consultas recurrentes de las 12 secretarías, orienta a los turistas hacia el Portal Cambyretá y emite turnos y permisos de poda/carga con código QR para reducir hasta un 70% las filas presenciales en el Palacio Municipal.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap pt-2">
                <button
                  onClick={() => setShowNewPermisoModal(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Emitir Permiso Provisorio</span>
                </button>

                <button
                  onClick={() => setShowNewGacetillaModal(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-md shadow-sky-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Newspaper size={15} />
                  <span>Redactar Gacetilla Oficial</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: TURNOS */}
        {activeTab === "turnos" && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Registro de Turnos Ciudadanos</h3>
                <p className="text-xs text-slate-400">Turnos generados a través de Susy Bot para dependencias municipales</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {turnos.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-700/50">
                        {t.id}
                      </span>
                      <span className="text-xs font-bold text-white">{t.procedureType}</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      <strong>{t.citizenName}</strong> • DNI {t.citizenDni} • Tel: {t.citizenPhone}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Dependencia: <span className="text-slate-200 font-medium">{t.departmentName}</span> • Fecha: <strong className="text-emerald-400">{t.dateStr} a las {t.timeSlot}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedDoc({ type: "turno", turno: t })}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-950 border border-sky-600/50 text-sky-300 hover:bg-sky-900 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Eye size={13} />
                    <span>Ver Comprobante</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: PERMISOS PROVISORIOS */}
        {activeTab === "permisos" && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Permisos Provisorios Emitidos</h3>
                <p className="text-xs text-slate-400">Documentos provisorios de poda, mudanza y libre deuda con código QR de verificación</p>
              </div>

              <button
                onClick={() => setShowNewPermisoModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Nuevo Permiso</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {permisos.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50">
                        {p.id}
                      </span>
                      <span className="text-xs font-bold text-white">{p.titulo}</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Titular: <strong>{p.titularNombre}</strong> (DNI {p.titularDni}) • Domicilio: {p.titularDomicilio}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Motivo: {p.motivoDetalle} • Válido hasta: <strong className="text-rose-400">{p.fechaVencimiento}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedDoc({ type: "permiso", permiso: p })}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-950 border border-emerald-600/50 text-emerald-300 hover:bg-emerald-900 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <ShieldCheck size={14} />
                    <span>Ver Documento QR</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 4: PRENSA Y GACETILLAS */}
        {activeTab === "prensa" && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Centro de Prensa y Gacetillas Oficiales</h3>
                <p className="text-xs text-slate-400">Comunicados y noticias publicadas por la Dirección de Prensa</p>
              </div>

              <button
                onClick={() => setShowNewGacetillaModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Nueva Gacetilla</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {gacetillas.map((g) => (
                <div
                  key={g.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-950 text-sky-300 border border-sky-700/50">
                        {g.categoria}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{g.id}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{g.fecha}</span>
                  </div>

                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {g.titulo}
                    </h4>
                    <p className="text-xs text-slate-300 font-medium mt-1">
                      {g.bajada}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                    {g.cuerpo}
                  </p>

                  {g.voceroCita && (
                    <blockquote className="border-l-2 border-sky-500 pl-3 text-xs italic text-sky-200/90">
                      {g.voceroCita}
                    </blockquote>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>Contacto: {g.contactoPrensa}</span>
                    <button
                      onClick={() => {
                        if (typeof navigator !== "undefined") {
                          navigator.clipboard.writeText(`${g.titulo}\n\n${g.bajada}\n\n${g.cuerpo}`);
                          alert("Gacetilla copiada al portapapeles!");
                        }
                      }}
                      className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                    >
                      Copiar Texto Completo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA: GUÍA COMERCIAL MUNICIPAL */}
        {activeTab === "comercio" && (
          <div className="space-y-4">
            <MunicipalCommerceGuide />
          </div>
        )}

        {/* PESTAÑA 5: MAPA DE DEPENDENCIAS */}
        {activeTab === "mapa" && (
          <div className="space-y-4 text-left">
            <div>
              <h3 className="text-base font-bold text-white">Geolocalización Oficial de Oficinas y Eventos</h3>
              <p className="text-xs text-slate-400">Cartografía abierta mundial OpenStreetMap (100% libre a costo cero)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MUNICIPAL_DEPARTMENTS.map((dept) => (
                <MunicipalLocationCard
                  key={dept.id}
                  department={dept}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal Emisor de Permiso Provisorio */}
      {showNewPermisoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c121e] border border-emerald-500/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-left">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              Emitir Permiso Municipal Provisorio con QR
            </h3>

            <form onSubmit={handleCrearPermiso} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Tipo de Permiso Provisorio:</label>
                <select
                  value={nuevoPermisoData.tipo}
                  onChange={(e) => setNuevoPermisoData({ ...nuevoPermisoData, tipo: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                >
                  <option value="poda_ramas">Poda y Depósito Provisorio de Ramas (72 hs)</option>
                  <option value="carga_descarga">Carga, Descarga y Mudanza Urbana</option>
                  <option value="libre_deuda_tramite">Constancia Provisoria de Libre Deuda en Trámite</option>
                  <option value="uso_espacio_publico">Uso de Espacio Verde / Evento Comunitario</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nombre y Apellido:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Carlos Ramos"
                    value={nuevoPermisoData.titularNombre}
                    onChange={(e) => setNuevoPermisoData({ ...nuevoPermisoData, titularNombre: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">DNI / CUIT:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 29.410.882"
                    value={nuevoPermisoData.titularDni}
                    onChange={(e) => setNuevoPermisoData({ ...nuevoPermisoData, titularDni: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Domicilio / Ubicación:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Centenario y Belgrano"
                    value={nuevoPermisoData.titularDomicilio}
                    onChange={(e) => setNuevoPermisoData({ ...nuevoPermisoData, titularDomicilio: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Teléfono:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 3786-459011"
                    value={nuevoPermisoData.titularTelefono}
                    onChange={(e) => setNuevoPermisoData({ ...nuevoPermisoData, titularTelefono: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Motivo Detallado:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detalle de la poda o motivo de la solicitud..."
                  value={nuevoPermisoData.motivoDetalle}
                  onChange={(e) => setNuevoPermisoData({ ...nuevoPermisoData, motivoDetalle: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPermisoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer"
                >
                  Generar y Ver QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Redactor de Gacetilla */}
      {showNewGacetillaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c121e] border border-sky-500/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-left">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Newspaper size={18} className="text-sky-400" />
              Redactar y Publicar Gacetilla Oficial
            </h3>

            <form onSubmit={handleCrearGacetilla} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Título del Comunicado:</label>
                <input
                  type="text"
                  required
                  placeholder="Título oficial de la noticia..."
                  value={nuevaGacetillaData.titulo}
                  onChange={(e) => setNuevaGacetillaData({ ...nuevaGacetillaData, titulo: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Bajada / Copete:</label>
                <input
                  type="text"
                  required
                  placeholder="Resumen en una frase..."
                  value={nuevaGacetillaData.bajada}
                  onChange={(e) => setNuevaGacetillaData({ ...nuevaGacetillaData, bajada: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Categoría:</label>
                  <select
                    value={nuevaGacetillaData.categoria}
                    onChange={(e) => setNuevaGacetillaData({ ...nuevaGacetillaData, categoria: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200"
                  >
                    <option value="Institucional">Institucional</option>
                    <option value="Obras">Obras</option>
                    <option value="Turismo">Turismo</option>
                    <option value="Salud">Salud</option>
                    <option value="Cultura">Cultura</option>
                    <option value="Comunidad">Comunidad</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Cita de Autoridad (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Declaración del Intendente o Secretario..."
                    value={nuevaGacetillaData.voceroCita}
                    onChange={(e) => setNuevaGacetillaData({ ...nuevaGacetillaData, voceroCita: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Cuerpo Completo:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Texto periodístico de la gacetilla..."
                  value={nuevaGacetillaData.cuerpo}
                  onChange={(e) => setNuevaGacetillaData({ ...nuevaGacetillaData, cuerpo: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewGacetillaModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md cursor-pointer"
                >
                  Publicar Gacetilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Documento Imprimible con QR */}
      <MunicipalDocumentModal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        documentData={selectedDoc}
      />
    </div>
  );
}
