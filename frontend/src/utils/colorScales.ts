import type { AlertPoint, ClassLabel, ColorMode } from "../types";

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

export function scoreColor(value: number): string {
  const clamped = Math.max(0, Math.min(1, value));
  const hue = 205 - clamped * 165;
  return `hsl(${hue} 88% 64%)`;
}

export function alertColor(alert: AlertPoint, colorMode: ColorMode): string {
  if (colorMode === "anomaly_score") {
    return scoreColor(alert.anomaly_score);
  }
  if (colorMode === "priority_score") {
    return scoreColor(alert.priority_score);
  }
  return classColor(alert.class_label);
}
