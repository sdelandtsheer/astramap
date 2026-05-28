import { CircleDashed, Loader2 } from "lucide-react";

import { CLASS_LABELS, type AlertPoint, type ClassLabel, type DetailedObject } from "../types";
import BlinkCard from "./BlinkCard";
import LightCurve from "./LightCurve";

interface ObjectPanelProps {
  selectedAlert: AlertPoint | null;
  selectedObject: DetailedObject | null;
  isLoading: boolean;
  loadError: string | null;
}

const classLabels: Record<ClassLabel, string> = {
  variable_star: "variable star candidate",
  asteroid: "moving-object candidate",
  supernova_candidate: "supernova candidate",
  agn: "AGN-like candidate",
  artifact: "possible artifact",
  unknown_anomaly: "unknown anomaly candidate",
};

export default function ObjectPanel({ selectedAlert, selectedObject, isLoading, loadError }: ObjectPanelProps) {
  return (
    <div className="flex h-full min-h-[320px] flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Selected Object</h2>
        <span className="rounded bg-slate-950 px-2 py-1 text-[11px] text-slate-500">synthetic</span>
      </div>

      {!selectedAlert ? <EmptyState /> : null}
      {selectedAlert && isLoading ? <LoadingState objectId={selectedAlert.object_id} /> : null}
      {selectedAlert && loadError ? <ErrorState message={loadError} /> : null}
      {selectedAlert && selectedObject && !isLoading && !loadError ? (
        <LoadedObject selectedAlert={selectedAlert} selectedObject={selectedObject} />
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center">
      <CircleDashed size={28} className="mb-3 text-slate-500" aria-hidden="true" />
      <div className="text-sm font-medium text-slate-300">No synthetic object selected</div>
      <div className="mt-2 h-2 w-32 rounded bg-slate-800" />
      <div className="mt-2 h-2 w-24 rounded bg-slate-800" />
    </div>
  );
}

function LoadingState({ objectId }: { objectId: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-slate-800 bg-slate-950/50 p-6 text-center">
      <Loader2 size={26} className="mb-3 animate-spin text-cyan-300" aria-hidden="true" />
      <div className="text-sm font-medium text-slate-300">{objectId}</div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return <div className="rounded-md border border-rose-400/30 bg-rose-950/40 p-4 text-sm text-rose-100">{message}</div>;
}

function LoadedObject({ selectedAlert, selectedObject }: { selectedAlert: AlertPoint; selectedObject: DetailedObject }) {
  const likelyClass = likelyClassFor(selectedObject);

  return (
    <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
      <div>
        <div className="text-xs uppercase text-slate-500">Object ID</div>
        <div className="mt-1 text-lg font-semibold text-white">{selectedObject.object_id}</div>
        <div className="mt-1 text-sm text-slate-400">{classLabels[likelyClass]}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Metric label="Anomaly score" value={selectedObject.anomaly_score.toFixed(2)} tone="cyan" />
        <Metric label="Priority score" value={selectedObject.priority_score.toFixed(2)} tone="emerald" />
        <Metric label="Latest mag" value={selectedAlert.mag.toFixed(2)} />
        <Metric label="Class prob" value={selectedObject.class_probabilities[likelyClass].toFixed(2)} />
      </div>

      <section className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
        <div className="text-xs font-medium uppercase text-slate-500">Review note</div>
        <p className="mt-2 text-sm leading-5 text-slate-300">{selectedObject.short_explanation}</p>
      </section>

      <section>
        <div className="mb-2 text-xs font-medium uppercase text-slate-500">Flags</div>
        <div className="flex flex-wrap gap-2">
          {selectedObject.flags.length > 0 ? (
            selectedObject.flags.map((flag) => (
              <span key={flag} className="rounded bg-slate-950 px-2 py-1 text-xs text-slate-300">
                {flag.replaceAll("_", " ")}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">No extra flags</span>
          )}
        </div>
      </section>

      <section>
        <div className="mb-2 text-xs font-medium uppercase text-slate-500">Class probabilities</div>
        <div className="space-y-2">
          {CLASS_LABELS.map((label) => (
            <ProbabilityBar key={label} label={label} value={selectedObject.class_probabilities[label]} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 text-xs">
        <Coordinate label="RA" value={selectedObject.ra.toFixed(4)} />
        <Coordinate label="Dec" value={selectedObject.dec.toFixed(4)} />
        <Coordinate label="First seen" value={selectedObject.first_seen_mjd.toFixed(3)} />
        <Coordinate label="Last seen" value={selectedObject.last_seen_mjd.toFixed(3)} />
      </section>

      <BlinkCard cutouts={selectedObject.cutouts} />
      <LightCurve points={selectedObject.light_curve} />
    </div>
  );
}

function Metric({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "cyan" | "emerald" }) {
  const toneClass = {
    slate: "text-slate-100",
    cyan: "text-cyan-200",
    emerald: "text-emerald-200",
  }[tone];

  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
      <div className="text-[11px] uppercase text-slate-500">{label}</div>
      <div className={`mt-1 font-medium ${toneClass}`}>{value}</div>
    </div>
  );
}

function ProbabilityBar({ label, value }: { label: ClassLabel; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-300">{label.replaceAll("_", " ")}</span>
        <span className="text-slate-500">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-slate-900">
        <div className="h-full rounded bg-cyan-300" style={{ width: `${Math.max(2, value * 100)}%` }} />
      </div>
    </div>
  );
}

function Coordinate({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
      <div className="uppercase text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-slate-200">{value}</div>
    </div>
  );
}

function likelyClassFor(object: DetailedObject): ClassLabel {
  return CLASS_LABELS.reduce((best, label) =>
    object.class_probabilities[label] > object.class_probabilities[best] ? label : best,
  );
}
