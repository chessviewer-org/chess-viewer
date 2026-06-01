# ChessVision FAQ

Common questions and answers. This document reflects the **v5.5.3 stable release** on `master`.

---

## General

### What is ChessVision?

A browser-based application that renders chess positions from FEN notation as high-resolution raster or vector images. All processing is client-side; no data is uploaded to a server.

### Requirements

- A modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- An internet connection on first load to fetch the application bundle (piece SVGs and the JavaScript bundle are served from the deployed origin)
- No installation; the application runs entirely in the browser

### License

ChessVision is released under the **AGPL-3.0** license. Commercial use is permitted under the terms of that license.

---

## FEN Notation

### What is FEN?

FEN (Forsyth-Edwards Notation) is a single-line text representation of a chess position.

**Example (starting position):**

```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
```

### FEN format

A FEN string consists of six space-separated fields:

1. **Piece placement.** Ranks 8 to 1, separated by `/`. Uppercase letters denote White, lowercase Black, and digits denote empty squares.
2. **Active color.** `w` or `b`.
3. **Castling availability.** Any combination of `KQkq`, or `-` for none.
4. **En-passant target square.** Algebraic square, or `-`.
5. **Halfmove clock.** Moves since the last capture or pawn move.
6. **Fullmove number.** Current move number.

### Partial FEN

Only the piece-placement field is strictly required. Missing trailing fields default to standard values.

### Input limits

ChessVision enforces a hard input ceiling of `MAX_FEN_LENGTH = 93` characters. Inputs above this length are rejected before parsing.

### Common FEN errors

- Wrong number of ranks (must be 8).
- Invalid piece letters (only `prnbqkPRNBQK` are accepted).
- A rank that does not sum to 8 squares.

---

## Export

### Formats

- **PNG** — Lossless, supports transparency.
- **JPEG** — Smaller file size; no transparency.
- **SVG** — Vector export. Available on the Advanced FEN page export actions; not yet exposed on the Home page export toolbar.

### Resolution

Pixel dimensions are computed as `boardSizeCm × qualityMultiplier × 118.11`. The following table shows the maximum output at each quality level (8 cm board size).

| Quality | Mode   | Dimension (8 cm board) | DPI   |
| ------- | ------ | ---------------------- | ----- |
| 8×      | Print  | 7,552 × 7,552 px       | 2,400 |
| 16×     | Print  | 15,104 × 15,104 px     | 4,800 |
| 24×     | Social | 22,656 × 22,656 px     | 7,200 |
| 32×     | Social | 30,208 × 30,208 px     | 9,600 |

The complete table covering 4 cm and 6 cm board sizes is in the [README](../README.md).

### Export issues

- **Browser crashes at the largest sizes.** The 24× and 32× Social presets require significant memory. Safari and iOS WebKit can OOM at the largest dimensions despite the application's explicit canvas-disposal pattern. Use a desktop browser, or reduce the quality multiplier.
- **Slow export.** High-resolution canvas operations are CPU-bound. Close other tabs; choose JPEG for faster encoding.
- **Colour drift after JPEG export.** JPEG compression alters colours subtly. Use PNG when colour fidelity matters.

---

## Customization

### Themes

20+ preset board themes are included. Custom colours can be defined through the HSL / RGB / HEX color picker.

### Piece Sets

23 piece sets are bundled. Custom piece-set upload is not supported in v5.5.3.

### Board options

- Flip board (view from Black's perspective).
- Toggle coordinate labels.
- Adjust physical board size (4 cm, 6 cm, 8 cm).

---

## Known Limitations (v5.5.3)

- **No keyboard shortcuts.** Standard browser tab navigation works; application-specific shortcuts are not implemented.
- **Home page lacks SVG export.** SVG export is currently exposed only on the Advanced FEN page.
- **No PGN import.** FEN input only.
- **No annotations.** Arrows and square highlights are not available.
- **Safari memory limits.** 24× and 32× Social exports may fail on Safari and iOS WebKit.
- **Canvas board is not accessible.** Screen readers cannot read the canvas-rendered board (see [ACCESSIBILITY.md](ACCESSIBILITY.md)).
- **No cross-device sync.** State is persisted to `localStorage` only.

A complete and current statement of known limitations is maintained in [ROADMAP.md](../ROADMAP.md) on `master`.

---

## Troubleshooting

### Board not displaying

1. Hard-refresh the page (Ctrl-F5 or Cmd-Shift-R).
2. Clear browser cache.
3. Check the network connection.
4. Try a different browser.

### Piece images missing

1. Refresh the page.
2. Try a different piece set.
3. Clear browser cache.

### Export not working

1. Verify the browser supports the Canvas API.
2. Reduce the export quality multiplier.
3. Allow downloads in browser settings.
4. Check that popup blockers are not interfering with the download.

---

## Development

### Report a bug

Use [GitHub Issues](https://github.com/chessvision-org/chess-vision/issues). Include browser version, operating system, reproduction steps, and screenshots. See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full reporting protocol.

### Contribute

Fork the repository, create a branch following the convention in [CONTRIBUTING.md](../CONTRIBUTING.md), and open a pull request. Conventional Commits are enforced by commitlint.

### Self-host

Clone the repository, run `pnpm install`, then `pnpm build`. Deploy the `dist/` directory to any static host. See the [README](../README.md) for the full build instructions.

---

**Last Updated:** 2026-05-23  
**Applies To:** v5.5.9
