"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, User, Sparkles, Scale, Paperclip, PlayCircle, PauseCircle } from "lucide-react";
import { formatMarkdownToCleanHtml, downloadAsWord, exportToPdf } from "@/lib/exportUtils";

interface Message {
  role: "user" | "nora";
  content: string;
  isLegalResponse?: boolean;
  isHumanSupport?: boolean;
  audioBase64?: string;
  attachedImageUrl?: string;
}

interface SusyChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  contextData: any;
}

export default function SusyChatWindow({ isOpen, onClose, contextData }: SusyChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [accessibleLiveText, setAccessibleLiveText] = useState<string>("Ventana de chat con Nora abierta.");
  
  // Multimodal state
  const [attachedImage, setAttachedImage] = useState<{ file: File; base64: string; mimeType: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Cargar memoria guardada de localStorage al abrir
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nora_chat_history_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn("[NORA CHAT WINDOW] Error leyendo memoria local:", e);
    }
  }, []);

  // 2. Guardar memoria automáticamente ante cualquier cambio
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("nora_chat_history_v2", JSON.stringify(messages));
      } catch (e) {
        console.warn("[NORA CHAT WINDOW] Error guardando memoria local:", e);
      }
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const triggerInitialNoraMessage = async (dataContext: any) => {
    if (messages.length > 0) return; // Si ya hay memoria persistida, no reiniciar
    setIsTyping(true);
    
    try {
      const res = await fetch("/api/nora-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "",
          history: [],
          contextData: dataContext
        }),
      });
      const data = await res.json();
      if (data.text) {
        setMessages([{ role: "nora", content: data.text, isLegalResponse: data.freeze, audioBase64: data.audioBase64 }]);
        if (data.freeze) {
          setIsFrozen(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  // Initial trigger
  useEffect(() => {
    if (isOpen && messages.length === 0 && contextData) {
      triggerInitialNoraMessage(contextData);
    }
  }, [isOpen, contextData, messages.length]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Por favor, sube una imagen JPG, PNG o WEBP válida.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      // Compresión básica de imagen en cliente para evitar error 413 Payload Too Large de Vercel
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
        const base64String = compressedDataUrl.split(",")[1];
        setAttachedImage({ file, base64: base64String, mimeType: "image/jpeg" });
        setPreviewUrl(compressedDataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
    setPreviewUrl(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || isTyping) return;

    const userMsg = input.trim();
    setInput("");
    
    const currentPreviewUrl = previewUrl;
    const currentAttachedImage = attachedImage;
    
    // Clear image immediately for UI responsiveness
    handleRemoveImage();
    
    if (!hasConsented) setHasConsented(true);

    const newHistory: Message[] = [...messages, { role: "user", content: userMsg, attachedImageUrl: currentPreviewUrl || undefined }];
    setMessages(newHistory);
    setIsTyping(true);

    try {
      const res = await fetch("/api/nora-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages, // Send history WITHOUT the new image to avoid payload bloat, just the previous context
          contextData: contextData,
          image: currentAttachedImage ? {
            data: currentAttachedImage.base64,
            mimeType: currentAttachedImage.mimeType
          } : null
        }),
      });
      const data = await res.json();
      if (data.text) {
        setMessages([...newHistory, { role: "nora", content: data.text, isLegalResponse: data.freeze, audioBase64: data.audioBase64 }]);
        setAccessibleLiveText(`Nora dice: ${data.text}`);
        if (data.freeze) {
          setIsFrozen(true);
        }
      }
    } catch (e) {
      console.error(e);
      const fallback = "¡Uy! Perdoná la demora, se nos llenó el local de gente de golpe y se me tildó el sistema 😅. Si tenés prisa, ¿me escribís por WhatsApp usando el globito verde?";
      setMessages([...newHistory, { role: "nora", content: fallback }]);
      setAccessibleLiveText(`Nora dice: ${fallback}`);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Ventana de conversación con Nora"
      className={`fixed bottom-16 sm:bottom-8 left-3 right-3 sm:right-auto sm:left-8 z-40 w-auto sm:w-[380px] max-w-[calc(100vw-24px)] backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col h-[430px] sm:h-[500px] max-h-[60vh] sm:max-h-[80vh] animate-in slide-in-from-bottom-6 fade-in duration-300 ${isFrozen ? "bg-slate-900/95" : "bg-black/95"}`}
    >
      {/* Región Dinámica Asertiva para TalkBack (Android) y VoiceOver (iOS) */}
      <div 
        id="nora-chat-a11y-live-region"
        aria-live="assertive" 
        aria-atomic="true" 
        className="sr-only"
      >
        {accessibleLiveText}
      </div>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-brand-accent)] to-[var(--color-brand-accent-hover)] p-4 flex items-center justify-between shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center border-2 border-white/30 overflow-hidden">
              <img src="/nora-avatar.jpg?v=2" alt="Avatar de Nora" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display='none'; }} />
              <User className="w-6 h-6 text-black/50 absolute -z-10" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--color-brand-accent)]"></div>
          </div>
          <div>
            <h3 className="font-black text-black leading-tight text-lg">Nora</h3>
            <p className="text-black/70 text-xs font-bold">En línea</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          role="button"
          aria-label="Cerrar ventana de chat con Nora"
          className="text-black/50 hover:text-black transition-colors bg-black/10 hover:bg-black/20 rounded-full p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Legal Consent Banner (Ley 25.326) */}
      {!hasConsented && (
        <div className="bg-slate-900 border-b border-slate-700 p-3 text-xs text-slate-300 shadow-sm relative shrink-0">
          <p className="pr-6">
            <strong>Hola, soy Nora.</strong> Para ayudarte y conectar tus intereses con comercios locales, proceso tus mensajes, audios e imágenes mediante IA bajo los términos de la <strong>Ley Nacional N° 25.326 de Protección de Datos Personales</strong>. Al interactuar conmigo, aceptas nuestra <a href="/legal-and-ip/politica-privacidad" target="_blank" rel="noopener noreferrer" className="underline font-bold text-white">Política de Privacidad y Términos de Uso</a>.
          </p>
          <button 
            onClick={() => setHasConsented(true)} 
            role="button"
            aria-label="Aceptar y cerrar banner de privacidad"
            className="absolute top-2 right-2 text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages Area con Virtualización de DOM (Últimos 10 mensajes en caliente) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.length > 10 && !showAllHistory && (
          <button
            type="button"
            role="button"
            aria-label={`Ver ${messages.length - 10} mensajes anteriores`}
            onClick={() => setShowAllHistory(true)}
            className="w-full py-1.5 px-3 mb-2 text-center text-xs text-cyan-400/80 hover:text-cyan-300 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>📜 Ver {messages.length - 10} mensajes anteriores</span>
          </button>
        )}

        {(showAllHistory || messages.length <= 10 ? messages : messages.slice(-10)).map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === "user" 
                ? "bg-white/10 text-white rounded-br-sm" 
                : msg.isLegalResponse
                  ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600 text-gray-100 rounded-bl-sm"
                  : "bg-gradient-to-br from-gray-900 to-black border border-white/10 text-gray-100 rounded-bl-sm"
            }`}>
              {msg.isLegalResponse && (
                <div className="flex items-center gap-2 mb-2 text-slate-300 font-semibold border-b border-slate-600 pb-2">
                  <Scale className="w-4 h-4" />
                  Derivación Administrativa
                </div>
              )}
              {msg.isHumanSupport && (
                <div className="flex items-center gap-2 mb-2 text-green-400 font-semibold border-b border-green-800 pb-2">
                  <User className="w-4 h-4" />
                  Derivación a Humano
                </div>
              )}
              {msg.attachedImageUrl && (
                <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                  <img 
                    src={msg.attachedImageUrl} 
                    alt="Pizarrón, apunte o imagen analizada por Nora para accesibilidad visual" 
                    className="max-w-full h-auto max-h-32 object-contain bg-black/50" 
                  />
                </div>
              )}
              <div 
                className="prose prose-invert max-w-none text-sm font-sans"
                dangerouslySetInnerHTML={{ __html: formatMarkdownToCleanHtml(msg.content) }}
              />
              {msg.role === "nora" && msg.content.length > 150 && (
                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-2">
                  <button
                    onClick={() => downloadAsWord(`informe_nora_${idx}`, "INFORME NORA — NEXATIVA NEWS", msg.content)}
                    role="button"
                    aria-label="Descargar este informe como documento de Word"
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-semibold transition cursor-pointer"
                  >
                    📄 Word (.doc)
                  </button>
                  <button
                    onClick={() => exportToPdf("INFORME NORA — NEXATIVA NEWS", msg.content)}
                    role="button"
                    aria-label="Imprimir o exportar este informe a PDF"
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-semibold transition cursor-pointer"
                  >
                    🖨️ PDF
                  </button>
                </div>
              )}
              {msg.isLegalResponse && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <a 
                    href="/libro-de-quejas" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    role="button"
                    aria-label="Abrir formulario oficial de reclamos en nueva pestaña"
                    className="block w-full text-center py-2 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors border border-white/20"
                  >
                    Abrir Formulario Oficial de Reclamos
                  </a>
                </div>
              )}
              {msg.isHumanSupport && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <a 
                    href="https://wa.me/5493786414533" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    role="button"
                    aria-label="Contactar soporte humano de Nora por WhatsApp"
                    className="block w-full text-center py-2 px-3 bg-green-600/20 hover:bg-green-600/40 text-green-400 text-xs font-semibold rounded-lg transition-colors border border-green-500/30"
                  >
                    Ir a WhatsApp de Soporte
                  </a>
                </div>
              )}
              {msg.audioBase64 && (
                <div className="mt-3 pt-2 border-t border-white/10">
                  <audio controls aria-label="Audio de respuesta de Nora" src={`data:audio/mp3;base64,${msg.audioBase64}`} className="h-8 w-full outline-none [&::-webkit-media-controls-panel]:bg-white/10 [&::-webkit-media-controls-current-time-display]:text-white [&::-webkit-media-controls-time-remaining-display]:text-white" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-500 mt-1 px-1">
              {msg.role === "nora" ? "Nora" : "Tú"} • Ahora
            </span>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex flex-col items-start" role="status" aria-label="Nora está redactando una respuesta">
            <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-bl-sm flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[var(--color-brand-accent)] animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 rounded-full bg-[var(--color-brand-accent)] animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 rounded-full bg-[var(--color-brand-accent)] animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-black/50 border-t border-white/10 backdrop-blur-md relative mt-auto">
        {/* Human Escape Valve */}
        {!isFrozen && (
          <button
            type="button"
            role="button"
            aria-label="Hablar con un representante humano"
            onClick={() => {
              setIsFrozen(true);
              setMessages(prev => [...prev, {
                role: "nora",
                content: "He suspendido mi asistencia automatizada en esta sesión. Por favor, haz clic abajo para contactarte con un representante humano por WhatsApp.",
                isHumanSupport: true
              }]);
              setAccessibleLiveText("Asistencia suspendida para derivación con representante humano.");
            }}
            className="absolute -top-7 right-4 bg-slate-800 hover:bg-slate-700 text-white text-[10px] uppercase font-bold py-1.5 px-3 rounded-t-lg border border-white/10 border-b-0 transition-colors flex items-center gap-1 z-10 cursor-pointer"
          >
            <User className="w-3 h-3" /> Hablar con un humano
          </button>
        )}
        {previewUrl && (
          <div className="absolute bottom-full left-4 mb-2 relative inline-block">
            <div className="relative rounded-lg overflow-hidden border-2 border-[var(--color-brand-accent)] bg-black/80 shadow-lg">
              <img src={previewUrl} alt="Vista previa de imagen a enviar a Nora" className="h-16 w-16 object-cover" />
              <button 
                onClick={handleRemoveImage}
                role="button"
                aria-label="Quitar imagen adjunta"
                className="absolute top-1 right-1 bg-black/60 text-white p-0.5 rounded-full hover:bg-black cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSend} className="relative flex items-center">
          <button 
            type="button"
            role="button"
            aria-label="Adjuntar imagen del pizarrón o documento (JPG, PNG, WEBP)"
            onClick={() => fileInputRef.current?.click()}
            disabled={isFrozen || isTyping}
            className={`absolute left-2 p-2 rounded-full transition-colors ${isFrozen || isTyping ? "text-gray-600 cursor-not-allowed" : "text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"}`}
            title="Adjuntar imagen (JPG, PNG, WEBP)"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/png, image/jpeg, image/webp" 
            className="hidden" 
            aria-hidden="true"
          />

          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Escribe tu mensaje para Nora"
            placeholder={isFrozen ? "Sesión redirigida a canales legales oficiales." : "Escribe un mensaje..."}
            disabled={isFrozen}
            className={`w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-12 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-brand-accent)] transition-colors ${isFrozen ? "opacity-50 cursor-not-allowed" : ""}`}
          />
          <button 
            type="submit" 
            role="button"
            aria-label="Enviar mensaje a Nora"
            disabled={(!input.trim() && !attachedImage) || isTyping || isFrozen}
            className={`absolute right-2 p-2 rounded-full transition-transform ${isFrozen ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-[var(--color-brand-accent)] text-black hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"}`}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
        <div className="text-center mt-2 flex items-center justify-center gap-1 text-[9px] text-gray-400 uppercase tracking-widest font-semibold" aria-hidden="true">
          <Sparkles className="w-3 h-3 text-purple-400" /> Anfitriona & Guía Digital
        </div>
      </div>

    </div>
  );
}
