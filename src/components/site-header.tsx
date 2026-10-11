import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Layers, Plus, Terminal, User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "./auth-modal";

const linkBase =
  "px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-full border border-transparent transition-all duration-200 hover:text-[#6C2BFF] hover:bg-purple-50 sm:text-sm";
const linkActive = "!text-[#6C2BFF] !border-purple-200 !bg-purple-50/80 font-bold shadow-xs";

export function SiteHeader() {
  const { user, isOrganizer, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-purple-100/80 bg-white/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6C2BFF] via-[#7C3AED] to-[#A855F7] p-0.5 shadow-md shadow-purple-500/25 transition-transform duration-300 group-hover:scale-105">
            <img
              src="/stud.png"
              alt="StudLyf Logo"
              className="h-full w-full object-contain p-1"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-[#6C2BFF]">
                Framewise
              </span>
              <span className="hidden rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#6C2BFF] sm:inline-block">
                The Standard
              </span>
            </div>
            <span className="hidden text-[10px] font-medium text-slate-400 sm:inline-block">
              Auto Photo Alignment &amp; Badges
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="flex items-center gap-1 sm:gap-1.5">
            {/* New Hackathons Nav */}
            <Link to="/hackathons" className={linkBase} activeProps={{ className: linkActive }}>
              <span className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-[#6C2BFF]" />
                <span>Hackathons</span>
              </span>
            </Link>

            {/* Organizer Manage Link */}
            {isOrganizer && (
              <Link
                to="/admin/hackathons"
                className={linkBase}
                activeProps={{ className: linkActive }}
              >
                <span className="flex items-center gap-1.5 text-[#EA580C]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Live</span> Console
                </span>
              </Link>
            )}

            {/* Preserved Framewise Links */}
            {isOrganizer && (
              <Link to="/admin" className={linkBase} activeProps={{ className: linkActive }}>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#6C2BFF]" />
                  <span className="hidden sm:inline">Theme</span> Studio
                </span>
              </Link>
            )}

            {isOrganizer && (
              <Link to="/gallery" className={linkBase} activeProps={{ className: linkActive }}>
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-[#6C2BFF]" />
                  <span className="hidden sm:inline">Theme</span> Gallery
                </span>
              </Link>
            )}
          </nav>

          {/* User Auth Pill */}
          {user ? (
            <div className="flex items-center gap-2 rounded-full border border-purple-200/80 bg-purple-50/70 p-1 pl-2.5">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-purple-300"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex flex-col text-right cursor-pointer hover:opacity-80 transition-opacity pr-1"
                title="Account Settings"
              >
                <span className="text-[11px] font-bold text-slate-800 leading-tight max-w-[100px] truncate sm:max-w-none">
                  {user.name}
                </span>
                <span
                  className={`text-[9px] font-extrabold uppercase tracking-wider ${
                    user.role === "organizer" ? "text-[#6C2BFF]" : "text-[#EA580C]"
                  }`}
                >
                  {user.role}
                </span>
              </button>

              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-400 hover:text-red-500 shadow-xs hover:shadow transition-all"
              >
                <LogOut className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-purple-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:border-[#6C2BFF] hover:text-[#6C2BFF] transition-all"
            >
              <User className="h-3.5 w-3.5 text-[#6C2BFF]" />
              <span>Sign In</span>
            </button>
          )}

          {isOrganizer && (
            <Link
              to="/admin"
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6C2BFF] to-[#7C3AED] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-purple-500/30 transition-all duration-200 hover:shadow-md hover:shadow-purple-500/40 hover:brightness-105 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Theme</span>
            </Link>
          )}
        </div>
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </header>
  );
}
