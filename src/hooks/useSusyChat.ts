"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SusyMode } from "@/lib/prompts/types";
import { SpatialAlert } from "@/hooks/useSusyVision";
import { DeviceLocationData } from "@/hooks/useSusyDeviceCapabilities";

export interface SusyAttachedFile {
  name: string;
  type: string;
  size?: number;
  base64?: string;
  previewUrl?: string;
  textContent?: string;
  mimeType?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  imageBase64?: string | null;
  file?: {
    name: string;
    type: string;
    previewUrl?: string;
  } | null;
  spatialAlerts?: SpatialAlert[];
  mode?: SusyMode;
}

export interface SusySessionHistoryItem {
  sessionId: string;
  updatedAt: string;
  lastMessageSnippet: string;
  messageCount: number;
}

export interface UseSusyChatOptions {
  sessionId?: string;
  userId?: string;
  initialMode?: SusyMode;
  agentId?: string;
}

export interface SusyChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  activeMode: SusyMode;
  error: string | null;
  currentResponseStream: string;
}

interface SupabaseMessageRecord {
  id?: string;
  _id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
  timestamp?: string;
  mode?: SusyMode;
}

interface StreamChunkPayload {
  text?: string;
  session_id?: string;
}

/**
 * useSusyChat: Hook desacoplado de orquestación conversacional para Susy Bot Municipal.
 *
 * Capacidades:
 * - Streaming progresivo (SSE y texto plano) con AbortController.
 * - Ventana de Contexto Deslizante (Sliding Window) estricta de 6 mensajes usando messagesRef atómico
 *   para prevenir Closure Stale State en ráfagas rápidas.
 * - Modo Lazarillo de latencia < 350ms (descarta historial previo para priorizar el fotograma actual).
 * - Hidratación segura en cliente (localStorage) y sincronización con Supabase (/api/susybot-sessions y /api/chat).
 */
export function useSusyChat(options: UseSusyChatOptions = {}) {
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => options.sessionId || "");
  const [currentUserId, setCurrentUserId] = useState<string>(() => options.userId || "");
  const initialMode: SusyMode = options.initialMode || "general";
  const agentId = options.agentId || "susy-ituzaingo";

  const [state, setState] = useState<SusyChatState>({
    messages: [],
    isLoading: false,
    isStreaming: false,
    activeMode: initialMode,
    error: null,
    currentResponseStream: "",
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = state.messages;
  }, [state.messages]);

  // 1. Blindaje contra Hydration Mismatch: Cargar userId, sessionId y caché de localStorage tras el montaje
  useEffect(() => {
    if (typeof window === "undefined") return;

    // A. Restaurar o generar User ID ciudadano
    let activeUid = options.userId || localStorage.getItem("susybot_user_id") || "";
    if (!activeUid) {
      activeUid =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? `vecino_${crypto.randomUUID()}`
          : `vecino_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem("susybot_user_id", activeUid);
    }
    setCurrentUserId(activeUid);

    // B. Restaurar o generar Session ID
    let activeSid = options.sessionId || localStorage.getItem("susy_session_id") || "";
    if (!activeSid) {
      activeSid =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `susy_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem("susy_session_id", activeSid);
    }
    setCurrentSessionId(activeSid);

    // C. Restaurar caché local de mensajes
    try {
      const cached = localStorage.getItem("susy_history_cache");
      if (cached) {
        const parsed = JSON.parse(cached) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validMessages = parsed as ChatMessage[];
          messagesRef.current = validMessages;
          setState((prev) => ({
            ...prev,
            messages: validMessages,
          }));
        }
      }
    } catch (e: unknown) {
      console.warn("[useSusyChat] Error leyendo susy_history_cache:", e);
    }
  }, [options.sessionId, options.userId]);

  // Sincronizar siempre los mensajes con localStorage para resiliencia offline en la PWA
  useEffect(() => {
    if (typeof window !== "undefined" && state.messages.length > 0) {
      try {
        localStorage.setItem("susy_history_cache", JSON.stringify(state.messages));
      } catch (e: unknown) {
        console.warn("[useSusyChat] Error guardando susy_history_cache:", e);
      }
    }
  }, [state.messages]);

  // Cargar historial desde Supabase (/api/susybot-sessions) cuando cambia currentSessionId
  const loadMemoryForSession = useCallback(async (sid: string): Promise<void> => {
    if (!sid) return;
    try {
      const res = await fetch(`/api/susybot-sessions?session_id=${encodeURIComponent(sid)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { messages?: SupabaseMessageRecord[] };
      if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        const loaded: ChatMessage[] = data.messages.map((m, idx) => ({
          id: m.id || m._id || `mem-${idx}-${Date.now()}`,
          role: m.role,
          content: m.content,
          timestamp: m.created_at || m.timestamp || new Date().toISOString(),
          mode: m.mode || "general",
        }));
        messagesRef.current = loaded;
        setState((prev) => ({ ...prev, messages: loaded, currentResponseStream: "" }));
        if (typeof window !== "undefined") {
          localStorage.setItem("susy_history_cache", JSON.stringify(loaded));
        }
      }
    } catch (err: unknown) {
      console.warn("[useSusyChat] No se pudo cargar memoria remota:", err);
    }
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      loadMemoryForSession(currentSessionId).catch(() => {});
    }
  }, [currentSessionId, loadMemoryForSession]);

  // Cambiar modo cognitivo activo
  const setMode = useCallback((newMode: SusyMode): void => {
    setState((prev) => ({ ...prev, activeMode: newMode }));
  }, []);

  // Enviar mensaje con soporte multimodal, telemetría óptica de Cámara Titán y archivos adjuntos
  const sendMessage = useCallback(
    async (params: {
      text: string;
      userName?: string;
      imageBase64?: string | null;
      visualTelemetry?: string | null;
      deviceLocation?: DeviceLocationData | null;
      attachedFile?: SusyAttachedFile | null;
    }): Promise<string | null> => {
      const {
        text,
        userName = "Vecino",
        imageBase64 = null,
        visualTelemetry = null,
        deviceLocation = null,
        attachedFile = null,
      } = params;

      if (!text.trim() && !imageBase64 && !attachedFile) return null;

      const userMsgId = `usr-${Date.now()}`;
      const userMessage: ChatMessage = {
        id: userMsgId,
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
        imageBase64: imageBase64 || attachedFile?.base64 || null,
        file: attachedFile
          ? {
              name: attachedFile.name,
              type: attachedFile.type,
              previewUrl: attachedFile.previewUrl,
            }
          : null,
        mode: state.activeMode,
      };

      // Actualización atómica inmediata de messagesRef (Parche QA contra Closure Stale State)
      messagesRef.current = [...messagesRef.current, userMessage];
      setState((prev) => ({
        ...prev,
        messages: messagesRef.current,
        isLoading: true,
        isStreaming: true,
        currentResponseStream: "",
        error: null,
      }));

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const isLazarillo = state.activeMode === "lazarillo" || state.activeMode === "no_videntes";

        // VENTANA DE CONTEXTO DESLIZANTE (SLIDING WINDOW):
        // En modo lazarillo descartamos el historial previo para priorizar el fotograma actual (< 350ms).
        // En otros modos mantenemos estrictamente los últimos 6 mensajes.
        const slidingWindowHistory = isLazarillo
          ? []
          : messagesRef.current.slice(-7, -1).map((m) => ({
              role: m.role,
              content: m.content,
            }));

        const effectiveUserText = visualTelemetry
          ? `[TELEMETRÍA ÓPTICA CÁMARA TITÁN: ${visualTelemetry}]\n${text}`
          : text;

        const filePayload = attachedFile
          ? {
              name: attachedFile.name,
              type: attachedFile.type,
              mimeType: attachedFile.mimeType || attachedFile.type,
              base64: attachedFile.base64,
              textContent: attachedFile.textContent,
            }
          : imageBase64
          ? {
              name: "captura_titan.jpg",
              type: "image/jpeg",
              mimeType: "image/jpeg",
              base64: imageBase64,
            }
          : null;

        const payload = {
          user_id: currentUserId || "vecino_web",
          session_id: currentSessionId || undefined,
          sessionId: currentSessionId || undefined,
          message_id: userMsgId,
          message: effectiveUserText,
          userText: effectiveUserText,
          userName,
          imageBase64,
          visualTelemetry,
          mode: state.activeMode,
          interactionMode: isLazarillo ? "voice" : "visual",
          deviceLocation,
          clientDateTime: new Date().toLocaleString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires",
          }),
          history: slidingWindowHistory,
          file: filePayload,
          stream: true,
          contextData: {
            mode: state.activeMode,
            agentId,
            userName,
            visualTelemetry,
            deviceLocation,
          },
        };

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Error en el motor de inferencia: HTTP ${response.status}`);
        }

        let fullAssistantText = "";
        const contentType = response.headers.get("content-type") || "";

        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let sseBuffer = "";

          while (true) {
            const { value, done: doneReading } = await reader.read();
            if (doneReading) break;

            if (value) {
              const chunk = decoder.decode(value, { stream: true });

              if (contentType.includes("text/event-stream") || chunk.includes("data: ")) {
                sseBuffer += chunk;
                const lines = sseBuffer.split("\n");
                sseBuffer = lines.pop() || "";

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed || trimmed.startsWith(":")) continue;
                  if (trimmed.startsWith("data: ")) {
                    const dataStr = trimmed.slice(6).trim();
                    if (dataStr === "[DONE]") continue;
                    try {
                      const parsed = JSON.parse(dataStr) as StreamChunkPayload;
                      if (parsed.session_id && parsed.session_id !== currentSessionId) {
                        setCurrentSessionId(parsed.session_id);
                        if (typeof window !== "undefined") {
                          localStorage.setItem("susy_session_id", parsed.session_id);
                        }
                      }
                      if (parsed.text) {
                        fullAssistantText += parsed.text;
                        setState((prev) => ({
                          ...prev,
                          currentResponseStream: fullAssistantText,
                        }));
                      }
                    } catch {
                      // Si no es JSON válido pero viene texto directo
                    }
                  }
                }
              } else {
                fullAssistantText += chunk;
                setState((prev) => ({
                  ...prev,
                  currentResponseStream: fullAssistantText,
                }));
              }
            }
          }
        } else {
          const data = (await response.json()) as { text?: string; response?: string };
          fullAssistantText = data.text || data.response || "";
        }

        const cleanAssistantText = fullAssistantText
          .replace(/^Thinking:?\s*/i, "")
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
          .trim();

        const assistantMsgId = `asst-${Date.now()}`;
        const assistantMessage: ChatMessage = {
          id: assistantMsgId,
          role: "assistant",
          content: cleanAssistantText,
          timestamp: new Date().toISOString(),
          mode: state.activeMode,
        };

        messagesRef.current = [...messagesRef.current, assistantMessage];
        setState((prev) => ({
          ...prev,
          messages: messagesRef.current,
          isLoading: false,
          isStreaming: false,
          currentResponseStream: "",
        }));

        return cleanAssistantText;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }
        console.error("[useSusyChat] Error en streaming/inferencia:", err);
        const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isStreaming: false,
          error: isOffline
            ? "Sin conexión a internet. Los módulos locales y teléfonos de emergencia continúan activos."
            : "Ocurrió una interrupción momentánea con el motor municipal de inferencia.",
        }));
        return null;
      }
    },
    [currentSessionId, currentUserId, agentId, state.activeMode]
  );

  // Guardar sesión activa en el caché local de sesiones
  const archiveCurrentSessionToLocalCache = useCallback((): void => {
    const currentMessages = messagesRef.current;
    const usefulMessages = currentMessages.filter((m) => m.content && m.content.trim().length > 0);

    if (usefulMessages.length > 0 && typeof window !== "undefined" && currentSessionId) {
      try {
        const firstUserMsg = usefulMessages.find((m) => m.role === "user");
        const snippet = firstUserMsg
          ? firstUserMsg.content.slice(0, 48)
          : usefulMessages[0].content.slice(0, 48);

        const newSessionItem: SusySessionHistoryItem = {
          sessionId: currentSessionId,
          updatedAt: new Date().toISOString(),
          lastMessageSnippet: snippet,
          messageCount: usefulMessages.length,
        };

        const existingRaw = localStorage.getItem("susy_sessions_cache");
        let sessionList: SusySessionHistoryItem[] = [];
        if (existingRaw) {
          try {
            const parsed = JSON.parse(existingRaw) as unknown;
            if (Array.isArray(parsed)) {
              sessionList = parsed as SusySessionHistoryItem[];
            }
          } catch {}
        }

        sessionList = [
          newSessionItem,
          ...sessionList.filter((s) => s.sessionId !== currentSessionId),
        ];
        localStorage.setItem("susy_sessions_cache", JSON.stringify(sessionList));
        window.dispatchEvent(new Event("susy_sessions_updated"));
      } catch (err: unknown) {
        console.warn("[useSusyChat] Error al auto-guardar sesión previa:", err);
      }
    }
  }, [currentSessionId]);

  // Iniciar una nueva conversación limpia
  const startNewChat = useCallback((): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    archiveCurrentSessionToLocalCache();

    const newSid =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `susy_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (typeof window !== "undefined") {
      localStorage.setItem("susy_session_id", newSid);
      localStorage.removeItem("susy_history_cache");
    }

    messagesRef.current = [];
    setCurrentSessionId(newSid);
    setState((prev) => ({
      ...prev,
      messages: [],
      currentResponseStream: "",
      error: null,
      isLoading: false,
      isStreaming: false,
    }));
  }, [archiveCurrentSessionToLocalCache]);

  // Cargar una sesión histórica específica
  const loadSession = useCallback(
    async (targetSessionId: string): Promise<void> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("susy_session_id", targetSessionId);
      }
      setCurrentSessionId(targetSessionId);
      setState((prev) => ({
        ...prev,
        messages: [],
        currentResponseStream: "",
        error: null,
        isLoading: true,
        isStreaming: false,
      }));

      try {
        const res = await fetch(
          `/api/susybot-sessions?session_id=${encodeURIComponent(targetSessionId)}`
        );
        if (res.ok) {
          const data = (await res.json()) as { messages?: SupabaseMessageRecord[] };
          if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
            const loaded: ChatMessage[] = data.messages.map((m, idx) => ({
              id: m.id || m._id || `mem-${idx}-${Date.now()}`,
              role: m.role,
              content: m.content,
              timestamp: m.created_at || m.timestamp || new Date().toISOString(),
              mode: m.mode || "general",
            }));
            messagesRef.current = loaded;
            setState((prev) => ({
              ...prev,
              messages: loaded,
              currentResponseStream: "",
              isLoading: false,
            }));
            if (typeof window !== "undefined") {
              localStorage.setItem("susy_history_cache", JSON.stringify(loaded));
            }
            return;
          }
        }
      } catch (err: unknown) {
        console.warn("[useSusyChat] Error cargando sesión de Supabase:", err);
      }

      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("susy_history_cache");
          if (raw) {
            const parsed = JSON.parse(raw) as unknown;
            if (Array.isArray(parsed) && parsed.length > 0) {
              const valid = parsed as ChatMessage[];
              messagesRef.current = valid;
              setState((prev) => ({
                ...prev,
                messages: valid,
                isLoading: false,
              }));
              return;
            }
          }
        } catch (e: unknown) {
          console.warn("[useSusyChat] Error leyendo fallback local:", e);
        }
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    },
    []
  );

  const switchSession = useCallback(
    (targetSessionId: string): void => {
      loadSession(targetSessionId).catch(() => {});
    },
    [loadSession]
  );

  // Interrumpir inmediatamente el flujo de streaming del LLM (Hotfix Barge-in VAD)
  const stopStreaming = useCallback((): void => {
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {
        // Ignorar
      }
      abortControllerRef.current = null;
    }
    setState((prev) =>
      prev.isLoading || prev.isStreaming
        ? {
            ...prev,
            isLoading: false,
            isStreaming: false,
          }
        : prev
    );
  }, []);

  const clearChat = useCallback((): void => {
    startNewChat();
  }, [startNewChat]);

  return {
    ...state,
    sessionId: currentSessionId,
    userId: currentUserId,
    setMode,
    sendMessage,
    stopStreaming,
    clearChat,
    startNewChat,
    switchSession,
    loadSession,
  };
}

export { useSusyChat as useNoraChat };
