import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { GoogleLogin } from "@react-oauth/google";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, UserCheck, Sparkles, Building, Hash, Phone, Mail } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRole?: "organizer" | "participant";
  onSuccess?: () => void;
}

const googleClientId =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_GOOGLE_CLIENT_ID"]) ||
  "";
const isRealGoogleConfigured = Boolean(
  googleClientId &&
    !googleClientId.includes("default") &&
    !googleClientId.includes("example"),
);

export function AuthModal({
  open,
  onOpenChange,
  defaultRole = "participant",
  onSuccess,
}: AuthModalProps) {
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [role, setRole] = useState<"organizer" | "participant">(defaultRole);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [institution, setInstitution] = useState("");
  const [phone, setPhone] = useState("");

  const handleGoogleSuccess = async (credential: string) => {
    try {
      await loginWithGoogle({
        credential,
        role,
        rollNumber: role === "participant" ? rollNumber : undefined,
        institution: role === "participant" ? institution : undefined,
        phone: role === "participant" ? phone : undefined,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    await login({
      email,
      name: name || email.split("@")[0],
      role,
      rollNumber,
      institution,
      phone,
    });
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-purple-100 shadow-2xl rounded-3xl p-6 font-['Poppins',sans-serif]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6C2BFF] to-[#A855F7] text-white shadow-md shadow-purple-500/25">
            {role === "organizer" ? (
              <ShieldCheck className="h-6 w-6" />
            ) : (
              <UserCheck className="h-6 w-6" />
            )}
          </div>
          <DialogTitle className="text-center text-xl font-extrabold text-slate-900 mt-2">
            {role === "organizer" ? "Organizer Portal Login" : "Participant Verification"}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-slate-500">
            Sign in to access hackathons, live event timers, and official submissions.
          </DialogDescription>
        </DialogHeader>

        {/* Role toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-purple-50/70 p-1.5 mt-2 border border-purple-100">
          <button
            type="button"
            onClick={() => setRole("organizer")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              role === "organizer"
                ? "bg-[#6C2BFF] text-white shadow-sm shadow-purple-500/20"
                : "text-slate-600 hover:text-[#6C2BFF]"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Organizer / Admin</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("participant")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              role === "participant"
                ? "bg-[#6C2BFF] text-white shadow-sm shadow-purple-500/20"
                : "text-slate-600 hover:text-[#6C2BFF]"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Participant</span>
          </button>
        </div>

        {/* Google Sign-in Section */}
        <div className="mt-3">
          {isRealGoogleConfigured ? (
            <div className="flex w-full justify-center">
              <GoogleLogin
                onSuccess={(cred) => {
                  if (cred.credential) {
                    handleGoogleSuccess(cred.credential);
                  }
                }}
                onError={() => {
                  console.error("Google Login failed");
                }}
                shape="pill"
                size="large"
                text="signin_with"
                width="100%"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleGoogleSuccess("demo_google_token")}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/80 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-[#6C2BFF]/30 transition-all group"
              >
                <svg className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
                <span className="ml-auto text-[10px] font-bold text-[#6C2BFF] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  One-Click
                </span>
              </button>
              <p className="text-[10px] text-center text-slate-400">
                Tip: Set <code className="font-mono text-purple-600 bg-purple-50 px-1 py-0.5 rounded text-[9px]">VITE_GOOGLE_CLIENT_ID</code> in .env for live Google OAuth
              </p>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="relative my-3 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-purple-100" />
          </div>
          <span className="relative bg-white px-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Or continue with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div>
            <Label className="text-xs font-semibold text-slate-700">Email Address *</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="email"
                required
                placeholder={role === "organizer" ? "sir@event.com" : "student@college.edu"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl border-purple-200 focus:border-[#6C2BFF]"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">Full Name</Label>
            <Input
              type="text"
              placeholder={
                role === "organizer" ? "Organizer Name / Designation" : "Participant Full Name"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-xs rounded-xl border-purple-200 mt-1"
            />
          </div>

          {role === "participant" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Roll / ID Number</Label>
                  <div className="relative mt-1">
                    <Hash className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="e.g. CS2026-042"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="pl-8 h-9 text-xs rounded-xl border-purple-200"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Phone</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="+91 98765..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-8 h-9 text-xs rounded-xl border-purple-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  College / Institution
                </Label>
                <div className="relative mt-1">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Institute / Organization Name"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl border-purple-200"
                  />
                </div>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full mt-2 rounded-xl bg-gradient-to-r from-[#6C2BFF] to-[#7C3AED] hover:from-[#581cdb] hover:to-[#6d28d9] text-white font-bold text-xs py-2 shadow-md shadow-purple-500/25"
          >
            {isLoading
              ? "Signing in..."
              : `Continue as ${role === "organizer" ? "Organizer" : "Participant"}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
