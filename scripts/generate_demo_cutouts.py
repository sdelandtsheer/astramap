"""Generate synthetic Rubin Night Watch blink-card cutouts.

The images are not astronomical data. They are compact synthetic WebP assets
that make the demo feel realistic enough to test the UI: reference, new, and
difference views for featured objects.

Run after generating demo data:

    python scripts/generate_demo_cutouts.py --n-featured 50 --seed 42
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


DEFAULT_FEATURED_COUNT = 50
DEFAULT_SEED = 42
DEFAULT_SIZE = 256
WEBP_QUALITY = 84

SUPPORTED_CLASSES = {
    "variable_star",
    "asteroid",
    "supernova_candidate",
    "agn",
    "artifact",
    "unknown_anomaly",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--n-featured", type=int, default=DEFAULT_FEATURED_COUNT)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--size", type=int, default=DEFAULT_SIZE)
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--cutout-dir", type=Path, default=Path("frontend/public/cutouts"))
    return parser.parse_args()


def load_objects(objects_dir: Path) -> list[tuple[Path, dict[str, Any]]]:
    object_files = sorted(objects_dir.glob("object_*.json"))
    if not object_files:
        raise SystemExit(f"No detailed object JSON files found in {objects_dir}")

    objects: list[tuple[Path, dict[str, Any]]] = []
    for path in object_files:
        with path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
        if not isinstance(payload, dict):
            raise SystemExit(f"Detailed object file must contain a JSON object: {path}")
        objects.append((path, payload))
    return objects


def select_featured_objects(objects: list[tuple[Path, dict[str, Any]]], n_featured: int) -> list[tuple[Path, dict[str, Any]]]:
    if n_featured <= 0:
        raise SystemExit("--n-featured must be positive")

    # Blink cards are most useful for triage, so pick top-priority objects first.
    ranked = sorted(
        objects,
        key=lambda item: (float(item[1].get("priority_score", 0.0)), float(item[1].get("anomaly_score", 0.0))),
        reverse=True,
    )
    return ranked[: min(n_featured, len(ranked))]


def clean_old_cutouts(cutout_dir: Path) -> None:
    cutout_dir.mkdir(parents=True, exist_ok=True)
    for path in cutout_dir.glob("object_*_*.webp"):
        path.unlink()


def add_gaussian(
    image: np.ndarray,
    x: float,
    y: float,
    amplitude: float,
    sigma: float,
    color: tuple[float, float, float] = (1.0, 1.0, 1.0),
) -> None:
    height, width, _ = image.shape
    radius = max(3, int(sigma * 4))
    x0 = max(0, int(x) - radius)
    x1 = min(width, int(x) + radius + 1)
    y0 = max(0, int(y) - radius)
    y1 = min(height, int(y) + radius + 1)
    if x0 >= x1 or y0 >= y1:
        return

    yy, xx = np.mgrid[y0:y1, x0:x1]
    kernel = np.exp(-(((xx - x) ** 2 + (yy - y) ** 2) / (2.0 * sigma**2))) * amplitude
    for channel, channel_scale in enumerate(color):
        image[y0:y1, x0:x1, channel] += kernel * channel_scale


def make_star_field(size: int, rng: np.random.Generator) -> np.ndarray:
    # Start with a low-noise detector-like background, then sprinkle compact stars.
    image = rng.normal(loc=10.0, scale=2.2, size=(size, size, 3)).astype(np.float32)
    star_count = int(size * 0.55)
    for _ in range(star_count):
        x = float(rng.uniform(0, size))
        y = float(rng.uniform(0, size))
        amplitude = float(rng.uniform(35, 160) ** rng.uniform(0.82, 1.02))
        sigma = float(rng.uniform(0.55, 1.7))
        color = (
            float(rng.uniform(0.82, 1.08)),
            float(rng.uniform(0.86, 1.10)),
            float(rng.uniform(0.92, 1.18)),
        )
        add_gaussian(image, x, y, amplitude, sigma, color)
    return image


def add_host_galaxy(image: np.ndarray, rng: np.random.Generator, center: tuple[float, float]) -> None:
    x, y = center
    # A soft, slightly warm blob is enough context for the demo cutout.
    add_gaussian(image, x, y, amplitude=float(rng.uniform(28, 55)), sigma=float(rng.uniform(9, 16)), color=(1.0, 0.86, 0.72))
    add_gaussian(image, x + rng.uniform(-4, 4), y + rng.uniform(-4, 4), amplitude=24, sigma=4.5, color=(1.0, 0.95, 0.88))


def to_image(array: np.ndarray) -> Image.Image:
    clipped = np.clip(array, 0, 255).astype(np.uint8)
    return Image.fromarray(clipped, mode="RGB")


def draw_artifact(image: Image.Image, rng: np.random.Generator) -> Image.Image:
    draw = ImageDraw.Draw(image, "RGBA")
    width, height = image.size
    choice = rng.choice(["streak", "blob", "edge"])

    if choice == "streak":
        y = int(rng.uniform(height * 0.15, height * 0.85))
        x0 = int(rng.uniform(-20, width * 0.25))
        x1 = int(rng.uniform(width * 0.75, width + 20))
        draw.line((x0, y, x1, y + int(rng.uniform(-22, 22))), fill=(230, 235, 255, 190), width=int(rng.integers(4, 9)))
    elif choice == "blob":
        x = int(rng.uniform(width * 0.2, width * 0.8))
        y = int(rng.uniform(height * 0.2, height * 0.8))
        radius = int(rng.uniform(12, 28))
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(245, 245, 255, 155))
    else:
        draw.rectangle((0, 0, int(width * rng.uniform(0.08, 0.18)), height), fill=(220, 230, 255, 120))

    return image.filter(ImageFilter.GaussianBlur(radius=0.7))


def add_object_signal(
    reference: np.ndarray,
    new: np.ndarray,
    difference: np.ndarray,
    obj: dict[str, Any],
    rng: np.random.Generator,
) -> None:
    size = reference.shape[0]
    label = likely_class(obj)
    center_x = float(size / 2 + rng.uniform(-18, 18))
    center_y = float(size / 2 + rng.uniform(-18, 18))

    if label in {"supernova_candidate", "agn"}:
        add_host_galaxy(reference, rng, (center_x + rng.uniform(-8, 8), center_y + rng.uniform(-8, 8)))
        add_host_galaxy(new, rng, (center_x + rng.uniform(-8, 8), center_y + rng.uniform(-8, 8)))

    if label == "variable_star":
        add_gaussian(reference, center_x, center_y, amplitude=70, sigma=1.8, color=(0.9, 0.95, 1.0))
        add_gaussian(new, center_x, center_y, amplitude=170, sigma=1.8, color=(1.0, 1.0, 1.0))
        add_gaussian(difference, center_x, center_y, amplitude=130, sigma=2.1, color=(0.6, 0.9, 1.0))
    elif label == "asteroid":
        add_gaussian(reference, center_x - 13, center_y - 3, amplitude=35, sigma=1.4, color=(0.9, 0.9, 1.0))
        add_gaussian(new, center_x + 15, center_y + 5, amplitude=155, sigma=1.5, color=(1.0, 1.0, 0.88))
        add_gaussian(difference, center_x + 15, center_y + 5, amplitude=135, sigma=1.8, color=(1.0, 0.9, 0.55))
        add_gaussian(difference, center_x - 13, center_y - 3, amplitude=45, sigma=1.8, color=(0.25, 0.35, 0.9))
    elif label == "supernova_candidate":
        add_gaussian(new, center_x, center_y, amplitude=190, sigma=1.9, color=(1.0, 0.95, 0.78))
        add_gaussian(difference, center_x, center_y, amplitude=175, sigma=2.2, color=(1.0, 0.84, 0.48))
    elif label == "agn":
        add_gaussian(reference, center_x, center_y, amplitude=75, sigma=2.4, color=(0.95, 0.92, 0.86))
        add_gaussian(new, center_x, center_y, amplitude=125, sigma=2.4, color=(1.0, 0.95, 0.86))
        add_gaussian(difference, center_x, center_y, amplitude=75, sigma=2.8, color=(0.75, 0.9, 1.0))
    elif label == "unknown_anomaly":
        for dx, dy in [(-5, -4), (7, 5), (0, 10)]:
            add_gaussian(new, center_x + dx, center_y + dy, amplitude=110, sigma=2.1, color=(0.75, 1.0, 0.9))
            add_gaussian(difference, center_x + dx, center_y + dy, amplitude=100, sigma=2.4, color=(0.55, 1.0, 0.78))
    else:
        # Artifacts are drawn after array conversion because lines and edge
        # effects are easier to express with Pillow drawing primitives.
        pass


def likely_class(obj: dict[str, Any]) -> str:
    probabilities = obj.get("class_probabilities", {})
    if isinstance(probabilities, dict) and probabilities:
        label = max(probabilities, key=lambda key: float(probabilities[key]))
        if label in SUPPORTED_CLASSES:
            return label
    return "unknown_anomaly"


def make_cutout_triplet(obj: dict[str, Any], size: int, rng: np.random.Generator) -> tuple[Image.Image, Image.Image, Image.Image]:
    reference = make_star_field(size, rng)
    new = reference.copy()
    difference = rng.normal(loc=8.0, scale=1.7, size=(size, size, 3)).astype(np.float32)

    label = likely_class(obj)
    add_object_signal(reference, new, difference, obj, rng)

    ref_image = to_image(reference).filter(ImageFilter.GaussianBlur(radius=0.15))
    new_image = to_image(new).filter(ImageFilter.GaussianBlur(radius=0.15))
    diff_image = to_image(difference).filter(ImageFilter.GaussianBlur(radius=0.2))

    if label == "artifact":
        new_image = draw_artifact(new_image, rng)
        diff_image = draw_artifact(diff_image, rng)

    return ref_image, new_image, diff_image


def save_triplet(object_id: str, images: tuple[Image.Image, Image.Image, Image.Image], cutout_dir: Path) -> dict[str, str]:
    names = {
        "reference": f"{object_id}_ref.webp",
        "new": f"{object_id}_new.webp",
        "difference": f"{object_id}_diff.webp",
    }

    for image, filename in zip(images, names.values(), strict=True):
        image.save(cutout_dir / filename, format="WEBP", quality=WEBP_QUALITY, method=4)

    return {key: f"/cutouts/{filename}" for key, filename in names.items()}


def write_object(path: Path, obj: dict[str, Any]) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(obj, file, indent=2)
        file.write("\n")


def main() -> None:
    args = parse_args()
    rng = np.random.default_rng(args.seed)
    objects_dir = args.data_dir / "demo_objects"
    objects = load_objects(objects_dir)
    featured = select_featured_objects(objects, args.n_featured)

    clean_old_cutouts(args.cutout_dir)

    for path, obj in featured:
        object_id = str(obj["object_id"])
        images = make_cutout_triplet(obj, args.size, rng)
        obj["cutouts"] = save_triplet(object_id, images, args.cutout_dir)
        write_object(path, obj)

    print(f"Wrote cutout triplets for {len(featured)} objects to {args.cutout_dir}")
    for _, obj in featured[:10]:
        print(f"  {obj['object_id']} priority={obj.get('priority_score')} class={likely_class(obj)}")
    if len(featured) > 10:
        print(f"  ... {len(featured) - 10} more")


if __name__ == "__main__":
    main()
