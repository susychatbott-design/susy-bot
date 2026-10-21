"use client";

import React, { useState } from "react";
import { X, QrCode, Copy, Check, Share2, ExternalLink } from "lucide-react";

export interface SusyShareQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

/**
 * SusyShareQRModal: Modal de Código QR y compartición ciudadana por WhatsApp / Enlace Directo.
 */
export function SusyShareQRModal({ isOpen, onClose, sessionId }: SusyShareQRModalProps) {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const appUrl =
    typeof window !== "undefined" ? window.location.origin : "https://susy-bot.vercel.app";
  const shareUrl = sessionId ? `${appUrl}?session=${encodeURIComponent(sessionId)}` : appUrl;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    shareUrl
  )}`;

  const handleCopy = (): void => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleWhatsAppShare = (): void => {
    const text = `🏛️ *Susy Bot — Concierge Municipal e IA Cívica de Ituzaingó, Corrientes*\nConsultá trámites, licencias, farmacias de turno, turismo y reclamos 24/7:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Compartir Susy Bot o escanear Código QR"
    >
      <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <QrCode size={17} className="text-indigo-400" />
            <span>Tótem QR & Acceso Vecinal Móvil</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Cerrar ventana de compartir"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-white rounded-2xl shadow-lg">
            <img
              src={qrImageUrl}
              alt="Código QR de Susy Bot Municipal"
              className="w-48 h-48 object-contain"
            />
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Escaneá este código QR con la cámara de tu celular para continuar tu gestión municipal o
            compartir <strong>Susy Bot Ituzaingó</strong> con otro vecino.
          </p>

          <div className="w-full flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 cursor-pointer"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              <span>{copied ? "Enlace copiado" : "Copiar enlace"}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              <Share2 size={15} />
              <span>Enviar por WhatsApp</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SusyShareQRModal;
