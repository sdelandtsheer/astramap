import { CircleDashed } from "lucide-react";

export default function ObjectPanel() {
  return (
    <div className="flex h-full min-h-[320px] flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Selected Object</h2>
        <span className="rounded bg-slate-950 px-2 py-1 text-[11px] text-slate-500">synthetic</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center">
        <CircleDashed size={28} className="mb-3 text-slate-500" aria-hidden="true" />
        <div className="text-sm font-medium text-slate-300">No synthetic object selected</div>
        <div className="mt-2 h-2 w-32 rounded bg-slate-800" />
        <div className="mt-2 h-2 w-24 rounded bg-slate-800" />
      </div>
    </div>
  );
}
