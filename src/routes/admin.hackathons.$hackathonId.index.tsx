import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  FileSpreadsheet,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  ExternalLink,
  Search,
  Filter,
  History,
  ShieldCheck,
  RefreshCw,
  Github,
  Globe,
  Archive,
  ArrowLeft,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import {
  apiGetAuditLogs,
  apiGetHackathon,
  apiGetHackathonStats,
  apiListParticipations,
  apiListSubmissions,
  apiUpdateHackathonStatus,
  getExcelExportUrl,
} from "@/lib/hackathon-api";
import type {
  AuditLogEntry,
  Hackathon,
  HackathonLiveStats,
  HackathonParticipation,
  Submission,
} from "@/lib/hackathon-types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/hackathons/$hackathonId/")({
  head: () => ({
    meta: [
      { title: "Live Event Dashboard — Organizer Monitor" },
      {
        name: "description",
        content:
          "Live real-time monitoring of hackathon participants, timers, and project submissions.",
      },
    ],
  }),
  component: LiveHackathonDashboard,
});

function LiveHackathonDashboard() {
  const { hackathonId } = Route.useParams();

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [stats, setStats] = useState<HackathonLiveStats | null>(null);
  const [participations, setParticipations] = useState<HackathonParticipation[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"participants" | "audit">("participants");

  const refreshData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [h, st, parts, subs, logs] = await Promise.all([
        apiGetHackathon(hackathonId),
        apiGetHackathonStats(hackathonId),
        apiListParticipations(hackathonId),
        apiListSubmissions(hackathonId),
        apiGetAuditLogs(hackathonId),
      ]);
      setHackathon(h);
      setStats(st);
      setParticipations(parts);
      setSubmissions(subs);
      setAuditLogs(logs);
      setLastSynced(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    // 5-second automatic polling for live monitoring
    const timer = setInterval(() => {
      refreshData(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [hackathonId]);

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/hackathons/${hackathonId}`;
    navigator.clipboard.writeText(url);
    toast.success("Participant event link copied to clipboard");
  };

  const handleStatusChange = async (newStatus: any) => {
    try {
      setHackathon((prev) => (prev ? { ...prev, status: newStatus } : null));
      await apiUpdateHackathonStatus(hackathonId, newStatus);
      toast.success(`Event status updated to ${newStatus}`);
      refreshData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
      refreshData(true);
    }
  };

  if (loading && !hackathon) {
    return (
      <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif]">
        <SiteHeader />
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 px-5 py-24 text-sm font-semibold text-[#6C2BFF]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6C2BFF] border-t-transparent" />
          <span>Opening live event telemetry…</span>
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return null;
  }

  const subsMap = new Map(submissions.map((s) => [s.participationId, s]));

  const filteredParticipations = participations.filter((p) => {
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.participantName.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.rollNumber?.toLowerCase().includes(q) ||
        p.teamMembersSummary?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10">
        {/* Top Breadcrumb & Live Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-100 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link to="/admin/hackathons" className="hover:text-[#6C2BFF]">
                Organizer Console
              </Link>
              <span>/</span>
              <span className="font-bold text-[#6C2BFF]">{hackathon.name}</span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">{hackathon.name}</h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${
                  hackathon.status === "LIVE"
                    ? "bg-emerald-100 text-emerald-800"
                    : hackathon.status === "PUBLISHED"
                      ? "bg-purple-100 text-[#6C2BFF]"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {hackathon.status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Sync Badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-200 text-[11px] font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Sync (5s)</span>
            </div>

            {/* Export Excel Button */}
            <a
              href={getExcelExportUrl(hackathon.id)}
              download={`${hackathon.id}-report.xlsx`}
              className="btn-studlyf-primary flex items-center gap-2 px-4 py-2 text-xs font-bold shadow-md shadow-emerald-500/20 !bg-emerald-600 hover:!bg-emerald-700"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Excel Report</span>
            </a>

            {/* Copy Share Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="btn-studlyf-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
            >
              <Copy className="h-3.5 w-3.5 text-[#6C2BFF]" />
              <span>Share Link</span>
            </button>

            {/* Quick Status Toggles */}
            {hackathon.status !== "LIVE" ? (
              <button
                type="button"
                onClick={() => handleStatusChange("LIVE")}
                className="btn-studlyf-primary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Set Live</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleStatusChange("ENDED")}
                className="flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
              >
                <span>End Event</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Metrics Cards */}
        {stats && (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            <div className="rounded-2xl border border-purple-200 bg-white p-4 text-center shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Registered
              </span>
              <p className="mt-1 text-2xl font-black text-slate-900">{stats.totalParticipants}</p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-white p-4 text-center shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                Started
              </span>
              <p className="mt-1 text-2xl font-black text-emerald-700">{stats.started}</p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-white p-4 text-center shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Not Started
              </span>
              <p className="mt-1 text-2xl font-black text-slate-600">{stats.notStarted}</p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-white p-4 text-center shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6C2BFF]">
                In Progress
              </span>
              <p className="mt-1 text-2xl font-black text-[#6C2BFF]">{stats.inProgress}</p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-white p-4 text-center shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                Submitted
              </span>
              <p className="mt-1 text-2xl font-black text-emerald-700">{stats.submitted}</p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-white p-4 text-center shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#EA580C]">
                Late
              </span>
              <p className="mt-1 text-2xl font-black text-[#EA580C]">{stats.late}</p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-white p-4 text-center shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500">
                Expired
              </span>
              <p className="mt-1 text-2xl font-black text-rose-600">{stats.expired}</p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-white p-4 text-center shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Teams
              </span>
              <p className="mt-1 text-2xl font-black text-slate-800">{stats.teams}</p>
            </div>
          </div>
        )}

        {/* Workspace Subnav Tabs: Participants vs Audit Log */}
        <div className="mt-8 flex items-center justify-between border-b border-purple-100 pb-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("participants")}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-all ${
                activeTab === "participants"
                  ? "bg-[#6C2BFF] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#6C2BFF]"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Participants &amp; Submissions ({participations.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-all ${
                activeTab === "audit"
                  ? "bg-[#6C2BFF] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#6C2BFF]"
              }`}
            >
              <History className="h-4 w-4" />
              <span>Audit Trail ({auditLogs.length})</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            Last polled: {lastSynced.toLocaleTimeString()}
          </span>
        </div>

        {activeTab === "participants" ? (
          <div className="mt-6 space-y-4">
            {/* Filter buttons & search */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {["ALL", "IN_PROGRESS", "SUBMITTED", "LATE", "EXPIRED", "NOT_STARTED"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                      statusFilter === st
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 border border-purple-100 hover:bg-purple-50"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search participant / team..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full border border-purple-200 bg-white pl-8 pr-3 py-1.5 text-xs focus:border-[#6C2BFF] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Live Participant Table */}
            <div className="overflow-hidden rounded-3xl border border-purple-200/90 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-purple-100 bg-purple-50/60 font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-5 py-3.5">Participant / Team</th>
                      <th className="px-4 py-3.5">Type</th>
                      <th className="px-4 py-3.5">Start Time</th>
                      <th className="px-4 py-3.5">Deadline</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Submission / Repository</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100/60">
                    {filteredParticipations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                          No participants found matching this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredParticipations.map((p) => {
                        const sub = subsMap.get(p.id);
                        return (
                          <tr key={p.id} className="hover:bg-purple-50/30 transition-colors">
                            <td className="px-5 py-4">
                              <div className="font-extrabold text-slate-900">
                                {p.participantName}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {p.email} {p.rollNumber && `· ${p.rollNumber}`}
                              </div>
                              {p.teamMembersSummary && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {p.teamMembersSummary}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-4 capitalize font-semibold text-slate-700">
                              {p.participantType}
                            </td>

                            <td className="px-4 py-4 text-slate-600 font-mono text-[11px]">
                              {p.startedAt ? new Date(p.startedAt).toLocaleTimeString() : "—"}
                            </td>

                            <td className="px-4 py-4 text-slate-600 font-mono text-[11px]">
                              {p.deadlineAt ? new Date(p.deadlineAt).toLocaleTimeString() : "—"}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                  p.status === "SUBMITTED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : p.status === "LATE"
                                      ? "bg-amber-100 text-amber-800"
                                      : p.status === "IN_PROGRESS"
                                        ? "bg-purple-100 text-[#6C2BFF]"
                                        : p.status === "EXPIRED"
                                          ? "bg-rose-100 text-rose-800"
                                          : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              {sub ? (
                                <div className="space-y-1">
                                  <a
                                    href={sub.githubUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 font-bold text-[#6C2BFF] hover:underline"
                                  >
                                    <Github className="h-3.5 w-3.5" />
                                    <span>{sub.projectTitle || "Repository"}</span>
                                  </a>
                                  {sub.demoUrl && (
                                    <a
                                      href={sub.demoUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="ml-2 inline-flex items-center gap-0.5 text-[11px] text-slate-500 hover:text-slate-800"
                                    >
                                      <Globe className="h-3 w-3" />
                                      <span>Demo</span>
                                    </a>
                                  )}
                                  <div className="text-[10px] text-slate-400">
                                    Submitted at {new Date(sub.submittedAt).toLocaleTimeString()}
                                    {sub.lateBySeconds > 0 &&
                                      ` (${Math.round(sub.lateBySeconds / 60)}m late)`}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No submission</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Audit Trail View */
          <div className="mt-6 space-y-3">
            <div className="overflow-hidden rounded-3xl border border-purple-200/90 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C2BFF] mb-4">
                Authoritative Event Audit Log
              </h3>

              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400">No actions recorded yet.</p>
              ) : (
                <div className="divide-y divide-purple-100/60">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="py-3 flex items-start justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">{log.action}</span>
                          <span className="text-[10px] text-slate-400">
                            by {log.actorName} ({log.actorRole})
                          </span>
                        </div>
                        <p className="mt-0.5 text-slate-600">{log.details}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
