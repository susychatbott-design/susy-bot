"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Sparkles, ChevronDown, HelpCircle, ShieldCheck, Cpu } from "lucide-react";

interface NoraMessage {
  id: string;
  sender: "user" | "nora";
  text: string;
  time: string;
}

const NORA_KNOWLEDGE_BASE = `
Sos Nora, la Copilot Técnica y Guía de Operaciones del Centro de Gestión Municipal de Ituzaingó, Corrientes.
Tu misión es asistir en tiempo real a los operadores, secretarios y directores municipales que están utilizando este Dashboard.

INFORMACIÓN COMPLETA DEL ECOSISTEMA SUSY BOT Y SU DASHBOARD:

1. ¿QUÉ ES SUSY BOT Y CON QUÉ INTENCIÓN FUE CREADA?
Susy Bot es una plataforma de Inteligencia Cívica Independiente y Soberana desarrollada por Nexora One para la Municipalidad de Ituzaingó, Corrientes. Fue concebida para atender al ciudadano 24/7 en trámites, reclamos urbanos, defensa civil, turismo y salud con Diseño Universal de Aprendizaje (DUA) y lenguaje cálido correntino, eliminando esperas burocráticas y agilizando la gestión municipal.

2. ¿POR QUÉ ES UN SISTEMA INDEPENDIENTE?
Es 100% independiente porque su núcleo de inferencia, geolocalización de 20 barrios y base documental operan de manera autónoma sin depender de servidores centralizados extranjeros ni costos por consulta. Posee resiliencia para funcionar tanto en línea como en contingencia local, garantizando la privacidad de los vecinos de Ituzaingó.

3. EXPLICACIÓN DE CADA PESTAÑA DEL DASHBOARD:
- 🚆 Tren Agéntico & Ánimo Barrial (20 Barrios): Monitorea en vivo el despacho de los 7 agentes municipales (Obras, Tránsito, Rentas, Prensa, etc.), el radar de ánimo ciudadano de los 20 barrios (Belgrano, Casco Céntrico, San Jorge, Paraná, etc.) y permite editar o archivar operaciones.
- 📊 Métricas & Tráfico: Gráficos de interacciones, tasa de resolución, tiempos de respuesta y volumen de consultas atendidas por Susy.
- ⏱️ Turnos: Gestión de turnos emitidos para trámites (licencias, rentas, habilitaciones) con filtro por fecha y estado de concurrencia.
- 🛡️ Permisos con QR: Emisión y auditoría de permisos provisorios de 72 horas (poda, carga/descarga, libre deuda) con código QR verificable.
- 📰 Gacetillas de Prensa: Editor institucional para publicar comunicados oficiales, agenda del Intendente José Emilio Nicolás y novedades municipales.
- 🏪 Guía Comercial: Directorio de comercios locales, farmacias de turno y servicios con teléfonos y direcciones actualizadas.
- 🗺️ Mapa de Oficinas: Cartografía y datos de contacto de las dependencias municipales del Palacio Municipal y descentralizadas.
- 🚨 Defensa Civil: Monitoreo de alertas meteorológicas, crecidas del Río Paraná, incendios forestales y derivación a cuarteles de guardia.
- 🏛️ Archivo Histórico: Repositorio inmutable y auditable donde se conservan todos los reclamos resueltos, intervenciones y reportes, con exportación a Word y PDF para el Intendente y Secretarios.

4. NORA COPILOT:
Sos precisa, profesional, humana y resolutiva. Respondé siempre al pie de la letra, con cordialidad y claridad técnica para facilitar la labor del funcionario o personal municipal.
`;

export function NoraCopilot() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<NoraMessage[]>([
    {
      id: "welcome",
      sender: "nora",
      text: "¡Hola! Soy Nora, tu Copilot técnica en este Centro de Gestión. Conozco cada función, panel y reporte de Susy Bot al pie de la letra. ¿En qué sección o procedimiento necesitás apoyo?",
      time: "Ahora"
    }
  ]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = async (customQuery?: string) => {
    const query = (customQuery || input).trim();
    if (!query) return;

    const userMsg: NoraMessage = {
      id: "u_" + Date.now(),
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInput("");
    setIsThinking(true);

    try {
      const res = await fetch("/api/nora-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: messages.map((m) => ({
            sender: m.sender,
            text: m.text
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        const cleanReply = (data.text || "").trim();

        setMessages((prev) => [
          ...prev,
          {
            id: "n_" + Date.now(),
            sender: "nora",
            text: cleanReply || "Entendido. Podés ver esa información directamente en la pestaña correspondiente del panel superior.",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      } else {
        throw new Error("ERR_NORA_API");
      }
    } catch {
      // Fallback local determinista sobre el conocimiento de Susy
      let localFallback = "Podés gestionar ese requerimiento desde el menú superior. ¿Deseás que te oriente paso a paso sobre alguna pestaña específica?";
      const q = query.toLowerCase();
      if (q.includes("reporte") || q.includes("word") || q.includes("pdf") || q.includes("imprimir")) {
        localFallback = "Para exportar planillas oficiales para el Intendente o Secretarios, andá a la pestaña 'Archivo Histórico de Auditoría' y presioná 'Exportar Planilla Word (.doc)' o 'Generar PDF Oficial'. El documento saldrá membretado y con espacio para rúbrica.";
      } else if (q.includes("barrio") || q.includes("animo") || q.includes("tren")) {
        localFallback = "En 'Tren Agéntico & Ánimo Barrial' ves los 20 barrios de Ituzaingó con su índice de humor social. En cada tarjeta tenés los botones 'Modificar' para actualizar el estado del reclamo y 'Archivar' para transferirlo al repositorio permanente.";
      } else if (q.includes("permiso") || q.includes("qr")) {
        localFallback = "En la pestaña 'Permisos con QR' se generan autorizaciones provisorias de 72 hs (poda, carga, libre deuda). Podés ver el QR e imprimir la constancia física en cualquier momento.";
      } else if (q.includes("defensa civil") || q.includes("emergencia")) {
        localFallback = "En 'Defensa Civil' se monitorean las alertas de tormentas, el caudal del Río Paraná frente a la Costanera y los teléfonos de guardia activa (103, 100 y 107).";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: "n_" + Date.now(),
          sender: "nora",
          text: localFallback,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      {/* Botón Flotante Copilot */}
      <div className="fixed bottom-5 right-5 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 text-slate-950 font-extrabold text-xs shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-cyan-300/40"
            title="Abrir Copilot Nora"
          >
            <Bot size={17} className="animate-bounce" />
            <span>Nora Copilot</span>
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
          </button>
        )}
      </div>

      {/* Ventana de Asistencia Nora Copilot */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-96 max-w-[calc(100vw-24px)] h-[520px] max-h-[85vh] bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-fadeIn">
          {/* Cabecera */}
          <div className="p-3 bg-gradient-to-r from-slate-900 via-cyan-950/60 to-slate-900 border-b border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold">
                <Bot size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Nora • Copilot de Gestión
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-900/80 text-cyan-200 border border-cyan-500/30 font-mono">
                    NEXORA ONE
                  </span>
                </h4>
                <p className="text-[10px] text-cyan-300/80">
                  Guía operativa y soporte del ecosistema
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Sugerencias Rápidas */}
          <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
            <button
              onClick={() => handleSend("¿Cómo descargo las planillas en Word o PDF para el Intendente?")}
              className="px-2 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900 shrink-0 cursor-pointer"
            >
              📄 Exportar planillas
            </button>
            <button
              onClick={() => handleSend("¿Cómo edito o archivo un reclamo barrial?")}
              className="px-2 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900 shrink-0 cursor-pointer"
            >
              ✏️ Modificar / Archivar
            </button>
            <button
              onClick={() => handleSend("¿Cómo funciona el código QR de los permisos?")}
              className="px-2 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900 shrink-0 cursor-pointer"
            >
              🛡️ Permisos QR
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-2.5 leading-relaxed ${
                    m.sender === "user"
                      ? "bg-cyan-600 text-white rounded-br-none shadow-md shadow-cyan-600/20"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 text-cyan-400 text-xs italic p-1 animate-pulse">
                <Sparkles size={14} />
                <span>Nora está consultando el ecosistema...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Preguntale a Nora sobre cualquier función..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-cyan-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isThinking}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all disabled:opacity-40 cursor-pointer shadow-md shadow-cyan-500/20"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
