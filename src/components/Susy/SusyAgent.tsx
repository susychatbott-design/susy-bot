"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Sparkles, HelpCircle } from "lucide-react";
import SusyChatWindow from "./SusyChatWindow";

/**
 * ========================================================================
 * 🤖 NORA AGENT - SOLAPITA AMIGABLE DE ASISTENCIA (CERO INTRUSIÓN)
 * Ubicación: /src/components/Nora/SusyAgent.tsx
 * ========================================================================
 * Elimina los pop-ups automáticos intrusivos y presenta una solapa estética
 * y discreta para que el usuario consulte voluntariamente cuando lo desee.
 */

export default function SusyAgent() {
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showPill, setShowPill] = useState(true);

  // Excluir páginas de administración o el propio chat fullscreen de Susybot
  const isExcludedPage = 
    pathname?.startsWith("/admin") || 
    pathname?.startsWith("/dashboard") || 
    pathname === "/susybot";

  useEffect(() => {
    // Si el usuario ya cerró la solapita en esta sesión, respetar su decisión
    const dismissed = sessionStorage.getItem("nora_pill_dismissed");
    if (dismissed === "true") {
      setShowPill(false);
    }
  }, []);

  const handleDismissPill = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPill(false);
    sessionStorage.setItem("nora_pill_dismissed", "true");
  };

  if (isExcludedPage) {
    return null;
  }

  return (
    <>
      {/* Ventana de Chat de Nora (Solo se abre por clic explícito) */}
      <SusyChatWindow 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        contextData={{ mode: "asistencia_amigable", pathname }}
      />

      {/* Solapita Flotante Discreta y Elegante */}
      {!isChatOpen && (
        <div className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-40 flex items-center gap-2.5 group">
          
          {/* Botón Circular con Avatar */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 shadow-xl shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center overflow-hidden border-2 border-white/40 cursor-pointer shrink-0"
            title="¿Necesitás ayuda? Hablá con Nora"
            aria-label="Abrir asistente Nora"
          >
            <img 
              src="/nora-avatar.jpg?v=2" 
              alt="Nora" 
              className="w-full h-full object-cover rounded-full" 
              onError={(e) => { 
                e.currentTarget.style.display = 'none'; 
              }} 
            />
            {/* Punto verde de disponible */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
          </button>

          {/* Solapa / Píldora de Anuncio Cordial (No Intrusiva) */}
          {showPill && (
            <div 
              onClick={() => setIsChatOpen(true)}
              className="hidden sm:flex items-center gap-2.5 bg-slate-950/90 hover:bg-slate-900 border border-purple-500/40 hover:border-purple-400 py-2 px-3.5 rounded-2xl shadow-2xl backdrop-blur-md cursor-pointer transition-all animate-in fade-in slide-in-from-left-4 duration-300 max-w-xs"
            >
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-black text-purple-300 flex items-center gap-1 leading-tight">
                  <Sparkles size={11} className="text-pink-400" />
                  <span>Hola, soy Nora 👋</span>
                </span>
                <span className="text-xs text-slate-200 font-medium leading-tight mt-0.5">
                  ¿Buscás algo o necesitás ayuda? Estoy acá si me precisás.
                </span>
              </div>

              {/* Botón X para ocultar la solapa y dejar solo el icono */}
              <button
                type="button"
                onClick={handleDismissPill}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-full hover:bg-slate-800 transition-colors ml-1"
                title="Ocultar mensaje"
                aria-label="Cerrar solapa"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
