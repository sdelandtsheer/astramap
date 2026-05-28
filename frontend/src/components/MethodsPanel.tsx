import { X } from "lucide-react";

interface MethodsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MethodsPanel({ isOpen, onClose }: MethodsPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-20">
      <section className="max-h-[78vh] w-full max-w-2xl overflow-y-auto rounded-md border border-slate-700 bg-[#0d1322] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Methods and Caveats</h2>
            <p className="mt-1 text-sm text-slate-400">Synthetic-data demonstration, not live Rubin alerts.</p>
          </div>
          <button className="flex size-8 items-center justify-center rounded-md border border-slate-700 bg-slate-950 text-slate-300" onClick={onClose} type="button">
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 text-sm leading-6 text-slate-300">
          <p>
            Rubin Night Watch is currently a synthetic-data demonstration of how Rubin-like alert streams could be
            visualized as a cosmic weather map. It does not display live Rubin alerts or confirmed astronomical
            discoveries.
          </p>
          <p>
            Alert points, detailed object files, light curves, and cutouts are generated locally by Python scripts.
            Object classes are illustrative, scores are heuristic, and cutouts are synthetic demo images.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Caveat label="Data source" value="Synthetic static files" />
            <Caveat label="Scores" value="Transparent heuristics" />
            <Caveat label="Cutouts" value="Generated demo WebP images" />
            <Caveat label="Discovery status" value="No confirmed discoveries" />
          </div>
        </div>
      </section>
    </div>
  );
}

function Caveat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
      <div className="text-[11px] uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-slate-200">{value}</div>
    </div>
  );
}
