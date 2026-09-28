import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { RatioCanvas } from "@/components/ratio-canvas";
import { RATIOS } from "@/lib/ratios";
import { fileToDataUrl, getTheme, type Theme } from "@/lib/store";
import { loadImage } from "@/lib/render";

export const Route = createFileRoute("/d/$themeId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Add your photo — Framewise" },
      {
        name: "description",
        content:
          "Upload your photo and download it perfectly aligned in ID card, LinkedIn and Instagram sizes.",
      },
      { property: "og:title", content: "Add your photo — Framewise" },
      {
        property: "og:description",
        content: "Upload your photo and download ID card, LinkedIn and Instagram versions.",
      },
    ],
  }),
  component: Customizer,
});

function Customizer() {
  const { themeId } = Route.useParams();
  const [theme, setTheme] = useState<Theme | null | undefined>(undefined);
  const [bg, setBg] = useState<HTMLImageElement | null>(null);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    getTheme(themeId).then(async (t) => {
      if (!t) return setTheme(null);
      setTheme(t);
      setBg(await loadImage(t.background_image_url));
    });
  }, [themeId]);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setBusy(true);
    try {
      setPhoto(await loadImage(await fileToDataUrl(file)));
      toast.success("Photo aligned into the template");
    } catch {
      toast.error("Could not read that photo.");
    } finally {
      setBusy(false);
    }
  };

  if (theme === undefined) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader />
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 py-16 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading theme…
        </div>
      </div>
    );
  }

  if (theme === null) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h1 className="text-xl font-semibold text-slate-900">Theme not found</h1>
          <p className="mt-2 max-w-lg text-sm text-slate-600">
            This link points to a theme that isn&apos;t available on this device. Themes are stored
            locally in the browser that created them.
          </p>
          <Link
            to="/admin"
            className="mt-6 inline-block border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Go to Admin Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{theme.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload one photo — we place it in the right spot and export every size.
          </p>
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`mx-auto mt-8 flex max-w-xl cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-6 py-10 text-sm ${
            dragging ? "border-blue-600 bg-blue-50" : "border-slate-300 bg-slate-50"
          }`}
        >
          {busy ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
              <span className="text-slate-600">Processing your photo…</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-5 w-5 text-slate-600" />
              <span className="font-medium text-slate-900">
                {photo ? "Replace photo" : "Upload photo"}
              </span>
              <span className="text-xs text-slate-500">Drag and drop, or click to browse</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {RATIOS.map((r) => (
            <RatioCanvas
              key={r.key}
              ratio={r}
              theme={theme}
              background={bg}
              photo={photo}
              downloadable
            />
          ))}
        </div>
      </main>
    </div>
  );
}
