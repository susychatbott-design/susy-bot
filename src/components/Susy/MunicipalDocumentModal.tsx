"use client";

import React from "react";
import { 
  X, 
  Printer, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle,
  QrCode
} from "lucide-react";
import { MunicipalTurno, PermisoProvisorio } from "@/lib/susy/municipal/municipalActions";

interface MunicipalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData: {
    type: "turno" | "permiso";
    turno?: MunicipalTurno;
    permiso?: PermisoProvisorio;
  } | null;
}

export default function MunicipalDocumentModal({
  isOpen,
  onClose,
  documentData
}: MunicipalDocumentModalProps) {
  if (!isOpen || !documentData) return null;

  const isTurno = documentData.type === "turno";
  const turno = documentData.turno;
  const permiso = documentData.permiso;

  const docId = isTurno ? turno?.id : permiso?.id;
  const docTitle = isTurno ? "Comprobante Oficial de Turno Ciudadano" : permiso?.titulo;
  const citizenName = isTurno ? turno?.citizenName : permiso?.titularNombre;
  const citizenDni = isTurno ? turno?.citizenDni : permiso?.titularDni;
  const qrData = isTurno 
    ? `https://susy-bot.vercel.app/verificar?tipo=turno&id=${docId}`
    : `https://susy-bot.vercel.app/verificar?token=${permiso?.qrVerificationToken}`;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: `${docTitle} - ${docId}`,
        text: `Documento emitido por Susy Bot Municipal de Ituzaingó para ${citizenName}. Código: ${docId}`,
        url: window.location.href
      }).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#0b111e] border border-sky-600/40 rounded-3xl max-w-xl w-full text-slate-100 shadow-2xl relative my-auto overflow-hidden">
        {/* Barra Superior con Acciones */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#070b14] print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Documento Oficial Municipal
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Imprimir o Guardar en PDF"
            >
              <Printer size={16} />
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Compartir"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Cuerpo del Documento Imprimible */}
        <div className="p-5 sm:p-7 space-y-5 print:p-0 print:bg-white print:text-black">
          {/* Membrete Institucional */}
          <div className="text-center pb-4 border-b border-slate-800/80 space-y-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-xl">🏛️</span>
              <span className="font-extrabold text-base tracking-tight text-white uppercase">
                Municipalidad de Ituzaingó
              </span>
            </div>
            <p className="text-[11px] text-sky-400 font-semibold tracking-wide uppercase">
              Provincia de Corrientes • República Argentina
            </p>
            <h2 className="text-sm sm:text-base font-bold text-slate-200 mt-2">
              {docTitle}
            </h2>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-950/80 border border-sky-500/50 text-sky-300 mt-1">
              {docId}
            </div>
          </div>

          {/* Datos del Titular y Trámite */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Titular:</span>
              <span className="font-bold text-white text-xs sm:text-sm">{citizenName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">DNI / CUIT:</span>
              <span className="font-mono font-semibold text-slate-200">{citizenDni}</span>
            </div>

            {isTurno && turno && (
              <>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Dependencia:</span>
                  <span className="font-semibold text-sky-300">{turno.departmentName}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Día y Horario:</span>
                  <span className="font-bold text-emerald-400">{turno.dateStr} a las {turno.timeSlot}</span>
                </div>
              </>
            )}

            {!isTurno && permiso && (
              <>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Domicilio / Lugar Autorizado:</span>
                  <span className="font-semibold text-slate-200">{permiso.titularDomicilio}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Emisión:</span>
                  <span className="font-mono text-slate-300 text-[11px]">{permiso.fechaEmision}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-400 uppercase font-bold block">Vencimiento ({permiso.validezHoras}hs):</span>
                  <span className="font-mono text-rose-300 font-bold text-[11px]">{permiso.fechaVencimiento}</span>
                </div>
              </>
            )}
          </div>

          {/* Requisitos (Turnos) o Condiciones (Permisos) */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              {isTurno ? <CheckCircle2 size={13} className="text-emerald-400" /> : <AlertTriangle size={13} className="text-amber-400" />}
              {isTurno ? "Documentación obligatoria a presentar:" : "Condiciones obligatorias de validez:"}
            </span>
            <ul className="space-y-1 text-[11px] text-slate-400 list-disc pl-4">
              {isTurno && turno?.requirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
              {!isTurno && permiso?.condiciones.map((cond, i) => (
                <li key={i}>{cond}</li>
              ))}
            </ul>
          </div>

          {/* Código QR de Validación Municipal */}
          <div className="flex items-center justify-between gap-4 p-3.5 bg-white rounded-2xl text-slate-900 border border-slate-300">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-600 block">
                Firma Digital & QR de Verificación
              </span>
              <p className="text-[11px] font-semibold text-slate-800 leading-tight">
                Válido ante Inspectores de Tránsito, Obras Públicas y Policía de Corrientes.
              </p>
              <p className="text-[9px] font-mono text-slate-500">
                Hash: {docId} • Susy Bot Municipal
              </p>
            </div>

            <div className="w-20 h-20 bg-slate-100 p-1 rounded-xl shrink-0 border border-slate-300">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=090d16`}
                alt="Código QR de Verificación Municipal"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Botón de Cierre en Móvil */}
          <div className="pt-2 print:hidden">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              Entendido / Cerrar Comprobante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
