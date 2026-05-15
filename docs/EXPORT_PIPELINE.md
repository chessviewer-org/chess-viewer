# Export Pipeline Documentation

Technical documentation for the ChessVision export system.

---

## Table of Contents

- [Overview](#overview)
- [Export Modes](#export-modes)
- [Quality Settings](#quality-settings)
- [Export Formats](#export-formats)
- [Export Pipeline Architecture](#export-pipeline-architecture)
- [Resolution Calculation](#resolution-calculation)
- [Canvas Rendering](#canvas-rendering)
- [Batch Export](#batch-export)
- [Error Handling](#error-handling)
- [Browser Compatibility](#browser-compatibility)
- [API Reference](#api-reference)

---

## Overview

The export system converts canvas-based chess board visualisations into high-resolution static images with precise control over physical dimensions and pixel density.

### Key Features

- **Dual Export Modes**: Print mode (preserves physical dimensions) and Social mode (fixed large output)
- **Dynamic Scaling**: Board size controls physical print dimensions; quality controls pixel density
- **High Resolution**: Export up to 24,192×24,192 px (Social 32×)
- **Multiple Formats**: PNG, JPEG, and SVG (SVG currently exposed in Advanced FEN actions)
- **Physical Size Metadata**: PNG/JPEG exports embed DPI metadata for print workflows
- **Background Rasterization**: SVG-to-raster jobs run in a worker when supported
- **Pause / Resume / Cancel**: Export can be paused, resumed, or cancelled mid-way
- **Batch Processing**: Export multiple FEN positions simultaneously via `advancedExport.js`
- **Clipboard Support**: Direct copy to system clipboard

---

## Export Modes

### Print Mode (8× and 16× Quality)

**Purpose**: Generate print-ready diagrams with exact physical dimensions.

**Behaviour**:

- Board size selection (4 cm, 6 cm, 8 cm) determines the output physical dimensions
- Quality multiplier increases pixel density (DPI) without changing the printed physical size
- Aspect ratio 1:1 always maintained
- Coordinate borders are optional

**Formula**:

```
pixelDimensions = (boardSizeCM / 2.54) × baseDPI × qualityMultiplier
baseDPI = 300
effectiveDPI = baseDPI × qualityMultiplier × scaleFactor
```

**Examples**:

| Quality | Size | Pixel Dimensions   | Effective DPI |
| ------- | ---- | ------------------ | ------------- |
| 8×      | 4 cm | 3,776 × 3,776 px   | 2,400 DPI     |
| 8×      | 6 cm | 5,664 × 5,664 px   | 2,400 DPI     |
| 8×      | 8 cm | 7,552 × 7,552 px   | 2,400 DPI     |
| 16×     | 4 cm | 7,552 × 7,552 px   | 4,800 DPI     |
| 16×     | 6 cm | 11,328 × 11,328 px | 4,800 DPI     |
| 16×     | 8 cm | 15,104 × 15,104 px | 4,800 DPI     |

### Social Mode (24× and 32× Quality)

**Purpose**: Generate large diagrams optimised for screen viewing and social media.

**Behaviour**:

- Fixed pixel output regardless of board size selection
- Coordinate borders always enabled (forced)
- Larger file sizes for maximum detail

**Base Resolutions**:

| Quality | Resolution         |
| ------- | ------------------ |
| 24×     | 18,112 × 18,112 px |
| 32×     | 24,192 × 24,192 px |

---

## Quality Settings

### Quality Presets

| Quality | Mode   | Effective DPI | Approx. PNG Size | Approx. JPEG Size |
| ------- | ------ | ------------- | ---------------- | ----------------- |
| 8×      | Print  | 2,400         | 70–500 KB        | 30–200 KB         |
| 16×     | Print  | 4,800         | 500–900 KB       | 200–400 KB        |
| 24×     | Social | —             | 1.2–2.0 MB       | 500–800 KB        |
| 32×     | Social | —             | 2.5–4.0 MB       | 1.0–1.5 MB        |

---

## Export Formats

### PNG

| Property      | Value                |
| ------------- | -------------------- |
| Compression   | Lossless             |
| Transparency  | Supported            |
| Best for      | Print, web, diagrams |
| Relative size | Larger               |

### JPEG

| Property      | Value                               |
| ------------- | ----------------------------------- |
| Compression   | Lossy                               |
| Transparency  | Not supported                       |
| Best for      | Social media, email, web sharing    |
| Relative size | Smaller (60–80% reduction over PNG) |

### SVG

| Property     | Value                                                           |
| ------------ | --------------------------------------------------------------- |
| Type         | Vector                                                          |
| Transparency | Supported                                                       |
| Best for     | Scalable diagrams, post-processing in vector tools              |
| Notes        | Generated from board state + piece assets, then saved as `.svg` |

---

## Export Pipeline Architecture

### High-Level Flow

```
User triggers export
        │
        ▼
validateExportConfig(config)
  - boardSize, fen, lightSquare, darkSquare, pieceImages must be present
        │
        ▼
getExportInfo(config)
  - calculateRenderSurfaceSize(boardSize, showCoords, exportQuality, showThinFrame)
  - getExportMode(exportQuality) → 'print' | 'social'
  - estimateFileSizes(width, height, exportQuality)
        │
        ▼
generateBoardSVG(config)
        │
        ▼
Worker raster path (preferred when supported)
  - svgRasterWorker.js + OffscreenCanvas
  - Produces PNG/JPEG blob off the main thread
        │
        ├── fallback:
        │      createUltraQualityCanvas(config)
        │      (main-thread canvas renderer)
        │
        ▼
changeDPI(blob, effectiveDPI, format)
        │
        ▼
Download via <a download> link  OR  navigator.clipboard.write()
```

### Export State Machine

`canvasExporter.js` maintains a module-level `exportState` object:

```javascript
let exportState = { cancelled: false, paused: false };
```

| Function             | Effect                       |
| -------------------- | ---------------------------- |
| `cancelExport()`     | Sets `cancelled = true`      |
| `pauseExport()`      | Sets `paused = true`         |
| `resumeExport()`     | Sets `paused = false`        |
| `resetExportState()` | Resets both flags to `false` |

The export loop calls `checkCancellation()` and `waitWhilePaused()` at regular checkpoints, allowing cancellation or pausing without hanging the browser.

### Progress Reporting

Progress is reported through an `onProgress(0–100)` callback. The `simulateProgress(onProgress, start, end, duration)` helper animates progress smoothly across a range using 20 steps over the specified duration.

### Export Configuration Object

```javascript
{
  fen: string,             // FEN position string
  boardSize: number,       // Physical size in cm (4 | 6 | 8)
  exportQuality: number,   // Quality multiplier (8 | 16 | 24 | 32)
  lightSquare: string,     // Hex color for light squares
  darkSquare: string,      // Hex color for dark squares
  pieceImages: object,     // { 'wK': HTMLImageElement, ... }
  isFlipped: boolean,      // Board orientation
  showCoords: boolean,     // Whether to show coordinate labels
  format: string           // 'png' | 'jpeg' | 'svg'
}
```

---

## Resolution Calculation

For Print mode, dimensions are calculated in `imageOptimizer.js` using:

```
boardPixels = (boardSizeCM / 2.54) × 300 × qualityFactor
```

For Social mode, fixed base sizes apply regardless of `boardSizeCM`.

The exported image width and height include the coordinate border region when `showCoords` is enabled (a border strip is added on the left and bottom sides whose width scales proportionally with board size).

PNG exports store this density via a `pHYs` chunk, and JPEG exports store it via JFIF density fields, so placement in print tools (Word / desktop publishing / print drivers) respects physical size.

**Coordinate border formulas:**

```
borderSize = clamp(boardPixels × 0.05, 18px, 800px)
fontSize   = clamp(borderSize × 0.72, 10px, 480px)
```

### Browser Canvas Limits

| Browser       | Max Dimension | Notes                             |
| ------------- | ------------- | --------------------------------- |
| Chrome / Edge | 32,767 px     | Chromium limit                    |
| Firefox       | 32,767 px     |                                   |
| Safari        | 16,384 px     | Also limited by 268 MP total area |

`getMaxCanvasSize()` returns the safe maximum for the current browser. `getExportInfo` includes `willBeReduced: true` when requested dimensions exceed this cap.

---

## Canvas Rendering

### Square Drawing

Board squares are drawn with `ctx.fillStyle = color; ctx.fillRect(...)` for each of the 64 squares. Square color alternates based on `(row + col) % 2`.

Board flipping is achieved by reversing the iteration order — the board array indices are adjusted so Black's perspective is rendered correctly.

### Piece Drawing

Piece images are drawn with `ctx.drawImage(img, x, y, squareSize, squareSize)`. Images are loaded and cached once by `usePieceImages` / `pieceImageCache.js` before export begins.

`ctx.imageSmoothingEnabled = true` and `ctx.imageSmoothingQuality = 'high'` are set for piece rendering.

### Coordinate Labels

When `showCoords` is enabled, a border region is added. Rank numbers (1–8) are drawn on the left side, file letters (a–h) on the bottom. Font size and border width scale dynamically with board pixel dimensions.

---

## Batch Export

Batch export is available in Advanced FEN quick actions and utility flows. It iterates positions sequentially and supports `downloadPNG`, `downloadJPEG`, and `downloadSVG`. Outputs are individual files per position.

---

## Error Handling

### Common Error Cases

| Error                             | Cause                           | Handling                                                                            |
| --------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| `Invalid export config`           | Missing required field          | `validateExportConfig` throws with a descriptive message listing all missing fields |
| `Canvas creation returned null`   | Browser refused canvas creation | Caught and rethrown with context                                                    |
| `Export cancelled`                | `cancelExport()` was called     | `checkCancellation()` throws; caught by caller                                      |
| `Failed to create blob`           | `canvas.toBlob` returned `null` | Caught and rethrown                                                                 |
| Canvas size exceeds browser limit | 32× on Safari                   | `willBeReduced` flag; actual dimensions capped                                      |
| Out of memory                     | 32× on low-RAM devices          | May throw or produce blank canvas; no graceful recovery                             |

---

## Browser Compatibility

| Feature                 | Chrome | Firefox | Safari                        | Edge |
| ----------------------- | ------ | ------- | ----------------------------- | ---- |
| Canvas API              | ✅     | ✅      | ✅                            | ✅   |
| `canvas.toBlob()`       | ✅     | ✅      | ✅                            | ✅   |
| Clipboard API (`write`) | ✅     | ✅      | ⚠️ Requires user gesture      | ✅   |
| 24×/32× export          | ✅     | ✅      | ⚠️ May fail (16,384 px limit) | ✅   |

---

## API Reference

### `downloadPNG(config, fileName, onProgress)`

Exports the board as a PNG file (lossless, supports transparency).

**Parameters:**

| Name         | Type     | Description                             |
| ------------ | -------- | --------------------------------------- |
| `config`     | object   | Export configuration object (see above) |
| `fileName`   | string   | File name without extension             |
| `onProgress` | function | `(0–100) => void` progress callback     |

**Returns:** `Promise<void>` — triggers browser download.

---

### `downloadJPEG(config, fileName, onProgress)`

Exports the board as a JPEG file.

**Parameters:** Same as `downloadPNG`.

**Returns:** `Promise<void>` — triggers browser download.

---

### `copyToClipboard(config)`

Copies the board image to the system clipboard as PNG.

**Parameters:**

| Name     | Type   | Description                 |
| -------- | ------ | --------------------------- |
| `config` | object | Export configuration object |

**Returns:** `Promise<void>`

---

### `downloadSVG(config, fileName, onProgress)`

Exports the board as an SVG file.

**Parameters:** Same shape as `downloadPNG` / `downloadJPEG`.

**Returns:** `Promise<void>` — triggers browser download.

---

### `getExportInfo(config)`

Returns dimension and file-size information without triggering an export. Use this to show estimated output size to the user before exporting.

**Parameters:** `config` — partial config with `boardSize`, `showCoords`, `exportQuality`.

**Returns:**

```javascript
{
  displaySize: string,         // e.g. '3776 × 3776'
  exportWidth: number,
  exportHeight: number,
  requestedQuality: number,
  actualQuality: number,       // May differ if capped by browser limit
  maxCanvasSize: number,
  willBeReduced: boolean,
  fileSizeEstimate: object,    // { png: string, jpeg: string }
  mode: string,                // 'print' | 'social'
  physicalSizeCm: number,
  effectiveDPI: number,
  forceCoordinateBorder: boolean
}
```

---

### `cancelExport()` / `pauseExport()` / `resumeExport()`

Control an in-progress export. These functions mutate module-level state and take effect at the next checkpoint in the export loop.

---

**Last Updated:** May 6, 2026  
**Version:** 5.0.0
