export const CLASS_LABELS = [
  "variable_star",
  "asteroid",
  "supernova_candidate",
  "agn",
  "artifact",
  "unknown_anomaly",
] as const;

export type ClassLabel = (typeof CLASS_LABELS)[number];

export interface AlertPoint {
  object_id: string;
  ra: number;
  dec: number;
  mjd: number;
  class_label: ClassLabel;
  class_prob: number;
  anomaly_score: number;
  priority_score: number;
  mag: number;
  delta_mag: number;
}

export type ClassProbabilities = Record<ClassLabel, number>;

export interface LightCurvePoint {
  mjd: number;
  mag: number;
  mag_err: number;
}

export interface CutoutPaths {
  reference: string;
  new: string;
  difference: string;
}

export interface DetailedObject {
  object_id: string;
  ra: number;
  dec: number;
  first_seen_mjd: number;
  last_seen_mjd: number;
  class_probabilities: ClassProbabilities;
  anomaly_score: number;
  priority_score: number;
  short_explanation: string;
  flags: string[];
  light_curve: LightCurvePoint[];
  cutouts?: CutoutPaths;
}

export interface AlertDatasetSummary {
  alertCount: number;
  objectCount: number;
  mjdMin: number;
  mjdMax: number;
  classCounts: Record<ClassLabel, number>;
  anomalyMax: number;
  priorityMax: number;
}

export type ColorMode = "class" | "anomaly_score" | "priority_score";

export interface FilterState {
  enabledClasses: Record<ClassLabel, boolean>;
  colorMode: ColorMode;
  minAnomalyScore: number;
  minPriorityScore: number;
  anomaliesOnly: boolean;
  transients: boolean;
  movingObjects: boolean;
  artifacts: boolean;
  unknowns: boolean;
}
