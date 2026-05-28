const rows = [
  ["object_000071", "supernova", "0.83", "0.65"],
  ["object_000108", "supernova", "0.79", "0.62"],
  ["object_000143", "variable", "0.61", "0.62"],
];

export default function ObjectRanking() {
  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Top Priority Objects</h2>
        <span className="text-xs text-slate-500">Preview rows</span>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {rows.map(([objectId, label, anomaly, priority]) => (
          <button key={objectId} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-left text-xs" type="button">
            <span className="font-medium text-slate-200">{objectId}</span>
            <span className="text-slate-500">{label}</span>
            <span className="rounded bg-emerald-400/10 px-2 py-1 text-emerald-200">{priority}</span>
            <span className="col-span-3 text-slate-500">anomaly {anomaly}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
