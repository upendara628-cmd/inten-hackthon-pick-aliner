import React, { createContext, useContext, useEffect, useState } from "react";
import type { UserProfile } from "./hackathon-types";
import {
  apiGetMe,
  apiLogin,
  apiUpdateProfile,
  clearApiAuthToken,
  setApiAuthToken,
} from "./hackathon-api";
import { toast } from "sonner";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isOrganizer: boolean;
  login: (
    payload: {
      email: string;
      role: "organizer" | "participant";
      name?: string;
      rollNumber?: string;
      institution?: string;
      phone?: string;
    },
    options?: { silent?: boolean },
  ) => Promise<UserProfile>;
  loginAsDemo: (role: "organizer" | "participant") => Promise<UserProfile>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  switchRole: (role: "organizer" | "participant") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "framewise_user_profile";

function clearParticipantCaches() {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("hackathon_timer_") ||
          key.startsWith("part_") ||
          key.startsWith("timer_skew_") ||
          key.includes("participation") ||
          key.includes("draft_submission"))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Synchronously initialize session from localStorage
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: UserProfile = JSON.parse(stored);
        setUser(parsed);
        if (parsed.token) {
          setApiAuthToken(parsed.token);
        }
      }
    } catch {}

    // 2. Validate session with server
    apiGetMe()
      .then((serverUser) => {
        if (serverUser) {
          setUser(serverUser);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverUser));
          if (serverUser.token) {
            setApiAuthToken(serverUser.token);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (
    payload: {
      email: string;
      role: "organizer" | "participant";
      name?: string;
      rollNumber?: string;
      institution?: string;
      phone?: string;
    },
    options?: { silent?: boolean },
  ): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const u = await apiLogin(payload);
      setUser(u);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(u));
      if (u.token) {
        setApiAuthToken(u.token);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("framewise:auth-changed", { detail: u }));
      }

      if (!options?.silent) {
        toast.success(`Logged in as ${u.name} (${u.role})`);
      }
      return u;
    } catch (err: any) {
      if (!options?.silent) {
        toast.error(err.message || "Login failed");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async (targetRole: "organizer" | "participant"): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      // Clear previous active participant timer and participation caches
      clearParticipantCaches();

      const payload =
        targetRole === "organizer"
          ? {
              email: "organizer@event.com",
              name: "Event Organizer Sir",
              role: "organizer" as const,
              institution: "Tech University",
            }
          : {
              email: "participant@student.edu",
              name: "Alex Rivera",
              role: "participant" as const,
              rollNumber: "CS-2026-042",
              institution: "Institute of Technology",
              phone: "+91 98765 43210",
            };

      const u = await apiLogin(payload);
      setUser(u);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(u));
      if (u.token) {
        setApiAuthToken(u.token);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("framewise:auth-changed", { detail: u }));
      }

      toast.success(
        targetRole === "organizer"
          ? "Switched to Demo Organizer mode"
          : "Switched to Demo Participant mode",
      );
      return u;
    } catch (err: any) {
      toast.error(err.message || "Failed to switch demo role");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    clearParticipantCaches();
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    clearApiAuthToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("framewise:auth-changed", { detail: null }));
    }
    toast.info("Logged out successfully");
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = await apiUpdateProfile(updates);
    setUser(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    if (updated.token) {
      setApiAuthToken(updated.token);
    }
    toast.success("Profile updated");
    return updated;
  };

  const switchRole = async (role: "organizer" | "participant") => {
    await loginAsDemo(role);
  };

  const isOrganizer = user?.role === "organizer";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isOrganizer,
        login,
        loginAsDemo,
        logout,
        updateProfile,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
