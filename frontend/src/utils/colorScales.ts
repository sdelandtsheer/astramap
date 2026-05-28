import type { ClassLabel } from "../types";

export const CLASS_COLORS: Record<ClassLabel, string> = {
  variable_star: "#67e8f9",
  asteroid: "#facc15",
  supernova_candidate: "#fb7185",
  agn: "#a78bfa",
  artifact: "#94a3b8",
  unknown_anomaly: "#34d399",
};

export function classColor(label: ClassLabel): string {
  return CLASS_COLORS[label];
}
