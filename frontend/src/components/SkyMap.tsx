export default function SkyMap() {
  return (
    <div className="relative h-full min-h-[360px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.10),_transparent_34%),linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:100%_100%,48px_48px,48px_48px]" />
      <div className="absolute inset-5 rounded-md border border-slate-800/90 bg-slate-950/40">
        <div className="absolute left-3 top-3 text-xs uppercase text-slate-500">RA / Dec Projection</div>
        <div className="absolute bottom-3 left-3 text-xs text-slate-500">Alert map placeholder</div>
        <div className="absolute left-[18%] top-[42%] size-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
        <div className="absolute left-[52%] top-[34%] size-2 rounded-full bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.75)]" />
        <div className="absolute left-[73%] top-[61%] size-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.75)]" />
        <div className="absolute left-[39%] top-[68%] size-2 rounded-full bg-fuchsia-300 shadow-[0_0_16px_rgba(240,171,252,0.75)]" />
      </div>
    </div>
  );
}
