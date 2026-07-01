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

ChessVision is a React single-page application. It parses FEN notation, renders chess positions on an HTML5 Canvas, and exports high-resolution raster or vector images. Optional user authentication enables cloud sync via Supabase with row-level security.

**Core principles:**

- Feature-based component grouping under `src/components/features/`
- Functional components and React hooks only — no class components
- Canvas-based board rendering and image export
- All local state persisted to localStorage; cloud sync is opt-in
- All pages lazy-loaded with code splitting
- TypeScript 6 strict mode throughout

---

## Technology Stack

| Category        | Library / Tool                | Version |
| --------------- | ----------------------------- | ------- |
| UI framework    | React                         | 19.x    |
| Language        | TypeScript                    | 6.x     |
| Build tool      | Vite                          | 8.x     |
| Styling         | Tailwind CSS                  | 4.x     |
| Routing         | React Router DOM              | 7.x     |
| Drag and drop   | @dnd-kit                      | 6.x     |
| Animations      | Framer Motion                 | 12.x    |
| Virtual lists   | IntersectionObserver (native) | —       |
| Icons           | Lucide React                  | latest  |
| Backend / Auth  | Supabase                      | 2.x     |
| Package manager | pnpm                          | 10.x    |

---

## Project Structure

```
src/
├── App.tsx                        # Root component — theme bootstrap, context providers
├── index.tsx                      # Application entry point, SW registration
├── index.css                      # Global styles, Tailwind CSS variables, focus ring system
│
├── shared/
│   ├── types/                     # Canonical TS models — import via @app-types
│   │   ├── chess.ts               # PieceSymbol, ChessBoard, BoardMatrix
│   │   ├── history.ts             # FENHistoryEntry
│   │   └── index.ts               # QualityPreset, BoardThemes, ValidationResult
│   ├── constants/
│   │   ├── chessConstants.ts      # PIECE_SETS, BOARD_THEMES, QUALITY_PRESETS
│   │   ├── dragDropConstants.ts   # ChessDragData, PALETTE_PIECES, getPieceImageKey
│   │   └── seoConstants.ts        # getRouteSeo, structured data schemas
│   ├── hooks/                     # Cross-page reusable hooks
│   │   ├── useChessBoard.ts       # FEN → 8×8 board array (memoized)
│   │   ├── useDebouncedFENValidation.ts
│   │   ├── useFENHistory.ts       # History CRUD + localStorage persistence
│   │   ├── useInteractiveBoard.ts # DnD board state + undo/redo + FEN generation
│   │   ├── useLocalStorage.ts     # Debounced localStorage read/write
│   │   ├── useNotifications.ts    # Toast notification system
│   │   ├── usePieceImages.ts      # Piece SVG → HTMLImageElement loading
│   │   ├── useTheme.ts            # Active light/dark square colours
│   │   ├── useThemePresets.ts     # Saved theme preset management
│   │   ├── useColorVision.ts      # CVD filter preference (deferred cloud hydration)
│   │   ├── useContrast.ts         # High-contrast preference (deferred cloud hydration)
│   │   └── useReducedMotionPreference.ts
│   ├── utils/
│   │   ├── fenParser.ts           # validateFEN, parseFENToMatrix — MAX_FEN_LENGTH=93
│   │   ├── fenParser.test.ts      # node:test unit tests (co-located)
│   │   ├── canvasRenderer.ts      # createUltraQualityCanvas() — off-screen draw
│   │   ├── canvasExporter.ts      # downloadPNG/JPEG, copyToClipboard — export orchestrator
│   │   ├── exportRaster.ts        # createRasterBlob() — worker-first, canvas fallback
│   │   ├── exportState.ts         # Cancel/pause/resume state machine + validateExportConfig
│   │   ├── imageOptimizer.ts      # calculateRenderSurfaceSize, getMaxCanvasSize (Safari cap)
│   │   ├── workerRasterExport.ts  # startSvgRasterWorkerTask() — queues SVG→raster to Worker
│   │   ├── svgExporter.ts         # generateBoardSVG(), downloadSVG()
│   │   ├── svgPieceLoader.ts      # imageToEmbeddableDataURL() — blob → base64 for SVG embed
│   │   ├── dpiEncoder.ts          # changeDPI() — injects DPI metadata into PNG/JPEG
│   │   ├── archiveManager.ts      # ZIP batch compilation
│   │   ├── boardUtils.ts          # boardToFEN(), coordinate helpers
│   │   ├── colorConversions.ts    # HEX↔RGB↔HSV — single source for all colour math
│   │   ├── coordinateCalculations.ts # Square bounds, coordinate label drawing
│   │   ├── historyUtils.ts        # FEN history filter/sort utilities
│   │   ├── logger.ts              # Structured logger (logger.warn/error/info)
│   │   ├── pieceImageCache.ts     # SVG → 256px HTMLImageElement cache (blob URL, max 36)
│   │   ├── themeCustomization.ts  # Theme preset helpers
│   │   ├── validation.ts          # safeJSONParse, sanitizeInput/HexColor/FileName
│   │   └── index.ts               # Barrel re-exports (@utils alias)
│   ├── ui/                        # Reusable UI primitives
│   │   ├── Checkbox/
│   │   ├── CustomSelect/          # Accessible listbox with keyboard navigation
│   │   ├── DatePicker/
│   │   ├── ErrorBoundary/
│   │   ├── Modal/ ModalShell/
│   │   ├── NotificationContainer/
│   │   ├── Seo/
│   │   └── Switch/
│   └── workers/
│       └── svgRasterWorker.ts     # Web Worker: SVG Blob → PNG/JPEG via OffscreenCanvas
│
├── components/
│   ├── board/
│   │   └── MiniPreview/           # Thumbnail board for history cards
│   ├── features/
│   │   ├── ClipboardHistory/
│   │   ├── ColorPicker/           # HSV/HEX picker — views/ and parts/
│   │   ├── ControlPanel/          # FEN input + board action buttons
│   │   ├── DisplayOptions/        # Coordinate visibility, flip, thin frame toggles
│   │   ├── Export/ExportProgress/ # Export progress overlay
│   │   ├── Fen/FENInputField/     # FEN text input with validation feedback
│   │   └── History/               # HistoryFilters, StatusBadge, ConfirmationModal
│   ├── interactions/
│   │   ├── ChessEditor/           # Master DnD editor — DndContext, sensors, DragOverlay
│   │   │   ├── CommandBar.tsx     # Icon toolbar (undo/redo/flip/copy/share/download)
│   │   │   ├── DatabaseSearchPanel.tsx
│   │   │   └── ShareDialog.tsx
│   │   ├── DraggablePiece/        # Draggable piece wrapper (memo'd)
│   │   ├── DroppableSquare/       # Drop target per square (memo'd, custom comparator)
│   │   ├── InteractiveBoard/      # 8×8 grid of DroppableSquares
│   │   ├── PiecePalette/          # Off-board piece picker
│   │   └── TrashZone/             # Drop-to-delete zone
│   └── layout/
│       └── Navbar/                # App shell nav (desktop dropdown, mobile menu)
│
├── contexts/
│   ├── FENBatchContext.tsx        # FEN batch list (add/remove/clear, localStorage)
│   ├── FENBatchStore.ts
│   ├── useFENBatch.ts
│   ├── ModalContext.tsx           # Global alert/confirm modal
│   ├── ThemeSettingsContext.tsx   # recentColors, playSound()
│   └── index.ts
│
├── features/
│   └── auth/
│       ├── components/            # AuthModal, SignIn, SignUp, MfaVerification,
│       │                          #   SecurityLockModal, TwoFactorSetup
│       ├── hooks/
│       │   ├── useAuth.tsx        # Session state, signIn/signUp/signOut
│       │   ├── useSecurityCheck.ts # Fail-closed 90-day re-verification gate
│       │   ├── useSupabaseSync.ts # Cloud sync orchestrator
│       │   └── ProfileContext.tsx # Display name, supporter tier
│       ├── services/
│       │   ├── supabaseClient.ts  # Singleton Supabase client
│       │   ├── syncStorage.ts     # KV interface to user_data (RLS owner-scoped)
│       │   ├── dataMigration.ts   # localStorage → Supabase migration on first login
│       │   └── membership.ts      # Supporter tier logic
│       └── types/index.ts
│
├── pages/
│   ├── HomePage/                  # Primary board workspace
│   ├── ExportPage/                # Full-screen export studio (board style + settings)
│   ├── AdvancedFENInputPage/      # Batch FEN studio — up to 10 positions
│   ├── FENHistoryPage/            # FEN history browser with filters
│   ├── settings/                  # Settings tabs (appearance, board, account, security)
│   ├── about/                     # About sections (FAQ, Privacy, Contribute, Donate)
│   ├── AboutPage.tsx
│   ├── SettingsPage.tsx
│   └── NotFoundPage.tsx
│
└── routes/
    ├── Router.tsx                 # All pages lazy() + Suspense, AnimatePresence transitions
    ├── lazyPages.ts               # Lazy import factories (reused for hover prefetch)
    └── prefetchRegistry.ts        # Route → import factory map for usePrefetchRoute
```

---

## Path Aliases

Defined in `tsconfig.json` and `vite.config.js`:

```
@/*           → src/*                (app structure — slash form)
@shared/*     → src/shared/*
@components/* → src/components/*
@pages/*      → src/pages/*
@hooks        → src/shared/hooks     (bare barrel form — shared layer)
@hooks/*      → src/shared/hooks/*
@utils        → src/shared/utils
@utils/*      → src/shared/utils/*
@contexts/*   → src/contexts/*
@constants    → src/shared/constants
@constants/*  → src/shared/constants/*
@app-types    → src/shared/types
@app-types/*  → src/shared/types/*
```

Convention: use `@/x` for app-structure paths (`@/components`, `@/features`). Use bare form `@x` for shared-layer barrels (`@utils`, `@hooks`, `@constants`, `@app-types`).

---

## Routing

All routes in `src/routes/Router.tsx`. Every page is `lazy()`-loaded in a `<Suspense>` boundary. Page transitions use `AnimatePresence` from Framer Motion.

| Path            | Component              |
| --------------- | ---------------------- |
| `/`             | `HomePage`             |
| `/export`       | `ExportPage`           |
| `/about`        | `AboutPage`            |
| `/settings`     | `SettingsPage`         |
| `/fen-history`  | `FENHistoryPage`       |
| `/advanced-fen` | `AdvancedFENInputPage` |
| `*`             | `NotFoundPage`         |

`usePrefetchRoute` prefetches a page chunk on link hover/focus, so click-time navigation is instant.

---

## State Management

| Layer            | Tool         | Examples                                    |
| ---------------- | ------------ | ------------------------------------------- |
| Component state  | `useState`   | Modal open/close, form values               |
| Derived state    | `useMemo`    | Parsed FEN → board array                    |
| Cross-tree state | Context API  | Theme settings, FEN batch list, modal state |
| Persistence      | localStorage | FEN history, theme preferences, settings    |
| Drag state       | @dnd-kit     | Active piece, drag origin, drag overlay     |
| Cloud sync       | Supabase     | KV via `syncStorage.ts` (RLS owner-scoped)  |

Context providers persist to localStorage via `useEffect`. All hydration uses `safeJSONParse`.

Drag state lives exclusively in `useInteractiveBoard.ts` and `@dnd-kit` monitors (`useDraggable`, `useDroppable`). It must not be mirrored into React state — doing so causes 64-square cascade re-renders through the memoized `DroppableSquare` grid.

---

## Canvas Rendering

### Display Board

The interactive board is rendered as a `@dnd-kit` grid of `DroppableSquare` components, each containing a `DraggablePiece`. The squares are filled with Tailwind colour utilities backed by CSS custom properties. Piece images are loaded from Lichess CDN, rasterized to 256 px blob URLs by `pieceImageCache.ts`, and passed down as a stable `Record<string, HTMLImageElement>`.

### Export Canvas

For export, `createUltraQualityCanvas()` in `canvasRenderer.ts` renders an off-screen `HTMLCanvasElement`:

- Square sizes computed from physical board size in cm: `pixels = round((cm / 2.54) × 300 × multiplier)`
- `getMaxCanvasSize()` caps at 16,384 px on Safari, 32,767 px on Chrome
- After every `canvas.toBlob()`: `canvas.width = 0; canvas.height = 0` — mandatory for Safari GPU memory release

---

## Export System

See [EXPORT_PIPELINE.md](../reference/EXPORT_PIPELINE.md) for the full technical reference.

**Flow:**

1. User opens ExportPage (full-screen studio) from the CommandBar download button
2. Configures format (PNG/JPEG/SVG), quality preset (1×–4×), board size (4/6/8 cm), and filename
3. `handleBatchExport` in `useHomeExport` triggers `canvasExporter.ts`
4. For PNG/JPEG: `createRasterBlob()` attempts the SVG→Worker path first; falls back to main-thread canvas if pieces are blob URLs
5. For SVG: `downloadSVG()` in `svgExporter.ts` embeds piece images as base64 data URLs via `svgPieceLoader.ts`
6. DPI metadata injected by `dpiEncoder.ts`; file downloaded via `<a download>`
7. Batch export iterates the FEN list and packages outputs via `archiveManager.ts`

---

## Authentication and Cloud Sync

Authentication is entirely optional. The app is fully functional without an account.

**Services:** All Supabase access goes through the singleton at `src/features/auth/services/supabaseClient.ts`. `syncStorage.ts` is the only approved KV interface for `user_data`.

**Security gate:** `useSecurityCheck` is fail-closed — `isLocked` defaults to `true` and only unlocks on positive server confirmation via the `refresh_security_session` RPC.

**Cloud sync:** `syncStorage.set(key, value)` upserts into `user_data`. Each row is owner-scoped by Supabase RLS: `auth.uid() = user_id`. No user can read another user's rows. The local localStorage copy is the source of truth; cloud is best-effort sync on top.

**Accessibility preferences** (`useColorVision`, `useContrast`, `useReducedMotionPreference`) hydrate from cloud on an idle callback after first paint — they do not block initial render.

---

_Last updated: July 2026_
