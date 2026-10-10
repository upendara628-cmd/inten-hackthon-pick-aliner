import fs from "node:fs";
import path from "node:path";
import type { UserProfile } from "./hackathon-types";

const USERS_FILE = path.resolve(process.cwd(), "data", "users.json");

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

let usersCache: UserProfile[] | null = null;

function loadUsers(): UserProfile[] {
  if (usersCache) return usersCache;
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      usersCache = JSON.parse(data) as UserProfile[];
      return usersCache;
    }
  } catch (err) {
    console.error("Error loading users:", err);
  }
  usersCache = [...defaultUsers];
  saveUsers(usersCache);
  return usersCache;
}

function saveUsers(users: UserProfile[]) {
  try {
    usersCache = users;
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving users:", err);
  }
}

export function authenticateToken(token?: string | null): UserProfile | null {
  if (!token) return null;
  const users = loadUsers();
  return users.find((u) => u.token === token) || null;
}

export function loginOrRegister(payload: {
  email: string;
  name?: string;
  role?: "organizer" | "participant";
  rollNumber?: string;
  institution?: string;
  phone?: string;
}): UserProfile {
  const users = loadUsers();
  const normalizedEmail = payload.email.trim().toLowerCase();
  let user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (user) {
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
      name: payload.name || payload.email.split("@")[0],
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
