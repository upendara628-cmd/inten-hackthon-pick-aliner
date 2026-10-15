import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Terminal,
  Plus,
  Copy,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  Activity,
  Archive,
  Edit3,
  ExternalLink,
  Search,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import {
  apiArchiveHackathon,
  apiDeleteHackathon,
  apiListHackathons,
  apiUpdateHackathonStatus,
  getExcelExportUrl,
} from "@/lib/hackathon-api";
import type { Hackathon } from "@/lib/hackathon-types";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
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

import { AdminGuard } from "@/components/admin-guard";

export const Route = createFileRoute("/admin/hackathons/")({
  head: () => ({
    meta: [
      { title: "Organizer Console — Hackathon Management" },
      {
        name: "description",
        content: "Manage multiple hackathons, monitor live events, and export Excel reports.",
      },
    ],
  }),
  component: function AdminHackathonsRouteComponent() {
    return (
      <AdminGuard>
        <AdminHackathonsIndex />
      </AdminGuard>
    );
  },
});

function AdminHackathonsIndex() {
  const { user, isOrganizer } = useAuth();
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Hackathon | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadHackathons();
  }, []);

  const loadHackathons = async () => {
    setLoading(true);
    try {
      const data = await apiListHackathons(true); // include drafts
      setHackathons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/hackathons/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Hackathon link copied to clipboard");
  };

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive "${name}"?`)) return;
    try {
      await apiArchiveHackathon(id);
      toast.success(`Hackathon "${name}" archived`);
      loadHackathons();
    } catch (err: any) {
      toast.error(err.message || "Failed to archive hackathon");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDeleteHackathon(deleteTarget.id, { permanent: true });
      toast.success(`Hackathon "${deleteTarget.name}" permanently deleted`);
      setDeleteTarget(null);
      await loadHackathons();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete hackathon");
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusToggle = async (id: string, current: string) => {
    const nextStatus =
      current === "LIVE"
        ? "ENDED"
        : current === "PUBLISHED" || current === "UPCOMING" || current === "ENDED"
          ? "LIVE"
          : "PUBLISHED";
    try {
      setHackathons((prev) =>
        prev.map((h) => (h.id === id ? { ...h, status: nextStatus as any } : h)),
      );
      await apiUpdateHackathonStatus(id, nextStatus as any);
      toast.success(`Event status updated to ${nextStatus}`);
      loadHackathons();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
      loadHackathons();
    }
  };

  const filtered = hackathons.filter(
    (h) =>
      (h.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (h.venue || "").toLowerCase().includes(search.toLowerCase()) ||
      (h.status || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-100 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-100/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#6C2BFF]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Organizer Live Control Console</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Hackathon Management
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
              Create, configure, publish, and monitor multiple independent hackathons. Generate
              multi-sheet Excel reports on demand.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/hackathons/create"
              className="btn-studlyf-primary flex items-center gap-2 px-6 py-3 text-xs font-bold shadow-lg shadow-purple-500/25"
            >
              <Plus className="h-4 w-4" />
              <span>+ Create Hackathon</span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, status, venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-purple-200 bg-white pl-9 pr-4 py-2 text-xs shadow-xs focus:border-[#6C2BFF] focus:outline-hidden"
            />
          </div>

          <span className="text-xs font-bold text-slate-500">
            Total Events: {hackathons.length}
          </span>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="mt-16 flex flex-col items-center justify-center gap-3 text-[#6C2BFF]">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#6C2BFF] border-t-transparent" />
            <span className="text-xs font-bold">Loading hackathons…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 rounded-3xl border-2 border-dashed border-purple-200 bg-white/70 p-12 text-center backdrop-blur-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-[#6C2BFF]">
              <Terminal className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">No hackathons on record</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-600">
              Create your first official hackathon with custom problem statements and countdown
              timers.
            </p>
            <div className="mt-6">
              <Link
                to="/admin/hackathons/create"
                className="btn-studlyf-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Hackathon</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {filtered.map((h) => (
              <div
                key={h.id}
                className="overflow-hidden rounded-3xl border border-purple-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-purple-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-100/70 pb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                        h.status === "LIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : h.status === "DRAFT"
                            ? "bg-amber-100 text-amber-800"
                            : h.status === "ARCHIVED"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-purple-100 text-[#6C2BFF]"
                      }`}
                    >
                      {h.status}
                    </span>

                    <h3 className="text-xl font-extrabold text-slate-900">{h.name}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Live Monitor Button */}
                    <Link
                      to="/admin/hackathons/$hackathonId"
                      params={{ hackathonId: h.id }}
                      className="btn-studlyf-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold shadow-xs"
                    >
                      <Activity className="h-3.5 w-3.5" />
                      <span>Live Monitor</span>
                    </Link>

                    {/* Export Excel Button */}
                    <a
                      href={getExcelExportUrl(h.id)}
                      download={`${h.id}-report.xlsx`}
                      className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 shadow-xs"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      <span>Export Excel</span>
                    </a>

                    {/* Copy Link */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(h.id)}
                      className="flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-[#6C2BFF] hover:bg-purple-100"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Link</span>
                    </button>

                    {/* Edit */}
                    <Link
                      to="/admin/hackathons/create"
                      search={{ edit: h.id }}
                      className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit</span>
                    </Link>

                    {/* Archive */}
                    {h.status !== "ARCHIVED" && (
                      <button
                        type="button"
                        onClick={() => handleArchive(h.id, h.name)}
                        className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50/50 transition-all"
                        title="Archive Hackathon"
                      >
                        <Archive className="h-3 w-3" />
                        <span>Archive</span>
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(h)}
                      className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition-all"
                      title="Permanently Delete Hackathon"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Details row */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-6">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#6C2BFF]" />
                      <span>
                        {new Date(h.startDate).toLocaleDateString()} –{" "}
                        {new Date(h.endDate).toLocaleDateString()}
                      </span>
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#7C3AED]" />
                      <span>
                        {h.timerMode === "global"
                          ? "Global Event Window"
                          : `Individual Duration (${Math.round((h.individualDurationMinutes || 360) / 60)}h)`}
                      </span>
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[#EA580C]" />
                      <span>{h.participationType}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(h.id, h.status)}
                      className="text-xs font-bold text-[#6C2BFF] hover:underline"
                    >
                      {h.status === "LIVE"
                        ? "Mark as Ended"
                        : h.status === "PUBLISHED" || h.status === "UPCOMING"
                          ? "Start Live Now"
                          : h.status === "ENDED"
                            ? "Restart as Live"
                            : "Publish Event"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Confirmation Dialog for Permanent Delete */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl border border-rose-100 bg-white p-6 font-['Poppins',sans-serif] shadow-2xl sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-2">
              <Trash2 className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-center text-lg font-extrabold text-slate-900">
              Delete Hackathon?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-800 font-bold">{deleteTarget?.name}</strong>?
              <br />
              This will erase all event configurations, problem attachments, team rosters, and project submissions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex sm:justify-center gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="rounded-xl text-xs font-semibold border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/25"
            >
              {deleting ? "Deleting…" : "Yes, Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
