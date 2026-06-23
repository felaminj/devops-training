#!/usr/bin/env python3
"""Split GEM global active faults into per-region GeoJSON files."""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "apps/frontend/public/data/faults"
CACHE_DIR = ROOT / "scripts/.cache"
DEFAULT_SOURCE = CACHE_DIR / "gem_active_faults.geojson"
SOURCE_URL = (
    "https://raw.githubusercontent.com/GEMScienceTools/gem-global-active-faults/"
    "master/geojson/gem_active_faults.geojson"
)

LAYER_DEFINITIONS = [
    {"id": "philippines", "name": "Philippines", "prefixes": ["PHL"], "default_enabled": True},
    {"id": "united-states", "name": "United States", "prefixes": ["US"], "default_enabled": False},
    {"id": "new-zealand", "name": "New Zealand", "prefixes": ["NZ"], "default_enabled": False},
    {"id": "australia", "name": "Australia", "prefixes": ["AUS"], "default_enabled": False},
    {"id": "mexico", "name": "Mexico", "prefixes": ["MX"], "default_enabled": False},
    {"id": "taiwan", "name": "Taiwan", "prefixes": ["TW"], "default_enabled": False},
    {"id": "central-america", "name": "Central America", "prefixes": ["CA"], "default_enabled": False},
    {"id": "south-america", "name": "South America", "prefixes": ["SA"], "default_enabled": False},
    {"id": "europe", "name": "Europe", "prefixes": ["EUR"], "default_enabled": False},
    {"id": "middle-east", "name": "Middle East", "prefixes": ["ME"], "default_enabled": False},
    {"id": "northeast-asia", "name": "Northeast Asia", "prefixes": ["NEA"], "default_enabled": False},
    {"id": "east-africa", "name": "East Africa", "prefixes": ["EAF", "MW"], "default_enabled": False},
    {"id": "africa", "name": "Africa", "prefixes": ["GAF", "NAF"], "default_enabled": False},
    {"id": "antarctica", "name": "Antarctica", "prefixes": ["ATA"], "default_enabled": False},
    {"id": "global-other", "name": "Global (other catalogs)", "prefixes": ["PB", "GFE", "EOS", "UCF"], "default_enabled": False},
]


def catalog_prefix(catalog_id: str) -> str:
    if not catalog_id:
        return ""
    return re.split(r"[_-]", catalog_id)[0]


def ensure_source(source: Path) -> None:
    if source.exists():
        return
    import urllib.request
    source.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading GEM active faults to {source}...")
    urllib.request.urlretrieve(SOURCE_URL, source)


def layer_for_feature(catalog_id: str) -> str | None:
    prefix = catalog_prefix(catalog_id)
    for layer in LAYER_DEFINITIONS:
        if prefix in layer["prefixes"]:
            return layer["id"]
    return None


def main() -> int:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    try:
        ensure_source(source)
    except OSError as error:
        print(f"Failed to download source: {error}", file=sys.stderr)
        return 1
    if not source.exists():
        print(f"Source not found: {source}", file=sys.stderr)
        return 1

    with source.open(encoding="utf-8") as handle:
        data = json.load(handle)

    buckets: dict[str, list] = {layer["id"]: [] for layer in LAYER_DEFINITIONS}
    unmatched = 0

    for feature in data.get("features", []):
        catalog_id = feature.get("properties", {}).get("catalog_id", "")
        layer_id = layer_for_feature(catalog_id)
        if layer_id is None:
            unmatched += 1
            continue
        buckets[layer_id].append(feature)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest_layers = []

    for layer in LAYER_DEFINITIONS:
        layer_id = layer["id"]
        features = buckets[layer_id]
        if not features:
            continue

        filename = f"{layer_id}.geojson"
        output_path = OUTPUT_DIR / filename
        collection = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "source": "GEM Global Active Faults",
                "layer_id": layer_id,
                "feature_count": len(features),
            },
        }
        with output_path.open("w", encoding="utf-8") as handle:
            json.dump(collection, handle, separators=(",", ":"))

        manifest_layers.append({
            "id": layer_id,
            "name": layer["name"],
            "file": f"/data/faults/{filename}",
            "featureCount": len(features),
            "defaultEnabled": layer["default_enabled"],
        })

    manifest = {
        "source": "GEM Global Active Faults (CC BY-SA 4.0)",
        "attribution": "GEM Foundation / PHIVOLCS (Philippines)",
        "layers": sorted(manifest_layers, key=lambda item: item["name"]),
    }

    with (OUTPUT_DIR / "index.json").open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")

    print(f"Wrote {len(manifest_layers)} layers to {OUTPUT_DIR}")
    if unmatched:
        print(f"Skipped {unmatched} features without a mapped catalog prefix")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
