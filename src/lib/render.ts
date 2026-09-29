import { getTextPositions, type Theme, type UserTextValues } from "./store";

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

/** Returns the destination rect for drawing a source of sw x sh to cover dw x dh. */
export function coverRect(sw: number, sh: number, dw: number, dh: number) {
  const scale = Math.max(dw / sw, dh / sh);
  const w = sw * scale;
  const h = sh * scale;
  return { x: (dw - w) / 2, y: (dh - h) / 2, w, h, scale };
}

/**
 * Draws the theme background (cover-cropped into the canvas) and clips the
 * user's photo into the admin-defined bounding box.
 */
export function renderComposite(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  theme: Theme,
  bg: HTMLImageElement,
  photo?: HTMLImageElement | null,
  textValues?: UserTextValues,
) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const base = coverRect(bg.naturalWidth, bg.naturalHeight, width, height);

  // Bounding box in canvas pixels (percentages are relative to the template image).
  const bx = base.x + (theme.box_x / 100) * base.w;
  const by = base.y + (theme.box_y / 100) * base.h;
  const bw = (theme.box_width / 100) * base.w;
  const bh = (theme.box_height / 100) * base.h;

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bg, base.x, base.y, base.w, base.h);

  if (photo) {
    ctx.save();
    ctx.beginPath();
    if (theme.shape_type === "circle") {
      ctx.ellipse(bx + bw / 2, by + bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2);
    } else {
      ctx.rect(bx, by, bw, bh);
    }
    ctx.clip();
    const p = coverRect(photo.naturalWidth, photo.naturalHeight, bw, bh);
    ctx.drawImage(photo, bx + p.x, by + p.y, p.w, p.h);
    ctx.restore();
  }

  if (textValues) {
    const positions = getTextPositions(theme);
    const fields = [
      { key: "fullName" as const, value: textValues.fullName, weight: 700 },
      { key: "jobTitle" as const, value: textValues.jobTitle, weight: 600 },
      { key: "idCode" as const, value: textValues.idCode, weight: 500 },
    ];

    for (const field of fields) {
      const value = field.value.trim();
      if (!value) continue;
      const position = positions[field.key];
      const tx = base.x + (position.x / 100) * base.w;
      const ty = base.y + (position.y / 100) * base.h;
      const tw = (position.width / 100) * base.w;
      const th = (position.height / 100) * base.h;
      let fontSize = Math.max(12, th * 0.72);

      ctx.save();
      ctx.beginPath();
      ctx.rect(tx, ty, tw, th);
      ctx.clip();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      while (fontSize > 12) {
        ctx.font = `${field.weight} ${fontSize}px Arial, sans-serif`;
        if (ctx.measureText(value).width <= tw * 0.96) break;
        fontSize -= 2;
      }
      ctx.font = `${field.weight} ${fontSize}px Arial, sans-serif`;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = Math.max(2, fontSize * 0.08);
      ctx.strokeText(value, tx + tw / 2, ty + th / 2, tw * 0.96);
      ctx.fillStyle = "#111827";
      ctx.fillText(value, tx + tw / 2, ty + th / 2, tw * 0.96);
      ctx.restore();
    }
  }
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
