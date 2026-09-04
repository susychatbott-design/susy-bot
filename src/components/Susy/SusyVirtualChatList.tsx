"use client";

import React, { useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { Scale, FileText, AlertCircle, CheckCircle2, User, Building2, MapPin } from "lucide-react";

export type MunicipalChatCategory = "general" | "reclamos" | "rentas" | "digesto";

export interface CitizenAttachment {
  type: "image" | "document";
  name?: string;
  url?: string;
  previewThumbnail?: string;
}

export interface MunicipalMessage {
  id: string;
  role: "citizen" | "susy" | "system";
  content: string;
  category: MunicipalChatCategory;
  ticketCode?: string;
  isOfficialDecree?: boolean;
  isAdministrativeReferral?: boolean;
  attachment?: CitizenAttachment;
  timestamp: number;
}

interface SusyVirtualChatListProps {
  messages: MunicipalMessage[];
  activeCategory: MunicipalChatCategory;
  onCategoryChange: (cat: MunicipalChatCategory) => void;
  onTicketClick?: (ticketCode: string) => void;
  windowSize?: number;
  overscan?: number;
}

export default function SusyVirtualChatList({
  messages,
  activeCategory,
  onCategoryChange,
  onTicketClick,
  windowSize = 12,
  overscan = 2
}: SusyVirtualChatListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const heightCache = useRef<Map<string, number>>(new Map());
  const [, forceRender] = useState({});

  // 1. Filtrado por categoría institucional
  const filteredMessages = useMemo(() => {
    if (activeCategory === "general") return messages;
    return messages.filter(m => m.category === activeCategory);
  }, [messages, activeCategory]);

  // 2. Control estricto de memoria: Purga del cache de alturas para evitar memory leak en móviles
  useEffect(() => {
    if (heightCache.current.size > 150) {
      const activeIds = new Set(filteredMessages.slice(-40).map(m => m.id));
      for (const key of heightCache.current.keys()) {
        if (!activeIds.has(key)) heightCache.current.delete(key);
      }
    }
  }, [filteredMessages]);

  // 3. Manejador de scroll con RAF throttling
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    requestAnimationFrame(() => {
      if (containerRef.current) {
        setScrollTop(containerRef.current.scrollTop);
      }
    });
  }, []);

  // 4. Cálculo de rango visible de ventana deslizante (Sliding Window)
  const total = filteredMessages.length;
  const visibleRange = useMemo(() => {
    if (total <= windowSize) {
      return { start: 0, end: total };
    }
    const start = Math.max(0, total - windowSize - overscan);
    return { start, end: total };
  }, [total, windowSize, overscan]);

  // 5. Medición dinámica de nodos montados post-layout
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const nodes = containerRef.current.querySelectorAll<HTMLDivElement>("[data-msg-id]");
    let hasNewMeasurements = false;
    nodes.forEach((node) => {
      const id = node.getAttribute("data-msg-id");
      if (id && !heightCache.current.has(id)) {
        heightCache.current.set(id, node.getBoundingClientRect().height);
        hasNewMeasurements = true;
      }
    });
    if (hasNewMeasurements) {
      forceRender({});
    }
  }, [visibleRange, filteredMessages]);

  const visibleMessages = useMemo(() => {
    return filteredMessages.slice(visibleRange.start, visibleRange.end);
  }, [filteredMessages, visibleRange]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Selector de Categorías Institucionales */}
      <div className="flex items-center gap-1.5 p-2 bg-zinc-900/90 border-b border-zinc-800 text-xs font-semibold overflow-x-auto shrink-0">
        {[
          { id: "general", label: "🏛️ General" },
          { id: "reclamos", label: "🚧 Reclamos Vecinales" },
          { id: "rentas", label: "💳 Rentas / Tasas" },
          { id: "digesto", label: "📜 Digesto Municipal" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onCategoryChange(tab.id as MunicipalChatCategory)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeCategory === tab.id
                ? "bg-amber-500 text-black font-black shadow-md"
                : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenedor Virtualizado con contención estricta */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 will-change-transform"
        style={{ contain: "strict" }}
      >
        {visibleRange.start > 0 && (
          <div
            style={{ height: `${visibleRange.start * 80}px` }}
            className="w-full flex items-center justify-center text-xs text-zinc-500 py-3 bg-zinc-900/30 rounded-xl border border-zinc-800/50"
          >
            <span>📜 {visibleRange.start} actuaciones previas archivadas en el expediente digital</span>
          </div>
        )}

        {visibleMessages.map((msg) => {
          const isCitizen = msg.role === "citizen";

          return (
            <div
              key={msg.id}
              data-msg-id={msg.id}
              className={`flex flex-col ${isCitizen ? "items-end" : "items-start"} transform-gpu`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg ${
                  isCitizen
                    ? "bg-amber-500/15 text-amber-100 border border-amber-500/30 rounded-br-none"
                    : msg.isOfficialDecree
                    ? "bg-gradient-to-br from-zinc-900 to-zinc-950 border border-amber-500/40 text-zinc-100 rounded-bl-none"
                    : msg.isAdministrativeReferral
                    ? "bg-gradient-to-br from-red-950/40 to-zinc-900 border border-red-500/30 text-red-100 rounded-bl-none"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-none"
                }`}
              >
                {/* Cabecera institucional */}
                {!isCitizen && (
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-zinc-800/80 text-xs font-bold text-amber-400">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Mesa de Entradas • Municipalidad de Ituzaingó</span>
                  </div>
                )}

                {/* Insignia de Ticket de Reclamo */}
                {msg.ticketCode && (
                  <div
                    onClick={() => onTicketClick?.(msg.ticketCode!)}
                    className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-md text-xs font-black text-amber-300 cursor-pointer transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Expediente: #{msg.ticketCode}</span>
                  </div>
                )}

                {/* Adjunto optimizado con purga de Base64 fuera de vista */}
                {msg.attachment && (
                  <div className="mb-2.5 rounded-lg overflow-hidden border border-zinc-700/60 bg-black/40 p-2">
                    {msg.attachment.type === "image" && msg.attachment.url ? (
                      <img
                        src={msg.attachment.url}
                        alt="Constancia o fotografía de inspección urbana"
                        className="max-h-36 w-auto rounded object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-zinc-300">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span className="truncate">{msg.attachment.name || "Documento adjunto oficial"}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Contenido textual */}
                <div className="whitespace-pre-wrap font-sans text-sm selection:bg-amber-500 selection:text-black">
                  {msg.content}
                </div>

                {/* Pie de mensaje y hora */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="capitalize">{msg.category}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
