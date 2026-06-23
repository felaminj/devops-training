#!/usr/bin/env python3
"""Build regional ocean trench layers from PB2002 subduction segments."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "apps/frontend/public/data/trenches"
DEFAULT_SOURCE = Path("/tmp/PB2002_steps.json")
SOURCE_URL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_steps.json"

LAYER_DEFINITIONS = [
    {"id": "philippines", "name": "Philippines", "bbox": [116, 4, 132, 22], "default_enabled": True},
    {"id": "southeast-asia", "name": "Southeast Asia", "bbox": [95, -12, 116, 22], "default_enabled": False},
    {"id": "japan-marianas", "name": "Japan & Marianas", "bbox": [125, 20, 150, 50], "default_enabled": False},
    {"id": "indonesia-australia", "name": "Indonesia & Australia", "bbox": [110, -50, 180, -5], "default_enabled": False},
    {"id": "americas", "name": "Americas", "bbox": [-180, -60, -60, 60], "default_enabled": False},
    {"id": "mediterranean", "name": "Mediterranean", "bbox": [-10, 30, 45, 50], "default_enabled": False},
    {"id": "global-other", "name": "Global (other)", "bbox": None, "default_enabled": False},
]


def in_bbox(lon: float, lat: float, bbox: list[float]) -> bool:
    min_lon, min_lat, max_lon, max_lat = bbox
    return min_lon <= lon <= max_lon and min_lat <= lat <= max_lat


def segment_midpoint(props: dict) -> tuple[float, float]:
    lon = (props["STARTLONG"] + props["FINALLONG"]) / 2
    lat = (props["STARTLAT"] + props["FINALLAT"]) / 2
    return lon, lat


def layer_for_segment(lon: float, lat: float) -> str:
    for layer in LAYER_DEFINITIONS:
        bbox = layer["bbox"]
        if bbox and in_bbox(lon, lat, bbox):
            return layer["id"]
    return "global-other"


def step_to_feature(step: dict) -> dict:
    props = step["properties"]
    return {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [props["STARTLONG"], props["STARTLAT"]],
                [props["FINALLONG"], props["FINALLAT"]],
            ],
        },
        "properties": {
            "name": props.get("PLATEBOUND", "Subduction zone"),
            "plate_boundary": props.get("PLATEBOUND", ""),
            "step_class": props.get("STEPCLASS", "SUB"),
        },
    }


def ensure_source(source: Path) -> None:
    if source.exists():
        return
    import urllib.request
    urllib.request.urlretrieve(SOURCE_URL, source)


def main() -> int:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    ensure_source(source)
    if not source.exists():
        print(f"Source not found: {source}", file=sys.stderr)
        return 1

    with source.open(encoding="utf-8") as handle:
        data = json.load(handle)

    buckets: dict[str, list] = {layer["id"]: [] for layer in LAYER_DEFINITIONS}
    for step in data.get("features", []):
        props = step.get("properties", {})
        if props.get("STEPCLASS") != "SUB":
            continue
        lon, lat = segment_midpoint(props)
        layer_id = layer_for_segment(lon, lat)
        buckets[layer_id].append(step_to_feature(step))

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest_layers = []
    for layer in LAYER_DEFINITIONS:
        layer_id = layer["id"]
        features = buckets[layer_id]
        if not features:
            continue
        filename = f"{layer_id}.geojson"
        collection = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "source": "PB2002 plate boundaries (Peter Bird, 2003)",
                "layer_id": layer_id,
                "feature_count": len(features),
            },
        }
        with (OUTPUT_DIR / filename).open("w", encoding="utf-8") as handle:
            json.dump(collection, handle, separators=(",", ":"))
        manifest_layers.append({
            "id": layer_id,
            "name": layer["name"],
            "file": f"/data/trenches/{filename}",
            "featureCount": len(features),
            "defaultEnabled": layer["default_enabled"],
        })

    manifest = {
        "source": "PB2002 subduction segments (Peter Bird, 2003)",
        "attribution": "Peter Bird / fraxen/tectonicplates",
        "layers": manifest_layers,
    }
    with (OUTPUT_DIR / "index.json").open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")

    print(f"Wrote {len(manifest_layers)} trench layers to {OUTPUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
