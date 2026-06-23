#!/usr/bin/env python3
"""Build regional volcano layers from PHIVOLCS and Smithsonian GVP data."""

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "apps/frontend/public/data/volcanoes"
PH_SOURCE_URL = "https://raw.githubusercontent.com/j4ckofalltrades/phl-volcanoes/main/data/_index.geojson"
GVP_SOURCE_URL = (
    "https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows?"
    "service=WFS&version=2.0.0&request=GetFeature&"
    "typeName=GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes&outputFormat=json"
)
DEFAULT_PH_SOURCE = Path("/tmp/phl_volcanoes.geojson")
DEFAULT_GVP_SOURCE = Path("/tmp/gvp_holocene.json")

GVP_LAYER_DEFINITIONS = [
    {"id": "sunda-banda", "name": "Sunda-Banda", "region": "Sunda-Banda Volcanic Regions"},
    {"id": "eastern-asia", "name": "Eastern Asia", "region": "Eastern Asia Volcanic Regions"},
    {"id": "northwestern-pacific", "name": "Northwestern Pacific", "region": "Northwestern Pacific Volcanic Regions"},
    {"id": "western-pacific", "name": "Western Pacific", "region": "Western Pacific Volcanic Regions"},
    {"id": "southwestern-pacific", "name": "Southwestern Pacific", "region": "Southwestern Pacific Volcanic Regions"},
    {"id": "tonga-kermadec", "name": "Tonga-Kermadec", "region": "Tonga-Kermadec Volcanic Regions"},
    {"id": "north-america", "name": "North America", "region": "North America Volcanic Regions"},
    {"id": "south-america", "name": "South America", "region": "South America Volcanic Regions"},
    {"id": "central-america", "name": "Central America & Caribbean", "region": "Middle America-Caribbean Volcanic Regions"},
    {"id": "eastern-africa", "name": "Eastern Africa", "region": "Eastern Africa Volcanic Regions"},
    {"id": "europe-africa", "name": "Europe & Northern Africa", "regions": [
        "European Volcanic Regions",
        "Northern Africa Volcanic Regions",
        "Arabia-Central Asia Volcanic Regions",
    ]},
    {"id": "global-other", "name": "Global (other)", "regions": [
        "Atlantic Ocean Volcanic Regions",
        "Eastern Pacific Volcanic Regions",
        "Antarctic-Scotia Volcanic Regions",
        "Southern Pacific Volcanic Regions",
        "Somalian-Antarctic Volcanic Regions",
        "Eastern Australia Volcanic Regions",
    ]},
]


def ensure_source(path: Path, url: str) -> None:
    if path.exists():
        return
    urllib.request.urlretrieve(url, path)


def normalize_ph_classification(value: str) -> str:
    if value == "inactive":
        return "dormant"
    if value == "potentially_active":
        return "potentially_active"
    return "active"


def classify_gvp(props: dict) -> str:
    category = props.get("Evidence_Category") or ""
    if category in ("Eruption Observed", "Unrest / Holocene"):
        return "active"
    if category in ("Eruption Dated", "Evidence Credible"):
        return "potentially_active"
    return "dormant"


def normalize_ph_feature(feature: dict) -> dict:
    props = feature.get("properties", {})
    classification = normalize_ph_classification(props.get("classification", "dormant"))
    return {
        "type": "Feature",
        "geometry": feature["geometry"],
        "properties": {
            "name": props.get("name", "Unknown volcano"),
            "classification": classification,
            "elevation": props.get("elev"),
            "province": ", ".join(props.get("prov", [])) if isinstance(props.get("prov"), list) else props.get("prov"),
            "region": ", ".join(props.get("region", [])) if isinstance(props.get("region"), list) else props.get("region"),
            "source": "PHIVOLCS",
        },
    }


def normalize_gvp_feature(feature: dict) -> dict:
    props = feature.get("properties", {})
    return {
        "type": "Feature",
        "geometry": feature["geometry"],
        "properties": {
            "name": props.get("Volcano_Name", "Unknown volcano"),
            "classification": classify_gvp(props),
            "elevation": props.get("Elevation"),
            "country": props.get("Country"),
            "region": props.get("Region"),
            "last_eruption_year": props.get("Last_Eruption_Year"),
            "evidence_category": props.get("Evidence_Category"),
            "source": "Smithsonian GVP",
        },
    }


def write_layer(layer_id: str, features: list, source: str) -> dict:
    filename = f"{layer_id}.geojson"
    collection = {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "source": source,
            "layer_id": layer_id,
            "feature_count": len(features),
        },
    }
    with (OUTPUT_DIR / filename).open("w", encoding="utf-8") as handle:
        json.dump(collection, handle, separators=(",", ":"))
    return {
        "id": layer_id,
        "file": f"/data/volcanoes/{filename}",
        "featureCount": len(features),
    }


def main() -> int:
    ph_source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PH_SOURCE
    gvp_source = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_GVP_SOURCE
    ensure_source(ph_source, PH_SOURCE_URL)
    ensure_source(gvp_source, GVP_SOURCE_URL)

    with ph_source.open(encoding="utf-8") as handle:
        ph_data = json.load(handle)
    with gvp_source.open(encoding="utf-8") as handle:
        gvp_data = json.load(handle)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest_layers = []

    ph_features = [normalize_ph_feature(feature) for feature in ph_data.get("features", [])]
    ph_layer = write_layer("philippines", ph_features, "PHIVOLCS / phl-volcanoes")
    manifest_layers.append({
        **ph_layer,
        "name": "Philippines",
        "defaultEnabled": True,
    })

    gvp_by_region: dict[str, list] = {}
    for feature in gvp_data.get("features", []):
        region = feature.get("properties", {}).get("Region")
        if region:
            gvp_by_region.setdefault(region, []).append(normalize_gvp_feature(feature))

    for layer in GVP_LAYER_DEFINITIONS:
        regions = layer.get("regions") or [layer["region"]]
        features: list = []
        for region in regions:
            features.extend(gvp_by_region.get(region, []))
        if not features:
            continue
        entry = write_layer(layer["id"], features, "Smithsonian Global Volcanism Program")
        manifest_layers.append({
            **entry,
            "name": layer["name"],
            "defaultEnabled": False,
        })

    manifest = {
        "source": "PHIVOLCS (Philippines) and Smithsonian GVP Holocene volcanoes",
        "attribution": "PHIVOLCS / Smithsonian Institution GVP",
        "layers": manifest_layers,
    }
    with (OUTPUT_DIR / "index.json").open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")

    print(f"Wrote {len(manifest_layers)} volcano layers to {OUTPUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
