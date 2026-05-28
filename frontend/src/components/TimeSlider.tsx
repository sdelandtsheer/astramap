import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { AlertDatasetSummary, FilterState } from "../types";

interface TimeSliderProps {
  summary: AlertDatasetSummary | null;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const windowOptions = [1, 3, 7, 30];

export default function TimeSlider({ summary, filters, onFiltersChange }: TimeSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const minMjd = summary?.mjdMin ?? 60400;
  const maxMjd = summary?.mjdMax ?? 60430;
  const currentMjd = filters.timeCurrentMjd ?? maxMjd;

  const rangeLabel = useMemo(() => {
    if (!summary || filters.timeCurrentMjd === null) {
      return "Full simulated range";
    }
    const start = Math.max(minMjd, currentMjd - filters.timeWindowDays);
    return `MJD ${start.toFixed(2)} - ${currentMjd.toFixed(2)}`;
  }, [currentMjd, filters.timeCurrentMjd, filters.timeWindowDays, minMjd, summary]);

  useEffect(() => {
    if (!isPlaying || !summary) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      const next = (filters.timeCurrentMjd ?? minMjd) + 0.35;
      onFiltersChange({
        ...filters,
        timeCurrentMjd: next > maxMjd ? minMjd + filters.timeWindowDays : next,
      });
    }, 450);

    return () => window.clearInterval(interval);
  }, [filters, isPlaying, maxMjd, minMjd, onFiltersChange, summary]);

  function update(partial: Partial<FilterState>) {
    onFiltersChange({ ...filters, ...partial });
  }

  return (
    <div className="flex h-full flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
      <div className="flex items-center gap-2">
        <button
          className="flex size-9 items-center justify-center rounded-md border border-slate-700 bg-slate-950 text-slate-300"
          onClick={() => setIsPlaying((value) => !value)}
          type="button"
        >
          {isPlaying ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
        </button>
        <button
          className="flex size-9 items-center justify-center rounded-md border border-slate-800 bg-slate-950/70 text-slate-500"
          onClick={() => {
            setIsPlaying(false);
            update({ timeCurrentMjd: null });
          }}
          type="button"
        >
          <RotateCcw size={15} aria-hidden="true" />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>MJD {minMjd.toFixed(1)}</span>
          <span>{rangeLabel}</span>
          <span>MJD {maxMjd.toFixed(1)}</span>
        </div>
        <input
          className="w-full accent-cyan-300"
          disabled={!summary}
          max={maxMjd}
          min={minMjd}
          onChange={(event) => update({ timeCurrentMjd: Number(event.target.value) })}
          step="0.05"
          type="range"
          value={currentMjd}
        />
      </div>
      <label className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300">
        <span>Window</span>
        <select
          className="bg-slate-950 text-slate-100 outline-none"
          onChange={(event) => update({ timeWindowDays: Number(event.target.value) })}
          value={filters.timeWindowDays}
        >
          {windowOptions.map((days) => (
            <option key={days} value={days}>
              {days}d
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
