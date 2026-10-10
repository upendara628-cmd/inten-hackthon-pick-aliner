import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImagePlus, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { RatioCanvas } from "@/components/ratio-canvas";
import { PhotoAdjuster } from "@/components/photo-adjuster";
import { RATIOS } from "@/lib/ratios";
import {
  decodeTheme,
  DEFAULT_PHOTO_ADJUSTMENT,
  fileToDataUrl,
  getTextFields,
  getTheme,
  saveTheme,
  type PhotoAdjustment,
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
  const [photoAdjust, setPhotoAdjust] = useState<PhotoAdjustment>(DEFAULT_PHOTO_ADJUSTMENT);

  useEffect(() => {
    getTheme(themeId).then(async (stored) => {
      let t = stored;
      if (!t && typeof window !== "undefined") {
        const encoded = window.location.hash.match(/#t=([A-Za-z0-9_-]+)/)?.[1];
        const decoded = encoded ? decodeTheme(encoded) : null;
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
      setPhotoAdjust(DEFAULT_PHOTO_ADJUSTMENT);
      toast.success("Photo aligned into the template");
    } catch {
      toast.error("Could not read that photo.");
    } finally {
      setBusy(false);
    }
  };

  if (theme === undefined) {
    return (
      <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif]">
        <SiteHeader />
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-5 py-24 text-sm font-semibold text-[#6C2BFF]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading theme template…</span>
        </div>
      </div>
    );
  }

  if (theme === null) {
    return (
      <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif]">
        <SiteHeader />
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-[#6C2BFF]">
            <ImagePlus className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Theme Not Found</h1>
          <p className="mt-2 text-sm text-slate-600">
            This link doesn&apos;t contain a valid theme record. Ask the creator to share the link
            again or browse the gallery.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/gallery" className="btn-studlyf-primary px-6 py-2.5 text-xs font-bold">
              Browse Gallery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div>
          <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#6C2BFF]">
            Participant Customizer
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {theme.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload your photo, adjust the text fields, and download print &amp; social ready formats
            below.
          </p>
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Left Controls Card */}
          <section
            className="rounded-2xl border border-purple-100/90 bg-white/95 p-6 shadow-md shadow-purple-500/5 backdrop-blur-md"
            aria-label="Your details"
          >
            <div className="flex items-center gap-2.5 border-b border-purple-50 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-[#6C2BFF]">
                <UserRound className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Your Details</h2>
                <p className="text-[11px] text-slate-500">Photo &amp; credentials</p>
              </div>
            </div>

            {/* Photo Upload Zone */}
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
              className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed p-6 text-center text-sm transition-all duration-200 ${
                dragging
                  ? "border-[#6C2BFF] bg-purple-50"
                  : "border-purple-200 bg-purple-50/40 hover:border-purple-300 hover:bg-purple-50/70"
              }`}
            >
              {busy ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-[#6C2BFF]" />
                  <span className="text-xs font-semibold text-purple-900">Processing photo…</span>
                </>
              ) : (
                <>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#6C2BFF] shadow-xs">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      {photo ? "Replace Profile Photo" : "Upload Profile Photo"}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Drag &amp; drop or click to browse
                    </span>
                  </div>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </label>

            {/* Interactive Photo Framing & Scaling Controls */}
            {photo && (
              <div className="mt-5 border-t border-purple-100 pt-5">
                <PhotoAdjuster
                  photo={photo}
                  shape={theme.shape_type}
                  adjust={photoAdjust}
                  onChange={setPhotoAdjust}
                  onReset={() => setPhotoAdjust(DEFAULT_PHOTO_ADJUSTMENT)}
                />
              </div>
            )}

            {/* Text Fields */}
            <div className="mt-6 space-y-4">
              {getTextFields(theme).map((field) => (
                <div key={field.id}>
                  <label
                    htmlFor={`field-${field.id}`}
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
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
                    className="mt-1.5 w-full rounded-xl border border-purple-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#6C2BFF] focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Right Live Previews Grid */}
          <section aria-labelledby="preview-heading">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div>
                <h2 id="preview-heading" className="text-lg font-bold text-slate-900">
                  Live Previews &amp; Downloads
                </h2>
                <p className="text-xs text-slate-500">
                  Download high-resolution print and social assets in one click.
                </p>
              </div>
            </div>

            <div className="mt-6 grid items-start gap-6 sm:grid-cols-3">
              {RATIOS.map((ratio) => (
                <RatioCanvas
                  key={ratio.key}
                  ratio={ratio}
                  theme={theme}
                  background={bg}
                  photo={photo}
                  photoAdjust={photoAdjust}
                  onAdjustChange={setPhotoAdjust}
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
