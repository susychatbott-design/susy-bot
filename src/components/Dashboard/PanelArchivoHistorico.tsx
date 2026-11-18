"use client";

import React, { useState, useEffect } from "react";
import {
  Archive,
  Download,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Printer,
  FileDown,
  Clock,
  ShieldCheck,
  Building2,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import {
  municipalArchive,
  ArchivoHistoricoItem,
} from "@/lib/susy/municipal/municipalArchiveStore";
import {
  exportarPlanillaWord,
  imprimirPlanillaPDF,
} from "@/lib/susy/municipal/municipalReportPrinter";

export function PanelArchivoHistorico() {
  const [items, setItems] = useState<ArchivoHistoricoItem[]>(() =>
    municipalArchive.getArchivados()
  );
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");
  const [busqueda, setBusqueda] = useState<string>("");
  const [mensajeDescarga, setMensajeDescarga] = useState<string | null>(null);

  const handleExportarWord = (destinatario: "INTENDENTE" | "SECRETARIOS_AREA") => {
    exportarPlanillaWord(
      {
        tituloInforme:
          destinatario === "INTENDENTE"
            ? "INFORME OFICIAL DE ACTAS Y EXPEDIENTES AL PODER EJECUTIVO MUNICIPAL"
            : "PLANILLA DE EXPEDIENTES Y TRAMITES PARA SECRETARIOS Y JEFES DE ÁREA",
        destinatario,
        cargoDestinatario: "Secretarías y Direcciones del Municipio",
        periodo: "Último período operativo municipal",
        resumenEjecutivo:
          "Planilla formal comprensiva de las actuaciones, quejas vecinales, turnos y permisos tramitados a través de Susy Bot e incorporados al archivo histórico municipal.",
        itemsArchivo: itemsFiltrados,
      },
      destinatario === "INTENDENTE" ? "Informe_Intendente" : "Planilla_Secretarios"
    );
    setMensajeDescarga("Planilla en formato Word (.doc) generada y descargada.");
    setTimeout(() => setMensajeDescarga(null), 3500);
  };

  const handleImprimirPDF = (destinatario: "INTENDENTE" | "SECRETARIOS_AREA") => {
    imprimirPlanillaPDF({
      tituloInforme:
        destinatario === "INTENDENTE"
          ? "INFORME EJECUTIVO DE EXPEDIENTES AL INTENDENTE MUNICIPAL"
          : "PLANILLA OFICIAL DE RELEVAMIENTO PARA JEFATURAS DE ÁREA",
      destinatario,
      cargoDestinatario: "Gabinete Municipal de Ituzaingó",
      periodo: "Ejercicio Operativo en Curso",
      resumenEjecutivo:
        "Documento emitido con membrete institucional y campo de firmas para elevación formal de actuaciones al Departamento Ejecutivo.",
      itemsArchivo: itemsFiltrados,
    });
  };

  useEffect(() => {
    const syncArchive = () => setItems(municipalArchive.getArchivados());
    syncArchive();
    if (typeof window !== "undefined") {
      window.addEventListener("susy_municipal_archive_updated", syncArchive);
      return () =>
        window.removeEventListener("susy_municipal_archive_updated", syncArchive);
    }
  }, []);

  const handleDescargarCSV = () => {
    const csvContent = municipalArchive.exportarCSV();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Archivo_Historico_Municipal_Ituzaingo_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMensajeDescarga("Libro de Actas y Archivo Histórico exportado en CSV con éxito.");
    setTimeout(() => setMensajeDescarga(null), 3500);
  };

  const handleDescargarJSON = () => {
    const jsonStr = JSON.stringify(items, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Backup_Auditoria_Municipal_Ituzaingo_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMensajeDescarga("Copia de Seguridad JSON para Respaldo o Soporte descargada.");
    setTimeout(() => setMensajeDescarga(null), 3500);
  };

  const itemsFiltrados = items.filter((item) => {
    const cumpleTipo = filtroTipo === "TODOS" || item.tipo === filtroTipo;
    const q = busqueda.toLowerCase();
    const cumpleBusqueda =
      !q ||
      item.id.toLowerCase().includes(q) ||
      item.originalId.toLowerCase().includes(q) ||
      item.tituloOAsunto.toLowerCase().includes(q) ||
      item.detalleCiudadano.toLowerCase().includes(q) ||
      item.areaResponsable.toLowerCase().includes(q);
    return cumpleTipo && cumpleBusqueda;
  });

  return (
    <div className="space-y-5 text-left">
      {/* HEADER DEL ARCHIVO */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <Archive size={22} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase">
              <span>Repositorio Oficial de Respaldo y Soporte</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
              Archivo Histórico y Libro de Actas Digital
            </h2>
            <p className="text-xs text-slate-400">
              Registros resguardados para auditoría ciudadana, respaldo legal y descargo ante quejas de contribuyentes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* BOTÓN IMPRIMIR / PDF PARA INTENDENTE */}
          <button
            type="button"
            onClick={() => handleImprimirPDF("INTENDENTE")}
            title="Imprimir o guardar en PDF con formato oficial para el Intendente"
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-sky-950 cursor-pointer"
          >
            <Printer size={14} />
            <span>Imprimir / PDF (Intendente)</span>
          </button>

          {/* BOTÓN WORD PARA JEFES DE ÁREAS */}
          <button
            type="button"
            onClick={() => handleExportarWord("SECRETARIOS_AREA")}
            title="Descargar planilla editable en Word para Jefes de Área"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-indigo-950 cursor-pointer"
          >
            <FileDown size={14} />
            <span>Descargar Word (.doc)</span>
          </button>

          <button
            type="button"
            onClick={handleDescargarCSV}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={handleDescargarJSON}
            className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-amber-950 cursor-pointer"
          >
            <Download size={14} />
            <span>JSON Backup</span>
          </button>
        </div>
      </div>

      {mensajeDescarga && (
        <div className="px-4 py-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={15} />
          <span>{mensajeDescarga}</span>
        </div>
      )}

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por DNI, N° de Ticket o Ciudadano..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["TODOS", "TURNO", "PERMISO_QR", "GACETILLA", "OPERACION_TREN"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filtroTipo === t
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {t.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* LISTADO DE ITEMS ARCHIVADOS */}
      <div className="space-y-3">
        {itemsFiltrados.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 text-slate-400 space-y-2">
            <Archive size={32} className="mx-auto text-slate-600" />
            <p className="text-sm font-semibold">El Archivo Histórico no registra elementos con este filtro.</p>
            <p className="text-xs text-slate-500">
              Cada vez que un operador depura un turno, permiso o reclamo de la consola activa, se preserva automáticamente aquí.
            </p>
          </div>
        ) : (
          itemsFiltrados.map((it) => (
            <div
              key={it.id}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col gap-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-amber-400">{it.originalId}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-sky-300">
                    {it.tipo}
                  </span>
                  <span className="text-slate-400 text-[11px]">• Archivó: {it.fechaArchivado}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                    Motivo: {it.motivoArchivado}
                  </span>
                  <span className="font-mono text-emerald-400 text-[10px]">{it.id}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-white text-sm">{it.tituloOAsunto}</h4>
                <p className="text-slate-300">{it.detalleCiudadano}</p>
                <div className="text-[11px] text-slate-400 flex flex-wrap gap-3 pt-1">
                  <span>
                    Área: <strong className="text-slate-200">{it.areaResponsable}</strong>
                  </span>
                  <span>
                    Fecha de Entrada: <strong className="text-slate-200">{it.fechaRegistroOriginal}</strong>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
