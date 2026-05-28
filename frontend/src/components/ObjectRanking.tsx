import { useMemo, useState } from "react";

import type { AlertPoint } from "../types";

interface ObjectRankingProps {
  alerts: AlertPoint[];
  selectedObjectId: string | null;
  onSelectObject: (objectId: string) => void;
}

type RankingMode = "priority" | "anomaly";

interface RankedObject {
  objectId: string;
  classLabel: string;
  anomalyScore: number;
  priorityScore: number;
  alertCount: number;
}

export default function ObjectRanking({ alerts, selectedObjectId, onSelectObject }: ObjectRankingProps) {
  const [mode, setMode] = useState<RankingMode>("priority");
  const rows = useMemo(() => rankObjects(alerts, mode), [alerts, mode]);

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-sm font-semibold text-white">Top Objects</h2>
        <div className="grid w-full grid-cols-2 overflow-hidden rounded-md border border-slate-800 md:w-56">
          <button
            className={`h-8 text-xs ${mode === "priority" ? "bg-emerald-400/15 text-emerald-100" : "bg-slate-950 text-slate-400"}`}
            onClick={() => setMode("priority")}
            type="button"
          >
            Priority
          </button>
          <button
            className={`h-8 text-xs ${mode === "anomaly" ? "bg-cyan-400/15 text-cyan-100" : "bg-slate-950 text-slate-400"}`}
            onClick={() => setMode("anomaly")}
            type="button"
          >
            Anomaly
          </button>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          {rows.map((row, index) => (
            <button
              key={row.objectId}
              className={`rounded-md border px-3 py-2 text-left text-xs ${
                selectedObjectId === row.objectId
                  ? "border-cyan-300/70 bg-cyan-400/10"
                  : "border-slate-800 bg-slate-950/70 hover:border-slate-600"
              }`}
              onClick={() => onSelectObject(row.objectId)}
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-200">{index + 1}. {row.objectId}</span>
                <span className="rounded bg-emerald-400/10 px-2 py-1 text-emerald-200">{row.priorityScore.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-slate-500">
                <span>{row.classLabel.replaceAll("_", " ")}</span>
                <span>anomaly {row.anomalyScore.toFixed(2)}</span>
              </div>
              <div className="mt-1 text-slate-600">{row.alertCount} alerts</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-4 text-sm text-slate-500">
          No objects match the current filters
        </div>
      )}
    </div>
  );
}

function rankObjects(alerts: AlertPoint[], mode: RankingMode): RankedObject[] {
  const byObject = new Map<string, RankedObject>();

  for (const alert of alerts) {
    const existing = byObject.get(alert.object_id);
    if (!existing) {
      byObject.set(alert.object_id, {
        objectId: alert.object_id,
        classLabel: alert.class_label,
        anomalyScore: alert.anomaly_score,
        priorityScore: alert.priority_score,
        alertCount: 1,
      });
      continue;
    }

    existing.anomalyScore = Math.max(existing.anomalyScore, alert.anomaly_score);
    existing.priorityScore = Math.max(existing.priorityScore, alert.priority_score);
    existing.alertCount += 1;
  }

  const scoreKey = mode === "priority" ? "priorityScore" : "anomalyScore";
  return [...byObject.values()]
    .sort((a, b) => b[scoreKey] - a[scoreKey] || b.priorityScore - a.priorityScore)
    .slice(0, 10);
}
