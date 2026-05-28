import { Filter, Layers } from "lucide-react";

import { CLASS_LABELS, type AlertDatasetSummary, type ClassLabel } from "../types";

const classLabels: Record<ClassLabel, string> = {
  variable_star: "Variable",
  asteroid: "Asteroid",
  supernova_candidate: "Supernova",
  agn: "AGN",
  artifact: "Artifact",
  unknown_anomaly: "Unknown",
};

interface LayerControlsProps {
  summary: AlertDatasetSummary | null;
}

export default function LayerControls({ summary }: LayerControlsProps) {
  return (
    <div className="flex h-full flex-col gap-5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
          <Layers size={16} className="text-cyan-300" aria-hidden="true" />
          <span>Layers</span>
        </div>
        <span className="rounded bg-slate-900 px-2 py-1 text-[11px] text-slate-400">v0.1</span>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-medium uppercase text-slate-500">Color Mode</div>
        <div className="grid grid-cols-3 overflow-hidden rounded-md border border-slate-800">
          {["Class", "Anomaly", "Priority"].map((mode, index) => (
            <button
              key={mode}
              className={`h-9 text-xs ${index === 0 ? "bg-cyan-400/15 text-cyan-100" : "bg-slate-950 text-slate-400"}`}
              type="button"
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
          <Filter size={13} aria-hidden="true" />
          <span>Classes</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CLASS_LABELS.map((classLabel) => (
            <label key={classLabel} className="flex items-center gap-2 rounded border border-slate-800 bg-slate-950/60 px-2 py-2 text-xs text-slate-300">
              <input defaultChecked className="accent-cyan-300" type="checkbox" />
              <span>{classLabels[classLabel]}</span>
              <span className="ml-auto text-slate-500">{summary?.classCounts[classLabel].toLocaleString() ?? "-"}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-xs font-medium uppercase text-slate-500">Minimum Anomaly</span>
          <input className="mt-2 w-full accent-cyan-300" defaultValue="0" max="1" min="0" step="0.01" type="range" />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase text-slate-500">Minimum Priority</span>
          <input className="mt-2 w-full accent-emerald-300" defaultValue="0" max="1" min="0" step="0.01" type="range" />
        </label>
      </div>
    </div>
  );
}
