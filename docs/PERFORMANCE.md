# Performance

Performance considerations and implemented optimisations for FENForsty Pro.

---

## Table of Contents

- [Overview](#overview)
- [Implemented Optimisations](#implemented-optimisations)
- [Code Splitting](#code-splitting)
- [Memory Usage](#memory-usage)
- [Browser Canvas Limits](#browser-canvas-limits)
- [Known Performance Issues](#known-performance-issues)
- [Performance Utilities](#performance-utilities)

---

## Overview

FENForsty Pro is a client-side only application that performs canvas-based rendering and exports high-resolution images. Performance concerns fall into two areas:

1. **Render performance** — keeping the interactive board and UI responsive during editing
2. **Export performance** — generating large canvases while keeping browser limits visible to the user

---

## Implemented Optimisations

### React.memo

The following components are wrapped with `React.memo` to prevent unnecessary re-renders when parent state changes:

- `ChessBoard`
- `BoardSquare`
- `MiniPreview`
- Feature panel components receiving stable props

### useMemo / useCallback

Used throughout the codebase:

- `useChessBoard` — memoises FEN → 8×8 board array conversion
- `useFENHistory` — memoises filtered history list (`filteredHistory`)
- All event handlers in context providers use `useCallback` with strict dependency arrays
- `FENBatchContext.addToBatch` uses an empty dep array + functional updater to remain stable across renders

### Debouncing

- FEN history persistence — written to localStorage with a 300 ms debounce to avoid thrashing on rapid state changes
- `performance.js` exports a generic `debounce(fn, wait)` utility used for input handlers

### Throttling

`performance.js` exports:

- `throttle(fn, limit)` — time-based throttle
- `rafThrottle(fn)` — `requestAnimationFrame`-based throttle with a `.cancel()` method, used for drag handlers to keep them in sync with the browser paint cycle

### Piece Image Caching

`pieceImageCache.js` caches loaded `HTMLImageElement` instances by piece-set key. `usePieceImages` uses the same cache, so the editor, preview, and export code do not reload the same piece set separately.

### Export Pause/Resume

The export loop in `canvasExporter.js` supports pausing (`pauseExport()`) and cancellation (`cancelExport()`). Progress now follows real export stages such as preparation, canvas rendering, encoding, and download.

### History Archiving

Inactive FEN history entries are automatically moved to a separate archive (`fen-history-archive` in localStorage) by `archiveManager.js`. This keeps the active history list small and avoids performance degradation in virtualised lists with thousands of entries.

### Virtualised Lists

`react-window` is used for rendering large FEN history and batch lists to avoid mounting thousands of DOM nodes.

---

## Code Splitting

All page components are lazy-loaded via `React.lazy`:

```javascript
const HomePage = lazy(() => import('@/pages/HomePage'));
const FENHistoryPage = lazy(() => import('@/pages/FENHistoryPage'));
const AdvancedFENInputPage = lazy(() => import('@/pages/AdvancedFENInputPage'));
// etc.
```

A single `<Suspense>` boundary in `Router.jsx` shows a chess-themed loading spinner while the page chunk loads. This reduces the initial bundle size and defers loading of heavy pages until they are visited.

---

## Memory Usage

Export memory is dominated by the canvas pixel buffer (`width × height × 4 bytes RGBA`):

| Quality    | Approx. Resolution | Approx. Memory |
| ---------- | ------------------ | -------------- |
| 8× @ 4 cm  | 3,776 × 3,776 px   | ~54 MB         |
| 8× @ 8 cm  | 7,552 × 7,552 px   | ~216 MB        |
| 16× @ 6 cm | 11,328 × 11,328 px | ~487 MB        |
| 24× @ 4 cm | 11,328 × 11,328 px | ~489 MB        |
| 32× @ 4 cm | 15,104 × 15,104 px | ~870 MB        |

**Note:** 24× and 32× exports keep the selected board size and increase pixel density. The progress dialog shows a memory estimate before and during large exports.

---

## Browser Canvas Limits

| Browser       | Max Dimension | Notes                             |
| ------------- | ------------- | --------------------------------- |
| Chrome / Edge | 32,767 px     | Chromium limit                    |
| Firefox       | 32,767 px     |                                   |
| Safari        | 16,384 px     | Also limited to 268 MP total area |

`getMaxCanvasSize()` in `utils/index.js` detects and returns the safe maximum for the current browser. The export system sets `willBeReduced: true` when the requested dimensions exceed this cap.

---

## Known Performance Issues

### Large Exports on Safari

Safari enforces a 16,384 px and 268 MP canvas limit. Very large exports can fail or produce a blank image. The export size helper reduces dimensions when the browser limit is reached.

### Canvas Full Redraw

The main editor uses DOM squares for interaction. Canvas rendering is kept for export and small preview areas. The hidden export-only board render was removed, so normal page navigation has less background work.

### No Web Worker for Export

All canvas rendering during export runs on the main thread. On slow devices, very large exports (16× and above) may cause the UI to become unresponsive despite the async progress animation. Web Worker offloading is not implemented.

### Sequential Batch Export

Batch export processes valid positions one at a time and gives each exported file a numbered name. This keeps memory usage lower than rendering several large canvases at once.

---

## Performance Utilities

`src/utils/performance.js` exports:

| Export           | Signature                        | Description                                           |
| ---------------- | -------------------------------- | ----------------------------------------------------- |
| `debounce`       | `(fn, wait = 300) => fn`         | Returns a debounced version of `fn`                   |
| `throttle`       | `(fn, limit = 300) => fn`        | Returns a time-throttled version of `fn`              |
| `rafThrottle`    | `(fn) => fn & { cancel() }`      | Returns an rAF-throttled version with a cancel method |
| `lazyLoadImages` | `(selector, options) => cleanup` | Sets up `IntersectionObserver` for lazy image loading |

`src/hooks/usePerformance.js` wraps `performance.mark` / `performance.measure` for timing individual operations during development.

---

**Last Updated:** May 6, 2026
**Version:** 5.0.0
