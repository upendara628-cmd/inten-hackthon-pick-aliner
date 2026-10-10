import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Terminal,
  Calendar,
  Clock,
  Users,
  MapPin,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { apiListHackathons, fetchServerTime } from "@/lib/hackathon-api";
import type { Hackathon } from "@/lib/hackathon-types";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/hackathons/")({
  head: () => ({
    meta: [
      { title: "Hackathons — Framewise Live Events" },
      {
        name: "description",
        content:
          "Official Hackathon Management & Live Event System. Participate in events, access authoritative problem statements, and submit projects.",
      },
      { property: "og:title", content: "Hackathons — Framewise Live Events" },
    ],
  }),
  component: HackathonsList,
});

function HackathonsList() {
  const { user, isOrganizer } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "live" | "upcoming" | "ended">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadEvents();
  }, [isOrganizer]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await apiListHackathons(isOrganizer);
      setHackathons(data);
    } catch (err) {
      console.error("Failed to load hackathons:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = hackathons.filter((h) => {
    if (activeTab === "live" && h.status !== "LIVE") return false;
    if (activeTab === "upcoming" && h.status !== "UPCOMING" && h.status !== "PUBLISHED")
      return false;
    if (activeTab === "ended" && h.status !== "ENDED" && h.status !== "ARCHIVED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (h.name || "").toLowerCase().includes(q) ||
        (h.shortDescription || "").toLowerCase().includes(q) ||
        (h.venue || "").toLowerCase().includes(q) ||
        (h.organizerName || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LIVE":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            LIVE NOW
          </span>
        );
      case "UPCOMING":
      case "PUBLISHED":
        return (
          <span className="rounded-full bg-purple-100 px-3 py-1 text-[11px] font-bold text-[#6C2BFF]">
            UPCOMING
          </span>
        );
      case "ENDED":
        return (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
            COMPLETED
          </span>
        );
      case "DRAFT":
        return (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">
            DRAFT (ORGANIZER)
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-100 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-100/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#6C2BFF]">
              <Terminal className="h-3.5 w-3.5" />
              <span>Official Live Event System</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Hackathon Arena
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
              Access real-world problem statements, start server-synchronized event timers, and
              submit verified GitHub repositories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isOrganizer && (
              <Link
                to="/admin/hackathons/create"
                className="btn-studlyf-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold shadow-md shadow-purple-500/20"
              >
                <Plus className="h-4 w-4" />
                <span>Create Hackathon</span>
              </Link>
            )}
            {isOrganizer && (
              <Link
                to="/admin/hackathons"
                className="btn-studlyf-secondary flex items-center gap-2 px-4 py-2.5 text-xs font-bold"
              >
                <ShieldCheck className="h-4 w-4 text-[#6C2BFF]" />
                <span>Organizer Dashboard</span>
              </Link>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-full border border-purple-200/80 bg-white p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                activeTab === "all"
                  ? "bg-[#6C2BFF] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#6C2BFF]"
              }`}
            >
              All Events ({hackathons.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("live")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                activeTab === "live"
                  ? "bg-[#6C2BFF] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#6C2BFF]"
              }`}
            >
              Live Now
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                activeTab === "upcoming"
                  ? "bg-[#6C2BFF] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#6C2BFF]"
              }`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ended")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                activeTab === "ended"
                  ? "bg-[#6C2BFF] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#6C2BFF]"
              }`}
            >
              Completed
            </button>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search hackathons, venue, organizer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-purple-200 bg-white pl-9 pr-4 py-2 text-xs shadow-xs focus:border-[#6C2BFF] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Hackathon Cards Grid */}
        {loading ? (
          <div className="mt-16 flex flex-col items-center justify-center gap-3 text-[#6C2BFF]">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#6C2BFF] border-t-transparent" />
            <span className="text-xs font-bold tracking-wider">
              Syncing hackathons with server…
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 rounded-3xl border-2 border-dashed border-purple-200 bg-white/70 p-12 text-center backdrop-blur-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-[#6C2BFF]">
              <Terminal className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">No hackathons found</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-600">
              {searchQuery
                ? "No hackathon matched your search query. Try resetting your search."
                : "No active hackathons in this section. Create one from the organizer studio."}
            </p>
            {isOrganizer && (
              <div className="mt-6">
                <Link
                  to="/admin/hackathons/create"
                  className="btn-studlyf-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create First Hackathon</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((h) => (
              <div
                key={h.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-purple-200/90 bg-white/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    {getStatusBadge(h.status)}
                    <span className="text-[11px] font-semibold text-slate-400">
                      {h.participationType === "both"
                        ? "Individual & Teams"
                        : h.participationType === "team"
                          ? `Teams (${h.minTeamSize}-${h.maxTeamSize})`
                          : "Individual Only"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-extrabold text-slate-900 group-hover:text-[#6C2BFF] transition-colors">
                    {h.name}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 line-clamp-2">
                    {h.shortDescription || h.fullDescription}
                  </p>

                  <div className="mt-5 space-y-2 text-xs text-slate-500 border-t border-purple-50 pt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[#6C2BFF]" />
                      <span>
                        {new Date(h.startDate).toLocaleDateString()} –{" "}
                        {new Date(h.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-[#7C3AED]" />
                      <span>
                        {h.timerMode === "global"
                          ? "Global Event Window"
                          : `Individual Countdown (${Math.round((h.individualDurationMinutes || 360) / 60)}h limit)`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-[#EA580C]" />
                      <span>{h.venue || "Online"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-purple-100/70 pt-4">
                  <div className="text-[11px] font-semibold text-slate-500">
                    By <span className="font-bold text-slate-800">{h.organizerName}</span>
                  </div>

                  <Link
                    to={`/hackathons/${h.id}`}
                    className="flex items-center gap-1.5 rounded-full bg-purple-50 px-4 py-2 text-xs font-bold text-[#6C2BFF] transition-all hover:bg-[#6C2BFF] hover:text-white group-hover:shadow-xs"
                  >
                    <span>Enter Event</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
