import { useEffect, useRef, useState } from "react";
import { Download, Move, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { RatioDef } from "@/lib/ratios";
import type { PhotoAdjustment, Theme, UserTextValues } from "@/lib/store";
import { downloadCanvas, renderComposite } from "@/lib/render";

export function RatioCanvas({
  ratio,
  theme,
  background,
  photo,
  textValues,
  photoAdjust,
  onAdjustChange,
  downloadable = false,
}: {
  ratio: RatioDef;
  theme: Theme;
  background: HTMLImageElement | null;
  photo?: HTMLImageElement | null;
  textValues?: UserTextValues;
  photoAdjust?: PhotoAdjustment;
  onAdjustChange?: (adjust: PhotoAdjustment) => void;
  downloadable?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  } | null>(null);

  const isInteractive = Boolean(photo && photoAdjust && onAdjustChange);

  useEffect(() => {
    if (!ref.current || !background) return;
    renderComposite(
      ref.current,
      ratio.exportWidth,
      ratio.exportHeight,
      theme,
      background,
      photo ?? null,
      textValues,
      photoAdjust,
    );
  }, [ratio, theme, background, photo, textValues, photoAdjust]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isInteractive || !photoAdjust || !onAdjustChange) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: photoAdjust.offsetX,
      initY: photoAdjust.offsetY,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || !photoAdjust || !onAdjustChange || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    // Convert pixel delta to percentage of photo slot dimensions
    // The photo slot width is approximately (theme.photo_width / 100) of the canvas view
    const slotFraction = Math.max(0.15, (theme.photo_width || 35) / 100);
    const slotPixelW = rect.width * slotFraction;
    const slotPixelH = rect.height * Math.max(0.15, (theme.photo_height || 35) / 100);

    const deltaPercentX = (dx / slotPixelW) * 100;
    const deltaPercentY = (dy / slotPixelH) * 100;

    const nextX = Math.max(-50, Math.min(50, Math.round(dragRef.current.initX + deltaPercentX)));
    const nextY = Math.max(-50, Math.min(50, Math.round(dragRef.current.initY + deltaPercentY)));

    onAdjustChange({
      ...photoAdjust,
      offsetX: nextX,
      offsetY: nextY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!isInteractive || !photoAdjust || !onAdjustChange) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const newScale = Math.max(0.5, Math.min(3.0, Number((photoAdjust.scale + delta).toFixed(2))));
    onAdjustChange({
      ...photoAdjust,
      scale: newScale,
    });
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-purple-100/90 bg-white shadow-md shadow-purple-500/5 transition-all duration-300 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/15">
      <div className="flex items-center justify-between border-b border-purple-50 bg-gradient-to-r from-purple-50/60 to-white px-4 py-3">
        <span className="text-xs font-bold text-slate-900">{ratio.label}</span>
        <div className="flex items-center gap-1.5">
          {isInteractive && (
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all ${
                isDragging
                  ? "bg-[#6C2BFF] text-white animate-pulse"
                  : "bg-purple-100 text-[#6C2BFF]"
              }`}
            >
              <Move className="h-2.5 w-2.5" />
              <span>{isDragging ? "Moving…" : "Adjustable"}</span>
            </span>
          )}
          <span className="rounded-full bg-purple-100/80 px-2 py-0.5 font-mono text-[10px] font-bold text-[#6C2BFF]">
            {ratio.hint}
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden bg-slate-100/80 p-1">
        <canvas
          ref={ref}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className={`block h-auto w-full rounded-lg transition-all ${
            isInteractive
              ? "cursor-grab touch-none select-none active:cursor-grabbing hover:ring-2 hover:ring-[#6C2BFF]/30"
              : ""
          }`}
          style={{ aspectRatio: String(ratio.aspect) }}
          title={
            isInteractive
              ? "Click & drag directly on the canvas to reposition photo · Mouse wheel to zoom"
              : undefined
          }
        />

        {/* Hover overlay hint when interactive */}
        {isInteractive && !isDragging && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="rounded-full bg-slate-900/85 px-2.5 py-1 text-[10px] font-bold text-white shadow-md backdrop-blur-xs">
              Drag to reposition · Scroll to zoom
            </span>
          </div>
        )}
      </div>

      {downloadable && (
        <div className="border-t border-purple-50 bg-white p-3">
          <button
            type="button"
            onClick={() =>
              ref.current &&
              downloadCanvas(
                ref.current,
                `${theme.title.replace(/\s+/g, "-").toLowerCase() || "design"}-${ratio.key}.png`,
              )
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C2BFF] to-[#7C3AED] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-purple-500/30 transition-all duration-200 hover:brightness-105 hover:shadow-md hover:shadow-purple-500/40 active:scale-98"
          >
            <Download className="h-4 w-4" />
            <span>Download {ratio.label}</span>
          </button>
        </div>
      )}
    </div>
  );
}
