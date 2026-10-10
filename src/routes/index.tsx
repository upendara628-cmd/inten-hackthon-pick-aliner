import { useState, useRef, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  Instagram,
  Linkedin,
  Sparkles,
  Terminal,
  Layers,
  Clock,
  ShieldCheck,
  Upload,
  RotateCw,
  ZoomIn,
  Check,
  Flame,
  FileCode2,
  Award,
  UserCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { RATIOS, type RatioKey, getRatio } from "@/lib/ratios";
import {
  DEFAULT_PHOTO_ADJUSTMENT,
  type PhotoAdjustment,
  type ShapeType,
  type Theme,
  type UserTextValues,
} from "@/lib/store";
import { downloadCanvas, loadImage, renderComposite } from "@/lib/render";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Framewise — Create Branded Event Passes & Join Live Hackathons",
      },
      {
        name: "description",
        content:
          "Generate perfectly fitted digital badges and credentials in seconds, or discover and participate in live engineering hackathons with real-time tracking.",
      },
      {
        property: "og:title",
        content: "Framewise — Create Branded Event Passes & Join Live Hackathons",
      },
      {
        property: "og:description",
        content:
          "Generate perfectly fitted digital badges and credentials in seconds, or discover and participate in live engineering hackathons with real-time tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const DEMO_THEME: Theme = {
  id: "demo-showcase",
  title: "Framewise Engineering Pass 2026",
  background_image_url: "/stud.png",
  box_x: 35,
  box_y: 20,
  box_width: 30,
  box_height: 32,
  shape_type: "circle",
  created_at: new Date().toISOString(),
  text_fields: [
    {
      id: "fullName",
      label: "Full Name",
      x: 10,
      y: 56,
      width: 80,
      height: 9,
      font_size: 4.8,
      color: "#0f172a",
      align: "center",
      font_weight: "bold",
    },
    {
      id: "jobTitle",
      label: "Role",
      x: 15,
      y: 67,
      width: 70,
      height: 7,
      font_size: 3.4,
      color: "#6c2bff",
      align: "center",
      font_weight: "bold",
    },
    {
      id: "idCode",
      label: "Credential ID",
      x: 20,
      y: 76,
      width: 60,
      height: 6,
      font_size: 2.8,
      color: "#ea580c",
      align: "center",
      font_weight: "normal",
    },
  ],
};

const DEMO_TEXT_VALUES: UserTextValues = {
  fullName: "Alexander Rivera",
  jobTitle: "Lead Full-Stack Engineer",
  idCode: "STUD-2026-8942",
};

function Home() {
  const [activePreviewRatio, setActivePreviewRatio] = useState<RatioKey>("idcard");
  const [shapeType, setShapeType] = useState<ShapeType>("circle");
  const [photoAdjust, setPhotoAdjust] = useState<PhotoAdjustment>(DEFAULT_PHOTO_ADJUSTMENT);
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sample background and default portrait on mount
  useEffect(() => {
    let mounted = true;
    Promise.all([
      loadImage("/stud.png").catch(() => null),
      loadImage("/stud.png").catch(() => null),
    ]).then(([bg, photo]) => {
      if (!mounted) return;
      if (bg) setBgImg(bg);
      if (photo) setPhotoImg(photo);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Update canvas rendering when controls change
  useEffect(() => {
    if (!canvasRef.current || !bgImg) return;
    const ratioDef = getRatio(activePreviewRatio);
    const activeTheme: Theme = {
      ...DEMO_THEME,
      shape_type: shapeType,
    };

    renderComposite(
      canvasRef.current,
      ratioDef.exportWidth,
      ratioDef.exportHeight,
      activeTheme,
      bgImg,
      photoImg,
      DEMO_TEXT_VALUES,
      photoAdjust,
    );
  }, [activePreviewRatio, shapeType, photoAdjust, photoImg, bgImg]);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (src) {
        loadImage(src)
          .then((img) => {
            setPhotoImg(img);
            setPhotoAdjust(DEFAULT_PHOTO_ADJUSTMENT);
          })
          .catch(console.error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const ratioDef = getRatio(activePreviewRatio);
    downloadCanvas(canvasRef.current, `framewise-${ratioDef.key}-pass.png`);
  };

  const scrollToCustomizer = () => {
    const el = document.getElementById("interactive-engine");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-12 sm:py-20">
        {/* ================================================================= */}
        {/* 1. PRIMARY EXPLANATION HERO SECTION (Participant Perspective)     */}
        {/* ================================================================= */}
        <div className="flex flex-col items-center text-center">
          {/* Top Participant Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-white/90 px-4 py-1.5 shadow-sm backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-[#6C2BFF]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#6C2BFF]">
              For Students, Engineers &amp; Hackathon Participants
            </span>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-[#EA580C]">
              Live Arena
            </span>
          </div>

          {/* Requested Participant-Focused Headline */}
          <h1 className="mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.14]">
            Create Branded Event Passes{" "}
            <span className="bg-gradient-to-r from-[#6C2BFF] via-[#7C3AED] to-[#EA580C] bg-clip-text text-transparent">
              &amp; Join Live Hackathons
            </span>
          </h1>

          {/* Requested Subheadline */}
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg sm:leading-relaxed">
            Generate perfectly fitted digital badges and credentials in seconds, or discover and
            participate in live engineering hackathons with real-time tracking.
          </p>

          {/* Participant Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/hackathons"
              className="btn-studlyf-primary flex items-center gap-2.5 px-7 py-3.5 text-sm font-bold shadow-lg shadow-purple-500/25"
            >
              <Terminal className="h-4 w-4" />
              <span>Explore Hackathons</span>
              <ArrowRight className="h-4 w-4 opacity-75" />
            </Link>

            <button
              type="button"
              onClick={scrollToCustomizer}
              className="btn-studlyf-secondary flex items-center gap-2 px-6 py-3.5 text-sm font-bold shadow-xs hover:border-[#6C2BFF] hover:text-[#6C2BFF]"
            >
              <Sparkles className="h-4 w-4 text-[#6C2BFF]" />
              <span>Try Badge Customizer</span>
            </button>

            <Link
              to="/gallery"
              className="flex items-center gap-2 rounded-full border border-purple-200/80 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-xs hover:border-[#6C2BFF] hover:text-[#6C2BFF]"
            >
              <Layers className="h-4 w-4 text-[#7C3AED]" />
              <span>Browse Badge Gallery</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </Link>
          </div>

          {/* Trust Highlights for Participants */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#6C2BFF]" />
              <span>3 Print &amp; Social Ratios (CR80, 1.91:1, 1:1)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#7C3AED]" />
              <span>Authoritative Live Countdown Timers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#EA580C]" />
              <span>Direct GitHub Submission Portal</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>100% Client-Side Privacy</span>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* KEY VALUE HIGHLIGHTS GRID (Participant Benefits)                  */}
        {/* ================================================================= */}
        <section className="mt-16">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Card 1: Instant Badge Generator */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-purple-200/90 bg-white/90 p-8 shadow-sm backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between border-b border-purple-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6C2BFF] to-[#8B5CF6] text-white shadow-md shadow-purple-500/25">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">
                        Instant Badge Generator
                      </h3>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#6C2BFF]">
                        Zero-Crop Photo Alignment
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-1 font-mono text-[11px] font-bold text-[#6C2BFF]">
                    Free &amp; Instant
                  </span>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-slate-600">
                  Drop in your photo once to create aligned ID cards, LinkedIn banners, and social
                  passes without manual cropping. Never wrestle with complex graphic design software or
                  awkward aspect ratio distortions again.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6C2BFF]" />
                    <span>
                      <strong>Automatic Containment &amp; Clipping:</strong> Your portrait automatically
                      fits into the designated template shape (circle or rectangle) with zero image loss.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6C2BFF]" />
                    <span>
                      <strong>Interactive Zoom &amp; Pan:</strong> Nudge, scale, or rotate your headshot
                      in real-time to center yourself perfectly inside the badge.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6C2BFF]" />
                    <span>
                      <strong>Multi-Ratio Downloads:</strong> Export crisp, high-resolution PNGs ready for
                      physical CR80 lanyard printing (1275×2025 px), LinkedIn banners, and Instagram.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6C2BFF]" />
                    <span>
                      <strong>No Account Needed for Passes:</strong> Anyone with an event link can upload
                      their photo and download credentials on desktop or mobile in seconds.
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-purple-100 pt-5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  Drop Photo · Zoom &amp; Pan · Export
                </span>
                <button
                  type="button"
                  onClick={scrollToCustomizer}
                  className="btn-studlyf-secondary flex items-center gap-1.5 px-4 py-2 text-xs font-bold hover:border-[#6C2BFF] hover:text-[#6C2BFF]"
                >
                  <span>Try It Below</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Card 2: Hackathon Arena */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-purple-200/90 bg-white/90 p-8 shadow-sm backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between border-b border-purple-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#EA580C] text-white shadow-md shadow-orange-500/25">
                      <Terminal className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">Hackathon Arena</h3>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#EA580C]">
                        Live Student &amp; Hacker Competitions
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-orange-50 border border-orange-200 px-2.5 py-1 font-mono text-[11px] font-bold text-[#EA580C]">
                    Live Timers
                  </span>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-slate-600">
                  Register for events, view authoritative countdown timers, access problem statements,
                  and submit your GitHub repositories seamlessly. Experience fair, transparent sprint
                  evaluations synchronized with authoritative server time.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#EA580C]" />
                    <span>
                      <strong>Solo or Team Registration:</strong> Participate as an individual or form a team
                      with teammates and institutions linked to your profile.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#EA580C]" />
                    <span>
                      <strong>Anti-Cheat Synchronized Timer:</strong> Your personal countdown timer
                      synchronizes with the server, ensuring verified equal sprint time.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#EA580C]" />
                    <span>
                      <strong>Official Problem Statements:</strong> View objectives, technical constraints,
                      rubrics, and download challenge files (PDFs/DOCX) in one portal.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#EA580C]" />
                    <span>
                      <strong>GitHub &amp; Demo Submissions:</strong> Submit your project repository with
                      automatic validation, demo links, and instant submission receipts.
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-purple-100 pt-5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  Register · Build · Submit on GitHub
                </span>
                <Link
                  to="/hackathons"
                  className="btn-studlyf-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold shadow-sm"
                >
                  <span>Explore Hackathons</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. SECONDARY INTERACTIVE PREVIEW SECTION (Live Alignment Engine)  */}
        {/* ================================================================= */}
        <section id="interactive-engine" className="mt-20 scroll-mt-24">
          <div className="overflow-hidden rounded-3xl border border-purple-200/90 bg-white/85 p-6 shadow-xl shadow-purple-500/10 backdrop-blur-xl sm:p-10">
            {/* Header of Secondary Showcase */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-100 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6C2BFF]">
                    Live Participant Preview
                  </span>
                  <span className="text-xs text-slate-400">· Interactive Customizer</span>
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Try the Photo Alignment Engine
                </h2>
                <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                  Experience how your badge adjusts in real time. Drop in your headshot, fine-tune the
                  zoom and position, and toggle between CR80 ID, LinkedIn, and Instagram ratio previews.
                </p>
              </div>

              {/* Ratio Selector Tabs */}
              <div className="flex rounded-full border border-purple-100 bg-purple-50/70 p-1">
                {RATIOS.map((r) => {
                  const active = activePreviewRatio === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setActivePreviewRatio(r.key)}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                        active
                          ? "bg-[#6C2BFF] text-white shadow-sm shadow-purple-500/30"
                          : "text-slate-600 hover:text-[#6C2BFF]"
                      }`}
                    >
                      {r.key === "idcard" && <CreditCard className="h-3.5 w-3.5" />}
                      {r.key === "linkedin" && <Linkedin className="h-3.5 w-3.5" />}
                      {r.key === "instagram" && <Instagram className="h-3.5 w-3.5" />}
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Grid: Controls on Left, Canvas Preview on Right */}
            <div className="mt-8 grid gap-8 lg:grid-cols-12">
              {/* Left Column: Interactive Photo Adjustments & Dropzone */}
              <div className="flex flex-col justify-between space-y-6 lg:col-span-5">
                {/* Photo Dropzone Card */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Step 1: Upload or Drop Your Photo
                  </label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingOver(true);
                    }}
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                      isDraggingOver
                        ? "border-[#6C2BFF] bg-purple-50/80"
                        : "border-purple-200 bg-purple-50/30 hover:border-[#6C2BFF] hover:bg-purple-50/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-xs text-[#6C2BFF]">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-900">
                      Click to choose photo or drag &amp; drop
                    </p>
                    <p className="text-[11px] text-slate-500">
                      PNG, JPG, or WebP (Sample photo preloaded)
                    </p>
                  </div>
                </div>

                {/* Adjuster Controls Card */}
                <div className="rounded-2xl border border-purple-100 bg-white/90 p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Step 2: Fine-Tune Placement
                    </span>
                    <button
                      type="button"
                      onClick={() => setPhotoAdjust(DEFAULT_PHOTO_ADJUSTMENT)}
                      className="text-[11px] font-bold text-[#6C2BFF] hover:underline"
                    >
                      Reset Alignment
                    </button>
                  </div>

                  {/* Zoom Slider */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1">
                        <ZoomIn className="h-3.5 w-3.5 text-[#6C2BFF]" />
                        <span>Scale / Zoom</span>
                      </span>
                      <span className="font-mono text-[11px]">
                        {Math.round(photoAdjust.scale * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.05"
                      value={photoAdjust.scale}
                      onChange={(e) =>
                        setPhotoAdjust((prev) => ({ ...prev, scale: parseFloat(e.target.value) }))
                      }
                      className="mt-1.5 h-1.5 w-full cursor-pointer accent-[#6C2BFF]"
                    />
                  </div>

                  {/* Pan Offset Sliders */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Pan X</span>
                        <span className="font-mono">{photoAdjust.offsetX}%</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={photoAdjust.offsetX}
                        onChange={(e) =>
                          setPhotoAdjust((prev) => ({
                            ...prev,
                            offsetX: parseInt(e.target.value, 10),
                          }))
                        }
                        className="mt-1 h-1.5 w-full cursor-pointer accent-[#6C2BFF]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Pan Y</span>
                        <span className="font-mono">{photoAdjust.offsetY}%</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={photoAdjust.offsetY}
                        onChange={(e) =>
                          setPhotoAdjust((prev) => ({
                            ...prev,
                            offsetY: parseInt(e.target.value, 10),
                          }))
                        }
                        className="mt-1 h-1.5 w-full cursor-pointer accent-[#6C2BFF]"
                      />
                    </div>
                  </div>

                  {/* Shape & Rotate Controls */}
                  <div className="mt-4 flex items-center justify-between border-t border-purple-50 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Badge Slot:</span>
                      <button
                        type="button"
                        onClick={() => setShapeType("circle")}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                          shapeType === "circle"
                            ? "bg-purple-100 text-[#6C2BFF]"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Circle
                      </button>
                      <button
                        type="button"
                        onClick={() => setShapeType("rectangle")}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                          shapeType === "rectangle"
                            ? "bg-purple-100 text-[#6C2BFF]"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Box
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPhotoAdjust((prev) => ({
                          ...prev,
                          rotate: (((prev.rotate ?? 0) + 90) % 360) as 0 | 90 | 180 | 270,
                        }))
                      }
                      className="flex items-center gap-1 rounded-lg border border-purple-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-purple-50"
                    >
                      <RotateCw className="h-3 w-3 text-[#6C2BFF]" />
                      <span>Rotate {photoAdjust.rotate ? `${photoAdjust.rotate}°` : ""}</span>
                    </button>
                  </div>
                </div>

                {/* Download Pass PNG Button */}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn-studlyf-primary flex w-full items-center justify-center gap-2 py-3 text-xs font-bold shadow-md shadow-purple-500/20"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    Download {getRatio(activePreviewRatio).label} Pass (
                    {getRatio(activePreviewRatio).exportWidth}×
                    {getRatio(activePreviewRatio).exportHeight} px)
                  </span>
                </button>
              </div>

              {/* Right Column: Live Rendered Canvas Demonstration */}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-purple-50/70 via-slate-50/50 to-orange-50/70 p-4 sm:p-8 lg:col-span-7">
                <div className="relative flex w-full flex-col items-center justify-center">
                  {/* Canvas Container with dynamic Aspect Ratio */}
                  <div
                    className={`overflow-hidden rounded-2xl border-2 border-purple-200 bg-white shadow-xl shadow-purple-900/10 ${
                      activePreviewRatio === "idcard"
                        ? "w-full max-w-[270px] aspect-[2.125/3.375]"
                        : activePreviewRatio === "linkedin"
                          ? "w-full max-w-[520px] aspect-[1.91/1]"
                          : "w-full max-w-[340px] aspect-square"
                    }`}
                  >
                    <canvas ref={canvasRef} className="h-full w-full object-contain" />
                  </div>

                  {/* Footnote details */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="font-semibold">
                      Current Format:{" "}
                      <strong className="text-[#6C2BFF]">
                        {getRatio(activePreviewRatio).label}
                      </strong>{" "}
                      ({getRatio(activePreviewRatio).hint})
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-400">
                      Full Resolution: {getRatio(activePreviewRatio).exportWidth}×
                      {getRatio(activePreviewRatio).exportHeight}px
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 3. PARTICIPANT RATIO HIGHLIGHTS: Standard Formats                 */}
        {/* ================================================================= */}
        <section className="mt-20">
          <div className="text-center">
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#6C2BFF]">
              Tailored For Every Channel
            </span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Three Formats Tailored for Your Needs
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Download crisp, high-resolution credentials tailored for print lanyards and social
              sharing.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {RATIOS.map((r) => (
              <div
                key={r.key}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-purple-100 bg-white/90 p-7 shadow-sm transition-all hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/10"
              >
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6C2BFF] to-[#8B5CF6] text-white shadow-md shadow-purple-500/25">
                    {r.key === "idcard" && <CreditCard className="h-6 w-6" />}
                    {r.key === "linkedin" && <Linkedin className="h-6 w-6" />}
                    {r.key === "instagram" && <Instagram className="h-6 w-6" />}
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">{r.label}</h3>
                  <p className="text-xs font-semibold text-[#6C2BFF]">{r.hint}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {r.key === "idcard" &&
                      "Standard CR80 card dimensions for event badges, participant credentials, and physical lanyard printing."}
                    {r.key === "linkedin" &&
                      "Landscape banner ratio optimized for post feeds and sharing your hackathon participation or badge."}
                    {r.key === "instagram" &&
                      "Square 1:1 post ratio formatted for clear avatar focus, social stories, and team showcases."}
                  </p>
                </div>

                <div className="relative mt-6 border-t border-purple-50 pt-4">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    Resolution: {r.exportWidth}×{r.exportHeight} px
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. 4-STEP PARTICIPANT JOURNEY                                     */}
        {/* ================================================================= */}
        <section className="mt-20 rounded-3xl border border-purple-200/60 bg-gradient-to-br from-white via-purple-50/40 to-white p-8 sm:p-12 shadow-sm">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              How to Participate &amp; Claim Your Pass
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Four simple steps from finding an event to downloading credentials and submitting code.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 font-bold text-[#6C2BFF]">
                1
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">Choose Event or Badge</h3>
              <p className="mt-1 text-xs text-slate-600">
                Explore active hackathons or open an event badge link shared by your organizers.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 font-bold text-[#6C2BFF]">
                2
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">Drop In Your Photo</h3>
              <p className="mt-1 text-xs text-slate-600">
                Upload your headshot once. The engine auto-crops and positions your portrait seamlessly.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 font-bold text-[#6C2BFF]">
                3
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">Compete &amp; Build</h3>
              <p className="mt-1 text-xs text-slate-600">
                Register solo or as a squad. Solve official challenges under live synchronized timers.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 font-bold text-[#6C2BFF]">
                4
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">Submit &amp; Export</h3>
              <p className="mt-1 text-xs text-slate-600">
                Submit your GitHub repository and download your high-resolution badges for social sharing.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 5. BOTTOM CALL TO ACTION BANNER (Participant-Focused)             */}
        {/* ================================================================= */}
        <section className="mt-16 flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-[#6C2BFF] via-[#7C3AED] to-[#EA580C] p-8 text-center text-white shadow-xl shadow-purple-500/25 sm:flex-row sm:p-12 sm:text-left">
          <div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              Ready to Join a Hackathon or Claim Your Pass?
            </h2>
            <p className="mt-2 text-sm text-purple-100">
              Browse upcoming hackathon challenges, solve problems under live timers, or generate your
              custom event credential in seconds.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/hackathons"
              className="shrink-0 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#6C2BFF] shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Explore Hackathons &rarr;
            </Link>
            <button
              type="button"
              onClick={scrollToCustomizer}
              className="shrink-0 rounded-full border border-white/60 bg-white/15 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md hover:bg-white/25"
            >
              Try Badge Customizer
            </button>
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="mt-20 border-t border-purple-100/80 bg-white/60 py-8 text-center text-xs text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Framewise</span>
            <span>·</span>
            <span>The Platform for Event Badges &amp; Live Hackathons</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>#Students</span>
            <span>#Hackathon</span>
            <span>#Engineering</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
