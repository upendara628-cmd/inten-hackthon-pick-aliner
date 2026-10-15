import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import type { Box } from "@/components/box-editor";
import { LayoutEditor } from "@/components/layout-editor";
import { RatioCanvas } from "@/components/ratio-canvas";
import { Button } from "@/components/ui/button";
import { RATIOS } from "@/lib/ratios";
import {
  DEFAULT_TEXT_FIELDS,
  fileToDataUrl,
  newId,
  saveTheme,
  type ShapeType,
  type TextAlign,
  type TextField,
  type Theme,
  type UserTextValues,
} from "@/lib/store";
import { loadImage } from "@/lib/render";
import { TemplateSizeControls } from "@/components/template-size-controls";
import {
  DEFAULT_TEMPLATE_SIZE_CONFIG,
  renderResizedTemplate,
  type TemplateSizeConfig,
} from "@/lib/template-resizer";

import { AdminGuard } from "@/components/admin-guard";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Framewise" },
      {
        name: "description",
        content: "Upload a template, draw the photo placeholder, and publish a shareable theme.",
      },
      { property: "og:title", content: "Admin Portal — Framewise" },
      {
        property: "og:description",
        content: "Upload a template, draw the photo placeholder, and publish a shareable theme.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: function AdminRouteComponent() {
    return (
      <AdminGuard>
        <AdminCreator />
      </AdminGuard>
    );
  },
});

const DEFAULT_BOX: Box = { x: 32, y: 18, width: 36, height: 30 };

function AdminCreator() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [rawImage, setRawImage] = useState<HTMLImageElement | null>(null);
  const [sizeConfig, setSizeConfig] = useState<TemplateSizeConfig>(DEFAULT_TEMPLATE_SIZE_CONFIG);
  const [src, setSrc] = useState<string | null>(null);
  const [bg, setBg] = useState<HTMLImageElement | null>(null);
  const [box, setBox] = useState<Box>(DEFAULT_BOX);
  const [shape, setShape] = useState<ShapeType>("rectangle");
  const [textFields, setTextFields] = useState<TextField[]>(
    DEFAULT_TEXT_FIELDS.map((field) => ({ ...field })),
  );
  const [editorTab, setEditorTab] = useState<"photo" | "text">("photo");
  const [selected, setSelected] = useState<string>("photo");
  const [previewText, setPreviewText] = useState<UserTextValues>({
    fullName: "FULL NAME",
    jobTitle: "JOB TITLE / ROLE",
    idCode: "ID / CODE",
  });
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!src) {
      setBg(null);
      return;
    }
    let cancelled = false;
    loadImage(src).then((img) => {
      if (!cancelled) setBg(img);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  const onFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const img = await loadImage(dataUrl);
      setRawSrc(dataUrl);
      setRawImage(img);

      const nw = img.naturalWidth || 1080;
      const nh = img.naturalHeight || 1080;

      const dynamicConfig: TemplateSizeConfig = {
        presetId: "original",
        width: nw,
        height: nh,
        fitMode: "contain",
        bgColor: "#ffffff",
        panX: 0,
        panY: 0,
        lockAspect: true,
      };
      setSizeConfig(dynamicConfig);
      // Directly assign the uploaded image dataUrl: NEVER crop or remove edges on upload!
      setSrc(dataUrl);
      setBox(DEFAULT_BOX);
      setTextFields(DEFAULT_TEXT_FIELDS.map((field) => ({ ...field })));
      setSelected("photo");
      toast.success(`Template loaded: ${nw} × ${nh} px (Dynamic Full Frame)`);
    } catch {
      toast.error("Could not load that template image.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSizeConfigChange = (newConfig: TemplateSizeConfig) => {
    setSizeConfig(newConfig);
    if (!rawImage || !rawSrc) return;

    if (
      newConfig.presetId === "original" ||
      (newConfig.width === rawImage.naturalWidth && newConfig.height === rawImage.naturalHeight)
    ) {
      setSrc(rawSrc); // Always use raw source directly so 0 edges are removed!
    } else {
      const resized = renderResizedTemplate(rawImage, newConfig);
      setSrc(resized);
    }
  };

  const preview: Theme = {
    id: "preview",
    title: title || "Untitled theme",
    background_image_url: src ?? "",
    box_x: box.x,
    box_y: box.y,
    box_width: box.width,
    box_height: box.height,
    shape_type: shape,
    template_width: sizeConfig.width,
    template_height: sizeConfig.height,
    text_fields: textFields,
    created_at: new Date().toISOString(),
  };

  const selectedField = textFields.find((field) => field.id === selected);

  const updateField = (id: string, changes: Partial<TextField>) => {
    setTextFields((current) =>
      current.map((field) => (field.id === id ? { ...field, ...changes } : field)),
    );
  };

  const addTextField = () => {
    const id = newId();
    const next: TextField = {
      id,
      label: `Text Field ${textFields.length + 1}`,
      x: 20,
      y: Math.min(84, 20 + textFields.length * 10),
      width: 60,
      height: 8,
      font_size: 4,
      color: "#111827",
      align: "center",
      font_weight: "normal",
    };
    setTextFields((current) => [...current, next]);
    setPreviewText((current) => ({ ...current, [id]: next.label.toUpperCase() }));
    setSelected(id);
    setEditorTab("text");
  };

  const removeTextField = (id: string) => {
    setTextFields((current) => current.filter((field) => field.id !== id));
    setPreviewText((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setSelected("photo");
  };

  const save = async () => {
    if (!src) {
      toast.error("Upload a template image first.");
      return;
    }
    if (!title.trim()) {
      toast.error("Give the theme a name.");
      return;
    }
    if (box.width < 2 || box.height < 2) {
      toast.error("Draw a photo placeholder box.");
      return;
    }
    setSaving(true);
    try {
      const id = newId();
      await saveTheme({ ...preview, id, title: title.trim() });
      toast.success("Theme saved. Share link generated.");
      navigate({ to: "/gallery" });
    } catch {
      toast.error("Could not save the theme.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#6C2BFF]">
              Studio · Template Builder
            </span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Theme Creator
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Upload a base template graphic, then draw the photo placeholder and define dynamic
              text slots.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* Left Controls Column */}
          <div className="space-y-6 rounded-2xl border border-purple-100/90 bg-white/95 p-6 shadow-md shadow-purple-500/5 backdrop-blur-md">
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                htmlFor="title"
              >
                Theme Name
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AI Hackathon Participant Badge"
                className="mt-2 w-full rounded-xl border border-purple-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#6C2BFF] focus:ring-2 focus:ring-purple-200"
              />
            </div>

            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Template Graphic
              </span>
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-5 text-center text-sm transition-all duration-200 hover:border-purple-300 hover:bg-purple-50/70">
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-[#6C2BFF]" />
                    <span className="text-xs font-semibold text-purple-900">Processing image…</span>
                  </>
                ) : (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6C2BFF] shadow-xs">
                      <Upload className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {src ? "Replace template graphic" : "Upload template graphic"}
                    </span>
                    <span className="text-[11px] text-slate-500">PNG, SVG, or JPG</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
              </label>
            </div>

            {/* Template Size & Aspect Ratio Customizer */}
            {rawImage && (
              <TemplateSizeControls
                rawImage={rawImage}
                config={sizeConfig}
                onChange={handleSizeConfigChange}
              />
            )}

            <div className="border-t border-purple-100 pt-5">
              {/* Tab Selector */}
              <div
                className="flex rounded-xl border border-purple-100 bg-purple-50/60 p-1"
                role="tablist"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={editorTab === "photo"}
                  onClick={() => {
                    setEditorTab("photo");
                    setSelected("photo");
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                    editorTab === "photo"
                      ? "bg-[#6C2BFF] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#6C2BFF]"
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Photo Slot</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={editorTab === "text"}
                  onClick={() => setEditorTab("text")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                    editorTab === "text"
                      ? "bg-[#6C2BFF] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#6C2BFF]"
                  }`}
                >
                  <Type className="h-3.5 w-3.5" />
                  <span>Text Slots</span>
                </button>
              </div>

              {editorTab === "photo" ? (
                <div className="mt-5 space-y-4">
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Photo Shape
                    </span>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {(["rectangle", "circle"] as ShapeType[]).map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setShape(value);
                            if (value === "circle") {
                              const avg = Math.round((box.width + box.height) / 2);
                              setBox((b) => ({ ...b, width: avg, height: avg }));
                            }
                          }}
                          className={`rounded-xl border py-2.5 text-xs font-bold capitalize transition-all ${
                            shape === value
                              ? "border-[#6C2BFF] bg-purple-50 text-[#6C2BFF] shadow-xs"
                              : "border-purple-100 bg-white text-slate-700 hover:bg-purple-50/40"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slot Sizing & Quick Alignment */}
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Slot Sizing &amp; Alignment
                    </span>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const avg = Math.round((box.width + box.height) / 2);
                          setBox((b) => ({ ...b, width: avg, height: avg }));
                        }}
                        className="rounded-xl border border-purple-200 bg-purple-50/60 px-3 py-2 text-xs font-semibold text-[#6C2BFF] transition hover:bg-purple-100 active:scale-95"
                      >
                        Make 1:1 Square
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBox((b) => ({ ...b, x: Math.max(0, (100 - b.width) / 2) }));
                        }}
                        className="rounded-xl border border-purple-200 bg-purple-50/60 px-3 py-2 text-xs font-semibold text-[#6C2BFF] transition hover:bg-purple-100 active:scale-95"
                      >
                        Center Horizontally
                      </button>
                    </div>
                  </div>

                  {/* Fine-tune dimensions */}
                  <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-3 space-y-2">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Fine-Tune Size (% of Frame)
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500">
                          Width (%)
                        </label>
                        <input
                          type="number"
                          min={5}
                          max={95}
                          value={Math.round(box.width)}
                          onChange={(e) => {
                            const w = Math.max(5, Math.min(95, parseInt(e.target.value, 10) || 5));
                            setBox((b) => ({ ...b, width: w, x: Math.min(b.x, 100 - w) }));
                          }}
                          className="mt-1 w-full rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 outline-none transition focus:border-[#6C2BFF]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500">
                          Height (%)
                        </label>
                        <input
                          type="number"
                          min={5}
                          max={95}
                          value={Math.round(box.height)}
                          onChange={(e) => {
                            const h = Math.max(5, Math.min(95, parseInt(e.target.value, 10) || 5));
                            setBox((b) => ({ ...b, height: h, y: Math.min(b.y, 100 - h) }));
                          }}
                          className="mt-1 w-full rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 outline-none transition focus:border-[#6C2BFF]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Custom Fields
                    </span>
                    <button
                      type="button"
                      onClick={addTextField}
                      className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-[#6C2BFF] transition-all hover:bg-purple-100"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add field</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {textFields.map((field) => (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => setSelected(field.id)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all ${
                          selected === field.id
                            ? "border-[#6C2BFF] bg-purple-50/80 text-[#6C2BFF] shadow-xs"
                            : "border-purple-100 bg-white text-slate-700 hover:bg-purple-50/40"
                        }`}
                      >
                        <Type className="h-3.5 w-3.5 shrink-0 text-[#6C2BFF]" />
                        <span className="truncate">{field.label}</span>
                      </button>
                    ))}
                  </div>

                  {selectedField && (
                    <div className="space-y-4 rounded-xl border border-purple-100 bg-purple-50/30 p-4">
                      <div>
                        <label
                          htmlFor="field-label"
                          className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                        >
                          Field Label
                        </label>
                        <input
                          id="field-label"
                          value={selectedField.label}
                          onChange={(event) =>
                            updateField(selectedField.id, { label: event.target.value })
                          }
                          maxLength={40}
                          className="mt-1 w-full rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#6C2BFF]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="preview-value"
                          className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                        >
                          Preview Value
                        </label>
                        <input
                          id="preview-value"
                          value={previewText[selectedField.id] ?? ""}
                          onChange={(event) =>
                            setPreviewText((current) => ({
                              ...current,
                              [selectedField.id]: event.target.value,
                            }))
                          }
                          maxLength={80}
                          className="mt-1 w-full rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#6C2BFF]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="font-size"
                            className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                          >
                            Font Size (%)
                          </label>
                          <input
                            id="font-size"
                            type="number"
                            min="1"
                            max="20"
                            step="0.2"
                            value={selectedField.font_size}
                            onChange={(event) =>
                              updateField(selectedField.id, {
                                font_size: Math.max(
                                  1,
                                  Math.min(20, Number(event.target.value) || 1),
                                ),
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#6C2BFF]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="font-color"
                            className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                          >
                            Color
                          </label>
                          <div className="mt-1 flex items-center overflow-hidden rounded-lg border border-purple-200 bg-white">
                            <input
                              aria-label="Choose font color"
                              type="color"
                              value={selectedField.color}
                              onChange={(event) =>
                                updateField(selectedField.id, {
                                  color: event.target.value.toUpperCase(),
                                })
                              }
                              className="h-8 w-8 cursor-pointer border-0 bg-transparent p-0.5"
                            />
                            <input
                              id="font-color"
                              value={selectedField.color}
                              onChange={(event) =>
                                /^#[0-9A-Fa-f]{0,6}$/.test(event.target.value) &&
                                updateField(selectedField.id, { color: event.target.value })
                              }
                              onBlur={() =>
                                !/^#[0-9A-Fa-f]{6}$/.test(selectedField.color) &&
                                updateField(selectedField.id, { color: "#111827" })
                              }
                              maxLength={7}
                              className="w-full border-l border-purple-100 px-2 font-mono text-[11px] uppercase text-slate-900 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Alignment
                        </span>
                        <div className="mt-1 grid grid-cols-3 gap-1 rounded-lg border border-purple-200 bg-purple-50 p-0.5">
                          {(["left", "center", "right"] as TextAlign[]).map((align) => {
                            const Icon =
                              align === "left"
                                ? AlignLeft
                                : align === "right"
                                  ? AlignRight
                                  : AlignCenter;
                            return (
                              <button
                                key={align}
                                type="button"
                                aria-label={`Align ${align}`}
                                title={`Align ${align}`}
                                onClick={() => updateField(selectedField.id, { align })}
                                className={`flex items-center justify-center rounded-md py-1 text-xs transition-all ${
                                  selectedField.align === align
                                    ? "bg-[#6C2BFF] text-white shadow-xs"
                                    : "text-slate-600 hover:text-[#6C2BFF]"
                                }`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Weight
                        </span>
                        <div className="mt-1 grid grid-cols-2 gap-1 rounded-lg border border-purple-200 bg-purple-50 p-0.5">
                          {(["normal", "bold"] as const).map((font_weight) => (
                            <button
                              key={font_weight}
                              type="button"
                              onClick={() => updateField(selectedField.id, { font_weight })}
                              className={`rounded-md py-1 text-xs font-semibold capitalize transition-all ${
                                selectedField.font_weight === font_weight
                                  ? "bg-[#6C2BFF] text-white shadow-xs"
                                  : "text-slate-600 hover:text-[#6C2BFF]"
                              }`}
                            >
                              {font_weight}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeTextField(selectedField.id)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 py-1.5 text-xs font-bold text-red-600 transition-all hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Field</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Coordinates Readout */}
            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5 text-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6C2BFF]">
                Placeholder Geometry (% of Frame)
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-700">
                <div>
                  X: <span className="font-bold text-slate-900">{box.x.toFixed(1)}%</span>
                </div>
                <div>
                  Y: <span className="font-bold text-slate-900">{box.y.toFixed(1)}%</span>
                </div>
                <div>
                  W: <span className="font-bold text-slate-900">{box.width.toFixed(1)}%</span>
                </div>
                <div>
                  H: <span className="font-bold text-slate-900">{box.height.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Save & Generate Link CTA */}
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="btn-studlyf-primary flex w-full items-center justify-center gap-2 py-3 text-xs font-bold shadow-md shadow-purple-500/30"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving &amp; generating link…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Save &amp; Generate Link</span>
                </>
              )}
            </button>
          </div>

          {/* Right Editor & Previews Column */}
          <div className="space-y-8">
            <div className="rounded-2xl border border-purple-100/90 bg-white/95 p-6 shadow-md shadow-purple-500/5 backdrop-blur-md">
              <div className="border-b border-purple-50 pb-3">
                <h2 className="text-base font-bold text-slate-900">Interactive Template Layout</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Drag the photo box and text areas to position them. Drag corners to resize.
                </p>
              </div>

              <div className="mt-5">
                {src ? (
                  <LayoutEditor
                    src={src}
                    photoBox={box}
                    shape={shape}
                    textFields={textFields}
                    selected={selected}
                    templateWidth={sizeConfig.width}
                    templateHeight={sizeConfig.height}
                    onPhotoBoxChange={setBox}
                    onTextFieldChange={(id, position) => updateField(id, position)}
                    onSelectionChange={(selection) => {
                      setSelected(selection);
                      setEditorTab(selection === "photo" ? "photo" : "text");
                    }}
                  />
                ) : (
                  <div className="grid h-80 place-items-center rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-8 text-center text-sm text-slate-500">
                    <div>
                      <Upload className="mx-auto h-8 w-8 text-[#6C2BFF] opacity-60" />
                      <p className="mt-3 font-semibold text-slate-700">
                        Upload a template image on the left to start
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Supports PNG, SVG, and high-res JPG frames
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="border-b border-purple-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  Live Multi-Ratio Output Preview
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Real-time preview of how your layout adapts across all 3 standard formats.
                </p>
              </div>

              <div className="mt-5 grid gap-6 sm:grid-cols-3">
                {RATIOS.map((r) => (
                  <RatioCanvas
                    key={r.key}
                    ratio={r}
                    theme={preview}
                    background={bg}
                    textValues={previewText}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
