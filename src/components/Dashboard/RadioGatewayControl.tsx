"use client";

import React, { useState } from "react";
import { Radio, Volume2, Monitor, Play, CheckCircle, Waves, Signal } from "lucide-react";
import { SusyRadioModulator } from "@/lib/susy/radio/SusyRadioModulator";
import { AudioHardwareManager } from "@/lib/susy/audio/SusyAudioHardware";

export function RadioGatewayControl() {
  const [currentAlert, setCurrentAlert] = useState("Evacuar preventivamente zonas costeras bajas.");
  const [rdsChunks, setRdsChunks] = useState<string[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionSuccess, setTransmissionSuccess] = useState(false);

  const ejecutarModulacionAMFM = async () => {
    if (!currentAlert.trim() || isTransmitting) return;

    setIsTransmitting(true);
    setTransmissionSuccess(false);

    const modulator = SusyRadioModulator.getInstance();
    const audioManager = AudioHardwareManager.getInstance();
    
    // 1. Generar tramas RDS en pantalla (bloques de 8 caracteres estándar FM)
    const chunks = modulator.formatRDSText(currentAlert);
    setRdsChunks(chunks);

    // 2. Disparar silbido digital por la Web Audio API unificada hacia el transmisor de la radio
    try {
      const ctx = await audioManager.getAudioContext();
      await modulator.generateAFSKAudioTone(currentAlert, ctx);
      setTransmissionSuccess(true);
    } catch (err) {
      console.error("Error en la modulación acústica de emergencia:", err);
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <div className="p-5 bg-zinc-900/40 border border-zinc-800/90 rounded-2xl space-y-4 text-slate-100">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Radio className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider font-mono">
              Pasarela de Acoplamiento AM / FM
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono">
              Inyección de Texto RDS & Modulación AFSK Bell 202 (1200 Baudios)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-800/60 text-amber-400 text-[10px] font-mono">
          <Signal className="h-3 w-3 animate-pulse" />
          <span>PORTADORA: FM 94.5 / AM 1020</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-zinc-400 font-mono block flex items-center justify-between">
          <span>MENSAJE DIGITAL DE EMERGENCIA DE RANGO INSTITUCIONAL</span>
          <span className="text-[10px] text-zinc-500">{currentAlert.length} caracteres</span>
        </label>
        <input
          type="text"
          value={currentAlert}
          onChange={(e) => setCurrentAlert(e.target.value)}
          placeholder="Escriba la directiva cívica o alerta de catástrofe..."
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/60 px-4 py-2.5 rounded-xl text-zinc-200 text-sm focus:outline-none font-sans transition-colors"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          onClick={ejecutarModulacionAMFM}
          disabled={isTransmitting}
          className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 text-zinc-950 font-mono font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-98"
        >
          {isTransmitting ? (
            <>
              <Waves className="h-4 w-4 animate-spin text-zinc-950" />
              <span>TRANSMITIENDO SILBIDO DIGITAL AFSK...</span>
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4 text-zinc-950" />
              <span>EMITIR TONO DE AUDIO DIGITAL (AM/FM)</span>
            </>
          )}
        </button>
      </div>

      {/* Retroalimentación de éxito */}
      {transmissionSuccess && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-400 text-xs font-mono animate-fade-in">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Transmisión AFSK completada y distribuida al modulador de audio.</span>
        </div>
      )}

      {/* Visor de Bloques RDS */}
      {rdsChunks.length > 0 && (
        <div className="bg-zinc-950 p-4 border border-zinc-800/70 rounded-xl space-y-2">
          <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
            <Monitor className="h-3.5 w-3.5 text-amber-400" />
            SECUENCIA TRANSMITIDA EN VISOR RDS DE RADIOS FM (AUTO-SCROLL):
          </span>
          <div className="flex flex-wrap gap-1.5 font-mono">
            {rdsChunks.map((chunk, index) => (
              <span key={index} className="bg-zinc-900 border border-zinc-800 text-amber-400 text-xs px-2.5 py-1 rounded-md tracking-widest font-bold">
                [{chunk}]
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
