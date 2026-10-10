import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Code2,
  Terminal,
  FileSpreadsheet,
  Send,
  Eye,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { HackathonTimer } from "@/components/hackathon-timer";
import { apiGetHackathon, apiListParticipations, fetchServerTime } from "@/lib/hackathon-api";
import type { Hackathon, HackathonParticipation } from "@/lib/hackathon-types";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/hackathons/$hackathonId/problem")({
  head: () => ({
    meta: [
      { title: "Problem Statement Workspace — Framewise" },
      {
        name: "description",
        content: "Official Hackathon Problem Statement, requirements, and constraints.",
      },
    ],
  }),
  component: ProblemWorkspace,
});

function ProblemWorkspace() {
  const { hackathonId } = Route.useParams();
  const { user } = useAuth();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [participation, setParticipation] = useState<HackathonParticipation | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverSkewMs, setServerSkewMs] = useState(0);

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
      setServerSkewMs(Date.parse(sTime.serverTime) - Date.now());

      if (user) {
        const found = parts.find(
          (p) => p.participantId === user.id || p.email?.toLowerCase() === user.email.toLowerCase(),
        );
        setParticipation(found || null);
      } else {
        setParticipation(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !hackathon) {
    return (
      <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif]">
        <SiteHeader />
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 px-5 py-24 text-sm font-semibold text-[#6C2BFF]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6C2BFF] border-t-transparent" />
          <span>Loading official problem statement…</span>
        </div>
      </div>
    );
  }

  const p = hackathon.problemStatement;
  const originalFile = p?.originalFile;

  return (
    <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10">
        {/* Top Breadcrumb & Live Timer Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-100 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link to="/hackathons" className="hover:text-[#6C2BFF]">
                Hackathons
              </Link>
              <span>/</span>
              <Link to={`/hackathons/${hackathon.id}`} className="hover:text-[#6C2BFF]">
                {hackathon.name}
              </Link>
              <span>/</span>
              <span className="font-bold text-[#6C2BFF]">Problem Workspace</span>
            </div>

            <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              {p?.title || "Problem Statement"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/hackathons/${hackathon.id}/submission`}
              className="btn-studlyf-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold shadow-md shadow-purple-500/20"
            >
              <Send className="h-4 w-4" />
              <span>Submit Project</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Main Problem Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Original File Banner if available */}
            {originalFile && (
              <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-purple-50/50 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-[#6C2BFF]">
                    {originalFile.filename.endsWith(".xlsx") ||
                    originalFile.filename.endsWith(".xls") ? (
                      <FileSpreadsheet className="h-6 w-6" />
                    ) : (
                      <FileText className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6C2BFF]">
                      Original Document Attached
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{originalFile.filename}</h4>
                    <span className="text-[10px] text-slate-500">
                      {Math.round(originalFile.size / 1024)} KB · Uploaded by Organizer
                    </span>
                  </div>
                </div>

                <a
                  href={`/api/hackathons/${hackathon.id}/files/${originalFile.storedFilename}`}
                  download={originalFile.filename}
                  className="btn-studlyf-primary flex items-center gap-2 px-4 py-2 text-xs font-bold"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Document</span>
                </a>
              </div>
            )}

            {/* Extracted Excel or Text Preview if present */}
            {originalFile?.extractedTextPreview && (
              <div className="rounded-3xl border border-purple-200/90 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2 border-b border-purple-100 pb-3">
                  <Eye className="h-4 w-4 text-[#6C2BFF]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Document Data Preview
                  </h3>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-50 p-4 font-mono text-[11px] leading-relaxed text-slate-700 max-h-60">
                  {originalFile.extractedTextPreview}
                </pre>
              </div>
            )}

            {/* Problem Statement Content Blocks */}
            <div className="rounded-3xl border border-purple-200/90 bg-white p-6 shadow-sm space-y-6 sm:p-8">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C2BFF]">
                  Overview &amp; Context
                </h3>
                <div className="mt-2 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {p?.content || "No detailed context provided."}
                </div>
              </div>

              {p?.objective && (
                <div className="border-t border-purple-100 pt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C2BFF]">
                    Core Objective
                  </h3>
                  <div className="mt-2 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {p.objective}
                  </div>
                </div>
              )}

              {p?.requirements && (
                <div className="border-t border-purple-100 pt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C2BFF]">
                    Functional Requirements
                  </h3>
                  <div className="mt-2 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {p.requirements}
                  </div>
                </div>
              )}

              {p?.constraints && (
                <div className="border-t border-purple-100 pt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#EA580C]">
                    Constraints &amp; Rules
                  </h3>
                  <div className="mt-2 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {p.constraints}
                  </div>
                </div>
              )}

              {p?.expectedOutput && (
                <div className="border-t border-purple-100 pt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Expected Deliverables &amp; Output
                  </h3>
                  <div className="mt-2 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {p.expectedOutput}
                  </div>
                </div>
              )}

              {p?.evaluationCriteria && (
                <div className="border-t border-purple-100 pt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
                    Evaluation &amp; Scoring Criteria
                  </h3>
                  <div className="mt-2 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {p.evaluationCriteria}
                  </div>
                </div>
              )}

              {p?.additionalInstructions && (
                <div className="border-t border-purple-100 pt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Additional Organizer Instructions
                  </h3>
                  <div className="mt-2 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {p.additionalInstructions}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Live Timer & Quick Link */}
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

            <div className="rounded-3xl border border-purple-200/90 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Ready to submit?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ensure your code is committed to a public GitHub repository. You can update your
                submission anytime before your deadline.
              </p>
              <Link
                to={`/hackathons/${hackathon.id}/submission`}
                className="btn-studlyf-primary flex items-center justify-center gap-2 w-full py-3 text-xs font-bold"
              >
                <span>Go to Submission Form</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
