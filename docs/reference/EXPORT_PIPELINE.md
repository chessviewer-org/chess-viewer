# Export Pipeline

Technical reference for the ChessVision export system.

---

## Table of Contents

- [Overview](#overview)
- [Export Modes](#export-modes)
- [Quality Settings](#quality-settings)
- [Export Formats](#export-formats)
- [Pipeline Architecture](#pipeline-architecture)
- [Resolution Calculation](#resolution-calculation)
- [Canvas Rendering](#canvas-rendering)
- [Batch Export](#batch-export)
- [Error Handling](#error-handling)
- [Browser Compatibility](#browser-compatibility)
- [API Reference](#api-reference)

---

## Overview

The export system converts canvas-based chess board visualizations into high-resolution static images with precise control over physical dimensions and pixel density.

- Dual export modes: Print (physical dimensions) and Social (fixed large output)
- Up to 30,208 × 30,208 px at 9,600 DPI
- Formats: PNG, JPEG, SVG
- DPI metadata embedded in PNG (`pHYs` chunk) and JPEG (JFIF density fields)
- SVG-to-raster jobs run in a Web Worker via `OffscreenCanvas`
- Export can be paused, resumed, or cancelled mid-way
- Batch export: multiple FEN positions → individual files

---

## Export Modes

### Print Mode (8× and 16×)

Physical board size (4 cm, 6 cm, 8 cm) determines the printed physical dimensions. Quality multiplier increases pixel density (DPI) without changing the printed size. Aspect ratio is always 1:1.

**Formula:**

```
boardPixels = round((boardSizeCm / 2.54) × 300 × qualityMultiplier)
effectiveDPI = 300 × qualityMultiplier
```

| Quality | Size | Pixel Dimensions   | Effective DPI |
| ------- | ---- | ------------------ | ------------- |
| 8×      | 4 cm | 3,776 × 3,776 px   | 2,400         |
| 8×      | 6 cm | 5,664 × 5,664 px   | 2,400         |
| 8×      | 8 cm | 7,552 × 7,552 px   | 2,400         |
| 16×     | 4 cm | 7,552 × 7,552 px   | 4,800         |
| 16×     | 6 cm | 11,328 × 11,328 px | 4,800         |
| 16×     | 8 cm | 15,104 × 15,104 px | 4,800         |

### Social Mode (24× and 32×)

Fixed pixel output regardless of board size selection. Coordinate borders are always enabled.

| Quality | Board size | Pixel Dimensions   | Effective DPI |
| ------- | ---------- | ------------------ | ------------- |
| 24×     | 4 cm       | 11,328 × 11,328 px | 7,200         |
| 24×     | 6 cm       | 16,992 × 16,992 px | 7,200         |
| 24×     | 8 cm       | 22,656 × 22,656 px | 7,200         |
| 32×     | 4 cm       | 15,104 × 15,104 px | 9,600         |
| 32×     | 6 cm       | 22,656 × 22,656 px | 9,600         |
| 32×     | 8 cm       | 30,208 × 30,208 px | 9,600         |

---

## Quality Settings

| Quality | Mode   | Approx. PNG size | Approx. JPEG size |
| ------- | ------ | ---------------- | ----------------- |
| 8×      | Print  | 70–500 KB        | 30–200 KB         |
| 16×     | Print  | 500–900 KB       | 200–400 KB        |
| 24×     | Social | 1.2–4.0 MB       | 500–800 KB        |
| 32×     | Social | 4.6–18.0 MB      | 1.0–6.0 MB        |

---

## Export Formats

### PNG

- Lossless compression
- Supports transparency
- DPI embedded via `pHYs` chunk (`dpiEncoder.ts`)
- Best for print and diagrams

### JPEG

- Lossy compression (~60–80% smaller than PNG)
- No transparency
- DPI embedded via JFIF density fields
- Best for social media and email

### SVG

- Vector format — resolution-independent
- Supports transparency
- Generated from board state and piece assets via `svgExporter.ts`
- Currently exposed in Advanced FEN export actions

---

## Pipeline Architecture

### High-Level Flow

```
User triggers export
        │
        ▼
validateExportConfig(config)
  — boardSize, fen, lightSquare, darkSquare, pieceImages required
        │
        ▼
getExportInfo(config)
  — calculateRenderSurfaceSize() → pixel dimensions
  — getExportMode() → 'print' | 'social'
  — estimateFileSizes()
        │
        ▼
generateBoardSVG(config)                         [svgExporter.ts]
        │
        ▼
Worker raster path (preferred when supported)
  — svgRasterWorker.ts via OffscreenCanvas
  — SVG Blob → createImageBitmap → OffscreenCanvas → convertToBlob
        │
        ├── fallback (worker unavailable):
        │      createUltraQualityCanvas(config)  [canvasRenderer.ts]
        │      main-thread canvas renderer
        │
        ▼
changeDPI(blob, effectiveDPI, format)            [dpiEncoder.ts]
        │
        ▼
Download via <a download>  OR  navigator.clipboard.write()
```

### Export State Machine

`exportState.ts` maintains module-level cancel/pause flags shared across all export calls:

| Function             | Effect                       |
| -------------------- | ---------------------------- |
| `cancelExport()`     | Sets `cancelled = true`      |
| `pauseExport()`      | Sets `paused = true`         |
| `resumeExport()`     | Sets `paused = false`        |
| `resetExportState()` | Resets both flags to `false` |

The export loop calls `checkCancellation()` and `waitWhilePaused()` at every async checkpoint.

### Progress Reporting

Progress is reported via an `onProgress(0–100)` callback. `simulateProgress(onProgress, start, end, duration)` animates progress across a range using 20 steps.

### Export Configuration Object

```typescript
{
  fen: string,             // FEN position string
  boardSize: number,       // Physical size in cm (4 | 6 | 8)
  exportQuality: number,   // Quality multiplier (8 | 16 | 24 | 32)
  lightSquare: string,     // Hex color for light squares
  darkSquare: string,      // Hex color for dark squares
  pieceImages: object,     // { 'wK': HTMLImageElement, ... }
  isFlipped: boolean,
  showCoords: boolean,
  format: string           // 'png' | 'jpeg' | 'svg'
}
```

---

## Resolution Calculation

Pixel dimensions are computed in `imageOptimizer.ts`:

```
boardPixels = round((boardSizeCm / 2.54) × 300 × qualityFactor)
```

When `showCoords` is enabled, a coordinate border region is added to the left and bottom sides:

```
borderSize = clamp(boardPixels × 0.05, 18px, 800px)
fontSize   = clamp(borderSize × 0.72, 10px, 480px)
```

The total exported image dimensions include this border region.

### Browser Canvas Limits

| Browser       | Max dimension | Notes                             |
| ------------- | ------------- | --------------------------------- |
| Chrome / Edge | 32,767 px     | Chromium limit                    |
| Firefox       | 32,767 px     |                                   |
| Safari        | 16,384 px     | Also limited by 268 MP total area |

`getMaxCanvasSize()` returns the safe maximum for the current browser. `getExportInfo` includes `willBeReduced: true` when requested dimensions exceed this cap.

---

## Canvas Rendering

### Square Drawing

```
ctx.fillStyle = color;
ctx.fillRect(x, y, squareSize, squareSize);
```

Square color alternates based on `(row + col) % 2`. Board flipping reverses the iteration order.

### Piece Drawing

```
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';
ctx.drawImage(img, x, y, squareSize, squareSize);
```

Piece images are loaded and cached once by `usePieceImages` / `pieceImageCache.ts` before export begins.

### Canvas Disposal

After every `canvas.toBlob()` call:

```typescript
canvas.width = 0;
canvas.height = 0;
```

This is mandatory on Safari — Safari does not garbage-collect canvas GPU memory on reference drop alone.

---

## Batch Export

Batch export iterates positions from `FENBatchContext` sequentially. Each position runs through the full single-export pipeline. Outputs are individual files named with an incrementing numeric prefix. A ZIP archive can be generated via `archiveManager.ts`.

---

## Error Handling

| Error                             | Cause                           | Handling                                                 |
| --------------------------------- | ------------------------------- | -------------------------------------------------------- |
| `Invalid export config`           | Missing required field          | `validateExportConfig` throws listing all missing fields |
| `Canvas creation returned null`   | Browser refused canvas creation | Caught and rethrown with context                         |
| `Export cancelled`                | `cancelExport()` called         | `checkCancellation()` throws; caught by caller           |
| `Failed to create blob`           | `canvas.toBlob` returned `null` | Caught and rethrown                                      |
| Canvas size exceeds browser limit | 32× on Safari                   | `willBeReduced` flag; actual dimensions capped           |
| Out of memory                     | 32× on low-RAM devices          | May throw or produce blank canvas; no graceful recovery  |

---

## Browser Compatibility

| Feature                 | Chrome | Firefox | Safari                     | Edge |
| ----------------------- | ------ | ------- | -------------------------- | ---- |
| Canvas API              | Yes    | Yes     | Yes                        | Yes  |
| `canvas.toBlob()`       | Yes    | Yes     | Yes                        | Yes  |
| Clipboard API (`write`) | Yes    | Yes     | Requires user gesture      | Yes  |
| OffscreenCanvas         | Yes    | Yes     | Yes (Safari 16.4+)         | Yes  |
| 24×/32× export          | Yes    | Yes     | May fail (16,384 px limit) | Yes  |

---

## API Reference

### `downloadPNG(config, fileName, onProgress)`

Exports the board as a PNG file.

| Parameter    | Type     | Description                             |
| ------------ | -------- | --------------------------------------- |
| `config`     | object   | Export configuration object (see above) |
| `fileName`   | string   | File name without extension             |
| `onProgress` | function | `(value: number) => void`, range 0–100  |

Returns: `Promise<void>` — triggers browser download.

---

### `downloadJPEG(config, fileName, onProgress)`

Exports the board as a JPEG file. Same parameters as `downloadPNG`.

Returns: `Promise<void>` — triggers browser download.

---

### `downloadSVG(config, fileName, onProgress)`

Exports the board as an SVG file. Same parameters as `downloadPNG`.

Returns: `Promise<void>` — triggers browser download.

---

### `copyToClipboard(config)`

Copies the board image to the system clipboard as PNG.

| Parameter | Type   | Description                 |
| --------- | ------ | --------------------------- |
| `config`  | object | Export configuration object |

Returns: `Promise<void>`

---

### `getExportInfo(config)`

Returns dimension and file-size information without triggering an export. Use this to show estimated output to the user before exporting.

Parameters: partial config with `boardSize`, `showCoords`, `exportQuality`.

Returns:

```typescript
{
  displaySize: string,         // e.g. '3776 × 3776'
  exportWidth: number,
  exportHeight: number,
  requestedQuality: number,
  actualQuality: number,       // may differ if capped by browser limit
  maxCanvasSize: number,
  willBeReduced: boolean,
  fileSizeEstimate: { png: string, jpeg: string },
  mode: 'print' | 'social',
  physicalSizeCm: number,
  effectiveDPI: number,
  forceCoordinateBorder: boolean
}
```

---

### `cancelExport()` / `pauseExport()` / `resumeExport()`

Control an in-progress export. These mutate module-level state and take effect at the next checkpoint in the export loop.

---

_Last updated: May 2026 — v6.0.0_
