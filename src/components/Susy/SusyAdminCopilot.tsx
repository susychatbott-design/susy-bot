"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, Sparkles, Compass, HelpCircle, BookOpen, ChevronRight, RefreshCw, Cpu } from "lucide-react";
import Link from "next/link";
import { formatMarkdownToCleanHtml } from "@/lib/exportUtils";

interface AdminMessage {
  role: "user" | "nora";
  content: string;
}

export default function SusyAdminCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [operatorName, setOperatorName] = useState<string>("Javi");
  const [isEditingOperator, setIsEditingOperator] = useState(false);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Cargar nombre de operador guardado
  useEffect(() => {
    try {
      const savedOp = localStorage.getItem("nora_active_operator_name");
      if (savedOp) setOperatorName(savedOp);
    } catch (e) {}
  }, []);

  // 2. Cargar memoria específica del operador activo
  useEffect(() => {
    try {
      const storageKey = `nora_copilot_history_${operatorName.toLowerCase().trim()}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(Array.isArray(parsed) ? parsed : []);
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.warn("[NORA MEMORY] Error cargando memoria local:", e);
    }
  }, [operatorName]);

  // 3. Guardar automáticamente el historial en el perfil del operador activo
  useEffect(() => {
    if (messages.length > 0) {
      try {
        const storageKey = `nora_copilot_history_${operatorName.toLowerCase().trim()}`;
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (e) {
        console.warn("[NORA MEMORY] Error guardando memoria local:", e);
      }
    }
  }, [messages, operatorName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const changeOperator = (newName: string) => {
    const trimmed = newName.trim() || "Operador";
    setOperatorName(trimmed);
    localStorage.setItem("nora_active_operator_name", trimmed);
    setIsEditingOperator(false);
  };

  const clearMemory = () => {
    if (confirm(`¿Deseas reiniciar el historial de conversación de ${operatorName}?`)) {
      setMessages([]);
      const storageKey = `nora_copilot_history_${operatorName.toLowerCase().trim()}`;
      localStorage.removeItem(storageKey);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isTyping) return;

    const updatedMessages: AdminMessage[] = [...messages, { role: "user", content: textToSend }];
    setMessages(updatedMessages);
    if (!customPrompt) setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/nora-admin-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          operatorName,
          history: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      
      if (data.canonicalName && data.canonicalName !== operatorName) {
        setOperatorName(data.canonicalName);
        localStorage.setItem("nora_active_operator_name", data.canonicalName);
      }

      if (data.reply) {
        setMessages([...updatedMessages, { role: "nora", content: data.reply }]);
      }
    } catch (err) {
      setMessages([...updatedMessages, { role: "nora", content: `Hola ${operatorName}, ocurrió un inconveniente al conectar. Por favor reintenta.` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQuestions = [
    { label: "🎯 ¿Cómo prospectar con el generador B2B?", prompt: "¿Cómo uso el nuevo módulo de Prospección B2B para captar cabañas, comercios y empresas en Ituzaingó?" },
    { label: "🎨 ¿Cómo crear un video Faux-CGI?", prompt: "¿Cómo creo una campaña publicitaria Faux-CGI en el Estudio Surrealista?" },
    { label: "🕵️ ¿Cómo funciona VALEN?", prompt: "¿Cómo funciona el agente VALEN para prospección comercial y captación de inmuebles?" },
    { label: "📰 ¿Cómo funciona el Fact-Checker?", prompt: "¿Cómo verifica Nora la veracidad de las noticias antes de publicarlas?" },
    { label: "💾 ¿Cómo sincronizar la memoria RAG?", prompt: "¿Cómo sincronizar manualmente la memoria semántica RAG con el comando npm run sync-memory?" }
  ];

  return (
    <>
      {/* Botón Flotante en la esquina inferior derecha */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 text-white font-bold text-xs py-3 px-4 rounded-full shadow-2xl shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all border border-white/30 group"
          title="Abrir Nora Instructora & Copiloto Técnico"
        >
          <div className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center border border-white/30 overflow-hidden shrink-0">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </div>
          <span className="tracking-wide">Nora Instructora Master</span>
          <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/30 uppercase font-black">Copiloto</span>
        </button>
      )}

      {/* Modal Interactivo del Dashboard Copiloto */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[360px] sm:w-[420px] max-w-[calc(100vw-32px)] backdrop-blur-2xl bg-slate-950/95 border border-white/20 rounded-2xl shadow-2xl shadow-black overflow-hidden flex flex-col h-[560px] max-h-[85vh] animate-in slide-in-from-bottom-6 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-4 border-b border-white/10 flex items-center justify-between shadow-lg relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center border-2 border-white/30 shadow-md">
                <Compass className="w-5 h-5 text-white animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-black text-white text-base leading-tight flex items-center gap-1.5">
                  Nora Instructora
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">24/7</span>
                </h3>
                
                {/* Selector de Perfil de Operador */}
                {isEditingOperator ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="text"
                      defaultValue={operatorName}
                      onKeyDown={(e) => e.key === "Enter" && changeOperator((e.target as HTMLInputElement).value)}
                      onBlur={(e) => changeOperator(e.target.value)}
                      autoFocus
                      className="bg-black/60 border border-amber-400/60 text-white text-[11px] px-2 py-0.5 rounded w-24 outline-none"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingOperator(true)}
                    className="text-[11px] text-amber-200/90 font-medium hover:text-white transition-colors flex items-center gap-1 group mt-0.5"
                    title="Hacé clic para cambiar de operador"
                  >
                    <span>👤 Operador: <strong className="text-amber-300 group-hover:underline">{operatorName}</strong></span>
                    <span className="text-[9px] bg-white/10 text-gray-300 px-1 rounded opacity-70">Cambiar</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={clearMemory}
                className="text-[10px] text-amber-300/80 hover:text-amber-200 bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg border border-white/10 transition-colors"
                title="Reiniciar chat de este operador"
              >
                Limpiar
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-white/60 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Enlaces Rápidos a Herramientas Principales */}
          <div className="bg-black/60 p-2 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold text-white/80 scrollbar-none shrink-0">
            <Link href="/admin/marketing/editor" onClick={() => setIsOpen(false)} className="px-2.5 py-1 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500/30 rounded-lg flex items-center gap-1 text-amber-300 whitespace-nowrap transition-colors">
              🎯 Prospección B2B
            </Link>
            <Link href="/admin/marketing/editor" onClick={() => setIsOpen(false)} className="px-2.5 py-1 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 rounded-lg flex items-center gap-1 text-purple-300 whitespace-nowrap transition-colors">
              🎨 Estudio Faux-CGI
            </Link>
            <Link href="/admin/growth" onClick={() => setIsOpen(false)} className="px-2.5 py-1 bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-500/30 rounded-lg flex items-center gap-1 text-cyan-300 whitespace-nowrap transition-colors">
              🕵️ Agente VALEN
            </Link>
            <Link href="/admin/news" onClick={() => setIsOpen(false)} className="px-2.5 py-1 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/30 rounded-lg flex items-center gap-1 text-blue-300 whitespace-nowrap transition-colors">
              📰 Fact-Checker
            </Link>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-950/60 to-slate-900/80 border border-purple-500/30 rounded-xl p-3.5 text-xs text-purple-200 leading-relaxed shadow-sm">
                  <p className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> ¡Hola! Soy Nora, tu Instructora Master.
                  </p>
                  Tengo cargado el mapa completo de todo el sistema. Puedo enseñarte a usar el Estudio Surrealista, gestionar los leads de VALEN, sincronizar la memoria o solucionar cualquier error.
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider px-1">Guías Rápidas Recomendadas:</p>
                  <div className="space-y-1.5">
                    {quickQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(q.prompt)}
                        className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/40 text-xs text-gray-200 flex items-center justify-between transition-all group"
                      >
                        <span>{q.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[90%] px-3.5 py-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white rounded-br-sm font-medium"
                    : "bg-slate-900 border border-white/10 text-gray-100 rounded-bl-sm"
                }`}>
                  <div 
                    className="prose prose-invert max-w-none text-xs font-sans leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMarkdownToCleanHtml(msg.content) }}
                  />
                </div>
                <span className="text-[9px] text-gray-500 mt-1 px-1">
                  {msg.role === "nora" ? "Nora Instructora" : "Tú"}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex flex-col items-start">
                <div className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-white/10 rounded-bl-sm flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-amber-400 animate-spin" />
                  <span className="text-xs text-amber-300 font-medium">Consultando Mapa del Sistema...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Área de Input */}
          <div className="p-3 bg-black/80 border-t border-white/10 relative mt-auto">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregúntale a Nora cómo hacer cualquier tarea..."
                className="flex-1 bg-white/10 text-white placeholder-white/40 text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-amber-500/60 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-2.5 bg-gradient-to-r from-amber-500 to-purple-600 text-white rounded-xl disabled:opacity-40 transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
