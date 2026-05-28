import { Pause, Play } from "lucide-react";

import type { AlertDatasetSummary } from "../types";

interface TimeSliderProps {
  summary: AlertDatasetSummary | null;
}

export default function TimeSlider({ summary }: TimeSliderProps) {
  const minLabel = summary ? `MJD ${summary.mjdMin.toFixed(1)}` : "MJD 60400.0";
  const maxLabel = summary ? `MJD ${summary.mjdMax.toFixed(1)}` : "MJD 60430.0";

  return (
    <div className="flex h-full flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
      <div className="flex items-center gap-2">
        <button className="flex size-9 items-center justify-center rounded-md border border-slate-700 bg-slate-950 text-slate-300" type="button">
          <Play size={15} aria-hidden="true" />
        </button>
        <button className="flex size-9 items-center justify-center rounded-md border border-slate-800 bg-slate-950/70 text-slate-500" type="button">
          <Pause size={15} aria-hidden="true" />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
        <input className="w-full accent-cyan-300" defaultValue="35" max="100" min="0" type="range" />
      </div>
      <div className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300">Simulated night window</div>
    </div>
  );
}
