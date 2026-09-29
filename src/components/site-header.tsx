import { Link } from "@tanstack/react-router";

const linkBase =
  "px-2 py-1.5 text-xs text-slate-600 border border-transparent hover:text-slate-900 hover:border-slate-200 sm:px-3 sm:text-sm";
const linkActive = "text-slate-900 border-slate-300 bg-slate-50";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center border border-slate-800 bg-slate-900 text-[11px] font-bold text-white">
            F
          </span>
          <span className="hidden text-sm font-semibold text-slate-900 sm:inline">Framewise</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/admin" className={linkBase} activeProps={{ className: linkActive }}>
            Admin Portal
          </Link>
          <Link to="/admin/themes" className={linkBase} activeProps={{ className: linkActive }}>
            Theme Gallery
          </Link>
        </nav>
      </div>
    </header>
  );
}
