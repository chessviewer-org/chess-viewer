# Export Pipeline

Technical reference for the ChessViewer export system.

---

## Table of Contents

- [Overview](#overview)
- [Quality Presets](#quality-presets)
- [Export Formats](#export-formats)
- [Pipeline Architecture](#pipeline-architecture)
- [Resolution Calculation](#resolution-calculation)
- [Canvas Rendering](#canvas-rendering)
- [SVG Piece Embedding](#svg-piece-embedding)
- [Batch Export](#batch-export)
- [Browser Limits](#browser-limits)
- [File Reference](#file-reference)

---

## Overview

The export system converts a chess board configuration into a high-resolution image with precise control over physical size and pixel density.

- Physical board size in centimetres (4, 6, 8 cm, or any custom value from 4 to 8) — sets the printed size
- 4 quality presets from 300 DPI to 1200 DPI
- Formats: PNG, JPEG, SVG — several can be selected for one download
- Fairy positions include a composition legend, conditions and metadata
- DPI metadata embedded in PNG (`pHYs` chunk) and JPEG (JFIF density fields)
- SVG piece artwork embedded as vector `<symbol>` definitions — fully self-contained output
- Export can be paused, resumed, or cancelled mid-way
- Batch export: multiple FEN positions → individual files in a ZIP

---

## Quality Presets

Board pixel dimensions follow this formula:

```
boardPixels = round((boardSizeCm / 2.54) × 300 × multiplier)
effectiveDPI = 300 × multiplier
```

| Preset | DPI   | 4 cm             | 6 cm             | 8 cm             |
| ------ | ----- | ---------------- | ---------------- | ---------------- |
| 1×     | 300   | 472 × 472 px     | 708 × 708 px     | 944 × 944 px     |
| 2×     | 600   | 944 × 944 px     | 1,417 × 1,417 px | 1,890 × 1,890 px |
| 3×     | 900   | 1,417 × 1,417 px | 2,126 × 2,126 px | 2,835 × 2,835 px |
| 4×     | 1,200 | 1,890 × 1,890 px | 2,835 × 2,835 px | 3,780 × 3,780 px |

The values above are board-only dimensions. When coordinate borders are enabled, a border strip is added (`clamp(boardPixels × 0.05, 18px, 800px)`) along the left and bottom edges.

All four presets are well within the 16,384 px Safari canvas limit.

---

## Export Formats

### PNG

- Lossless compression
- Transparent background supported
- DPI embedded via the `pHYs` chunk (`changeDPI` from `@chessviewer-org/chess-viewer`)
- Best for print diagrams and archival

### JPEG

- Lossy compression (quality: 0.92) — roughly 50–70% smaller than PNG
- No transparency — white background applied before encoding
- DPI embedded via JFIF density fields
- Best for web sharing and email

### SVG

- Resolution-independent vector output
- Piece artwork embedded as vector `<symbol>` definitions, reused with `<use>` (self-contained file with no external image dependencies)
- Coordinate labels as `<text>` elements
- Fairy diagrams also embed the source notation (FFEN or Popeye)
- File size scales with board complexity, not pixel dimensions

---

## Pipeline Architecture

### Raster (PNG/JPEG)

```
User triggers export
  → validateExportConfig()        # checks FEN, colours, piece images, board size
  → resetExportState()            # clears cancel/pause flags
  → createRasterBlob()            # main-thread HTMLCanvasElement via createUltraQualityCanvas()
  → changeDPI()                   # injects DPI metadata into the blob
  → triggerDownload()             # <a download> click
  → canvas.width = 0             # mandatory Safari GPU memory release
```

**Canvas path**: `createRasterBlob` draws to a main-thread `HTMLCanvasElement` via `createUltraQualityCanvas()`. An earlier Web Worker path (`svgRasterWorker.ts`, `OffscreenCanvas` + `createImageBitmap`) was removed in October 2026: workers cannot decode SVG blobs with embedded `data:image/png` pieces, so every worker export failed and fell back to the canvas anyway.

### SVG

```
User triggers SVG export
  → generateBoardSVG()            # builds SVG string
      └─ fetchPieceSvgText()          # local or data-URL SVG source, cached by URL
      └─ buildPieceVector()           # validates viewBox and retains vector paths
  → Blob → URL.createObjectURL()
  → <a download> click
  → URL.revokeObjectURL()
```

---

## Resolution Calculation

`calculateRenderSurfaceSize()` in `imageOptimizer.ts` is the single source of truth for all dimension math:

```ts
boardPixels = round((boardSizeCm / 2.54) * 300 * exportQuality);
borderSize = showCoords ? clamp(boardPixels * 0.05, 18, 800) : 0;
canvasWidth = borderSize + boardPixels;
canvasHeight = boardPixels + borderSize;
effectiveDPI = 300 * exportQuality * scaleFactor;
```

If the computed canvas exceeds `getMaxCanvasSize()` (16,384 on Safari, 32,767 on Chrome), a `scaleFactor < 1` is applied and a warning is logged. At the current 4× maximum preset with an 8 cm board, the canvas is 3,780 px — well within both limits.

---

## Canvas Rendering

`createUltraQualityCanvas()` in `canvasRenderer.ts`:

1. Validates board size, colours, FEN, and piece images
2. Waits for all piece images to finish loading (`img.complete`)
3. Creates an off-screen `HTMLCanvasElement` sized to `canvasWidth × canvasHeight`
4. Draws squares with `ctx.fillRect` (64 total)
5. Draws pieces with `ctx.drawImage` — skips pieces where `img.naturalWidth === 0`
6. Draws coordinate labels with `ctx.fillText` if enabled
7. Yields to the main thread between row groups via `setTimeout(resolve, 0)`

After the blob is captured:

```ts
canvas.width = 0;
canvas.height = 0;
```

This is mandatory. Safari does not release canvas GPU backing memory on reference drop — skipping these two lines causes progressive memory growth and eventual tab crash on repeated exports.

---

## SVG Piece Embedding

`fetchPieceSvgText()` in `pieceSvg.ts` reads local SVG artwork or an SVG data
URL. The parsed source retains its vector paths and viewBox; `svgExporter.ts`
places each distinct piece in one `<symbol>` and uses `<use>` on board squares.
The output does not substitute a PNG when vector artwork cannot be read. It
returns an error for that piece, so an SVG request never silently becomes a
raster export. Temporary server failures are retried; a missing source is not.

SVG text is cached by source URL within a bounded memory budget. Concurrent
requests for the same piece share one promise.

---

## Batch Export

`AdvancedFENInputPage` iterates up to 10 FEN strings through the single-export pipeline:

1. Each position is exported in every selected format (PNG, JPEG, SVG)
2. `useAdvancedFEN.ts` packs the files into a ZIP with fflate
3. The ZIP is downloaded via a single `<a download>` trigger

The batch preview can also hand every valid position to LaTeX Studio.

Progress is reported per-file and globally across the batch.

---

## Browser Limits

| Browser | Max canvas dimension | Notes                                          |
| ------- | -------------------- | ---------------------------------------------- |
| Chrome  | 32,767 px            | Mobile Chrome may be lower                     |
| Safari  | 16,384 px            | GPU memory release requires `canvas.width = 0` |
| Firefox | 32,767 px            | —                                              |
| Edge    | 32,767 px            | —                                              |

`getMaxCanvasSize()` detects Safari via user-agent and returns the appropriate cap. The 4× preset at 8 cm produces a 3,780 px canvas — comfortably below all limits.

---

## File Reference

| File                                        | Role                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| `canvasExporter.ts`                         | Public API: `downloadPNG`, `downloadJPEG`, `copyToClipboard`                           |
| `exportRaster.ts`                           | `createRasterBlob()` — main-thread canvas rasterisation                                |
| `canvasRenderer.ts`                         | `createUltraQualityCanvas()` — main-thread draw                                        |
| `exportState.ts`                            | `cancelExport`, `pauseExport`, `resumeExport`, `validateExportConfig`, `getExportInfo` |
| `imageOptimizer.ts`                         | `calculateRenderSurfaceSize`, `getMaxCanvasSize`, `estimateFileSizes`                  |
| `svgExporter.ts`                            | `generateBoardSVG`, `downloadSVG`                                                      |
| `pieceUtils.ts`, `pieceSvg.ts`              | Piece-image loading, SVG source cache and vector extraction                            |
| `saveBlob.ts`                               | File download via `<a download>`                                                       |
| `pages/AdvancedFENInputPage/useAdvancedFEN` | Batch export and ZIP packing (fflate)                                                  |
| `@chessviewer-org/chess-viewer` `changeDPI` | pHYs (PNG) and JFIF (JPEG) DPI metadata                                                |

---

_Last updated: October 2026_
