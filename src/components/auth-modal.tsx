import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
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

export function AuthModal({
  open,
  onOpenChange,
  defaultRole = "participant",
  onSuccess,
}: AuthModalProps) {
  const { login, loginAsDemo, isLoading } = useAuth();
  const [role, setRole] = useState<"organizer" | "participant">(defaultRole);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [institution, setInstitution] = useState("");
  const [phone, setPhone] = useState("");

  const handleQuickPreset = async (presetRole: "organizer" | "participant") => {
    try {
      await loginAsDemo(presetRole);
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

        {/* Quick Demo Buttons */}
        <div className="flex items-center justify-between gap-2 border-b border-purple-100 pb-3 pt-1">
          <span className="text-[11px] font-semibold text-slate-500">Quick sign-in:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickPreset("organizer")}
              className="text-[11px] font-bold text-[#6C2BFF] hover:underline"
            >
              Demo Organizer
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => handleQuickPreset("participant")}
              className="text-[11px] font-bold text-[#EA580C] hover:underline"
            >
              Demo Participant
            </button>
          </div>
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
