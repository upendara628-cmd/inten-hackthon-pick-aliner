import { createFileRoute } from "@tanstack/react-router";
import { ThemeGalleryView } from "@/components/theme-gallery-view";

export const Route = createFileRoute("/themes")({
  head: () => ({
    meta: [
      { title: "Badge & Theme Gallery — Framewise" },
      {
        name: "description",
        content:
          "Browse published event badge designs, search by format, and generate perfectly fitted passes in seconds.",
      },
      { property: "og:title", content: "Badge & Theme Gallery — Framewise" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ThemeGalleryView,
});
