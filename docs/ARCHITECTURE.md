# ChessVision — Architecture Documentation (v5.5.3)

This document describes the architecture of the `master` branch at **v5.5.3**. Forward-looking work that lives on `develop` (authentication, multi-factor authentication, encrypted cloud sync, Web Worker rasterization, and full TypeScript migration) is intentionally not described here and will be integrated when it ships on `master`.

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [State Management](#state-management)
- [Routing](#routing)
- [Canvas Rendering](#canvas-rendering)
- [Export System](#export-system)
- [Out of Scope (v5.x)](#out-of-scope-v5x)

---

## Project Overview

A React-based single-page application that renders chess positions from FEN notation, supports interactive drag-and-drop board editing, and exports high-resolution raster and vector images via HTML5 Canvas.

**Core Principles:**

- Component-based architecture with feature-domain grouping.
- Functional components with React hooks exclusively.
- Canvas-based board rendering and image export.
- Zero backend; all state persisted in `localStorage`.
- Lazy-loaded pages with manual vendor chunking.
- Three context providers (`FENBatchContext`, `LayoutContext`, `ThemeSettingsContext`) for cross-tree state.
- Conventional Commits with `semantic-release` operating against `master`.

---

## Technology Stack

### Frontend

- **React 19.x** — UI library with hooks
- **TypeScript 6.x** — Language. The v5.x source tree is predominantly `.jsx` / `.js`; selected files such as `fenParser.ts`, `fenValidationDetailed.ts`, and `useDebouncedFENValidation.ts` are typed.
- **React Router DOM 7.x** — Client-side routing
- **Framer Motion 12.x** — Page-transition animations
- **React DnD 16.x** with `HTML5Backend` and `TouchBackend` — Drag-and-drop piece interaction
- **react-window 2.x** with `react-window-infinite-loader` — Virtualized list rendering
- **Lucide React 1.x** and `react-icons` — Icon libraries
- **canvg 4.x** — SVG-to-canvas rasterization used by the SVG export path

### Styling

- **Tailwind CSS 4.x** — Utility-first CSS via `@tailwindcss/postcss`
- **PostCSS / Autoprefixer** — CSS build pipeline

### Build & Tooling

- **Vite 8.x** — Build tool and dev server (port 3000)
- **pnpm 10.x** — Package manager (`packageManager: pnpm@10.33.0`)
- **ESLint 9.x** with `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` — Linting (production: `--max-warnings=0`)
- **Prettier** — Code formatting
- **Husky + lint-staged** — Pre-commit hooks
- **commitlint** with Conventional Commits — Commit-message enforcement
- **semantic-release 25.x** — Automated versioning and release notes from Conventional Commits, operating against `master`
- **Node test runner** (`node --test`) — Unit tests against `src/utils/fenParser.test.js`. No experimental Node flags required on the v5.x line.

### Browser APIs

- **HTML5 Canvas API** — Board rendering and image export
- **Blob & URL APIs** — Image download
- **localStorage** — State persistence
- **Clipboard API** — Copy image to clipboard
- **`<a download>`** — File-download fallback

---

## Project Structure

```
chess-vision/
│
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── robots.txt
│   └── sitemap.xml
│
├── src/
│   ├── App.tsx                # Root component — light/dark theme & layout
│   ├── index.tsx              # Application entry point
│   ├── index.css              # Global styles
│   │
│   ├── routes/
│   │   └── Router.jsx         # React Router with lazy-loaded pages
│   │
│   ├── pages/                 # Page-level components
│   │   ├── HomePage.jsx       # Main board + controls
│   │   ├── AboutPage.jsx      # About / credits
│   │   ├── DownloadPage.jsx   # PWA install guide
│   │   ├── SupportPage.jsx    # Help & support
│   │   ├── SettingsPage.jsx   # Application settings
│   │   ├── FENHistoryPage.jsx # FEN history browser
│   │   ├── AdvancedFENInputPage/AdvancedFENInputPage.jsx # Multi-FEN batch editor
│   │   ├── NotFoundPage.jsx   # 404 page
│   │   ├── index.js
│   │   └── settings/
│   │       ├── ExportCustomization.jsx
│   │       ├── ThemeCustomization.jsx
│   │       └── index.js
│   │
│   ├── components/
│   │   ├── index.js
│   │   │
│   │   ├── board/             # Chess board rendering components
│   │   │   ├── BoardGrid/     # Board grid layout
│   │   │   ├── BoardSquare/   # Individual square
│   │   │   ├── ChessBoard/    # Main board with canvas rendering
│   │   │   ├── MiniPreview/   # Thumbnail preview for history
│   │   │   └── index.js
│   │   │
│   │   ├── features/          # Feature-domain components
│   │   │   ├── ActionButtons/ # Export / copy action buttons
│   │   │   ├── ClipboardHistory/ # Clipboard copy history
│   │   │   ├── ColorPicker/   # Board color picker
│   │   │   │   ├── parts/     # ColorCanvas, HueSlider, ColorInput, etc.
│   │   │   │   ├── views/     # ThemeMainView, ThemeAdvancedPickerView, ThemeSettingsView
│   │   │   │   └── PickerModal.jsx
│   │   │   ├── ControlPanel/  # Board controls (flip, reset, etc.)
│   │   │   ├── DisplayOptions/ # Show/hide display options
│   │   │   ├── Export/        # Export settings, progress, size control
│   │   │   │   ├── BoardSizeControl/
│   │   │   │   ├── ExportOptionsDialog/
│   │   │   │   ├── ExportProgress/
│   │   │   │   ├── ExportSettings/
│   │   │   │   └── index.js
│   │   │   ├── Fen/           # FEN input and related components
│   │   │   │   ├── BoardPreview/
│   │   │   │   ├── FENInputField/
│   │   │   │   ├── FENInputList/
│   │   │   │   ├── PieceSelector/
│   │   │   │   └── index.js
│   │   │   ├── HelpCenter/    # In-app help panel
│   │   │   ├── History/       # FEN history UI
│   │   │   │   ├── ConfirmationModal/
│   │   │   │   ├── HistoryFilters/
│   │   │   │   ├── StatusBadge/
│   │   │   │   └── index.js
│   │   │   ├── Theme/         # Theme preset selector
│   │   │   │   └── ThemeSelector.jsx
│   │   │   ├── UserGuide/     # Onboarding user guide
│   │   │   └── index.js
│   │   │
│   │   ├── interactions/      # Drag-and-drop interaction components
│   │   │   ├── ChessEditor/   # Full interactive board editor
│   │   │   ├── CustomDragLayer/ # Custom DnD drag preview layer
│   │   │   ├── DndProvider/   # React DnD context (HTML5 + touch backends)
│   │   │   ├── DraggablePiece/ # Draggable piece wrapper
│   │   │   ├── DroppableSquare/ # Droppable board square
│   │   │   ├── InteractiveBoard/ # Board with drag-and-drop enabled
│   │   │   ├── PiecePalette/  # Piece selection palette for board editing
│   │   │   ├── TrashZone/     # Drop zone to remove pieces
│   │   │   └── index.js
│   │   │
│   │   ├── layout/            # App-level layout components
│   │   │   ├── Navbar/        # Navigation bar (hidden on tool pages)
│   │   │   └── index.js
│   │   │
│   │   └── ui/                # Reusable UI primitives
│   │       ├── Badge/
│   │       ├── Button/
│   │       ├── Card/
│   │       ├── Checkbox/
│   │       ├── CustomSelect/
│   │       ├── DatePicker/
│   │       ├── ErrorBoundary/
│   │       ├── Input/
│   │       ├── Modal/
│   │       ├── NotificationContainer/
│   │       ├── RangeSlider/
│   │       ├── SearchableSelect/
│   │       ├── Select/
│   │       └── index.js
│   │
│   ├── contexts/              # React context providers
│   │   ├── FENBatchContext.jsx       # Batch FEN list, persisted to localStorage
│   │   ├── FENBatchStore.js          # Store object + type declaration
│   │   ├── LayoutContext.jsx         # UI layout state
│   │   ├── ThemeSettingsContext.jsx  # Color-picker settings, recent colors, sound
│   │   ├── useFENBatch.js            # Consumer hook
│   │   └── index.js
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useCanvasPicker.js
│   │   ├── useChessBoard.js
│   │   ├── useColorConversion.js
│   │   ├── useColorState.js
│   │   ├── useDebouncedFENValidation.ts
│   │   ├── useFENHistory.js
│   │   ├── useInteractiveBoard.js
│   │   ├── useIntersectionObserver.js
│   │   ├── useLocalStorage.js
│   │   ├── useNotifications.js
│   │   ├── useOutsideClick.js
│   │   ├── usePerformance.js
│   │   ├── usePieceImages.js
│   │   ├── useScrollLock.js
│   │   ├── useTheme.js
│   │   └── index.js
│   │
│   ├── utils/                 # Utility functions, canvas pipeline, validation
│   │   ├── advancedExport.js
│   │   ├── archiveManager.js
│   │   ├── boardUtils.js
│   │   ├── canvasExporter.js
│   │   ├── canvasRenderer.js
│   │   ├── classNames.js
│   │   ├── colorConversions.js       # HEX/RGB/HSL utilities
│   │   ├── colorOperations.js        # Color manipulation
│   │   ├── coordinateCalculations.js
│   │   ├── errorHandler.js
│   │   ├── eventUtils.js
│   │   ├── fenParser.ts              # FEN parsing (typed)
│   │   ├── fenParser.test.js         # node --test unit tests
│   │   ├── fenValidationDetailed.ts  # Granular FEN diagnostics
│   │   ├── historyUtils.js
│   │   ├── imageOptimizer.js
│   │   ├── logger.js                 # Centralized logger (dev-only output)
│   │   ├── performance.js
│   │   ├── pieceImageCache.js
│   │   ├── svgExporter.js            # SVG export path
│   │   ├── themeCustomization.js
│   │   ├── validation.js             # safeJSONParse, sanitizeFileName, MAX_FEN_LENGTH
│   │   └── index.js
│   │
│   └── constants/
│       ├── chessConstants.js  # Piece sets, FEN defaults, board constants
│       ├── dragDropConstants.js # DnD item types
│       └── index.js
│
├── docs/                      # Extended documentation
├── dist/                      # Vite build output (gitignored)
├── index.html                 # HTML entry point
├── package.json
├── vite.config.js
├── tailwind.config.js
├── jsconfig.json              # JS path-alias config (@/ → src/)
├── tsconfig.json              # TypeScript config for the typed files
├── tsconfig.node.json         # TypeScript config for Node-side tooling
└── eslint.config.js
```

---

## Architecture Principles

### 1. Feature-Based Component Organisation

Components are grouped by feature domain inside `src/components/features/`:

| Group              | Contents                                                    |
| ------------------ | ----------------------------------------------------------- |
| `ActionButtons`    | Primary export/copy action buttons                          |
| `ClipboardHistory` | Clipboard copy history panel                                |
| `ColorPicker`      | Board color picker with views and parts                     |
| `ControlPanel`     | Board flip, reset, and control buttons                      |
| `DisplayOptions`   | Coordinates, labels display toggles                         |
| `Export`           | Export settings, dialog, progress, size control             |
| `Fen`              | FEN input field, input list, board preview, piece selector  |
| `HelpCenter`       | In-app help content                                         |
| `History`          | FEN history list, filters, status badge, confirmation modal |
| `Theme`            | Board theme preset selector                                 |
| `UserGuide`        | First-time user onboarding guide                            |

### 2. Separation of Concerns

- **`ui/`** — Pure UI primitives (Button, Modal, Input, etc.) with no business logic
- **`board/`** — Chess board rendering components
- **`interactions/`** — Drag-and-drop board editing layer
- **`features/`** — Domain-specific feature panels
- **`layout/`** — App shell components (Navbar)
- **`hooks/`** — Stateful logic extracted into reusable hooks
- **`utils/`** — Pure, side-effect-free functions
- **`contexts/`** — React contexts for cross-tree state sharing

### 3. Barrel Exports

Every directory has an `index.js` for clean, stable imports:

```javascript
// Example
import { Button, Modal } from '@/components/ui';
import { FENInputField } from '@/components/features/Fen';
import { useChessBoard, useFENHistory } from '@/hooks';
```

### 4. Path Aliases

`jsconfig.json` defines `@/` as an alias for `src/`, used consistently throughout:

```javascript
import { parseFEN } from '@/utils';
import { ChessBoard } from '@/components/board';
```

---

## Core Components

### App.tsx

Root application component. Responsibilities:

- Manages light/dark color-scheme state (`theme`: `'light' | 'dark'`)
- Reads initial theme from `window.__INITIAL_THEME__` → localStorage → `prefers-color-scheme`
- Applies `data-theme` attribute to `<html>` via `useLayoutEffect`
- Wraps the app in `<FENBatchProvider>`, `<LayoutProvider>`, and `<ThemeSettingsProvider>`
- Renders `<Navbar>` conditionally (hidden on tool pages: `/settings`, `/fen-history`, `/advanced-fen`)
- Contains skip-to-main-content link for keyboard accessibility

```javascript
const TOOL_PAGES = ['/settings', '/fen-history', '/advanced-fen'];
```

### Router.jsx

All pages are lazy-loaded with `React.lazy` and wrapped in a single `<Suspense>` boundary with a chess-themed loading spinner. Routes:

| Path            | Component              |
| --------------- | ---------------------- |
| `/`             | `HomePage`             |
| `/about`        | `AboutPage`            |
| `/download`     | `DownloadPage`         |
| `/support`      | `SupportPage`          |
| `/settings`     | `SettingsPage`         |
| `/fen-history`  | `FENHistoryPage`       |
| `/advanced-fen` | `AdvancedFENInputPage` |
| `*`             | `NotFoundPage`         |

### ChessBoard.jsx

Renders the chess board using HTML5 Canvas.

**Responsibilities:**

- Accepts a FEN string, parses it via `useChessBoard`, and draws pieces on canvas
- Draws board squares with configurable light/dark colors
- Draws piece images loaded via `usePieceImages`
- Optionally draws rank/file coordinate labels
- Handles board flipping (renders from Black's perspective)

### ChessEditor (interactions/)

Full interactive board editor combining `InteractiveBoard`, `PiecePalette`, and `TrashZone`. Uses React DnD for drag-and-drop piece movement. Driven by `useInteractiveBoard` hook which maintains an 8×8 board array and converts it to/from FEN via `boardUtils.boardToFEN`.

---

## Data Flow

```
User Input (FEN text / drag-drop)
        │
        ▼
   Validation (utils/validation.js)
        │
        ▼
   State Update (hook setState / context dispatch)
        │
        ├─────────────────────────┐
        ▼                         ▼
  Component re-render       localStorage persist
        │                         (debounced 300ms)
        ▼
  Canvas re-draw
  (ChessBoard / canvasExporter)
```

---

## State Management

| Layer            | Tool         | Examples                                                       |
| ---------------- | ------------ | -------------------------------------------------------------- |
| Component state  | `useState`   | Modal open/close, form values                                  |
| Derived state    | `useMemo`    | Parsed FEN → board array                                       |
| Cross-tree state | Context API  | `FENBatchContext`, `LayoutContext`, `ThemeSettingsContext`     |
| Persistence      | localStorage | FEN history (300 ms debounced), batch list, theme, settings    |
| Drag state       | React DnD    | Piece being dragged (no React-state mirror; `useDragLayer`)    |

Persistence is local-only on the v5.x line. Every `localStorage` read is routed through `safeJSONParse` in `src/utils/validation.js`; direct `JSON.parse` on untrusted strings is forbidden.

---

## Canvas Rendering

### Display Rendering (ChessBoard)

- Canvas size determined by the `size` prop (pixels)
- Board drawn with `fillRect` per square
- Pieces drawn with `drawImage` from cached HTMLImageElements
- Coordinate labels drawn with `fillText`

### Export Rendering (canvasExporter)

- A separate off-screen canvas is created at export dimensions
- Export dimensions calculated via `calculateExportSize` from `coordinateCalculations.js`
- Supports pause/resume/cancel via module-level `exportState` object
- Progress reported via `onProgress(0–100)` callback

**Quality levels and maximum resolutions** (full table in `README.md`):

| Mode   | Quality | Board size range | Pixel-dimension range                       | DPI   |
| ------ | ------- | ---------------- | ------------------------------------------- | ----- |
| Print  | 8×      | 4 cm – 8 cm      | 3,776 × 3,776 px – 7,552 × 7,552 px         | 2,400 |
| Print  | 16×     | 4 cm – 8 cm      | 7,552 × 7,552 px – 15,104 × 15,104 px       | 4,800 |
| Social | 24×     | 4 cm – 8 cm      | 11,328 × 11,328 px – 22,656 × 22,656 px     | 7,200 |
| Social | 32×     | 4 cm – 8 cm      | 15,104 × 15,104 px – 30,208 × 30,208 px     | 9,600 |

The pixel dimension is computed as `boardSizeCm × qualityMultiplier × 118.11`. The maximum supported output is 30,208 × 30,208 px at 9,600 DPI. Safari and iOS WebKit can OOM at the largest sizes despite the explicit `canvas.width = 0` disposal after every blob generation; the v5.x pipeline mitigates this but does not eliminate it.

---

## Export System

See [EXPORT_PIPELINE.md](EXPORT_PIPELINE.md) for the full technical reference.

**Flow:**

1. User configures quality, format (PNG / JPEG / SVG), and board size in `ExportSettings`.
2. `ActionButtons` triggers `exportBoardAsImage` from `canvasExporter.js`, or `svgExporter.js` for the SVG path.
3. `ExportProgress` displays real-time progress through the `onProgress(0–100)` callback.
4. The shared pause / resume / cancel state machine in `canvasExporter.js` and `advancedExport.js` is checked at every chunk boundary.
5. On completion, the image is downloaded via `<a download>` or copied to clipboard via the Clipboard API.
6. For batch export, `advancedExport.js` iterates the FEN list from `FENBatchContext` and `archiveManager.js` bundles the result into a ZIP.

**Safari canvas-disposal invariant.** After every blob generation, the producing `HTMLCanvasElement` must be reset by `canvas.width = 0`. This releases GPU memory that Safari does not garbage-collect on reference drop. The invariant is non-negotiable; any contribution that bypasses it will be rejected.

---

## Out of Scope (v5.x)

The following are not implemented on the v5.x line and are deliberately excluded from this architecture document. They may appear in a future major release; when they do, this document will be updated.

- Authentication, multi-factor authentication, or any user-account surface.
- Cloud synchronization, end-to-end encryption, or remote storage.
- Web Worker / `OffscreenCanvas` rasterization path.
- DPI-metadata encoder for PNG chunks beyond what the export pipeline already supplies.
- DOM-accessible alternative to the canvas board for screen readers.
- Move animation, game playback, PGN replay, or chess-engine analysis.
- Internationalization or multi-language support.
- Native mobile applications.
- Multiplayer or real-time collaboration.

The authoritative statement of known limitations is maintained in [ROADMAP.md](../ROADMAP.md) on `master`.

---

**Last Updated:** 2026-05-23  
**Version:** 5.5.3
