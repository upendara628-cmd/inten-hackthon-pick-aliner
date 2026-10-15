import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Send,
  Github,
  Globe,
  FileSpreadsheet,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { apiGetHackathon, apiListSubmissions, getExcelExportUrl } from "@/lib/hackathon-api";
import type { Hackathon, Submission } from "@/lib/hackathon-types";

import { AdminGuard } from "@/components/admin-guard";

export const Route = createFileRoute("/admin/hackathons/$hackathonId/submissions")({
  head: () => ({
    meta: [{ title: "Submissions Gallery — Organizer Console" }],
  }),
  component: function SubmissionsRouteComponent() {
    return (
      <AdminGuard>
        <SubmissionsDeepView />
      </AdminGuard>
    );
  },
});

function SubmissionsDeepView() {
  const { hackathonId } = Route.useParams();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([apiGetHackathon(hackathonId), apiListSubmissions(hackathonId)])
      .then(([h, subs]) => {
        setHackathon(h);
        setSubmissions(subs);
      })
      .finally(() => setLoading(false));
  }, [hackathonId]);

  if (loading || !hackathon) {
    return (
      <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif]">
        <SiteHeader />
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 px-5 py-24 text-sm font-semibold text-[#6C2BFF]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6C2BFF] border-t-transparent" />
          <span>Loading project submissions…</span>
        </div>
      </div>
    );
  }

  const filtered = submissions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.projectTitle.toLowerCase().includes(q) ||
      s.participantName.toLowerCase().includes(q) ||
      s.githubUrl.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-100 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link to="/admin/hackathons" className="hover:text-[#6C2BFF]">
                Organizer Console
              </Link>
              <span>/</span>
              <Link
                to="/admin/hackathons/$hackathonId"
                params={{ hackathonId: hackathon.id }}
                className="hover:text-[#6C2BFF]"
              >
                {hackathon.name}
              </Link>
              <span>/</span>
              <span className="font-bold text-[#6C2BFF]">Submissions</span>
            </div>

            <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              Project Submissions Directory
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={getExcelExportUrl(hackathon.id)}
              download={`${hackathon.id}-report.xlsx`}
              className="btn-studlyf-primary flex items-center gap-2 px-4 py-2 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Excel</span>
            </a>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by project, author, GitHub..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-purple-200 bg-white pl-9 pr-4 py-2 text-xs shadow-xs focus:border-[#6C2BFF] focus:outline-hidden"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            Total Submissions: {submissions.length}
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-white/70 p-12 text-center">
              <Send className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm font-bold text-slate-700">No project submissions yet</p>
            </div>
          ) : (
            filtered.map((s) => (
              <div
                key={s.id}
                className="rounded-3xl border border-purple-200/90 bg-white p-6 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-400">
                      By {s.participantName} ({s.participantType})
                    </span>
                    <h3 className="text-lg font-black text-slate-900">{s.projectTitle}</h3>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                      s.status === "SUBMITTED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {s.status}{" "}
                    {s.lateBySeconds > 0 && `(${Math.round(s.lateBySeconds / 60)}m Late)`}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {s.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-purple-50 pt-3 text-xs">
                  <div className="flex items-center gap-4">
                    <a
                      href={s.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 font-bold text-[#6C2BFF] hover:underline"
                    >
                      <Github className="h-4 w-4" />
                      <span>{s.githubUrl}</span>
                    </a>

                    {s.demoUrl && (
                      <a
                        href={s.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 font-bold text-slate-600 hover:text-[#6C2BFF]"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Submitted: {new Date(s.submittedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
