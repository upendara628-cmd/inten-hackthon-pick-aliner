import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { deleteTheme, listThemes, shareLinkFor, type Theme } from "@/lib/store";

export const Route = createFileRoute("/admin/themes")({
  head: () => ({
    meta: [
      { title: "Theme Gallery — Framewise" },
      {
        name: "description",
        content: "All published templates with copyable share links for your audience.",
      },
      { property: "og:title", content: "Theme Gallery — Framewise" },
      {
        property: "og:description",
        content: "All published templates with copyable share links for your audience.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ThemeGallery,
});

function ThemeGallery() {
  const [themes, setThemes] = useState<Theme[] | null>(null);

  useEffect(() => {
    listThemes().then(setThemes);
  }, []);

  const shareLink = (theme: Theme) => shareLinkFor(theme);

  const copy = async (theme: Theme) => {
    try {
      await navigator.clipboard.writeText(shareLink(theme));
      toast.success("Share link copied");
    } catch {
      toast.error("Copy failed — select the link manually");
    }
  };

  const remove = async (id: string) => {
    await deleteTheme(id);
    setThemes((t) => (t ?? []).filter((x) => x.id !== id));
    toast.success("Theme deleted");
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Theme gallery</h1>
            <p className="mt-1 text-sm text-slate-600">
              Every published template and its shareable link.
            </p>
          </div>
          <Link
            to="/admin"
            className="border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            New theme
          </Link>
        </div>

        {themes === null ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading themes…
          </div>
        ) : themes.length === 0 ? (
          <div className="mt-8 border border-dashed border-slate-300 p-10 text-center text-sm text-slate-600">
            No themes yet. Create your first one in the Admin Portal.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((t) => (
              <article key={t.id} className="border border-slate-200 bg-white">
                <div className="grid h-40 place-items-center overflow-hidden border-b border-slate-200 bg-slate-100">
                  <img
                    src={t.background_image_url}
                    alt={t.title}
                    className="max-h-40 w-full object-contain"
                  />
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">{t.title}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {t.shape_type} placeholder · {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="truncate border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-600">
                    {shareLink(t)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => copy(t)}
                      className="flex flex-1 items-center justify-center gap-1.5 border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy link
                    </button>
                    <Link
                      to="/d/$themeId"
                      params={{ themeId: t.id }}
                      className="flex items-center justify-center gap-1.5 border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(t.id)}
                      aria-label={`Delete ${t.title}`}
                      className="border border-slate-300 px-2 py-1.5 text-slate-600 hover:bg-slate-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
