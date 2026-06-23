#!/usr/bin/env bash
#
# Regenerates the 1200×630 social-sharing preview at public/og-image.png — the
# image crawlers show when a chessvision.org link is shared (Open Graph /
# Twitter Card). Run after a brand/logo change. Requires ImageMagick v7.
#
#   ./scripts/generate-og-image.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOGO="$ROOT/public/knight.png"
OUT="$ROOT/public/og-image.png"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Brand background gradient (mirrors --val-bg in src/index.css).
magick -size 1200x630 gradient:'#12121a'-'#0a0a0f' "$TMP/bg.png"
magick "$LOGO" -trim +repage -gravity center -background none -extent 1000x1000 -resize 380x380 "$TMP/knight.png"

magick "$TMP/bg.png" "$TMP/knight.png" \
  -gravity West -geometry +80+0 \
  -composite \
  -font Adwaita-Sans-Bold -pointsize 96 -fill '#ffffff' \
  -gravity West -annotate +500+-80 'ChessVision' \
  -font Adwaita-Sans -pointsize 36 -fill '#c9a84c' \
  -gravity West -annotate +505+20 'Chess diagram editor & export' \
  -font Adwaita-Sans -pointsize 28 -fill '#9aa0ad' \
  -gravity West -annotate +505+90 'Free · Open-source · Privacy-first' \
  -depth 8 -strip "$OUT"

echo "Wrote $OUT"
magick identify -format '  %wx%h, %B bytes\n' "$OUT"
