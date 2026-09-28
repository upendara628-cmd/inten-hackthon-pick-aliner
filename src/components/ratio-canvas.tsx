import { useEffect, useRef } from "react";
import { Download } from "lucide-react";
import type { RatioDef } from "@/lib/ratios";
import type { Theme } from "@/lib/store";
import { downloadCanvas, renderComposite } from "@/lib/render";

export function RatioCanvas({
  ratio,
  theme,
  background,
  photo,
  downloadable = false,
}: {
  ratio: RatioDef;
  theme: Theme;
  background: HTMLImageElement | null;
  photo?: HTMLImageElement | null;
  downloadable?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current || !background) return;
    renderComposite(
      ref.current,
      ratio.exportWidth,
      ratio.exportHeight,
      theme,
      background,
      photo ?? null,
    );
  }, [ratio, theme, background, photo]);

  return (
    <div className="border border-slate-200 bg-white">
      <div className="flex items-baseline justify-between border-b border-slate-200 px-3 py-2">
        <span className="text-sm font-medium text-slate-900">{ratio.label}</span>
        <span className="text-xs text-slate-500">{ratio.hint}</span>
      </div>
      <div className="grid place-items-center bg-slate-100 p-3">
        <canvas
          ref={ref}
          className="max-h-[320px] w-auto max-w-full border border-slate-200"
          style={{ aspectRatio: String(ratio.aspect) }}
        />
      </div>
      {downloadable && (
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={() =>
              ref.current &&
              downloadCanvas(
                ref.current,
                `${theme.title.replace(/\s+/g, "-").toLowerCase() || "design"}-${ratio.key}.png`,
              )
            }
            className="flex w-full items-center justify-center gap-2 border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </button>
        </div>
      )}
    </div>
  );
}
