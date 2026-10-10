import { useState } from "react";
import {
  Maximize2,
  Lock,
  Unlock,
  ArrowLeftRight,
  MoveVertical,
  MoveHorizontal,
  Check,
  Sparkles,
  CreditCard,
  Square,
  Smartphone,
  Image as ImageIcon,
  Monitor,
} from "lucide-react";
import {
  TEMPLATE_PRESETS,
  type TemplateFitMode,
  type TemplatePreset,
  type TemplateSizeConfig,
} from "@/lib/template-resizer";

interface TemplateSizeControlsProps {
  rawImage: HTMLImageElement | null;
  config: TemplateSizeConfig;
  onChange: (config: TemplateSizeConfig) => void;
}

export function TemplateSizeControls({ rawImage, config, onChange }: TemplateSizeControlsProps) {
  const [aspectRatio, setAspectRatio] = useState<number>(
    config.height > 0 ? config.width / config.height : 1,
  );

  const getPresetIcon = (id: string) => {
    switch (id) {
      case "id_card":
        return <CreditCard className="h-3.5 w-3.5" />;
      case "square":
        return <Square className="h-3.5 w-3.5" />;
      case "portrait":
        return <ImageIcon className="h-3.5 w-3.5" />;
      case "story":
        return <Smartphone className="h-3.5 w-3.5" />;
      case "landscape":
        return <Monitor className="h-3.5 w-3.5" />;
      default:
        return <Maximize2 className="h-3.5 w-3.5" />;
    }
  };

  const handleSelectPreset = (preset: TemplatePreset) => {
    let nextW = preset.width;
    let nextH = preset.height;

    if (preset.id === "original") {
      nextW = rawImage?.naturalWidth || 1080;
      nextH = rawImage?.naturalHeight || 1080;
    }

    const nextRatio = nextH > 0 ? nextW / nextH : 1;
    setAspectRatio(nextRatio);

    onChange({
      ...config,
      presetId: preset.id,
      width: nextW,
      height: nextH,
      panX: 0,
      panY: 0,
    });
  };

  const handleWidthChange = (val: number) => {
    const w = Math.max(100, Math.min(6000, val || 100));
    let h = config.height;
    if (config.lockAspect && aspectRatio > 0) {
      h = Math.round(w / aspectRatio);
    }
    onChange({
      ...config,
      presetId: "custom",
      width: w,
      height: h,
    });
  };

  const handleHeightChange = (val: number) => {
    const h = Math.max(100, Math.min(6000, val || 100));
    let w = config.width;
    if (config.lockAspect && aspectRatio > 0) {
      w = Math.round(h * aspectRatio);
    }
    onChange({
      ...config,
      presetId: "custom",
      width: w,
      height: h,
    });
  };

  const handleSwapOrientation = () => {
    const nextW = config.height;
    const nextH = config.width;
    setAspectRatio(nextH > 0 ? nextW / nextH : 1);
    onChange({
      ...config,
      presetId: "custom",
      width: nextW,
      height: nextH,
    });
  };

  const toggleLockAspect = () => {
    const nextLock = !config.lockAspect;
    if (nextLock && config.height > 0) {
      setAspectRatio(config.width / config.height);
    }
    onChange({
      ...config,
      lockAspect: nextLock,
    });
  };

  // Determine whether horizontal or vertical pan is relevant based on aspect ratio difference
  const sourceAspect = rawImage ? rawImage.naturalWidth / rawImage.naturalHeight : 1;
  const targetAspect = config.height > 0 ? config.width / config.height : 1;
  const canPanVertically = targetAspect < sourceAspect; // Target is taller/slimmer than source
  const canPanHorizontally = targetAspect > sourceAspect; // Target is wider than source

  return (
    <div className="space-y-4 rounded-2xl border border-purple-200/90 bg-gradient-to-br from-purple-50/40 via-white to-orange-50/20 p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#6C2BFF] text-white">
            <Maximize2 className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Template Size &amp; Ratio
            </h3>
          </div>
        </div>

        {/* Current Size Readout Badge */}
        <span className="rounded-full bg-purple-100 px-2 py-0.5 font-mono text-[11px] font-bold text-[#6C2BFF]">
          {config.width} × {config.height} px
        </span>
      </div>

      {config.presetId === "original" && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 px-3 py-2 text-emerald-800 text-xs">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">
            Dynamic Full Size active: 100% of your uploaded image is preserved with zero edge
            cropping.
          </span>
        </div>
      )}

      {/* Preset Buttons Grid */}
      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Standard Size Presets
        </label>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {TEMPLATE_PRESETS.filter((p) => p.id !== "custom").map((preset) => {
            const isActive = config.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`flex flex-col items-start rounded-xl border p-2 text-left transition-all ${
                  isActive
                    ? "border-[#6C2BFF] bg-purple-50 text-[#6C2BFF] shadow-xs ring-1 ring-[#6C2BFF]"
                    : "border-purple-100 bg-white text-slate-700 hover:border-purple-200 hover:bg-purple-50/40"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] font-bold">
                    {getPresetIcon(preset.id)}
                    {preset.label}
                  </span>
                  {isActive && <Check className="h-3 w-3 text-[#6C2BFF]" />}
                </div>
                <span className="mt-0.5 font-mono text-[10px] text-slate-500">
                  {preset.id === "original" && rawImage
                    ? `${rawImage.naturalWidth} × ${rawImage.naturalHeight}`
                    : preset.ratioLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Dimensions (Width, Height, Lock Aspect, Swap) */}
      <div className="rounded-xl border border-purple-100 bg-white p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Dimensions (Pixels)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSwapOrientation}
              title="Swap Width & Height (Rotate orientation)"
              className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50/50 px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-purple-100 hover:text-[#6C2BFF]"
            >
              <ArrowLeftRight className="h-3 w-3" />
              <span>Rotate</span>
            </button>
            <button
              type="button"
              onClick={toggleLockAspect}
              title={config.lockAspect ? "Aspect ratio locked" : "Aspect ratio unlocked"}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
                config.lockAspect
                  ? "border-[#6C2BFF] bg-purple-100 text-[#6C2BFF]"
                  : "border-purple-200 bg-white text-slate-500 hover:bg-purple-50"
              }`}
            >
              {config.lockAspect ? (
                <>
                  <Lock className="h-3 w-3" />
                  <span>Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="h-3 w-3" />
                  <span>Free</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500">
              Width (px)
            </label>
            <input
              type="number"
              min={100}
              max={6000}
              step={10}
              value={config.width}
              onChange={(e) => handleWidthChange(parseInt(e.target.value, 10))}
              className="mt-1 w-full rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 outline-none transition focus:border-[#6C2BFF] focus:ring-1 focus:ring-purple-200"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500">
              Height (px)
            </label>
            <input
              type="number"
              min={100}
              max={6000}
              step={10}
              value={config.height}
              onChange={(e) => handleHeightChange(parseInt(e.target.value, 10))}
              className="mt-1 w-full rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 outline-none transition focus:border-[#6C2BFF] focus:ring-1 focus:ring-purple-200"
            />
          </div>
        </div>
      </div>

      {/* Fit Mode Selector */}
      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Graphic Fitting Method
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { id: "cover", label: "Cover & Fill", hint: "No borders" },
              { id: "contain", label: "Fit & Pad", hint: "Show all" },
              { id: "stretch", label: "Stretch", hint: "Force fit" },
            ] as const
          ).map((mode) => {
            const isSelected = config.fitMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChange({ ...config, fitMode: mode.id as TemplateFitMode })}
                className={`rounded-xl border p-2 text-center transition-all ${
                  isSelected
                    ? "border-[#6C2BFF] bg-purple-50 text-[#6C2BFF] shadow-xs"
                    : "border-purple-100 bg-white text-slate-700 hover:bg-purple-50/40"
                }`}
              >
                <span className="block text-xs font-bold">{mode.label}</span>
                <span className="block text-[10px] text-slate-500">{mode.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Framing Pan Sliders (When Cover mode is active and aspect ratios differ) */}
      {config.fitMode === "cover" && (
        <div className="rounded-xl border border-purple-100 bg-white p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Template Framing Position
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {config.panX !== 0 || config.panY !== 0 ? "Shifted" : "Centered"}
            </span>
          </div>

          {canPanVertically && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 text-slate-600">
                  <MoveVertical className="h-3 w-3 text-[#6C2BFF]" />
                  Vertical Position
                </span>
                <span className="font-mono text-[10px] font-bold text-[#6C2BFF]">
                  {config.panY === 0
                    ? "Center"
                    : config.panY < 0
                      ? `Top ${Math.abs(config.panY)}%`
                      : `Bottom ${config.panY}%`}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="2"
                value={config.panY}
                onChange={(e) => onChange({ ...config, panY: parseInt(e.target.value, 10) })}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-purple-200 accent-[#6C2BFF]"
              />
            </div>
          )}

          {canPanHorizontally && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 text-slate-600">
                  <MoveHorizontal className="h-3 w-3 text-[#6C2BFF]" />
                  Horizontal Position
                </span>
                <span className="font-mono text-[10px] font-bold text-[#6C2BFF]">
                  {config.panX === 0
                    ? "Center"
                    : config.panX < 0
                      ? `Left ${Math.abs(config.panX)}%`
                      : `Right ${config.panX}%`}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="2"
                value={config.panX}
                onChange={(e) => onChange({ ...config, panX: parseInt(e.target.value, 10) })}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-purple-200 accent-[#6C2BFF]"
              />
            </div>
          )}

          {!canPanVertically && !canPanHorizontally && (
            <p className="text-[11px] text-slate-500">
              Template and source graphic have identical aspect ratio — frame fits edge to edge.
            </p>
          )}
        </div>
      )}

      {/* Background Fill Color (When Contain mode is active) */}
      {config.fitMode === "contain" && (
        <div className="rounded-xl border border-purple-100 bg-white p-3 space-y-2">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Letterbox Background Color
          </span>
          <div className="flex items-center gap-2">
            {[
              { label: "White", color: "#ffffff" },
              { label: "Dark", color: "#0f172a" },
              { label: "Purple", color: "#6C2BFF" },
              { label: "Light", color: "#f8fafc" },
            ].map((c) => (
              <button
                key={c.color}
                type="button"
                onClick={() => onChange({ ...config, bgColor: c.color })}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                  config.bgColor === c.color
                    ? "border-[#6C2BFF] bg-purple-50 text-[#6C2BFF] ring-1 ring-[#6C2BFF]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full border border-black/10"
                  style={{ backgroundColor: c.color }}
                />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
