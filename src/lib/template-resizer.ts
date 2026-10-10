export interface TemplatePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  ratioLabel: string;
  iconName?: string;
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "original",
    label: "Dynamic Full Size",
    width: 0,
    height: 0,
    ratioLabel: "100% Original (No Crop)",
  },
  {
    id: "id_card",
    label: "ID Card / Badge",
    width: 1275,
    height: 2025,
    ratioLabel: "1275 × 2025 (CR80)",
  },
  {
    id: "square",
    label: "Square Post",
    width: 1080,
    height: 1080,
    ratioLabel: "1080 × 1080 (1:1)",
  },
  {
    id: "portrait",
    label: "Portrait Post",
    width: 1080,
    height: 1350,
    ratioLabel: "1080 × 1350 (4:5)",
  },
  {
    id: "story",
    label: "Story / Vertical",
    width: 1080,
    height: 1920,
    ratioLabel: "1080 × 1920 (9:16)",
  },
  {
    id: "landscape",
    label: "Landscape Banner",
    width: 1920,
    height: 1080,
    ratioLabel: "1920 × 1080 (16:9)",
  },
  {
    id: "custom",
    label: "Custom Size",
    width: 1080,
    height: 1080,
    ratioLabel: "Custom Dimensions",
  },
];

export type TemplateFitMode = "cover" | "contain" | "stretch";

export interface TemplateSizeConfig {
  presetId: string;
  width: number;
  height: number;
  fitMode: TemplateFitMode;
  bgColor: string;
  panX: number; // -50% to +50%
  panY: number; // -50% to +50%
  lockAspect: boolean;
}

export const DEFAULT_TEMPLATE_SIZE_CONFIG: TemplateSizeConfig = {
  presetId: "original",
  width: 0,
  height: 0,
  fitMode: "contain",
  bgColor: "#ffffff",
  panX: 0,
  panY: 0,
  lockAspect: true,
};

/**
 * Renders raw uploaded image onto a canvas of exact target width x height,
 * applying fit mode, background color fill, and framing offset.
 * For original preset, returns the raw image src directly without any modification.
 */
export function renderResizedTemplate(img: HTMLImageElement, config: TemplateSizeConfig): string {
  // If original preset or matching native dimensions, return the raw source directly: ZERO loss, ZERO edge cropping!
  if (
    config.presetId === "original" ||
    !config.width ||
    !config.height ||
    (config.width === img.naturalWidth && config.height === img.naturalHeight)
  ) {
    return img.src;
  }

  const targetW = Math.max(100, Math.round(config.width));
  const targetH = Math.max(100, Math.round(config.height));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return img.src;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const nw = img.naturalWidth || targetW;
  const nh = img.naturalHeight || targetH;

  if (config.fitMode === "stretch") {
    ctx.drawImage(img, 0, 0, targetW, targetH);
  } else if (config.fitMode === "contain") {
    // Fill letterbox area with ambient blur of template so it looks seamless
    if (config.bgColor && config.bgColor !== "transparent") {
      ctx.fillStyle = config.bgColor;
      ctx.fillRect(0, 0, targetW, targetH);
    } else {
      ctx.save();
      ctx.filter = "blur(24px) brightness(0.95)";
      ctx.drawImage(img, -10, -10, targetW + 20, targetH + 20);
      ctx.restore();
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(0, 0, targetW, targetH);
    }

    const scale = Math.min(targetW / nw, targetH / nh);
    const drawW = nw * scale;
    const drawH = nh * scale;
    const drawX = (targetW - drawW) / 2;
    const drawY = (targetH - drawH) / 2;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  } else {
    // cover mode
    const scale = Math.max(targetW / nw, targetH / nh);
    const drawW = nw * scale;
    const drawH = nh * scale;

    // Pan offset allows shifting the covered crop within the bounding canvas
    const maxShiftX = Math.max(0, (drawW - targetW) / 2);
    const maxShiftY = Math.max(0, (drawH - targetH) / 2);
    const shiftX = (config.panX / 50) * maxShiftX;
    const shiftY = (config.panY / 50) * maxShiftY;

    const drawX = (targetW - drawW) / 2 + shiftX;
    const drawY = (targetH - drawH) / 2 + shiftY;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, targetW, targetH);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  return canvas.toDataURL("image/png");
}
