import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Search, ArrowLeft, FileSpreadsheet, Download, Mail, Building } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import {
  apiGetHackathon,
  apiListParticipations,
  apiListTeams,
  getExcelExportUrl,
} from "@/lib/hackathon-api";
import type { Hackathon, HackathonParticipation, Team } from "@/lib/hackathon-types";

export const Route = createFileRoute("/admin/hackathons/$hackathonId/participants")({
  head: () => ({
    meta: [{ title: "Participants & Teams — Organizer Console" }],
  }),
  component: ParticipantsDeepView,
});

function ParticipantsDeepView() {
  const { hackathonId } = Route.useParams();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [participations, setParticipations] = useState<HackathonParticipation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      apiGetHackathon(hackathonId),
      apiListParticipations(hackathonId),
      apiListTeams(hackathonId),
    ])
      .then(([h, p, t]) => {
        setHackathon(h);
        setParticipations(p);
        setTeams(t);
      })
      .finally(() => setLoading(false));
  }, [hackathonId]);

  if (loading || !hackathon) {
    return (
      <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif]">
        <SiteHeader />
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 px-5 py-24 text-sm font-semibold text-[#6C2BFF]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6C2BFF] border-t-transparent" />
          <span>Loading participants list…</span>
        </div>
      </div>
    );
  }

  const filtered = participations.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.participantName.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.rollNumber?.toLowerCase().includes(q) ||
      p.teamMembersSummary?.toLowerCase().includes(q)
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
              <span className="font-bold text-[#6C2BFF]">Participants</span>
            </div>

            <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              Participants &amp; Teams Directory
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
              placeholder="Search by name, roll number, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-purple-200 bg-white pl-9 pr-4 py-2 text-xs shadow-xs focus:border-[#6C2BFF] focus:outline-hidden"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            Total Records: {participations.length}
          </span>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-purple-200/90 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-purple-100 bg-purple-50/60 font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3.5">Participant / Team Name</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Roll / ID</th>
                <th className="px-4 py-3.5">Registration Time</th>
                <th className="px-4 py-3.5">Official Start</th>
                <th className="px-4 py-3.5">Deadline</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                    No participants found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-purple-50/30">
                    <td className="px-5 py-4">
                      <div className="font-extrabold text-slate-900">{p.participantName}</div>
                      <div className="text-[11px] text-slate-400">{p.email}</div>
                      {p.teamMembersSummary && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {p.teamMembersSummary}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 capitalize font-semibold">{p.participantType}</td>
                    <td className="px-4 py-4 text-slate-600">{p.rollNumber || "—"}</td>
                    <td className="px-4 py-4 text-slate-500 text-[11px]">
                      {p.registeredAt ? new Date(p.registeredAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-4 font-mono text-[11px] text-slate-600">
                      {p.startedAt ? new Date(p.startedAt).toLocaleTimeString() : "Not Started"}
                    </td>
                    <td className="px-4 py-4 font-mono text-[11px] text-slate-600">
                      {p.deadlineAt ? new Date(p.deadlineAt).toLocaleTimeString() : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-extrabold text-[#6C2BFF]">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
