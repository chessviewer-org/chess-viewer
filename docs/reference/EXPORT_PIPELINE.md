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

- Physical board size in centimetres (4, 6, 8 cm) — sets the printed size
- 4 quality presets from 300 DPI to 1200 DPI
- Formats: PNG, JPEG, SVG
- DPI metadata embedded in PNG (`pHYs` chunk) and JPEG (JFIF density fields)
- SVG pieces embedded as base64 data URLs — fully self-contained output
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
- DPI embedded via the `pHYs` chunk (`dpiEncoder.ts`)
- Best for print diagrams and archival

### JPEG

- Lossy compression (quality: 0.92) — roughly 50–70% smaller than PNG
- No transparency — white background applied before encoding
- DPI embedded via JFIF density fields
- Best for web sharing and email

### SVG

- Resolution-independent vector output
- Piece images embedded as base64 data URLs (self-contained file — no external dependencies)
- Coordinate labels as `<text>` elements
- File size scales with board complexity, not pixel dimensions

---

## Pipeline Architecture

### Raster (PNG/JPEG)

```
User triggers export
  → validateExportConfig()        # checks FEN, colours, piece images, board size
  → resetExportState()            # clears cancel/pause flags
  → createRasterBlob()            # chooses worker or canvas path
      ├─ [blob URLs present]  → createCanvasRasterBlob()   # main-thread HTMLCanvasElement
      └─ [CDN URLs only]      → createWorkerRasterBlob()   # SVG → OffscreenCanvas in Worker
  → changeDPI()                   # injects DPI metadata into the blob
  → triggerDownload()             # <a download> click
  → canvas.width = 0             # mandatory Safari GPU memory release
```

**Worker path** (`createWorkerRasterBlob`): generates an SVG string via `generateBoardSVG()`, sends it to `svgRasterWorker.ts` via `startSvgRasterWorkerTask()`, and receives a PNG/JPEG blob back. The worker uses `OffscreenCanvas` + `createImageBitmap` off the main thread.

**Canvas path** (`createCanvasRasterBlob`): draws directly to a main-thread `HTMLCanvasElement` via `createUltraQualityCanvas()`. Used when piece images are blob URLs (the default case — `pieceImageCache.ts` rasterizes CDN SVGs to 256px blob URLs), because `createImageBitmap` in a worker cannot decode SVG blobs containing embedded `data:image/png` chunks.

### SVG

```
User triggers SVG export
  → generateBoardSVG()            # builds SVG string
      └─ imageToEmbeddableDataURL()   # per piece: blob URL → canvas → base64 PNG
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

`imageToEmbeddableDataURL()` in `svgPieceLoader.ts` converts each piece image to a data URL for inline SVG embedding:

- **`blob:` URL** (standard path — `pieceImageCache.ts` rasterizes CDN SVGs to blob URLs): draws the already-loaded `HTMLImageElement` to a temporary canvas and returns a `data:image/png;base64,...` string. Canvas is disposed immediately after.
- **`https://` URL**: fetches the SVG source text and returns `data:image/svg+xml;base64,...` for true vector embedding.
- **`data:` URL**: returned as-is.

Results are cached by `img.src` (max 48 entries, FIFO eviction).

---

## Batch Export

`AdvancedFENInputPage` iterates up to 10 FEN strings through the single-export pipeline:

1. Each position is exported as PNG/JPEG/SVG (or all three)
2. Files collected by `archiveManager.ts`
3. ZIP downloaded via a single `<a download>` trigger

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

| File                    | Role                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `canvasExporter.ts`     | Public API: `downloadPNG`, `downloadJPEG`, `copyToClipboard`                           |
| `exportRaster.ts`       | `createRasterBlob()` — worker-first, canvas fallback                                   |
| `canvasRenderer.ts`     | `createUltraQualityCanvas()` — main-thread draw                                        |
| `exportState.ts`        | `cancelExport`, `pauseExport`, `resumeExport`, `validateExportConfig`, `getExportInfo` |
| `imageOptimizer.ts`     | `calculateRenderSurfaceSize`, `getMaxCanvasSize`, `estimateFileSizes`                  |
| `svgExporter.ts`        | `generateBoardSVG`, `downloadSVG`                                                      |
| `svgPieceLoader.ts`     | `imageToEmbeddableDataURL`, `waitForPieceImage`                                        |
| `workerRasterExport.ts` | `startSvgRasterWorkerTask`, `isSvgRasterWorkerSupported`                               |
| `svgRasterWorker.ts`    | Web Worker entry — `createImageBitmap` + `OffscreenCanvas`                             |
| `dpiEncoder.ts`         | `changeDPI()` — pHYs (PNG) and JFIF (JPEG) metadata injection                          |
| `archiveManager.ts`     | `compileArchive()` — ZIP from multiple blobs                                           |
| `pieceImageCache.ts`    | `preloadPieceStyle()` — CDN SVG → 256px blob URL cache                                 |

---

_Last updated: June 2026 — v6.1.0_
