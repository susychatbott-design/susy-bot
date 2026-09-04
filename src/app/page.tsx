"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  Plus, 
  Trash2, 
  Menu, 
  X, 
  Copy, 
  Check, 
  Bot, 
  User, 
  Mic, 
  MicOff, 
  Zap, 
  Code, 
  FileText, 
  TrendingUp, 
  ShieldCheck,
  Paperclip,
  Camera,
  Image as ImageIcon,
  FileSpreadsheet,
  XCircle,
  FileCheck2,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Download,
  Smartphone,
  Share2,
  QrCode,
  GraduationCap,
  BookOpen,
  Puzzle,
  MessageCircle,
  ExternalLink,
  Printer,
  Laptop,
  RefreshCw,
  Sliders,
  Eye,
  Video,
  FlipHorizontal,
  Radio,
  Presentation,
  PhoneCall,
  Siren,
  Phone
} from "lucide-react";
import jsQR from "jsqr";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { exportNoraCleanWord, exportNoraCleanPdf, exportNoraCleanPptx } from "@/lib/exportUtils";
import { FunctionPlotter } from "@/components/Susy/FunctionPlotter";
import SusyRealtimeCallModal from "@/components/Susy/SusyRealtimeCallModal";
import { useSusyWakeWord } from "@/hooks/useSusyWakeWord";
import { useSusyHardware } from "@/hooks/useSusyHardware";
import { executeLocalInference } from "@/lib/susy/webgpu/localEngine";
import { syncOnlineDeltasIfAvailable } from "@/lib/susy/offline/knowledgeCache";
import SusyConnectionBadge from "@/components/Susy/SusyConnectionBadge";

interface AttachedFile {
  name: string;
  type: string;
  size: number;
  base64?: string;
  previewUrl?: string;
  textContent?: string;
}

interface Message {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  file?: {
    name: string;
    type: string;
    previewUrl?: string;
  };
  created_at?: string;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function SusybotApp() {
  const hardware = useSusyHardware("visual");
  const [userId, setUserId] = useState<string>("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Estados de Grabación de Audio Directa (MediaRecorder)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const secondsRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Estados de Notificaciones Push
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Estados de Voz Femenina Neutra (TTS)
  const [autoVoice, setAutoVoice] = useState(false);
  const [playingMsgIndex, setPlayingMsgIndex] = useState<number | null>(null);

  // Estados de Instalación PWA Nativa
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Estados de Compartir / Viralización WhatsApp y QR
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Estados de Sincronización Multi-Dispositivo (PC / Celular / Tablet)
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncInputId, setSyncInputId] = useState("");
  const [syncSuccessMsg, setSyncSuccessMsg] = useState("");
  const [syncTokenId, setSyncTokenId] = useState<string | null>(null);
  const [syncPinCode, setSyncPinCode] = useState<string>("");
  const [syncQrUrl, setSyncQrUrl] = useState<string>("");
  const [isGeneratingSyncQr, setIsGeneratingSyncQr] = useState(false);
  const [showAuthorizeMobileModal, setShowAuthorizeMobileModal] = useState(false);
  const [pendingAuthToken, setPendingAuthToken] = useState<string | null>(null);
  const [isAuthorizingSync, setIsAuthorizingSync] = useState(false);
  const syncPollTimerRef = useRef<any>(null);

  // Voces Disponibles y Selección de Voz Neuronal
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>("");
  const [voicePitch, setVoicePitch] = useState<number>(0.92);
  const [voiceRate, setVoiceRate] = useState<number>(0.94);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Estados de Susybot Live Vision y Realtime Voice Call
  const [showRealtimeCallModal, setShowRealtimeCallModal] = useState(false);
  const [showLiveVisionModal, setShowLiveVisionModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [liveFacingMode, setLiveFacingMode] = useState<"user" | "environment">("environment");
  const [liveSubtitles, setLiveSubtitles] = useState<string>("Iniciando visión en vivo...");
  const [isAnalyzingFrame, setIsAnalyzingFrame] = useState(false);
  const [liveCustomPrompt, setLiveCustomPrompt] = useState<string>("");
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const liveMediaStreamRef = useRef<MediaStream | null>(null);
  const liveIntervalRef = useRef<any>(null);
  
  // Estado de Modo Adaptativo (General, Inclusión TEA, Docente, Cátedra)
  const [activeMode, setActiveMode] = useState<string>("general");
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(false);

  // 🎙️ Escucha Activa de Activación por Voz (Solo si el usuario lo activa explícitamente)
  const { isListening: isWakeWordActive } = useSusyWakeWord({
    enabled: wakeWordEnabled && !showRealtimeCallModal,
    onWakeWordDetected: (phrase) => {
      console.log("[WakeWord] Susybot llamada por voz:", phrase);
      setShowRealtimeCallModal(true);
    }
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const lastLiveAnalysisRef = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);

  // 1. Inicializar UUID de usuario, Sincronización Multi-dispositivo, Voz y PWA Prompt
  useEffect(() => {
    let storedUserId = "";

    // Detección de sincronización instantánea por parámetro URL (?sync_user=... o ?sync_token=...)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const syncToken = urlParams.get("sync_token");
      const syncUser = urlParams.get("sync_user");

      if (syncToken && syncToken.trim()) {
        const currentUid = localStorage.getItem("susybot_user_id") || storedUserId || ("user_" + Math.random().toString(36).substring(2, 12));
        fetch("/api/sync", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token_id: syncToken.trim(), user_id: currentUid })
        }).then(async (res) => {
          if (res.ok) {
            setSyncSuccessMsg("🎉 ¡Computadora Vinculada con Éxito! Ya puedes ver todos tus chats en tu PC.");
            setTimeout(() => setSyncSuccessMsg(""), 6000);
          }
        }).catch(() => {});
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (syncUser && syncUser.trim()) {
        storedUserId = syncUser.trim();
        localStorage.setItem("susybot_user_id", storedUserId);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      if (!storedUserId) {
        storedUserId = localStorage.getItem("susybot_user_id") || "";
      }

      // Detección de Modos Accesibles Inmediatos (Lazarillo Visual Titán o Llamada Directa)
      const isLazarilloMode = urlParams.get("lazarillo") === "1" || urlParams.get("ciego") === "1";
      const isCallMode = urlParams.get("call") === "1";

      if (isLazarilloMode) {
        setActiveMode("inclusion");
        setShowLiveVisionModal(true);
        setTimeout(() => {
          startLiveVision("environment");
          speakText("Hola, soy Susybot, tu asistente municipal y lazarillo, tu lazarillo visual. He activado la Cámara Titán. Apunta tu teléfono hacia el frente para guiarte en tu camino.", -99);
        }, 1000);
      } else if (isCallMode) {
        setShowRealtimeCallModal(true);
      }
    }

    if (!storedUserId) {
      storedUserId = "user_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now();
      localStorage.setItem("susybot_user_id", storedUserId);
    }

    setUserId(storedUserId);
    fetchSessions(storedUserId);

    // Precargar voces del sistema operativo
    const loadSystemVoices = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const vList = window.speechSynthesis.getVoices();
        const spanishVoices = vList.filter(v => v.lang.startsWith("es") || v.lang.includes("es-"));
        const finalVoices = spanishVoices.length > 0 ? spanishVoices : vList;
        setAvailableVoices(finalVoices);

        const savedVoiceUri = localStorage.getItem("susybot_voice_uri");
        if (savedVoiceUri) {
          setSelectedVoiceUri(savedVoiceUri);
        } else {
          const defaultNeural = finalVoices.find(v => 
            v.name.toLowerCase().includes("sabina") || 
            v.name.toLowerCase().includes("dalia") || 
            v.name.toLowerCase().includes("natural") ||
            v.name.toLowerCase().includes("google español")
          );
          if (defaultNeural) setSelectedVoiceUri(defaultNeural.voiceURI);
        }
      }
    };

    loadSystemVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadSystemVoices;
    }

    // Recuperar preferencias de voz
    const savedVoice = localStorage.getItem("susybot_auto_voice");
    if (savedVoice === "true") setAutoVoice(true);

    const savedPitch = localStorage.getItem("susybot_voice_pitch");
    if (savedPitch) setVoicePitch(parseFloat(savedPitch));

    const savedRate = localStorage.getItem("susybot_voice_rate");
    if (savedRate) setVoiceRate(parseFloat(savedRate));

    // Verificar permisos de notificaciones
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }

    // Detectar iOS y modo Standalone
    const userAgent = typeof window !== "undefined" ? window.navigator.userAgent.toLowerCase() : "";
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleMobile);

    const isStandalone = typeof window !== "undefined" && (
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true
    );

    // Registrar Service Worker de Susybot para instalación nativa PWA en Chrome/Android
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/susybot-sw.js", { scope: "/susybot" })
        .then((reg) => console.log("Susybot Service Worker activo:", reg.scope))
        .catch((err) => console.warn("Susybot SW aviso:", err));
      
      // Sincronizar cápsulas delta offline en segundo plano
      syncOnlineDeltasIfAvailable();
    }

    // Capturar evento de instalación nativa PWA (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      const dismissed = sessionStorage.getItem("susybot_install_dismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Mostrar banner de instalación directo en móviles si no está instalada aún
    const dismissed = typeof window !== "undefined" ? sessionStorage.getItem("susybot_install_dismissed") : null;
    let installTimer: any = null;
    if (!isStandalone && !dismissed) {
      installTimer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 1200);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (installTimer) clearTimeout(installTimer);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 2. Cargar sesiones del usuario
  const fetchSessions = async (uid: string) => {
    try {
      const res = await fetch(`/api/susybot-sessions?user_id=${encodeURIComponent(uid)}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Error cargando sesiones:", err);
    }
  };

  // 3. Cargar mensajes al cambiar de sesión
  const selectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setSidebarOpen(false);
    setIsLoading(true);
    stopSpeaking();
    try {
      const res = await fetch(`/api/susybot-sessions?session_id=${encodeURIComponent(sessionId)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Error cargando mensajes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Crear nuevo chat
  const handleNewChat = () => {
    stopSpeaking();
    setCurrentSessionId(null);
    setMessages([]);
    setInputMessage("");
    setAttachedFile(null);
    setSidebarOpen(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  // 5. Eliminar sesión
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Deseas eliminar esta conversación?")) return;

    try {
      const res = await fetch(`/api/susybot-sessions?session_id=${encodeURIComponent(sessionId)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Error eliminando sesión:", err);
    }
  };

  // 6. Auto-scroll al fondo
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    chatEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 7. Instalación Nativa PWA
  const handleInstallApp = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setShowInstallBanner(false);
      }
      setDeferredInstallPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      alert("Para instalar Susybot, abre el menú de tu navegador y selecciona 'Instalar aplicación' o 'Agregar a la pantalla principal'.");
    }
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("susybot_install_dismissed", "true");
  };

  // 7.1. Generar Código QR Efímero de Sincronización (PC ↔ Celular)
  const handleOpenSyncModal = async () => {
    // Apagar explícitamente cualquier stream de cámara previo activo
    stopLiveVision();
    setShowSyncModal(true);
    setSyncSuccessMsg("");

    const isMobileDevice = typeof window !== 'undefined' && (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768);

    if (isMobileDevice) {
      setIsGeneratingSyncQr(false);
      setSyncInputId("");
      return;
    }

    setIsGeneratingSyncQr(true);
    if (syncPollTimerRef.current) clearInterval(syncPollTimerRef.current);

    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desktop_socket_id: `desktop_${userId}` })
      });

      if (res.ok) {
        const data = await res.json();
        setSyncTokenId(data.token_id);
        setSyncPinCode(data.pin_code || "");
        const municipalBase = typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://susy-bot.vercel.app";
      const targetUrl = data.sync_url || `${municipalBase}?sync_token=${data.token_id}`;
        setSyncQrUrl(targetUrl);

        // Iniciar Sondeo / Polling cada 2.5 segundos para detectar autorización del celular
        syncPollTimerRef.current = setInterval(async () => {
          try {
            const checkRes = await fetch(`/api/sync?token_id=${encodeURIComponent(data.token_id)}`);
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData.status === "AUTHORIZED" && checkData.user_id) {
                clearInterval(syncPollTimerRef.current);
                localStorage.setItem("susybot_user_id", checkData.user_id);
                setUserId(checkData.user_id);
                fetchSessions(checkData.user_id);
                if (checkData.session_id) {
                  selectSession(checkData.session_id);
                }
                setSyncSuccessMsg("🎉 ¡Celular emparejado con éxito! Tus conversaciones se han transferido.");
                setTimeout(() => {
                  setShowSyncModal(false);
                  setSyncSuccessMsg("");
                }, 2000);
              } else if (checkData.status === "EXPIRED") {
                clearInterval(syncPollTimerRef.current);
                setSyncSuccessMsg("⚠️ El código QR expiró. Vuelve a abrir la ventana para generar uno nuevo.");
              }
            }
          } catch (e) {}
        }, 2500);
      }
    } catch (err) {
      console.warn("Error generando token QR:", err);
    } finally {
      setIsGeneratingSyncQr(false);
    }
  };

  const handleCloseSyncModal = () => {
    if (syncPollTimerRef.current) clearInterval(syncPollTimerRef.current);
    setShowSyncModal(false);
    setSyncTokenId(null);
    setSyncQrUrl("");
    setSyncSuccessMsg("");
  };

  // 7.2. Autorizar Sincronización desde el Teléfono Móvil
  const handleAuthorizeFromMobile = async () => {
    if (!pendingAuthToken) return;
    setIsAuthorizingSync(true);

    try {
      const res = await fetch("/api/sync", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token_id: pendingAuthToken,
          user_id: userId,
          session_id: currentSessionId
        })
      });

      if (res.ok) {
        alert("¡Excelente! Tu computadora ha sido autorizada y ya tiene acceso a tus conversaciones.");
        setShowAuthorizeMobileModal(false);
        setPendingAuthToken(null);
      } else {
        const err = await res.json();
        alert(err.error || "El código QR ha expirado o no es válido.");
        setShowAuthorizeMobileModal(false);
      }
    } catch (e) {
      alert("Error de conexión al autorizar la sincronización.");
    } finally {
      setIsAuthorizingSync(false);
    }
  };

  // 8. Sintetizador de Voz Femenina Neuronal de Susybot (Kokoro-82M + Web Speech Fallback)
  const speakText = async (text: string, msgIndex: number) => {
    // Si ya está sonando este mensaje, detenerlo
    if (playingMsgIndex === msgIndex) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    // Limpiar Markdown, tablas, plecas, URLs, emojis y corregir fonética para habla humana y natural
    const cleanText = text
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[(.*?)\]\([^\s)]+\)/g, '$1')
      .replace(/```[\s\S]*?```/g, " Bloque de código. ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\|+/g, ' ')
      .replace(/^[-\s:|+]{3,}$/gm, ' ')
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
      .replace(/#{1,6}\s+/g, '')
      .replace(/[*_~`]/g, '')
      .replace(/[-*]\s+/g, '')
      .replace(/(\d+)\s*°\s*C/gi, "$1 grados centígrados")
      .replace(/(\d+)\s*°/g, "$1 grados")
      .replace(/km\/h/gi, " kilómetros por hora")
      .replace(/%/g, " por ciento")
      .replace(/mm\b/gi, " milímetros")
      .replace(/\$\s*(\d+)/g, "$1 pesos")
      .replace(/\bCUIT\b/gi, " cuit ")
      .replace(/\bIVA\b/gi, " iva ")
      .replace(/\bRAE\b/gi, " rae ")
      .replace(/\bTEA\b/gi, " tea ")
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;
    setPlayingMsgIndex(msgIndex);

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setPlayingMsgIndex(null);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const rawSentences = cleanText.match(/[^.!?;\n]+[.!?;\n]*/g) || [cleanText];
      const sentenceQueue = rawSentences.map((s) => s.trim()).filter((s) => s.length > 0);

      const voices = window.speechSynthesis.getVoices();
      let voiceToUse: SpeechSynthesisVoice | undefined = undefined;

      if (selectedVoiceUri) {
        voiceToUse = voices.find((v) => v.voiceURI === selectedVoiceUri);
      }

      if (!voiceToUse) {
        voiceToUse =
          voices.find(
            (v) =>
              (v.lang.startsWith("es-AR") || v.lang.startsWith("es-419") || v.lang.startsWith("es-US") || v.lang.startsWith("es")) &&
              (
                v.name.toLowerCase().includes("natural") ||
                v.name.toLowerCase().includes("paulina") ||
                v.name.toLowerCase().includes("elena") ||
                v.name.toLowerCase().includes("sabina") ||
                v.name.toLowerCase().includes("monica") ||
                v.name.toLowerCase().includes("dalia") ||
                v.name.toLowerCase().includes("female") ||
                v.name.toLowerCase().includes("mujer")
              )
          ) ||
          voices.find((v) => v.lang.startsWith("es-AR") || v.lang.startsWith("es-419")) ||
          voices.find((v) => v.lang.startsWith("es"));
      }

      const playNextChunk = () => {
        if (sentenceQueue.length === 0) {
          setPlayingMsgIndex(null);
          return;
        }

        const nextChunk = sentenceQueue.shift()!;
        if (!nextChunk.trim()) {
          playNextChunk();
          return;
        }

        window.speechSynthesis.resume();
        const utterance = new SpeechSynthesisUtterance(nextChunk.trim());
        utterance.rate = voiceRate || 0.98;
        utterance.pitch = voicePitch || 1.0;

        if (voiceToUse) {
          utterance.voice = voiceToUse;
          utterance.lang = voiceToUse.lang || "es-AR";
        } else {
          utterance.lang = "es-AR";
        }

        utterance.onend = () => playNextChunk();
        utterance.onerror = () => playNextChunk();

        // Evitar el corte por Garbage Collection de Chrome
        (window as any).__susyPageActiveUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      };

      playNextChunk();
    } catch (e) {
      console.warn("[Speak Error]:", e);
      setPlayingMsgIndex(null);
    }
  };

  const handleTestVoice = () => {
    stopSpeaking();
    speakText("Hola, soy Susybot, tu mentora y asistente de inteligencia artificial. He calibrado mi dicción para brindarte un trato humano, fluido y cercano.", -99);
  };

  const stopSpeaking = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingMsgIndex(null);
  };

  // 9. Motor de Visión y Audio en Vivo de Susybot (Cámara en Tiempo Real con LLaMA 3.2 Vision)
  const startLiveVision = async (facingMode: "user" | "environment" = liveFacingMode) => {
    stopSpeaking();
    setIsLiveStreaming(true);
    setLiveSubtitles("Iniciando Cámara Ciudadana de Ituzaingó...");
    hardware.acquireWakeLock();

    try {
      const stream = await hardware.acquireCamera(facingMode);
      if (!stream) {
        setLiveSubtitles("⚠️ No se pudo acceder a la cámara o el permiso fue denegado.");
        setIsLiveStreaming(false);
        hardware.releaseWakeLock();
        return;
      }

      liveMediaStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play();
      }

      setLiveSubtitles("👁️ Cámara activa. Enfocá tu trámite o reclamo y Susy te asiste paso a paso.");

      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);

      // Escáner continuo de códigos QR y emparejamiento con PC sin salir de la app
      let isProcessingQr = false;
      const qrScannerInterval = setInterval(async () => {
        if (isProcessingQr) return;
        try {
          if (!liveVideoRef.current || liveVideoRef.current.videoWidth === 0) return;
          const video = liveVideoRef.current;

          let detectedRaw: string | null = null;

          // 1. Intentar con BarcodeDetector nativo por hardware si está disponible en el navegador
          if (typeof window !== "undefined" && "BarcodeDetector" in window) {
            try {
              const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
              const barcodes = await detector.detect(video);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                detectedRaw = barcodes[0].rawValue.trim();
              }
            } catch (e) {}
          }

          // 2. Fallback a jsQR con canvas de alta definición
          if (!detectedRaw) {
            const canvas = liveCanvasRef.current || document.createElement("canvas");
            canvas.width = Math.min(video.videoWidth, 800);
            canvas.height = Math.min(video.videoHeight, 600);
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imgData.data, imgData.width, imgData.height, {
                inversionAttempts: "attemptBoth"
              });
              if (code && code.data) {
                detectedRaw = code.data.trim();
              }
            }
          }

          if (detectedRaw) {
            let targetToken: string | null = null;
            let targetPin: string | null = null;

            if (detectedRaw.includes("sync_token=")) {
              const match = detectedRaw.match(/sync_token=([^&]+)/);
              if (match) targetToken = match[1];
            } else if (detectedRaw.includes("sync_auth=")) {
              const match = detectedRaw.match(/sync_auth=([^&]+)/);
              if (match) targetToken = match[1];
            } else if (detectedRaw.startsWith("sync_") || (detectedRaw.length === 36 && detectedRaw.includes("-"))) {
              targetToken = detectedRaw;
            } else if (/^\d{6}$/.test(detectedRaw)) {
              targetPin = detectedRaw;
            } else if (detectedRaw.includes("susybot") && detectedRaw.includes("token")) {
              try {
                const parsedUrl = new URL(detectedRaw);
                targetToken = parsedUrl.searchParams.get("sync_token") || parsedUrl.searchParams.get("token");
              } catch (e) {}
            }

            if (targetToken || targetPin) {
              isProcessingQr = true;
              clearInterval(qrScannerInterval);
              
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
              }

              setLiveSubtitles("⚡ ¡Código QR de PC detectado! Vinculando tus conversaciones...");
              
              const currentUid = localStorage.getItem("susybot_user_id") || userId;
              fetch("/api/sync", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token_id: targetToken,
                  pin_code: targetPin,
                  user_id: currentUid,
                  session_id: currentSessionId
                })
              }).then(async (res) => {
                if (res.ok) {
                  setLiveSubtitles("🎉 ¡Computadora Vinculada con Éxito! Ya puedes ver tus chats en la PC.");
                  speakText("Listo. Tu computadora ha sido vinculada con éxito.", -99);
                  setTimeout(() => {
                    stopLiveVision();
                    alert("🎉 ¡Computadora Vinculada con Éxito!\n\nTodas tus conversaciones ya están sincronizadas en tu PC.");
                  }, 1200);
                } else {
                  isProcessingQr = false;
                }
              }).catch(() => {
                isProcessingQr = false;
              });
            }
          }
        } catch (e) {}
      }, 400);

      // Escaneo visual continuo para no videntes y análisis de entorno
      const autoVisionTimer = setInterval(() => {
        if (liveVideoRef.current && liveVideoRef.current.videoWidth > 0 && !isAnalyzingFrame) {
          captureAndAnalyzeFrame();
        }
      }, 7000);

      liveIntervalRef.current = autoVisionTimer;

      // Primer análisis visual tras 1s de enfocar la cámara
      setTimeout(() => {
        const isLazarillo = activeMode === "inclusion";
        const initialPrompt = isLazarillo
          ? "Actúa como lazarillo visual para una persona no vidente. Describe el camino indicando referencias espaciales con esfera de reloj (ej: a tus 12 en punto, a tus 2 en punto) y advierte cualquier obstáculo o desnivel de forma concisa."
          : "Describe con precisión y claridad qué estás observando en esta toma en vivo de forma concisa.";
        captureAndAnalyzeFrame(initialPrompt);
      }, 1000);

    } catch (err: any) {
      console.error("Error iniciando cámara en vivo:", err);
      setLiveSubtitles("⚠️ No se pudo acceder a la cámara. Por favor permite el acceso en tu navegador.");
      hardware.releaseWakeLock();
    }
  };

  const handleLiveVoiceAsk = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("El reconocimiento de voz no está soportado en este navegador.");
      return;
    }

    try {
      stopSpeaking();
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "es-AR";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setLiveSubtitles("🎙️ Te escucho... Pregúntame sobre lo que estás mostrando.");

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setLiveCustomPrompt(transcript);
          captureAndAnalyzeFrame(transcript);
        }
      };

      recognition.onerror = () => {
        setLiveSubtitles("👁️ Susybot sigue observando. Puedes pulsar 'Analizar' o escribir.");
      };

      recognition.start();
    } catch (err) {
      console.warn("Error en live voice:", err);
    }
  };

  const stopLiveVision = () => {
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    hardware.releaseCamera();
    hardware.releaseWakeLock();
    liveMediaStreamRef.current = null;
    setIsLiveStreaming(false);
    setIsAnalyzingFrame(false);
    setShowLiveVisionModal(false);
    stopSpeaking();
  };

  const toggleLiveCamera = () => {
    const nextMode = liveFacingMode === "environment" ? "user" : "environment";
    setLiveFacingMode(nextMode);
    startLiveVision(nextMode);
  };

  const captureAndAnalyzeFrame = async (customPrompt?: string) => {
    if (!liveVideoRef.current || isAnalyzingFrame) return;

    const now = Date.now();
    if (!customPrompt && now - lastLiveAnalysisRef.current < 2500) {
      return;
    }

    // Si Susy está hablando y es un escaneo automático, no cortarla
    if (typeof window !== "undefined" && (audioPlayerRef.current || (window.speechSynthesis && window.speechSynthesis.speaking)) && !customPrompt) {
      return;
    }

    try {
      setIsAnalyzingFrame(true);
      setLiveSubtitles("👁️ Susybot está analizando la toma en vivo...");
      lastLiveAnalysisRef.current = Date.now();
      const video = liveVideoRef.current;
      
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      // Crear canvas dinámico en memoria de 640x480 max
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(width, 640);
      canvas.height = Math.min(height, 480);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsAnalyzingFrame(false);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL("image/jpeg", 0.6);

      const isLazarillo = activeMode === "inclusion";
      const defaultVisionPrompt = isLazarillo
        ? "Actúa como un lazarillo visual de alta precisión para una persona no vidente. Describe el camino al frente indicando obstáculos con la esfera de reloj (ej. 'A tus 12 en punto a 2 metros...', 'A tus 2 en punto...'). Si hay desniveles, escalones, pozos o peligros inminentes, adviértelo con máxima prioridad en 1 o 2 frases breves."
        : "Describe qué estás observando en esta toma en vivo de forma concisa.";

      const res = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Image,
          userPrompt: customPrompt || liveCustomPrompt || defaultVisionPrompt,
          mode: activeMode
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("text/event-stream") && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let sseBuffer = "";
          let fullLiveText = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            sseBuffer += decoder.decode(value, { stream: true });
            const lines = sseBuffer.split("\n");
            sseBuffer = lines.pop() || "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data: ")) {
                const dataContent = trimmed.slice(6).trim();
                if (dataContent === "[DONE]") break;
                try {
                  const parsed = JSON.parse(dataContent);
                  if (parsed.text) {
                    fullLiveText += parsed.text;
                    setLiveSubtitles(fullLiveText);
                  }
                  // 🎙️ Usar siempre síntesis vocal humana natural del navegador (sin audio MP3 robótico)
                  if (fullLiveText.trim() && !window.speechSynthesis.speaking) {
                    speakText(fullLiveText.trim(), -99);
                  }
                } catch {
                  if (dataContent) {
                    fullLiveText += dataContent;
                    setLiveSubtitles(fullLiveText);
                  }
                }
              }
            }
          }
          if (fullLiveText.trim() && !audioPlayerRef.current) {
            speakText(fullLiveText.trim(), -99);
          }

          // Alerta háptica por vibración ante detección de peligros o desniveles
          if (fullLiveText.trim()) {
            const lower = fullLiveText.toLowerCase();
            if (
              lower.includes("cuidado") ||
              lower.includes("atención") ||
              lower.includes("atencion") ||
              lower.includes("peligro") ||
              lower.includes("escalón") ||
              lower.includes("escalon") ||
              lower.includes("escalera") ||
              lower.includes("pozo") ||
              lower.includes("desnivel") ||
              lower.includes("obstáculo") ||
              lower.includes("obstaculo")
            ) {
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate([250, 100, 250]);
              }
            }
          }
        } else {
          const data = await res.json();
          if (data.text) {
            setLiveSubtitles(data.text);
            speakText(data.text, -99);
          }
        }
      }
    } catch (err) {
      console.warn("Error analizando frame en vivo:", err);
    } finally {
      setIsAnalyzingFrame(false);
      setIsLoading(false);
    }
  };

  const toggleAutoVoice = () => {
    const newVal = !autoVoice;
    setAutoVoice(newVal);
    localStorage.setItem("susybot_auto_voice", String(newVal));
    if (!newVal) stopSpeaking();
  };

  // 9. Solicitar Permisos de Notificaciones Push
  const handleRequestNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Este navegador no soporta notificaciones web.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
        new Notification("Susybot AI", {
          body: "¡Notificaciones activadas! Te avisaremos cuando Susybot termine de responder.",
          icon: "/icons/main-icon.png"
        });
      } else {
        setNotificationsEnabled(false);
      }
    } catch (err) {
      console.error("Error pidiendo notificaciones:", err);
    }
  };

  // 10. Iniciar Grabación de Audio por Micrófono (MediaRecorder Nativo)
  const startRecordingAudio = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Tu dispositivo o navegador no tiene acceso al micrófono.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/aac")) {
        mimeType = "audio/aac";
      }

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(timerIntervalRef.current);
        const finalSecs = secondsRef.current;
        secondsRef.current = 0;
        setRecordingSeconds(0);
        setIsRecordingAudio(false);

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size < 500) {
          alert("El audio fue demasiado breve. Por favor mantén presionado y habla con claridad.");
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];

          handleSendAudioMessage({
            name: `Nota de Voz (${finalSecs}s).${mimeType.includes("mp4") ? "mp4" : "webm"}`,
            type: mimeType,
            size: audioBlob.size,
            base64: base64Data
          });
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(200);
      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      secondsRef.current = 0;

      timerIntervalRef.current = setInterval(() => {
        secondsRef.current += 1;
        setRecordingSeconds(secondsRef.current);
      }, 1000);

    } catch (err: any) {
      console.error("Error accediendo al micrófono:", err);
      alert("No se pudo acceder al micrófono. Por favor permite el acceso en los ajustes de tu navegador.");
      setIsRecordingAudio(false);
    }
  };

  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecordingAudio = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.onstop = () => {
        clearInterval(timerIntervalRef.current);
        setRecordingSeconds(0);
        setIsRecordingAudio(false);
      };
      mediaRecorderRef.current.stop();
    }
  };

  // 11. Enviar Mensaje de Audio Directo con Streaming (Atómico: Audio + Foto)
  const handleSendAudioMessage = async (audioFile: AttachedFile) => {
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;
    stopSpeaking();
    const currentAttached = attachedFile;
    const userPromptText = inputMessage.trim();

    const tempUserMsg: Message = {
      role: "user",
      content: currentAttached
        ? (userPromptText ? `${userPromptText} 🎙️ [Audio y Foto adjunta]` : `🎙️ [Audio y Foto adjunta]`)
        : `🎙️ [Nota de voz enviada]`,
      file: currentAttached ? {
        name: currentAttached.name,
        type: currentAttached.type,
        previewUrl: currentAttached.previewUrl
      } : {
        name: audioFile.name,
        type: audioFile.type
      },
      created_at: new Date().toISOString()
    };

    const historyPayload = messages
      .filter((m) => m.content && typeof m.content === "string" && m.content.trim().length > 0)
      .slice(-30)
      .map((m) => ({
        role: ((m.role as string) === "assistant" || (m.role as string) === "model") ? "assistant" : "user",
        content: m.content
      }));

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage("");
    setAttachedFile(null);
    setIsLoading(true);

    try {
      const msgId = "msg_audio_" + Date.now();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-message-id": msgId
        },
        body: JSON.stringify({
          message: userPromptText || "Escucha este audio del usuario y respóndele detalladamente considerando cualquier imagen adjunta.",
          session_id: currentSessionId,
          user_id: userId,
          message_id: msgId,
          history: historyPayload,
          contextData: { mode: activeMode },
          stream: true,
          file: currentAttached ? {
            name: currentAttached.name,
            mimeType: currentAttached.type,
            base64: currentAttached.base64,
            textContent: currentAttached.textContent
          } : undefined,
          audioFile: {
            name: audioFile.name,
            mimeType: audioFile.type,
            base64: audioFile.base64
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `⚠️ ${errData.error || "No se pudo procesar el audio."}`,
          created_at: new Date().toISOString()
        }]);
        setIsLoading(false);
        return;
      }

      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "",
        created_at: new Date().toISOString()
      }]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let sseBuffer = "";
      let updatedSessionId: string | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const rawChunk = decoder.decode(value, { stream: true });
          if (!rawChunk) continue;

          // 1. Manejo SSE si contiene prefijo data:
          if (rawChunk.includes("data:") || sseBuffer.includes("data:")) {
            sseBuffer += rawChunk;
            const lines = sseBuffer.split("\n");
            sseBuffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(":") || trimmed === ": keep-alive") continue;
              if (trimmed.startsWith("data:")) {
                const dataContent = trimmed.replace(/^data:\s*/, "");
                if (dataContent === "[DONE]") continue;

                let textToAdd = "";
                try {
                  const parsed = JSON.parse(dataContent);
                  textToAdd = parsed.text || parsed.reply || parsed.content || (typeof parsed === "string" ? parsed : "");
                  if (parsed.session_id && !updatedSessionId) {
                    updatedSessionId = parsed.session_id;
                    setCurrentSessionId(parsed.session_id);
                    localStorage.setItem("susybot_session_id", parsed.session_id);
                  }
                } catch {
                  // Si no es JSON, es texto plano crudo directo
                  textToAdd = dataContent;
                }

                if (textToAdd) {
                  accumulatedText += textToAdd;
                  setMessages((prev) => {
                    const newArr = [...prev];
                    if (newArr.length > 0) {
                      newArr[newArr.length - 1] = {
                        ...newArr[newArr.length - 1],
                        content: accumulatedText
                      };
                    }
                    return newArr;
                  });
                }
              }
            }
          } else {
            // 2. Flujo directo de texto plano crudo
            if (!rawChunk.startsWith(":")) {
              accumulatedText += rawChunk;
              setMessages((prev) => {
                const newArr = [...prev];
                if (newArr.length > 0) {
                  newArr[newArr.length - 1] = {
                    ...newArr[newArr.length - 1],
                    content: accumulatedText
                  };
                }
                return newArr;
              });
            }
          }
        }

        if (sseBuffer.trim() && !sseBuffer.startsWith(":") && !sseBuffer.includes("[DONE]")) {
          const leftover = sseBuffer.replace(/^data:\s*/, "");
          if (leftover) {
            accumulatedText += leftover;
            setMessages((prev) => {
              const newArr = [...prev];
              if (newArr.length > 0) {
                newArr[newArr.length - 1] = {
                  ...newArr[newArr.length - 1],
                  content: accumulatedText
                };
              }
              return newArr;
            });
          }
        }
      }

      if (!accumulatedText.trim()) {
        const fallbackAudioReply = "He escuchado tu nota de voz con éxito. Estoy a tu completa disposición para asistirte paso a paso.";
        accumulatedText = fallbackAudioReply;
        setMessages((prev) => {
          const newArr = [...prev];
          if (newArr.length > 0) {
            newArr[newArr.length - 1] = {
              ...newArr[newArr.length - 1],
              content: fallbackAudioReply
            };
          }
          return newArr;
        });
      }

      if (autoVoice && accumulatedText.trim()) {
        speakText(accumulatedText, messages.length);
      }

    } catch (err) {
      console.error("Error enviando audio:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Error de conexión al enviar el audio.",
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  // Función de compresión ultra-rápida en el cliente (640x480, JPEG 50%) para erradicar timeouts
  const compressImageForUpload = (file: File): Promise<{ base64: string; previewUrl: string; size: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 640;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.50);
            resolve({
              base64: compressedDataUrl.split(",")[1],
              previewUrl: compressedDataUrl,
              size: Math.round((compressedDataUrl.length * 3) / 4)
            });
          } else {
            const raw = e.target?.result as string;
            resolve({ base64: raw.split(",")[1] || "", previewUrl: raw, size: file.size });
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // 12. Manejar Selección de Archivo/Foto con Compresión Automática Ligera
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (file.type.startsWith("image/")) {
      const compressed = await compressImageForUpload(file);
      setAttachedFile({
        name: file.name,
        type: "image/jpeg",
        size: compressed.size,
        base64: compressed.base64,
        previewUrl: compressed.previewUrl
      });
    } else if (file.type.startsWith("audio/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Audio = (reader.result as string).split(",")[1];
        setAttachedFile({
          name: file.name,
          type: file.type,
          size: file.size,
          base64: base64Audio
        });
      };
      reader.readAsDataURL(file);
    } else if (isPdf) {
      if (file.size > 15 * 1024 * 1024) {
        alert("El archivo PDF supera los 15 MB. Por favor sube un documento de menor peso o compártelo en secciones.");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setAttachedFile({
          name: file.name,
          type: "application/pdf",
          size: file.size,
          base64: result.split(",")[1],
          previewUrl: undefined
        });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          type: file.type || "text/plain",
          size: file.size,
          textContent: reader.result as string
        });
      };
      reader.readAsText(file);
    }

    e.target.value = "";
  };

  // 13. Enviar Mensaje a Susybot con Streaming en Tiempo Real
  const handleSendMessage = async (customPrompt?: string) => {
    if (isSubmittingRef.current || isLoading) return;
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() && !attachedFile) return;

    isSubmittingRef.current = true;
    stopSpeaking();

    const currentFile = attachedFile;
    const tempUserMsg: Message = {
      role: "user",
      content: textToSend.trim(),
      file: currentFile ? {
        name: currentFile.name,
        type: currentFile.type,
        previewUrl: currentFile.previewUrl
      } : undefined,
      created_at: new Date().toISOString()
    };

    const historyPayload = messages
      .filter((m) => m.content && typeof m.content === "string" && m.content.trim().length > 0)
      .slice(-30)
      .map((m) => ({
        role: ((m.role as string) === "assistant" || (m.role as string) === "model") ? "assistant" : "user",
        content: m.content
      }));

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage("");
    setAttachedFile(null);
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const msgId = "msg_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-message-id": msgId
        },
        body: JSON.stringify({
          message: textToSend.trim(),
          session_id: currentSessionId,
          user_id: userId,
          message_id: msgId,
          history: historyPayload,
          interactionMode: hardware.currentMode,
          contextData: { mode: activeMode, interactionMode: hardware.currentMode },
          stream: true,
          file: currentFile ? {
            name: currentFile.name,
            mimeType: currentFile.type,
            base64: currentFile.base64,
            textContent: currentFile.textContent
          } : undefined
        })
      });

      if (!res.ok) {
        console.warn(`[Susybot Chat] Servidor ocupado o sin red (${res.status}). Activando inferencia local WebGPU / Modo Campo...`);
        const localRes = await executeLocalInference(textToSend, historyPayload, activeMode);
        
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "",
          created_at: new Date().toISOString()
        }]);

        const words = localRes.text.split(" ");
        let acc = "";
        for (let i = 0; i < words.length; i++) {
          acc += (i === 0 ? "" : " ") + words[i];
          const curr = acc;
          setMessages((prev) => {
            const arr = [...prev];
            if (arr.length > 0) {
              arr[arr.length - 1] = { ...arr[arr.length - 1], content: curr };
            }
            return arr;
          });
          if (i % 4 === 0) {
            await new Promise((r) => setTimeout(r, 12));
          }
        }

        if (autoVoice && localRes.text) {
          speakText(localRes.text, messages.length + 1);
        }
        setIsLoading(false);
        isSubmittingRef.current = false;
        return;
      }

      // Preparar burbuja para streaming en vivo
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "",
        created_at: new Date().toISOString()
      }]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let sseBuffer = "";
      let updatedSessionId: string | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const rawChunk = decoder.decode(value, { stream: true });
          if (!rawChunk) continue;

          // 1. Manejo SSE si contiene prefijo data:
          if (rawChunk.includes("data:") || sseBuffer.includes("data:")) {
            sseBuffer += rawChunk;
            const lines = sseBuffer.split("\n");
            sseBuffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(":") || trimmed === ": keep-alive") continue;
              if (trimmed.startsWith("data:")) {
                const dataContent = trimmed.replace(/^data:\s*/, "");
                if (dataContent === "[DONE]") continue;

                let textToAdd = "";
                try {
                  const parsed = JSON.parse(dataContent);
                  textToAdd = parsed.text || parsed.reply || parsed.content || (typeof parsed === "string" ? parsed : "");
                  if (parsed.session_id && !updatedSessionId) {
                    updatedSessionId = parsed.session_id;
                  }
                } catch {
                  // Si no es JSON, tomar el texto plano crudo directamente
                  textToAdd = dataContent;
                }

                if (textToAdd) {
                  accumulatedText += textToAdd;
                  setMessages((prev) => {
                    const newArr = [...prev];
                    if (newArr.length > 0) {
                      newArr[newArr.length - 1] = {
                        ...newArr[newArr.length - 1],
                        content: accumulatedText
                      };
                    }
                    return newArr;
                  });
                }
              }
            }
          } else {
            // 2. Flujo directo de texto plano crudo
            if (!rawChunk.startsWith(":")) {
              accumulatedText += rawChunk;
              setMessages((prev) => {
                const newArr = [...prev];
                if (newArr.length > 0) {
                  newArr[newArr.length - 1] = {
                    ...newArr[newArr.length - 1],
                    content: accumulatedText
                  };
                }
                return newArr;
              });
            }
          }
        }

        if (sseBuffer.trim() && !sseBuffer.startsWith(":") && !sseBuffer.includes("[DONE]")) {
          const leftover = sseBuffer.replace(/^data:\s*/, "");
          if (leftover) {
            accumulatedText += leftover;
            setMessages((prev) => {
              const newArr = [...prev];
              if (newArr.length > 0) {
                newArr[newArr.length - 1] = {
                  ...newArr[newArr.length - 1],
                  content: accumulatedText
                };
              }
              return newArr;
            });
          }
        }
      }

      if (!accumulatedText.trim()) {
        const localRes = await executeLocalInference(textToSend, historyPayload, activeMode);
        accumulatedText = localRes.text;
        setMessages((prev) => {
          const newArr = [...prev];
          if (newArr.length > 0) {
            newArr[newArr.length - 1] = {
              ...newArr[newArr.length - 1],
              content: accumulatedText
            };
          }
          return newArr;
        });
      }

      if (updatedSessionId && updatedSessionId !== currentSessionId) {
        setCurrentSessionId(updatedSessionId);
        fetchSessions(userId);
      }

      if (autoVoice && accumulatedText) {
        speakText(accumulatedText, messages.length + 1);
      }

      if (document.hidden && Notification.permission === "granted" && accumulatedText) {
        new Notification("Susybot AI", {
          body: accumulatedText.slice(0, 100) + "...",
          icon: "/icons/main-icon.png"
        });
      }

    } catch (err: any) {
      console.warn("[Susybot Chat] Error de red. Conmutando a modo campo local WebGPU...", err);
      const localRes = await executeLocalInference(textToSend, historyPayload, activeMode);
      
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "",
        created_at: new Date().toISOString()
      }]);

      const words = localRes.text.split(" ");
      let acc = "";
      for (let i = 0; i < words.length; i++) {
        acc += (i === 0 ? "" : " ") + words[i];
        const curr = acc;
        setMessages((prev) => {
          const arr = [...prev];
          if (arr.length > 0) {
            arr[arr.length - 1] = { ...arr[arr.length - 1], content: curr };
          }
          return arr;
        });
        if (i % 4 === 0) {
          await new Promise((r) => setTimeout(r, 12));
        }
      }

      if (autoVoice && localRes.text) {
        speakText(localRes.text, messages.length + 1);
      }
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 50);
    }
  };

  // 14. Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  // 15. Manejo de tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 16. Copiar texto al portapapeles
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper para renderizar pictogramas visuales interactivos para TEA (Estándar SAAC / ARASAAC)
  const processPictogramChildren = (children: any): any => {
    if (typeof children === "string") {
      if (!children.includes("[PICTO:")) return children;
      const parts = children.split(/(\[PICTO:\s*[^\]]+\])/gi);
      return parts.map((part, idx) => {
        const match = part.match(/\[PICTO:\s*([^\]]+)\]/i);
        if (match) {
          const pictoLabel = match[1].trim();
          const getPictoEmoji = (label: string): string => {
            const l = label.toLowerCase();
            if (l.includes("mochila")) return "🎒";
            if (l.includes("leer") || l.includes("libro")) return "📖";
            if (l.includes("escribir") || l.includes("lapiz") || l.includes("lápiz")) return "✍️";
            if (l.includes("guardar") || l.includes("orden")) return "📦";
            if (l.includes("escuchar") || l.includes("oido") || l.includes("oído")) return "👂";
            if (l.includes("colegio") || l.includes("escuela") || l.includes("aula")) return "🏫";
            if (l.includes("reloj") || l.includes("tiempo") || l.includes("hora")) return "⏰";
            if (l.includes("comer") || l.includes("almuerzo") || l.includes("comida")) return "🍎";
            if (l.includes("casa") || l.includes("hogar")) return "🏠";
            if (l.includes("tarea") || l.includes("deberes")) return "📝";
            if (l.includes("jugar") || l.includes("recreo")) return "🎮";
            if (l.includes("descanso") || l.includes("calma") || l.includes("parar")) return "🧘";
            if (l.includes("bien") || l.includes("correcto") || l.includes("logrado")) return "✅";
            if (l.includes("primero") || l.includes("inicio")) return "1️⃣";
            if (l.includes("segundo") || l.includes("desarrollo")) return "2️⃣";
            if (l.includes("tercero") || l.includes("final")) return "3️⃣";
            return "🧩";
          };
          const emoji = getPictoEmoji(pictoLabel);
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 my-0.5 mx-1 rounded-lg bg-sky-950/90 border border-sky-400/50 text-sky-200 text-xs font-bold shadow-xs select-none align-middle"
              title={`Pictograma de apoyo visual: ${pictoLabel}`}
            >
              <span className="text-sm">{emoji}</span>
              <span className="uppercase tracking-wider font-mono text-[11px] text-sky-100">{pictoLabel}</span>
            </span>
          );
        }
        return part;
      });
    }
    if (Array.isArray(children)) {
      return children.map((c, i) => <React.Fragment key={i}>{processPictogramChildren(c)}</React.Fragment>);
    }
    return children;
  };

  // Renderizador de Markdown Robusto con soporte de Tablas GFM, Imágenes IA, Enlaces y Pictogramas TEA
  const renderMessageContent = (content: string, msgIndex: number) => {
    return (
      <div className="space-y-3 leading-relaxed text-sm md:text-[15px] prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ node, children, ...props }) => (
              <p className="my-1.5 text-slate-200 leading-relaxed" {...props}>
                {processPictogramChildren(children)}
              </p>
            ),
            h1: ({ node, children, ...props }) => (
              <h1 className="text-lg md:text-xl font-bold text-white mt-4 mb-2 pb-1 border-b border-slate-800" {...props}>
                {processPictogramChildren(children)}
              </h1>
            ),
            h2: ({ node, children, ...props }) => (
              <h2 className="text-base md:text-lg font-bold text-sky-200 mt-3 mb-1.5" {...props}>
                {processPictogramChildren(children)}
              </h2>
            ),
            h3: ({ node, children, ...props }) => (
              <h3 className="text-sm md:text-base font-semibold text-sky-300 mt-2.5 mb-1" {...props}>
                {processPictogramChildren(children)}
              </h3>
            ),
            ul: ({ node, children, ...props }) => (
              <ul className="list-disc pl-5 space-y-1 my-2 text-slate-200" {...props}>
                {children}
              </ul>
            ),
            ol: ({ node, children, ...props }) => (
              <ol className="list-decimal pl-5 space-y-1 my-2 text-slate-200" {...props}>
                {children}
              </ol>
            ),
            li: ({ node, children, ...props }) => (
              <li className="leading-snug" {...props}>
                {processPictogramChildren(children)}
              </li>
            ),
            strong: ({ node, children, ...props }) => (
              <strong className="text-sky-300 font-semibold" {...props}>
                {processPictogramChildren(children)}
              </strong>
            ),
            blockquote: ({ node, children, ...props }) => (
              <blockquote className="border-l-4 border-sky-500/60 pl-3 my-2 text-slate-300 italic bg-sky-950/20 py-1 rounded-r-lg" {...props}>
                {processPictogramChildren(children)}
              </blockquote>
            ),
            table: ({ node, children, ...props }) => (
              <div className="my-4 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/80 shadow-2xl">
                <table className="w-full text-left text-xs md:text-sm border-collapse" {...props}>
                  {children}
                </table>
              </div>
            ),
            thead: ({ node, children, ...props }) => (
              <thead className="bg-slate-800/90 border-b border-slate-700 text-sky-300 font-semibold uppercase tracking-wider text-[11px]" {...props}>
                {children}
              </thead>
            ),
            th: ({ node, children, ...props }) => (
              <th className="px-4 py-3 border-r border-slate-700/60 last:border-r-0 font-semibold" {...props}>
                {children}
              </th>
            ),
            tbody: ({ node, children, ...props }) => (
              <tbody className="divide-y divide-slate-800/80 text-slate-200" {...props}>
                {children}
              </tbody>
            ),
            tr: ({ node, children, ...props }) => (
              <tr className="hover:bg-slate-800/40 transition-colors" {...props}>
                {children}
              </tr>
            ),
            td: ({ node, children, ...props }) => (
              <td className="px-4 py-2.5 border-r border-slate-800/40 last:border-r-0 align-top" {...props}>
                {children}
              </td>
            ),
            a: ({ node, href, children, ...props }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline font-medium hover:scale-[1.01] transition-transform"
                {...props}
              >
                {children} ↗
              </a>
            ),
            img: ({ node, src, alt, ...props }: any) => {
              if (!src) return null;
              const imageSrc = typeof src === "string" ? src : "";
              return (
                <div className="my-3 rounded-2xl overflow-hidden border border-sky-500/40 bg-slate-950/90 p-2.5 shadow-2xl space-y-2.5">
                  <div className="relative group rounded-xl overflow-hidden bg-black/50">
                    <img 
                      src={imageSrc} 
                      alt={alt || "Imagen Generada por Susybot"} 
                      className="w-full max-h-96 object-contain rounded-xl mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
                      loading="lazy" 
                    />
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 text-xs">
                    <span className="font-medium text-slate-300 truncate max-w-[60%]">{alt || "Imagen Generada por Susybot"}</span>
                    {imageSrc && (
                      <a
                        href={imageSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        download="susybot_arte_ia.jpg"
                        className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 transition-all text-xs"
                      >
                        <Download size={13} />
                        <span>Descargar HD</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            },
            code: ({ node, inline, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || "");
              const codeContent = String(children).replace(/\n$/, "");
              const lang = (match ? match[1] : "").toLowerCase();

              // 📊 RENDERIZADO INTERACTIVO DE FUNCIONES MATEMÁTICAS (FASE 11)
              if (!inline && (lang === "plot" || lang === "graph" || lang === "function-plot" || lang === "math-plot")) {
                return <FunctionPlotter expression={codeContent} />;
              }

              if (!inline && (match || codeContent.includes("\n"))) {
                const codeBlockId = `code_${msgIndex}_${Math.random().toString(36).substring(2, 7)}`;
                return (
                  <div className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-[#070a12] shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs text-slate-400 font-mono">
                      <span>{match ? match[1] : "código"}</span>
                      <button
                        onClick={() => handleCopy(codeContent, codeBlockId)}
                        className="flex items-center gap-1.5 hover:text-sky-400 transition-colors"
                      >
                        {copiedId === codeBlockId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copiedId === codeBlockId ? "Copiado" : "Copiar"}</span>
                      </button>
                    </div>
                    <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono text-emerald-300/95 leading-snug">
                      <code>{codeContent}</code>
                    </pre>
                  </div>
                );
              }
              return (
                <code className="px-1.5 py-0.5 rounded bg-slate-800/90 text-sky-300 font-mono text-xs" {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  // Gesto Universal Tiflotecnológico: Doble Toque en cualquier lugar de la pantalla para No Videntes
  const lastScreenTapRef = useRef<number>(0);
  const handleUniversalScreenDoubleTap = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("a") ||
      showLiveVisionModal ||
      showRealtimeCallModal
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastScreenTapRef.current < 350) {
      lastScreenTapRef.current = 0;
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      stopSpeaking();
      setShowRealtimeCallModal(true);
    } else {
      lastScreenTapRef.current = now;
    }
  };

  return (
    <div 
      onClick={handleUniversalScreenDoubleTap}
      className="flex h-screen w-full bg-[#090d16] text-slate-100 font-sans overflow-hidden antialiased selection:bg-sky-500/30 selection:text-sky-200"
    >
      
      {/* Inputs Ocultos de Archivos y Cámara */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.txt,image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />

      {/* ================================================================= */}
      {/* 📱 BANNER / MODAL FLOTANTE DE INSTALACIÓN NATIVA PWA              */}
      {/* ================================================================= */}
      {showInstallBanner && (
        <div className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-4 z-50 max-w-md bg-slate-900/95 border border-sky-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/30">
              <Smartphone size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white mb-0.5">¿Instalar Susybot en tu dispositivo?</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Úsala a pantalla completa como una app nativa con respuestas inmediatas y acceso directo.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInstallApp}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-sky-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Instalar Ahora</span>
                </button>
                <button
                  onClick={handleDismissInstall}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Quizás más tarde
                </button>
              </div>
            </div>
            <button onClick={handleDismissInstall} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Guía para iPhone / iOS */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-sky-500/40 rounded-2xl p-5 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 mx-auto flex items-center justify-center">
              <Share2 size={24} className="text-white" />
            </div>
            <h3 className="font-bold text-base text-white">Instalar en iPhone / iPad</h3>
            <div className="text-left text-xs text-slate-300 space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <p>1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari (icono de cuadrado con flecha hacia arriba).</p>
              <p>2. Desliza hacia abajo y selecciona <strong>"Agregar al inicio"</strong> (icono +).</p>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 📲 MODAL DE COMPARTIR, CÓDIGO QR Y VIRALIZACIÓN WHATSAPP         */}
      {/* ================================================================= */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0c121e] border border-sky-500/40 rounded-3xl p-6 max-w-md w-full text-center space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-sky-500 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
                <QrCode size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Recomendar Susybot Municipal</h3>
              <p className="text-xs text-slate-400">
                Compartí la asistente virtual de la Municipalidad de Ituzaingó por WhatsApp o escaneá el QR desde cualquier celular.
              </p>
            </div>

            {/* Código QR Generado Dinámicamente para Ituzaingó */}
            <div className="p-4 bg-white rounded-2xl max-w-[210px] mx-auto shadow-inner border border-slate-700">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://susy-bot.vercel.app")}&bgcolor=ffffff&color=090d16`}
                alt="Código QR de Susybot Municipal"
                className="w-full h-auto rounded-lg mx-auto"
              />
            </div>

            <div className="space-y-2.5">
              {/* Botón Compartir Directo en WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`¡Hola vecino! Te comparto Susybot, la Directora Virtual de Atención al Vecino e Innovación Urbana de la Municipalidad de Ituzaingó. Podés consultar turnos de licencias de conducir, farmacias de turno, guardias y reportar reclamos de obras públicas (#ITU): ${typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://susy-bot.vercel.app"}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <MessageCircle size={18} />
                <span>Enviar por WhatsApp</span>
              </a>

              {/* Botón Copiar Enlace */}
              <button
                onClick={() => {
                  const url = typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://susy-bot.vercel.app";
                  navigator.clipboard.writeText(url);
                  setCopiedShareLink(true);
                  setTimeout(() => setCopiedShareLink(false), 2500);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedShareLink ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                <span>{copiedShareLink ? "¡Enlace copiado al portapapeles!" : "Copiar Enlace Directo"}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              Municipalidad de Ituzaingó, Corrientes • Atención al Vecino
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 📱 SIDEBAR / HISTORIAL DE CONVERSACIONES                          */}
      {/* ================================================================= */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 md:w-80 bg-[#0c121e]/95 backdrop-blur-xl
        border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-slate-800/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
                Susybot AI
              </h1>
              <p className="text-[10px] text-sky-400/80 font-mono">Municipalidad de Ituzaingó</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Botón Nuevo Chat */}
        <div className="p-3 space-y-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-sm shadow-md shadow-sky-600/20 hover:shadow-sky-500/30 transition-all duration-200 active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Nuevo Chat</span>
          </button>

          {/* Botón Compartir / QR en Sidebar */}
          <button
            onClick={() => setShowShareModal(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/70 text-emerald-300 transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2">
              <QrCode size={14} className="text-emerald-400" />
              <span className="font-medium">Compartir / Código QR</span>
            </div>
            <Share2 size={12} className="text-emerald-400" />
          </button>

          {/* Botón Números de Emergencia en Sidebar */}
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/70 text-rose-300 transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Siren size={14} className="text-rose-400" />
              <span className="font-medium">Teléfonos de Emergencia</span>
            </div>
            <Phone size={12} className="text-rose-400" />
          </button>

          {/* Botón Instalar App en Sidebar */}
          <button
            onClick={handleInstallApp}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 text-sky-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Smartphone size={14} className="text-sky-400" />
              <span>Instalar App en Celular</span>
            </div>
            <Download size={12} className="text-sky-400" />
          </button>
        </div>

        {/* Botón Notificaciones Push */}
        <div className="px-3 pb-2">
          <button
            onClick={handleRequestNotifications}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition-colors ${
              notificationsEnabled 
                ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300" 
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-2">
              {notificationsEnabled ? <BellRing size={14} className="text-emerald-400" /> : <Bell size={14} />}
              <span>{notificationsEnabled ? "Notificaciones Activas" : "Activar Notificaciones"}</span>
            </div>
            {notificationsEnabled && <Check size={12} className="text-emerald-400" />}
          </button>
        </div>

        {/* Lista de Sesiones */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Conversaciones Guardadas
          </div>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No hay chats guardados aún.
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.id === currentSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => selectSession(sess.id)}
                  className={`
                    group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all duration-150
                    ${isActive 
                      ? "bg-sky-950/60 border border-sky-800/60 text-sky-200 font-medium shadow-inner" 
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent"}
                  `}
                >
                  <span className="truncate pr-2">{sess.title}</span>
                  <button
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-all"
                    title="Eliminar conversación"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer del Sidebar */}
        <div className="p-3 border-t border-slate-800/70 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>100% Blindada</span>
          </div>
          <span className="text-[10px] font-mono text-slate-600">MyJNexoraVisual</span>
        </div>
      </aside>

      {/* Backdrop en Mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* ================================================================= */}
      {/* 💬 ÁREA PRINCIPAL DE CHAT                                         */}
      {/* ================================================================= */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-radial from-[#101827] via-[#090d16] to-[#06080e]">
        
        {/* Top Navbar Institucional y Limpia */}
        <header className="h-14 border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between bg-[#090d16]/95 backdrop-blur-md z-30 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50 shrink-0" />
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-base sm:text-lg text-white tracking-tight">Susy</span>
                <span className="px-1.5 py-0.5 rounded bg-sky-950/90 text-sky-300 border border-sky-700/50 text-[10px] font-semibold tracking-wide uppercase">
                  Municipal
                </span>
              </div>
              <span className="hidden xl:inline-block text-[11px] text-slate-400 font-medium ml-1">
                • Ituzaingó, Corrientes
              </span>
              <SusyConnectionBadge />
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
            {/* 🎯 SELECTOR DE MODO ADAPTATIVO (MODO VISUAL VS MODO VOZ CONTINUO / ACCESIBILIDAD) */}
            <div className="flex items-center bg-slate-950/90 p-0.5 sm:p-1 rounded-xl border border-slate-800 shrink-0 shadow-inner">
              <button
                onClick={() => {
                  hardware.switchMode("visual");
                  setShowRealtimeCallModal(false);
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                  hardware.currentMode === "visual"
                    ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/25"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Modo Visual: Chat, Visor de Cámara y OCR con LLaMA 3.2 Vision"
                aria-pressed={hardware.currentMode === "visual"}
              >
                <Eye size={13} className={hardware.currentMode === "visual" ? "text-sky-200" : "text-slate-400"} />
                <span className="hidden xs:inline">Visual</span>
              </button>

              <button
                onClick={() => {
                  hardware.switchMode("voice");
                  stopLiveVision();
                  setShowRealtimeCallModal(true);
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                  hardware.currentMode === "voice"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Modo Voz Continuo: Accesibilidad, Manos Libres y WebRTC para personas no videntes"
                aria-pressed={hardware.currentMode === "voice"}
              >
                <Radio size={13} className={hardware.currentMode === "voice" ? "text-emerald-200 animate-pulse" : "text-slate-400"} />
                <span className="hidden xs:inline">Voz (No Videntes)</span>
              </button>
            </div>

            {/* Botón Susybot Live Vision (En Modo Visual) */}
            {hardware.currentMode === "visual" && (
              <button
                onClick={() => {
                  setShowLiveVisionModal(true);
                  startLiveVision();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-rose-500/20 active:scale-95 cursor-pointer shrink-0"
                title="Abrir Susybot Live (Cámara y Visión con LLaMA 3.2)"
              >
                <Eye size={13} className="text-white shrink-0" />
                <span className="font-extrabold tracking-wide">Cámara IA</span>
              </button>
            )}

            {/* Botón Llamada de Voz en Vivo */}
            <button
              onClick={() => {
                stopLiveVision();
                setShowRealtimeCallModal(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer shrink-0"
              title="Iniciar Llamada en Vivo con Susy"
            >
              <PhoneCall size={13} className="text-white shrink-0 animate-pulse" />
              <span className="font-extrabold tracking-wide">Llamada</span>
            </button>

            {/* Botón Emergencias 107 */}
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition-all cursor-pointer shrink-0"
              title="Teléfonos de Emergencia (107, 101, 100)"
            >
              <Siren size={13} className="text-rose-400 shrink-0" />
              <span className="hidden sm:inline">Emergencias</span>
            </button>

            {/* Botón Calibrar y Afinar Voz de Susy (SIEMPRE VISIBLE EN CELULAR Y PC) */}
            <button
              onClick={() => setShowVoiceModal(true)}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-lg text-xs font-medium bg-slate-900/90 hover:bg-slate-800 border border-sky-500/40 text-sky-300 hover:text-white transition-colors shrink-0 shadow-sm"
              title="Afinar tono, velocidad y elegir voz de Susybot"
            >
              <Sliders size={13} className="text-sky-400 shrink-0" />
              <span className="hidden sm:inline">Voz</span>
            </button>



            {/* Botón Compartir / QR (Visible en tablet/desktop) */}
            <button
              onClick={() => setShowShareModal(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 transition-colors shrink-0"
              title="Compartir Susybot por WhatsApp o Código QR"
            >
              <QrCode size={13} className="text-emerald-400" />
              <span>Compartir</span>
            </button>

            {/* Toggle de Voz Femenina Automática */}
            <button
              onClick={toggleAutoVoice}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
                autoVoice 
                  ? "bg-sky-950/80 border-sky-700 text-sky-300" 
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title={autoVoice ? "Desactivar voz automática" : "Activar voz femenina automática"}
            >
              {autoVoice ? <Volume2 size={13} className="text-sky-400" /> : <VolumeX size={13} />}
              <span>{autoVoice ? "Voz: On" : "Voz: Off"}</span>
            </button>

            {/* Botón Nuevo Chat */}
            <button
              onClick={handleNewChat}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-colors shrink-0 flex items-center gap-1"
              title="Iniciar nuevo chat"
            >
              <Plus size={14} />
              <span className="hidden md:inline">Nuevo Chat</span>
            </button>
          </div>
        </header>

        {/* Contenedor de Mensajes */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-slate-800"
        >
          {messages.length === 0 ? (
            /* Vista de Bienvenida Optimizada para Móvil y Desktop */
            <div className="max-w-xl mx-auto min-h-full flex flex-col items-center justify-start sm:justify-center text-center px-2 sm:px-4 py-4 space-y-4">
              
              {/* Logo e Identidad Institucional de la Municipalidad de Ituzaingó */}
              <div className="flex flex-col items-center text-center w-full max-w-lg">
                <div className="relative mb-2.5 group">
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-sky-500/20 via-emerald-500/20 to-sky-500/20 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition duration-500"></div>
                  <img 
                    src="https://ituzaingo.gob.ar/turismo/wp-content/uploads/2024/11/version-marginada.jpg" 
                    alt="Municipalidad de Ituzaingó" 
                    className="relative h-16 sm:h-20 w-auto object-contain rounded-xl shadow-lg border border-slate-700/80 bg-slate-900/80 p-1 transition-transform hover:scale-[1.02]" 
                  />
                </div>

                {/* Insignia Oficial Cívica */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-sky-500/30 text-sky-300 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase mb-2 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Municipalidad de Ituzaingó • Corrientes</span>
                </div>

                {/* Título Institucional Sobrio y Majestuoso */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-100 tracking-tight leading-tight">
                  Susy • Atención Ciudadana
                </h1>

                {/* Cargo Institucional */}
                <p className="text-xs sm:text-sm font-medium text-sky-300/95 mt-1">
                  Directora Virtual de Atención al Vecino e Innovación Urbana
                </p>

                {/* Mensaje Cálido de Bienvenida Humana */}
                <div className="mt-3 p-3 sm:p-3.5 rounded-2xl bg-slate-900/85 border border-slate-800/90 text-slate-300 text-xs sm:text-[13px] leading-relaxed shadow-sm max-w-md text-center">
                  <p className="text-slate-100 font-semibold mb-1 flex items-center justify-center gap-1.5 text-emerald-400">
                    <span>👋</span> ¡Hola, vecino! Es un gusto saludarte.
                  </p>
                  <p className="text-slate-300/90">
                    Soy Susy. Estoy aquí para acompañarte de forma simple y humana con tus trámites, reclamos de la ciudad, licencias, farmacias de turno y consultas en Ituzaingó. ¿En qué te puedo ayudar hoy?
                  </p>
                </div>
              </div>

              {/* Banner Susybot Live Vision Compacto */}
              <button
                onClick={() => {
                  setShowLiveVisionModal(true);
                  startLiveVision();
                }}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-sky-950/80 via-indigo-950/80 to-emerald-950/80 hover:from-sky-900/90 hover:to-emerald-900/90 border border-sky-500/40 flex items-center justify-between text-left transition-all shadow-md shadow-sky-950/30 group active:scale-[0.99] cursor-pointer shrink-0"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/30">
                    <Eye size={16} className="text-white animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      👁️ Susybot Live Vision (Cámara Ciudadana y Trámites)
                      <span className="px-1.5 py-0.2 rounded-full text-[8px] bg-emerald-500 text-white font-mono uppercase">En Vivo</span>
                    </span>
                    <span className="text-[10px] text-sky-200/80 line-clamp-1">Apunta tu cámara a formularios, DNI, licencias o enfoca un reclamo urbano</span>
                  </div>
                </div>
                <Radio size={15} className="text-sky-400 animate-pulse shrink-0 ml-1" />
              </button>

              {/* Selector de Categorías Municipales (Grid 100% visible, sin cortes laterales ni scroll forzado) */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 my-2.5 shrink-0">
                {[
                  { id: "general", label: "🌟 Atención General", desc: "Consultas y gestiones" },
                  { id: "salud", label: "🏥 Salud & Farmacias", desc: "Hospital 107 y turnos" },
                  { id: "transito", label: "🚗 Tránsito & Licencias", desc: "Carnet y requisitos" },
                  { id: "reclamos", label: "🚧 Obras & Reclamos", desc: "Bacheo y luminarias" },
                  { id: "turismo", label: "🌿 Turismo & Iberá", desc: "Playas e información" },
                  { id: "inclusion", label: "🧩 Inclusión & Social", desc: "Acción Social y DUA" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setActiveMode(mode.id)}
                    className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer select-none flex flex-col justify-center ${
                      activeMode === mode.id
                        ? "bg-gradient-to-r from-sky-600 via-sky-500 to-emerald-600 text-white border-sky-300 ring-2 ring-sky-400/50 shadow-md shadow-sky-950/50"
                        : "bg-slate-900/95 text-slate-200 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80 shadow-sm"
                    }`}
                  >
                    <span className="text-xs font-bold truncate">{mode.label}</span>
                    <span className={`text-[10px] truncate mt-0.5 ${activeMode === mode.id ? "text-sky-100" : "text-slate-400"}`}>
                      {mode.desc}
                    </span>
                  </button>
                ))}
              </div>

              {/* Banners Institucionales de Acción Rápida */}
              <div className="grid grid-cols-2 gap-2 w-full shrink-0">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="p-2.5 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-700/50 flex items-center gap-2.5 text-left transition-all group cursor-pointer"
                >
                  <QrCode size={18} className="text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-xs font-bold text-emerald-300 block truncate">Recomendar / QR</span>
                    <span className="text-[10px] text-slate-400 hidden sm:block">Compartir con vecinos</span>
                  </div>
                </button>

                <button
                  onClick={() => setShowEmergencyModal(true)}
                  className="p-2.5 rounded-2xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-700/50 flex items-center gap-2.5 text-left transition-all group cursor-pointer"
                >
                  <Siren size={18} className="text-rose-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-xs font-bold text-rose-300 block truncate">Emergencias & Guardia</span>
                    <span className="text-[10px] text-slate-400 hidden sm:block">Hospital 107 • Policía • Bomberos</span>
                  </div>
                </button>
              </div>

              {/* Grid de Sugerencias Oficiales de Ituzaingó (4 Tarjetas Clave) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left pt-1 shrink-0">
                {[
                  { 
                    icon: Bell, 
                    title: "Farmacias de Turno & Salud", 
                    desc: "Hospital Billinghurst (107) y turnos de farmacia", 
                    prompt: "Hola Susybot, por favor indícame qué farmacia se encuentra de turno hoy en Ituzaingó y los números de guardia de salud." 
                  },
                  { 
                    icon: FileText, 
                    title: "Renovación de Licencia de Conducir", 
                    desc: "Requisitos, turnos y tasas de Tránsito", 
                    prompt: "Hola Susybot, con mucho gusto quisiera consultar los requisitos, costos y horarios para renovar mi carnet de conducir en la Dirección de Tránsito de Ituzaingó." 
                  },
                  { 
                    icon: Zap, 
                    title: "Reportar Reclamo Urbano (#ITU)", 
                    desc: "Baches, luminarias y podas vecinales", 
                    prompt: "Hola Susybot, deseo registrar un reclamo formal por una luminaria que no funciona en la esquina de mi barrio para que la cuadrilla de Obras Públicas acuda a revisarla." 
                  },
                  { 
                    icon: Presentation, 
                    title: "Turismo: Esteros del Iberá y Yacyretá", 
                    desc: "Portal Cambyretá y visitas a la Represa", 
                    prompt: "Hola Susybot, ¿cómo puedo visitar los Esteros del Iberá a través del Portal Cambyretá y cuáles son los horarios para los recorridos en la Represa Hidroeléctrica Yacyretá?" 
                  },
                ].map((card, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(card.prompt)}
                    className="p-2.5 sm:p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-sky-500/40 text-left transition-all active:scale-[0.98] group flex items-start gap-2.5 cursor-pointer"
                  >
                    <card.icon size={16} className="text-sky-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="truncate">
                      <h4 className="text-xs font-semibold text-slate-200 group-hover:text-sky-300 transition-colors truncate">
                        {card.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {card.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Stream de Mensajes con Virtualización de DOM */
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.length > 10 && !showAllHistory && (
                <div className="text-center py-2">
                  <button
                    type="button"
                    onClick={() => setShowAllHistory(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-sky-400 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-800/60 rounded-full transition-all shadow-sm"
                  >
                    📜 Mostrar {messages.length - 10} mensajes anteriores
                  </button>
                </div>
              )}

              {(showAllHistory || messages.length <= 10 ? messages : messages.slice(-10)).map((msg, index) => {
                const isUser = msg.role === "user";
                const isSpeakingThis = playingMsgIndex === index;

                return (
                  <div 
                    key={msg.id || index}
                    className={`flex gap-3.5 md:gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 mt-1">
                        <Bot size={18} className="text-white" />
                      </div>
                    )}

                    <div className={`
                      max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3.5 shadow-md
                      ${isUser 
                        ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-tr-xs" 
                        : "bg-slate-900/90 border border-slate-800/90 text-slate-100 rounded-tl-xs backdrop-blur-xs"}
                    `}>
                      
                      {/* Vista previa de archivo o audio en mensaje */}
                      {msg.file && (
                        <div className="mb-3 rounded-xl overflow-hidden border border-white/20 bg-black/30 p-2">
                          {msg.file.previewUrl ? (
                            <img 
                              src={msg.file.previewUrl} 
                              alt="Adjunto" 
                              className="max-h-56 rounded-lg object-contain mx-auto" 
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-xs font-mono text-sky-200 p-1">
                              {msg.file.type.startsWith("audio/") ? <Volume2 size={16} className="text-sky-400" /> : <FileText size={16} />}
                              <span className="truncate">{msg.file.name}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {renderMessageContent(msg.content, index)}
                      
                      {!isUser && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span className="font-mono text-slate-400">Susybot</span>
                          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
                            {/* Botón Escuchar en Voz Femenina Neuronal */}
                            <button
                              onClick={() => speakText(msg.content, index)}
                              className={`flex items-center gap-1 transition-colors ${
                                isSpeakingThis ? "text-rose-400 font-semibold animate-pulse" : "hover:text-sky-400"
                              }`}
                              title={isSpeakingThis ? "Detener voz" : "Escuchar en voz femenina neutra"}
                            >
                              {isSpeakingThis ? <VolumeX size={13} /> : <Volume2 size={13} />}
                              <span>{isSpeakingThis ? "Detener" : "Escuchar"}</span>
                            </button>

                            {/* Botón Exportar Word (.doc) */}
                            <button
                              onClick={() => exportNoraCleanWord(`Documento_Susybot_${index + 1}`, msg.content)}
                              className="flex items-center gap-1 hover:text-indigo-300 transition-colors"
                              title="Descargar en formato Word (.doc) justificado y limpio de emojis"
                            >
                              <FileText size={13} className="text-indigo-400" />
                              <span>Word</span>
                            </button>

                            {/* Botón Imprimir / PDF */}
                            <button
                              onClick={() => exportNoraCleanPdf(`Informe_Susybot_${index + 1}`, msg.content)}
                              className="flex items-center gap-1 hover:text-sky-300 transition-colors"
                              title="Imprimir o guardar en PDF formal justificado"
                            >
                              <Printer size={13} className="text-sky-400" />
                              <span>PDF</span>
                            </button>

                            {/* Botón Exportar PowerPoint (.pptx) */}
                            <button
                              onClick={() => exportNoraCleanPptx(`Presentacion_Susybot_${index + 1}`, msg.content)}
                              className="flex items-center gap-1 hover:text-amber-300 transition-colors"
                              title="Descargar presentación de diapositivas en PowerPoint (.pptx) institucional 16:9"
                            >
                              <Presentation size={13} className="text-amber-400" />
                              <span>PPTX</span>
                            </button>

                            {/* Botón Copiar */}
                            <button
                              onClick={() => handleCopy(msg.content, `msg_${index}`)}
                              className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                              title="Copiar texto al portapapeles"
                            >
                              {copiedId === `msg_${index}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span>{copiedId === `msg_${index}` ? "Copiado" : "Copiar"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
                        <User size={16} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Indicador de Pensando */}
              {isLoading && (
                <div className="flex gap-3.5 items-center justify-start animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl px-4 py-3 text-xs text-sky-400 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-slate-400 ml-1 font-mono text-[11px]">Susybot analizando...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Dock Fijo al Fondo */}
        <div className="p-3 md:p-4 bg-[#090d16]/90 backdrop-blur-md border-t border-slate-800/80">
          
          {/* Barra de Grabación de Audio Activa */}
          {isRecordingAudio ? (
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 bg-rose-950/80 border border-rose-600/70 rounded-2xl p-3 shadow-2xl animate-pulse">
              <div className="flex items-center gap-3 text-rose-200 text-sm">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="font-semibold font-mono">
                  Grabando Audio... 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelRecordingAudio}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1"
                >
                  <X size={16} />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={stopRecordingAudio}
                  className="p-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1 shadow-lg shadow-rose-600/30"
                >
                  <Send size={14} />
                  <span>Enviar Audio</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Chip de archivo adjunto previo a enviar */}
              {attachedFile && (
                <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 border border-sky-500/40 rounded-xl text-xs text-sky-200">
                  {attachedFile.previewUrl ? (
                    <img src={attachedFile.previewUrl} alt="Thumb" className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <FileText size={16} className="text-sky-400" />
                  )}
                  <span className="truncate flex-1">{attachedFile.name} ({(attachedFile.size / 1024).toFixed(0)} KB)</span>
                  <button 
                    onClick={() => setAttachedFile(null)} 
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              )}

              <div className="max-w-3xl mx-auto relative flex items-end gap-1.5 bg-slate-900/90 border border-slate-700/70 focus-within:border-sky-500/80 rounded-2xl p-2 shadow-2xl transition-all">
                
                {/* Botón Adjuntar Archivo */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 transition-colors"
                  title="Adjuntar PDF, Word, Excel o imagen"
                >
                  <Paperclip size={18} />
                </button>

                {/* Botón Cámara */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 transition-colors"
                  title="Tomar foto con la cámara"
                >
                  <Camera size={18} />
                </button>

                {/* Botón Micrófono para Grabar Nota de Voz con Whisper */}
                <button
                  onClick={startRecordingAudio}
                  className="p-2.5 rounded-xl bg-slate-800/90 text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                  title="Grabar nota de voz para transcripción con Whisper"
                  aria-label="Grabar audio con Whisper"
                >
                  <Mic size={18} />
                </button>

                {/* Textarea Auto-expandible con Escucha Activa */}
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputMessage}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={attachedFile ? "Escribe qué deseas analizar de este archivo..." : "Escribe o graba un audio para Susybot..."}
                  className="flex-1 max-h-40 bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-[15px] resize-none focus:outline-hidden py-2 px-1 leading-relaxed"
                />

                {/* Botón Enviar */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={(!inputMessage.trim() && !attachedFile) || isLoading}
                  className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    (inputMessage.trim() || attachedFile) && !isLoading
                      ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30 hover:scale-105 active:scale-95 cursor-pointer"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}

          <div className="text-center mt-2 text-[10px] text-slate-500 flex flex-wrap items-center justify-center gap-1.5">
            <span>Susybot AI</span>
            <span>•</span>
            <span>Tecnología desarrollada por <strong className="text-sky-400 font-medium">MyJNexoraVisual</strong></span>
            <span>•</span>
            <span>Ituzaingó, Corrientes</span>
          </div>
        </div>
      </main>

      {/* ================================================================= */}
      {/* ================================================================= */}
      {/* 🔄 MODAL: SINCRONIZAR MULTI-DISPOSITIVO (PC ↔ CELULAR)           */}
      {/* ================================================================= */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-center">
            <button
              onClick={handleCloseSyncModal}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/20">
              <Laptop size={24} className="text-white" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Sincronizar PC y Celular</h3>
            <p className="text-xs text-slate-400 mb-4">
              Comparte tus conversaciones entre tu computadora y tu celular al instante.
            </p>

            {/* Modal Adaptativo Inteligente por Tipo de Dispositivo */}
            {typeof window !== 'undefined' && (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768) ? (
              /* ========================================================= */
              /* 📱 VISTA CELULAR: INGRESAR PIN DE FORMA DIRECTA Y LIMPIA */
              /* ========================================================= */
              <div className="space-y-3 text-left">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <label className="block text-xs font-semibold text-slate-200 mb-2">
                    Ingresa el PIN de 6 dígitos que ves en tu PC:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={syncInputId.trim()}
                      onChange={(e) => setSyncInputId(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej: 849201"
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-indigo-500/60 text-xl font-mono tracking-widest text-center text-emerald-400 placeholder-slate-600 focus:outline-hidden focus:border-indigo-400"
                    />
                    <button
                      onClick={() => {
                        const val = syncInputId.trim();
                        if (val.length === 6) {
                          const currentUid = localStorage.getItem("susybot_user_id") || userId;
                          fetch("/api/sync", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ pin_code: val, user_id: currentUid, session_id: currentSessionId })
                          }).then(async (res) => {
                            if (res.ok) {
                              setSyncSuccessMsg("🎉 ¡Computadora vinculada con éxito!");
                              setTimeout(() => {
                                setSyncSuccessMsg("");
                                handleCloseSyncModal();
                              }, 1500);
                            } else {
                              const err = await res.json();
                              setSyncSuccessMsg(`⚠️ ${err.error || 'PIN no encontrado o expirado'}`);
                            }
                          });
                        } else {
                          setSyncSuccessMsg("⚠️ Escribe los 6 dígitos del PIN.");
                        }
                      }}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
                    >
                      Vincular
                    </button>
                  </div>
                </div>

                <div className="text-center pt-1">
                  <button
                    onClick={() => {
                      handleCloseSyncModal();
                      startLiveVision("environment");
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Camera size={15} />
                    <span>O Escanear el QR con la Cámara de Titán Live</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ========================================================= */
              /* 🖥️ VISTA PC: MOSTRAR DIRECTAMENTE EL CÓDIGO QR Y EL PIN  */
              /* ========================================================= */
              <div>
                <div className="bg-white p-3.5 rounded-2xl inline-block mb-3 shadow-xl relative min-w-[180px] min-h-[180px] flex items-center justify-center">
                  {isGeneratingSyncQr ? (
                    <div className="flex flex-col items-center gap-2 p-6">
                      <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                      <span className="text-xs font-mono text-slate-800">Generando QR...</span>
                    </div>
                  ) : syncQrUrl ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(syncQrUrl)}`}
                      alt="QR Sincronización Efímero"
                      className="w-40 h-40 mx-auto rounded-lg"
                    />
                  ) : (
                    <span className="text-xs text-slate-600">Error al cargar QR</span>
                  )}
                </div>

                {syncPinCode && (
                  <div className="mb-3 p-3.5 rounded-2xl bg-indigo-950/90 border border-indigo-500/60 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider">Tu PIN de vinculación:</span>
                    <span className="text-3xl font-extrabold font-mono tracking-widest text-emerald-400 mt-1">{syncPinCode}</span>
                    <span className="text-[10px] text-slate-400 mt-1">Abre Susybot en tu celular e ingresa este PIN o escanea el QR</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-indigo-300 bg-indigo-950/60 py-1.5 px-3 rounded-xl border border-indigo-800/60 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Esperando enlace desde tu celular...</span>
                </div>

                <button
                  onClick={() => {
                    if (syncQrUrl) {
                      navigator.clipboard.writeText(syncQrUrl);
                      setSyncSuccessMsg("¡Enlace copiado! Pégalo en tu celular.");
                      setTimeout(() => setSyncSuccessMsg(""), 3000);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <Copy size={14} />
                  <span>Copiar Enlace Directo</span>
                </button>
              </div>
            )}

            {syncSuccessMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-center gap-1.5 animate-fade-in">
                <Check size={14} />
                <span>{syncSuccessMsg}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 📲 MODAL: AUTORIZAR EMPAREJAMIENTO DESDE EL CELULAR               */}
      {/* ================================================================= */}
      {showAuthorizeMobileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/60 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
              <Laptop size={28} className="text-white" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">¿Vincular con tu Computadora?</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Has escaneado el código QR de Susybot. Al autorizar, tus conversaciones y sesiones se transferirán a tu PC de forma segura y sin contraseñas.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleAuthorizeFromMobile}
                disabled={isAuthorizingSync}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isAuthorizingSync ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                <span>{isAuthorizingSync ? "Autorizando..." : "✅ Autorizar Sincronización"}</span>
              </button>

              <button
                onClick={() => {
                  setShowAuthorizeMobileModal(false);
                  setPendingAuthToken(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 📱 BANNER FLOTANTE DE INSTALACIÓN PWA                             */}
      {/* ================================================================= */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 bg-slate-900/95 border border-sky-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">Instalar Susybot en tu celular</h4>
              <p className="text-[10px] text-slate-400 truncate">Acceso rápido sin abrir navegador</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallApp}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/30 transition-all"
            >
              Instalar
            </button>
            <button
              onClick={handleDismissInstall}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 🍎 MODAL INSTRUCCIONES iOS SAFARI                                 */}
      {/* ================================================================= */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-500/20">
              <Sparkles size={24} className="text-white" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Instalar en iPhone / iPad</h3>
            <div className="text-xs text-slate-300 text-left space-y-2.5 mb-5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <p>1. Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) en Safari.</p>
              <p>2. Desplázate hacia abajo y selecciona <strong>"Agregar a Inicio"</strong>.</p>
              <p>3. Toca <strong>"Agregar"</strong> arriba a la derecha y ¡listo!</p>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 🎛️ MODAL: CALIBRADOR Y AFINADOR DE VOZ DE SUSYBOT               */}
      {/* ================================================================= */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-sky-700/60 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-left">
            <button
              onClick={() => setShowVoiceModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Sliders size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Calibrador de Voz de Susybot</h3>
                <p className="text-xs text-slate-400">Personaliza la voz neuronal, el tono y la velocidad</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Selector de Voz */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Voz y Acento Regional</label>
                <select
                  value={selectedVoiceUri}
                  onChange={(e) => {
                    setSelectedVoiceUri(e.target.value);
                    localStorage.setItem("susybot_voice_uri", e.target.value);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
                >
                  {availableVoices.map((v) => {
                    let flag = "🌐";
                    let label = v.name;
                    const l = v.lang.toLowerCase();
                    if (l.includes("ar") || l === "es-ar" || v.name.toLowerCase().includes("argentina")) {
                      flag = "🇦🇷";
                      label = `Susybot Ituzaingó (${v.name})`;
                    } else if (l.includes("us") || l.includes("419") || l.includes("mx") || l.includes("co") || v.name.toLowerCase().includes("google español")) {
                      flag = "🌎";
                      label = `Español Latino Neutro (${v.name})`;
                    } else if (l.includes("es") || l === "es-es") {
                      flag = "🇪🇸";
                      label = `Español España (${v.name})`;
                    }
                    return (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {flag} {label}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 <strong>Tip para Celular:</strong> Si tu teléfono no tiene acento argentino instalado, selecciona la opción <strong>🌎 Español Latino Neutro</strong> para una dicción suave y natural sin modismos europeos.
                </p>
              </div>

              {/* Control de Tono */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Tono (Grave y Maduro ↔ Agudo):</span>
                  <span className="font-mono text-sky-400">{voicePitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.10"
                  step="0.02"
                  value={voicePitch}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVoicePitch(val);
                    localStorage.setItem("susybot_voice_pitch", String(val));
                  }}
                  className="w-full accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>Más grave y cálido</span>
                  <span>Estándar (0.92)</span>
                  <span>Más agudo</span>
                </div>
              </div>

              {/* Control de Velocidad */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Velocidad de Lectura:</span>
                  <span className="font-mono text-sky-400">{voiceRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.15"
                  step="0.02"
                  value={voiceRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVoiceRate(val);
                    localStorage.setItem("susybot_voice_rate", String(val));
                  }}
                  className="w-full accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>Pausada y clara</span>
                  <span>Normal (0.94x)</span>
                  <span>Rápida</span>
                </div>
              </div>

              {/* Botón Probar Voz */}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={handleTestVoice}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                >
                  <Volume2 size={15} />
                  <span>▶️ Probar Esta Voz</span>
                </button>
                <button
                  onClick={() => setShowVoiceModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 👁️ MODAL: NORA TITÁN LIVE VISION (CÁMARA & VOZ FULL-DUPLEX)      */}
      {/* ================================================================= */}
      {showLiveVisionModal && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden animate-fade-in">
          
          {/* Canvas oculto para capturas de frame */}
          <canvas ref={liveCanvasRef} className="hidden" />

          {/* Top Bar HUD */}
          <div className="p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping shadow-lg shadow-rose-500/50" />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Susybot Live
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-600 text-rose-300 uppercase">En Vivo</span>
                </h3>
                <p className="text-[10px] text-slate-300 font-mono">Modo: {activeMode.toUpperCase()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleLiveCamera}
                className="p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer"
                title="Cambiar Cámara (Frontal / Trasera)"
              >
                <FlipHorizontal size={18} />
              </button>

              <button
                onClick={stopLiveVision}
                className="p-2.5 rounded-full bg-rose-600/90 text-white hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/40 cursor-pointer"
                title="Cerrar Live Vision"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Visor de Video en Tiempo Real con HUD Cyberpunk */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            <video
              ref={(el) => {
                liveVideoRef.current = el;
                if (el && liveMediaStreamRef.current && el.srcObject !== liveMediaStreamRef.current) {
                  el.srcObject = liveMediaStreamRef.current;
                  el.play().catch(() => {});
                }
              }}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${liveFacingMode === "user" ? "scale-x-[-1]" : ""}`}
            />

            {/* Marco Guía Institucional para Documentos y Reclamos */}
            <div className="absolute inset-6 sm:inset-12 pointer-events-none border border-sky-400/30 rounded-3xl flex flex-col justify-between p-4 shadow-inner">
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-3 border-l-3 border-sky-400 rounded-tl-xl" />
                <div className="w-8 h-8 border-t-3 border-r-3 border-sky-400 rounded-tr-xl" />
              </div>
              <div className="flex flex-col items-center justify-center text-center">
                <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-sky-400/40 text-sky-200 text-xs font-medium backdrop-blur-md">
                  Apunta a formularios, licencias, boletas o vía pública
                </span>
              </div>
              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-3 border-l-3 border-sky-400 rounded-bl-xl" />
                <div className="w-8 h-8 border-b-3 border-r-3 border-sky-400 rounded-br-xl" />
              </div>
            </div>

            {/* Badge de análisis en progreso */}
            {isAnalyzingFrame && (
              <div className="absolute top-6 px-4 py-1.5 rounded-full bg-black/80 border border-rose-500/60 text-rose-300 text-xs font-mono backdrop-blur-md flex items-center gap-2 animate-pulse">
                <Radio size={14} className="animate-spin" />
                <span>Susybot está analizando lo que ve...</span>
              </div>
            )}
          </div>

          {/* Subtítulos y Controles Inferiores */}
          <div className="p-4 z-20 bg-gradient-to-t from-black via-black/90 to-transparent space-y-3">
            
            {/* Globo de Subtítulos de Susy */}
            <div className="max-w-xl mx-auto p-3.5 rounded-2xl bg-black/80 border border-rose-500/40 text-slate-100 text-xs sm:text-sm backdrop-blur-md shadow-2xl leading-relaxed text-center font-medium">
              <span className="text-sky-400 font-bold mr-1.5">Susybot:</span>
              {liveSubtitles}
            </div>

            {/* Barra de Entrada / Pregunta Rápida */}
            <div className="max-w-xl mx-auto flex items-center gap-2">
              <button
                onClick={handleLiveVoiceAsk}
                className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 hover:bg-slate-700 text-rose-400 hover:text-white transition-all backdrop-blur-md cursor-pointer shrink-0 shadow-md shadow-rose-500/10"
                title="Hablar por micrófono a Susybot"
              >
                <Mic size={18} />
              </button>

              <input
                type="text"
                value={liveCustomPrompt}
                onChange={(e) => setLiveCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && liveCustomPrompt.trim()) {
                    captureAndAnalyzeFrame(liveCustomPrompt);
                    setLiveCustomPrompt("");
                  }
                }}
                placeholder="Pregúntale a Susybot sobre lo que estás enfocando..."
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-rose-500 backdrop-blur-md"
              />

              <button
                onClick={() => {
                  captureAndAnalyzeFrame(liveCustomPrompt || "Explica detalladamente qué estás viendo en la cámara.");
                  if (liveCustomPrompt) setLiveCustomPrompt("");
                }}
                disabled={isAnalyzingFrame}
                className="p-3 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Eye size={18} />
                <span className="hidden sm:inline">Analizar</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Modal de Llamada de Voz en Vivo en Tiempo Real (Desmontado Absoluto si está cerrado) */}
      {showRealtimeCallModal && (
        <SusyRealtimeCallModal
          isOpen={showRealtimeCallModal}
          onClose={() => setShowRealtimeCallModal(false)}
          selectedVoiceUri={selectedVoiceUri}
          activeMode={activeMode}
          initialHistory={messages
            .filter(m => m.content && typeof m.content === "string" && !m.content.includes("Escuchando"))
            .slice(-6)
            .map(m => ({
              role: ((m.role as string) === "assistant" || (m.role as string) === "model") ? "assistant" : "user",
              content: m.content
            }))}
          onMessageLogged={(userText, assistantText) => {
            if (!userText && !assistantText) return;
            setMessages((prev) => [
              ...prev,
              ...(userText ? [{ role: "user" as const, content: userText, created_at: new Date().toISOString() }] : []),
              ...(assistantText ? [{ role: "assistant" as const, content: assistantText, created_at: new Date().toISOString() }] : [])
            ]);
          }}
        />
      )}
    </div>
  );
}
