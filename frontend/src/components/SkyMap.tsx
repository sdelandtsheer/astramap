import { useEffect, useMemo, useRef, useState } from "react";

import type { AlertDatasetSummary, AlertPoint } from "../types";
import { classColor } from "../utils/colorScales";
import { projectRaDec } from "../utils/projections";

interface SkyMapProps {
  alerts: AlertPoint[];
  isLoading: boolean;
  loadError: string | null;
  selectedObjectId: string | null;
  onSelectObject: (objectId: string) => void;
  summary: AlertDatasetSummary | null;
}

interface CanvasSize {
  width: number;
  height: number;
}

interface HoverState {
  alert: AlertPoint;
  x: number;
  y: number;
}

const HIT_RADIUS_PX = 7;

export default function SkyMap({ alerts, isLoading, loadError, selectedObjectId, onSelectObject, summary }: SkyMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<CanvasSize>({ width: 1, height: 1 });
  const [hover, setHover] = useState<HoverState | null>(null);

  useEffect(() => {
    if (!wrapperRef.current) {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setSize({
        width: Math.max(1, Math.floor(entry.contentRect.width)),
        height: Math.max(1, Math.floor(entry.contentRect.height)),
      });
    });

    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  const projectedAlerts = useMemo(
    () =>
      alerts.map((alert) => ({
        alert,
        ...projectRaDec(alert.ra, alert.dec, size.width, size.height),
      })),
    [alerts, size.height, size.width],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size.width * pixelRatio);
    canvas.height = Math.floor(size.height * pixelRatio);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    context.clearRect(0, 0, size.width, size.height);
    drawBackground(context, size);

    for (const point of projectedAlerts) {
      context.beginPath();
      context.fillStyle = classColor(point.alert.class_label);
      context.globalAlpha = selectedObjectId && point.alert.object_id !== selectedObjectId ? 0.42 : 0.82;
      context.arc(point.x, point.y, point.alert.anomaly_score > 0.7 ? 2.2 : 1.45, 0, Math.PI * 2);
      context.fill();
    }

    if (selectedObjectId) {
      const selected = projectedAlerts.filter((point) => point.alert.object_id === selectedObjectId);
      context.globalAlpha = 1;
      context.strokeStyle = "#ffffff";
      context.lineWidth = 1.5;
      for (const point of selected) {
        context.beginPath();
        context.arc(point.x, point.y, 5, 0, Math.PI * 2);
        context.stroke();
      }
    }

    context.globalAlpha = 1;
  }, [projectedAlerts, selectedObjectId, size]);

  function nearestAlert(clientX: number, clientY: number): HoverState | null {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) {
      return null;
    }

    const x = clientX - bounds.left;
    const y = clientY - bounds.top;
    let best: HoverState | null = null;
    let bestDistance = HIT_RADIUS_PX * HIT_RADIUS_PX;

    for (const point of projectedAlerts) {
      const dx = point.x - x;
      const dy = point.y - y;
      const distance = dx * dx + dy * dy;
      if (distance <= bestDistance) {
        bestDistance = distance;
        best = { alert: point.alert, x: point.x, y: point.y };
      }
    }

    return best;
  }

  return (
    <div ref={wrapperRef} className="relative h-full min-h-[360px] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block h-full w-full cursor-crosshair"
        onClick={(event) => {
          const target = nearestAlert(event.clientX, event.clientY);
          if (target) {
            onSelectObject(target.alert.object_id);
          }
        }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(event) => setHover(nearestAlert(event.clientX, event.clientY))}
      />

      <div className="pointer-events-none absolute left-3 top-3 text-xs uppercase text-slate-500">RA / Dec Projection</div>
      <div className="pointer-events-none absolute right-3 top-3 rounded bg-slate-950/80 px-2 py-1 text-xs text-slate-400">
        {isLoading && "Loading data"}
        {loadError && "Data load error"}
        {!isLoading && !loadError && summary && `${summary.objectCount.toLocaleString()} objects`}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 text-xs text-slate-500">
        {summary ? `MJD ${summary.mjdMin.toFixed(2)} - ${summary.mjdMax.toFixed(2)}` : "Alert map"}
      </div>

      {loadError ? (
        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 rounded-md border border-rose-400/30 bg-rose-950/80 p-4 text-sm text-rose-100">
          {loadError}
        </div>
      ) : null}

      {hover ? (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs text-slate-200 shadow-2xl"
          style={{ left: Math.min(hover.x + 12, size.width - 210), top: Math.max(8, hover.y - 10) }}
        >
          <div className="font-medium text-white">{hover.alert.object_id}</div>
          <div className="text-slate-400">{hover.alert.class_label.replaceAll("_", " ")}</div>
          <div className="mt-1 text-slate-300">
            anomaly {hover.alert.anomaly_score.toFixed(2)} / priority {hover.alert.priority_score.toFixed(2)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function drawBackground(context: CanvasRenderingContext2D, size: CanvasSize) {
  context.fillStyle = "#070a10";
  context.fillRect(0, 0, size.width, size.height);

  context.strokeStyle = "rgba(148, 163, 184, 0.13)";
  context.lineWidth = 1;

  for (let x = 0; x <= size.width; x += Math.max(48, size.width / 8)) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, size.height);
    context.stroke();
  }

  for (let y = 0; y <= size.height; y += Math.max(48, size.height / 6)) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(size.width, y);
    context.stroke();
  }
}
