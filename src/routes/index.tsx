import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { RATIOS } from "@/lib/ratios";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Framewise — Theme templates with auto photo alignment" },
      {
        name: "description",
        content:
          "Create branded photo templates once, share a link, and let anyone drop in their photo to export ID card, LinkedIn and Instagram sizes.",
      },
      { property: "og:title", content: "Framewise — Theme templates with auto photo alignment" },
      {
        property: "og:description",
        content:
          "Create branded photo templates once, share a link, and let anyone export perfectly aligned images.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Theme management &amp; photo alignment
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-slate-900">
          Design the frame once. Everyone else just drops in a photo.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Upload a template, mark exactly where the photo belongs, and share a link. Your audience
          gets ID card, LinkedIn and Instagram exports in one click — no design tools needed.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/admin"
            className="border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Open Admin Portal
          </Link>
          <Link
            to="/admin/themes"
            className="border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            View Theme Gallery
          </Link>
        </div>

        <div className="mt-16 grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-3">
          {RATIOS.map((r) => (
            <div key={r.key} className="bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">{r.label}</h2>
              <p className="mt-1 text-xs text-slate-500">{r.hint}</p>
              <p className="mt-3 text-sm text-slate-600">
                Rendered at {r.exportWidth}×{r.exportHeight} px for crisp, print-ready downloads.
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
