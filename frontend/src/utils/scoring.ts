import { CLASS_LABELS, type AlertPoint, type FilterState } from "../types";

export function createDefaultFilters(): FilterState {
  return {
    enabledClasses: Object.fromEntries(CLASS_LABELS.map((label) => [label, true])) as FilterState["enabledClasses"],
    colorMode: "class",
    minAnomalyScore: 0,
    minPriorityScore: 0,
    anomaliesOnly: false,
    transients: false,
    movingObjects: false,
    artifacts: false,
    unknowns: false,
  };
}

export function filterAlerts(alerts: AlertPoint[], filters: FilterState): AlertPoint[] {
  const quickLayersActive = filters.transients || filters.movingObjects || filters.artifacts || filters.unknowns;

  return alerts.filter((alert) => {
    if (!filters.enabledClasses[alert.class_label]) {
      return false;
    }
    if (alert.anomaly_score < filters.minAnomalyScore || alert.priority_score < filters.minPriorityScore) {
      return false;
    }
    if (filters.anomaliesOnly && alert.anomaly_score < 0.7) {
      return false;
    }
    if (!quickLayersActive) {
      return true;
    }
    return (
      (filters.transients && alert.class_label === "supernova_candidate") ||
      (filters.movingObjects && alert.class_label === "asteroid") ||
      (filters.artifacts && alert.class_label === "artifact") ||
      (filters.unknowns && alert.class_label === "unknown_anomaly")
    );
  });
}
