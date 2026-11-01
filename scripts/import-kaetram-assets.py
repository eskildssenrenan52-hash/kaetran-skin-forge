#!/usr/bin/env python3
"""Import the local Kaetram visual pack into Creature Clash.

The importer copies only visual assets and licensing/catalog metadata. It keeps the
runtime catalog in the compact shape expected by src/odyssey/kaetram.ts and uses
local URLs so the game does not depend on an external asset host.
"""
from __future__ import annotations

import argparse
import json
import shutil
import struct
import subprocess
from collections import Counter
from pathlib import Path
from urllib.parse import quote

PLAYER_ANIMS = {
    "idle_down": [4, 0],
    "idle_right": [4, 1],
    "idle_up": [4, 2],
    "walk_down": [4, 3],
    "walk_right": [4, 4],
    "walk_up": [4, 5],
    "atk_down": [4, 6],
    "atk_right": [4, 7],
    "atk_up": [4, 8],
    "bow_atk_down": [4, 9],
    "bow_atk_right": [4, 10],
    "bow_atk_up": [4, 11],
}
MOB_ANIMS = {
    "atk_right": [5, 0],
    "walk_right": [4, 1],
    "idle_right": [2, 2],
    "atk_up": [5, 3],
    "walk_up": [4, 4],
    "idle_up": [2, 5],
    "atk_down": [5, 6],
    "walk_down": [4, 7],
    "idle_down": [2, 8],
}
EQUIPMENT_32 = {"skin", "helmet", "chestplate", "legplates", "cape"}
EQUIPMENT_48 = {"shield", "weapon"}
STATIC_GROUPS = {"items", "skills", "crowns", "cursors"}
THREE_STATE_GROUPS = {"trees", "rocks", "fishspots", "bushes"}


def png_size(path: Path) -> tuple[int, int]:
    """Read PNG dimensions without adding Pillow as a project dependency."""
    with path.open("rb") as handle:
        signature = handle.read(24)
    if signature[:8] != b"\x89PNG\r\n\x1a\n" or signature[12:16] != b"IHDR":
        raise ValueError(f"Not a standard PNG: {path}")
    return struct.unpack(">II", signature[16:24])


def source_commit(source: Path) -> str:
    try:
        return subprocess.check_output(
            ["git", "-C", str(source), "rev-parse", "HEAD"], text=True
        ).strip()
    except (OSError, subprocess.CalledProcessError):
        return "unknown"


def source_animations(meta: dict) -> dict[str, list[int]] | None:
    animations = meta.get("animations")
    if not isinstance(animations, dict):
        return None
    return {
        name: [int(data.get("length", 1)), int(data.get("row", 0))]
        for name, data in animations.items()
        if isinstance(data, dict)
    }


def infer_shape(key: str, meta: dict, size: tuple[int, int]) -> tuple[int, int, dict[str, list[int]]]:
    group, _, rest = key.partition("/")
    width, height = size
    declared_w = int(meta["width"]) if meta.get("width") else None
    declared_h = int(meta["height"]) if meta.get("height") else None
    animations = source_animations(meta)

    if group in STATIC_GROUPS:
        w, h = declared_w or width, declared_h or height
        return w, h, animations or {"idle": [1, 0]}

    if group in THREE_STATE_GROUPS:
        w, h = declared_w or width, declared_h or height
        if animations is None and height >= h * 3:
            animations = {"idle": [1, 0], "shake": [1, 1], "exhausted": [1, 2]}
        return w, h, animations or {"idle": [1, 0]}

    if group == "player":
        section = rest.split("/", 1)[0]
        if section in EQUIPMENT_32 or section in EQUIPMENT_48 or section in {"base", "base_48x48"}:
            # Player sheets are four columns wide. The source has both 32px and
            # 48/64px layered equipment sheets, so derive the cell from the PNG.
            w = declared_w or (width // 4 if width >= 4 else width)
            h = declared_h or w
            return w, h, animations or PLAYER_ANIMS
        w, h = declared_w or width, declared_h or height
        return w, h, animations or {"idle": [1, 0]}

    if group == "mobs":
        if declared_w and declared_h:
            return declared_w, declared_h, animations or MOB_ANIMS
        # Most legacy mob sheets without explicit metadata use the 5/4/2-frame,
        # nine-row layout documented by Kaetram's default loader.
        if width >= 160 and height >= 288 and width % 32 == 0 and height % 32 == 0:
            return 32, 32, animations or MOB_ANIMS
        w, h = width, height
        return w, h, animations or {"idle_down": [1, 0]}

    if group == "npcs":
        w = declared_w or (32 if width >= 64 and height <= 64 else width)
        h = declared_h or (32 if width >= 64 and height <= 64 else height)
        frame_count = max(1, width // w)
        return w, h, animations or {"idle_down": [frame_count, 0]}

    if group == "effects":
        w, h = declared_w or (32 if height == 32 and width >= 32 else width), declared_h or height
        return w, h, animations or {"effect": [max(1, width // w), 0]}

    if group == "projectiles":
        w, h = declared_w or height, declared_h or height
        return w, h, animations or {"travel": [max(1, width // w), 0]}

    w, h = declared_w or width, declared_h or height
    return w, h, animations or {"idle": [1, 0]}


def default_offset(key: str, w: int, h: int, meta: dict) -> tuple[int, int]:
    group, _, rest = key.partition("/")
    if "offsetX" in meta:
        ox = int(meta["offsetX"])
    elif group in STATIC_GROUPS:
        ox = 0
    elif group == "npcs":
        ox = -8
    elif group == "player":
        ox = 8 - w // 2
    else:
        ox = 8 - w // 2

    if "offsetY" in meta:
        oy = int(meta["offsetY"])
    elif group in STATIC_GROUPS:
        oy = 0
    elif group == "npcs":
        oy = -14
    elif group == "player":
        oy = -h // 2
    else:
        oy = -h // 2
    return ox, oy


def local_url(key: str) -> str:
    return "/kaetram/img/sprites/" + quote(key, safe="/") + ".png"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True, help="Kaetram-Open checkout")
    parser.add_argument("--target", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()

    source = args.source.resolve()
    target = args.target.resolve()
    source_img = source / "packages/client/public/img"
    source_sprites = source_img / "sprites"
    if not source_sprites.is_dir():
        raise SystemExit(f"Missing source sprite directory: {source_sprites}")

    asset_root = target / "public/kaetram"
    asset_root.mkdir(parents=True, exist_ok=True)
    shutil.copytree(source_img, asset_root / "img", dirs_exist_ok=True)
    shutil.copy2(source / "packages/client/data/sprites.json", asset_root / "catalog.source.json")
    shutil.copy2(source / "LICENSE", asset_root / "LICENSE")
    shutil.copy2(source / "LICENSE_OPL", asset_root / "LICENSE_OPL")

    source_list = json.loads((source / "packages/client/data/sprites.json").read_text())
    source_meta = {entry["id"]: entry for entry in source_list if isinstance(entry, dict) and "id" in entry}
    target_catalog_path = target / "src/odyssey/kaetram-sprites.json"
    old_catalog = json.loads(target_catalog_path.read_text()) if target_catalog_path.exists() else {}

    files = sorted(source_sprites.rglob("*.png"))
    catalog: dict[str, dict] = {}
    categories = Counter()
    sprite_bytes = 0
    for path in files:
        key = path.relative_to(source_sprites).with_suffix("").as_posix()
        categories[key.split("/", 1)[0]] += 1
        sprite_bytes += path.stat().st_size
        size = png_size(path)
        upstream = source_meta.get(key, {})
        existing = old_catalog.get(key, {})
        w, h, animations = infer_shape(key, upstream, size)
        ox, oy = default_offset(key, w, h, upstream)

        entry = {
            "url": local_url(key),
            "w": int(existing.get("w", w)),
            "h": int(existing.get("h", h)),
            "ox": int(existing.get("ox", ox)),
            "oy": int(existing.get("oy", oy)),
            "anims": existing.get("anims") or animations,
            "idle": int(existing.get("idle", upstream.get("idleSpeed", 450))),
        }
        catalog[key] = entry

    target_catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")

    copied_images = [p for p in (asset_root / "img").rglob("*") if p.is_file() and p.suffix.lower() in {".png", ".jpg", ".jpeg", ".gif", ".webp"}]
    manifest = {
        "sourceRepository": "https://github.com/Kaetram/Kaetram-Open",
        "sourceCommit": source_commit(source),
        "sourceLicense": "MPL-2.0 + LICENSE_OPL",
        "copiedAssetRoot": "/kaetram/img",
        "spriteRoot": "/kaetram/img/sprites",
        "runtimeCatalog": "src/odyssey/kaetram-sprites.json",
        "sprites": {
            "files": len(files),
            "bytes": sprite_bytes,
            "catalogEntries": len(catalog),
            "categories": dict(sorted(categories.items())),
        },
        "allVisualAssets": {
            "files": len(copied_images),
            "bytes": sum(p.stat().st_size for p in copied_images),
        },
    }
    (asset_root / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

    readme = f"""# Kaetram local visual pack\n\nThis directory contains the visual assets copied from [Kaetram-Open](https://github.com/Kaetram/Kaetram-Open) at commit `{manifest['sourceCommit']}`.\n\n- Sprite files: **{len(files)}** PNGs ({sprite_bytes:,} bytes).\n- Runtime catalog: [`src/odyssey/kaetram-sprites.json`](../../src/odyssey/kaetram-sprites.json).\n- Source catalog preserved as [`catalog.source.json`](catalog.source.json).\n- Attribution and license terms: [`LICENSE`](LICENSE) and [`LICENSE_OPL`](LICENSE_OPL).\n\nThe game uses `/kaetram/img/...` URLs, so the imported sprites remain inside the game build and do not depend on Kaetram's original asset host. The existing procedural art remains as a fallback for Creature Clash enemies and characters that do not have a matching Kaetram sheet.\n"""
    (asset_root / "README.md").write_text(readme)
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
