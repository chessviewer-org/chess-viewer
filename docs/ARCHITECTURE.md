# Architecture

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Path Aliases](#path-aliases)
- [Routing](#routing)
- [State Management](#state-management)
- [Canvas Rendering](#canvas-rendering)
- [Export System](#export-system)
- [Authentication and Cloud Sync](#authentication-and-cloud-sync)

---

## Overview

ChessVision is a React single-page application. It parses FEN notation, renders chess positions on an HTML5 Canvas, and exports high-resolution raster or vector images. Optional user authentication enables end-to-end encrypted cloud sync via Supabase.

**Core principles:**

- Feature-based component grouping under `src/components/features/`
- Functional components and React hooks only
- Canvas-based board rendering and image export
- All local state persisted to localStorage; cloud sync is opt-in
- All pages lazy-loaded with code splitting
- TypeScript 6 strict mode throughout

---

## Technology Stack

| Category        | Library / Tool   | Version |
| --------------- | ---------------- | ------- |
| UI framework    | React            | 19.x    |
| Language        | TypeScript       | 6.x     |
| Build tool      | Vite             | 8.x     |
| Styling         | Tailwind CSS     | 4.x     |
| Routing         | React Router DOM | 7.x     |
| Drag and drop   | React DnD        | 16.x    |
| Animations      | Framer Motion    | 12.x    |
| Virtual lists   | react-window     | 2.x     |
| Icons           | Lucide React     | latest  |
| Backend / Auth  | Supabase         | 2.x     |
| Package manager | pnpm             | 10.x    |

---

## Project Structure

```
src/
├── App.tsx                        # Root component — theme state, context providers
├── index.tsx                      # Application entry point
├── index.css                      # Global styles, Tailwind CSS variables
│
├── shared/
│   ├── types/                     # Canonical TS models — import via @app-types
│   │   ├── chess.ts
│   │   ├── history.ts
│   │   └── index.ts
│   ├── constants/                 # Static data
│   │   ├── chessConstants.ts      # Piece sets, FEN defaults, board constants
│   │   ├── themeCustomization.ts  # Default theme presets
│   │   └── dragDropConstants.ts   # DnD item type strings
│   ├── hooks/                     # Cross-page reusable hooks
│   │   ├── useChessBoard.ts       # FEN → 8×8 board array (memoized)
│   │   ├── useDebouncedFENValidation.ts
│   │   ├── useFENHistory.ts
│   │   ├── useInteractiveBoard.ts # DnD board state + FEN generation
│   │   ├── useLocalStorage.ts
│   │   ├── useNotifications.ts
│   │   ├── usePieceImages.ts      # Piece SVG → HTMLImageElement loading
│   │   ├── useTheme.ts
│   │   └── useThemePresets.ts
│   ├── utils/                     # Pure utilities — the export pipeline lives here
│   │   ├── fenParser.ts           # FEN validation + 8×8 BoardMatrix. MAX_FEN_LENGTH=93
│   │   ├── fenParser.test.ts      # node:test unit tests
│   │   ├── canvasRenderer.ts      # createUltraQualityCanvas() — off-screen draw
│   │   ├── canvasExporter.ts      # Async export lifecycle orchestrator
│   │   ├── exportState.ts         # Cancel/pause/resume state machine
│   │   ├── imageOptimizer.ts      # getMaxCanvasSize() — Safari 16384px cap
│   │   ├── workerRasterExport.ts  # Delegates SVG→raster to Web Worker
│   │   ├── svgExporter.ts         # generateBoardSVG() — vector export path
│   │   ├── dpiEncoder.ts          # changeDPI() — injects DPI into PNG/JPEG
│   │   ├── archiveManager.ts      # ZIP batch compilation
│   │   ├── boardUtils.ts          # boardToFEN(), helper functions
│   │   ├── colorConversions.ts    # HEX↔RGB↔HSL
│   │   ├── coordinateCalculations.ts
│   │   ├── crypto.ts              # encrypt()/decrypt() for E2EE cloud sync
│   │   ├── historyUtils.ts        # FEN history filter/sort
│   │   ├── logger.ts              # Structured logger (logger.warn/error/info)
│   │   ├── pieceImageCache.ts     # Piece SVG → HTMLImageElement cache (keyed by URL)
│   │   ├── themeCustomization.ts  # Theme preset helpers
│   │   ├── validation.ts          # safeJSONParse, sanitize*, MAX_FEN_LENGTH
│   │   └── index.ts               # Barrel re-exports
│   ├── ui/                        # Reusable UI primitives
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── Input/
│   │   ├── Checkbox/
│   │   ├── CustomSelect/
│   │   ├── DatePicker/
│   │   ├── SearchableSelect/
│   │   ├── NotificationContainer/
│   │   └── ErrorBoundary/
│   └── workers/
│       └── svgRasterWorker.ts     # Web Worker: SVG → PNG/JPEG via OffscreenCanvas
│
├── components/
│   ├── board/
│   │   ├── BoardGrid/             # 8×8 grid layout
│   │   ├── BoardSquare/           # Single square (memo'd — renders ×64)
│   │   ├── ChessBoard/            # Canvas-based board with coordinates
│   │   └── MiniPreview/           # Thumbnail board for history cards
│   ├── features/
│   │   ├── ActionButtons/         # Export/Clear/Flip action bar
│   │   ├── ClipboardHistory/
│   │   ├── ColorPicker/           # HSL/HEX picker with views/ and parts/
│   │   ├── ControlPanel/          # FEN input + board settings
│   │   ├── DisplayOptions/        # Coordinate visibility, flip, thin frame
│   │   ├── Export/                # ExportOptionsDialog, ExportProgress, BoardSizeControl
│   │   ├── Fen/                   # FENInputField, PieceSelector
│   │   ├── HelpCenter/
│   │   └── History/               # HistoryFilters, StatusBadge, ConfirmationModal
│   ├── interactions/
│   │   ├── ChessEditor/           # Master editor wrapper
│   │   ├── CustomDragLayer/       # Custom drag preview (no CSS)
│   │   ├── DndProvider/           # react-dnd HTML5 + Touch backend switch
│   │   ├── DraggablePiece/        # Draggable piece (memo'd)
│   │   ├── DroppableSquare/       # Drop target per square (memo'd)
│   │   ├── InteractiveBoard/      # Composes all DnD children
│   │   ├── PiecePalette/          # Off-board piece picker
│   │   └── TrashZone/             # Drop-to-delete zone
│   └── layout/
│       └── Navbar/
│
├── contexts/
│   ├── FENBatchContext.tsx        # FEN batch list (add/remove/clear, localStorage)
│   ├── FENBatchStore.ts           # Context object + type declaration
│   ├── useFENBatch.ts
│   ├── ModalContext.tsx
│   ├── ThemeSettingsContext.tsx   # Theme preferences + recentColors + playSound()
│   └── index.ts
│
├── features/
│   └── auth/
│       ├── components/            # AuthModal, SignIn, SignUp, MfaVerification,
│       │                          #   SecurityLockModal, TwoFactorSetup
│       ├── hooks/
│       │   ├── useAuth.tsx        # Session state, signIn/signUp/signOut
│       │   ├── useSecurityCheck.ts # Fail-closed 90-day re-verification gate
│       │   └── useSupabaseSync.ts # Bidirectional cloud sync orchestrator
│       ├── services/
│       │   ├── supabaseClient.ts  # Singleton Supabase client
│       │   ├── syncStorage.ts     # KV interface + E2EE encrypt/decrypt
│       │   └── dataMigration.ts   # localStorage → Supabase migration on first login
│       └── types/index.ts
│
├── pages/
│   ├── HomePage/                  # Primary board playground
│   ├── AdvancedFENInputPage/      # Batch FEN studio
│   ├── FENHistoryPage/            # FEN history browser
│   ├── settings/
│   │   ├── ThemeCustomization/    # Preset cards, color picker panel, board preview
│   │   ├── ExportCustomization.tsx
│   │   └── DataManagement.tsx
│   ├── AboutPage.tsx
│   ├── DownloadPage.tsx
│   ├── SupportPage.tsx
│   ├── SettingsPage.tsx
│   └── NotFoundPage.tsx
│
└── routes/
    └── Router.tsx                 # All pages lazy() + Suspense; AnimatePresence transitions
```

---

## Path Aliases

Defined in `tsconfig.json` and `vite.config.js`:

```
@/*           → src/*
@shared/*     → src/shared/*
@components/* → src/components/*
@pages/*      → src/pages/*
@hooks        → src/shared/hooks (barrel)
@hooks/*      → src/shared/hooks/*
@utils        → src/shared/utils (barrel)
@utils/*      → src/shared/utils/*
@contexts/*   → src/contexts/*
@constants    → src/shared/constants (barrel)
@constants/*  → src/shared/constants/*
@app-types    → src/shared/types (barrel)
@app-types/*  → src/shared/types/*
```

---

## Routing

All routes are in `src/routes/Router.tsx`. Every page component is `lazy()`-loaded and wrapped in a `<Suspense>` boundary. Page transitions use `AnimatePresence` from Framer Motion.

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

The Navbar is hidden on tool pages (`/settings`, `/fen-history`, `/advanced-fen`) for a distraction-free experience.

---

## State Management

| Layer            | Tool         | Examples                          |
| ---------------- | ------------ | --------------------------------- |
| Component state  | `useState`   | Modal open/close, form values     |
| Derived state    | `useMemo`    | Parsed FEN → board array          |
| Cross-tree state | Context API  | Theme settings, FEN batch list    |
| Persistence      | localStorage | FEN history, theme, settings      |
| Drag state       | React DnD    | Piece being dragged               |
| Cloud sync       | Supabase     | Encrypted KV via `syncStorage.ts` |

Context providers persist to localStorage via `useEffect`. All hydration uses `safeJSONParse`.

DnD state lives exclusively in `useInteractiveBoard.ts` and `react-dnd` monitors. It must not be mirrored into React state — doing so causes 64-square cascade re-renders.

---

## Canvas Rendering

### Display Rendering (`ChessBoard`)

- Canvas size determined by the `size` prop (pixels)
- Squares drawn with `ctx.fillRect` per square (64 total)
- Piece images drawn with `ctx.drawImage` from cached `HTMLImageElement` instances
- Coordinate labels drawn with `ctx.fillText`
- Coordinate border sizing: `borderSize = clamp(boardPixels × 0.05, 18px, 800px)`

### Export Rendering

For export dimensions, see [EXPORT_PIPELINE.md](EXPORT_PIPELINE.md).

Key rules:

- Safari caps canvas at 16,384 px per dimension — `getMaxCanvasSize()` enforces this
- After every `canvas.toBlob()` call: `canvas.width = 0; canvas.height = 0` (Safari GPU memory release)
- Exports above 4,000 px on any axis must route through `svgRasterWorker.ts` (OffscreenCanvas in Web Worker)

---

## Export System

See [EXPORT_PIPELINE.md](EXPORT_PIPELINE.md) for the full technical reference.

**Flow:**

1. User configures quality, format, and board size in `ExportSettings`
2. `ActionButtons` triggers `canvasExporter.ts`
3. `ExportProgress` displays real-time progress via `onProgress(0–100)` callback
4. On completion, image downloads via `<a download>` or copies to clipboard
5. Batch export (`AdvancedFENInputPage`) iterates the FEN list from `FENBatchContext`, calls the single-export pipeline per item, and packages outputs via `archiveManager.ts`

---

## Authentication and Cloud Sync

Authentication is optional. The app is fully functional without an account.

**Services:** All Supabase access goes through the singleton at `src/features/auth/services/supabaseClient.ts`. Never instantiate a second client.

**Security gate:** `useSecurityCheck` is fail-closed — `isLocked` defaults to `true` and only unlocks on positive server confirmation via the `refresh_security_session` RPC. Do not bypass.

**Cloud sync:** `syncStorage.ts` is the only approved interface for user KV data. It encrypts values with the user key (`cv_privacy_key` from localStorage) before every Supabase upsert. Stored as `enc:<ciphertext>`. Direct `supabase.from('user_data')` calls outside `syncStorage.ts` are forbidden.

**Row-Level Security:** RLS is active on all tables (`user_data`, `user_security`). Default-deny: no policy = no access.

---

_Last updated: May 2026 — v6.0.0_
