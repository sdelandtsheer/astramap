import { Activity, MoonStar } from "lucide-react";

import LayerControls from "./components/LayerControls";
import ObjectPanel from "./components/ObjectPanel";
import ObjectRanking from "./components/ObjectRanking";
import SkyMap from "./components/SkyMap";
import TimeSlider from "./components/TimeSlider";

export default function App() {
  return (
    <main className="min-h-screen bg-[#080b12] text-slate-100">
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/90 bg-[#0b1020] px-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
              <MoonStar size={19} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-normal text-white">Rubin Night Watch</h1>
              <p className="text-xs text-slate-400">A cosmic weather map of the changing sky</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300 sm:flex">
            <Activity size={15} className="text-emerald-300" aria-hidden="true" />
            <span>Synthetic demo mode</span>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_minmax(360px,1fr)_auto_auto] lg:grid-cols-[280px_minmax(0,1fr)_360px] lg:grid-rows-[minmax(0,1fr)_104px]">
          <aside className="border-b border-slate-800 bg-[#0d1322] lg:border-b-0 lg:border-r">
            <LayerControls />
          </aside>

          <section className="min-h-0 bg-[#070a10]">
            <SkyMap />
          </section>

          <aside className="border-t border-slate-800 bg-[#0d1322] lg:border-l lg:border-t-0">
            <ObjectPanel />
          </aside>

          <section className="border-t border-slate-800 bg-[#0b1020] lg:col-span-3">
            <TimeSlider />
          </section>

          <section className="border-t border-slate-800 bg-[#0d1322] lg:col-span-3">
            <ObjectRanking />
          </section>
        </section>
      </div>
    </main>
  );
}
