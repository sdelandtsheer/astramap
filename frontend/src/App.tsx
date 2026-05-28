import { Activity, MoonStar } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import LayerControls from "./components/LayerControls";
import ObjectPanel from "./components/ObjectPanel";
import ObjectRanking from "./components/ObjectRanking";
import SkyMap from "./components/SkyMap";
import TimeSlider from "./components/TimeSlider";
import { loadAlerts, loadDetailedObject, summarizeAlerts } from "./data/loadData";
import type { AlertPoint, DetailedObject, FilterState } from "./types";
import { createDefaultFilters, filterAlerts } from "./utils/scoring";

export default function App() {
  const [alerts, setAlerts] = useState<AlertPoint[]>([]);
  const [filters, setFilters] = useState<FilterState>(() => createDefaultFilters());
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<DetailedObject | null>(null);
  const [isObjectLoading, setIsObjectLoading] = useState(false);
  const [objectError, setObjectError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadAlerts()
      .then((loadedAlerts) => {
        if (!cancelled) {
          setAlerts(loadedAlerts);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedObjectId) {
      setSelectedObject(null);
      setObjectError(null);
      setIsObjectLoading(false);
      return undefined;
    }

    let cancelled = false;
    setIsObjectLoading(true);

    loadDetailedObject(selectedObjectId)
      .then((detail) => {
        if (!cancelled) {
          setSelectedObject(detail);
          setObjectError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSelectedObject(null);
          setObjectError(error instanceof Error ? error.message : String(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsObjectLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedObjectId]);

  const summary = useMemo(() => (alerts.length > 0 ? summarizeAlerts(alerts) : null), [alerts]);
  const filteredAlerts = useMemo(() => filterAlerts(alerts, filters), [alerts, filters]);
  const filteredSummary = useMemo(
    () => (filteredAlerts.length > 0 ? summarizeAlerts(filteredAlerts) : null),
    [filteredAlerts],
  );
  const selectedAlert = useMemo(
    () => alerts.find((alert) => alert.object_id === selectedObjectId) ?? null,
    [alerts, selectedObjectId],
  );

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
            <span>{summary ? `${summary.alertCount.toLocaleString()} synthetic alerts` : "Synthetic demo mode"}</span>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_minmax(360px,1fr)_auto_auto] lg:grid-cols-[280px_minmax(0,1fr)_360px] lg:grid-rows-[minmax(0,1fr)_104px]">
          <aside className="border-b border-slate-800 bg-[#0d1322] lg:border-b-0 lg:border-r">
            <LayerControls filters={filters} onFiltersChange={setFilters} summary={summary} />
          </aside>

          <section className="min-h-0 bg-[#070a10]">
            <SkyMap
              alerts={filteredAlerts}
              colorMode={filters.colorMode}
              isLoading={isLoading}
              loadError={loadError}
              onSelectObject={setSelectedObjectId}
              selectedObjectId={selectedObjectId}
              summary={filteredSummary ?? summary}
            />
          </section>

          <aside className="border-t border-slate-800 bg-[#0d1322] lg:border-l lg:border-t-0">
            <ObjectPanel
              isLoading={isObjectLoading}
              loadError={objectError}
              selectedAlert={selectedAlert}
              selectedObject={selectedObject}
            />
          </aside>

          <section className="border-t border-slate-800 bg-[#0b1020] lg:col-span-3">
            <TimeSlider filters={filters} onFiltersChange={setFilters} summary={summary} />
          </section>

          <section className="border-t border-slate-800 bg-[#0d1322] lg:col-span-3">
            <ObjectRanking alerts={filteredAlerts} />
          </section>
        </section>
      </div>
    </main>
  );
}
