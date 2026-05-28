import { Filter, Layers } from "lucide-react";

import { CLASS_LABELS, type AlertDatasetSummary, type ClassLabel, type ColorMode, type FilterState } from "../types";

const classLabels: Record<ClassLabel, string> = {
  variable_star: "Variable",
  asteroid: "Asteroid",
  supernova_candidate: "Supernova",
  agn: "AGN",
  artifact: "Artifact",
  unknown_anomaly: "Unknown",
};

const colorModes: Array<{ label: string; value: ColorMode }> = [
  { label: "Class", value: "class" },
  { label: "Anomaly", value: "anomaly_score" },
  { label: "Priority", value: "priority_score" },
];

interface LayerControlsProps {
  summary: AlertDatasetSummary | null;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export default function LayerControls({ summary, filters, onFiltersChange }: LayerControlsProps) {
  function update(partial: Partial<FilterState>) {
    onFiltersChange({ ...filters, ...partial });
  }

  function updateClass(classLabel: ClassLabel, enabled: boolean) {
    update({
      enabledClasses: {
        ...filters.enabledClasses,
        [classLabel]: enabled,
      },
    });
  }

  return (
    <div className="flex h-full max-h-[70vh] flex-col gap-5 overflow-y-auto p-4 lg:max-h-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
          <Layers size={16} className="text-cyan-300" aria-hidden="true" />
          <span>Layers</span>
        </div>
        <span className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-400">v0.1</span>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-medium uppercase text-slate-500">Color Mode</div>
        <div className="grid grid-cols-3 overflow-hidden rounded-md border border-slate-800">
          {colorModes.map((mode) => (
            <button
              key={mode.value}
              className={`h-9 text-xs ${filters.colorMode === mode.value ? "bg-cyan-400/15 text-cyan-100" : "bg-slate-950 text-slate-400"}`}
              onClick={() => update({ colorMode: mode.value })}
              type="button"
            >
              {mode.label}
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
            <label
              key={classLabel}
              className="flex min-h-9 items-center gap-2 rounded-md border border-slate-800 bg-slate-950/60 px-2 py-2 text-xs text-slate-300 transition-colors hover:border-slate-700"
            >
              <input
                checked={filters.enabledClasses[classLabel]}
                className="accent-cyan-300"
                onChange={(event) => updateClass(classLabel, event.target.checked)}
                type="checkbox"
              />
              <span>{classLabels[classLabel]}</span>
              <span className="ml-auto text-slate-500">{summary?.classCounts[classLabel].toLocaleString() ?? "-"}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="flex items-center justify-between text-xs font-medium uppercase text-slate-500">
            <span>Minimum Anomaly</span>
            <span>{filters.minAnomalyScore.toFixed(2)}</span>
          </span>
          <input
            className="mt-2 w-full accent-cyan-300"
            max="1"
            min="0"
            onChange={(event) => update({ minAnomalyScore: Number(event.target.value) })}
            step="0.01"
            type="range"
            value={filters.minAnomalyScore}
          />
        </label>
        <label className="block">
          <span className="flex items-center justify-between text-xs font-medium uppercase text-slate-500">
            <span>Minimum Priority</span>
            <span>{filters.minPriorityScore.toFixed(2)}</span>
          </span>
          <input
            className="mt-2 w-full accent-emerald-300"
            max="1"
            min="0"
            onChange={(event) => update({ minPriorityScore: Number(event.target.value) })}
            step="0.01"
            type="range"
            value={filters.minPriorityScore}
          />
        </label>
      </div>

      <div className="space-y-2 pb-1">
        <div className="text-xs font-medium uppercase text-slate-500">Quick layers</div>
        <Toggle label="Anomalies only" onChange={(value) => update({ anomaliesOnly: value })} value={filters.anomaliesOnly} />
        <Toggle label="Transients" onChange={(value) => update({ transients: value })} value={filters.transients} />
        <Toggle label="Moving objects" onChange={(value) => update({ movingObjects: value })} value={filters.movingObjects} />
        <Toggle label="Artifacts" onChange={(value) => update({ artifacts: value })} value={filters.artifacts} />
        <Toggle label="Unknowns" onChange={(value) => update({ unknowns: value })} value={filters.unknowns} />
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-9 items-center justify-between rounded-md border border-slate-800 bg-slate-950/60 px-2 py-2 text-xs text-slate-300 transition-colors hover:border-slate-700">
      <span>{label}</span>
      <input checked={value} className="accent-cyan-300" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  );
}
