import { useCallback, useRef } from "react";
import type { ShapeType, TextField, TextPosition } from "@/lib/store";
import type { Box } from "@/components/box-editor";

type Selection = "photo" | string;
type Mode = "move" | "nw" | "ne" | "sw" | "se";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function LayoutEditor({
  src,
  photoBox,
  shape,
  textFields,
  selected,
  templateWidth,
  templateHeight,
  onPhotoBoxChange,
  onTextFieldChange,
  onSelectionChange,
}: {
  src: string;
  photoBox: Box;
  shape: ShapeType;
  textFields: TextField[];
  selected: Selection;
  templateWidth?: number;
  templateHeight?: number;
  onPhotoBoxChange: (box: Box) => void;
  onTextFieldChange: (id: string, position: TextPosition) => void;
  onSelectionChange: (selection: Selection) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    selection: Selection;
    mode: Mode;
    startX: number;
    startY: number;
    start: Box;
  } | null>(null);

  const pointerPercent = useCallback((event: React.PointerEvent) => {
    const frame = frameRef.current;
    if (!frame) return null;
    const rect = frame.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100),
    };
  }, []);

  const begin = (event: React.PointerEvent, selection: Selection, mode: Mode, box: Box) => {
    event.preventDefault();
    event.stopPropagation();
    const point = pointerPercent(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelectionChange(selection);
    dragRef.current = {
      selection,
      mode,
      startX: point.x,
      startY: point.y,
      start: box,
    };
  };

  const move = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    const point = pointerPercent(event);
    if (!drag || !point) return;
    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    const next = { ...drag.start };
    const right = drag.start.x + drag.start.width;
    const bottom = drag.start.y + drag.start.height;

    if (drag.mode === "move") {
      next.x = clamp(drag.start.x + dx, 0, 100 - drag.start.width);
      next.y = clamp(drag.start.y + dy, 0, 100 - drag.start.height);
    } else {
      if (drag.mode === "nw" || drag.mode === "sw") {
        next.x = clamp(Math.min(drag.start.x + dx, right - 3), 0, right - 3);
        next.width = right - next.x;
      } else {
        next.width = clamp(drag.start.width + dx, 3, 100 - drag.start.x);
      }
      if (drag.mode === "nw" || drag.mode === "ne") {
        next.y = clamp(Math.min(drag.start.y + dy, bottom - 3), 0, bottom - 3);
        next.height = bottom - next.y;
      } else {
        next.height = clamp(drag.start.height + dy, 3, 100 - drag.start.y);
      }
    }

    if (drag.selection === "photo") onPhotoBoxChange(next);
    else onTextFieldChange(drag.selection, next);
  };

  const finish = () => {
    dragRef.current = null;
  };

  const handles = (selection: Selection, box: Box) =>
    (
      [
        ["nw", "-left-2 -top-2 cursor-nwse-resize"],
        ["ne", "-right-2 -top-2 cursor-nesw-resize"],
        ["sw", "-bottom-2 -left-2 cursor-nesw-resize"],
        ["se", "-bottom-2 -right-2 cursor-nwse-resize"],
      ] as const
    ).map(([mode, className]) => (
      <span
        key={mode}
        onPointerDown={(event) => begin(event, selection, mode, box)}
        className={`absolute h-4 w-4 rounded-full border-2 border-white bg-[#6C2BFF] shadow-sm shadow-purple-950/40 ${className}`}
      />
    ));

  const overlay = (selection: Selection, box: Box, label: string) => {
    const isPhoto = selection === "photo";
    const active = selected === selection;
    return (
      <div
        key={selection}
        onPointerDown={(event) => begin(event, selection, "move", box)}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        className={`absolute cursor-move border-2 transition-colors ${
          active
            ? "border-[#6C2BFF] bg-[#6C2BFF]/20 shadow-md shadow-purple-500/30"
            : "border-purple-300/80 bg-purple-500/10 hover:border-purple-400"
        } ${isPhoto && shape === "circle" ? "rounded-full" : "rounded-lg"}`}
        style={{
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.width}%`,
          height: `${box.height}%`,
        }}
      >
        <span className="absolute left-0 top-0 rounded-br-md bg-gradient-to-r from-[#6C2BFF] to-[#7C3AED] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
          {label}
        </span>
        {active && handles(selection, box)}
      </div>
    );
  };

  return (
    <div
      ref={frameRef}
      className="relative select-none overflow-hidden rounded-2xl border border-purple-200 bg-slate-100/80 shadow-inner"
      style={{ touchAction: "none" }}
    >
      {templateWidth && templateHeight ? (
        <div className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-mono font-bold text-white shadow-md backdrop-blur-xs">
          <span className="h-2 w-2 rounded-full bg-[#6C2BFF]" />
          <span>
            {templateWidth} × {templateHeight} px
          </span>
        </div>
      ) : null}
      <img src={src} alt="Theme template" className="block w-full select-none" draggable={false} />
      {overlay("photo", photoBox, "Photo")}
      {textFields.map((field) => overlay(field.id, field, field.label))}
    </div>
  );
}
