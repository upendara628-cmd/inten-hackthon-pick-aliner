import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImagePlus, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { RatioCanvas } from "@/components/ratio-canvas";
import { RATIOS } from "@/lib/ratios";
import {
  decodeTheme,
  fileToDataUrl,
  getTextFields,
  getTheme,
  saveTheme,
  type Theme,
  type UserTextValues,
} from "@/lib/store";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const [textValues, setTextValues] = useState<UserTextValues>({});

  useEffect(() => {
    getTheme(themeId).then(async (stored) => {
      let t = stored;
      if (!t && typeof window !== "undefined") {
        const match = window.location.hash.match(/#t=([A-Za-z0-9_-]+)/);
        const decoded = match ? decodeTheme(match[1]) : null;
        if (decoded && decoded.id === themeId) {
          t = decoded;
          saveTheme(decoded).catch(() => {});
        }
      }
      if (!t) return setTheme(null);
      setTheme(t);
      setTextValues(Object.fromEntries(getTextFields(t).map((field) => [field.id, ""])));
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
            This link doesn&apos;t contain a valid theme. Ask the theme creator to copy the full
            share link from the Theme Gallery and send it again.
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
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Customizing: {theme.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Add your details once, then download any format below.
          </p>
        </div>

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <section className="border border-slate-200 bg-white p-5" aria-label="Your details">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <UserRound className="h-4 w-4 text-slate-600" />
              <h2 className="text-sm font-semibold text-slate-900">Your details</h2>
            </div>

            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                handleFile(event.dataTransfer.files?.[0]);
              }}
              className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 py-6 text-center text-sm ${
                dragging ? "border-blue-600 bg-blue-50" : "border-slate-300 bg-slate-50"
              }`}
            >
              {busy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
                  <span className="text-slate-600">Processing photo…</span>
                </>
              ) : (
                <>
                  <ImagePlus className="h-5 w-5 text-slate-600" />
                  <span className="font-medium text-slate-900">
                    {photo ? "Replace profile photo" : "Upload profile photo"}
                  </span>
                  <span className="text-xs text-slate-500">Drag and drop, or browse</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </label>

            <div className="mt-5 space-y-4">
              {getTextFields(theme).map((field) => (
                <div key={field.id}>
                  <label htmlFor={`field-${field.id}`} className="text-sm font-medium text-slate-900">
                    {field.label}
                  </label>
                  <input
                    id={`field-${field.id}`}
                    value={textValues[field.id] ?? ""}
                    onChange={(event) =>
                      setTextValues((current) => ({ ...current, [field.id]: event.target.value }))
                    }
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    maxLength={80}
                    className="mt-1.5 w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="preview-heading">
            <h2 id="preview-heading" className="text-sm font-semibold text-slate-900">
              Live previews
            </h2>
            <div className="mt-3 grid items-start gap-4 sm:grid-cols-3">
              {RATIOS.map((ratio) => (
                <RatioCanvas
                  key={ratio.key}
                  ratio={ratio}
                  theme={theme}
                  background={bg}
                  photo={photo}
                  textValues={textValues}
                  downloadable
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
