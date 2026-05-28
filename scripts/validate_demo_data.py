"""Validate Rubin Night Watch demo data files.

The validator is intentionally boring and strict. It catches schema drift before
the frontend has to deal with it, and it exits non-zero when anything important
is wrong.

Run from the repository root after generating data:

    python scripts/validate_demo_data.py
"""

from __future__ import annotations

import argparse
import gzip
import json
import math
import re
from pathlib import Path
from typing import Any


ALLOWED_CLASSES = {
    "variable_star",
    "asteroid",
    "supernova_candidate",
    "agn",
    "artifact",
    "unknown_anomaly",
}

ALERT_REQUIRED_FIELDS = {
    "object_id",
    "ra",
    "dec",
    "mjd",
    "class_label",
    "class_prob",
    "anomaly_score",
    "priority_score",
    "mag",
    "delta_mag",
}

DETAIL_REQUIRED_FIELDS = {
    "object_id",
    "ra",
    "dec",
    "first_seen_mjd",
    "last_seen_mjd",
    "class_probabilities",
    "anomaly_score",
    "priority_score",
    "short_explanation",
    "flags",
    "light_curve",
}

LIGHT_CURVE_REQUIRED_FIELDS = {"mjd", "mag", "mag_err"}
CUTOUT_REQUIRED_FIELDS = {"reference", "new", "difference"}
OBJECT_ID_PATTERN = re.compile(r"^object_\d{6}$")
PROBABILITY_SUM_TOLERANCE = 0.001


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--frontend-public-dir", type=Path, default=Path("frontend/public"))
    parser.add_argument("--expected-alerts", type=int, default=None)
    parser.add_argument("--expected-objects", type=int, default=None)
    parser.add_argument("--max-errors", type=int, default=50)
    return parser.parse_args()


def add_error(errors: list[str], message: str, max_errors: int) -> None:
    # Keep output readable. Once the cap is hit, the final summary still tells
    # the user validation failed without dumping thousands of repeated errors.
    if len(errors) < max_errors:
        errors.append(message)


def is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def is_score(value: Any) -> bool:
    return is_number(value) and 0.0 <= float(value) <= 1.0


def is_valid_object_id(value: Any) -> bool:
    return isinstance(value, str) and OBJECT_ID_PATTERN.match(value) is not None


def load_alerts(alerts_path: Path) -> tuple[list[dict[str, Any]] | None, list[str]]:
    errors: list[str] = []
    if not alerts_path.exists():
        return None, [f"Missing alert file: {alerts_path}"]

    try:
        with gzip.open(alerts_path, "rt", encoding="utf-8") as file:
            payload = json.load(file)
    except OSError as exc:
        return None, [f"Could not read gzip alert file {alerts_path}: {exc}"]
    except json.JSONDecodeError as exc:
        return None, [f"Invalid JSON in {alerts_path}: {exc}"]

    if not isinstance(payload, list):
        errors.append(f"{alerts_path} must contain a JSON array")
        return None, errors

    bad_items = [index for index, item in enumerate(payload[:10]) if not isinstance(item, dict)]
    if bad_items:
        errors.append(f"Alert array contains non-object entries near indexes: {bad_items}")
        return None, errors

    return payload, errors


def validate_alerts(alerts: list[dict[str, Any]], expected_alerts: int | None, max_errors: int) -> tuple[set[str], list[str]]:
    errors: list[str] = []
    object_ids: set[str] = set()

    if expected_alerts is not None and len(alerts) != expected_alerts:
        add_error(errors, f"Expected {expected_alerts} alerts, found {len(alerts)}", max_errors)

    if not alerts:
        add_error(errors, "Alert file contains no alerts", max_errors)
        return object_ids, errors

    previous_mjd: float | None = None
    for index, alert in enumerate(alerts):
        missing = ALERT_REQUIRED_FIELDS - set(alert)
        if missing:
            add_error(errors, f"Alert {index} missing fields: {sorted(missing)}", max_errors)
            continue

        object_id = alert["object_id"]
        if not is_valid_object_id(object_id):
            add_error(errors, f"Alert {index} has invalid object_id: {object_id!r}", max_errors)
        else:
            object_ids.add(object_id)

        if not is_number(alert["ra"]) or not (0.0 <= float(alert["ra"]) < 360.0):
            add_error(errors, f"Alert {index} has RA outside [0, 360): {alert['ra']!r}", max_errors)

        if not is_number(alert["dec"]) or not (-90.0 <= float(alert["dec"]) <= 90.0):
            add_error(errors, f"Alert {index} has Dec outside [-90, 90]: {alert['dec']!r}", max_errors)

        if not is_number(alert["mjd"]):
            add_error(errors, f"Alert {index} has invalid mjd: {alert['mjd']!r}", max_errors)
        else:
            current_mjd = float(alert["mjd"])
            if previous_mjd is not None and current_mjd < previous_mjd:
                add_error(errors, f"Alert {index} is out of MJD order", max_errors)
            previous_mjd = current_mjd

        if alert["class_label"] not in ALLOWED_CLASSES:
            add_error(errors, f"Alert {index} has unsupported class_label: {alert['class_label']!r}", max_errors)

        for field in ("class_prob", "anomaly_score", "priority_score"):
            if not is_score(alert[field]):
                add_error(errors, f"Alert {index} has invalid {field}: {alert[field]!r}", max_errors)

        for field in ("mag", "delta_mag"):
            if not is_number(alert[field]):
                add_error(errors, f"Alert {index} has invalid {field}: {alert[field]!r}", max_errors)

    return object_ids, errors


def load_detail(path: Path) -> tuple[dict[str, Any] | None, str | None]:
    try:
        with path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except FileNotFoundError:
        return None, f"Missing detailed object file: {path}"
    except json.JSONDecodeError as exc:
        return None, f"Invalid JSON in {path}: {exc}"

    if not isinstance(payload, dict):
        return None, f"Detailed object file must contain one JSON object: {path}"
    return payload, None


def validate_class_probabilities(
    object_id: str,
    probabilities: Any,
    errors: list[str],
    max_errors: int,
) -> None:
    if not isinstance(probabilities, dict):
        add_error(errors, f"{object_id} class_probabilities must be an object", max_errors)
        return

    missing = ALLOWED_CLASSES - set(probabilities)
    extra = set(probabilities) - ALLOWED_CLASSES
    if missing:
        add_error(errors, f"{object_id} class_probabilities missing classes: {sorted(missing)}", max_errors)
    if extra:
        add_error(errors, f"{object_id} class_probabilities has unsupported classes: {sorted(extra)}", max_errors)

    total = 0.0
    for label, value in probabilities.items():
        if label not in ALLOWED_CLASSES:
            continue
        if not is_score(value):
            add_error(errors, f"{object_id} has invalid probability for {label}: {value!r}", max_errors)
        else:
            total += float(value)

    if abs(total - 1.0) > PROBABILITY_SUM_TOLERANCE:
        add_error(errors, f"{object_id} class probabilities sum to {total:.6f}, expected about 1", max_errors)


def validate_light_curve(object_id: str, light_curve: Any, errors: list[str], max_errors: int) -> None:
    if not isinstance(light_curve, list) or not light_curve:
        add_error(errors, f"{object_id} light_curve must be a non-empty array", max_errors)
        return

    previous_mjd: float | None = None
    for index, point in enumerate(light_curve):
        if not isinstance(point, dict):
            add_error(errors, f"{object_id} light_curve[{index}] must be an object", max_errors)
            continue

        missing = LIGHT_CURVE_REQUIRED_FIELDS - set(point)
        if missing:
            add_error(errors, f"{object_id} light_curve[{index}] missing fields: {sorted(missing)}", max_errors)
            continue

        if not is_number(point["mjd"]):
            add_error(errors, f"{object_id} light_curve[{index}] has invalid mjd: {point['mjd']!r}", max_errors)
        else:
            current_mjd = float(point["mjd"])
            if previous_mjd is not None and current_mjd < previous_mjd:
                add_error(errors, f"{object_id} light_curve is not sorted by mjd", max_errors)
            previous_mjd = current_mjd

        if not is_number(point["mag"]):
            add_error(errors, f"{object_id} light_curve[{index}] has invalid mag: {point['mag']!r}", max_errors)

        if not is_number(point["mag_err"]) or float(point["mag_err"]) < 0.0:
            add_error(errors, f"{object_id} light_curve[{index}] has invalid mag_err: {point['mag_err']!r}", max_errors)


def cutout_path_to_file(public_dir: Path, public_path: str) -> Path:
    # Public paths are browser-rooted, so "/cutouts/a.webp" maps to
    # "frontend/public/cutouts/a.webp".
    return public_dir / public_path.lstrip("/")


def validate_cutouts(
    object_id: str,
    cutouts: Any,
    public_dir: Path,
    errors: list[str],
    max_errors: int,
) -> None:
    if cutouts is None:
        return

    if not isinstance(cutouts, dict):
        add_error(errors, f"{object_id} cutouts must be an object when present", max_errors)
        return

    missing = CUTOUT_REQUIRED_FIELDS - set(cutouts)
    if missing:
        add_error(errors, f"{object_id} cutouts missing fields: {sorted(missing)}", max_errors)

    for field in CUTOUT_REQUIRED_FIELDS:
        path_value = cutouts.get(field)
        if not isinstance(path_value, str) or not path_value.startswith("/"):
            add_error(errors, f"{object_id} cutouts.{field} must be a browser-rooted path", max_errors)
            continue

        file_path = cutout_path_to_file(public_dir, path_value)
        if not file_path.exists():
            add_error(errors, f"{object_id} cutout file does not exist: {file_path}", max_errors)


def validate_detail(
    object_id: str,
    detail: dict[str, Any],
    detail_path: Path,
    public_dir: Path,
    max_errors: int,
) -> list[str]:
    errors: list[str] = []
    missing = DETAIL_REQUIRED_FIELDS - set(detail)
    if missing:
        add_error(errors, f"{object_id} detail missing fields: {sorted(missing)}", max_errors)
        return errors

    if detail["object_id"] != object_id:
        add_error(errors, f"{detail_path} object_id does not match filename: {detail['object_id']!r}", max_errors)

    if not is_valid_object_id(detail["object_id"]):
        add_error(errors, f"{detail_path} has invalid object_id: {detail['object_id']!r}", max_errors)

    if not is_number(detail["ra"]) or not (0.0 <= float(detail["ra"]) < 360.0):
        add_error(errors, f"{object_id} has invalid ra: {detail['ra']!r}", max_errors)

    if not is_number(detail["dec"]) or not (-90.0 <= float(detail["dec"]) <= 90.0):
        add_error(errors, f"{object_id} has invalid dec: {detail['dec']!r}", max_errors)

    if not is_number(detail["first_seen_mjd"]):
        add_error(errors, f"{object_id} has invalid first_seen_mjd", max_errors)

    if not is_number(detail["last_seen_mjd"]):
        add_error(errors, f"{object_id} has invalid last_seen_mjd", max_errors)
    elif is_number(detail["first_seen_mjd"]) and float(detail["last_seen_mjd"]) < float(detail["first_seen_mjd"]):
        add_error(errors, f"{object_id} last_seen_mjd is earlier than first_seen_mjd", max_errors)

    for field in ("anomaly_score", "priority_score"):
        if not is_score(detail[field]):
            add_error(errors, f"{object_id} has invalid {field}: {detail[field]!r}", max_errors)

    if not isinstance(detail["short_explanation"], str) or not detail["short_explanation"].strip():
        add_error(errors, f"{object_id} short_explanation must be a non-empty string", max_errors)

    if not isinstance(detail["flags"], list) or not all(isinstance(flag, str) for flag in detail["flags"]):
        add_error(errors, f"{object_id} flags must be an array of strings", max_errors)

    validate_class_probabilities(object_id, detail["class_probabilities"], errors, max_errors)
    validate_light_curve(object_id, detail["light_curve"], errors, max_errors)
    validate_cutouts(object_id, detail.get("cutouts"), public_dir, errors, max_errors)
    return errors


def validate_details(
    object_ids: set[str],
    data_dir: Path,
    public_dir: Path,
    expected_objects: int | None,
    max_errors: int,
) -> list[str]:
    errors: list[str] = []
    objects_dir = data_dir / "demo_objects"

    if expected_objects is not None and len(object_ids) != expected_objects:
        add_error(errors, f"Expected {expected_objects} unique objects in alerts, found {len(object_ids)}", max_errors)

    if not objects_dir.exists():
        return [f"Missing detailed object directory: {objects_dir}"]

    for object_id in sorted(object_ids):
        detail_path = objects_dir / f"{object_id}.json"
        detail, load_error = load_detail(detail_path)
        if load_error:
            add_error(errors, load_error, max_errors)
            continue
        if detail is not None:
            errors.extend(validate_detail(object_id, detail, detail_path, public_dir, max_errors))

    extra_files = sorted(path for path in objects_dir.glob("object_*.json") if path.stem not in object_ids)
    for path in extra_files[:5]:
        add_error(errors, f"Detailed object file has no matching alert: {path}", max_errors)
    if len(extra_files) > 5:
        add_error(errors, f"{len(extra_files) - 5} additional orphan detailed object files found", max_errors)

    return errors[:max_errors]


def main() -> None:
    args = parse_args()
    alerts_path = args.data_dir / "demo_alerts.json.gz"

    alerts, load_errors = load_alerts(alerts_path)
    if load_errors:
        for error in load_errors:
            print(f"ERROR: {error}")
        raise SystemExit(1)

    assert alerts is not None

    object_ids, alert_errors = validate_alerts(alerts, args.expected_alerts, args.max_errors)
    detail_errors = validate_details(
        object_ids=object_ids,
        data_dir=args.data_dir,
        public_dir=args.frontend_public_dir,
        expected_objects=args.expected_objects,
        max_errors=args.max_errors,
    )

    errors = (alert_errors + detail_errors)[: args.max_errors]
    if errors:
        print("Demo data validation failed:")
        for error in errors:
            print(f"ERROR: {error}")
        total_known_errors = len(alert_errors) + len(detail_errors)
        if total_known_errors > len(errors):
            print(f"ERROR: Output truncated after {len(errors)} of {total_known_errors} errors")
        raise SystemExit(1)

    print("Demo data validation passed")
    print(f"Alerts: {len(alerts):,}")
    print(f"Objects: {len(object_ids):,}")
    print(f"Alert file: {alerts_path}")
    print(f"Detailed objects: {args.data_dir / 'demo_objects'}")


if __name__ == "__main__":
    main()
