#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOGO="$ROOT/public/knight.png"
OUT="$ROOT/public/og-image.png"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

magick -size 1200x630 gradient:'#12121a'-'#0a0a0f' "$TMP/bg.png"
magick "$LOGO" -trim +repage -gravity center -background none -extent 1000x1000 -resize 380x380 "$TMP/knight.png"

magick "$TMP/bg.png" "$TMP/knight.png" \
  -gravity West -geometry +80+0 \
  -composite \
  -font Adwaita-Sans-Bold -pointsize 96 -fill '#ffffff' \
  -gravity West -annotate +500+-80 'ChessViewer' \
  -font Adwaita-Sans -pointsize 36 -fill '#c9a84c' \
  -gravity West -annotate +505+20 'Chess diagram editor & export' \
  -font Adwaita-Sans -pointsize 28 -fill '#9aa0ad' \
  -gravity West -annotate +505+90 'Free · Open-source · Privacy-first' \
  -depth 8 -strip "$OUT"

echo "Wrote $OUT"
magick identify -format '  %wx%h, %B bytes\n' "$OUT"
