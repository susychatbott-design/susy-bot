"use client";

import React, { useEffect, useState } from "react";
import { X, Plus, MessageSquare, Clock, ShieldCheck } from "lucide-react";

export interface SusySessionSummary {
  id: string;
  title: string;
  updated_at: string;
}

export interface SusyHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionId: string;
  userId: string;
  onSelectSession: (sessionId: string) => void;
  onStartNewChat: () => void;
}

interface SessionsApiResponse {
  sessions?: Array<{
    id: string;
    title?: string;
    updated_at?: string;
    created_at?: string;
  }>;
}

/**
 * SusyHistoryDrawer: Panel lateral deslizable con el historial de sesiones ciudadanas
 * sincronizado con Supabase (/api/susybot-sessions).
 */
export function SusyHistoryDrawer({
  isOpen,
  onClose,
  currentSessionId,
  userId,
  onSelectSession,
  onStartNewChat,
}: SusyHistoryDrawerProps) {
  const [sessions, setSessions] = useState<SusySessionSummary[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    let cancelled = false;
    setIsLoadingSessions(true);

    fetch(`/api/susybot-sessions?userId=${encodeURIComponent(userId)}`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as SessionsApiResponse;
        if (!cancelled && Array.isArray(data.sessions)) {
          setSessions(
            data.sessions.map((s) => ({
              id: s.id,
              title: s.title || "Consulta Ciudadana",
              updated_at: s.updated_at || s.created_at || new Date().toISOString(),
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoadingSessions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label="Historial de sesiones ciudadanas"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="relative z-10 w-80 max-w-[85vw] bg-slate-900 border-r border-white/10 h-full flex flex-col shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-wide">
              HISTORIAL VECINAL
            </h2>
            <p className="text-[11px] text-slate-400">
              Municipalidad de Ituzaingó
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[38px] min-h-[38px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
            aria-label="Cerrar historial"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-3 border-b border-white/10">
          <button
            type="button"
            onClick={() => {
              onStartNewChat();
              onClose();
            }}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Nueva Consulta Municipal</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {isLoadingSessions ? (
            <div className="text-xs text-slate-400 text-center py-6">
              Sincronizando sesiones...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-6">
              Tu sesión actual está activa y protegida.
            </div>
          ) : (
            sessions.map((session) => {
              const isCurrent = session.id === currentSessionId;
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                    isCurrent
                      ? "bg-indigo-600/20 border-indigo-500/40 text-white"
                      : "bg-slate-800/50 border-white/5 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <MessageSquare size={15} className="mt-0.5 shrink-0 text-indigo-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate">{session.title}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      <span>
                        {new Date(session.updated_at).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-white/10 bg-slate-950/60 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
          <span>Datos protegidos • Soberanía Municipal Ituzaingó</span>
        </div>
      </aside>
    </div>
  );
}

export default SusyHistoryDrawer;
