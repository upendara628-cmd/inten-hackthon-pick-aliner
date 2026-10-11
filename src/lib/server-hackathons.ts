import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import * as XLSX from "xlsx";
import type {
  AuditLogEntry,
  Hackathon,
  HackathonLiveStats,
  HackathonParticipation,
  HackathonStatus,
  ProblemOriginalFile,
  ProblemStatement,
  Submission,
  Team,
  TeamMember,
} from "./hackathon-types";

function resolveDataDir(): string {
  const local = path.resolve(process.cwd(), "data", "hackathons");
  try {
    if (!fs.existsSync(local)) {
      fs.mkdirSync(local, { recursive: true });
    }
    const testFile = path.join(local, `.test_${Date.now()}`);
    fs.writeFileSync(testFile, "");
    fs.unlinkSync(testFile);
    return local;
  } catch {
    const tmp = path.resolve(os.tmpdir(), "framewise-data", "hackathons");
    try {
      if (!fs.existsSync(tmp)) {
        fs.mkdirSync(tmp, { recursive: true });
      }
    } catch {}
    return tmp;
  }
}

const DATA_DIR = resolveDataDir();
const FILES_DIR = path.resolve(DATA_DIR, "files");

function ensureDirs() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {}
  try {
    if (!fs.existsSync(FILES_DIR)) {
      fs.mkdirSync(FILES_DIR, { recursive: true });
    }
  } catch {}
}

const DEFAULT_HACKATHONS: Hackathon[] = [
  {
    id: "hack_oct_2026",
    name: "Oct 2026 Innovation Sprint",
    shortDescription: "Build next-gen student identity and credential infrastructure.",
    fullDescription: "Comprehensive campus engineering hackathon to design secure automated solutions.",
    organizerName: "Event Organizer Sir",
    organizerId: "org_admin",
    venue: "Campus Tech Hall / Hybrid",
    startDate: "2026-10-15T09:00:00.000Z",
    endDate: "2026-10-16T18:00:00.000Z",
    participationType: "both",
    minTeamSize: 2,
    maxTeamSize: 4,
    teamRules: "Inter-branch teams allowed.",
    timerMode: "individual",
    globalStartTime: "2026-10-15T09:00:00.000Z",
    globalEndTime: "2026-10-16T18:00:00.000Z",
    individualDurationMinutes: 360,
    submissionPolicy: "allow_late",
    accessType: "public",
    status: "PUBLISHED",
    problemStatement: {
      title: "Automated Student Verification & Cryptographic Badging",
      content: "Develop a modern, reliable system that generates secure participant credentials and integrates with event scanners.",
      objective: "Eliminate duplicate badge forgery and automate fast verification at entry checkpoints.",
      requirements: "1. Fast sub-second alignment\n2. Real-time exports\n3. Cryptographic hash check",
      constraints: "Client-side processing preferred to maintain attendee privacy.",
      expectedOutput: "Deployable web app and verified GitHub repository.",
      evaluationCriteria: "Innovation: 30%, Code Quality: 30%, UI/UX: 20%, Execution: 20%",
    },
    updatedAt: "2026-10-08T16:57:20.311Z",
    createdAt: "2026-10-08T16:57:20.311Z",
  },
  {
    id: "hack_nov_2026",
    name: "AI & Systems National Hackathon 2026",
    shortDescription: "Solve hard systems challenges with autonomous agents and web intelligence.",
    fullDescription: "48-hour nationwide developer sprint focused on next-generation computing architectures.",
    organizerName: "Event Organizer Sir",
    organizerId: "org_admin",
    venue: "Main Auditorium & Online",
    startDate: "2026-11-05T10:00:00.000Z",
    endDate: "2026-11-07T18:00:00.000Z",
    participationType: "both",
    minTeamSize: 1,
    maxTeamSize: 4,
    timerMode: "global",
    globalStartTime: "2026-11-05T10:00:00.000Z",
    globalEndTime: "2026-11-07T18:00:00.000Z",
    individualDurationMinutes: 2880,
    submissionPolicy: "lock_on_deadline",
    accessType: "public",
    status: "PUBLISHED",
    problemStatement: {
      title: "Resilient Distributed State for Autonomous Workflows",
      content: "Construct high-throughput real-time streaming architectures capable of multi-agent state coordination.",
      objective: "Achieve sub-50ms sync latency under network partition stress.",
      requirements: "1. Real-time consensus\n2. Crash recovery\n3. Scalable storage",
      constraints: "Strict resource caps on memory footprint.",
      expectedOutput: "Working prototype and benchmark suite.",
      evaluationCriteria: "Architecture: 40%, Performance: 30%, Documentation: 30%",
    },
    updatedAt: "2026-10-09T12:00:00.000Z",
    createdAt: "2026-10-09T12:00:00.000Z",
  },
];

// In-memory cache for fast lookups & thread safety
const hackathonCache = new Map<string, Hackathon>();
const participationsCache = new Map<string, HackathonParticipation[]>();
const teamsCache = new Map<string, Team[]>();
const submissionsCache = new Map<string, Submission[]>();
const auditCache = new Map<string, AuditLogEntry[]>();

// Initialize default demonstration hackathons into memory cache
for (const dh of DEFAULT_HACKATHONS) {
  hackathonCache.set(dh.id, dh);
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as T;
    }
  } catch (err) {
    // Ignore read errors
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    ensureDirs();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    // In-memory cache handles persistence when disk is read-only
  }
}

// ============================================================================
// HACKATHONS
// ============================================================================

export function listHackathons(includeDrafts = true): Hackathon[] {
  ensureDirs();
  try {
    if (fs.existsSync(DATA_DIR)) {
      const files = fs.readdirSync(DATA_DIR);
      for (const file of files) {
        const isSidecar =
          file.endsWith("_participations.json") ||
          file.endsWith("_submissions.json") ||
          file.endsWith("_teams.json") ||
          file.endsWith("_audit.json");

        if (file.endsWith(".json") && !isSidecar) {
          const id = file.replace(/\.json$/, "");
          getHackathon(id);
        }
      }
    }
  } catch (err) {}

  // Check bundled project directory if DATA_DIR was redirected to /tmp
  const originalDataDir = path.resolve(process.cwd(), "data", "hackathons");
  if (originalDataDir !== DATA_DIR) {
    try {
      if (fs.existsSync(originalDataDir)) {
        const files = fs.readdirSync(originalDataDir);
        for (const file of files) {
          const isSidecar =
            file.endsWith("_participations.json") ||
            file.endsWith("_submissions.json") ||
            file.endsWith("_teams.json") ||
            file.endsWith("_audit.json");

          if (file.endsWith(".json") && !isSidecar) {
            const id = file.replace(/\.json$/, "");
            getHackathon(id);
          }
        }
      }
    } catch {}
  }

  const list: Hackathon[] = Array.from(hackathonCache.values());
  const filtered = includeDrafts ? list : list.filter((h) => h.status !== "DRAFT");
  return filtered.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export function getHackathon(id: string): Hackathon | null {
  if (hackathonCache.has(id)) {
    return hackathonCache.get(id)!;
  }
  ensureDirs();
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      const h = readJsonFile<Hackathon | null>(filePath, null);
      if (h) {
        hackathonCache.set(id, h);
        return h;
      }
    }
  } catch {}

  try {
    const origPath = path.resolve(process.cwd(), "data", "hackathons", `${id}.json`);
    if (origPath !== path.join(DATA_DIR, `${id}.json`) && fs.existsSync(origPath)) {
      const h = readJsonFile<Hackathon | null>(origPath, null);
      if (h) {
        hackathonCache.set(id, h);
        return h;
      }
    }
  } catch {}

  return null;
}

export function saveHackathon(h: Hackathon, actor?: { name: string; role: string }): Hackathon {
  ensureDirs();
  const isNew = !getHackathon(h.id);
  h.updatedAt = new Date().toISOString();
  if (isNew && !h.createdAt) {
    h.createdAt = new Date().toISOString();
  }

  hackathonCache.set(h.id, h);
  const filePath = path.join(DATA_DIR, `${h.id}.json`);
  writeJsonFile(filePath, h);

  recordAuditLog(
    h.id,
    actor?.name || "Organizer",
    actor?.role || "organizer",
    isNew ? "HACKATHON_CREATED" : "HACKATHON_UPDATED",
    `Hackathon "${h.name}" saved with status ${h.status}.`,
  );

  return h;
}

export function updateHackathonStatus(
  id: string,
  status: HackathonStatus,
  actor?: { name: string; role: string },
): Hackathon | null {
  const h = getHackathon(id);
  if (!h) return null;
  const oldStatus = h.status;
  h.status = status;
  h.updatedAt = new Date().toISOString();
  saveHackathon(h, actor);

  recordAuditLog(
    id,
    actor?.name || "Organizer",
    actor?.role || "organizer",
    "STATUS_CHANGED",
    `Status changed from ${oldStatus} to ${status}.`,
  );

  return h;
}

export function deleteOrArchiveHackathon(
  id: string,
  actor?: { name: string; role: string },
): boolean {
  const h = getHackathon(id);
  if (!h) return false;
  // Prefer Archive soft-delete
  h.status = "ARCHIVED";
  saveHackathon(h, actor);
  recordAuditLog(
    id,
    actor?.name || "Organizer",
    actor?.role || "organizer",
    "HACKATHON_ARCHIVED",
    `Hackathon "${h.name}" archived.`,
  );
  return true;
}

// ============================================================================
// PARTICIPATIONS & TIMER SYSTEM (SERVER AUTHORITATIVE)
// ============================================================================

export function listParticipations(hackathonId: string): HackathonParticipation[] {
  if (participationsCache.has(hackathonId)) {
    const cached = participationsCache.get(hackathonId)!;
    return syncParticipationsStatus(hackathonId, cached);
  }
  ensureDirs();
  const filePath = path.join(DATA_DIR, `${hackathonId}_participations.json`);
  const list = readJsonFile<HackathonParticipation[]>(filePath, []);
  participationsCache.set(hackathonId, list);
  return syncParticipationsStatus(hackathonId, list);
}

function saveParticipations(hackathonId: string, list: HackathonParticipation[]): void {
  participationsCache.set(hackathonId, list);
  const filePath = path.join(DATA_DIR, `${hackathonId}_participations.json`);
  writeJsonFile(filePath, list);
}

/**
 * Dynamically evaluates real-time participant status (e.g. EXPIRED if time elapsed and not submitted)
 */
function syncParticipationsStatus(
  hackathonId: string,
  list: HackathonParticipation[],
): HackathonParticipation[] {
  const subs = listSubmissions(hackathonId);
  const subsMap = new Map(subs.map((s) => [s.participationId, s]));
  const now = Date.now();
  let changed = false;

  const updated = list.map((p) => {
    const sub = subsMap.get(p.id);
    let newStatus = p.status;

    if (sub) {
      newStatus = sub.status; // "SUBMITTED" or "LATE"
    } else if (p.startedAt && p.deadlineAt) {
      const deadline = Date.parse(p.deadlineAt);
      if (now > deadline) {
        newStatus = "EXPIRED";
      } else {
        newStatus = "IN_PROGRESS";
      }
    } else {
      newStatus = "NOT_STARTED";
    }

    if (newStatus !== p.status || sub?.id !== p.submissionId) {
      changed = true;
      return {
        ...p,
        status: newStatus,
        submissionId: sub?.id,
      };
    }
    return p;
  });

  if (changed) {
    saveParticipations(hackathonId, updated);
  }
  return updated;
}

export function getParticipation(
  hackathonId: string,
  participantId: string,
): HackathonParticipation | null {
  const all = listParticipations(hackathonId);
  return all.find((p) => p.participantId === participantId) || null;
}

/**
 * Server-authoritative START flow.
 * Idempotent: If participant already started, returns existing record without altering timestamps!
 */
export function startParticipation(
  hackathonId: string,
  payload: {
    participantType: "individual" | "team";
    participantId: string;
    participantName: string;
    email?: string;
    rollNumber?: string;
    institution?: string;
    teamMembersSummary?: string;
  },
): { participation: HackathonParticipation; serverTime: string } {
  const hackathon = getHackathon(hackathonId);
  if (!hackathon) {
    throw new Error("Hackathon not found");
  }

  const all = listParticipations(hackathonId);
  const existing = all.find((p) => p.participantId === payload.participantId);
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

  if (existing && existing.startedAt) {
    // Already started — do not change start time or deadline!
    return { participation: existing, serverTime: nowIso };
  }

  // Calculate Authoritative Deadline
  let deadlineIso = "";
  if (hackathon.timerMode === "global") {
    // Global Event Deadline
    deadlineIso = hackathon.globalEndTime;
  } else {
    // Individual Duration Timer
    const durationMinutes = hackathon.individualDurationMinutes || 360;
    const deadlineMs = nowMs + durationMinutes * 60 * 1000;
    deadlineIso = new Date(deadlineMs).toISOString();
  }

  let participation: HackathonParticipation;

  if (existing) {
    participation = {
      ...existing,
      startedAt: nowIso,
      deadlineAt: deadlineIso,
      status: "IN_PROGRESS",
    };
    const index = all.findIndex((p) => p.id === existing.id);
    all[index] = participation;
  } else {
    participation = {
      id: "part_" + Math.random().toString(36).slice(2, 10),
      hackathonId,
      participantType: payload.participantType,
      participantId: payload.participantId,
      participantName: payload.participantName,
      email: payload.email,
      rollNumber: payload.rollNumber,
      institution: payload.institution,
      teamMembersSummary: payload.teamMembersSummary,
      registeredAt: nowIso,
      startedAt: nowIso,
      deadlineAt: deadlineIso,
      status: "IN_PROGRESS",
    };
    all.push(participation);
  }

  saveParticipations(hackathonId, all);

  recordAuditLog(
    hackathonId,
    payload.participantName,
    "participant",
    "PARTICIPANT_STARTED",
    `${payload.participantType === "team" ? "Team" : "Participant"} "${payload.participantName}" officially started at ${nowIso}. Deadline: ${deadlineIso}`,
  );

  return { participation, serverTime: nowIso };
}

// ============================================================================
// TEAMS
// ============================================================================

export function listTeams(hackathonId: string): Team[] {
  if (teamsCache.has(hackathonId)) {
    return teamsCache.get(hackathonId)!;
  }
  ensureDirs();
  const filePath = path.join(DATA_DIR, `${hackathonId}_teams.json`);
  const list = readJsonFile<Team[]>(filePath, []);
  teamsCache.set(hackathonId, list);
  return list;
}

export function createTeam(
  hackathonId: string,
  teamData: {
    name: string;
    leaderId: string;
    leaderName: string;
    members: TeamMember[];
  },
): Team {
  const teams = listTeams(hackathonId);
  const team: Team = {
    id: "team_" + Math.random().toString(36).slice(2, 10),
    hackathonId,
    name: teamData.name,
    leaderId: teamData.leaderId,
    leaderName: teamData.leaderName,
    members: teamData.members,
    createdAt: new Date().toISOString(),
  };

  teams.push(team);
  teamsCache.set(hackathonId, teams);
  const filePath = path.join(DATA_DIR, `${hackathonId}_teams.json`);
  writeJsonFile(filePath, teams);

  recordAuditLog(
    hackathonId,
    teamData.leaderName,
    "participant",
    "TEAM_CREATED",
    `Team "${team.name}" created with ${team.members.length} members by leader "${teamData.leaderName}".`,
  );

  return team;
}

// ============================================================================
// SUBMISSIONS
// ============================================================================

export function listSubmissions(hackathonId: string): Submission[] {
  if (submissionsCache.has(hackathonId)) {
    return submissionsCache.get(hackathonId)!;
  }
  ensureDirs();
  const filePath = path.join(DATA_DIR, `${hackathonId}_submissions.json`);
  const list = readJsonFile<Submission[]>(filePath, []);
  submissionsCache.set(hackathonId, list);
  return list;
}

export function getSubmission(hackathonId: string, participationId: string): Submission | null {
  const subs = listSubmissions(hackathonId);
  return subs.find((s) => s.participationId === participationId) || null;
}

export function createOrUpdateSubmission(
  hackathonId: string,
  payload: {
    participationId: string;
    participantType: "individual" | "team";
    participantName: string;
    projectTitle: string;
    description: string;
    githubUrl: string;
    demoUrl?: string;
    additionalNotes?: string;
  },
): { submission: Submission; participation: HackathonParticipation } {
  const hackathon = getHackathon(hackathonId);
  if (!hackathon) throw new Error("Hackathon not found");

  const participations = listParticipations(hackathonId);
  const part = participations.find((p) => p.id === payload.participationId);
  if (!part) throw new Error("Participation record not found. Please start the hackathon first.");

  const nowMs = Date.now();
  const nowIso = new Date().toISOString();
  const deadlineMs = part.deadlineAt ? Date.parse(part.deadlineAt) : 0;
  const isAfterDeadline = deadlineMs > 0 && nowMs > deadlineMs;

  if (isAfterDeadline && hackathon.submissionPolicy === "lock_on_deadline") {
    throw new Error(
      "Submissions are locked for this hackathon as your official deadline has expired.",
    );
  }

  const lateBySeconds = isAfterDeadline ? Math.round((nowMs - deadlineMs) / 1000) : 0;
  const submissionStatus = isAfterDeadline ? "LATE" : "SUBMITTED";

  const allSubs = listSubmissions(hackathonId);
  const existingSub = allSubs.find((s) => s.participationId === payload.participationId);
  let sub: Submission;

  if (existingSub) {
    existingSub.projectTitle = payload.projectTitle;
    existingSub.description = payload.description;
    existingSub.githubUrl = payload.githubUrl;
    existingSub.demoUrl = payload.demoUrl;
    existingSub.additionalNotes = payload.additionalNotes;
    existingSub.submittedAt = nowIso;
    existingSub.status = submissionStatus;
    existingSub.lateBySeconds = lateBySeconds;
    sub = existingSub;
  } else {
    sub = {
      id: "sub_" + Math.random().toString(36).slice(2, 10),
      hackathonId,
      participationId: payload.participationId,
      participantType: payload.participantType,
      participantName: payload.participantName,
      projectTitle: payload.projectTitle,
      description: payload.description,
      githubUrl: payload.githubUrl,
      demoUrl: payload.demoUrl,
      additionalNotes: payload.additionalNotes,
      submittedAt: nowIso,
      deadlineAt: part.deadlineAt || nowIso,
      status: submissionStatus,
      lateBySeconds,
    };
    allSubs.push(sub);
  }

  submissionsCache.set(hackathonId, allSubs);
  writeJsonFile(path.join(DATA_DIR, `${hackathonId}_submissions.json`), allSubs);

  // Update participation status
  part.status = submissionStatus;
  part.submissionId = sub.id;
  saveParticipations(hackathonId, participations);

  recordAuditLog(
    hackathonId,
    payload.participantName,
    "participant",
    "SUBMISSION_RECORDED",
    `Submission recorded for "${payload.projectTitle}" by ${payload.participantName}. Status: ${submissionStatus} (${lateBySeconds}s late). GitHub: ${payload.githubUrl}`,
  );

  return { submission: sub, participation: part };
}

// ============================================================================
// LIVE STATISTICS & MONITORING
// ============================================================================

export function getHackathonStats(hackathonId: string): HackathonLiveStats {
  const participations = listParticipations(hackathonId);
  const teams = listTeams(hackathonId);

  let started = 0;
  let notStarted = 0;
  let inProgress = 0;
  let submitted = 0;
  let late = 0;
  let expired = 0;

  for (const p of participations) {
    if (p.startedAt) started++;
    else notStarted++;

    switch (p.status) {
      case "IN_PROGRESS":
        inProgress++;
        break;
      case "SUBMITTED":
        submitted++;
        break;
      case "LATE":
        late++;
        break;
      case "EXPIRED":
        expired++;
        break;
      case "NOT_STARTED":
        notStarted++;
        break;
    }
  }

  return {
    totalParticipants: participations.length,
    started,
    notStarted,
    inProgress,
    submitted,
    late,
    expired,
    teams: teams.length,
  };
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export function recordAuditLog(
  hackathonId: string,
  actorName: string,
  actorRole: string,
  action: string,
  details: string,
): void {
  ensureDirs();
  const all = getAuditLogs(hackathonId);
  const entry: AuditLogEntry = {
    id: "log_" + Math.random().toString(36).slice(2, 10),
    hackathonId,
    actorName,
    actorRole,
    action,
    details,
    timestamp: new Date().toISOString(),
  };

  all.unshift(entry);
  if (all.length > 500) all.length = 500; // Cap to 500 latest entries

  auditCache.set(hackathonId, all);
  writeJsonFile(path.join(DATA_DIR, `${hackathonId}_audit.json`), all);
}

export function getAuditLogs(hackathonId: string): AuditLogEntry[] {
  if (auditCache.has(hackathonId)) {
    return auditCache.get(hackathonId)!;
  }
  ensureDirs();
  const filePath = path.join(DATA_DIR, `${hackathonId}_audit.json`);
  const list = readJsonFile<AuditLogEntry[]>(filePath, []);
  auditCache.set(hackathonId, list);
  return list;
}

// ============================================================================
// FILE STORAGE (PROBLEM STATEMENT FILES)
// ============================================================================

export function saveUploadedProblemFile(
  hackathonId: string,
  originalFilename: string,
  mimeType: string,
  base64Data: string,
): ProblemOriginalFile {
  ensureDirs();
  const ext = path.extname(originalFilename) || "";
  const storedFilename = `${hackathonId}_${Date.now()}_${path.basename(originalFilename).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(FILES_DIR, storedFilename);

  // Strip possible base64 header (e.g. data:application/pdf;base64,...)
  const pureBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(pureBase64, "base64");
  fs.writeFileSync(filePath, buffer);

  let extractedTextPreview = "";
  if (ext.toLowerCase() === ".txt") {
    extractedTextPreview = buffer.toString("utf-8").slice(0, 1500);
  } else if (ext.toLowerCase() === ".xlsx" || ext.toLowerCase() === ".xls") {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheet = workbook.SheetNames[0];
      if (firstSheet) {
        const sheet = workbook.Sheets[firstSheet];
        if (sheet) {
          const csv = XLSX.utils.sheet_to_csv(sheet);
          extractedTextPreview = csv.slice(0, 1500);
        }
      }
    } catch (e) {
      console.warn("Could not preview excel content:", e);
    }
  }

  return {
    filename: originalFilename,
    storedFilename,
    fileType: mimeType || ext,
    size: buffer.length,
    uploadedAt: new Date().toISOString(),
    extractedTextPreview: extractedTextPreview || undefined,
  };
}

export function getUploadedProblemFile(storedFilename: string): {
  filePath: string;
  exists: boolean;
} {
  ensureDirs();
  const safeName = path.basename(storedFilename);
  const filePath = path.join(FILES_DIR, safeName);
  return {
    filePath,
    exists: fs.existsSync(filePath),
  };
}

// ============================================================================
// EXCEL EXPORT (SHEETJS XLSX GENERATOR)
// ============================================================================

export function generateExcelReport(hackathonId: string): Buffer {
  const hackathon = getHackathon(hackathonId);
  if (!hackathon) throw new Error("Hackathon not found");

  const participations = listParticipations(hackathonId);
  const teams = listTeams(hackathonId);
  const submissions = listSubmissions(hackathonId);
  const stats = getHackathonStats(hackathonId);

  const subMap = new Map(submissions.map((s) => [s.participationId, s]));

  // Sheet 1 — Participants
  const participantsData = participations.map((p) => {
    const s = subMap.get(p.id);
    return {
      "Participant ID": p.id,
      Name: p.participantName,
      Email: p.email || "N/A",
      "Roll Number": p.rollNumber || "N/A",
      Institution: p.institution || "N/A",
      "Participation Type": p.participantType === "team" ? "Team" : "Individual",
      "Team / Members": p.teamMembersSummary || "N/A",
      "Registration Time": p.registeredAt ? new Date(p.registeredAt).toLocaleString() : "N/A",
      "Start Time": p.startedAt ? new Date(p.startedAt).toLocaleString() : "Not Started",
      Deadline: p.deadlineAt ? new Date(p.deadlineAt).toLocaleString() : "N/A",
      Status: p.status,
      "Submitted At": s?.submittedAt ? new Date(s.submittedAt).toLocaleString() : "No Submission",
      "GitHub URL": s?.githubUrl || "N/A",
      "Project Title": s?.projectTitle || "N/A",
    };
  });

  // Sheet 2 — Teams
  const teamsData = teams.map((t) => {
    const membersStr = t.members.map((m) => `${m.name} (${m.email})`).join(", ");
    const part = participations.find((p) => p.participantId === t.id);
    const sub = part ? subMap.get(part.id) : undefined;
    return {
      "Team ID": t.id,
      "Team Name": t.name,
      Leader: t.leaderName,
      "Member Count": t.members.length,
      Members: membersStr,
      "Start Time": part?.startedAt ? new Date(part.startedAt).toLocaleString() : "Not Started",
      Status: part?.status || "NOT_STARTED",
      "Submission Status": sub ? sub.status : "No Submission",
      "GitHub URL": sub?.githubUrl || "N/A",
    };
  });

  // Sheet 3 — Submissions
  const submissionsData = submissions.map((s) => {
    return {
      "Submission ID": s.id,
      "Participant / Team": s.participantName,
      Type: s.participantType === "team" ? "Team" : "Individual",
      "Project Title": s.projectTitle,
      "GitHub URL": s.githubUrl,
      "Demo URL": s.demoUrl || "N/A",
      "Submitted At": new Date(s.submittedAt).toLocaleString(),
      Deadline: new Date(s.deadlineAt).toLocaleString(),
      Status: s.status,
      "Late By (Seconds)": s.lateBySeconds,
      "Late By (Minutes)": Math.round(s.lateBySeconds / 60),
    };
  });

  // Sheet 4 — Hackathon Summary
  const summaryData = [
    { Metric: "Hackathon Name", Value: hackathon.name },
    { Metric: "Status", Value: hackathon.status },
    { Metric: "Organizer", Value: hackathon.organizerName },
    { Metric: "Venue", Value: hackathon.venue },
    { Metric: "Start Date", Value: new Date(hackathon.startDate).toLocaleString() },
    { Metric: "End Date", Value: new Date(hackathon.endDate).toLocaleString() },
    {
      Metric: "Timer Mode",
      Value:
        hackathon.timerMode === "global"
          ? "Global Event Window"
          : `Individual Duration (${hackathon.individualDurationMinutes} mins)`,
    },
    { Metric: "Participation Type", Value: hackathon.participationType },
    { Metric: "Submission Policy", Value: hackathon.submissionPolicy },
    { Metric: "Total Participants / Registered", Value: stats.totalParticipants },
    { Metric: "Total Teams", Value: stats.teams },
    { Metric: "Officially Started", Value: stats.started },
    { Metric: "In Progress", Value: stats.inProgress },
    { Metric: "Successfully Submitted", Value: stats.submitted },
    { Metric: "Late Submissions", Value: stats.late },
    { Metric: "Expired Without Submitting", Value: stats.expired },
    { Metric: "Report Generated At", Value: new Date().toLocaleString() },
  ];

  // Create workbook with the 4 sheets
  const wb = XLSX.utils.book_new();

  const wsParticipants = XLSX.utils.json_to_sheet(
    participantsData.length ? participantsData : [{ Note: "No participants registered yet" }],
  );
  const wsTeams = XLSX.utils.json_to_sheet(
    teamsData.length ? teamsData : [{ Note: "No teams registered yet" }],
  );
  const wsSubmissions = XLSX.utils.json_to_sheet(
    submissionsData.length ? submissionsData : [{ Note: "No submissions recorded yet" }],
  );
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);

  XLSX.utils.book_append_sheet(wb, wsParticipants, "Participants");
  XLSX.utils.book_append_sheet(wb, wsTeams, "Teams");
  XLSX.utils.book_append_sheet(wb, wsSubmissions, "Submissions");
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
