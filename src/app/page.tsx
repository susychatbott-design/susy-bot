"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  User,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ShieldAlert,
  Building2,
  Store,
  Newspaper,
  Calendar,
  FileCheck2,
  BarChart3,
  Sparkles,
} from "lucide-react";

// 1. Ecosistema Sensorial de Hooks Desacoplados (Fase 1)
import { useSusyChat, SusyAttachedFile } from "@/hooks/useSusyChat";
import { useSusyVision } from "@/hooks/useSusyVision";
import {
  useSusyAudio,
  selectBestArgentineNaturalVoice,
} from "@/hooks/useSusyAudio";
import { useSusyVAD } from "@/hooks/useSusyVAD";
import { useSusyDeviceCapabilities } from "@/hooks/useSusyDeviceCapabilities";
import { useSusyGestures } from "@/hooks/useSusyGestures";

// 2. Motor de Perfiles Cognitivos (Fase 2)
import { SusyProfileId, resolveCanonicalProfileId } from "@/lib/prompts";

// 3. Componentes de Interfaz Multimodal Accesible DUA (Fase 3)
import {
  SusyHeader,
  SusyControlFooter,
  SusyVisionViewport,
  SusyTEABoard,
  extractActivePictoTokens,
  SusyHistoryDrawer,
  SusyShareQRModal,
} from "@/components/susy-ui";

// 4. Core Municipal de Ituzaingó (Preservado al 100%)
import MunicipalOfficesGrid from "@/components/Susy/MunicipalOfficesGrid";
import MunicipalLocationCard from "@/components/Susy/MunicipalLocationCard";
import MunicipalCommerceGuide from "@/components/Susy/MunicipalCommerceGuide";
import MunicipalPressModal from "@/components/Susy/MunicipalPressModal";
import MunicipalDocumentModal from "@/components/Susy/MunicipalDocumentModal";
import SusyEmergencyModal from "@/components/Susy/SusyEmergencyModal";
import SusyRealtimeCallModal from "@/components/Susy/SusyRealtimeCallModal";
import { FunctionPlotter } from "@/components/Susy/FunctionPlotter";
import { MunicipalDepartment } from "@/lib/susy/municipal/departmentsData";
import {
  municipalStore,
  MunicipalTurno,
  PermisoProvisorio,
} from "@/lib/susy/municipal/municipalActions";
import { syncOnlineDeltasIfAvailable } from "@/lib/susy/offline/knowledgeCache";

/**
 * Re-exportación de compatibilidad para selectores de voz argentina
 */
export function getBestArgentineVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  return selectBestArgentineNaturalVoice(voices) || undefined;
}

/**
 * Extrae expresiones matemáticas `[PLOT: f(x)]` para el graficador interactivo
 */
function extractPlotExpression(content: string): string | null {
  const match = /\[PLOT:\s*([^\]]+)\]/i.exec(content);
  return match ? match[1].trim() : null;
}

/**
 * ============================================================================
 * 🏛️ SUSY BOT — ORQUESTADOR MODULAR DE CAPA SUPERIOR (PROYECTO SUSY TANK)
 * Municipalidad de Ituzaingó, Corrientes • Arquitectura Edge-First & DUA
 * ============================================================================
 */
export default function SusyBotPage() {
  // Estado local de entrada y adjuntos multimodales
  const [inputText, setInputText] = useState<string>("");
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [attachedFileMeta, setAttachedFileMeta] = useState<SusyAttachedFile | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [autoSpeakResponses, setAutoSpeakResponses] = useState<boolean>(false);

  // Estados de Modales y Paneles Municipales (Defensa Civil, Guía Comercial, Prensa, Turnos, SOS)
  const [showOfficesGrid, setShowOfficesGrid] = useState<boolean>(false);
  const [activeDepartment, setActiveDepartment] = useState<MunicipalDepartment | null>(null);
  const [showCommerceGuideModal, setShowCommerceGuideModal] = useState<boolean>(false);
  const [showPressModal, setShowPressModal] = useState<boolean>(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [showRealtimeCallModal, setShowRealtimeCallModal] = useState<boolean>(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [showShareQRModal, setShowShareQRModal] = useState<boolean>(false);
  const [showCivilDefenseBanner, setShowCivilDefenseBanner] = useState<boolean>(false);
  const [selectedDocumentModal, setSelectedDocumentModal] = useState<{
    type: "turno" | "permiso";
    turno?: MunicipalTurno;
    permiso?: PermisoProvisorio;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastSpokenMessageIdRef = useRef<string | null>(null);

  // =========================================================================
  // 1. INICIALIZACIÓN DE HOOKS SENSORIALES Y CONVERSACIONALES
  // =========================================================================
  const deviceCapabilities = useSusyDeviceCapabilities({
    userName: "Vecino",
    autoRequestWakeLock: false,
    enableGeolocation: true,
  });

  const chat = useSusyChat({
    initialMode: "executive",
    agentId: "susy-ituzaingo",
  });

  const vision = useSusyVision();

  const audio = useSusyAudio({
    defaultMode: chat.activeMode,
    onTranscriptionComplete: (transcribedText: string) => {
      if (!transcribedText.trim()) return;
      handleSendUserQuery(transcribedText);
    },
  });

  const [vadEnabled, setVadEnabled] = useState<boolean>(false);
  const vad = useSusyVAD({
    enabled: vadEnabled || audio.isSpeaking || autoSpeakResponses,
    onSpeechStart: () => {
      // Interrupción inmediata (0ms) en el callback directo del detector VAD
      audio.stopPlayback();
      if (chat.isStreaming || chat.isLoading) {
        chat.stopStreaming();
      }
    },
    onSpeechEnd: async (wavBlob: Blob) => {
      await audio.transcribeAudioBlob(wavBlob);
    },
  });

  // 🚨 HOTFIX BARGE-IN REACTIVO: Escucha vad.userSpeaking y corta instantáneamente TTS + Streaming LLM
  useEffect(() => {
    if (!vad.userSpeaking) return;

    if (audio.isSpeaking || audio.isPlaying) {
      audio.stopPlayback();
    }
    if (chat.isStreaming || chat.isLoading) {
      chat.stopStreaming();
    }
  }, [
    vad.userSpeaking,
    audio.isSpeaking,
    audio.isPlaying,
    audio.stopPlayback,
    chat.isStreaming,
    chat.isLoading,
    chat.stopStreaming,
  ]);

  // Activación física (3 sacudidas o presión de 3 segundos en pantalla) para Modo Lazarillo
  const activateLazarilloMode = useCallback(async () => {
    chat.setMode("lazarillo");
    audio.setCognitiveMode("lazarillo");
    setAutoSpeakResponses(true);
    await deviceCapabilities.requestWakeLock();
    if (!vision.isCameraActive) {
      await vision.startCamera("environment");
    }
    await audio.speakText(
      "Modo Lazarillo y Cámara Titán activados. Paso frontal en escaneo.",
      undefined,
      "lazarillo"
    );
  }, [chat, audio, deviceCapabilities, vision]);

  useSusyGestures({
    onTriggerLazarillo: () => {
      activateLazarilloMode().catch(() => {});
    },
    enabled: true,
  });

  // Sincronización inicial de caché offline del Digesto Municipal
  useEffect(() => {
    syncOnlineDeltasIfAvailable().catch(() => {});
  }, []);

  // Auto-scroll suave ante nuevos fragmentos de streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, chat.currentResponseStream]);

  // Lectura automática TTS cuando concluye una respuesta en Modo Lazarillo o si el vecino activó voz automática
  useEffect(() => {
    if (chat.isStreaming || chat.isLoading || chat.messages.length === 0) return;
    const lastMsg = chat.messages[chat.messages.length - 1];
    if (lastMsg.role !== "assistant" || !lastMsg.content.trim()) return;

    const canonicalMode = resolveCanonicalProfileId(chat.activeMode);
    if ((canonicalMode === "lazarillo" || autoSpeakResponses) && lastSpokenMessageIdRef.current !== lastMsg.id) {
      lastSpokenMessageIdRef.current = lastMsg.id;
      audio.speakText(lastMsg.content, undefined, chat.activeMode).catch(() => {});
    }
  }, [chat.messages, chat.isStreaming, chat.isLoading, chat.activeMode, autoSpeakResponses, audio]);

  // =========================================================================
  // 2. MANEJADORES MULTIMODALES Y MUNICIPALES
  // =========================================================================
  const handleModeChange = useCallback(
    async (nextMode: SusyProfileId): Promise<void> => {
      chat.setMode(nextMode);
      audio.setCognitiveMode(nextMode);

      if (nextMode === "lazarillo") {
        setAutoSpeakResponses(true);
        await deviceCapabilities.requestWakeLock();
        if (!vision.isCameraActive) {
          await vision.startCamera("environment");
        }
      } else {
        if (vision.isCameraActive) {
          vision.stopCamera();
        }
      }
    },
    [chat, audio, deviceCapabilities, vision]
  );

  const handleToggleCamera = useCallback(async (): Promise<void> => {
    if (vision.isCameraActive) {
      vision.stopCamera();
    } else {
      await deviceCapabilities.requestWakeLock();
      await vision.startCamera("environment");
    }
  }, [vision, deviceCapabilities]);

  const handleToggleRecording = useCallback(async (): Promise<void> => {
    if (audio.isRecording) {
      await audio.stopRecordingAndTranscribe();
    } else {
      await audio.startRecording();
    }
  }, [audio]);

  const handleSelectImage = useCallback(
    (base64: string | null, fileName?: string, mimeType?: string): void => {
      setSelectedImageBase64(base64);
      if (base64) {
        setAttachedFileMeta({
          name: fileName || "captura_vecinal.jpg",
          type: mimeType || "image/jpeg",
          base64,
          previewUrl: base64,
          mimeType: mimeType || "image/jpeg",
        });
      } else {
        setAttachedFileMeta(null);
      }
    },
    []
  );

  const handleSendUserQuery = useCallback(
    async (overrideText?: string): Promise<void> => {
      const textToSend = (overrideText !== undefined ? overrideText : inputText).trim();
      if (!textToSend && !selectedImageBase64 && !vision.isCameraActive) return;

      if (overrideText === undefined) {
        setInputText("");
      }

      let imagePayload = selectedImageBase64;
      let opticalSummaryPayload = vision.telemetry?.summaryText || null;

      if (vision.isCameraActive && !imagePayload) {
        const snapshot = await vision.captureAndAnalyze();
        imagePayload = snapshot.imageBase64;
        opticalSummaryPayload = snapshot.formattedSummary;
      }

      const filePayload = attachedFileMeta;
      setSelectedImageBase64(null);
      setAttachedFileMeta(null);

      await chat.sendMessage({
        text: textToSend || "Analizá lo que enfoca la cámara.",
        userName: deviceCapabilities.userName,
        imageBase64: imagePayload,
        visualTelemetry: opticalSummaryPayload,
        deviceLocation: deviceCapabilities.location,
        attachedFile: filePayload,
      });
    },
    [inputText, selectedImageBase64, attachedFileMeta, vision, chat, deviceCapabilities]
  );

  const handleCopyMessage = (id: string, text: string): void => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedMsgId(id);
        setTimeout(() => setCopiedMsgId(null), 2000);
      });
    }
  };

  // Emisión rápida de Comprobantes de Turno o Permisos Provisorios desde el Core Municipal
  const handleIssueQuickTurno = (deptId?: string): void => {
    const dept = deptId || activeDepartment?.id || "transito";
    const nuevoTurno = municipalStore.addTurno({
      departmentId: dept,
      departmentName: activeDepartment?.name || "Dirección de Tránsito y Seguridad Vial",
      citizenName: deviceCapabilities.userName || "Vecino de Ituzaingó",
      citizenDni: "Solicitud Digital Susy Bot",
      citizenPhone: "3786-000000",
      procedureType: "Atención Presencial / Licencia de Conducir",
      dateStr: new Date(Date.now() + 86400000).toLocaleDateString("es-AR"),
      timeSlot: "08:30 hs",
      requirements: [
        "DNI original y fotocopia con domicilio en Ituzaingó",
        "Boleta CENAT abonada previamente (si corresponde a Tránsito)",
      ],
    });
    setSelectedDocumentModal({ type: "turno", turno: nuevoTurno });
  };

  const handleIssueQuickPermiso = (): void => {
    const nuevoPermiso = municipalStore.addPermiso({
      tipo: "uso_espacio_publico",
      titularNombre: deviceCapabilities.userName || "Vecino de Ituzaingó",
      titularDni: "Solicitud Digital Susy Bot",
      titularDomicilio: "Ejido Urbano de Ituzaingó, Corrientes",
      titularTelefono: "3786-000000",
      motivoDetalle: "Solicitud gestionada digitalmente mediante Susy Bot Municipal.",
      validezHoras: 72,
    });
    setSelectedDocumentModal({ type: "permiso", permiso: nuevoPermiso });
  };

  // Detectar si debemos desplegar el Tablero TEA (si el modo activo es TEA o si el último mensaje contiene [PICTO: ...])
  const lastAssistantMessage = useMemo(() => {
    for (let i = chat.messages.length - 1; i >= 0; i--) {
      if (chat.messages[i].role === "assistant") {
        return chat.messages[i].content;
      }
    }
    return "";
  }, [chat.messages]);

  const canonicalMode = resolveCanonicalProfileId(chat.activeMode);
  const hasPictoTokensInLastReply = useMemo(
    () => extractActivePictoTokens(lastAssistantMessage).length > 0,
    [lastAssistantMessage]
  );
  const shouldShowTEABoard = canonicalMode === "tea" || hasPictoTokensInLastReply;

  // =========================================================================
  // 3. ESTRUCTURA DE RENDERIZADO FLUIDA, ADAPTATIVA Y ACCESIBLE (DUA)
  // =========================================================================
  return (
    <div className="min-h-screen h-dvh w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none sm:select-text">
      {/* CABECERA SUPERIOR DINÁMICA (ONLINE/OFF-GRID, PERFILES COGNITIVOS, SOS HÍBRIDO) */}
      <SusyHeader
        currentMode={chat.activeMode}
        onModeChange={(mode) => {
          handleModeChange(mode).catch(() => {});
        }}
        onOpenCallModal={() => setShowRealtimeCallModal(true)}
        onOpenShareModal={() => setShowShareQRModal(true)}
        onToggleHistory={() => setShowHistoryDrawer(true)}
        onTriggerSOSModal={() => setShowEmergencyModal(true)}
        onOpenCommerceGuide={() => setShowCommerceGuideModal(true)}
        onOpenPressModal={() => setShowPressModal(true)}
        onToggleOfficesGrid={() => setShowOfficesGrid((prev) => !prev)}
        messages={chat.messages}
        isStreaming={chat.isStreaming}
        audioEngine={audio.activeEngine}
        deviceLatitude={deviceCapabilities.location?.latitude ?? null}
        deviceLongitude={deviceCapabilities.location?.longitude ?? null}
      />

      {/* VISOR INMERSIVO DE CÁMARA TITÁN (BOUNDING BOXES TENSORFLOW.JS + ALERTAS 360°) */}
      <SusyVisionViewport
        isCameraActive={vision.isCameraActive}
        onCloseCamera={vision.stopCamera}
        videoRef={vision.videoRef}
        canvasRef={vision.canvasRef}
        alerts={vision.alerts}
        telemetry={vision.telemetry}
        isProcessing={vision.isProcessing}
        criticalHazardDetected={vision.criticalHazardDetected}
      />

      {/* ÁREA CENTRAL DINÁMICA (CONMUTACIÓN ENTRE PANELES MUNICIPALES, CONVERSACIÓN Y ACCESIBILIDAD) */}
      <main
        className={`flex-1 overflow-y-auto pt-16 px-3 sm:px-6 ${
          shouldShowTEABoard ? "pb-52" : "pb-28"
        }`}
      >
        <div className="max-w-4xl mx-auto py-4 space-y-4">
          {/* BARRA RÁPIDA DE MÓDULOS MUNICIPALES (DEFENSA CIVIL, SECRETARÍAS, COMERCIOS, PRENSA, GESTIÓN) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setShowOfficesGrid((v) => !v)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
                showOfficesGrid
                  ? "bg-indigo-600 text-white border-indigo-400"
                  : "bg-slate-900/90 text-slate-200 border-white/10 hover:bg-slate-800"
              }`}
            >
              <Building2 size={14} className="text-indigo-400" />
              <span>Secretarías y Oficinas</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCivilDefenseBanner((v) => !v)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
                showCivilDefenseBanner
                  ? "bg-amber-600/30 text-amber-200 border-amber-400/50"
                  : "bg-slate-900/90 text-amber-300 border-amber-500/20 hover:bg-slate-800"
              }`}
            >
              <ShieldAlert size={14} />
              <span>Defensa Civil & Clima</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCommerceGuideModal(true)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/90 text-emerald-300 border border-emerald-500/20 hover:bg-slate-800 flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
            >
              <Store size={14} />
              <span>Guía Comercial</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPressModal(true)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/90 text-sky-300 border border-sky-500/20 hover:bg-slate-800 flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
            >
              <Newspaper size={14} />
              <span>Prensa Oficial</span>
            </button>

            <button
              type="button"
              onClick={() => handleIssueQuickTurno()}
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/90 text-purple-300 border border-purple-500/20 hover:bg-slate-800 flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
            >
              <Calendar size={14} />
              <span>Emitir Turno QR</span>
            </button>

            <Link
              href="/dashboard"
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/90 text-slate-300 border border-white/10 hover:bg-slate-800 flex items-center gap-1.5 shrink-0 transition-all"
            >
              <BarChart3 size={14} className="text-indigo-400" />
              <span>Tablero Gestión</span>
            </Link>
          </div>

          {/* PANEL DE DEFENSA CIVIL Y ALERTA HIDROMETEOROLÓGICA DE ITUZAINGÓ */}
          {showCivilDefenseBanner && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-100 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  <ShieldAlert size={16} />
                  <span>Defensa Civil Ituzaingó • Monitoreo Costero y Yacyretá</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
                >
                  Guardias 103 / 100 / 107
                </button>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                Vigilancia preventiva activa sobre nivel hidrométrico del Río Paraná, índice de riesgo
                de incendios forestales y alertas meteorológicas en Ituzaingó. Ante caída de postes,
                anegamientos o urgencias en vía pública, presioná <strong>SOS</strong> o reportalo en el
                chat para emitir un ticket prioritario de Defensa Civil.
              </p>
            </div>
          )}

          {/* GRILLA INTERACTIVA DE LAS 12 SECRETARÍAS Y OFICINAS MUNICIPALES */}
          {showOfficesGrid && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-xl space-y-3">
              <MunicipalOfficesGrid
                activeDepartmentId={activeDepartment?.id || null}
                onSelectDepartment={(dept) => {
                  setActiveDepartment(dept);
                }}
                onRequestTurno={(deptId) => handleIssueQuickTurno(deptId)}
                onRequestPermiso={() => handleIssueQuickPermiso()}
                onRequestGacetillas={() => setShowPressModal(true)}
                onRequestComercio={() => setShowCommerceGuideModal(true)}
              />

              {activeDepartment && (
                <MunicipalLocationCard
                  department={activeDepartment}
                  onAskSusy={(prompt) => {
                    handleSendUserQuery(prompt).catch(() => {});
                  }}
                  onRequestTurno={(deptId) => handleIssueQuickTurno(deptId)}
                />
              )}
            </div>
          )}

          {/* BIENVENIDA CONCIERGE MUNICIPAL CUANDO NO HAY MENSAJES EN LA SESIÓN */}
          {chat.messages.length === 0 && (
            <section className="p-6 rounded-3xl bg-gradient-to-b from-slate-900/95 to-slate-950 border border-white/10 shadow-2xl space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">
                    <Sparkles size={12} />
                    <span>CONCIERGE MUNICIPAL • ITUZAINGÓ, CORRIENTES</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    ¡Hola! Soy Susy Bot, tu asistente municipal
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Consultá requisitos verificados del Digesto Municipal, costos de Licencia de
                    Conducir (CENAT + Tasa), farmacias de turno, agenda cultural y turística en vivo,
                    o registrá un reclamo urbano con número de seguimiento oficial.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoSpeakResponses((v) => !v)}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 shrink-0 cursor-pointer transition-all ${
                    autoSpeakResponses
                      ? "bg-emerald-600/25 border-emerald-500/50 text-emerald-300"
                      : "bg-slate-800/80 border-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  {autoSpeakResponses ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span>{autoSpeakResponses ? "Voz Automática Activa" : "Activar Lectura por Voz"}</span>
                </button>
              </div>

              {/* SUGERENCIAS RÁPIDAS VERIFICADAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    title: "🪪 Licencia de Conducir y CENAT",
                    prompt:
                      "¿Cuáles son los requisitos, horarios y costos actuales para renovar u obtener la Licencia Nacional de Conducir en Ituzaingó?",
                  },
                  {
                    title: "💡 Registrar Reclamo Urbano (Luminaria / Bacheo)",
                    prompt:
                      "Quiero registrar un reclamo municipal por una luminaria LED apagada en mi cuadra.",
                  },
                  {
                    title: "🏥 Hospital Billinghurst y Farmacias de Turno",
                    prompt:
                      "¿Qué farmacias están en Ituzaingó y cómo me comunico con la guardia del Hospital Dr. Ricardo Billinghurst?",
                  },
                  {
                    title: "🏖️ Turismo Iberá Portal Cambyretá y Agenda Hoy",
                    prompt:
                      "¿Qué eventos culturales hay vigentes hoy en Ituzaingó y cómo visitar el Portal Cambyretá y la Represa Yacyretá?",
                  },
                ].map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      handleSendUserQuery(item.prompt).catch(() => {});
                    }}
                    className="text-left p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {item.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* FLUJO CONVERSACIONAL MULTIMODAL */}
          <div className="space-y-4" role="log" aria-live="polite">
            {chat.messages.map((msg) => {
              const isUser = msg.role === "user";
              const plotExpr = !isUser ? extractPlotExpression(msg.content) : null;

              return (
                <article
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-2xl bg-indigo-600/25 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-1">
                      <Bot size={16} className="text-indigo-300" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-br-xs"
                        : "bg-slate-900/95 border border-white/10 text-slate-100 rounded-bl-xs"
                    }`}
                  >
                    {msg.imageBase64 && (
                      <div className="mb-2.5">
                        <img
                          src={msg.imageBase64}
                          alt="Evidencia visual adjunta"
                          className="max-h-56 rounded-xl border border-white/15 object-cover"
                        />
                      </div>
                    )}

                    <div className="prose prose-invert prose-sm max-w-none break-words">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content || (chat.isStreaming ? "Procesando consulta municipal..." : "")}
                      </ReactMarkdown>
                    </div>

                    {plotExpr && (
                      <div className="mt-3">
                        <FunctionPlotter expression={plotExpr} />
                      </div>
                    )}

                    {!isUser && msg.content && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              audio.speakText(msg.content, undefined, chat.activeMode).catch(() => {});
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer"
                            title="Escuchar respuesta en voz argentina"
                          >
                            <Volume2 size={13} className="text-emerald-400" />
                            <span>Escuchar</span>
                          </button>

                          {audio.isSpeaking && (
                            <button
                              type="button"
                              onClick={() => audio.stopPlayback()}
                              className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 flex items-center gap-1 cursor-pointer"
                            >
                              <VolumeX size={13} />
                              <span>Silenciar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check size={13} className="text-emerald-400" />
                            ) : (
                              <Copy size={13} />
                            )}
                            <span>{copiedMsgId === msg.id ? "Copiado" : "Copiar"}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleIssueQuickPermiso()}
                          className="hidden sm:inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200 cursor-pointer"
                          title="Ver comprobante o permiso verificable por QR"
                        >
                          <FileCheck2 size={12} />
                          <span>Constancia QR</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                      <User size={16} className="text-slate-300" />
                    </div>
                  )}
                </article>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* TABLERO DE PICTOGRAMAS ARASAAC (ACTIVO EN MODO TEA O CUANDO SE DETECTAN TOKENS [PICTO: ...]) */}
      {shouldShowTEABoard && (
        <SusyTEABoard
          lastAssistantMessage={lastAssistantMessage}
          isLoading={chat.isLoading}
          onSelectPictogram={(_label, prompt) => {
            handleSendUserQuery(prompt).catch(() => {});
          }}
        />
      )}

      {/* PIE DE CONTROL MULTIMODAL ACCESIBLE (HIT-BOX >= 48x48px) */}
      <SusyControlFooter
        inputText={inputText}
        onInputChange={setInputText}
        onSendMessage={() => {
          handleSendUserQuery().catch(() => {});
        }}
        isRecording={audio.isRecording}
        isTranscribing={audio.isTranscribing}
        onToggleRecording={() => {
          handleToggleRecording().catch(() => {});
        }}
        isVADListening={vad.isListening}
        isUserSpeakingVAD={vad.userSpeaking}
        onToggleVAD={() => setVadEnabled((prev) => !prev)}
        isCameraActive={vision.isCameraActive}
        onToggleCamera={() => {
          handleToggleCamera().catch(() => {});
        }}
        isLoading={chat.isLoading}
        selectedImageBase64={selectedImageBase64}
        onSelectImage={handleSelectImage}
      />

      {/* =====================================================================
       * MODALES Y CAJONES DEL CORE MUNICIPAL DE ITUZAINGÓ
       * ===================================================================== */}

      {/* Historial de Sesiones en Supabase */}
      <SusyHistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        currentSessionId={chat.sessionId}
        userId={chat.userId}
        onSelectSession={(targetId) => chat.switchSession(targetId)}
        onStartNewChat={() => chat.startNewChat()}
      />

      {/* Modal de Código QR y Compartición por WhatsApp */}
      <SusyShareQRModal
        isOpen={showShareQRModal}
        onClose={() => setShowShareQRModal(false)}
        sessionId={chat.sessionId}
      />

      {/* Modal de Llamada de Voz en Tiempo Real con Susy Bot */}
      <SusyRealtimeCallModal
        isOpen={showRealtimeCallModal}
        onClose={() => setShowRealtimeCallModal(false)}
        activeMode={chat.activeMode}
        initialHistory={chat.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))}
      />

      {/* Modal de Emergencias Municipales y Guardia 24 hs (107 / 100 / 103 / 101) */}
      <SusyEmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />

      {/* Boletín y Gacetillas de Prensa Oficial */}
      <MunicipalPressModal
        isOpen={showPressModal}
        onClose={() => setShowPressModal(false)}
        onAskSusy={(pregunta) => {
          setShowPressModal(false);
          handleSendUserQuery(pregunta).catch(() => {});
        }}
      />

      {/* Guía Comercial Oficial de Ituzaingó */}
      {showCommerceGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Guía Comercial de Ituzaingó"
        >
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-white/15 shadow-2xl p-4">
            <MunicipalCommerceGuide
              onClose={() => setShowCommerceGuideModal(false)}
              onAskSusy={(prompt) => {
                setShowCommerceGuideModal(false);
                handleSendUserQuery(prompt).catch(() => {});
              }}
            />
          </div>
        </div>
      )}

      {/* Emisor de Comprobantes Oficiales de Turno y Permisos Provisorios con QR */}
      <MunicipalDocumentModal
        isOpen={selectedDocumentModal !== null}
        onClose={() => setSelectedDocumentModal(null)}
        documentData={selectedDocumentModal}
      />
    </div>
  );
}
