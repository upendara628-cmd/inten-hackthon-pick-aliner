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
    id: "org_admin_primary",
    email: "admin@gmail.com",
    name: "System Administrator",
    role: "organizer",
    institution: "Framewise Admin",
    token: "tok_organizer_master",
  },
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

export function parseGoogleJwt(credential: string): {
  email: string;
  name: string;
  picture?: string | undefined;
  sub: string;
} | null {
  try {
    const parts = credential.split(".");
    if (parts.length < 2 || !parts[1]) {
      if (credential.startsWith("mock_") || credential.startsWith("demo_")) {
        return {
          email: "google.user@example.com",
          name: "Google Demo User",
          picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
          sub: "mock_google_sub_123",
        };
      }
      return null;
    }
    const base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    const parsed = JSON.parse(jsonPayload);
    if (!parsed.email) return null;
    return {
      email: String(parsed.email).toLowerCase(),
      name: parsed.name || parsed.given_name || String(parsed.email).split("@")[0] || "Google User",
      picture: parsed.picture || undefined,
      sub: parsed.sub || "",
    };
  } catch (err) {
    console.error("Failed to parse Google JWT credential:", err);
    return null;
  }
}

export function loginOrRegister(payload: {
  email: string;
  password?: string | undefined;
  name?: string | undefined;
  role?: ("organizer" | "participant") | undefined;
  rollNumber?: string | undefined;
  institution?: string | undefined;
  phone?: string | undefined;
  picture?: string | undefined;
}): UserProfile {
  const users = loadUsers();
  const normalizedEmail = payload.email.trim().toLowerCase();

  // If attempting organizer login or accessing as admin@gmail.com
  const isOrganizerAttempt =
    payload.role === "organizer" || normalizedEmail === "admin@gmail.com";

  if (isOrganizerAttempt) {
    const isAuthorizedAdmin =
      normalizedEmail === "admin@gmail.com" || normalizedEmail === "organizer@event.com";

    if (!isAuthorizedAdmin) {
      throw new Error(
        "Unauthorized admin account. Only admin@gmail.com is permitted as administrator. No other logins can access or be added to the admin console.",
      );
    }

    if (normalizedEmail === "admin@gmail.com") {
      if (payload.password !== "pi2000") {
        throw new Error(
          "Invalid administrator password. Please enter the correct password (pi2000).",
        );
      }
    }
  }

  const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  let user: UserProfile;

  if (existingUser) {
    user = existingUser;
    // Explicitly update role if provided in the payload and authorized
    if (normalizedEmail === "admin@gmail.com" || normalizedEmail === "organizer@event.com") {
      user.role = "organizer";
      user.token = "tok_organizer_master";
    } else if (payload.role) {
      user.role = payload.role;
    }

    if (payload.name) user.name = payload.name;
    if (payload.rollNumber !== undefined) user.rollNumber = payload.rollNumber;
    if (payload.institution !== undefined) user.institution = payload.institution;
    if (payload.phone !== undefined) user.phone = payload.phone;
    if (payload.picture !== undefined) user.picture = payload.picture;

    // Preserve master tokens for predefined users
    if (normalizedEmail === "admin@gmail.com") {
      user.id = "org_admin_primary";
      user.role = "organizer";
      user.token = "tok_organizer_master";
    } else if (normalizedEmail === "organizer@event.com") {
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
    const isPrimaryAdmin = normalizedEmail === "admin@gmail.com";
    const isDemoOrg = normalizedEmail === "organizer@event.com";
    const isDemoPart =
      normalizedEmail === "participant@student.edu" || normalizedEmail === "alex.rivera@student.edu";

    user = {
      id: isPrimaryAdmin
        ? "org_admin_primary"
        : isDemoOrg
          ? "org_admin"
          : isDemoPart
            ? "part_demo_1"
            : "usr_" + Math.random().toString(36).slice(2, 10),
      email: payload.email.trim(),
      name:
        payload.name ||
        (isPrimaryAdmin
          ? "System Administrator"
          : isDemoOrg
            ? "Event Organizer Sir"
            : payload.email.split("@")[0] || "User"),
      role: isPrimaryAdmin || isDemoOrg ? "organizer" : payload.role || "participant",
      rollNumber: payload.rollNumber,
      institution: payload.institution || (isPrimaryAdmin ? "Framewise Admin" : undefined),
      phone: payload.phone,
      picture: payload.picture,
      token:
        isPrimaryAdmin || isDemoOrg
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
