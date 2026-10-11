import { useEffect, useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Copy,
  ExternalLink,
  Loader2,
  Trash2,
  Search,
  Eye,
  Layers,
  Sparkles,
  Award,
  Filter,
  Check,
  Plus,
  X,
  ShieldCheck,
  ShieldAlert,
  Lock,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { AuthModal } from "@/components/auth-modal";
import { deleteTheme, listThemes, shareLinkFor, getTextFields, type Theme } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ThemeGalleryView() {
  const { user, isOrganizer, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [themes, setThemes] = useState<Theme[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShape, setSelectedShape] = useState<"all" | "circle" | "rectangle">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az">("newest");
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Theme | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOrganizer) {
      listThemes().then(setThemes);
    }
  }, [isOrganizer]);

  const shareLink = (theme: Theme) => shareLinkFor(theme);

  const copy = async (theme: Theme) => {
    try {
      await navigator.clipboard.writeText(shareLink(theme));
      toast.success("Share link copied to clipboard");
    } catch {
      toast.error("Copy failed — select the link manually");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTheme(deleteTarget.id);
      setThemes((prev) => (prev ?? []).filter((x) => x.id !== deleteTarget.id));
      toast.success(`Theme "${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error("Could not delete theme");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered and sorted themes
  const filteredThemes = useMemo(() => {
    if (!themes) return [];
    let list = [...themes];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const titleMatch = t.title.toLowerCase().includes(q);
        const shapeMatch = t.shape_type.toLowerCase().includes(q);
        const fieldsMatch = (t.text_fields || []).some(
          (f) => f.label.toLowerCase().includes(q) || f.id.toLowerCase().includes(q),
        );
        return titleMatch || shapeMatch || fieldsMatch;
      });
    }

    // Shape filter
    if (selectedShape !== "all") {
      list = list.filter((t) => t.shape_type === selectedShape);
    }

    // Sort order
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return (b.created_at || "").localeCompare(a.created_at || "");
      }
      if (sortBy === "oldest") {
        return (a.created_at || "").localeCompare(b.created_at || "");
      }
      if (sortBy === "az") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return list;
  }, [themes, searchQuery, selectedShape, sortBy]);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
        <SiteHeader />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#6C2BFF]" />
          <span className="text-sm font-semibold text-slate-500">
            Verifying administrator access…
          </span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State (Before login, no one can see the gallery)
  if (!user) {
    return (
      <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
        <SiteHeader />
        <main className="mx-auto max-w-xl px-5 py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-purple-100 text-[#6C2BFF] shadow-inner mb-6">
            <Lock className="h-10 w-10 text-[#6C2BFF]" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-rose-700">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
            <span>Admin Authentication Required</span>
          </span>

          <h1 className="mt-4 text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
            Theme Gallery is Locked
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Before logging in, the template gallery cannot be viewed. Only verified administrators
            and event organizers can inspect, manage, and configure theme badge designs.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="btn-studlyf-primary flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 text-xs font-bold shadow-lg shadow-purple-500/25"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Log In as Admin / Organizer</span>
            </button>

            <Link
              to="/hackathons"
              className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-full border border-purple-200 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 hover:border-[#6C2BFF] hover:text-[#6C2BFF] transition-all shadow-xs"
            >
              <Award className="h-4 w-4 text-[#EA580C]" />
              <span>Explore Hackathons</span>
            </Link>
          </div>

          <AuthModal
            open={authModalOpen}
            onOpenChange={setAuthModalOpen}
            defaultRole="organizer"
          />
        </main>
      </div>
    );
  }

  // 3. Unauthorized Participant State (Logged in, but participant — only admin can see the gallery)
  if (!isOrganizer) {
    return (
      <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
        <SiteHeader />
        <main className="mx-auto max-w-xl px-5 py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 text-amber-800 shadow-inner mb-6">
            <ShieldAlert className="h-10 w-10 text-amber-700" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
            <span>Admin Privilege Required</span>
          </span>

          <h1 className="mt-4 text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
            Restricted to Administrators
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            You are signed in as <strong className="text-slate-900">{user.name}</strong> with a{" "}
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#EA580C]">
              {user.role}
            </span>{" "}
            account. The Theme Gallery is exclusively accessible by event organizers and administrators.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="btn-studlyf-primary flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 text-xs font-bold shadow-lg shadow-purple-500/25"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Sign In as Organizer</span>
            </button>

            <Link
              to="/hackathons"
              className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-full border border-purple-200 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 hover:border-[#6C2BFF] hover:text-[#6C2BFF] transition-all shadow-xs"
            >
              <Award className="h-4 w-4 text-[#EA580C]" />
              <span>Return to Hackathons</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // 4. Authorized Admin State: Render Full Gallery
  return (
    <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        {/* Top Header & Context Banner */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#6C2BFF]">
                <Layers className="h-3.5 w-3.5" />
                <span>Admin Theme Management</span>
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">
                <ShieldCheck className="h-3 w-3 text-amber-700" />
                <span>Organizer Console Active</span>
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Theme &amp; Badge Gallery
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
              Manage saved badge designs, inspect photo bounding box coordinates, and copy direct shareable links for participants.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin"
              className="btn-studlyf-primary flex items-center gap-2 px-5 py-3 text-xs font-bold shadow-lg shadow-purple-500/25"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Theme</span>
            </Link>
          </div>
        </div>

        {/* Search, Filter & Controls Bar */}
        <div className="mt-8 rounded-2xl border border-purple-100/90 bg-white/90 p-4 shadow-sm backdrop-blur-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates by title, shape, or fields…"
                className="w-full rounded-xl border border-purple-200/80 bg-slate-50/60 py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#6C2BFF] focus:bg-white focus:ring-2 focus:ring-purple-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Shape Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span>Shape:</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedShape("all")}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedShape === "all"
                    ? "bg-[#6C2BFF] text-white shadow-xs"
                    : "bg-purple-50 text-slate-600 hover:bg-purple-100"
                }`}
              >
                All Shapes
              </button>
              <button
                type="button"
                onClick={() => setSelectedShape("circle")}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedShape === "circle"
                    ? "bg-[#6C2BFF] text-white shadow-xs"
                    : "bg-purple-50 text-slate-600 hover:bg-purple-100"
                }`}
              >
                Circle
              </button>
              <button
                type="button"
                onClick={() => setSelectedShape("rectangle")}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedShape === "rectangle"
                    ? "bg-[#6C2BFF] text-white shadow-xs"
                    : "bg-purple-50 text-slate-600 hover:bg-purple-100"
                }`}
              >
                Rectangle
              </button>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 border-t border-purple-100 pt-3 lg:border-t-0 lg:pt-0">
              <label htmlFor="sort-select" className="text-xs font-bold text-slate-500 whitespace-nowrap">
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-purple-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#6C2BFF]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="az">Alphabetical (A–Z)</option>
              </select>
            </div>
          </div>

          {/* Results Summary Counter */}
          {themes !== null && (
            <div className="mt-3 flex items-center justify-between border-t border-purple-50 pt-2 text-xs text-slate-500">
              <span>
                Showing <strong>{filteredThemes.length}</strong> of <strong>{themes.length}</strong>{" "}
                templates
              </span>
              {(searchQuery || selectedShape !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedShape("all");
                  }}
                  className="font-semibold text-[#6C2BFF] hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Gallery Content State */}
        {themes === null ? (
          <div className="mt-20 flex flex-col items-center justify-center gap-3 text-sm font-semibold text-[#6C2BFF]">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading template gallery…</span>
          </div>
        ) : filteredThemes.length === 0 ? (
          <div className="mt-12 rounded-3xl border-2 border-dashed border-purple-200 bg-white/70 p-12 text-center backdrop-blur-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-[#6C2BFF]">
              <Search className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              {searchQuery || selectedShape !== "all"
                ? "No matching badge templates"
                : "No templates published yet"}
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
              {searchQuery || selectedShape !== "all"
                ? "Try clearing your search query or switching shape filters to view available designs."
                : "Organizers can upload base artwork and draw placeholders to generate shareable links."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {searchQuery || selectedShape !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedShape("all");
                  }}
                  className="btn-studlyf-primary px-5 py-2.5 text-xs font-bold"
                >
                  Clear Search Filters
                </button>
              ) : isOrganizer ? (
                <Link to="/admin" className="btn-studlyf-primary px-6 py-2.5 text-xs font-bold">
                  Create First Theme &rarr;
                </Link>
              ) : (
                <Link to="/" className="btn-studlyf-primary px-6 py-2.5 text-xs font-bold">
                  Try Interactive Demo &rarr;
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredThemes.map((t) => {
              const textFields = getTextFields(t);

              return (
                <article
                  key={t.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-purple-100/90 bg-white/95 shadow-md shadow-purple-500/5 transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/15"
                >
                  {/* Clickable Image Header: Clicking immediately opens Public Customizer */}
                  <Link
                    to="/d/$themeId"
                    params={{ themeId: t.id }}
                    className="relative grid h-52 place-items-center overflow-hidden border-b border-purple-50 bg-gradient-to-b from-purple-50/40 via-white to-slate-50 p-4 cursor-pointer"
                    title={`Open Customizer for ${t.title}`}
                  >
                    <img
                      src={t.background_image_url}
                      alt={t.title}
                      className="max-h-44 w-full rounded-lg object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Shape Tag Pill */}
                    <span className="absolute top-3 right-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6C2BFF] shadow-xs backdrop-blur-md border border-purple-100">
                      {t.shape_type} Pass
                    </span>

                    {/* Placeholder Bounding Box Preview Overlay */}
                    <div
                      className={`pointer-events-none absolute border-2 border-dashed border-[#6C2BFF]/60 bg-purple-500/10 transition-opacity ${
                        t.shape_type === "circle" ? "rounded-full" : "rounded-md"
                      }`}
                      style={{
                        left: `${t.box_x}%`,
                        top: `${t.box_y}%`,
                        width: `${t.box_width}%`,
                        height: `${t.box_height}%`,
                      }}
                      title="Photo placeholder slot"
                    />

                    {/* Subtle Hover Action Pill */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-bold text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                      Click to Customize &rarr;
                    </div>
                  </Link>

                  {/* Card Body */}
                  <div className="space-y-4 p-5">
                    <div>
                      <Link
                        to="/d/$themeId"
                        params={{ themeId: t.id }}
                        className="text-base font-extrabold text-slate-900 line-clamp-1 hover:text-[#6C2BFF] transition-colors"
                      >
                        {t.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Published{" "}
                        {new Date(t.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Dynamic Fields Indicators */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {textFields.slice(0, 3).map((f) => (
                        <span
                          key={f.id}
                          className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-100"
                        >
                          {f.label}
                        </span>
                      ))}
                      {textFields.length > 3 && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          +{textFields.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Shareable Link Box */}
                    <div
                      onClick={() => copy(t)}
                      className="group/link flex cursor-pointer items-center justify-between rounded-xl border border-purple-100 bg-purple-50/50 px-3 py-1.5 hover:bg-purple-100/60 transition-colors"
                      title="Click to copy customizer link"
                    >
                      <p className="truncate font-mono text-[11px] text-purple-900">{shareLink(t)}</p>
                      <Copy className="h-3 w-3 shrink-0 text-[#6C2BFF] opacity-60 group-hover/link:opacity-100 ml-1.5" />
                    </div>

                    {/* Card Actions Row */}
                    <div className="flex items-center gap-2 pt-1 border-t border-purple-50">
                      {/* Primary CTA: Directly Opens Public Customizer */}
                      <Link
                        to="/d/$themeId"
                        params={{ themeId: t.id }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C2BFF] to-[#7C3AED] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:brightness-105 active:scale-95"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Customize Pass</span>
                      </Link>

                      {/* Preview Button (Opens Modal for all users) */}
                      <button
                        type="button"
                        onClick={() => setPreviewTheme(t)}
                        className="flex items-center justify-center gap-1 rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:border-[#6C2BFF] hover:bg-purple-50 hover:text-[#6C2BFF]"
                        title="Inspect template details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Preview</span>
                      </button>

                      {/* Copy Share Link Button */}
                      <button
                        type="button"
                        onClick={() => copy(t)}
                        className="rounded-xl border border-purple-200 bg-white p-2 text-slate-700 transition-all hover:border-[#6C2BFF] hover:bg-purple-50 hover:text-[#6C2BFF]"
                        title="Copy share link"
                        aria-label="Copy share link"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>

                      {/* Admin-Only Control: Delete Theme */}
                      {isOrganizer && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(t)}
                          aria-label={`Delete ${t.title}`}
                          className="rounded-xl border border-slate-200 p-2 text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          title="Delete theme (Organizer only)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ================================================================= */}
        {/* TEMPLATE PREVIEW MODAL (Radix UI Dialog - Accessible to all)      */}
        {/* ================================================================= */}
        <Dialog open={!!previewTheme} onOpenChange={(open) => !open && setPreviewTheme(null)}>
          <DialogContent className="max-w-xl p-6 sm:p-8 rounded-3xl">
            {previewTheme && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6C2BFF]">
                      {previewTheme.shape_type} Template
                    </span>
                    <span className="text-xs text-slate-400">· ID: {previewTheme.id}</span>
                  </div>
                  <DialogTitle className="text-xl font-extrabold text-slate-900 mt-1">
                    {previewTheme.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Pre-filled with automatic photo containment and dynamic credential typography.
                  </DialogDescription>
                </DialogHeader>

                {/* Visual Preview Graphic */}
                <div className="relative mt-4 flex items-center justify-center overflow-hidden rounded-2xl border border-purple-100 bg-slate-50 p-6">
                  <img
                    src={previewTheme.background_image_url}
                    alt={previewTheme.title}
                    className="max-h-64 max-w-full rounded-lg object-contain shadow-sm"
                  />
                  {/* Photo Bounding Box Overlay */}
                  <div
                    className={`pointer-events-none absolute border-2 border-dashed border-[#6C2BFF] bg-purple-500/20 ${
                      previewTheme.shape_type === "circle" ? "rounded-full" : "rounded-md"
                    }`}
                    style={{
                      left: `${previewTheme.box_x}%`,
                      top: `${previewTheme.box_y}%`,
                      width: `${previewTheme.box_width}%`,
                      height: `${previewTheme.box_height}%`,
                    }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#6C2BFF] px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                      Photo Placeholder
                    </span>
                  </div>
                </div>

                {/* Template Configuration Details */}
                <div className="mt-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Configured Text Fields ({getTextFields(previewTheme).length})
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {getTextFields(previewTheme).map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between rounded-xl border border-purple-100 bg-purple-50/40 p-2.5 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{field.label}</p>
                          <p className="text-[10px] font-mono text-slate-500">Key: {field.id}</p>
                        </div>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-100">
                          {field.font_weight}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Share Link Preview */}
                  <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3">
                    <p className="text-[11px] font-bold text-slate-600">Shareable Customizer Link:</p>
                    <p className="mt-0.5 truncate font-mono text-xs text-purple-900">
                      {shareLink(previewTheme)}
                    </p>
                  </div>
                </div>

                <DialogFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => copy(previewTheme)}
                    className="flex items-center justify-center gap-1.5 rounded-full border border-purple-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-purple-50"
                  >
                    <Copy className="h-3.5 w-3.5 text-[#6C2BFF]" />
                    <span>Copy Link</span>
                  </button>

                  <Link
                    to="/d/$themeId"
                    params={{ themeId: previewTheme.id }}
                    className="btn-studlyf-primary flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold shadow-md shadow-purple-500/25"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Open in Public Customizer &rarr;</span>
                  </Link>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ================================================================= */}
        {/* DELETE CONFIRMATION MODAL (AlertDialog - Organizer Only)          */}
        {/* ================================================================= */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent className="max-w-md rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold text-slate-900">
                Delete Theme Template?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-600">
                Are you sure you want to delete{" "}
                <strong className="text-slate-900">&ldquo;{deleteTarget?.title}&rdquo;</strong>?
                Participants and attendees using this share link will no longer be able to load or
                customize this badge. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 flex gap-2">
              <AlertDialogCancel disabled={isDeleting} className="text-xs font-semibold">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 text-xs font-bold text-white hover:bg-red-700"
              >
                {isDeleting ? "Deleting…" : "Delete Theme"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
