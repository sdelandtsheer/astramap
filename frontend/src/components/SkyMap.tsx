import type { AlertDatasetSummary } from "../types";

interface SkyMapProps {
  isLoading: boolean;
  loadError: string | null;
  summary: AlertDatasetSummary | null;
}

export default function SkyMap({ isLoading, loadError, summary }: SkyMapProps) {
  return (
    <div className="relative h-full min-h-[360px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.10),_transparent_34%),linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:100%_100%,48px_48px,48px_48px]" />
      <div className="absolute inset-5 rounded-md border border-slate-800/90 bg-slate-950/40">
        <div className="absolute left-3 top-3 text-xs uppercase text-slate-500">RA / Dec Projection</div>
        <div className="absolute right-3 top-3 rounded bg-slate-950/80 px-2 py-1 text-xs text-slate-400">
          {isLoading && "Loading data"}
          {loadError && "Data load error"}
          {!isLoading && !loadError && summary && `${summary.objectCount.toLocaleString()} objects`}
        </div>
        <div className="absolute bottom-3 left-3 text-xs text-slate-500">
          {summary ? `MJD ${summary.mjdMin.toFixed(2)} - ${summary.mjdMax.toFixed(2)}` : "Alert map placeholder"}
        </div>
        {loadError ? (
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 rounded-md border border-rose-400/30 bg-rose-950/40 p-4 text-sm text-rose-100">
            {loadError}
          </div>
        ) : null}
        <div className="absolute left-[18%] top-[42%] size-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
        <div className="absolute left-[52%] top-[34%] size-2 rounded-full bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.75)]" />
        <div className="absolute left-[73%] top-[61%] size-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.75)]" />
        <div className="absolute left-[39%] top-[68%] size-2 rounded-full bg-fuchsia-300 shadow-[0_0_16px_rgba(240,171,252,0.75)]" />
      </div>
    </div>
  );
}
