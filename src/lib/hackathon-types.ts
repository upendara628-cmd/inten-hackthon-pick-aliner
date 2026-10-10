export type ParticipationType = "individual" | "team" | "both";
export type TimerMode = "global" | "individual";
export type SubmissionPolicy = "lock_on_deadline" | "allow_late";
export type AccessType = "public" | "private";
export type HackathonStatus = "DRAFT" | "PUBLISHED" | "UPCOMING" | "LIVE" | "ENDED" | "ARCHIVED";

export type ParticipantProgressStatus =
  "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "LATE" | "EXPIRED" | "DISQUALIFIED" | "CLOSED";

export interface ProblemOriginalFile {
  filename: string;
  storedFilename: string;
  fileType: string;
  size: number;
  uploadedAt: string;
  extractedTextPreview?: string;
}

export interface ProblemStatement {
  title: string;
  content: string;
  objective?: string;
  requirements?: string;
  constraints?: string;
  expectedOutput?: string;
  evaluationCriteria?: string;
  additionalInstructions?: string;
  originalFile?: ProblemOriginalFile;
}

export interface Hackathon {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  organizerName: string;
  organizerId: string;
  venue: string; // e.g. "Main Auditorium" or "Online"
  startDate: string; // ISO
  endDate: string; // ISO
  registrationStart?: string;
  registrationEnd?: string;
  participationType: ParticipationType;
  minTeamSize: number;
  maxTeamSize: number;
  teamRules?: string;
  timerMode: TimerMode;
  globalStartTime: string; // ISO
  globalEndTime: string; // ISO
  individualDurationMinutes: number; // e.g. 360 = 6 hours
  submissionPolicy: SubmissionPolicy;
  accessType: AccessType;
  status: HackathonStatus;
  problemStatement: ProblemStatement;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "organizer" | "participant";
  rollNumber?: string;
  institution?: string;
  phone?: string;
  token?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
}

export interface Team {
  id: string;
  hackathonId: string;
  name: string;
  leaderId: string;
  leaderName: string;
  members: TeamMember[];
  createdAt: string;
}

export interface HackathonParticipation {
  id: string;
  hackathonId: string;
  participantType: "individual" | "team";
  participantId: string; // User ID or Team ID
  participantName: string;
  email?: string;
  rollNumber?: string;
  institution?: string;
  teamMembersSummary?: string;
  registeredAt: string;
  startedAt?: string; // Authoritative server timestamp (ISO)
  deadlineAt?: string; // Authoritative server timestamp (ISO)
  status: ParticipantProgressStatus;
  submissionId?: string;
}

export interface Submission {
  id: string;
  hackathonId: string;
  participationId: string;
  participantType: "individual" | "team";
  participantName: string;
  projectTitle: string;
  description: string;
  githubUrl: string;
  demoUrl?: string;
  additionalNotes?: string;
  submittedAt: string;
  deadlineAt: string;
  status: "SUBMITTED" | "LATE";
  lateBySeconds: number;
}

export interface AuditLogEntry {
  id: string;
  hackathonId: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface HackathonLiveStats {
  totalParticipants: number;
  started: number;
  notStarted: number;
  inProgress: number;
  submitted: number;
  late: number;
  expired: number;
  teams: number;
}

export interface ServerTimeResponse {
  serverTime: string; // ISO
  timestamp: number;
}
