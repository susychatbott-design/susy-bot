"use client";

import React, { useState, useEffect } from "react";
import { municipalStore, GacetillaPrensa } from "@/lib/susy/municipal/municipalActions";
import { 
  Newspaper, 
  Search, 
  Calendar, 
  Share2, 
  Check, 
  X, 
  ExternalLink, 
  Tag, 
  Building2,
  Phone,
  Mail,
  ChevronRight
} from "lucide-react";

interface MunicipalPressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskSusy?: (pregunta: string) => void;
}

export default function MunicipalPressModal({ isOpen, onClose, onAskSusy }: MunicipalPressModalProps) {
  const [gacetillas, setGacetillas] = useState<GacetillaPrensa[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGacetilla, setSelectedGacetilla] = useState<GacetillaPrensa | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGacetillas(municipalStore.getGacetillas().filter(g => g.publicado));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ["Todas", "Institucional", "Obras", "Turismo", "Salud", "Cultura", "Comunidad"];

  const filteredGacetillas = gacetillas.filter(g => {
    const matchesCat = filterCategory === "Todas" || g.categoria === filterCategory;
    const matchesSearch = 
      g.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.bajada.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.cuerpo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleShare = (g: GacetillaPrensa, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `📰 *${g.titulo}*\n${g.bajada}\n\nEmitido por la Municipalidad de Ituzaingó, Corrientes.\nMás info en: https://susy-bot.vercel.app`;
    
    if (navigator.share) {
      navigator.share({
        title: g.titulo,
        text: shareText,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      setCopiedId(g.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Newspaper size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Gacetillas y Novedades Oficiales
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950 border border-sky-600 text-sky-300">
                  Ituzaingó
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Comunicados y anuncios oficiales del Municipio para los vecinos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cerrar ventana"
          >
            <X size={18} />
          </button>
        </div>

        {/* Buscador y Filtros */}
        <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-950/30 shrink-0 space-y-2.5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar comunicados por tema, obra o palabra clave..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-sky-500"
            />
          </div>

          {/* Categorías */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                  filterCategory === cat
                    ? "bg-sky-600 text-white shadow-sm shadow-sky-600/30"
                    : "bg-slate-800/70 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido Principal: Lista o Detalle */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
          {selectedGacetilla ? (
            /* Vista de Lectura Completa de Gacetilla */
            <div className="space-y-4 animate-fade-in">
              <button
                onClick={() => setSelectedGacetilla(null)}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                ← Volver al listado de gacetillas
              </button>

              <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/70 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-700/60 text-sky-300 font-semibold uppercase">
                    {selectedGacetilla.categoria}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {selectedGacetilla.fecha}
                  </span>
                  <span className="font-mono text-slate-500">• Ref: {selectedGacetilla.id}</span>
                </div>

                <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {selectedGacetilla.titulo}
                </h1>

                <p className="text-xs sm:text-sm font-medium text-sky-200/90 leading-relaxed border-l-2 border-sky-500 pl-3">
                  {selectedGacetilla.bajada}
                </p>

                <div className="pt-2 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedGacetilla.cuerpo}
                </div>

                {selectedGacetilla.voceroCita && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 italic">
                    {selectedGacetilla.voceroCita}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-sky-400" />
                    <span>{selectedGacetilla.contactoPrensa}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleShare(selectedGacetilla, e)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700/40 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedId === selectedGacetilla.id ? <Check size={13} /> : <Share2 size={13} />}
                      <span>{copiedId === selectedGacetilla.id ? "¡Copiado!" : "Compartir"}</span>
                    </button>

                    {onAskSusy && (
                      <button
                        onClick={() => {
                          onClose();
                          onAskSusy(`Hola Susy, explicame más detalles sobre la gacetilla oficial: "${selectedGacetilla.titulo}"`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-sky-600/30 cursor-pointer"
                      >
                        <span>Consultar a Susy</span>
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : filteredGacetillas.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Newspaper size={36} className="mx-auto opacity-30" />
              <p className="text-sm">No se encontraron gacetillas con ese criterio de búsqueda.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredGacetillas.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setSelectedGacetilla(g)}
                  className="p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-sky-500/50 transition-all cursor-pointer group space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800/50 text-sky-300 font-semibold">
                        {g.categoria}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar size={11} />
                        {g.fecha}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleShare(g, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-700/80 transition-colors"
                      title="Compartir gacetilla"
                    >
                      {copiedId === g.id ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
                    </button>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-sky-300 transition-colors leading-snug">
                    {g.titulo}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {g.bajada}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-sky-400 font-medium">
                    <span>Leer comunicado completo →</span>
                    <span className="text-slate-500 font-mono">{g.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie informativo */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <span>Prensa y Comunicación Institucional • Municipalidad de Ituzaingó</span>
          <span className="text-[10px] text-slate-500">MyJNexoraVisual</span>
        </div>

      </div>
    </div>
  );
}
