import { useCallback, useRef, useState } from "react";
import type { ShapeType } from "@/lib/store";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Mode = "move" | "draw" | "nw" | "ne" | "sw" | "se";

const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));

export function BoxEditor({
  src,
  box,
  shape,
  onChange,
}: {
  src: string;
  box: Box;
  shape: ShapeType;
  onChange: (b: Box) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef<{ mode: Mode; startX: number; startY: number; start: Box } | null>(null);
  const [active, setActive] = useState(false);

  const pct = useCallback((e: React.PointerEvent | PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - rect.left) / rect.width) * 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100),
    };
  }, []);

  const begin = (e: React.PointerEvent, mode: Mode) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = pct(e);
    setActive(true);
    if (mode === "draw") {
      const start = { x: p.x, y: p.y, width: 0, height: 0 };
      state.current = { mode, startX: p.x, startY: p.y, start };
      onChange(start);
    } else {
      state.current = { mode, startX: p.x, startY: p.y, start: box };
    }
  };

  const move = (e: React.PointerEvent) => {
    const s = state.current;
    if (!s) return;
    const p = pct(e);
    const dx = p.x - s.startX;
    const dy = p.y - s.startY;

    if (s.mode === "draw") {
      onChange({
        x: Math.min(s.startX, p.x),
        y: Math.min(s.startY, p.y),
        width: Math.abs(dx),
        height: Math.abs(dy),
      });
      return;
    }
    if (s.mode === "move") {
      onChange({
        ...s.start,
        x: clamp(s.start.x + dx, 0, 100 - s.start.width),
        y: clamp(s.start.y + dy, 0, 100 - s.start.height),
      });
      return;
    }
    const b = { ...s.start };
    const right = s.start.x + s.start.width;
    const bottom = s.start.y + s.start.height;
    if (s.mode === "nw" || s.mode === "sw") {
      b.x = clamp(Math.min(s.start.x + dx, right - 2), 0, right - 2);
      b.width = right - b.x;
    } else {
      b.width = clamp(s.start.width + dx, 2, 100 - s.start.x);
    }
    if (s.mode === "nw" || s.mode === "ne") {
      b.y = clamp(Math.min(s.start.y + dy, bottom - 2), 0, bottom - 2);
      b.height = bottom - b.y;
    } else {
      b.height = clamp(s.start.height + dy, 2, 100 - s.start.y);
    }
    onChange(b);
  };

  const end = () => {
    state.current = null;
    setActive(false);
  };

  const handle = (mode: Mode, className: string) => (
    <span
      onPointerDown={(e) => begin(e, mode)}
      onPointerMove={move}
      onPointerUp={end}
      className={`absolute h-3 w-3 border border-slate-900 bg-white ${className}`}
    />
  );

  const hasBox = box.width > 0 && box.height > 0;

  return (
    <div
      ref={ref}
      onPointerDown={(e) => begin(e, "draw")}
      onPointerMove={move}
      onPointerUp={end}
      className="relative select-none border border-slate-300 bg-slate-100"
      style={{ touchAction: "none" }}
    >
      <img src={src} alt="Theme template" className="block w-full select-none" draggable={false} />
      {hasBox && (
        <div
          onPointerDown={(e) => begin(e, "move")}
          onPointerMove={move}
          onPointerUp={end}
          className={`absolute cursor-move border-2 bg-blue-500/20 ${
            active ? "border-blue-600" : "border-blue-500"
          } ${shape === "circle" ? "rounded-full" : ""}`}
          style={{
            left: `${box.x}%`,
            top: `${box.y}%`,
            width: `${box.width}%`,
            height: `${box.height}%`,
          }}
        >
          {handle("nw", "-left-1.5 -top-1.5 cursor-nwse-resize")}
          {handle("ne", "-right-1.5 -top-1.5 cursor-nesw-resize")}
          {handle("sw", "-bottom-1.5 -left-1.5 cursor-nesw-resize")}
          {handle("se", "-bottom-1.5 -right-1.5 cursor-nwse-resize")}
        </div>
      )}
    </div>
  );
}
