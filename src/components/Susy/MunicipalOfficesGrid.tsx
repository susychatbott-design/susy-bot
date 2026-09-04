"use client";

import React, { useState } from "react";
import { 
  MUNICIPAL_DEPARTMENTS, 
  MunicipalDepartment 
} from "@/lib/susy/municipal/departmentsData";
import { 
  Calendar, 
  MapPin, 
  ChevronRight, 
  Clock, 
  FileText, 
  ShieldCheck, 
  Sparkles,
  BarChart3,
  Newspaper
} from "lucide-react";
import Link from "next/link";

interface MunicipalOfficesGridProps {
  onSelectDepartment: (dept: MunicipalDepartment) => void;
  onRequestTurno?: (deptId?: string) => void;
  onRequestPermiso?: () => void;
  onRequestGacetillas?: () => void;
  onRequestComercio?: () => void;
  activeDepartmentId?: string | null;
}

export default function MunicipalOfficesGrid({
  onSelectDepartment,
  onRequestTurno,
  onRequestPermiso,
  onRequestGacetillas,
  onRequestComercio,
  activeDepartmentId
}: MunicipalOfficesGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");

  const categories = [
    { id: "todas", label: "🌟 Todas (12)" },
    { id: "servicios", label: "🚜 Servicios" },
    { id: "comunidad", label: "🤝 Comunidad" },
    { id: "desarrollo", label: "🏖️ Turismo & Empleo" },
    { id: "gobierno", label: "🏛️ Gobierno & Tech" }
  ];

  const filteredOffices = selectedCategory === "todas"
    ? MUNICIPAL_DEPARTMENTS
    : MUNICIPAL_DEPARTMENTS.filter((d) => d.category === selectedCategory);

  return (
    <div className="w-full space-y-3.5 my-2.5 shrink-0 text-left">
      {/* Selector de Categorías / Filtros Rápidos */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x py-0.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-sky-500 text-white shadow-sm shadow-sky-500/30 font-bold"
                : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid de 12 Secretarías y Oficinas Municipales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 w-full">
        {filteredOffices.map((dept) => {
          const isSelected = activeDepartmentId === dept.id;
          const hasEvents = dept.events.length > 0;

          return (
            <button
              key={dept.id}
              onClick={() => onSelectDepartment(dept)}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer select-none flex flex-col justify-between group active:scale-[0.98] relative overflow-hidden ${
                isSelected
                  ? "bg-gradient-to-br from-sky-600/90 via-sky-700/80 to-indigo-800/90 border-sky-300 ring-2 ring-sky-400/50 shadow-lg shadow-sky-950/60"
                  : "bg-slate-900/90 hover:bg-slate-850 text-slate-200 border-slate-800/90 hover:border-sky-500/40 shadow-sm"
              }`}
            >
              {/* Badge de Evento Activo si lo tiene */}
              {hasEvents && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                  <Calendar size={8} />
                  <span>Evento</span>
                </div>
              )}

              <div>
                <div className="text-xl mb-1.5 group-hover:scale-110 transition-transform w-fit">
                  {dept.icon}
                </div>
                <h4 className={`text-xs font-bold leading-snug line-clamp-1 group-hover:text-sky-300 transition-colors ${
                  isSelected ? "text-white font-extrabold" : "text-slate-100"
                }`}>
                  {dept.shortName}
                </h4>
                <p className={`text-[10px] line-clamp-1 mt-0.5 ${
                  isSelected ? "text-sky-100" : "text-slate-400"
                }`}>
                  {dept.shortDesc}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-slate-800/50">
                <span className="flex items-center gap-1 truncate max-w-[85%] text-slate-400">
                  <MapPin size={10} className="shrink-0 text-sky-400" />
                  <span className="truncate">{dept.address.split("(")[0]}</span>
                </span>
                <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform text-sky-400 shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Botonera Institucional de Trámites Rápidos & Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-1">
        {/* Sacar Turno */}
        <button
          onClick={() => onRequestTurno && onRequestTurno()}
          className="p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/40 text-left transition-all group cursor-pointer flex items-center gap-2"
        >
          <Clock size={16} className="text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
          <div className="truncate">
            <span className="text-xs font-bold text-amber-300 block truncate">Sacar Turno</span>
            <span className="text-[9px] text-slate-400 truncate hidden xs:block">Licencia y Rentas</span>
          </div>
        </button>

        {/* Permiso Provisorio con QR */}
        <button
          onClick={() => onRequestPermiso && onRequestPermiso()}
          className="p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-600/40 text-left transition-all group cursor-pointer flex items-center gap-2"
        >
          <ShieldCheck size={16} className="text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
          <div className="truncate">
            <span className="text-xs font-bold text-emerald-300 block truncate">Permiso con QR</span>
            <span className="text-[9px] text-slate-400 truncate hidden xs:block">Poda y Mudanzas</span>
          </div>
        </button>

        {/* Guía Comercial Oficial */}
        <button
          onClick={() => onRequestComercio && onRequestComercio()}
          className="p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/40 text-left transition-all group cursor-pointer flex items-center gap-2"
        >
          <span className="text-lg shrink-0 group-hover:scale-110 transition-transform">🏪</span>
          <div className="truncate">
            <span className="text-xs font-bold text-amber-300 block truncate">Guía Comercial</span>
            <span className="text-[9px] text-slate-400 truncate hidden xs:block">Comercios Adheridos</span>
          </div>
        </button>

        {/* Gacetillas de Prensa */}
        <button
          onClick={() => onRequestGacetillas && onRequestGacetillas()}
          className="p-2.5 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-600/40 text-left transition-all group cursor-pointer flex items-center gap-2"
        >
          <Newspaper size={16} className="text-sky-400 shrink-0 group-hover:scale-110 transition-transform" />
          <div className="truncate">
            <span className="text-xs font-bold text-sky-300 block truncate">Gacetillas</span>
            <span className="text-[9px] text-slate-400 truncate hidden xs:block">Prensa Oficial</span>
          </div>
        </button>


      </div>
    </div>
  );
}
