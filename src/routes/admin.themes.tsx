import { createFileRoute } from "@tanstack/react-router";
import { ThemeGalleryView } from "@/components/theme-gallery-view";

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
  component: ThemeGalleryView,
});
