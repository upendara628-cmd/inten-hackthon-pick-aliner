import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { UserProfile } from "./hackathon-types";

function resolveUsersFile(): string {
  const local = path.resolve(process.cwd(), "data");
  try {
    if (!fs.existsSync(local)) {
      fs.mkdirSync(local, { recursive: true });
    }
    const testFile = path.join(local, `.test_${Date.now()}`);
    fs.writeFileSync(testFile, "");
    fs.unlinkSync(testFile);
    return path.join(local, "users.json");
  } catch {
    const tmp = path.resolve(os.tmpdir(), "framewise-data");
    try {
      if (!fs.existsSync(tmp)) {
        fs.mkdirSync(tmp, { recursive: true });
      }
    } catch {}
    return path.join(tmp, "users.json");
  }
}

const USERS_FILE = resolveUsersFile();

const defaultUsers: UserProfile[] = [
  {
    id: "org_admin",
    email: "organizer@event.com",
    name: "Event Organizer Sir",
    role: "organizer",
    institution: "Tech University",
    token: "tok_organizer_master",
  },
  {
    id: "part_demo_1",
    email: "participant@student.edu",
    name: "Alex Rivera",
    role: "participant",
    rollNumber: "CS-2026-042",
    institution: "Institute of Technology",
    phone: "+91 98765 43210",
    token: "tok_participant_demo",
  },
];

let usersCache: UserProfile[] = [...defaultUsers];

function loadUsers(): UserProfile[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      const parsed = JSON.parse(data) as UserProfile[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        usersCache = parsed;
        return usersCache;
      }
    }
  } catch (err) {}

  // Check bundled original data
  try {
    const origPath = path.resolve(process.cwd(), "data", "users.json");
    if (origPath !== USERS_FILE && fs.existsSync(origPath)) {
      const data = fs.readFileSync(origPath, "utf-8");
      const parsed = JSON.parse(data) as UserProfile[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        usersCache = parsed;
        return usersCache;
      }
    }
  } catch {}

  return usersCache;
}

function saveUsers(users: UserProfile[]) {
  try {
    usersCache = users;
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    // In-memory cache handles user state when filesystem is read-only
  }
}

export function authenticateToken(token?: string | null): UserProfile | null {
  if (!token) return null;
  const users = loadUsers();
  return users.find((u) => u.token === token) || null;
}

export function loginOrRegister(payload: {
  email: string;
  name?: string | undefined;
  role?: ("organizer" | "participant") | undefined;
  rollNumber?: string | undefined;
  institution?: string | undefined;
  phone?: string | undefined;
}): UserProfile {
  const users = loadUsers();
  const normalizedEmail = payload.email.trim().toLowerCase();
  const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  let user: UserProfile;

  if (existingUser) {
    user = existingUser;
    // Explicitly update role if provided in the payload
    if (payload.role) {
      user.role = payload.role;
    }
    if (payload.name) user.name = payload.name;
    if (payload.rollNumber !== undefined) user.rollNumber = payload.rollNumber;
    if (payload.institution !== undefined) user.institution = payload.institution;
    if (payload.phone !== undefined) user.phone = payload.phone;

    // Preserve master tokens for predefined demo users
    if (normalizedEmail === "organizer@event.com") {
      user.role = "organizer";
      user.token = "tok_organizer_master";
    } else if (
      normalizedEmail === "participant@student.edu" ||
      normalizedEmail === "alex.rivera@student.edu"
    ) {
      user.role = "participant";
      user.token = "tok_participant_demo";
    } else if (!user.token) {
      user.token = "tok_" + Math.random().toString(36).slice(2, 12);
    }
  } else {
    const isDemoOrg = normalizedEmail === "organizer@event.com";
    const isDemoPart =
      normalizedEmail === "participant@student.edu" || normalizedEmail === "alex.rivera@student.edu";

    user = {
      id: isDemoOrg ? "org_admin" : isDemoPart ? "part_demo_1" : "usr_" + Math.random().toString(36).slice(2, 10),
      email: payload.email.trim(),
      name: payload.name || payload.email.split("@")[0] || "User",
      role: isDemoOrg ? "organizer" : isDemoPart ? "participant" : payload.role || "participant",
      rollNumber: payload.rollNumber,
      institution: payload.institution,
      phone: payload.phone,
      token: isDemoOrg
        ? "tok_organizer_master"
        : isDemoPart
          ? "tok_participant_demo"
          : "tok_" + Math.random().toString(36).slice(2, 12),
    };
    users.push(user);
  }

  saveUsers(users);
  return user;
}

export function updateUserProfile(id: string, updates: Partial<UserProfile>): UserProfile | null {
  const users = loadUsers();
  const user = users.find((u) => u.id === id);
  if (!user) return null;

  Object.assign(user, updates);
  saveUsers(users);
  return user;
}
