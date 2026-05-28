import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

import type { CutoutPaths } from "../types";

type BlinkFrame = keyof CutoutPaths;

const frames: BlinkFrame[] = ["reference", "new", "difference"];
const labels: Record<BlinkFrame, string> = {
  reference: "Reference",
  new: "New",
  difference: "Difference",
};

interface BlinkCardProps {
  cutouts?: CutoutPaths;
}

export default function BlinkCard({ cutouts }: BlinkCardProps) {
  const [frame, setFrame] = useState<BlinkFrame>("reference");
  const [autoBlink, setAutoBlink] = useState(true);
  const [failedFrames, setFailedFrames] = useState<Partial<Record<BlinkFrame, boolean>>>({});

  useEffect(() => {
    if (!autoBlink || !cutouts) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setFrame((current) => frames[(frames.indexOf(current) + 1) % frames.length]);
    }, 700);

    return () => window.clearInterval(interval);
  }, [autoBlink, cutouts]);

  if (!cutouts) {
    return (
      <section className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
        <div className="text-xs font-medium uppercase text-slate-500">Blink card</div>
        <div className="mt-3 rounded bg-slate-900 p-4 text-xs text-slate-500">No synthetic demo cutout declared</div>
      </section>
    );
  }

  const currentSource = cutouts[frame];
  const failed = failedFrames[frame];

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium uppercase text-slate-500">Blink card</div>
          <div className="text-[11px] text-slate-500">synthetic demo cutout</div>
        </div>
        <button
          className="flex size-8 items-center justify-center rounded-md border border-slate-800 bg-slate-950 text-slate-300"
          onClick={() => setAutoBlink((value) => !value)}
          type="button"
        >
          {autoBlink ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
        </button>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-800 bg-black">
        {failed ? (
          <div className="flex aspect-square items-center justify-center p-4 text-center text-xs text-slate-500">
            Missing {labels[frame].toLowerCase()} cutout
          </div>
        ) : (
          <img
            alt={`${labels[frame]} synthetic cutout`}
            className="aspect-square w-full object-cover [image-rendering:auto]"
            onError={() => setFailedFrames((current) => ({ ...current, [frame]: true }))}
            src={currentSource}
          />
        )}
      </div>

      <div className="mt-2 grid grid-cols-3 overflow-hidden rounded-md border border-slate-800">
        {frames.map((candidate) => (
          <button
            key={candidate}
            className={`h-8 text-xs ${frame === candidate ? "bg-cyan-400/15 text-cyan-100" : "bg-slate-950 text-slate-400"}`}
            onClick={() => {
              setFrame(candidate);
              setAutoBlink(false);
            }}
            type="button"
          >
            {labels[candidate]}
          </button>
        ))}
      </div>
    </section>
  );
}
