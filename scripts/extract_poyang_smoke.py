"""Extract a small, georeferenced Poyang sample from the prepared GeoTIFFs."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import rasterio
from rasterio.features import shapes
from rasterio.warp import transform_geom
from rasterio.windows import Window


PERIODS = ("dry", "transition", "wet")


def crop_file(source: Path, destination: Path, window: Window) -> None:
    with rasterio.open(source) as src:
        profile = src.profile.copy()
        profile.update(
            width=int(window.width),
            height=int(window.height),
            transform=rasterio.windows.transform(window, src.transform),
            compress="deflate",
        )
        data = src.read(window=window)
        with rasterio.open(destination, "w", **profile) as dst:
            dst.write(data)
            for index, description in enumerate(src.descriptions, start=1):
                if description:
                    dst.set_band_description(index, description)


def write_mask_geojson(
    source: Path, destination: Path, date: str, area_km2: str
) -> None:
    with rasterio.open(source) as src:
        water = src.read(3) > 0
        valid = src.read(4) > 0
        mask = water & valid
        features = []
        for geometry, value in shapes(mask.astype("uint8"), mask=mask, transform=src.transform):
            if value != 1:
                continue
            features.append(
                {
                    "type": "Feature",
                    "geometry": transform_geom(src.crs, "EPSG:4326", geometry, precision=6),
                    "properties": {
                        "date": date,
                        "areaKm2": float(area_km2),
                        "sensor": "Sentinel-2",
                        "modelVersion": "mndwi-ndwi-prototype",
                        "qualityFlag": "source-mask",
                    },
                }
            )
    destination.write_text(
        json.dumps(
            {"type": "FeatureCollection", "features": features},
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def write_uucp_layout(source: Path, output: Path) -> None:
    image_dir = output / "Sentinel2" / "img"
    label_dir = output / "Sentinel2" / "island_mask"
    image_dir.mkdir(parents=True, exist_ok=True)
    label_dir.mkdir(parents=True, exist_ok=True)

    for period in PERIODS:
        raw_path = source / f"poyang_{period}_2024_s2_raw_256.tif"
        index_path = source / f"poyang_{period}_2024_indices_mask_256.tif"
        with rasterio.open(raw_path) as raw, rasterio.open(index_path) as indices:
            image = raw.read().astype("float32") * 10000.0
            valid = indices.read(4) > 0
            image[:, ~valid] = -10000.0
            profile = raw.profile.copy()
            profile.update(dtype="float32", compress="deflate")
            image_path = image_dir / f"poyang_{period}_2024.tif"
            with rasterio.open(image_path, "w", **profile) as dst:
                dst.write(image)
                for index, description in enumerate(raw.descriptions, start=1):
                    if description:
                        dst.set_band_description(index, description)

            label = indices.read(3).astype("uint8")
            label[~valid] = 2
            label_profile = raw.profile.copy()
            label_profile.update(count=1, dtype="uint8", compress="deflate")
            label_path = label_dir / f"poyang_{period}_2024.tif"
            with rasterio.open(label_path, "w", **label_profile) as dst:
                dst.write(label, 1)
                dst.set_band_description(1, "water_mask")

    (output / "uucp_input_manifest.json").write_text(
        json.dumps(
            {
                "input_root": str(output),
                "source_reflectance": "0-1; multiplied by 10000 for UUCP compatibility",
                "invalid_value": -10000,
                "channels": ["B2", "B3", "B4", "B8", "B11", "B12"],
                "labels": "water_mask: 0 non-water, 1 water, 2 invalid",
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--size", type=int, default=256)
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    raw = args.source / "poyang_dry_2024_s2_raw.tif"
    with rasterio.open(raw) as src:
        size = min(args.size, src.width, src.height)
        window = Window(
            col_off=(src.width - size) // 2,
            row_off=(src.height - size) // 2,
            width=size,
            height=size,
        )
        bounds = rasterio.windows.bounds(window, src.transform)
        metadata = {
            "source": str(args.source),
            "window": {
                "col_off": window.col_off,
                "row_off": window.row_off,
                "width": window.width,
                "height": window.height,
            },
            "crs": str(src.crs),
            "resolution_m": [src.transform.a, abs(src.transform.e)],
            "bounds": list(bounds),
            "bands": list(src.descriptions),
        }

    for period in PERIODS:
        crop_file(
            args.source / f"poyang_{period}_2024_s2_raw.tif",
            args.output / f"poyang_{period}_2024_s2_raw_256.tif",
            window,
        )
        crop_file(
            args.source / f"poyang_{period}_2024_indices_mask.tif",
            args.output / f"poyang_{period}_2024_indices_mask_256.tif",
            window,
        )

    for name in ("poyang_dry_to_transition_change", "poyang_transition_to_wet_change"):
        crop_file(
            args.source / f"{name}.tif",
            args.output / f"{name}_256.tif",
            window,
        )

    with (args.source / "poyang_demo_area_timeseries.csv").open(
        newline="", encoding="utf-8-sig"
    ) as source_csv:
        rows = list(csv.DictReader(source_csv))
    metadata["time_series"] = rows
    for row in rows:
        period = row["period"].replace("_2024", "")
        write_mask_geojson(
            args.output / f"poyang_{period}_2024_indices_mask_256.tif",
            args.output / f"poyang_{period}_2024_water_mask_256.geojson",
            row["image_date"],
            row["water_area_km2"],
        )
    write_uucp_layout(args.output, args.output / "uucp_input")
    (args.output / "manifest.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
