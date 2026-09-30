import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlignCenter, AlignLeft, AlignRight, ImageIcon, Loader2, Plus, Trash2, Type, Upload } from "lucide-react";
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
  component: AdminCreator,
});

const DEFAULT_BOX: Box = { x: 32, y: 18, width: 36, height: 30 };

function AdminCreator() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
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
      setSrc(await fileToDataUrl(file));
      setBox(DEFAULT_BOX);
      setTextFields(DEFAULT_TEXT_FIELDS.map((field) => ({ ...field })));
      setSelected("photo");
    } finally {
      setProcessing(false);
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
      navigate({ to: "/admin/themes" });
    } catch {
      toast.error("Could not save the theme.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Theme creator</h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload a base template, then position the photo and text areas.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-5 border border-slate-200 p-5">
            <div>
              <label className="text-sm font-medium text-slate-900" htmlFor="title">
                Theme name
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Summit Badge"
                className="mt-2 w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <span className="text-sm font-medium text-slate-900">Template image</span>
              <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 border border-dashed border-slate-300 px-3 py-6 text-sm text-slate-600 hover:border-slate-400">
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing image…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> {src ? "Replace image" : "Choose image"}
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

            <div className="border-t border-slate-200 pt-5">
              <div className="grid grid-cols-2 gap-px border border-slate-300 bg-slate-300" role="tablist">
                <Button
                  type="button"
                  role="tab"
                  aria-selected={editorTab === "photo"}
                  onClick={() => {
                    setEditorTab("photo");
                    setSelected("photo");
                  }}
                  className={`rounded-none shadow-none transition-none ${editorTab === "photo" ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"}`}
                >
                  <ImageIcon /> Photo
                </Button>
                <Button
                  type="button"
                  role="tab"
                  aria-selected={editorTab === "text"}
                  onClick={() => setEditorTab("text")}
                  className={`rounded-none shadow-none transition-none ${editorTab === "text" ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"}`}
                >
                  <Type /> Text fields
                </Button>
              </div>

              {editorTab === "photo" ? (
                <div className="mt-4">
                  <span className="text-sm font-medium text-slate-900">Photo shape</span>
                  <div className="mt-2 grid grid-cols-2 gap-px border border-slate-300 bg-slate-300">
                    {(["rectangle", "circle"] as ShapeType[]).map((value) => (
                      <Button
                        key={value}
                        type="button"
                        onClick={() => setShape(value)}
                        className={`rounded-none capitalize shadow-none transition-none ${shape === value ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"}`}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">Custom fields</span>
                    <Button type="button" size="sm" variant="outline" onClick={addTextField} className="rounded-none transition-none">
                      <Plus /> Add field
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {textFields.map((field) => (
                      <Button
                        key={field.id}
                        type="button"
                        variant="outline"
                        onClick={() => setSelected(field.id)}
                        className={`justify-start rounded-none shadow-none transition-none ${selected === field.id ? "border-blue-600 bg-blue-50" : ""}`}
                      >
                        <Type /> <span className="truncate">{field.label}</span>
                      </Button>
                    ))}
                  </div>

                  {selectedField && (
                    <div className="space-y-4 border-t border-slate-200 pt-4">
                      <div>
                        <label htmlFor="field-label" className="text-xs font-medium text-slate-700">Field label</label>
                        <input id="field-label" value={selectedField.label} onChange={(event) => updateField(selectedField.id, { label: event.target.value })} maxLength={40} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600" />
                      </div>
                      <div>
                        <label htmlFor="preview-value" className="text-xs font-medium text-slate-700">Preview value</label>
                        <input id="preview-value" value={previewText[selectedField.id] ?? ""} onChange={(event) => setPreviewText((current) => ({ ...current, [selectedField.id]: event.target.value }))} maxLength={80} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="font-size" className="text-xs font-medium text-slate-700">Font size</label>
                          <input id="font-size" type="number" min="1" max="20" step="0.2" value={selectedField.font_size} onChange={(event) => updateField(selectedField.id, { font_size: Math.max(1, Math.min(20, Number(event.target.value) || 1)) })} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600" />
                        </div>
                        <div>
                          <label htmlFor="font-color" className="text-xs font-medium text-slate-700">Font color</label>
                          <div className="mt-1 grid grid-cols-[36px_minmax(0,1fr)] border border-slate-300">
                            <input aria-label="Choose font color" type="color" value={selectedField.color} onChange={(event) => updateField(selectedField.id, { color: event.target.value.toUpperCase() })} className="h-9 w-9 cursor-pointer border-0 bg-background p-1" />
                            <input id="font-color" value={selectedField.color} onChange={(event) => /^#[0-9A-Fa-f]{0,6}$/.test(event.target.value) && updateField(selectedField.id, { color: event.target.value })} onBlur={() => !/^#[0-9A-Fa-f]{6}$/.test(selectedField.color) && updateField(selectedField.id, { color: "#111827" })} maxLength={7} className="min-w-0 border-l border-slate-300 px-2 font-mono text-xs uppercase outline-none" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-700">Alignment</span>
                        <div className="mt-1 grid grid-cols-3 gap-px border border-slate-300 bg-slate-300">
                          {(["left", "center", "right"] as TextAlign[]).map((align) => {
                            const Icon = align === "left" ? AlignLeft : align === "right" ? AlignRight : AlignCenter;
                            return <Button key={align} type="button" aria-label={`Align ${align}`} title={`Align ${align}`} onClick={() => updateField(selectedField.id, { align })} className={`rounded-none px-2 shadow-none transition-none ${selectedField.align === align ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"}`}><Icon /></Button>;
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-700">Font weight</span>
                        <div className="mt-1 grid grid-cols-2 gap-px border border-slate-300 bg-slate-300">
                          {(["normal", "bold"] as const).map((font_weight) => <Button key={font_weight} type="button" onClick={() => updateField(selectedField.id, { font_weight })} className={`rounded-none capitalize shadow-none transition-none ${selectedField.font_weight === font_weight ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"}`}>{font_weight}</Button>)}
                        </div>
                      </div>
                      <Button type="button" variant="outline" onClick={() => removeTextField(selectedField.id)} className="w-full rounded-none text-destructive transition-none"><Trash2 /> Delete field</Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <dl className="space-y-1 border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              {(
                [
                  ["X", box.x],
                  ["Y", box.y],
                  ["Width", box.width],
                  ["Height", box.height],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt>{label}</dt>
                  <dd className="font-mono text-slate-900">{value.toFixed(1)}%</dd>
                </div>
              ))}
            </dl>

            <Button
              type="button"
              onClick={save}
              disabled={saving}
              className="w-full rounded-none transition-none"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save &amp; Generate Link
            </Button>
          </div>

          <div className="space-y-6">
            <div className="border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900">Template layout</h2>
              <p className="mt-1 text-xs text-slate-500">
                Drag the photo and text areas to position them. Use the corner handles to resize.
              </p>
              <div className="mt-4">
                {src ? (
                  <LayoutEditor
                    src={src}
                    photoBox={box}
                    shape={shape}
                    textFields={textFields}
                    selected={selected}
                    onPhotoBoxChange={setBox}
                    onTextFieldChange={(id, position) => updateField(id, position)}
                    onSelectionChange={(selection) => {
                      setSelected(selection);
                      setEditorTab(selection === "photo" ? "photo" : "text");
                    }}
                  />
                ) : (
                  <div className="grid h-72 place-items-center border border-dashed border-slate-300 text-sm text-slate-500">
                    Upload a template image to start
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">Auto-resized output</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
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
