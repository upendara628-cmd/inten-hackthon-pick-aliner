import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, ShieldAlert, Lock, KeyRound, Mail, Loader2, Award } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "./site-header";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isOrganizer, isLoading, login } = useAuth();
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
        <SiteHeader />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#6C2BFF]" />
          <span className="text-sm font-semibold text-slate-500">
            Verifying administrator credentials…
          </span>
        </div>
      </div>
    );
  }

  // If logged in and has organizer/admin role, render children
  if (user && isOrganizer) {
    return <>{children}</>;
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoggingIn(true);
    try {
      await login({
        email: email.trim(),
        password: password.trim(),
        role: "organizer",
        name: "System Administrator",
      });
    } catch {
      // toast is already handled by login
    } finally {
      setLoggingIn(false);
    }
  };

  const handleFillCredentials = () => {
    setEmail("admin@gmail.com");
    setPassword("pi2000");
  };

  // Unauthenticated or participant state
  return (
    <div className="min-h-screen bg-studlyf-ambient font-['Poppins',sans-serif] text-slate-800">
      <SiteHeader />
      <main className="mx-auto max-w-md px-5 py-14">
        <div className="rounded-3xl border border-purple-100 bg-white p-7 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6C2BFF] to-[#A855F7] text-white shadow-md shadow-purple-500/25 mb-4">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#6C2BFF]">
              <Lock className="h-3 w-3" />
              <span>Admin Authentication Required</span>
            </span>
            <h1 className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
              Administrator Console
            </h1>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Google login is disabled for administrators. Only the authorized administrator (
              <strong className="text-purple-700">admin@gmail.com</strong>) can log in with their
              master password.
            </p>
          </div>

          {user && !isOrganizer && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                Currently signed in as <strong className="font-bold">{user.email}</strong> (Participant).
                Please sign in with administrator credentials below.
              </div>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="mt-5 space-y-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Admin Email Address *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  required
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl border-purple-200 focus:border-[#6C2BFF]"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Admin Password *</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  required
                  placeholder="Enter password (pi2000)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl border-purple-200 focus:border-[#6C2BFF]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleFillCredentials}
                className="text-[11px] font-semibold text-[#6C2BFF] hover:underline flex items-center gap-1"
              >
                <KeyRound className="h-3 w-3" />
                <span>Fill Admin Credentials</span>
              </button>
              <span className="text-[10px] text-slate-400">Normal login only</span>
            </div>

            <Button
              type="submit"
              disabled={loggingIn || !email.trim() || !password.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-[#6C2BFF] to-[#7C3AED] hover:from-[#581cdb] hover:to-[#6d28d9] text-white font-bold text-xs py-2.5 shadow-md shadow-purple-500/25 mt-2"
            >
              {loggingIn ? "Signing in..." : "Sign In to Admin Portal"}
            </Button>
          </form>

          <div className="mt-5 text-center border-t border-purple-100 pt-4">
            <Link
              to="/hackathons"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#6C2BFF]"
            >
              <Award className="h-3.5 w-3.5 text-[#EA580C]" />
              <span>Back to Public Hackathons</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
