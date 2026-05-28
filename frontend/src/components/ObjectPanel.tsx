import { CircleDashed } from "lucide-react";

import type { AlertPoint } from "../types";

interface ObjectPanelProps {
  selectedAlert: AlertPoint | null;
}

export default function ObjectPanel({ selectedAlert }: ObjectPanelProps) {
  return (
    <div className="flex h-full min-h-[320px] flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Selected Object</h2>
        <span className="rounded bg-slate-950 px-2 py-1 text-[11px] text-slate-500">synthetic</span>
      </div>

      {selectedAlert ? (
        <div className="space-y-4">
          <div>
            <div className="text-xs uppercase text-slate-500">Object ID</div>
            <div className="mt-1 text-lg font-semibold text-white">{selectedAlert.object_id}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="Likely class" value={selectedAlert.class_label.replaceAll("_", " ")} />
            <Metric label="Magnitude" value={selectedAlert.mag.toFixed(2)} />
            <Metric label="Anomaly" value={selectedAlert.anomaly_score.toFixed(2)} />
            <Metric label="Priority" value={selectedAlert.priority_score.toFixed(2)} />
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
            RA {selectedAlert.ra.toFixed(3)} / Dec {selectedAlert.dec.toFixed(3)} / MJD {selectedAlert.mjd.toFixed(3)}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center">
          <CircleDashed size={28} className="mb-3 text-slate-500" aria-hidden="true" />
          <div className="text-sm font-medium text-slate-300">No synthetic object selected</div>
          <div className="mt-2 h-2 w-32 rounded bg-slate-800" />
          <div className="mt-2 h-2 w-24 rounded bg-slate-800" />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
      <div className="text-[11px] uppercase text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-slate-100">{value}</div>
    </div>
  );
}
