"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Activity, Table, Check } from "lucide-react";
import * as math from "mathjs";

interface FunctionPlotterProps {
  expression: string;
  title?: string;
}

export function FunctionPlotter({ expression, title }: FunctionPlotterProps) {
  // Limpiar la expresión
  const cleanExpr = useMemo(() => {
    return expression
      .replace(/^[fgyh]\(x\)\s*=\s*/i, "")
      .replace(/y\s*=\s*/i, "")
      .trim();
  }, [expression]);

  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const [yMin, setYMin] = useState<number>(-10);
  const [yMax, setYMax] = useState<number>(10);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; svgX: number; svgY: number } | null>(null);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = 560;
  const height = 360;
  const padding = 40;

  // Compilar función con mathjs de forma segura
  const compiledFn = useMemo(() => {
    try {
      return math.compile(cleanExpr);
    } catch {
      return null;
    }
  }, [cleanExpr]);

  // Conversión de coordenadas matemáticas a píxeles SVG
  const mathToSvg = (x: number, y: number) => {
    const svgX = padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
    const svgY = height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);
    return { svgX, svgY };
  };

  const svgToMath = (svgX: number, svgY: number) => {
    const x = xMin + ((svgX - padding) / (width - 2 * padding)) * (xMax - xMin);
    const y = yMin + ((height - padding - svgY) / (height - 2 * padding)) * (yMax - yMin);
    return { x, y };
  };

  // Generar trazado de la curva (Path Data)
  const pathD = useMemo(() => {
    if (!compiledFn) return "";

    const points: string[] = [];
    const steps = 300;
    const stepSize = (xMax - xMin) / steps;
    let isDrawing = false;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * stepSize;
      try {
        const yVal = compiledFn.evaluate({ x });
        if (typeof yVal === "number" && !isNaN(yVal) && isFinite(yVal)) {
          const { svgX, svgY } = mathToSvg(x, yVal);
          // Si está razonablemente dentro del área visible
          if (svgY >= -200 && svgY <= height + 200) {
            if (!isDrawing) {
              points.push(`M ${svgX.toFixed(2)} ${svgY.toFixed(2)}`);
              isDrawing = true;
            } else {
              points.push(`L ${svgX.toFixed(2)} ${svgY.toFixed(2)}`);
            }
          } else {
            isDrawing = false;
          }
        } else {
          isDrawing = false;
        }
      } catch {
        isDrawing = false;
      }
    }

    return points.join(" ");
  }, [compiledFn, xMin, xMax, yMin, yMax]);

  // Hallar puntos notables (Raíces, Corte con Y y Extremos)
  const keyPoints = useMemo(() => {
    if (!compiledFn) return [];
    const pts: { x: number; y: number; label: string; color: string }[] = [];

    // 1. Corte con Y (x = 0)
    try {
      const y0 = compiledFn.evaluate({ x: 0 });
      if (typeof y0 === "number" && isFinite(y0)) {
        pts.push({ x: 0, y: Number(y0.toFixed(2)), label: "Corte Y", color: "#a855f7" });
      }
    } catch {}

    // 2. Raíces f(x) = 0
    try {
      const steps = 200;
      const step = (xMax - xMin) / steps;
      for (let x = xMin; x <= xMax; x += step) {
        const y1 = compiledFn.evaluate({ x });
        const y2 = compiledFn.evaluate({ x: x + step });
        if (typeof y1 === "number" && typeof y2 === "number" && y1 * y2 <= 0) {
          const rootX = Number((x + step / 2).toFixed(2));
          if (!pts.some(p => Math.abs(p.x - rootX) < 0.2 && p.label === "Raíz")) {
            pts.push({ x: rootX, y: 0, label: "Raíz", color: "#22c55e" });
          }
        }
      }
    } catch {}

    return pts;
  }, [compiledFn, xMin, xMax]);

  // Tabla de valores en [-5, 5]
  const tableValues = useMemo(() => {
    if (!compiledFn) return [];
    const rows = [];
    for (let x = -5; x <= 5; x++) {
      try {
        const y = compiledFn.evaluate({ x });
        rows.push({ x, y: typeof y === "number" ? Number(y.toFixed(3)) : "Indefinido" });
      } catch {
        rows.push({ x, y: "Error" });
      }
    }
    return rows;
  }, [compiledFn]);

  // Controles de Zoom y Paneo
  const handleZoom = (factor: number) => {
    const xCenter = (xMin + xMax) / 2;
    const yCenter = (yMin + yMax) / 2;
    const xSpan = ((xMax - xMin) / 2) * factor;
    const ySpan = ((yMax - yMin) / 2) * factor;

    setXMin(Number((xCenter - xSpan).toFixed(2)));
    setXMax(Number((xCenter + xSpan).toFixed(2)));
    setYMin(Number((yCenter - ySpan).toFixed(2)));
    setYMax(Number((yCenter + ySpan).toFixed(2)));
  };

  const handleReset = () => {
    setXMin(-10);
    setXMax(10);
    setYMin(-10);
    setYMax(10);
  };

  // Eventos de Mouse Panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseSvgX = e.clientX - rect.left;
      const mouseSvgY = e.clientY - rect.top;
      if (mouseSvgX >= padding && mouseSvgX <= width - padding && mouseSvgY >= padding && mouseSvgY <= height - padding) {
        const { x } = svgToMath(mouseSvgX, mouseSvgY);
        try {
          if (compiledFn) {
            const y = compiledFn.evaluate({ x });
            if (typeof y === "number" && isFinite(y)) {
              const { svgX: sX, svgY: sY } = mathToSvg(x, y);
              setHoverPoint({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), svgX: sX, svgY: sY });
            }
          }
        } catch {}
      } else {
        setHoverPoint(null);
      }
    }

    if (isDragging && dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const xRange = xMax - xMin;
      const yRange = yMax - yMin;
      const mathDx = (dx / (width - 2 * padding)) * xRange;
      const mathDy = (dy / (height - 2 * padding)) * yRange;

      setXMin(prev => prev - mathDx);
      setXMax(prev => prev - mathDx);
      setYMin(prev => prev + mathDy);
      setYMax(prev => prev + mathDy);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Coordenadas del Origen (0, 0)
  const origin = mathToSvg(0, 0);

  if (!compiledFn) {
    return (
      <div className="my-3 p-3 rounded-xl bg-slate-900/80 border border-rose-500/30 text-rose-300 text-xs">
        ⚠️ No fue posible compilar la función matemática: <code>{cleanExpr}</code>
      </div>
    );
  }

  return (
    <div className="my-4 rounded-2xl border border-sky-500/30 bg-slate-950/90 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Barra Superior con Título y Controles */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-sky-400 animate-pulse" />
          <span className="text-xs font-semibold text-sky-200">
            {title || `f(x) = ${cleanExpr}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleZoom(0.75)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Acercar (Zoom In)"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={() => handleZoom(1.33)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Alejar (Zoom Out)"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Restablecer plano [-10, 10]"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={() => setShowTable(prev => !prev)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
              showTable ? "bg-indigo-600 text-white font-semibold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
            title="Ver tabla de valores"
          >
            <Table size={12} />
            <span>Tabla</span>
          </button>
        </div>
      </div>

      {/* Grilla Cartesiana SVG Interactiva */}
      <div className="relative flex justify-center bg-gradient-to-b from-slate-950 to-slate-900 p-2 cursor-crosshair select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[560px] h-auto drop-shadow-md"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setHoverPoint(null);
            handleMouseUp();
          }}
        >
          {/* Fondo */}
          <rect x={0} y={0} width={width} height={height} fill="#0b0f19" rx={12} />

          {/* Grilla Secundaria */}
          {[-8, -6, -4, -2, 2, 4, 6, 8].map(tick => {
            const { svgX } = mathToSvg(tick, 0);
            const { svgY } = mathToSvg(0, tick);
            return (
              <g key={tick} opacity={0.25}>
                {svgX >= padding && svgX <= width - padding && (
                  <line x1={svgX} y1={padding} x2={svgX} y2={height - padding} stroke="#334155" strokeWidth={1} strokeDasharray="2,2" />
                )}
                {svgY >= padding && svgY <= height - padding && (
                  <line x1={padding} y1={svgY} x2={width - padding} y2={svgY} stroke="#334155" strokeWidth={1} strokeDasharray="2,2" />
                )}
              </g>
            );
          })}

          {/* Eje X (Horizontal) */}
          {origin.svgY >= padding && origin.svgY <= height - padding && (
            <g>
              <line x1={padding} y1={origin.svgY} x2={width - padding} y2={origin.svgY} stroke="#64748b" strokeWidth={1.5} />
              <text x={width - padding + 8} y={origin.svgY + 4} fill="#94a3b8" fontSize={10} fontFamily="sans-serif">X</text>
            </g>
          )}

          {/* Eje Y (Vertical) */}
          {origin.svgX >= padding && origin.svgX <= width - padding && (
            <g>
              <line x1={origin.svgX} y1={padding} x2={origin.svgX} y2={height - padding} stroke="#64748b" strokeWidth={1.5} />
              <text x={origin.svgX - 5} y={padding - 8} fill="#94a3b8" fontSize={10} fontFamily="sans-serif" textAnchor="middle">Y</text>
            </g>
          )}

          {/* Curva de la Función */}
          <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {/* Puntos Notables */}
          {keyPoints.map((pt, idx) => {
            const { svgX, svgY } = mathToSvg(pt.x, pt.y);
            if (svgX < padding || svgX > width - padding || svgY < padding || svgY > height - padding) return null;
            return (
              <g key={idx}>
                <circle cx={svgX} cy={svgY} r={4.5} fill={pt.color} stroke="#0f172a" strokeWidth={1.5} />
                <text x={svgX} y={svgY - 8} fill={pt.color} fontSize={9} fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                  ({pt.x}, {pt.y})
                </text>
              </g>
            );
          })}

          {/* Punto Hover Dinámico */}
          {hoverPoint && (
            <g>
              <circle cx={hoverPoint.svgX} cy={hoverPoint.svgY} r={5} fill="#f43f5e" stroke="#ffffff" strokeWidth={1.5} />
              <rect x={hoverPoint.svgX - 35} y={hoverPoint.svgY - 26} width={70} height={18} rx={4} fill="#0f172a" stroke="#f43f5e" strokeWidth={1} />
              <text x={hoverPoint.svgX} y={hoverPoint.svgY - 14} fill="#ffffff" fontSize={9.5} fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                ({hoverPoint.x}, {hoverPoint.y})
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Tabla Desplegable de Valores */}
      {showTable && (
        <div className="p-3 bg-slate-900/95 border-t border-slate-800 text-xs">
          <div className="text-slate-400 font-semibold mb-2 flex items-center justify-between">
            <span>Tabla de Valores Discretos x ∈ [-5, 5]</span>
            <span className="text-[10px] text-sky-400">Puntos Clave Calculados</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {tableValues.map((row, idx) => (
              <div key={idx} className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 flex flex-col items-center">
                <span className="text-slate-400 text-[10px]">x: {row.x}</span>
                <span className="font-semibold text-sky-300 text-xs">{row.y}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
