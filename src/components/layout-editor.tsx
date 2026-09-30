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
  onPhotoBoxChange,
  onTextFieldChange,
  onSelectionChange,
}: {
  src: string;
  photoBox: Box;
  shape: ShapeType;
  textFields: TextField[];
  selected: Selection;
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
    ([
      ["nw", "-left-1.5 -top-1.5 cursor-nwse-resize"],
      ["ne", "-right-1.5 -top-1.5 cursor-nesw-resize"],
      ["sw", "-bottom-1.5 -left-1.5 cursor-nesw-resize"],
      ["se", "-bottom-1.5 -right-1.5 cursor-nwse-resize"],
    ] as const).map(([mode, className]) => (
      <span
        key={mode}
        onPointerDown={(event) => begin(event, selection, mode, box)}
        className={`absolute h-3 w-3 border border-foreground bg-background ${className}`}
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
        className={`absolute cursor-move border-2 ${
          active ? "border-blue-600 bg-blue-500/20" : "border-slate-500 bg-white/20"
        } ${isPhoto && shape === "circle" ? "rounded-full" : ""}`}
        style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%` }}
      >
        <span className="absolute left-0 top-0 bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {label}
        </span>
        {active && handles(selection, box)}
      </div>
    );
  };

  return (
    <div
      ref={frameRef}
      className="relative select-none overflow-hidden border border-slate-300 bg-slate-100"
      style={{ touchAction: "none" }}
    >
      <img src={src} alt="Theme template" className="block w-full select-none" draggable={false} />
      {overlay("photo", photoBox, "Photo")}
      {textFields.map((field) => overlay(field.id, field, field.label))}
    </div>
  );
}