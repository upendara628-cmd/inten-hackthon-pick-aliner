import { getTextFields, type PhotoAdjustment, type Theme, type UserTextValues } from "./store";

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

/** Returns destination rect for drawing source of sw x sh inside dw x dh preserving 100% full content without cropping any edges. */
export function containRect(sw: number, sh: number, dw: number, dh: number) {
  const scale = Math.min(dw / sw, dh / sh);
  const w = sw * scale;
  const h = sh * scale;
  return { x: (dw - w) / 2, y: (dh - h) / 2, w, h, scale };
}

/**
 * Draws the theme background dynamically preserving all edges (zero cropping),
 * and clips the user's photo into the admin-defined bounding box, with zoom & pan adjustments.
 */
export function renderComposite(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  theme: Theme,
  bg: HTMLImageElement,
  photo?: HTMLImageElement | null,
  textValues?: UserTextValues,
  photoAdjust?: PhotoAdjustment,
) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Dynamically fit template background preserving 100% of all edges (never remove edges!)
  const base = containRect(bg.naturalWidth, bg.naturalHeight, width, height);

  // If destination canvas aspect ratio differs from template, draw a subtle ambient backdrop
  if (base.w < width || base.h < height) {
    ctx.save();
    ctx.filter = "blur(32px) brightness(0.96)";
    ctx.drawImage(bg, -20, -20, width + 40, height + 40);
    ctx.restore();
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fillRect(0, 0, width, height);
  }

  // Draw 100% of the template graphic with ZERO edges removed
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bg, base.x, base.y, base.w, base.h);

  // Bounding box in canvas pixels (percentages are relative to the template image).
  const bx = base.x + (theme.box_x / 100) * base.w;
  const by = base.y + (theme.box_y / 100) * base.h;
  const bw = (theme.box_width / 100) * base.w;
  const bh = (theme.box_height / 100) * base.h;

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
    const scale = photoAdjust?.scale ?? 1;
    const finalW = p.w * scale;
    const finalH = p.h * scale;

    const offsetX = ((photoAdjust?.offsetX ?? 0) / 100) * bw;
    const offsetY = ((photoAdjust?.offsetY ?? 0) / 100) * bh;

    const centerX = bx + bw / 2 + offsetX;
    const centerY = by + bh / 2 + offsetY;

    const drawX = centerX - finalW / 2;
    const drawY = centerY - finalH / 2;

    ctx.drawImage(photo, drawX, drawY, finalW, finalH);
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
