import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { LightCurvePoint } from "../types";

interface LightCurveProps {
  points: LightCurvePoint[];
}

export default function LightCurve({ points }: LightCurveProps) {
  if (points.length === 0) {
    return (
      <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-500">
        No light curve points
      </div>
    );
  }

  const mjdZero = points[0].mjd;
  const data = points.map((point) => ({
    ...point,
    day: Number((point.mjd - mjdZero).toFixed(3)),
  }));

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-medium uppercase text-slate-500">Light curve</div>
        <div className="text-xs text-slate-500">{points.length} points</div>
      </div>
      <div className="h-48 rounded-md border border-slate-800 bg-slate-950/60 p-2">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data} margin={{ bottom: 8, left: 0, right: 8, top: 8 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              label={{ value: "days", fill: "#64748b", fontSize: 11, dy: 8 }}
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              type="number"
            />
            <YAxis
              domain={["dataMax + 0.2", "dataMin - 0.2"]}
              label={{ value: "mag", angle: -90, fill: "#64748b", fontSize: 11, dx: -8 }}
              reversed
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              width={42}
            />
            <Tooltip
              contentStyle={{
                background: "#020617",
                border: "1px solid #334155",
                borderRadius: 6,
                color: "#e2e8f0",
                fontSize: 12,
              }}
              formatter={(value, name) => [Number(value).toFixed(3), name === "mag" ? "mag" : name]}
              labelFormatter={(value) => `day ${Number(value).toFixed(3)}`}
            />
            <Line dataKey="mag" dot={false} isAnimationActive={false} stroke="#67e8f9" strokeWidth={2} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
