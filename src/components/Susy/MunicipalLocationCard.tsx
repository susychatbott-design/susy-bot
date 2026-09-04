"use client";

import React, { useEffect, useState } from "react";
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  Compass,
  Calendar,
  Sparkles
} from "lucide-react";
import { 
  MunicipalDepartment, 
  MunicipalEvent, 
  calculateDistanceMeters, 
  formatDistance, 
  getOsmDirectionsUrl, 
  getUniversalGpsUrl 
} from "@/lib/susy/municipal/departmentsData";

interface MunicipalLocationCardProps {
  department?: MunicipalDepartment;
  event?: MunicipalEvent;
  onAskSusy?: (prompt: string) => void;
  onRequestTurno?: (deptId: string) => void;
}

export default function MunicipalLocationCard({
  department,
  event,
  onAskSusy,
  onRequestTurno
}: MunicipalLocationCardProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceText, setDistanceText] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<boolean>(false);
  const [showIframeMap, setShowIframeMap] = useState<boolean>(false);

  const coords = event ? event.coordinates : department?.coordinates || [-27.5843, -56.6836];
  const title = event ? event.title : department?.name || "Dependencia Municipal";
  const address = event ? event.address : department?.address || "Ituzaingó, Corrientes";
  const schedule = event ? `${event.dateStr} a las ${event.timeStr}` : department?.schedule || "Lunes a Viernes de 7:00 a 13:00 hs";
  const phone = department?.phone;
  const whatsapp = department?.whatsapp;

  // Obtener geolocalización del usuario a costo cero (HTML5 Geolocation API)
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const uLat = pos.coords.latitude;
          const uLng = pos.coords.longitude;
          setUserLocation({ lat: uLat, lng: uLng });
          const dist = calculateDistanceMeters(uLat, uLng, coords[0], coords[1]);
          setDistanceText(formatDistance(dist));
        },
        (err) => {
          console.warn("Geolocalización no disponible o denegada:", err.message);
          setGeoError(true);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [coords]);

  const osmUrl = getOsmDirectionsUrl(coords[0], coords[1], userLocation?.lat, userLocation?.lng);
  const universalGpsUrl = getUniversalGpsUrl(coords[0], coords[1]);

  // Bounding box para el iframe de OpenStreetMap (aprox 300m a la redonda)
  const delta = 0.004;
  const bbox = `${coords[1] - delta}%2C${coords[0] - delta}%2C${coords[1] + delta}%2C${coords[0] + delta}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords[0]}%2C${coords[1]}`;

  return (
    <div className="w-full bg-[#0d1424] border border-sky-900/60 hover:border-sky-500/50 rounded-2xl p-4 sm:p-5 shadow-xl transition-all space-y-4 text-left">
      {/* Encabezado con Icono y Categoría */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-700/50 flex items-center justify-center text-xl shrink-0 shadow-inner">
            {event ? "🎉" : department?.icon || "🏛️"}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
                {event ? `Evento: ${event.category}` : department?.shortName || "Oficina Municipal"}
              </span>
              {distanceText && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Compass size={11} className="animate-spin-slow" />
                  A {distanceText} de vos
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mt-1 leading-snug">
              {title}
            </h3>
          </div>
        </div>

        <button
          onClick={() => setShowIframeMap(!showIframeMap)}
          className="px-2.5 py-1 rounded-lg text-xs font-medium text-sky-300 bg-sky-950/80 border border-sky-700/60 hover:bg-sky-900 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
          title="Alternar vista de mapa satelital libre"
        >
          <MapPin size={12} />
          <span>{showIframeMap ? "Ocultar Mapa" : "Ver Mapa"}</span>
        </button>
      </div>

      {/* Mini Mapa Interactivo OpenStreetMap (100% FOSS a Costo Cero) */}
      {showIframeMap && (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-700/80 shadow-inner">
          <iframe
            src={osmEmbedUrl}
            className="w-full h-full border-0"
            title="Mapa de Ituzaingó OpenStreetMap"
            loading="lazy"
          />
          <div className="absolute bottom-1 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] text-slate-300">
            © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline text-sky-300">OpenStreetMap</a>
          </div>
        </div>
      )}

      {/* Datos Geográficos y de Horarios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block">Ubicación Exacta:</span>
            <span className="text-slate-400 text-[11px]">{address}</span>
            <span className="text-[10px] text-slate-500 block font-mono">GPS: {coords[0].toFixed(4)}, {coords[1].toFixed(4)}</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Clock size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block">Atención al Ciudadano:</span>
            <span className="text-slate-400 text-[11px]">{schedule}</span>
          </div>
        </div>
      </div>

      {/* Eventos Destacados de la Dependencia (Si es una oficina) */}
      {department && department.events.length > 0 && !event && (
        <div className="bg-sky-950/30 border border-sky-800/40 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
            <Calendar size={13} />
            <span>Último Evento Publicado:</span>
          </div>
          <p className="text-xs font-medium text-white">{department.events[0].title}</p>
          <p className="text-[11px] text-slate-400">{department.events[0].dateStr} • {department.events[0].timeStr} en {department.events[0].locationName}</p>
        </div>
      )}

      {/* Botones de Acción Inmediata: Cómo Llegar, Turnos y Contacto */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        {/* Enlace Cómo llegar a costo cero con OpenStreetMap */}
        <a
          href={osmUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 transition-all cursor-pointer text-center"
        >
          <Navigation size={13} />
          <span>Cómo Llegar (GPS)</span>
        </a>

        {/* WhatsApp Oficial */}
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola, me comunico desde Susy Bot por una consulta sobre ${title}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 transition-colors"
            title="Escribir por WhatsApp"
          >
            <MessageSquare size={13} />
            <span className="hidden xs:inline">WhatsApp</span>
          </a>
        )}

        {/* Teléfono */}
        {phone && (
          <a
            href={`tel:${phone.replace(/\D/g, "")}`}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Llamar a la oficina"
          >
            <Phone size={13} />
            <span className="hidden xs:inline">Llamar</span>
          </a>
        )}

        {/* Solicitar Turno */}
        {department && onRequestTurno && (
          <button
            onClick={() => onRequestTurno(department.id)}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 transition-colors cursor-pointer"
          >
            <Clock size={13} />
            <span>Sacar Turno</span>
          </button>
        )}
      </div>
    </div>
  );
}
