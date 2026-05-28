import { CLASS_LABELS, type AlertDatasetSummary, type AlertPoint, type ClassLabel, type DetailedObject } from "../types";

const ALERT_DATA_URLS = ["/data/demo_alerts.json", "/data/demo_alerts.json.gz"];
const DETAIL_OBJECT_BASE_URL = "/data/demo_objects";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isClassLabel(value: unknown): value is ClassLabel {
  return typeof value === "string" && CLASS_LABELS.includes(value as ClassLabel);
}

function assertAlertPoint(value: unknown, index: number): asserts value is AlertPoint {
  if (!isRecord(value)) {
    throw new Error(`Alert ${index} is not an object`);
  }

  const requiredNumbers = ["ra", "dec", "mjd", "class_prob", "anomaly_score", "priority_score", "mag", "delta_mag"];
  for (const field of requiredNumbers) {
    if (!isNumber(value[field])) {
      throw new Error(`Alert ${index} has invalid numeric field ${field}`);
    }
  }

  if (typeof value.object_id !== "string") {
    throw new Error(`Alert ${index} has invalid object_id`);
  }
  if (!isClassLabel(value.class_label)) {
    throw new Error(`Alert ${index} has unsupported class_label`);
  }
}

function assertDetailedObject(value: unknown, objectId: string): asserts value is DetailedObject {
  if (!isRecord(value)) {
    throw new Error(`${objectId} detail is not an object`);
  }
  if (value.object_id !== objectId) {
    throw new Error(`${objectId} detail object_id mismatch`);
  }

  const requiredNumbers = ["ra", "dec", "first_seen_mjd", "last_seen_mjd", "anomaly_score", "priority_score"];
  for (const field of requiredNumbers) {
    if (!isNumber(value[field])) {
      throw new Error(`${objectId} detail has invalid numeric field ${field}`);
    }
  }

  if (typeof value.short_explanation !== "string" || !Array.isArray(value.flags) || !Array.isArray(value.light_curve)) {
    throw new Error(`${objectId} detail has invalid display fields`);
  }
}

async function parsePossiblyCompressedJson<T>(response: Response, url: string): Promise<T> {
  if (!url.endsWith(".gz")) {
    return (await response.json()) as T;
  }

  if (response.headers.get("content-encoding")?.toLowerCase().includes("gzip")) {
    return (await response.json()) as T;
  }

  if (!response.body || !("DecompressionStream" in globalThis)) {
    throw new Error("This browser cannot decompress gzip demo data");
  }

  const decompressedStream = response.body.pipeThrough(new DecompressionStream("gzip"));
  return (await new Response(decompressedStream).json()) as T;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return parsePossiblyCompressedJson<T>(response, url);
}

export async function loadAlerts(): Promise<AlertPoint[]> {
  const errors: string[] = [];

  for (const url of ALERT_DATA_URLS) {
    try {
      const payload = await fetchJson<unknown>(url);
      if (!Array.isArray(payload)) {
        throw new Error(`${url} did not contain an alert array`);
      }
      payload.forEach((alert, index) => assertAlertPoint(alert, index));
      return payload;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(`Unable to load alert dataset. ${errors.join(" | ")}`);
}

export async function loadDetailedObject(objectId: string): Promise<DetailedObject> {
  const detail = await fetchJson<unknown>(`${DETAIL_OBJECT_BASE_URL}/${objectId}.json`);
  assertDetailedObject(detail, objectId);
  return detail;
}

export function summarizeAlerts(alerts: AlertPoint[]): AlertDatasetSummary {
  const classCounts = Object.fromEntries(CLASS_LABELS.map((label) => [label, 0])) as Record<ClassLabel, number>;
  const objectIds = new Set<string>();

  let mjdMin = Number.POSITIVE_INFINITY;
  let mjdMax = Number.NEGATIVE_INFINITY;
  let anomalyMax = 0;
  let priorityMax = 0;

  for (const alert of alerts) {
    classCounts[alert.class_label] += 1;
    objectIds.add(alert.object_id);
    mjdMin = Math.min(mjdMin, alert.mjd);
    mjdMax = Math.max(mjdMax, alert.mjd);
    anomalyMax = Math.max(anomalyMax, alert.anomaly_score);
    priorityMax = Math.max(priorityMax, alert.priority_score);
  }

  return {
    alertCount: alerts.length,
    objectCount: objectIds.size,
    mjdMin,
    mjdMax,
    classCounts,
    anomalyMax,
    priorityMax,
  };
}
