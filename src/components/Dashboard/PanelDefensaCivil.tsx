"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  Radio, 
  MapPin, 
  Battery, 
  AlertTriangle, 
  Users, 
  Bluetooth, 
  CheckCircle2, 
  Send,
  RefreshCw,
  Signal
} from "lucide-react";
import { SusyMeshBridge } from "@/lib/susy/mesh/SusyMeshBridge";

interface MeshAlertItem {
  id: string;
  nodeId: string;
  tipo: "PANICO" | "INUNDACION" | "EVACUACION" | "SISTEMA_CAIDO";
  mensaje: string;
  lat: number;
  lon: number;
  bateria: number;
  despachado: boolean;
  hora: string;
}

export function PanelDefensaCivil() {
  const [alerts, setAlerts] = useState<MeshAlertItem[]>([
    {
      id: "alert-1",
      nodeId: "#ITU-HEX7F2",
      tipo: "PANICO",
      mensaje: "Solicitud de auxilio por anegamiento de vivienda. Adulto mayor atrapado.",
      lat: -27.5614,
      lon: -56.6831,
      bateria: 94,
      despachado: false,
      hora: "Hace 4 min"
    },
    {
      id: "alert-2",
      nodeId: "#ITU-COST01",
      tipo: "INUNDACION",
      mensaje: "Sensor de cota de río: Nivel de crecida supera umbral de alerta en bajada náutica.",
      lat: -27.5582,
      lon: -56.6795,
      bateria: 88,
      despachado: false,
      hora: "Hace 12 min"
    },
    {
      id: "alert-3",
      nodeId: "#ITU-IBER04",
      tipo: "EVACUACION",
      mensaje: "Corte preventivo de camino rural por tormenta eléctrica severa en acceso a Cambyretá.",
      lat: -27.6045,
      lon: -56.7120,
      bateria: 100,
      despachado: true,
      hora: "Hace 28 min"
    }
  ]);

  const [isConnectingBt, setIsConnectingBt] = useState(false);
  const [btConnected, setBtConnected] = useState(false);
  const [btDeviceName, setBtDeviceName] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeAlertsCount = alerts.filter(a => !a.despachado).length;

  const showFeedback = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConnectLoRa = async () => {
    setIsConnectingBt(true);
    const bridge = SusyMeshBridge.getInstance();
    
    if (!bridge.isSupported()) {
      showFeedback("⚠️ Web Bluetooth no está soportado en este navegador. Utiliza Google Chrome o Edge.");
      setIsConnectingBt(false);
      return;
    }

    const success = await bridge.connectToLoRaNode();
    setIsConnectingBt(false);

    if (success) {
      setBtConnected(true);
      setBtDeviceName(bridge.getDeviceName());
      showFeedback(`📡 Nodo LoRa Mesh enlazado: ${bridge.getDeviceName()}`);
    } else {
      showFeedback("❌ No se seleccionó ningún dispositivo LoRa o se canceló el emparejamiento.");
    }
  };

  const handleDispatch = (id: string, nodeId: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, despachado: true } : a));
    showFeedback(`🚒 Auxilio y cuadrilla de Defensa Civil despachada al nodo ${nodeId}.`);
  };

  const handleBroadcastSimulatedAlert = async () => {
    const bridge = SusyMeshBridge.getInstance();
    const payload = {
      nodeId: "#ITU-CENTRO",
      alertType: "PANICO" as const,
      message: "Alerta táctica de prueba emitida desde el Palacio Municipal.",
      lat: -27.5605,
      lon: -56.6800
    };

    if (btConnected) {
      await bridge.broadcastEmergency(payload);
      showFeedback("📡 Paquete de emergencia transmitido físicamente por ondas de radio LoRa.");
    } else {
      showFeedback("⚡ Transmisión registrada en malla táctica local (Modo Simulación).");
    }

    const newAlert: MeshAlertItem = {
      id: `alert-${Date.now()}`,
      nodeId: payload.nodeId,
      tipo: payload.alertType,
      mensaje: payload.message,
      lat: payload.lat,
      lon: payload.lon,
      bateria: 99,
      despachado: false,
      hora: "Recién"
    };

    setAlerts(prev => [newAlert, ...prev]);
  };

  return (
    <div className="p-6 bg-zinc-950 rounded-3xl border border-red-900/40 shadow-2xl space-y-6 text-slate-100 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-6 z-50 bg-red-950/90 border border-red-500 text-red-100 text-xs px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
          <Radio className="h-4 w-4 text-red-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-950/60 border border-red-800/50 rounded-2xl">
            <ShieldAlert className="h-6 w-6 text-red-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight uppercase flex items-center gap-2">
              Comandancia Operativa: Defensa Civil Mesh
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950 border border-red-600 text-red-400">Off-Grid</span>
            </h2>
            <p className="text-xs text-zinc-400">Monitoreo de desastres e inundaciones por radiofrecuencia (LoRa / Meshtastic 915MHz)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleConnectLoRa}
            disabled={isConnectingBt}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              btConnected 
                ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                : "bg-zinc-900 border-zinc-700 hover:border-red-500 text-zinc-300"
            }`}
          >
            <Bluetooth className={`h-3.5 w-3.5 ${btConnected ? "text-emerald-400" : "text-sky-400"}`} />
            <span>{isConnectingBt ? "Buscando..." : btConnected ? `LoRa: ${btDeviceName}` : "Enlazar Radio Bluetooth"}</span>
          </button>

          <div className="flex items-center gap-2 bg-green-950/30 border border-green-800/60 px-3.5 py-1.5 rounded-full text-xs text-green-400 font-mono">
            <Radio className="h-3.5 w-3.5 animate-ping text-green-500" />
            <span>RED EN MALLA: ACTIVA (0% INTERNET)</span>
          </div>
        </div>
      </div>

      {/* Grid de Métricas Tácticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-7 w-7 text-amber-500" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium">ALERTAS DE AUXILIO ACTIVAS</span>
            <h3 className="text-2xl font-bold text-zinc-100 font-mono">{activeAlertsCount < 10 ? `0${activeAlertsCount}` : activeAlertsCount}</h3>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <Users className="h-7 w-7 text-sky-500" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium">CENTROS DE EVACUACIÓN</span>
            <h3 className="text-2xl font-bold text-zinc-100 font-mono">02</h3>
            <p className="text-[10px] text-zinc-500">Polideportivo San Juan • Club Yacyretá</p>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Battery className="h-7 w-7 text-emerald-500" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium">BATERÍA REPETIDOR COSTANERA</span>
            <h3 className="text-2xl font-bold text-zinc-100 font-mono">94%</h3>
            <p className="text-[10px] text-zinc-500">Panel Solar 30W • Operativo</p>
          </div>
        </div>
      </div>

      {/* Lista de Actuaciones y Alertas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-400 tracking-wider font-mono uppercase flex items-center gap-2">
            <Signal className="h-3.5 w-3.5 text-red-400" />
            Actuaciones Críticas Recibidas por Antena LoRa
          </h4>

          <button
            onClick={handleBroadcastSimulatedAlert}
            className="px-2.5 py-1 text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="Simular disparo de alerta LoRa desde el palacio municipal"
          >
            <Send className="h-3 w-3 text-red-400" />
            <span>Emitir Paquete S.O.S</span>
          </button>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {alerts.map((alerta) => (
            <div 
              key={alerta.id} 
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                alerta.despachado 
                  ? "bg-zinc-900/20 border-zinc-800/50 opacity-75"
                  : "bg-zinc-900/70 border-red-500/30 shadow-lg shadow-red-950/20"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold font-mono border ${
                    alerta.tipo === "PANICO" ? "bg-red-500/20 border-red-500/40 text-red-400" :
                    alerta.tipo === "INUNDACION" ? "bg-amber-500/20 border-amber-500/40 text-amber-300" :
                    "bg-sky-500/20 border-sky-500/40 text-sky-300"
                  }`}>
                    {alerta.tipo === "PANICO" ? "🚨 BOTÓN DE PÁNICO" :
                     alerta.tipo === "INUNDACION" ? "🌊 ALERTA INUNDACIÓN" :
                     "⚠️ EVACUACIÓN"}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">Nodo: {alerta.nodeId}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">• {alerta.hora}</span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Battery className="h-2.5 w-2.5" /> {alerta.bateria}%
                  </span>
                </div>

                <p className="text-zinc-200 text-sm font-medium leading-relaxed">
                  "{alerta.mensaje}"
                </p>

                <div className="text-xs text-sky-400 font-mono flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>Lat: {alerta.lat}, Lon: {alerta.lon} (Vía Radiofrecuencia)</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {alerta.despachado ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-semibold font-mono">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>DESPACHADO</span>
                  </span>
                ) : (
                  <button 
                    onClick={() => handleDispatch(alerta.id, alerta.nodeId)}
                    className="bg-red-600 hover:bg-red-700 transition-colors text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-red-900/30 whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>DESPACHAR AUXILIO</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
