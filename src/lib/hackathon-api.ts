import type {
  AuditLogEntry,
  Hackathon,
  HackathonLiveStats,
  HackathonParticipation,
  HackathonStatus,
  ProblemOriginalFile,
  ServerTimeResponse,
  Submission,
  Team,
  TeamMember,
  UserProfile,
} from "./hackathon-types";

let activeMemoryToken: string | null = null;

export function getActiveAuthToken(): string | null {
  if (activeMemoryToken) return activeMemoryToken;
  if (typeof window !== "undefined") {
    return localStorage.getItem("framewise_auth_token");
  }
  return null;
}

export function setApiAuthToken(token: string | null): void {
  activeMemoryToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("framewise_auth_token", token);
      document.cookie = `framewise_auth_token=${token}; path=/; SameSite=Lax`;
    } else {
      localStorage.removeItem("framewise_auth_token");
      document.cookie = `framewise_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
  }
}

export function clearApiAuthToken(): void {
  setApiAuthToken(null);
}

function getAuthHeader(): Record<string, string> {
  const token = getActiveAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `HTTP error ${res.status}`;
    try {
      const err = await res.json();
      msg = err.error || err.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function fetchServerTime(): Promise<ServerTimeResponse> {
  const res = await fetch("/api/server-time");
  return handleResponse<ServerTimeResponse>(res);
}

export async function apiLogin(payload: {
  email: string;
  name?: string;
  role?: "organizer" | "participant";
  rollNumber?: string;
  institution?: string;
  phone?: string;
}): Promise<UserProfile> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ success: boolean; user: UserProfile }>(res);
  if (data.user?.token) {
    setApiAuthToken(data.user.token);
  }
  return data.user;
}

export async function apiGetMe(): Promise<UserProfile | null> {
  try {
    const res = await fetch("/api/auth/me", {
      headers: { ...getAuthHeader() },
    });
    if (res.status === 401) return null;
    const data = await handleResponse<{ user: UserProfile }>(res);
    return data.user;
  } catch {
    return null;
  }
}

export async function apiUpdateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch("/api/auth/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(updates),
  });
  const data = await handleResponse<{ success: boolean; user: UserProfile }>(res);
  return data.user;
}

export async function apiListHackathons(includeDrafts = false): Promise<Hackathon[]> {
  const url = includeDrafts ? "/api/hackathons?includeDrafts=true" : "/api/hackathons";
  const res = await fetch(url, {
    headers: { ...getAuthHeader() },
  });
  return handleResponse<Hackathon[]>(res);
}

export async function apiGetHackathon(id: string): Promise<Hackathon> {
  const res = await fetch(`/api/hackathons/${id}`, {
    headers: { ...getAuthHeader() },
  });
  return handleResponse<Hackathon>(res);
}

export async function apiSaveHackathon(hackathon: Hackathon): Promise<Hackathon> {
  const res = await fetch(`/api/hackathons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(hackathon),
  });
  const data = await handleResponse<{ success: boolean; hackathon: Hackathon }>(res);
  return data.hackathon;
}

export async function apiUpdateHackathonStatus(
  id: string,
  status: HackathonStatus,
): Promise<Hackathon> {
  const res = await fetch(`/api/hackathons/${id}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ status }),
  });
  const data = await handleResponse<{ success: boolean; hackathon: Hackathon }>(res);
  return data.hackathon;
}

export async function apiArchiveHackathon(id: string): Promise<void> {
  const res = await fetch(`/api/hackathons/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  await handleResponse<{ success: boolean }>(res);
}

export async function apiUploadProblemFile(
  hackathonId: string,
  file: File,
): Promise<ProblemOriginalFile> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch(`/api/hackathons/${hackathonId}/upload-problem-file`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      filename: file.name,
      fileType: file.type,
      base64,
    }),
  });

  const data = await handleResponse<{ success: boolean; fileMeta: ProblemOriginalFile }>(res);
  return data.fileMeta;
}

export async function apiListParticipations(
  hackathonId: string,
): Promise<HackathonParticipation[]> {
  const res = await fetch(`/api/hackathons/${hackathonId}/participations`, {
    headers: { ...getAuthHeader() },
  });
  return handleResponse<HackathonParticipation[]>(res);
}

export async function apiStartParticipation(
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
): Promise<{ participation: HackathonParticipation; serverTime: string }> {
  const res = await fetch(`/api/hackathons/${hackathonId}/participations/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<{
    success: boolean;
    participation: HackathonParticipation;
    serverTime: string;
  }>(res);
}

export async function apiListTeams(hackathonId: string): Promise<Team[]> {
  const res = await fetch(`/api/hackathons/${hackathonId}/teams`, {
    headers: { ...getAuthHeader() },
  });
  return handleResponse<Team[]>(res);
}

export async function apiCreateTeam(
  hackathonId: string,
  teamData: {
    name: string;
    leaderId: string;
    leaderName: string;
    members: TeamMember[];
  },
): Promise<Team> {
  const res = await fetch(`/api/hackathons/${hackathonId}/teams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(teamData),
  });
  const data = await handleResponse<{ success: boolean; team: Team }>(res);
  return data.team;
}

export async function apiListSubmissions(hackathonId: string): Promise<Submission[]> {
  const res = await fetch(`/api/hackathons/${hackathonId}/submissions`, {
    headers: { ...getAuthHeader() },
  });
  return handleResponse<Submission[]>(res);
}

export async function apiSubmitProject(
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
): Promise<{ submission: Submission; participation: HackathonParticipation }> {
  const res = await fetch(`/api/hackathons/${hackathonId}/submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<{
    success: boolean;
    submission: Submission;
    participation: HackathonParticipation;
  }>(res);
}

export async function apiGetHackathonStats(hackathonId: string): Promise<HackathonLiveStats> {
  const res = await fetch(`/api/hackathons/${hackathonId}/stats`, {
    headers: { ...getAuthHeader() },
  });
  return handleResponse<HackathonLiveStats>(res);
}

export async function apiGetAuditLogs(hackathonId: string): Promise<AuditLogEntry[]> {
  const res = await fetch(`/api/hackathons/${hackathonId}/audit`, {
    headers: { ...getAuthHeader() },
  });
  return handleResponse<AuditLogEntry[]>(res);
}

export function getExcelExportUrl(hackathonId: string): string {
  return `/api/hackathons/${hackathonId}/export`;
}
