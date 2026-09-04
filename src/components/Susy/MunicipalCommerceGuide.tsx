"use client";

import React, { useState, useEffect } from "react";
import { 
  MUNICIPAL_COMMERCE_LIST, 
  MunicipalCommerce, 
  calculateDistanceMeters, 
  formatDistance, 
  getOsmDirectionsUrl 
} from "@/lib/susy/municipal/departmentsData";
import { 
  Search, 
  MapPin, 
  Clock, 
  Phone, 
  MessageSquare, 
  Globe, 
  ShieldCheck, 
  Navigation, 
  Store,
  Compass,
  X
} from "lucide-react";


const InstagramIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

interface MunicipalCommerceGuideProps {
  onClose?: () => void;
  onAskSusy?: (prompt: string) => void;
}

export default function MunicipalCommerceGuide({
  onClose,
  onAskSusy
}: MunicipalCommerceGuideProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Obtener geolocalización a costo cero
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  const categories = [
    { id: "todos", label: "🌟 Todos" },
    { id: "gastronomia", label: "🐟 Gastronomía" },
    { id: "hoteleria", label: "🏨 Hotelería" },
    { id: "supermercado", label: "🛒 Supermercados" },
    { id: "construccion", label: "🔨 Ferreterías" },
    { id: "salud", label: "💊 Farmacias" },
    { id: "indumentaria", label: "👗 Indumentaria" }
  ];

  const filtered = MUNICIPAL_COMMERCE_LIST.filter((com) => {
    const matchesCategory = selectedCategory === "todos" || com.category === selectedCategory;
    const matchesSearch = 
      com.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      com.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      com.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full bg-[#090e18] border border-sky-800/40 rounded-3xl p-4 sm:p-6 shadow-2xl text-left space-y-4">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-sky-600 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 shrink-0">
            🏪
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Guía Comercial Oficial de Ituzaingó
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                Comercios Adheridos
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Servicio municipal de difusión y promoción para comercios con habilitación vigente
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="space-y-2.5">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, rubro, calle o plato típico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Comercios Georreferenciados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((com) => {
          const distMeters = userLocation 
            ? calculateDistanceMeters(userLocation.lat, userLocation.lng, com.coordinates[0], com.coordinates[1])
            : null;
          const distText = distMeters ? formatDistance(distMeters) : null;
          const osmUrl = getOsmDirectionsUrl(com.coordinates[0], com.coordinates[1], userLocation?.lat, userLocation?.lng);

          return (
            <div
              key={com.id}
              className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-3 group shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl group-hover:scale-110 transition-transform">{com.logoEmoji}</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {com.name}
                      </h4>
                      <span className="text-[10px] text-amber-400/90 font-medium block">
                        {com.categoryLabel}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                    <ShieldCheck size={10} />
                    Habilitado
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {com.descripcion}
                </p>

                {/* Ubicación y Horario */}
                <div className="space-y-1 text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 truncate max-w-[70%]">
                      <MapPin size={11} className="text-rose-400 shrink-0" />
                      <span className="truncate">{com.address}</span>
                    </span>
                    {distText && (
                      <span className="text-emerald-400 font-semibold shrink-0 text-[10px] flex items-center gap-0.5">
                        <Compass size={10} /> A {distText}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={11} className="text-amber-400 shrink-0" />
                    <span className="truncate">{com.schedule}</span>
                  </div>
                </div>
              </div>

              {/* Botones de Redes Sociales y Navegación GPS */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/60">
                {/* Cómo llegar con OpenStreetMap */}
                <a
                  href={osmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[110px] flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-xs text-center"
                >
                  <Navigation size={12} />
                  <span>Cómo Llegar</span>
                </a>

                {/* WhatsApp */}
                {com.whatsapp && (
                  <a
                    href={`https://wa.me/${com.whatsapp}?text=${encodeURIComponent(`Hola ${com.name}, los contacto a través de Susy Bot de la Municipalidad de Ituzaingó.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300"
                    title="WhatsApp del Comercio"
                  >
                    <MessageSquare size={12} />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                )}

                {/* Instagram */}
                {com.instagram && (
                  <a
                    href={`https://instagram.com/${com.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-pink-950/60 hover:bg-pink-900 border border-pink-700/50 text-pink-300"
                    title="Instagram Oficial"
                  >
                    <InstagramIcon />
                    <span className="hidden sm:inline">@{com.instagram}</span>
                  </a>
                )}

                {/* Facebook */}
                {com.facebook && (
                  <a
                    href={`https://facebook.com/${com.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-blue-950/60 hover:bg-blue-900 border border-blue-700/50 text-blue-300"
                    title="Facebook"
                  >
                    <FacebookIcon />
                  </a>
                )}

                {/* Teléfono directo */}
                {com.phone && (
                  <a
                    href={`tel:${com.phone.replace(/\D/g, "")}`}
                    className="p-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                    title="Llamar"
                  >
                    <Phone size={12} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
