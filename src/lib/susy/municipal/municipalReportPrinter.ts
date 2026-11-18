/**
 * ==============================================================================
 * 📑 GENERADOR DE PLANILLAS Y REPORTES EJECUTIVOS OFICIALES
 * Ubicación: src/lib/susy/municipal/municipalReportPrinter.ts
 *
 * Emite planillas formales en Microsoft Word (.doc) y PDF / Impresión oficial
 * dirigidas al Intendente Municipal o a Secretarios / Jefes de Áreas.
 * ==============================================================================
 */

import { ArchivoHistoricoItem } from "./municipalArchiveStore";
import { RegistroOperacionAgentica, HumorSocialBarrio } from "./ituzaingoCommandCenter";
import { MunicipalTurno, PermisoProvisorio } from "./municipalActions";

export interface DatosInformeMunicipal {
  tituloInforme: string;
  destinatario: "INTENDENTE" | "SECRETARIOS_AREA" | "CONCEJO_DELIBERANTE";
  nombreDestinatario?: string;
  cargoDestinatario?: string;
  periodo: string;
  resumenEjecutivo?: string;
  itemsArchivo?: ArchivoHistoricoItem[];
  operacionesActivas?: RegistroOperacionAgentica[];
  barrios?: HumorSocialBarrio[];
  turnos?: MunicipalTurno[];
  permisos?: PermisoProvisorio[];
}

function generarHTMLPlanilla(datos: DatosInformeMunicipal): string {
  const fechaHoy = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const horaHoy = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  const destinatarioEncabezado =
    datos.destinatario === "INTENDENTE"
      ? "AL SEÑOR INTENDENTE MUNICIPAL<br/><strong>DR. JOSÉ EMILIO NICOLÁS</strong><br/>MUNICIPALIDAD DE ITUZAINGÓ, CORRIENTES"
      : datos.destinatario === "CONCEJO_DELIBERANTE"
      ? "AL HONORABLE CONCEJO DELIBERANTE<br/>DE LA CIUDAD DE ITUZAINGÓ, CORRIENTES"
      : `A LOS SEÑORES SECRETARIOS Y JEFES DE ÁREA MUNICIPAL<br/><strong>${datos.cargoDestinatario || "Gabinete Municipal"}</strong>`;

  let tablaContenido = "";

  if (datos.itemsArchivo && datos.itemsArchivo.length > 0) {
    tablaContenido = `
      <h3 style="color:#0f172a; margin-top:20px; font-size:13pt; border-bottom:1.5px solid #cbd5e1; padding-bottom:4px;">
        1. REGISTRO DE ACTAS Y EXPEDIENTES RESGUARDADOS (${datos.itemsArchivo.length} casos)
      </h3>
      <table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:9.5pt;">
        <thead>
          <tr style="background-color:#f1f5f9; color:#0f172a; text-align:left;">
            <th style="border:1px solid #cbd5e1; padding:7px;">Código</th>
            <th style="border:1px solid #cbd5e1; padding:7px;">Tipo</th>
            <th style="border:1px solid #cbd5e1; padding:7px;">Asunto / Trámite</th>
            <th style="border:1px solid #cbd5e1; padding:7px;">Ciudadano / Domicilio</th>
            <th style="border:1px solid #cbd5e1; padding:7px;">Área Interviniente</th>
            <th style="border:1px solid #cbd5e1; padding:7px;">Fecha Registro</th>
          </tr>
        </thead>
        <tbody>
          ${datos.itemsArchivo
            .map(
              (it, idx) => `
            <tr style="background-color:${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
              <td style="border:1px solid #cbd5e1; padding:6px; font-family:monospace; font-weight:bold; color:#0284c7;">${it.originalId}</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${it.tipo}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:600;">${it.tituloOAsunto}</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${it.detalleCiudadano}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; color:#334155;">${it.areaResponsable}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-size:8.5pt;">${it.fechaRegistroOriginal}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } else if (datos.operacionesActivas && datos.operacionesActivas.length > 0) {
    tablaContenido = `
      <h3 style="color:#0f172a; margin-top:20px; font-size:13pt; border-bottom:1.5px solid #cbd5e1; padding-bottom:4px;">
        1. PLANILLA DE GESTIONES ACTIVAS Y DESPACHO DE CUADRILLAS (${datos.operacionesActivas.length} operaciones)
      </h3>
      <table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:9.5pt;">
        <thead>
          <tr style="background-color:#f1f5f9; color:#0f172a; text-align:left;">
            <th style="border:1px solid #cbd5e1; padding:7px;">Ticket</th>
            <th style="border:1px solid #cbd5e1; padding:7px;">Canal</th>
            <th style="border:1px solid #cbd5e1; padding:7px;">Barrio</th>
            <th style="border:1px solid #cbd5e1; padding:7px;">Consulta / Problemática</th>
            <th style="border:1px solid #cbd5e1; padding:7px;">Resolución / Despacho</th>
            <th style="border:1px solid #cbd5e1; padding:7px;">Secretaría</th>
          </tr>
        </thead>
        <tbody>
          ${datos.operacionesActivas
            .map(
              (op, idx) => `
            <tr style="background-color:${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
              <td style="border:1px solid #cbd5e1; padding:6px; font-family:monospace; font-weight:bold; color:#059669;">${op.id}</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${op.canal}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:600;">${op.barrioDetectado}</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">"${op.consultaVecino}"</td>
              <td style="border:1px solid #cbd5e1; padding:6px; color:#047857;">${op.respuestaSusy}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-size:8.5pt;">${op.agenteAsignadoCodigo}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>${datos.tituloInforme}</title>
      <style>
        @page {
          size: A4;
          margin: 1.8cm 1.5cm 2cm 1.5cm;
        }
        body {
          font-family: 'Segoe UI', Calibri, Arial, sans-serif;
          color: #1e293b;
          line-height: 1.5;
          margin: 0;
          padding: 24px;
        }
        .header-table {
          width: 100%;
          border-bottom: 3px double #0284c7;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .escudo-texto {
          font-size: 13pt;
          font-weight: 800;
          color: #0c4a6e;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .escudo-sub {
          font-size: 9pt;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
        }
        .destinatario-box {
          background-color: #f8fafc;
          border-left: 4px solid #0284c7;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 10pt;
          color: #334155;
        }
        .resumen-box {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 12px;
          font-size: 10pt;
          color: #166534;
          margin-bottom: 20px;
        }
        .firma-area {
          margin-top: 50px;
          page-break-inside: avoid;
        }
        .firma-line {
          width: 220px;
          border-top: 1px solid #475569;
          margin: 0 auto;
          padding-top: 6px;
          text-align: center;
          font-size: 9pt;
          font-weight: 600;
          color: #334155;
        }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td style="vertical-align:middle; width:70%;">
            <div class="escudo-texto">MUNICIPALIDAD DE ITUZAINGÓ</div>
            <div class="escudo-sub">Provincia de Corrientes • República Argentina</div>
            <div style="font-size:8.5pt; color:#94a3b8; margin-top:2px;">
              Sede Central: Av. Centenario 1519 • Tel: (03786) 420090 • ituzaingo.gob.ar
            </div>
          </td>
          <td style="vertical-align:middle; text-align:right; width:30%;">
            <div style="font-size:8.5pt; color:#64748b;">Ituzaingó, ${fechaHoy}</div>
            <div style="font-size:8pt; color:#94a3b8;">Emisión: ${horaHoy} hs</div>
            <div style="display:inline-block; margin-top:4px; padding:2px 8px; background:#e0f2fe; color:#0369a1; border-radius:4px; font-size:8pt; font-weight:700;">
              PLANILLA OFICIAL
            </div>
          </td>
        </tr>
      </table>

      <div class="destinatario-box">
        ${destinatarioEncabezado}
      </div>

      <h2 style="font-size:15pt; color:#0c4a6e; margin-bottom:8px; font-weight:800;">
        ${datos.tituloInforme}
      </h2>
      <div style="font-size:9.5pt; color:#64748b; margin-bottom:16px;">
        Período de Relevamiento: <strong>${datos.periodo}</strong> • Sistema Soberano Susy Bot Municipal
      </div>

      ${
        datos.resumenEjecutivo
          ? `<div class="resumen-box"><strong>SÍNTESIS DE GESTIÓN:</strong> ${datos.resumenEjecutivo}</div>`
          : ""
      }

      ${tablaContenido}

      <div class="firma-area">
        <table style="width:100%; margin-top:40px;">
          <tr>
            <td style="width:50%; text-align:center;">
              <div class="firma-line">
                Operador / Auditor de Guardia<br/>
                <span style="font-size:7.5pt; color:#64748b;">Mesa de Entradas y Atención al Vecino</span>
              </div>
            </td>
            <td style="width:50%; text-align:center;">
              <div class="firma-line">
                Dirección / Secretaría Responsable<br/>
                <span style="font-size:7.5pt; color:#64748b;">Municipalidad de Ituzaingó (Ctes)</span>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-top:35px; border-top:1px solid #e2e8f0; padding-top:8px; font-size:8pt; color:#94a3b8; text-align:center;">
        Planilla oficial generada con firma digitalizada para entrega al Poder Ejecutivo Municipal de Ituzaingó, Corrientes.
      </div>
    </body>
    </html>
  `;
}

/**
 * Descarga la planilla en formato Microsoft Word (.doc) institucional editable
 */
export function exportarPlanillaWord(datos: DatosInformeMunicipal, filenameBase = "Planilla_Municipal") {
  const htmlDoc = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${datos.tituloInforme}</title>
    </head>
    <body>
      ${generarHTMLPlanilla(datos)}
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", htmlDoc], { type: "application/msword;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filenameBase}_Ituzaingo_${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Abre ventana de impresión profesional optimizada para "Guardar como PDF" o imprimir en papel A4
 */
export function imprimirPlanillaPDF(datos: DatosInformeMunicipal) {
  if (typeof window === "undefined") return;
  const printWindow = window.open("", "_blank", "width=900,height=800");
  if (!printWindow) {
    alert("Por favor permite las ventanas emergentes para abrir la planilla de impresión.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(generarHTMLPlanilla(datos));
  printWindow.document.close();

  // Esperar carga de estilos y disparar ventana de impresión/guardar PDF
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 350);
}
