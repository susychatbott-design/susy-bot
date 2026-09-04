"use client";

import React, { useEffect, useState } from "react";
import { Zap, WifiOff, Cpu } from "lucide-react";
import { checkWebGPUSupport } from "@/lib/susy/webgpu/localEngine";

export default function SusyConnectionBadge() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [hasWebGPU, setHasWebGPU] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      checkWebGPUSupport().then(supported => setHasWebGPU(!!supported));

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md transition-all duration-300 shadow-sm ${
        isOnline
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          : "bg-amber-500/15 border-amber-500/30 text-amber-300"
      }`}
      title={
        isOnline
          ? "Conectado a la Red Soberana Municipal de Ituzaingó"
          : hasWebGPU
          ? "Modo Campo Activo: Ejecutando en la GPU local del dispositivo (WebGPU)"
          : "Modo Campo Activo: Ejecutando en la CPU local del dispositivo (Wasm)"
      }
    >
      {isOnline ? (
        <>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>En Línea</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Modo Offline</span>
        </>
      )}
    </div>
  );
}
