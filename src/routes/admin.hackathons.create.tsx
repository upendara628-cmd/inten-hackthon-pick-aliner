import { useEffect, useState, useRef } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  FileText,
  Upload,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Lock,
  Globe,
  Trash2,
  AlertTriangle,
  ArrowRightLeft,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { apiGetHackathon, apiSaveHackathon, apiUploadProblemFile } from "@/lib/hackathon-api";
import type {
  AccessType,
  Hackathon,
  ParticipationType,
  ProblemOriginalFile,
  SubmissionPolicy,
  TimerMode,
} from "@/lib/hackathon-types";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/hackathons/create")({
  validateSearch: (search: Record<string, unknown>): { edit?: string | undefined } => ({
    edit: typeof search["edit"] === "string" ? (search["edit"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create / Edit Hackathon — Organizer Studio" },
      {
        name: "description",
        content:
          "Configure hackathon parameters, problem statements, timers, and submission rules.",
      },
    ],
  }),
  component: CreateHackathon,
});

/**
 * Robust ISO parser that never throws RangeError: Invalid time value
 */
function parseIsoOrFallback(val: string | undefined | null, fallbackMsFromNow: number): string {
  if (!val || typeof val !== "string" || !val.trim()) {
    return new Date(Date.now() + fallbackMsFromNow).toISOString();
  }
  const parsed = Date.parse(val);
  if (isNaN(parsed)) {
    return new Date(Date.now() + fallbackMsFromNow).toISOString();
  }
  return new Date(parsed).toISOString();
}

function CreateHackathon() {
  const { user, switchRole, isOrganizer } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/admin/hackathons/create" });
  const editId = search.edit;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(editId));

  // Visual validation errors banner
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form State
  const [id, setId] = useState(() => (editId ? editId : `hack_${Date.now().toString(36)}`));
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [organizerName, setOrganizerName] = useState(user?.name || "Event Organizer Sir");
  const [venue, setVenue] = useState("Main Campus Auditorium");

  // Dates
  const now = new Date();
  const inSevenDays = new Date(Date.now() + 7 * 86400000);
  const [startDate, setStartDate] = useState(now.toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(inSevenDays.toISOString().slice(0, 16));
  const [registrationStart, setRegistrationStart] = useState(now.toISOString().slice(0, 16));
  const [registrationEnd, setRegistrationEnd] = useState(inSevenDays.toISOString().slice(0, 16));

  // Participation
  const [participationType, setParticipationType] = useState<ParticipationType>("both");
  const [minTeamSize, setMinTeamSize] = useState(2);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [teamRules, setTeamRules] = useState("Teams must consist of enrolled students.");

  // Timer System
  const [timerMode, setTimerMode] = useState<TimerMode>("individual");
  const [globalStartTime, setGlobalStartTime] = useState(now.toISOString().slice(0, 16));
  const [globalEndTime, setGlobalEndTime] = useState(inSevenDays.toISOString().slice(0, 16));
  const [individualDurationHours, setIndividualDurationHours] = useState(6);

  // Submission Rules
  const [submissionPolicy, setSubmissionPolicy] = useState<SubmissionPolicy>("allow_late");
  const [accessType, setAccessType] = useState<AccessType>("public");

  // Problem Statement (Method A: Manual, Method B: File Upload)
  const [problemTitle, setProblemTitle] = useState("");
  const [problemContent, setProblemContent] = useState("");
  const [objective, setObjective] = useState("");
  const [requirements, setRequirements] = useState("");
  const [constraints, setConstraints] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [evaluationCriteria, setEvaluationCriteria] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [originalFile, setOriginalFile] = useState<ProblemOriginalFile | undefined>(undefined);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (editId) {
      loadExisting(editId);
    }
  }, [editId]);

  const loadExisting = async (existingId: string) => {
    try {
      const h = await apiGetHackathon(existingId);
      setName(h.name);
      setShortDescription(h.shortDescription || "");
      setFullDescription(h.fullDescription || "");
      setOrganizerName(h.organizerName || "Event Organizer Sir");
      setVenue(h.venue || "Main Campus Auditorium");
      setStartDate(h.startDate ? new Date(h.startDate).toISOString().slice(0, 16) : "");
      setEndDate(h.endDate ? new Date(h.endDate).toISOString().slice(0, 16) : "");
      setParticipationType(h.participationType || "both");
      setMinTeamSize(h.minTeamSize || 2);
      setMaxTeamSize(h.maxTeamSize || 4);
      setTeamRules(h.teamRules || "");
      setTimerMode(h.timerMode || "individual");
      setGlobalStartTime(
        h.globalStartTime ? new Date(h.globalStartTime).toISOString().slice(0, 16) : "",
      );
      setGlobalEndTime(h.globalEndTime ? new Date(h.globalEndTime).toISOString().slice(0, 16) : "");
      setIndividualDurationHours(Math.round((h.individualDurationMinutes || 360) / 60));
      setSubmissionPolicy(h.submissionPolicy || "allow_late");
      setAccessType(h.accessType || "public");

      if (h.problemStatement) {
        setProblemTitle(h.problemStatement.title || "");
        setProblemContent(h.problemStatement.content || "");
        setObjective(h.problemStatement.objective || "");
        setRequirements(h.problemStatement.requirements || "");
        setConstraints(h.problemStatement.constraints || "");
        setExpectedOutput(h.problemStatement.expectedOutput || "");
        setEvaluationCriteria(h.problemStatement.evaluationCriteria || "");
        setAdditionalInstructions(h.problemStatement.additionalInstructions || "");
        setOriginalFile(h.problemStatement.originalFile);
      }
    } catch (err: any) {
      toast.error("Could not load hackathon for editing");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const uploaded = await apiUploadProblemFile(id, file);
      setOriginalFile(uploaded);
      if (!problemTitle) {
        setProblemTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      toast.success(`Original document "${file.name}" uploaded successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSave = async (statusToSet: "DRAFT" | "PUBLISHED" | "LIVE") => {
    const errors: string[] = [];
    const fields: Record<string, string> = {};

    if (!name.trim()) {
      errors.push("Hackathon Name is required.");
      fields["name"] = "Please enter a title for the hackathon.";
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      setFieldErrors(fields);
      toast.error(errors[0]);

      // Scroll to the first error element
      const firstEl = document.getElementById("field-hackathon-name");
      if (firstEl) {
        firstEl.scrollIntoView({ behavior: "smooth", block: "center" });
        firstEl.focus();
      }
      return;
    }

    setFormErrors([]);
    setFieldErrors({});
    setSaving(true);

    try {
      // Auto-fallback problem title if left blank
      const effectiveProblemTitle =
        problemTitle.trim() ||
        (name.trim() ? `${name.trim()} Problem Statement` : "Official Problem Statement");

      const payload: Hackathon = {
        id,
        name: name.trim(),
        shortDescription: shortDescription.trim(),
        fullDescription: fullDescription.trim(),
        organizerName: organizerName.trim() || "Event Organizer Sir",
        organizerId: user?.id || "org_admin",
        venue: venue.trim() || "Campus Venue / Online",
        startDate: parseIsoOrFallback(startDate, 0),
        endDate: parseIsoOrFallback(endDate, 7 * 86400000),
        registrationStart: registrationStart ? parseIsoOrFallback(registrationStart, 0) : undefined,
        registrationEnd: registrationEnd
          ? parseIsoOrFallback(registrationEnd, 7 * 86400000)
          : undefined,
        participationType,
        minTeamSize: Number(minTeamSize) || 2,
        maxTeamSize: Number(maxTeamSize) || 4,
        teamRules,
        timerMode,
        globalStartTime: parseIsoOrFallback(globalStartTime, 0),
        globalEndTime: parseIsoOrFallback(globalEndTime, 7 * 86400000),
        individualDurationMinutes: (Number(individualDurationHours) || 6) * 60,
        submissionPolicy,
        accessType,
        status: statusToSet,
        problemStatement: {
          title: effectiveProblemTitle,
          content:
            problemContent.trim() ||
            shortDescription.trim() ||
            "Official problem statement guidelines.",
          objective: objective.trim() || undefined,
          requirements: requirements.trim() || undefined,
          constraints: constraints.trim() || undefined,
          expectedOutput: expectedOutput.trim() || undefined,
          evaluationCriteria: evaluationCriteria.trim() || undefined,
          additionalInstructions: additionalInstructions.trim() || undefined,
          originalFile,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await apiSaveHackathon(payload);
      toast.success(
        statusToSet === "PUBLISHED"
          ? `Hackathon "${saved.name}" published successfully! Participants can now view and start.`
          : `Hackathon "${saved.name}" saved as draft.`,
      );
      navigate({ to: "/admin/hackathons" });
    } catch (err: any) {
      console.error("Save error:", err);
      const msg = err.message || "Failed to save hackathon to server.";
      setFormErrors([`Server Error: ${msg}`]);
      toast.error(`Save failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif]">
        <SiteHeader />
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 px-5 py-24 text-sm font-semibold text-[#6C2BFF]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6C2BFF] border-t-transparent" />
          <span>Loading event configuration…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-5 py-10">
        <div className="border-b border-purple-100 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-purple-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#6C2BFF]">
              {editId ? "Update Hackathon" : "New Event Creator"}
            </span>

            {/* Role indicator & quick switch */}
            {user && (
              <div className="flex items-center gap-2 rounded-full border border-purple-200 bg-white px-3 py-1 text-xs font-semibold">
                <span className="text-slate-500">Current Role:</span>
                <span className={`font-bold ${isOrganizer ? "text-[#6C2BFF]" : "text-[#EA580C]"}`}>
                  {user.role} ({user.name})
                </span>
                {!isOrganizer && (
                  <button
                    type="button"
                    onClick={() => switchRole("organizer")}
                    className="ml-1 text-[11px] font-bold text-[#6C2BFF] underline"
                  >
                    Switch to Organizer
                  </button>
                )}
              </div>
            )}
          </div>

          <h1 className="mt-3 text-3xl font-black text-slate-900">
            {editId ? "Edit Hackathon Configuration" : "Create Official Hackathon"}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Configure authoritative timers, problem statements, and participation rules.
          </p>
        </div>

        {/* Global Error Banner if validation fails */}
        {formErrors.length > 0 && (
          <div className="mt-6 rounded-2xl border-2 border-red-300 bg-red-50/90 p-5 shadow-sm text-xs text-red-900 space-y-2">
            <div className="flex items-center gap-2 font-black text-sm text-red-800">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <span>Cannot save hackathon — please check the following:</span>
            </div>
            <ul className="list-disc pl-6 space-y-1 font-semibold text-red-800">
              {formErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 space-y-8">
          {/* SECTION 1: BASIC INFORMATION */}
          <div className="rounded-3xl border border-purple-200/90 bg-white p-6 shadow-sm sm:p-8 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#6C2BFF] border-b border-purple-100 pb-2">
              1. Basic Information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-xs font-bold text-slate-800">Hackathon Name *</Label>
                <Input
                  id="field-hackathon-name"
                  type="text"
                  required
                  placeholder="e.g. CodeSprint 2026 — Campus Innovation Hackathon"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors["name"]) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next["name"];
                        return next;
                      });
                    }
                  }}
                  className={`mt-1 h-10 text-xs rounded-xl ${
                    fieldErrors["name"]
                      ? "border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-200"
                      : "border-purple-200"
                  }`}
                />
                {fieldErrors["name"] && (
                  <p className="mt-1 text-[11px] font-bold text-red-600">{fieldErrors["name"]}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-800">Organizer / Sir Name</Label>
                <Input
                  type="text"
                  placeholder="Organizer Name / Department"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="mt-1 h-10 text-xs rounded-xl border-purple-200"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-800">Venue / Location</Label>
                <Input
                  type="text"
                  placeholder="Auditorium Hall or Online (Discord / Teams)"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="mt-1 h-10 text-xs rounded-xl border-purple-200"
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs font-bold text-slate-800">Short Description</Label>
                <Input
                  type="text"
                  placeholder="One-line summary for event cards"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="mt-1 h-10 text-xs rounded-xl border-purple-200"
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs font-bold text-slate-800">Full Description</Label>
                <Textarea
                  rows={3}
                  placeholder="Detailed overview of event schedule, theme, and context..."
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  className="mt-1 text-xs rounded-xl border-purple-200"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-800">Start Date &amp; Time</Label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 h-10 text-xs rounded-xl border-purple-200"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-800">End Date &amp; Time</Label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 h-10 text-xs rounded-xl border-purple-200"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PARTICIPATION CONFIGURATION */}
          <div className="rounded-3xl border border-purple-200/90 bg-white p-6 shadow-sm sm:p-8 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#7C3AED] border-b border-purple-100 pb-2">
              2. Participation Rules
            </h3>

            <div>
              <Label className="text-xs font-bold text-slate-800">Allowed Participation Type</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {(["both", "individual", "team"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setParticipationType(t)}
                    className={`rounded-2xl p-3 text-xs font-bold border transition-all text-center capitalize ${
                      participationType === t
                        ? "bg-[#6C2BFF] text-white border-[#6C2BFF] shadow-sm"
                        : "bg-purple-50/50 text-slate-600 border-purple-100 hover:border-purple-300"
                    }`}
                  >
                    {t === "both" ? "Individual & Teams" : t}
                  </button>
                ))}
              </div>
            </div>

            {participationType !== "individual" && (
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div>
                  <Label className="text-xs font-bold text-slate-800">Minimum Team Size</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={minTeamSize}
                    onChange={(e) => setMinTeamSize(Number(e.target.value) || 2)}
                    className="mt-1 h-10 text-xs rounded-xl border-purple-200"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-800">Maximum Team Size</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={maxTeamSize}
                    onChange={(e) => setMaxTeamSize(Number(e.target.value) || 4)}
                    className="mt-1 h-10 text-xs rounded-xl border-purple-200"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-800">
                    Team Formation Guidelines
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g. Cross-department teams permitted"
                    value={teamRules}
                    onChange={(e) => setTeamRules(e.target.value)}
                    className="mt-1 h-10 text-xs rounded-xl border-purple-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: PROBLEM STATEMENT SYSTEM */}
          <div className="rounded-3xl border border-purple-200/90 bg-white p-6 shadow-sm sm:p-8 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#EA580C] border-b border-purple-100 pb-2">
              3. Problem Statement System
            </h3>

            {/* METHOD B: UPLOAD ORIGINAL FILE */}
            <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#6C2BFF]">
                <Upload className="h-4 w-4" />
                <span>Method B: Upload Original Document (.xlsx, .pdf, .docx, .txt)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload your official problem sheet. Participants can download the original file
                directly.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  id="problem-doc-upload"
                  className="hidden"
                  accept=".xlsx,.xls,.pdf,.docx,.doc,.txt"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="problem-doc-upload"
                  className="btn-studlyf-primary flex items-center gap-2 px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>{uploadingFile ? "Uploading..." : "Choose Document File"}</span>
                </label>

                {originalFile && (
                  <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 border border-purple-200 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{originalFile.filename}</span>
                    <button
                      type="button"
                      onClick={() => setOriginalFile(undefined)}
                      className="ml-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* METHOD A: MANUAL RICH ENTRY */}
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-xs font-bold text-slate-800">
                  Problem Title (Optional — defaults to Hackathon Name)
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. Automated Identity Verification & Cryptographic Badging"
                  value={problemTitle}
                  onChange={(e) => setProblemTitle(e.target.value)}
                  className="mt-1 h-10 text-xs rounded-xl border-purple-200"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-800">
                  Problem Statement &amp; Overview
                </Label>
                <Textarea
                  rows={4}
                  placeholder="Paste or write the core problem statement..."
                  value={problemContent}
                  onChange={(e) => setProblemContent(e.target.value)}
                  className="mt-1 text-xs rounded-xl border-purple-200"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-bold text-slate-800">Objective</Label>
                  <Textarea
                    rows={2}
                    placeholder="Key objective to achieve..."
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="mt-1 text-xs rounded-xl border-purple-200"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-800">Requirements</Label>
                  <Textarea
                    rows={2}
                    placeholder="Specific functional requirements..."
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="mt-1 text-xs rounded-xl border-purple-200"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-800">
                    Constraints &amp; Limits
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="Technical, platform, or scope limits..."
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    className="mt-1 text-xs rounded-xl border-purple-200"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-800">
                    Expected Deliverables / Output
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="e.g. Working web app, GitHub repo, live deployment..."
                    value={expectedOutput}
                    onChange={(e) => setExpectedOutput(e.target.value)}
                    className="mt-1 text-xs rounded-xl border-purple-200"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-800">Evaluation Criteria</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Innovation (30%), Code Quality (30%), UI/UX (20%), Completion (20%)"
                    value={evaluationCriteria}
                    onChange={(e) => setEvaluationCriteria(e.target.value)}
                    className="mt-1 h-10 text-xs rounded-xl border-purple-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: TIMER ENGINE CONFIGURATION */}
          <div className="rounded-3xl border border-purple-200/90 bg-white p-6 shadow-sm sm:p-8 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#6C2BFF] border-b border-purple-100 pb-2">
              4. Authoritative Timer Configuration
            </h3>

            <div>
              <Label className="text-xs font-bold text-slate-800">Choose Timer Mode</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setTimerMode("global")}
                  className={`rounded-2xl p-4 text-left border transition-all ${
                    timerMode === "global"
                      ? "bg-purple-50 border-[#6C2BFF] ring-2 ring-[#6C2BFF]/20"
                      : "bg-white border-purple-100 hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <Clock className="h-4 w-4 text-[#6C2BFF]" />
                    <span>Mode 1: Global Event Window</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Every participant shares the exact same fixed deadline regardless of when they
                    start.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTimerMode("individual")}
                  className={`rounded-2xl p-4 text-left border transition-all ${
                    timerMode === "individual"
                      ? "bg-purple-50 border-[#6C2BFF] ring-2 ring-[#6C2BFF]/20"
                      : "bg-white border-purple-100 hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <Clock className="h-4 w-4 text-[#EA580C]" />
                    <span>Mode 2: Individual Duration Countdown</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Each participant/team gets a fixed duration that starts counting down the moment
                    they confirm Start.
                  </p>
                </button>
              </div>
            </div>

            {timerMode === "individual" ? (
              <div>
                <Label className="text-xs font-bold text-slate-800">
                  Individual Duration (Hours)
                </Label>
                <div className="flex items-center gap-3 mt-1">
                  <Input
                    type="number"
                    min={1}
                    max={72}
                    value={individualDurationHours}
                    onChange={(e) => setIndividualDurationHours(Number(e.target.value) || 6)}
                    className="h-10 w-32 text-xs rounded-xl border-purple-200"
                  />
                  <span className="text-xs text-slate-500 font-semibold">
                    = {(Number(individualDurationHours) || 6) * 60} minutes official countdown per
                    participant
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div>
                  <Label className="text-xs font-bold text-slate-800">Global Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={globalStartTime}
                    onChange={(e) => setGlobalStartTime(e.target.value)}
                    className="mt-1 h-10 text-xs rounded-xl border-purple-200"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-800">
                    Global End Time (Strict Deadline)
                  </Label>
                  <Input
                    type="datetime-local"
                    value={globalEndTime}
                    onChange={(e) => setGlobalEndTime(e.target.value)}
                    className="mt-1 h-10 text-xs rounded-xl border-purple-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: SUBMISSION POLICY & ACCESS */}
          <div className="rounded-3xl border border-purple-200/90 bg-white p-6 shadow-sm sm:p-8 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 border-b border-purple-100 pb-2">
              5. Submission Policy &amp; Access Control
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-bold text-slate-800">When Time Expires</Label>
                <div className="space-y-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSubmissionPolicy("lock_on_deadline")}
                    className={`w-full rounded-xl p-3 text-left border text-xs font-bold transition-all ${
                      submissionPolicy === "lock_on_deadline"
                        ? "bg-purple-50 border-[#6C2BFF] text-[#6C2BFF]"
                        : "bg-white border-purple-100 text-slate-700"
                    }`}
                  >
                    🔒 Option A: Automatically Lock Submissions
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmissionPolicy("allow_late")}
                    className={`w-full rounded-xl p-3 text-left border text-xs font-bold transition-all ${
                      submissionPolicy === "allow_late"
                        ? "bg-purple-50 border-[#6C2BFF] text-[#6C2BFF]"
                        : "bg-white border-purple-100 text-slate-700"
                    }`}
                  >
                    ⏱️ Option B: Allow Submissions (Flagged as LATE)
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-800">Event Visibility</Label>
                <div className="space-y-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setAccessType("public")}
                    className={`w-full rounded-xl p-3 text-left border text-xs font-bold transition-all ${
                      accessType === "public"
                        ? "bg-purple-50 border-[#6C2BFF] text-[#6C2BFF]"
                        : "bg-white border-purple-100 text-slate-700"
                    }`}
                  >
                    🌐 Public (Anyone with link can access)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessType("private")}
                    className={`w-full rounded-xl p-3 text-left border text-xs font-bold transition-all ${
                      accessType === "private"
                        ? "bg-purple-50 border-[#6C2BFF] text-[#6C2BFF]"
                        : "bg-white border-purple-100 text-slate-700"
                    }`}
                  >
                    🛡️ Private (Verified authentication required)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Error Box if any */}
          {formErrors.length > 0 && (
            <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-xs text-red-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-red-800">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>Validation Problem:</span>
              </div>
              <ul className="list-disc pl-5 font-semibold text-red-800">
                {formErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-purple-100">
            <span className="text-[11px] text-slate-400">
              {saving ? "Transmitting data to server…" : "Ready to save or publish"}
            </span>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => handleSave("DRAFT")}
                className="rounded-2xl px-6 py-2.5 text-xs font-bold border-purple-200 hover:bg-purple-50"
              >
                {saving ? "Saving…" : "Save as Draft"}
              </Button>

              <Button
                type="button"
                disabled={saving}
                onClick={() => handleSave("PUBLISHED")}
                className="btn-studlyf-primary flex items-center gap-2 rounded-2xl px-8 py-3 text-xs font-bold shadow-lg shadow-purple-500/30"
              >
                <Sparkles className="h-4 w-4" />
                <span>{saving ? "Saving…" : "Publish Hackathon"}</span>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
