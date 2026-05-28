import type { AlertPoint } from "../types";

interface ObjectRankingProps {
  alerts: AlertPoint[];
}

export default function ObjectRanking({ alerts }: ObjectRankingProps) {
  const rows = [...new Map(alerts.map((alert) => [alert.object_id, alert])).values()]
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Top Priority Objects</h2>
        <span className="text-xs text-slate-500">{alerts.length ? "Loaded preview" : "Preview rows"}</span>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {rows.length > 0
          ? rows.map((alert) => (
              <button key={alert.object_id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-left text-xs" type="button">
                <span className="font-medium text-slate-200">{alert.object_id}</span>
                <span className="text-slate-500">{alert.class_label.replaceAll("_", " ")}</span>
                <span className="rounded bg-emerald-400/10 px-2 py-1 text-emerald-200">{alert.priority_score.toFixed(2)}</span>
                <span className="col-span-3 text-slate-500">anomaly {alert.anomaly_score.toFixed(2)}</span>
              </button>
            ))
          : ["object_000071", "object_000108", "object_000143"].map((objectId) => (
              <button key={objectId} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-left text-xs" type="button">
                <span className="font-medium text-slate-200">{objectId}</span>
                <span className="rounded bg-slate-800 px-2 py-1 text-slate-400">--</span>
              </button>
            ))}
      </div>
    </div>
  );
}
