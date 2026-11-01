#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSET_DIR="$ROOT/android/app/src/main/assets/game"
cd "$ROOT"

if command -v bun >/dev/null 2>&1; then
  bun run build:android-offline
elif command -v pnpm >/dev/null 2>&1; then
  pnpm run build:android-offline
elif command -v npm >/dev/null 2>&1; then
  npm run build:android-offline
else
  echo "No supported package manager found (bun, pnpm, npm)." >&2
  exit 1
fi
rm -rf "$ASSET_DIR"
mkdir -p "$ASSET_DIR"
cp -a .output/android-offline/. "$ASSET_DIR/"
if [ ! -f "$ASSET_DIR/index.html" ] && [ -f "$ASSET_DIR/offline.html" ]; then
  mv "$ASSET_DIR/offline.html" "$ASSET_DIR/index.html"
fi

python3 - "$ASSET_DIR" <<'PY'
from pathlib import Path
import re
import struct
import sys

root = Path(sys.argv[1])
index = root / "index.html"
fx = root / "fx/fx.png"
if not index.is_file() or not fx.is_file():
    raise SystemExit("faltam index.html ou fx/fx.png no pacote Android")
html = index.read_text(encoding="utf-8")
if 'id="root"' not in html or "offline-entry" not in (root / "assets").as_posix() and not re.search(r'<script[^>]+src=["\'](?:\./)?assets/', html):
    raise SystemExit("HTML de entrada não monta o jogo cliente offline")
if re.search(r'<(?:script|link)[^>]+(?:src|href)=["\']https?://', html, re.I):
    raise SystemExit("o HTML do APK ainda depende de um recurso remoto")
data = fx.read_bytes()
if data[:8] != b"\x89PNG\r\n\x1a\n":
    raise SystemExit("fx/fx.png inválida")
w, h = struct.unpack(">II", data[16:24])
if (w, h) != (320, 5120):
    raise SystemExit(f"a folha FX deve ter 80 animações de 5 quadros (esperado 320×5120; recebido {w}×{h})")
print(f"offline package verified: {sum(1 for p in root.rglob('*') if p.is_file())} files, FX {w}×{h}")
PY

printf 'offline assets: '
du -sh "$ASSET_DIR" | cut -f1
printf 'entry: '
find "$ASSET_DIR/assets" -maxdepth 1 -name 'offline-*.js' -printf '%f\n'
