import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Send,
  Github,
  Globe,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Clock,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { HackathonTimer } from "@/components/hackathon-timer";
import {
  apiGetHackathon,
  apiListParticipations,
  apiListSubmissions,
  apiSubmitProject,
  fetchServerTime,
} from "@/lib/hackathon-api";
import type { Hackathon, HackathonParticipation, Submission } from "@/lib/hackathon-types";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/hackathons/$hackathonId/submission")({
  head: () => ({
    meta: [
      { title: "Project Submission — Framewise Hackathon" },
      {
        name: "description",
        content: "Submit your official GitHub repository and demo URL for evaluation.",
      },
    ],
  }),
  component: SubmissionPage,
});

const GITHUB_REGEX = /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/i;

function SubmissionPage() {
  const { hackathonId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [participation, setParticipation] = useState<HackathonParticipation | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverSkewMs, setServerSkewMs] = useState(0);

  // Form Fields
  const [projectTitle, setProjectTitle] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [description, setDescription] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    loadData();
  }, [hackathonId, user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [h, sTime, parts, subs] = await Promise.all([
        apiGetHackathon(hackathonId),
        fetchServerTime(),
        apiListParticipations(hackathonId),
        apiListSubmissions(hackathonId),
      ]);
      setHackathon(h);
      setServerSkewMs(Date.parse(sTime.serverTime) - Date.now());

      if (user) {
        const foundPart = parts.find(
          (p) => p.participantId === user.id || p.email?.toLowerCase() === user.email.toLowerCase(),
        );
        if (foundPart) {
          setParticipation(foundPart);
          const foundSub = subs.find((s) => s.participationId === foundPart.id);
          setSubmission(foundSub || null);
          if (foundSub) {
            setProjectTitle(foundSub.projectTitle);
            setGithubUrl(foundSub.githubUrl);
            setDescription(foundSub.description);
            setDemoUrl(foundSub.demoUrl || "");
            setAdditionalNotes(foundSub.additionalNotes || "");
          } else {
            setProjectTitle("");
            setGithubUrl("");
            setDescription("");
            setDemoUrl("");
            setAdditionalNotes("");
          }
        } else {
          setParticipation(null);
          setSubmission(null);
          setProjectTitle("");
          setGithubUrl("");
          setDescription("");
          setDemoUrl("");
          setAdditionalNotes("");
        }
      } else {
        setParticipation(null);
        setSubmission(null);
        setProjectTitle("");
        setGithubUrl("");
        setDescription("");
        setDemoUrl("");
        setAdditionalNotes("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = () => {
    if (!participation?.deadlineAt) return false;
    const deadlineMs = Date.parse(participation.deadlineAt);
    const authoritativeNow = Date.now() + serverSkewMs;
    return authoritativeNow > deadlineMs;
  };

  const isLocked = () => {
    if (!hackathon) return false;
    return isExpired() && hackathon.submissionPolicy === "lock_on_deadline";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participation) {
      toast.error("Please officially start the hackathon before submitting.");
      return;
    }
    if (!projectTitle.trim()) {
      toast.error("Please enter a project title.");
      return;
    }
    if (!GITHUB_REGEX.test(githubUrl.trim())) {
      toast.error(
        "Please enter a valid GitHub repository URL (e.g. https://github.com/user/repo).",
      );
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a brief project description.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiSubmitProject(hackathonId, {
        participationId: participation.id,
        participantType: participation.participantType,
        participantName: participation.participantName,
        projectTitle: projectTitle.trim(),
        description: description.trim(),
        githubUrl: githubUrl.trim(),
        demoUrl: demoUrl.trim() || undefined,
        additionalNotes: additionalNotes.trim() || undefined,
      });

      setSubmission(res.submission);
      setParticipation(res.participation);
      if (res.submission.status === "LATE") {
        toast.warning(
          `Submission recorded as LATE (${Math.round(res.submission.lateBySeconds / 60)} minutes after deadline).`,
        );
      } else {
        toast.success("Project successfully submitted! All server checks passed.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit project.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !hackathon) {
    return (
      <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif]">
        <SiteHeader />
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 px-5 py-24 text-sm font-semibold text-[#6C2BFF]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6C2BFF] border-t-transparent" />
          <span>Loading submission portal…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-5 py-10">
        {/* Breadcrumb Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-100 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link to="/hackathons" className="hover:text-[#6C2BFF]">
                Hackathons
              </Link>
              <span>/</span>
              <Link
                to="/hackathons/$hackathonId"
                params={{ hackathonId: hackathon.id }}
                className="hover:text-[#6C2BFF]"
              >
                {hackathon.name}
              </Link>
              <span>/</span>
              <span className="font-bold text-[#6C2BFF]">Project Submission</span>
            </div>

            <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              Official Project Submission
            </h1>
          </div>

          <Link
            to="/hackathons/$hackathonId/problem"
            params={{ hackathonId: hackathon.id }}
            className="flex items-center gap-1.5 text-xs font-bold text-[#6C2BFF] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Problem Statement</span>
          </Link>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Left Column: Live Timer & Status */}
          <div className="space-y-6">
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

            {submission && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Submission on Record</span>
                </div>
                <div className="text-xs text-emerald-900 space-y-1">
                  <p>
                    <span className="font-bold">Project:</span> {submission.projectTitle}
                  </p>
                  <p>
                    <span className="font-bold">GitHub:</span>{" "}
                    <a
                      href={submission.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {submission.githubUrl}
                    </a>
                  </p>
                  <p>
                    <span className="font-bold">Submitted At:</span>{" "}
                    {new Date(submission.submittedAt).toLocaleTimeString()}
                  </p>
                  <p>
                    <span className="font-bold">Status:</span> {submission.status}{" "}
                    {submission.lateBySeconds > 0 &&
                      `(${Math.round(submission.lateBySeconds / 60)}m late)`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Submission Form */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-purple-200/90 bg-white p-6 shadow-sm sm:p-8">
              {!participation?.startedAt ? (
                <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/70 p-8 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-amber-600" />
                  <h3 className="mt-3 text-base font-bold text-amber-900">Hackathon Not Started</h3>
                  <p className="mt-1 text-xs text-amber-700 max-w-sm mx-auto">
                    You must officially start this hackathon before submitting your project.
                  </p>
                  <div className="mt-5">
                    <Link
                      to="/hackathons/$hackathonId"
                      params={{ hackathonId: hackathon.id }}
                      className="btn-studlyf-primary px-5 py-2.5 text-xs font-bold inline-block"
                    >
                      Go to Event Start Page
                    </Link>
                  </div>
                </div>
              ) : isLocked() ? (
                <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/70 p-8 text-center">
                  <Lock className="mx-auto h-8 w-8 text-rose-600" />
                  <h3 className="mt-3 text-base font-bold text-rose-900">
                    Submissions are Officially Closed
                  </h3>
                  <p className="mt-1 text-xs text-rose-700 max-w-sm mx-auto">
                    The official deadline has expired and this event is configured to automatically
                    lock submissions on deadline.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {isExpired() && hackathon.submissionPolicy === "allow_late" && (
                    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-800 flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <span className="font-bold">Official Deadline Has Passed:</span> Late
                        submissions are permitted by the organizer for this event, but your
                        submission will be officially flagged as <strong>LATE</strong>.
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs font-bold text-slate-800">
                      Project / Repository Title *
                    </Label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. AI-Powered Smart Campus Badge System"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      className="mt-1 h-10 text-xs rounded-xl border-purple-200 focus:border-[#6C2BFF]"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-800">
                      GitHub Repository URL *
                    </Label>
                    <div className="relative mt-1">
                      <Github className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        type="url"
                        required
                        placeholder="https://github.com/username/project-repository"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="pl-9 h-10 text-xs rounded-xl border-purple-200 focus:border-[#6C2BFF]"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Must be a valid, accessible GitHub URL. Make sure repository visibility is
                      public for evaluation.
                    </span>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-800">
                      Project Description &amp; Approach *
                    </Label>
                    <Textarea
                      required
                      rows={4}
                      placeholder="Briefly describe what your solution does, tech stack utilized, and instructions on how to run..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 text-xs rounded-xl border-purple-200 focus:border-[#6C2BFF]"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-800">
                      Live Demo / Video URL (Optional)
                    </Label>
                    <div className="relative mt-1">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        type="url"
                        placeholder="https://my-demo-app.vercel.app"
                        value={demoUrl}
                        onChange={(e) => setDemoUrl(e.target.value)}
                        className="pl-9 h-10 text-xs rounded-xl border-purple-200 focus:border-[#6C2BFF]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-800">
                      Additional Notes to Evaluators (Optional)
                    </Label>
                    <Textarea
                      rows={2}
                      placeholder="Any credentials, environment setup notes, or special highlights..."
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="mt-1 text-xs rounded-xl border-purple-200"
                    />
                  </div>

                  <div className="border-t border-purple-100 pt-4 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Authoritative server timestamp will be recorded.
                    </span>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="btn-studlyf-primary flex items-center gap-2 px-7 py-3 text-xs font-bold shadow-lg shadow-purple-500/30"
                    >
                      <Send className="h-4 w-4" />
                      <span>{submission ? "Update Submission" : "Submit Official Project"}</span>
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
