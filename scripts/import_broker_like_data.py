"""Import broker-like alert data into the Rubin Night Watch static schema.

This is the first real-data bridge. It does not connect to a live broker API;
it transforms a local CSV or JSON export into the same internal files consumed
by the frontend.

Example:

    python scripts/import_broker_like_data.py input.csv --output-dir data/imported_broker_like
"""

from __future__ import annotations

import argparse
import gzip
import json
import math
from pathlib import Path
from typing import Any

import pandas as pd


ALLOWED_CLASSES = [
    "variable_star",
    "asteroid",
    "supernova_candidate",
    "agn",
    "artifact",
    "unknown_anomaly",
]

FIELD_ALIASES = {
    "object_id": ["object_id", "objectId", "objectIdStr", "oid", "diaObjectId", "source_id"],
    "ra": ["ra", "ra_deg", "raMean", "raMean_deg"],
    "dec": ["dec", "dec_deg", "decMean", "decMean_deg"],
    "mjd": ["mjd", "midpointMjdTai", "alert_mjd"],
    "jd": ["jd", "julian_date"],
    "class_label": ["class_label", "class", "classification", "broker_class", "type"],
    "class_prob": ["class_prob", "prob", "probability", "broker_prob"],
    "anomaly_score": ["anomaly_score", "anomaly", "rb", "drb"],
    "priority_score": ["priority_score", "priority"],
    "mag": ["mag", "magpsf", "psfMag", "magnitude"],
    "delta_mag": ["delta_mag", "deltaMag", "magdiff"],
}

CLASS_ALIASES = {
    "variable": "variable_star",
    "variable_star": "variable_star",
    "asteroid": "asteroid",
    "minor_planet": "asteroid",
    "moving_object": "asteroid",
    "sn": "supernova_candidate",
    "supernova": "supernova_candidate",
    "supernova_candidate": "supernova_candidate",
    "agn": "agn",
    "qso": "agn",
    "artifact": "artifact",
    "bogus": "artifact",
    "unknown": "unknown_anomaly",
    "unknown_anomaly": "unknown_anomaly",
    "anomaly": "unknown_anomaly",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_path", type=Path, help="Broker-like CSV or JSON file to import.")
    parser.add_argument("--output-dir", type=Path, default=Path("data/imported_broker_like"))
    parser.add_argument("--source-name", default="broker_like_import")
    return parser.parse_args()


def read_input(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise SystemExit(f"Input file does not exist: {path}")
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path)
    if path.suffix.lower() == ".json":
        payload = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(payload, dict) and "alerts" in payload:
            payload = payload["alerts"]
        return pd.DataFrame(payload)
    raise SystemExit("Input must be .csv or .json")


def first_present(row: pd.Series, canonical_field: str) -> Any:
    for field in FIELD_ALIASES[canonical_field]:
        if field in row and pd.notna(row[field]):
            return row[field]
    return None


def number_or_default(value: Any, default: float) -> float:
    try:
        result = float(value)
    except (TypeError, ValueError):
        return default
    if not math.isfinite(result):
        return default
    return result


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def source_object_key(value: Any, index: int) -> str:
    if value is None:
        return f"row_{index:06d}"
    text = str(value).strip()
    if not text:
        return f"row_{index:06d}"
    return text


def normalize_class(value: Any) -> str:
    if value is None:
        return "unknown_anomaly"
    key = str(value).strip().lower().replace(" ", "_").replace("-", "_")
    return CLASS_ALIASES.get(key, "unknown_anomaly")


def jd_to_mjd(jd: float) -> float:
    return jd - 2_400_000.5


def normalize_alert(row: pd.Series, index: int, object_id: str) -> dict[str, Any]:
    mjd_value = first_present(row, "mjd")
    if mjd_value is None:
        jd_value = first_present(row, "jd")
        mjd = jd_to_mjd(number_or_default(jd_value, 2_460_400.5))
    else:
        mjd = number_or_default(mjd_value, 60_400.0)

    class_label = normalize_class(first_present(row, "class_label"))
    class_prob = clamp(number_or_default(first_present(row, "class_prob"), 0.5))
    anomaly_score = first_present(row, "anomaly_score")
    priority_score = first_present(row, "priority_score")
    mag = number_or_default(first_present(row, "mag"), 21.0)

    # If the source lacks scores, keep the adapter transparent and conservative.
    anomaly = clamp(number_or_default(anomaly_score, 1.0 - class_prob))
    priority = clamp(number_or_default(priority_score, 0.45 * anomaly + 0.20 * clamp((23.0 - mag) / 5.0)))

    return {
        "object_id": object_id,
        "ra": round(number_or_default(first_present(row, "ra"), 0.0) % 360.0, 6),
        "dec": round(clamp(number_or_default(first_present(row, "dec"), 0.0), -90.0, 90.0), 6),
        "mjd": round(mjd, 6),
        "class_label": class_label,
        "class_prob": round(class_prob, 4),
        "anomaly_score": round(anomaly, 4),
        "priority_score": round(priority, 4),
        "mag": round(mag, 4),
        "delta_mag": round(number_or_default(first_present(row, "delta_mag"), 0.0), 4),
    }


def class_probabilities_for(alerts: list[dict[str, Any]]) -> dict[str, float]:
    probabilities = {label: 0.001 for label in ALLOWED_CLASSES}
    for alert in alerts:
        probabilities[alert["class_label"]] = max(probabilities[alert["class_label"]], float(alert["class_prob"]))
    total = sum(probabilities.values())
    return {label: round(value / total, 4) for label, value in probabilities.items()}


def detailed_object_for(object_id: str, alerts: list[dict[str, Any]], source_name: str) -> dict[str, Any]:
    alerts = sorted(alerts, key=lambda alert: alert["mjd"])
    best_alert = max(alerts, key=lambda alert: alert["priority_score"])
    return {
        "object_id": object_id,
        "ra": best_alert["ra"],
        "dec": best_alert["dec"],
        "first_seen_mjd": alerts[0]["mjd"],
        "last_seen_mjd": alerts[-1]["mjd"],
        "class_probabilities": class_probabilities_for(alerts),
        "anomaly_score": max(alert["anomaly_score"] for alert in alerts),
        "priority_score": max(alert["priority_score"] for alert in alerts),
        "short_explanation": f"Broker-like import from {source_name}; mapped into the Rubin Night Watch internal schema.",
        "flags": ["broker_like_import", f"source_{source_name}"],
        "light_curve": [
            {"mjd": alert["mjd"], "mag": alert["mag"], "mag_err": 0.15}
            for alert in alerts
        ],
    }


def write_json(path: Path, payload: Any, pretty: bool = False) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2 if pretty else None, separators=None if pretty else (",", ":"))
        file.write("\n")


def write_json_gzip(path: Path, payload: Any) -> None:
    with gzip.open(path, "wt", encoding="utf-8") as file:
        json.dump(payload, file, separators=(",", ":"))


def main() -> None:
    args = parse_args()
    frame = read_input(args.input_path)
    if frame.empty:
        raise SystemExit("Input contains no rows")

    source_to_internal_id: dict[str, str] = {}
    alerts: list[dict[str, Any]] = []
    for index, (_, row) in enumerate(frame.iterrows(), start=1):
        source_key = source_object_key(first_present(row, "object_id"), index)
        if source_key not in source_to_internal_id:
            source_to_internal_id[source_key] = f"object_{len(source_to_internal_id) + 1:06d}"
        alerts.append(normalize_alert(row, index, source_to_internal_id[source_key]))
    alerts.sort(key=lambda alert: alert["mjd"])

    objects_dir = args.output_dir / "demo_objects"
    objects_dir.mkdir(parents=True, exist_ok=True)
    for old_file in objects_dir.glob("*.json"):
        old_file.unlink()

    by_object: dict[str, list[dict[str, Any]]] = {}
    for alert in alerts:
        by_object.setdefault(alert["object_id"], []).append(alert)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    write_json_gzip(args.output_dir / "demo_alerts.json.gz", alerts)

    for object_id, object_alerts in sorted(by_object.items()):
        write_json(objects_dir / f"{object_id}.json", detailed_object_for(object_id, object_alerts, args.source_name), pretty=True)

    print(f"Imported {len(alerts):,} alerts")
    print(f"Wrote {len(by_object):,} objects")
    print(f"Output directory: {args.output_dir}")


if __name__ == "__main__":
    main()
