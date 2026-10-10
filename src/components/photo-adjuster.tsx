import { useRef, useCallback } from "react";
import {
  Move,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { PhotoAdjustment, ShapeType } from "@/lib/store";

interface PhotoAdjusterProps {
  photo: HTMLImageElement;
  shape: ShapeType;
  adjust: PhotoAdjustment;
  onChange: (adjust: PhotoAdjustment) => void;
  onReset: () => void;
}

export function PhotoAdjuster({ photo, shape, adjust, onChange, onReset }: PhotoAdjusterProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initOffsetX: number;
    initOffsetY: number;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initOffsetX: adjust.offsetX,
      initOffsetY: adjust.offsetY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || !padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    // Convert pixel delta to percentage of pad dimensions (scaled by zoom)
    const percentX = (dx / rect.width) * 100;
    const percentY = (dy / rect.height) * 100;

    const nextX = Math.max(
      -50,
      Math.min(50, Math.round(dragStartRef.current.initOffsetX + percentX)),
    );
    const nextY = Math.max(
      -50,
      Math.min(50, Math.round(dragStartRef.current.initOffsetY + percentY)),
    );

    onChange({
      ...adjust,
      offsetX: nextX,
      offsetY: nextY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const newScale = Math.max(0.5, Math.min(3.0, Number((adjust.scale + delta).toFixed(2))));
      onChange({ ...adjust, scale: newScale });
    },
    [adjust, onChange],
  );

  const setScale = (newScale: number) => {
    onChange({ ...adjust, scale: Math.max(0.5, Math.min(3.0, Number(newScale.toFixed(2)))) });
  };

  const nudge = (dx: number, dy: number) => {
    onChange({
      ...adjust,
      offsetX: Math.max(-50, Math.min(50, adjust.offsetX + dx)),
      offsetY: Math.max(-50, Math.min(50, adjust.offsetY + dy)),
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-purple-200/90 bg-gradient-to-br from-purple-50/50 via-white to-orange-50/30 p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Move className="h-4 w-4 text-[#6C2BFF]" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Framing &amp; Zoom
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          title="Reset photo position and zoom"
          className="flex items-center gap-1 rounded-lg border border-purple-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 transition-all hover:bg-purple-50 hover:text-[#6C2BFF]"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Interactive Touch/Drag Framing Pad */}
      <div className="flex flex-col items-center">
        <div
          ref={padRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className={`relative h-44 w-44 cursor-grab select-none overflow-hidden border-2 border-[#6C2BFF] bg-slate-950 shadow-md shadow-purple-500/20 active:cursor-grabbing ${
            shape === "circle" ? "rounded-full" : "rounded-2xl"
          }`}
          title="Click and drag to pan · Scroll wheel to zoom"
        >
          {/* Rendered transformed photo */}
          <img
            src={photo.src}
            alt="Adjustable framing"
            draggable={false}
            className="pointer-events-none absolute h-full w-full select-none object-cover"
            style={{
              transform: `translate(${adjust.offsetX}%, ${adjust.offsetY}%) scale(${adjust.scale})`,
              transformOrigin: "center center",
              transition: dragStartRef.current ? "none" : "transform 0.1s ease-out",
            }}
          />

          {/* Guide Grid overlay */}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
            <div className="border-b border-r border-white/60" />
            <div className="border-b border-r border-white/60" />
            <div className="border-b border-white/60" />
            <div className="border-b border-r border-white/60" />
            <div className="border-b border-r border-white/60" />
            <div className="border-b border-white/60" />
            <div className="border-r border-white/60" />
            <div className="border-r border-white/60" />
            <div />
          </div>

          {/* Center Crosshair Marker */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-4 w-4 rounded-full border border-white/80 opacity-60" />
          </div>

          {/* Floating hint on hover */}
          <div className="pointer-events-none absolute bottom-2 left-0 right-0 text-center">
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
              Drag to pan · Scroll to zoom
            </span>
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] font-medium text-slate-500">
          Photo positioned at{" "}
          <span className="font-bold text-[#6C2BFF]">{Math.round(adjust.scale * 100)}%</span> zoom
        </p>
      </div>

      {/* Zoom Control Slider */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">Zoom Scale</span>
          <span className="rounded-md bg-purple-100 px-2 py-0.5 font-mono text-[11px] font-bold text-[#6C2BFF]">
            {Math.round(adjust.scale * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScale(adjust.scale - 0.1)}
            disabled={adjust.scale <= 0.5}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 bg-white text-slate-700 transition hover:bg-purple-50 disabled:opacity-40"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>

          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.05"
            value={adjust.scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-purple-200 accent-[#6C2BFF]"
          />

          <button
            type="button"
            onClick={() => setScale(adjust.scale + 0.1)}
            disabled={adjust.scale >= 3.0}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 bg-white text-slate-700 transition hover:bg-purple-50 disabled:opacity-40"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Nudge Directional Pad & Precision Sliders */}
      <div className="border-t border-purple-100 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Nudge Position
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            X: {adjust.offsetX > 0 ? `+${adjust.offsetX}` : adjust.offsetX}% · Y:{" "}
            {adjust.offsetY > 0 ? `+${adjust.offsetY}` : adjust.offsetY}%
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => nudge(-5, 0)}
            title="Nudge Left"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-200 bg-white text-slate-700 transition-all hover:bg-purple-50 hover:text-[#6C2BFF] active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => nudge(0, -5)}
              title="Nudge Up"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-200 bg-white text-slate-700 transition-all hover:bg-purple-50 hover:text-[#6C2BFF] active:scale-95"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => nudge(0, 5)}
              title="Nudge Down"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-200 bg-white text-slate-700 transition-all hover:bg-purple-50 hover:text-[#6C2BFF] active:scale-95"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => nudge(5, 0)}
            title="Nudge Right"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-200 bg-white text-slate-700 transition-all hover:bg-purple-50 hover:text-[#6C2BFF] active:scale-95"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
