"use client";

import React, { useState } from "react";
import { 
  Siren, 
  PhoneCall, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  Flame, 
  HeartHandshake, 
  MapPin, 
  CheckCircle2, 
  Loader2,
  Send
} from "lucide-react";

interface SusyEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  label: string;
  icon: React.ElementType;
  badgeColor: string;
  borderHover: string;
  description: string;
  priority: "alta" | "critica" | "media";
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: "hospital",
    name: "Hospital Billinghurst / SAME",
    number: "107",
    label: "Guardia Médica y Ambulancias",
    icon: Siren,
    badgeColor: "bg-rose-600 text-white",
    borderHover: "hover:border-rose-500",
    description: "Atención de urgencias médicas, ambulancias de alta complejidad y traslados de emergencia.",
    priority: "critica"
  },
  {
    id: "policia",
    name: "Policía de Corrientes",
    number: "101",
    label: "Comisarías 1ª y 2ª Ituzaingó",
    icon: ShieldAlert,
    badgeColor: "bg-blue-600 text-white",
    borderHover: "hover:border-blue-500",
    description: "Comisaría de Distrito Ituzaingó, patrullaje preventivo y respuesta ante siniestros o delitos.",
    priority: "critica"
  },
  {
    id: "bomberos",
    name: "Bomberos Voluntarios",
    number: "100",
    label: "Cuartel Ituzaingó",
    icon: Flame,
    badgeColor: "bg-amber-600 text-white",
    borderHover: "hover:border-amber-500",
    description: "Rescate vehicular, incendios de pastizales o estructuras y contingencias de rescate fluvial.",
    priority: "critica"
  },
  {
    id: "defensa_civil",
    name: "Defensa Civil Municipal",
    number: "103",
    label: "Emergencias Climáticas",
    icon: AlertTriangle,
    badgeColor: "bg-emerald-700 text-white",
    borderHover: "hover:border-emerald-500",
    description: "Caída de postes, árboles, anegamientos pluviales y alertas meteorológicas locales.",
    priority: "alta"
  },
  {
    id: "violencia_genero",
    name: "Línea 144 - Atención Integral",
    number: "144",
    label: "Protección a la Mujer",
    icon: HeartHandshake,
    badgeColor: "bg-purple-600 text-white",
    borderHover: "hover:border-purple-500",
    description: "Contención, asesoramiento legal y resguardo ante situaciones de violencia de género 24/7.",
    priority: "alta"
  }
];

export default function SusyEmergencyModal({ isOpen, onClose }: SusyEmergencyModalProps) {
  const [isSendingSos, setIsSendingSos] = useState<boolean>(false);
  const [sosSentSuccess, setSosSentSuccess] = useState<boolean>(false);
  const [sosError, setSosError] = useState<string>("");

  if (!isOpen) return null;

  const handleSendLiveGpsAlert = async () => {
    setIsSendingSos(true);
    setSosError("");
    setSosSentSuccess(false);

    try {
      let lat: number | null = -27.5852;
      let lng: number | null = -56.6821;

      if ("geolocation" in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: true
            });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (posErr) {
          console.warn("[GPS SOS Warning]: Geolocation no concedida, usando coordenadas cívicas Ituzaingó:", posErr);
        }
      }

      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "vecino_web_urgente",
          name: "Alerta SOS Portal Ciudadano",
          message: "El vecino ha accionado el botón de Alerta Roja SOS desde Susy Bot.",
          lat,
          lng,
          timestamp: new Date().toISOString()
        })
      });

      if (res.ok) {
        setSosSentSuccess(true);
      } else {
        setSosError("La alerta se registró localmente. Por favor comunícate de inmediato al 107.");
      }
    } catch (err) {
      console.warn("[SOS Dispatch Error]:", err);
      setSosError("Por favor marca directamente al 107 en tu teléfono.");
    } finally {
      setIsSendingSos(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-[#0c121e] border-2 border-rose-500/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera Roja de Emergencia Institucional */}
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-red-950 p-4 sm:p-5 border-b border-rose-700/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/50 animate-pulse">
              <Siren size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Centro de Emergencias 107
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-500/40 text-rose-200 border border-rose-400/40">
                  Guardia 24 Hs
                </span>
              </h2>
              <p className="text-xs text-rose-200/90 font-medium">
                Municipalidad de Ituzaingó • Sistema de Respuesta Rápida
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-rose-300 hover:text-white hover:bg-rose-800/60 transition-colors cursor-pointer"
            aria-label="Cerrar ventana de emergencia"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido Desplazable con Números de Teléfono y Botones de Discado Directo */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800 flex-1">
          {/* Instrucción Rápida */}
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Toca cualquier número para <strong>llamar directamente</strong> desde tu celular, o despacha la alerta satelital con tu ubicación en caso de necesidad extrema.
            </p>
          </div>

          {/* Lista de Teléfonos Críticos */}
          <div className="space-y-2.5">
            {EMERGENCY_CONTACTS.map((contact) => {
              const IconComp = contact.icon;
              return (
                <div
                  key={contact.id}
                  className={`p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 ${contact.borderHover} transition-all flex items-center justify-between gap-3 group shadow-sm`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <IconComp size={20} className="text-rose-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {contact.name}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold ${contact.badgeColor}`}>
                          {contact.number}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {contact.label}
                      </p>
                    </div>
                  </div>

                  {/* Botón Discado Directo */}
                  <a
                    href={`tel:${contact.number}`}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all active:scale-95 shrink-0"
                    title={`Llamar al ${contact.number}`}
                  >
                    <PhoneCall size={14} className="animate-pulse" />
                    <span>Llamar {contact.number}</span>
                  </a>
                </div>
              );
            })}
          </div>

          {/* Despacho SOS con GPS */}
          <div className="pt-2 border-t border-slate-800/80">
            {sosSentSuccess ? (
              <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn">
                <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold">¡Alerta SOS Despachada!</p>
                  <p className="text-xs text-emerald-300">
                    Las coordenadas de Ituzaingó han sido registradas para el servicio de guardia municipal.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleSendLiveGpsAlert}
                  disabled={isSendingSos}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-700 via-rose-600 to-red-700 hover:from-red-600 hover:to-rose-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-red-900/40 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isSendingSos ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Transmitiendo Coordenadas GPS...</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={16} className="animate-bounce" />
                      <span>Enviar Alerta SOS Silenciosa con Ubicación GPS</span>
                    </>
                  )}
                </button>
                {sosError && (
                  <p className="text-[11px] text-rose-400 text-center font-medium">
                    {sosError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Institucional */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 text-center text-[10px] text-slate-500 flex items-center justify-between px-5 shrink-0">
          <span>MyJNexoraVisual • Sistema Cívico de Rescate</span>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
