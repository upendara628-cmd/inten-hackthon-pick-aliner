import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Copy,
  ExternalLink,
  ShieldAlert,
  Play,
  ArrowRight,
  FileText,
  Send,
  AlertCircle,
  CheckCircle2,
  Lock,
  Download,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { HackathonTimer } from "@/components/hackathon-timer";
import { AuthModal } from "@/components/auth-modal";
import {
  apiGetHackathon,
  apiListParticipations,
  apiStartParticipation,
  fetchServerTime,
} from "@/lib/hackathon-api";
import type { Hackathon, HackathonParticipation } from "@/lib/hackathon-types";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/hackathons/$hackathonId/")({
  head: () => ({
    meta: [
      { title: "Hackathon Event Details & Workspace — Framewise" },
      {
        name: "description",
        content:
          "Official Hackathon Workspace. Start participation, review verified problem statements, and submit projects.",
      },
    ],
  }),
  component: HackathonDetail,
});

function HackathonDetail() {
  const { hackathonId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [participation, setParticipation] = useState<HackathonParticipation | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverSkewMs, setServerSkewMs] = useState(0);

  // Start modal
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  // Form states for starting
  const [participantType, setParticipantType] = useState<"individual" | "team">("individual");
  const [teamName, setTeamName] = useState("");
  const [teamMembersInput, setTeamMembersInput] = useState("");

  useEffect(() => {
    loadData();
  }, [hackathonId, user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [h, sTime, parts] = await Promise.all([
        apiGetHackathon(hackathonId),
        fetchServerTime(),
        apiListParticipations(hackathonId),
      ]);
      setHackathon(h);

      // Measure server time skew
      const skew = Date.parse(sTime.serverTime) - Date.now();
      setServerSkewMs(skew);

      // Check if current user is already registered or started
      if (user) {
        const found = parts.find(
          (p) => p.participantId === user.id || p.email?.toLowerCase() === user.email.toLowerCase(),
        );
        if (found) {
          setParticipation(found);
          if (found.participantType === "team") setParticipantType("team");
        } else {
          setParticipation(null);
        }
      } else {
        setParticipation(null);
      }
    } catch (err) {
      console.error("Failed to load hackathon data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Hackathon link copied to clipboard");
  };

  const handleOpenStart = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setStartModalOpen(true);
  };

  const handleConfirmStart = async () => {
    if (!hackathon || !user) return;
    setStarting(true);
    try {
      const isTeam = participantType === "team";
      const pId = isTeam ? `team_${Math.random().toString(36).slice(2, 8)}` : user.id;
      const pName = isTeam ? teamName.trim() || `${user.name}'s Team` : user.name;

      const res = await apiStartParticipation(hackathon.id, {
        participantType,
        participantId: pId,
        participantName: pName,
        email: user.email,
        rollNumber: user.rollNumber,
        institution: user.institution,
        teamMembersSummary: isTeam ? teamMembersInput : undefined,
      });

      setParticipation(res.participation);
      setStartModalOpen(false);
      toast.success("Hackathon officially started! Timer is now active.");
    } catch (err: any) {
      toast.error(err.message || "Failed to start hackathon");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif]">
        <SiteHeader />
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 px-5 py-24 text-sm font-semibold text-[#6C2BFF]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6C2BFF] border-t-transparent" />
          <span>Synchronizing hackathon event with server…</span>
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif]">
        <SiteHeader />
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-[#6C2BFF]">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-extrabold text-slate-900">Hackathon Not Found</h2>
          <p className="mt-1 text-xs text-slate-600">
            This event may have been archived or the link is invalid.
          </p>
          <div className="mt-6">
            <Link to="/hackathons" className="btn-studlyf-primary px-5 py-2 text-xs font-bold">
              Browse Available Hackathons
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isStarted = Boolean(participation?.startedAt);

  return (
    <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10">
        {/* Top Header Card */}
        <div className="overflow-hidden rounded-3xl border border-purple-200/90 bg-white/90 p-6 shadow-xl shadow-purple-500/10 backdrop-blur-md sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-100 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#6C2BFF]">
                  {hackathon.status}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Organizer: {hackathon.organizerName}
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-4xl">
                {hackathon.name}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn-studlyf-secondary flex items-center gap-2 px-4 py-2 text-xs font-bold"
              >
                <Copy className="h-3.5 w-3.5 text-[#6C2BFF]" />
                <span>Copy Share Link</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-slate-600 max-w-3xl">
            {hackathon.fullDescription || hackathon.shortDescription}
          </p>

          {/* Event Specs Grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#6C2BFF]">
                <Clock className="h-4 w-4" />
                <span>Timer Mode</span>
              </div>
              <p className="mt-1 text-sm font-extrabold text-slate-800">
                {hackathon.timerMode === "global"
                  ? "Global Event Window"
                  : `Individual (${Math.round((hackathon.individualDurationMinutes || 360) / 60)}h Countdown)`}
              </p>
              <span className="text-[10px] text-slate-400">
                {hackathon.timerMode === "global"
                  ? "All participants share same deadline"
                  : "Starts when you confirm Start"}
              </span>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7C3AED]">
                <Users className="h-4 w-4" />
                <span>Participation</span>
              </div>
              <p className="mt-1 text-sm font-extrabold text-slate-800 capitalize">
                {hackathon.participationType === "both"
                  ? "Individual & Teams"
                  : hackathon.participationType}
              </p>
              <span className="text-[10px] text-slate-400">
                {hackathon.participationType !== "individual"
                  ? `Team size: ${hackathon.minTeamSize}-${hackathon.maxTeamSize} members`
                  : "Individual submissions only"}
              </span>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#EA580C]">
                <Calendar className="h-4 w-4" />
                <span>Event Window</span>
              </div>
              <p className="mt-1 text-xs font-bold text-slate-800">
                {new Date(hackathon.startDate).toLocaleDateString()} –{" "}
                {new Date(hackathon.endDate).toLocaleDateString()}
              </p>
              <span className="text-[10px] text-slate-400">
                Venue: {hackathon.venue || "Online"}
              </span>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <Lock className="h-4 w-4" />
                <span>Submission Policy</span>
              </div>
              <p className="mt-1 text-sm font-extrabold text-slate-800">
                {hackathon.submissionPolicy === "lock_on_deadline"
                  ? "Locked on Deadline"
                  : "Late Submissions Allowed"}
              </p>
              <span className="text-[10px] text-slate-400">
                {hackathon.submissionPolicy === "lock_on_deadline"
                  ? "Strict zero tolerance"
                  : "Marked as LATE with seconds"}
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Action Banner */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Left Column: Live Timer Card */}
          <div className="lg:col-span-1 space-y-6">
            <HackathonTimer
              deadlineAt={
                participation?.deadlineAt ||
                (hackathon.timerMode === "global" ? hackathon.globalEndTime : undefined)
              }
              startedAt={participation?.startedAt}
              serverTimeSkewMs={serverSkewMs}
              status={participation?.status}
              timerMode={hackathon.timerMode}
            />

            {/* Quick Navigation Workspace Tabs */}
            {isStarted && (
              <div className="rounded-3xl border border-purple-200/90 bg-white p-5 shadow-sm space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Workspace Actions
                </span>

                <Link
                  to="/hackathons/$hackathonId/problem"
                  params={{ hackathonId: hackathon.id }}
                  className="flex items-center justify-between rounded-2xl border border-purple-100 bg-purple-50/40 p-3.5 transition-all hover:bg-purple-100/60"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[#6C2BFF]" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Problem Statement</h4>
                      <p className="text-[10px] text-slate-500">
                        Read criteria &amp; download files
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#6C2BFF]" />
                </Link>

                <Link
                  to="/hackathons/$hackathonId/submission"
                  params={{ hackathonId: hackathon.id }}
                  className="flex items-center justify-between rounded-2xl border border-purple-100 bg-purple-50/40 p-3.5 transition-all hover:bg-purple-100/60"
                >
                  <div className="flex items-center gap-3">
                    <Send className="h-5 w-5 text-[#EA580C]" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Submit Project</h4>
                      <p className="text-[10px] text-slate-500">GitHub URL &amp; Demo Links</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#EA580C]" />
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Problem Statement Overview & Start CTA */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-purple-200/90 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6C2BFF]">
                    Official Problem Statement
                  </span>
                  <h3 className="mt-1 text-xl font-extrabold text-slate-900">
                    {hackathon.problemStatement?.title || "Problem Statement Overview"}
                  </h3>
                </div>

                {hackathon.problemStatement?.originalFile && (
                  <a
                    href={`/api/hackathons/${hackathon.id}/files/${hackathon.problemStatement.originalFile.storedFilename}`}
                    download={hackathon.problemStatement.originalFile.filename}
                    className="flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-bold text-[#6C2BFF] hover:bg-purple-100"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download {hackathon.problemStatement.originalFile.filename}</span>
                  </a>
                )}
              </div>

              {/* Problem Content Preview */}
              <div className="mt-5 space-y-4 text-xs leading-relaxed text-slate-700">
                <div className="rounded-2xl bg-purple-50/40 p-4 border border-purple-100">
                  <h4 className="font-bold text-slate-900 mb-1">Summary / Objective:</h4>
                  <p className="whitespace-pre-wrap">
                    {hackathon.problemStatement?.objective ||
                      hackathon.problemStatement?.content ||
                      "Review problem statement and begin working on your repository."}
                  </p>
                </div>

                {hackathon.problemStatement?.requirements && (
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Key Requirements:</h4>
                    <p className="whitespace-pre-wrap text-slate-600">
                      {hackathon.problemStatement.requirements}
                    </p>
                  </div>
                )}

                {hackathon.problemStatement?.constraints && (
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Constraints:</h4>
                    <p className="whitespace-pre-wrap text-slate-600">
                      {hackathon.problemStatement.constraints}
                    </p>
                  </div>
                )}
              </div>

              {/* Start Hackathon Action Bar */}
              <div className="mt-8 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-purple-50/60 p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {isStarted ? "Participation Active" : "Ready to Compete?"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isStarted
                      ? `You officially started on ${new Date(participation!.startedAt!).toLocaleTimeString()}. Your progress is tracked.`
                      : "Click below to begin. The server will officially start your countdown timer."}
                  </p>
                </div>

                <div>
                  {isStarted ? (
                    <Link
                      to="/hackathons/$hackathonId/problem"
                      params={{ hackathonId: hackathon.id }}
                      className="btn-studlyf-primary flex items-center gap-2 px-6 py-3 text-xs font-bold shadow-md shadow-purple-500/20"
                    >
                      <Play className="h-4 w-4" />
                      <span>Continue Workspace</span>
                    </Link>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleOpenStart}
                      className="btn-studlyf-primary flex items-center gap-2 px-7 py-3 text-xs font-bold shadow-lg shadow-purple-500/30"
                    >
                      <Play className="h-4 w-4" />
                      <span>Start Hackathon</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Start Modal */}
      <Dialog open={startModalOpen} onOpenChange={setStartModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border border-purple-100 shadow-2xl rounded-3xl p-6 font-['Poppins',sans-serif]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6C2BFF] to-[#EA580C] text-white shadow-md shadow-purple-500/25">
              <Play className="h-6 w-6 ml-0.5" />
            </div>
            <DialogTitle className="text-center text-xl font-extrabold text-slate-900 mt-2">
              Official Hackathon Start Confirmation
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-500">
              You are about to officially start this hackathon.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Hackathon:</span>
                <span className="font-bold text-slate-800">{hackathon.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Problem Title:</span>
                <span className="font-bold text-slate-800">
                  {hackathon.problemStatement?.title || "Problem Statement"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timer Mode:</span>
                <span className="font-bold text-[#6C2BFF]">
                  {hackathon.timerMode === "global"
                    ? "Global Event Window (Fixed End)"
                    : `Individual Duration (${Math.round((hackathon.individualDurationMinutes || 360) / 60)} Hours)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submission Policy:</span>
                <span className="font-bold text-slate-800">{hackathon.submissionPolicy}</span>
              </div>
            </div>

            {/* Participation Type Choice if Hackathon supports both or team */}
            {hackathon.participationType !== "individual" && (
              <div className="space-y-3 border-t border-purple-100 pt-3">
                <Label className="text-xs font-bold text-slate-800">
                  Select Participation Context
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {hackathon.participationType === "both" && (
                    <button
                      type="button"
                      onClick={() => setParticipantType("individual")}
                      className={`rounded-xl py-2 text-xs font-bold border transition-all ${
                        participantType === "individual"
                          ? "bg-[#6C2BFF] text-white border-[#6C2BFF]"
                          : "bg-white text-slate-600 border-purple-200"
                      }`}
                    >
                      Individual
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setParticipantType("team")}
                    className={`rounded-xl py-2 text-xs font-bold border transition-all ${
                      participantType === "team"
                        ? "bg-[#6C2BFF] text-white border-[#6C2BFF]"
                        : "bg-white text-slate-600 border-purple-200"
                    }`}
                  >
                    Team ({hackathon.minTeamSize}-{hackathon.maxTeamSize} members)
                  </button>
                </div>

                {participantType === "team" && (
                  <div className="space-y-2 mt-2">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Team Name *</Label>
                      <Input
                        type="text"
                        placeholder="e.g. CyberKnights"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="h-9 text-xs rounded-xl border-purple-200 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">
                        Team Members (Names &amp; Roll Nos)
                      </Label>
                      <Input
                        type="text"
                        placeholder="Member 1 (Roll 101), Member 2 (Roll 102)..."
                        value={teamMembersInput}
                        onChange={(e) => setTeamMembersInput(e.target.value)}
                        className="h-9 text-xs rounded-xl border-purple-200 mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl bg-amber-50 p-3 text-[11px] text-amber-800 flex items-start gap-2 border border-amber-200">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                Once confirmed, the server will lock your official start time and initiate the
                countdown. Your timer cannot be paused or reset.
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStartModalOpen(false)}
                className="w-1/2 rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmStart}
                disabled={starting}
                className="w-1/2 rounded-xl bg-gradient-to-r from-[#6C2BFF] to-[#7C3AED] text-white font-bold text-xs shadow-md shadow-purple-500/25"
              >
                {starting ? "Starting..." : "START NOW"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSuccess={() => setStartModalOpen(true)}
      />
    </div>
  );
}
