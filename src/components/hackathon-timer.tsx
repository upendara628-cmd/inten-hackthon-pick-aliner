import { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle2, Flame } from "lucide-react";

interface HackathonTimerProps {
  deadlineAt?: string | undefined;
  startedAt?: string | undefined;
  serverTimeSkewMs?: number | undefined; // Difference between server time and local time
  status?: string | undefined;
  timerMode?: ("global" | "individual") | undefined;
  onExpire?: (() => void) | undefined;
  className?: string | undefined;
}

export function HackathonTimer({
  deadlineAt,
  startedAt,
  serverTimeSkewMs = 0,
  status = "IN_PROGRESS",
  timerMode = "individual",
  onExpire,
  className = "",
}: HackathonTimerProps) {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(() => {
    if (!deadlineAt) return 0;
    const deadline = Date.parse(deadlineAt);
    const now = Date.now() + serverTimeSkewMs;
    return Math.max(0, deadline - now);
  });

  useEffect(() => {
    if (!deadlineAt || status === "SUBMITTED" || status === "LATE" || status === "CLOSED") {
      return;
    }

    const interval = setInterval(() => {
      const deadline = Date.parse(deadlineAt);
      const authoritativeNow = Date.now() + serverTimeSkewMs;
      const remaining = deadline - authoritativeNow;

      if (remaining <= 0) {
        setTimeLeftMs(0);
        clearInterval(interval);
        onExpire?.();
      } else {
        setTimeLeftMs(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineAt, serverTimeSkewMs, status, onExpire]);

  if (status === "SUBMITTED") {
    return (
      <div
        className={`rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-center ${className}`}
      >
        <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold text-sm">
          <CheckCircle2 className="h-5 w-5" />
          <span>OFFICIALLY SUBMITTED</span>
        </div>
        <p className="text-xs text-emerald-600 mt-1">Your project repository has been logged.</p>
      </div>
    );
  }

  if (status === "LATE") {
    return (
      <div
        className={`rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-center ${className}`}
      >
        <div className="flex items-center justify-center gap-2 text-amber-800 font-bold text-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <span>LATE SUBMISSION RECORDED</span>
        </div>
        <p className="text-xs text-amber-700 mt-1">Submitted after the official deadline.</p>
      </div>
    );
  }

  if (status === "EXPIRED" || (timeLeftMs <= 0 && startedAt)) {
    return (
      <div
        className={`rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-center ${className}`}
      >
        <div className="flex items-center justify-center gap-2 text-rose-700 font-bold text-sm">
          <AlertTriangle className="h-5 w-5" />
          <span>TIME EXPIRED</span>
        </div>
        <p className="text-xs text-rose-600 mt-1">Official time limit has elapsed.</p>
      </div>
    );
  }

  if (!startedAt || !deadlineAt) {
    return (
      <div
        className={`rounded-2xl border border-purple-200 bg-purple-50/60 p-4 text-center ${className}`}
      >
        <div className="flex items-center justify-center gap-2 text-[#6C2BFF] font-bold text-sm">
          <Clock className="h-5 w-5" />
          <span>NOT STARTED YET</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {timerMode === "global"
            ? "Global Event Window countdown will begin on official start."
            : "Your personal countdown timer starts the moment you confirm Start."}
        </p>
      </div>
    );
  }

  // Calculate format
  const totalSeconds = Math.max(0, Math.floor(timeLeftMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const isEndingSoon = hours === 0 && minutes < 30; // Under 30 minutes

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition-all duration-300 p-6 ${
        isEndingSoon
          ? "border-orange-300 bg-gradient-to-br from-orange-50/90 via-amber-50/70 to-red-50/80 shadow-lg shadow-orange-500/10"
          : "border-purple-200/90 bg-gradient-to-br from-white via-purple-50/40 to-indigo-50/40 shadow-xl shadow-purple-500/10"
      } ${className}`}
    >
      {/* Top Banner Status */}
      <div className="flex items-center justify-between border-b border-purple-100/80 pb-3">
        <div className="flex items-center gap-2">
          {isEndingSoon ? (
            <Flame className="h-4 w-4 text-[#EA580C] animate-pulse" />
          ) : (
            <Clock className="h-4 w-4 text-[#6C2BFF]" />
          )}
          <span
            className={`text-xs font-extrabold uppercase tracking-widest ${
              isEndingSoon ? "text-[#EA580C]" : "text-[#6C2BFF]"
            }`}
          >
            {isEndingSoon ? "Ending Soon · Urgent" : "Official Event Timer"}
          </span>
        </div>

        <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-purple-100 shadow-xs">
          {timerMode === "global" ? "Global Event Deadline" : "Individual Countdown"}
        </span>
      </div>

      {/* Main Large Digits */}
      <div className="py-4 text-center">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Time Remaining
        </div>
        <div className="flex items-center justify-center gap-2 font-mono">
          <div className="flex flex-col items-center">
            <span
              className={`text-4xl sm:text-5xl font-black tracking-tight ${
                isEndingSoon ? "text-orange-600" : "text-slate-900"
              }`}
            >
              {pad(hours)}
            </span>
            <span className="text-[10px] font-bold uppercase text-slate-400">Hours</span>
          </div>

          <span
            className={`text-3xl sm:text-4xl font-light pb-3 ${
              isEndingSoon ? "text-orange-400" : "text-purple-300"
            }`}
          >
            :
          </span>

          <div className="flex flex-col items-center">
            <span
              className={`text-4xl sm:text-5xl font-black tracking-tight ${
                isEndingSoon ? "text-orange-600" : "text-slate-900"
              }`}
            >
              {pad(minutes)}
            </span>
            <span className="text-[10px] font-bold uppercase text-slate-400">Mins</span>
          </div>

          <span
            className={`text-3xl sm:text-4xl font-light pb-3 ${
              isEndingSoon ? "text-orange-400" : "text-purple-300"
            }`}
          >
            :
          </span>

          <div className="flex flex-col items-center">
            <span
              className={`text-4xl sm:text-5xl font-black tracking-tight ${
                isEndingSoon ? "text-orange-600" : "text-[#6C2BFF]"
              }`}
            >
              {pad(seconds)}
            </span>
            <span className="text-[10px] font-bold uppercase text-slate-400">Secs</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-2 border-t border-purple-100/60">
        <span>
          Deadline:{" "}
          {new Date(deadlineAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className="text-emerald-600 flex items-center gap-1 font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Server Synced
        </span>
      </div>
    </div>
  );
}
