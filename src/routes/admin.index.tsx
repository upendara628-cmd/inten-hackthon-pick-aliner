import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { BoxEditor, type Box } from "@/components/box-editor";
import { RatioCanvas } from "@/components/ratio-canvas";
import { RATIOS } from "@/lib/ratios";
import { fileToDataUrl, newId, saveTheme, type ShapeType, type Theme } from "@/lib/store";
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
    created_at: new Date().toISOString(),
  };

  const save = async () => {
    if (!src) return toast.error("Upload a template image first.");
    if (!title.trim()) return toast.error("Give the theme a name.");
    if (box.width < 2 || box.height < 2) return toast.error("Draw a photo placeholder box.");
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
          Upload a base template, then drag on it to mark where the user&apos;s photo goes.
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

            <div>
              <span className="text-sm font-medium text-slate-900">Placeholder shape</span>
              <div className="mt-2 grid grid-cols-2 gap-px border border-slate-300 bg-slate-300">
                {(["rectangle", "circle"] as ShapeType[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShape(s)}
                    className={`bg-white px-3 py-2 text-sm capitalize ${
                      shape === s ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
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

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save &amp; Generate Link
            </button>
          </div>

          <div className="space-y-6">
            <div className="border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900">Bounding box editor</h2>
              <p className="mt-1 text-xs text-slate-500">
                Drag on the template to draw a new box. Drag the box to move it, or its corners to
                resize.
              </p>
              <div className="mt-4">
                {src ? (
                  <BoxEditor src={src} box={box} shape={shape} onChange={setBox} />
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
                  <RatioCanvas key={r.key} ratio={r} theme={preview} background={bg} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
