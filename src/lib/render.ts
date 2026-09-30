import { getTextFields, type Theme, type UserTextValues } from "./store";

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
    for (const field of getTextFields(theme)) {
      const value = (textValues[field.id] ?? "").trim();
      if (!value) continue;
      const tx = base.x + (field.x / 100) * base.w;
      const ty = base.y + (field.y / 100) * base.h;
      const tw = (field.width / 100) * base.w;
      const th = (field.height / 100) * base.h;
      const configuredSize = (field.font_size / 100) * base.h;
      let fontSize = Math.max(12, Math.min(configuredSize, th * 0.9));
      const weight = field.font_weight === "bold" ? 700 : 400;
      const textX = field.align === "left" ? tx : field.align === "right" ? tx + tw : tx + tw / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(tx, ty, tw, th);
      ctx.clip();
      ctx.textAlign = field.align;
      ctx.textBaseline = "middle";
      while (fontSize > 12) {
        ctx.font = `${weight} ${fontSize}px Arial, sans-serif`;
        if (ctx.measureText(value).width <= tw * 0.94) break;
        fontSize -= 2;
      }
      ctx.font = `${weight} ${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = field.color;
      ctx.fillText(value, textX, ty + th / 2, tw * 0.94);
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
