"""Generate synthetic Rubin Night Watch alert data.

This script builds the static demo dataset used by the first version of the
app. The numbers are intentionally synthetic, but the shapes are meant to feel
like alert-stream data: repeated detections, moving-object drift, transient
brightening, stochastic variability, artifacts, and a few weird unknowns.

Run from the repository root:

    python scripts/generate_demo_data.py --n-alerts 20000 --n-objects 200 --seed 42
"""

from __future__ import annotations

import argparse
import gzip
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np


# Keep the high-level knobs near the top so the demo is easy to resize.
DEFAULT_ALERT_COUNT = 20_000
DEFAULT_OBJECT_COUNT = 200
DEFAULT_SEED = 42
BASE_MJD = 60_400.0
OBSERVING_WINDOW_DAYS = 30.0
PROBABILITY_TOLERANCE_DIGITS = 4

ALLOWED_CLASSES = [
    "variable_star",
    "asteroid",
    "supernova_candidate",
    "agn",
    "artifact",
    "unknown_anomaly",
]

CLASS_WEIGHTS = {
    "variable_star": 0.27,
    "asteroid": 0.17,
    "supernova_candidate": 0.20,
    "agn": 0.20,
    "artifact": 0.09,
    "unknown_anomaly": 0.07,
}

# These rates control how many alert detections each class tends to receive.
# Artifacts are usually sparse, while variables and AGN can repeat often.
ALERT_RATE_BY_CLASS = {
    "variable_star": 1.55,
    "asteroid": 1.15,
    "supernova_candidate": 1.05,
    "agn": 1.45,
    "artifact": 0.10,
    "unknown_anomaly": 0.55,
}

SCIENTIFIC_INTEREST_BY_CLASS = {
    "variable_star": 0.35,
    "asteroid": 0.45,
    "supernova_candidate": 0.88,
    "agn": 0.42,
    "artifact": 0.08,
    "unknown_anomaly": 0.92,
}


@dataclass(frozen=True)
class ObjectSeed:
    """The object-level parameters that alerts and detailed JSON share."""

    object_id: str
    class_label: str
    ra: float
    dec: float
    alert_count: int
    alert_times: tuple[float, ...]
    first_seen_mjd: float
    last_seen_mjd: float
    base_mag: float
    amplitude: float
    class_probabilities: dict[str, float]
    anomaly_score: float
    priority_score: float
    artifact_likelihood: float
    flags: list[str]
    short_explanation: str
    period_days: float
    drift_ra_per_day: float
    drift_dec_per_day: float
    peak_mjd: float


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--n-alerts", type=int, default=DEFAULT_ALERT_COUNT)
    parser.add_argument("--n-objects", type=int, default=DEFAULT_OBJECT_COUNT)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path("data"),
        help="Output directory for demo_alerts.json.gz and demo_objects/.",
    )
    parser.add_argument(
        "--write-uncompressed",
        action="store_true",
        help="Also write data/demo_alerts.json for easier browser/dev inspection.",
    )
    return parser.parse_args()


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, float(value)))


def rounded(value: float, digits: int = 6) -> float:
    return round(float(value), digits)


def object_id_for(index: int) -> str:
    return f"object_{index:06d}"


def choose_object_classes(n_objects: int, rng: np.random.Generator) -> list[str]:
    if n_objects < len(ALLOWED_CLASSES):
        raise ValueError(f"--n-objects must be at least {len(ALLOWED_CLASSES)}")

    # Force at least one object per class so filters and legends always have data.
    labels = list(ALLOWED_CLASSES)
    remaining = n_objects - len(labels)
    weights = np.array([CLASS_WEIGHTS[label] for label in ALLOWED_CLASSES], dtype=float)
    weights = weights / weights.sum()
    labels.extend(rng.choice(ALLOWED_CLASSES, size=remaining, p=weights).tolist())
    rng.shuffle(labels)
    return labels


def allocate_alert_counts(labels: list[str], n_alerts: int, rng: np.random.Generator) -> list[int]:
    if n_alerts < len(labels):
        raise ValueError("--n-alerts must be at least --n-objects so every object can appear")

    raw_weights = np.array(
        [
            ALERT_RATE_BY_CLASS[label] * float(rng.lognormal(mean=0.0, sigma=0.35))
            for label in labels
        ],
        dtype=float,
    )
    weights = raw_weights / raw_weights.sum()

    # Give every object at least one alert, then distribute the rest exactly.
    extra_counts = rng.multinomial(n_alerts - len(labels), weights)
    return (extra_counts + 1).astype(int).tolist()


def make_class_probabilities(label: str, rng: np.random.Generator) -> dict[str, float]:
    # Dirichlet concentration controls certainty. Unknown anomalies are meant to
    # look less classifiable, while artifacts and ordinary classes can be sharper.
    concentration = np.full(len(ALLOWED_CLASSES), 0.65, dtype=float)
    label_index = ALLOWED_CLASSES.index(label)

    if label == "unknown_anomaly":
        concentration[:] = 1.25
        concentration[label_index] = 2.2
    elif label == "artifact":
        concentration[label_index] = 8.5
    elif label == "supernova_candidate":
        concentration[label_index] = 7.5
    else:
        concentration[label_index] = 9.0

    values = rng.dirichlet(concentration)

    # Round for compact readable JSON, then adjust one key so the sum stays sane.
    rounded_values = [round(float(value), PROBABILITY_TOLERANCE_DIGITS) for value in values]
    correction = round(1.0 - sum(rounded_values), PROBABILITY_TOLERANCE_DIGITS)
    rounded_values[label_index] = round(rounded_values[label_index] + correction, PROBABILITY_TOLERANCE_DIGITS)
    return dict(zip(ALLOWED_CLASSES, rounded_values, strict=True))


def score_components(label: str, class_probabilities: dict[str, float], rng: np.random.Generator) -> dict[str, float]:
    low_confidence = 1.0 - max(class_probabilities.values())

    if label == "variable_star":
        components = {
            "unusual_light_curve": rng.uniform(0.25, 0.65),
            "fast_change": rng.uniform(0.15, 0.45),
            "rare_context": rng.uniform(0.10, 0.35),
            "isolation": rng.uniform(0.10, 0.35),
            "artifact_likelihood": rng.uniform(0.02, 0.12),
        }
    elif label == "asteroid":
        near_earth_like = rng.random() < 0.14
        components = {
            "unusual_light_curve": rng.uniform(0.20, 0.45),
            "fast_change": rng.uniform(0.40, 0.78),
            "rare_context": rng.uniform(0.45, 0.85) if near_earth_like else rng.uniform(0.18, 0.42),
            "isolation": rng.uniform(0.25, 0.55),
            "artifact_likelihood": rng.uniform(0.03, 0.16),
        }
    elif label == "supernova_candidate":
        components = {
            "unusual_light_curve": rng.uniform(0.55, 0.92),
            "fast_change": rng.uniform(0.55, 0.92),
            "rare_context": rng.uniform(0.40, 0.80),
            "isolation": rng.uniform(0.20, 0.55),
            "artifact_likelihood": rng.uniform(0.03, 0.20),
        }
    elif label == "agn":
        components = {
            "unusual_light_curve": rng.uniform(0.25, 0.58),
            "fast_change": rng.uniform(0.08, 0.38),
            "rare_context": rng.uniform(0.18, 0.45),
            "isolation": rng.uniform(0.12, 0.35),
            "artifact_likelihood": rng.uniform(0.02, 0.13),
        }
    elif label == "artifact":
        components = {
            "unusual_light_curve": rng.uniform(0.55, 0.98),
            "fast_change": rng.uniform(0.45, 0.95),
            "rare_context": rng.uniform(0.25, 0.70),
            "isolation": rng.uniform(0.60, 0.98),
            "artifact_likelihood": rng.uniform(0.70, 0.98),
        }
    else:
        components = {
            "unusual_light_curve": rng.uniform(0.70, 0.98),
            "fast_change": rng.uniform(0.45, 0.88),
            "rare_context": rng.uniform(0.65, 0.98),
            "isolation": rng.uniform(0.35, 0.85),
            "artifact_likelihood": rng.uniform(0.08, 0.35),
        }

    components["low_classification_confidence"] = clamp(low_confidence)
    return components


def compute_scores(
    label: str,
    base_mag: float,
    class_probabilities: dict[str, float],
    rng: np.random.Generator,
) -> tuple[float, float, float, list[str]]:
    components = score_components(label, class_probabilities, rng)

    anomaly = (
        0.30 * components["unusual_light_curve"]
        + 0.20 * components["fast_change"]
        + 0.20 * components["low_classification_confidence"]
        + 0.15 * components["rare_context"]
        + 0.15 * components["isolation"]
    )

    # Brighter objects are easier to follow up. Magnitude is inverted, so lower is better.
    brightness_observability = clamp((23.2 - base_mag) / 5.2)
    scientific_interest = SCIENTIFIC_INTEREST_BY_CLASS[label]
    artifact_likelihood = components["artifact_likelihood"]
    priority = (
        0.40 * anomaly
        + 0.25 * brightness_observability
        + 0.20 * scientific_interest
        - 0.30 * artifact_likelihood
    )

    flags: list[str] = []
    if components["fast_change"] > 0.62:
        flags.append("fast_brightening" if label != "asteroid" else "moving_object_like")
    if components["low_classification_confidence"] > 0.42:
        flags.append("low_classification_confidence")
    if components["rare_context"] > 0.62:
        flags.append("rare_context")
    if components["isolation"] > 0.65:
        flags.append("isolated_detection")
    if artifact_likelihood > 0.65:
        flags.append("artifact_like_morphology")
    if label in {"supernova_candidate", "agn"} and rng.random() < 0.72:
        flags.append("possible_host_galaxy")
    if label == "unknown_anomaly":
        flags.append("unusual_demo_feature_mix")

    return rounded(clamp(anomaly), 4), rounded(clamp(priority), 4), rounded(artifact_likelihood, 4), flags


def make_explanation(label: str, flags: list[str]) -> str:
    if label == "variable_star":
        return "Repeated variable behavior with a synthetic periodic pattern."
    if label == "asteroid":
        return "Moving-object-like behavior across multiple synthetic detections."
    if label == "supernova_candidate":
        return "Fast brightening, weak class certainty, possible host-galaxy context."
    if label == "agn":
        return "Stochastic variability with possible host-galaxy context."
    if label == "artifact":
        return "High anomaly score but likely artifact-like morphology."
    if "low_classification_confidence" in flags:
        return "Unusual demo feature mix with low class certainty, flagged for review."
    return "Unusual demo feature mix, flagged for review."


def magnitude_at(label: str, time_mjd: float, obj: ObjectSeed, rng: np.random.Generator) -> float:
    t = time_mjd - obj.first_seen_mjd

    if label == "variable_star":
        phase = 2.0 * math.pi * t / obj.period_days
        mag = obj.base_mag + obj.amplitude * math.sin(phase) + rng.normal(0.0, 0.04)
    elif label == "asteroid":
        mag = obj.base_mag + 0.18 * math.sin(1.7 * t) + rng.normal(0.0, 0.08)
    elif label == "supernova_candidate":
        # A simple transient curve: brighten toward peak, then fade more slowly.
        days_from_peak = time_mjd - obj.peak_mjd
        if days_from_peak < 0:
            mag = obj.base_mag + 0.22 * abs(days_from_peak)
        else:
            mag = obj.base_mag + 0.08 * days_from_peak
        mag += rng.normal(0.0, 0.05)
    elif label == "agn":
        mag = obj.base_mag + rng.normal(0.0, obj.amplitude * 0.35) + 0.08 * math.sin(t / 3.0)
    elif label == "artifact":
        mag = obj.base_mag + rng.normal(0.0, 0.45)
    else:
        mag = obj.base_mag + 0.55 * math.sin(t * 1.9) + rng.normal(0.0, 0.18)

    return rounded(mag, 4)


def generate_times(label: str, count: int, first_seen: float, rng: np.random.Generator) -> np.ndarray:
    if label == "artifact":
        span = rng.uniform(0.02, 0.35)
    elif label == "supernova_candidate":
        span = rng.uniform(8.0, 24.0)
    elif label == "asteroid":
        span = rng.uniform(0.15, 3.5)
    else:
        span = rng.uniform(8.0, OBSERVING_WINDOW_DAYS)

    times = first_seen + np.sort(rng.random(count) * span)
    return times


def build_objects(n_objects: int, n_alerts: int, rng: np.random.Generator) -> list[ObjectSeed]:
    labels = choose_object_classes(n_objects, rng)
    counts = allocate_alert_counts(labels, n_alerts, rng)
    objects: list[ObjectSeed] = []

    for index, (label, count) in enumerate(zip(labels, counts, strict=True), start=1):
        object_id = object_id_for(index)
        ra = float(rng.uniform(0.0, 360.0))
        dec = float(rng.uniform(-75.0, 25.0))
        first_seen = BASE_MJD + float(rng.uniform(0.0, OBSERVING_WINDOW_DAYS * 0.55))
        times = generate_times(label, count, first_seen, rng)
        last_seen = float(times[-1])

        base_mag = {
            "variable_star": rng.uniform(17.0, 22.2),
            "asteroid": rng.uniform(18.5, 23.0),
            "supernova_candidate": rng.uniform(18.2, 22.4),
            "agn": rng.uniform(18.0, 22.7),
            "artifact": rng.uniform(16.0, 23.5),
            "unknown_anomaly": rng.uniform(18.0, 23.0),
        }[label]

        amplitude = {
            "variable_star": rng.uniform(0.18, 1.20),
            "asteroid": rng.uniform(0.05, 0.35),
            "supernova_candidate": rng.uniform(0.50, 2.20),
            "agn": rng.uniform(0.12, 0.75),
            "artifact": rng.uniform(0.40, 2.00),
            "unknown_anomaly": rng.uniform(0.55, 2.40),
        }[label]

        class_probabilities = make_class_probabilities(label, rng)
        anomaly_score, priority_score, artifact_likelihood, flags = compute_scores(
            label, base_mag, class_probabilities, rng
        )

        period_days = float(rng.uniform(0.35, 9.0))
        drift_ra_per_day = float(rng.uniform(-0.22, 0.22)) if label == "asteroid" else float(rng.normal(0.0, 0.002))
        drift_dec_per_day = float(rng.uniform(-0.08, 0.08)) if label == "asteroid" else float(rng.normal(0.0, 0.001))
        peak_mjd = first_seen + float(rng.uniform(2.0, 9.0))

        objects.append(
            ObjectSeed(
                object_id=object_id,
                class_label=label,
                ra=rounded(ra),
                dec=rounded(dec),
                alert_count=count,
                alert_times=tuple(rounded(float(time)) for time in times),
                first_seen_mjd=rounded(float(times[0])),
                last_seen_mjd=rounded(last_seen),
                base_mag=rounded(base_mag),
                amplitude=rounded(amplitude),
                class_probabilities=class_probabilities,
                anomaly_score=anomaly_score,
                priority_score=priority_score,
                artifact_likelihood=artifact_likelihood,
                flags=flags,
                short_explanation=make_explanation(label, flags),
                period_days=period_days,
                drift_ra_per_day=drift_ra_per_day,
                drift_dec_per_day=drift_dec_per_day,
                peak_mjd=peak_mjd,
            )
        )

    return objects


def generate_alerts_for_object(obj: ObjectSeed, rng: np.random.Generator) -> list[dict[str, Any]]:
    reference_mag = obj.base_mag + obj.amplitude * 0.25
    class_prob = obj.class_probabilities[obj.class_label]
    alerts: list[dict[str, Any]] = []

    for time_mjd in obj.alert_times:
        dt = float(time_mjd - obj.first_seen_mjd)
        ra = (obj.ra + obj.drift_ra_per_day * dt + rng.normal(0.0, 0.006)) % 360.0
        dec = clamp(obj.dec + obj.drift_dec_per_day * dt + rng.normal(0.0, 0.004), -90.0, 90.0)
        mag = magnitude_at(obj.class_label, float(time_mjd), obj, rng)
        delta_mag = rounded(mag - reference_mag, 4)

        alerts.append(
            {
                "object_id": obj.object_id,
                "ra": rounded(ra),
                "dec": rounded(dec),
                "mjd": rounded(float(time_mjd)),
                "class_label": obj.class_label,
                "class_prob": rounded(clamp(class_prob + rng.normal(0.0, 0.015)), 4),
                "anomaly_score": rounded(clamp(obj.anomaly_score + rng.normal(0.0, 0.025)), 4),
                "priority_score": rounded(clamp(obj.priority_score + rng.normal(0.0, 0.02)), 4),
                "mag": mag,
                "delta_mag": delta_mag,
            }
        )

    return alerts


def generate_light_curve(obj: ObjectSeed, rng: np.random.Generator) -> list[dict[str, float]]:
    point_count = {
        "variable_star": int(rng.integers(28, 58)),
        "asteroid": int(rng.integers(6, 16)),
        "supernova_candidate": int(rng.integers(18, 42)),
        "agn": int(rng.integers(24, 60)),
        "artifact": int(rng.integers(1, 5)),
        "unknown_anomaly": int(rng.integers(10, 28)),
    }[obj.class_label]

    times = np.linspace(obj.first_seen_mjd, obj.last_seen_mjd, point_count)
    light_curve = []
    for time_mjd in times:
        light_curve.append(
            {
                "mjd": rounded(float(time_mjd)),
                "mag": magnitude_at(obj.class_label, float(time_mjd), obj, rng),
                "mag_err": rounded(float(rng.uniform(0.03, 0.22)), 4),
            }
        )
    return light_curve


def detailed_object_json(obj: ObjectSeed, rng: np.random.Generator) -> dict[str, Any]:
    return {
        "object_id": obj.object_id,
        "ra": obj.ra,
        "dec": obj.dec,
        "first_seen_mjd": obj.first_seen_mjd,
        "last_seen_mjd": obj.last_seen_mjd,
        "class_probabilities": obj.class_probabilities,
        "anomaly_score": obj.anomaly_score,
        "priority_score": obj.priority_score,
        "short_explanation": obj.short_explanation,
        "flags": obj.flags,
        "light_curve": generate_light_curve(obj, rng),
    }


def prepare_output_dirs(data_dir: Path) -> Path:
    data_dir.mkdir(parents=True, exist_ok=True)
    objects_dir = data_dir / "demo_objects"
    objects_dir.mkdir(parents=True, exist_ok=True)

    # Only clean files that this script owns. This avoids stale object JSON when
    # switching from a larger generated set to a smaller one.
    for old_file in objects_dir.glob("object_*.json"):
        old_file.unlink()

    return objects_dir


def write_json_gzip(path: Path, payload: Any) -> None:
    with gzip.open(path, "wt", encoding="utf-8") as file:
        json.dump(payload, file, separators=(",", ":"))


def write_json(path: Path, payload: Any, pretty: bool = False) -> None:
    with path.open("w", encoding="utf-8") as file:
        if pretty:
            json.dump(payload, file, indent=2)
        else:
            json.dump(payload, file, separators=(",", ":"))
        file.write("\n")


def main() -> None:
    args = parse_args()
    rng = np.random.default_rng(args.seed)

    objects_dir = prepare_output_dirs(args.data_dir)
    objects = build_objects(args.n_objects, args.n_alerts, rng)

    all_alerts: list[dict[str, Any]] = []
    for obj in objects:
        all_alerts.extend(generate_alerts_for_object(obj, rng))

    # Sort alerts in time order so the frontend can reason about windows cheaply.
    all_alerts.sort(key=lambda alert: alert["mjd"])

    alerts_gzip_path = args.data_dir / "demo_alerts.json.gz"
    write_json_gzip(alerts_gzip_path, all_alerts)

    if args.write_uncompressed:
        write_json(args.data_dir / "demo_alerts.json", all_alerts)

    for obj in objects:
        write_json(objects_dir / f"{obj.object_id}.json", detailed_object_json(obj, rng), pretty=True)

    class_counts: dict[str, int] = {label: 0 for label in ALLOWED_CLASSES}
    for obj in objects:
        class_counts[obj.class_label] += 1

    print(f"Wrote {len(all_alerts):,} alerts to {alerts_gzip_path}")
    print(f"Wrote {len(objects):,} detailed objects to {objects_dir}")
    print("Object classes:")
    for label, count in class_counts.items():
        print(f"  {label}: {count}")


if __name__ == "__main__":
    main()
