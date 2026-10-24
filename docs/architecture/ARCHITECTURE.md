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

ChessViewer is a Preact SPA with build-time prerendering for public routes. Interactive editing runs in the browser. wouter handles client navigation; hosting serves prerendered HTML when available and falls back to `index.html` for other paths. There is no active service worker: `public/sw.js` retires legacy workers and the inline boot script `src/boot/retire-service-worker.js` removes old registrations without reloading open editors.

It parses FEN notation, renders chess positions on an HTML5 Canvas, and exports high-resolution raster or vector images. Optional user authentication enables cloud sync via a custom Supabase client with row-level security.

**Core principles:**

- Feature-based component grouping under `src/components/features/`
- Functional components and React hooks only — no class components
- Canvas-based board rendering and image export
- All local state persisted to localStorage; cloud sync is opt-in
- All pages lazy-loaded with code splitting
- TypeScript 7 strict mode throughout (the TypeScript 6 API is retained only for ESLint)

---

## Technology Stack

| Category        | Library / Tool                                               | Version |
| --------------- | ------------------------------------------------------------ | ------- |
| UI framework    | Preact (via `@preact/preset-vite`)                           | 11.x    |
| Language        | TypeScript                                                   | 7.x     |
| Build tool      | Vite                                                         | 8.x     |
| Styling         | Tailwind CSS                                                 | 4.x     |
| Routing         | wouter                                                       | 3.x     |
| Drag and drop   | Custom hooks (`useDragDrop`) — no library                    | —       |
| Page animations | View Transitions API (`navigateWithTransition`)              | —       |
| Icons           | Embedded Lucide SVG paths (`src/assets/icons/`) — no package | —       |
| ZIP export      | fflate                                                       | 0.8.x   |
| QR codes        | uqr                                                          | 0.1.x   |
| Fonts           | @fontsource-variable/inter                                   | 5.x     |
| Backend / Auth  | Custom Supabase client (`src/auth/Supabase.ts`)              | —       |
| Package manager | pnpm                                                         | 12.x    |

> **Preact instead of React** — `@preact/preset-vite` aliases `react` and `react-dom` to Preact at build time. All source code uses the React API; Preact provides it with a smaller runtime. `preact` and `@types/react` coexist in `package.json` for this reason.

> **Icon system — embedded SVG paths, not a package** — `lucide-react` is not installed. Instead, the SVG path data for only the icons we actually use is copied into `src/assets/icons/index.tsx`. The `createLucideIcon` helper in `src/assets/icons/createIcon.tsx` turns each path list into a React component with the same API as the original Lucide package. Attribution: icon paths originate from the [Lucide](https://lucide.dev) project (ISC License).

> **Supabase client — custom implementation, not `@supabase/supabase-js`** — `src/auth/Supabase.ts` contains a hand-written HTTP client (~940 lines) that covers only the Supabase APIs we use: Auth (sign-in/sign-up/MFA/session management), PostgREST queries, and RPC calls. This avoids the full SDK bundle weight. The `supabase` singleton exported from that file is the only approved entry point for all Supabase access.

> **Page animations — View Transitions API, not Framer Motion** — `framer-motion` is not installed. `src/routes/navigation.ts` passes `navigateWithTransition` to wouter's `<Router aroundNav>`: a navigation that changes the path runs inside `document.startViewTransition`, scrolls the window to the top and cross-fades the old and new page for 180 ms (`::view-transition-old/new(root)` in `theme.css`). It falls back to an instant navigation when the browser lacks the API or the user prefers reduced motion (`canAnimateViewTransition`). The theme toggle reuses the same API with its own circular reveal, scoped by `html[data-theme-transition]`.

Route commits reset scroll before rendering the destination, in the same synchronous
update. Only opacity changes during route transitions; the navbar snapshot never
animates its position or dimensions. The app shell and navbar use viewport width
so scrollbar appearance cannot shift navigation or page gutters sideways.

Navbar menu state belongs to Navbar, not AppShell or the page providers. Shared
notification and editor callbacks retain their identity between unrelated updates.
Piece loading publishes the completed image map rather than rendering once per
image for an unused progress value; cache lookup runs once per style/mode change.

> **Chess domain logic — private package** — `@chessviewer-org/chess-viewer` provides `ChessBoard`, `PieceSymbol`, `validateFEN`, `parseFEN`, `boardToFEN`, and related types. It is published on npm and developed in [chess-viewer-utils](https://github.com/chessviewer-org/chess-viewer-utils); it also generates the SVG diagrams and all LaTeX markup.

---

## Project Structure

```
src/
├── App.tsx                        # Root component — theme bootstrap, context providers
├── index.tsx                      # Application entry point
├── index.css                      # Global styles (imports from src/styles/)
│
├── auth/                          # Authentication — self-contained module
│   ├── AuthContext.tsx            # Session state, AuthProvider, useAuth()
│   ├── SecurityLock.tsx           # Fail-closed 90-day re-verification gate UI
│   ├── TwoFactor.tsx              # Two-factor setup/management UI
│   ├── TwoFactorSteps.tsx         # Step-by-step 2FA flow components
│   ├── Supabase.ts                # Singleton Supabase client + type exports
│   ├── syncStorage.ts             # KV interface to user_data (RLS owner-scoped)
│   ├── dataMigration.ts           # localStorage → Supabase migration on first login
│   ├── membership.ts              # Supporter tier logic + getMembershipTier()
│   ├── profile.ts                 # profileService (get/updateDisplayName/setSupporter)
│   ├── securityEvents.ts          # securityEventsService.recent()
│   └── index.ts                   # Barrel re-exports
│
├── shared/
│   ├── types/
│   │   └── index.ts               # ChessBoard, isChessBoard, AdvancedFenConfig — import via @app-types
│   ├── constants/
│   │   ├── chessConstants.ts      # PIECE_SETS, BOARD_THEMES, QUALITY_PRESETS
│   │   ├── dragDropConstants.ts   # ChessDragData, PALETTE_PIECES, getPieceImageKey
│   │   ├── syncConstants.ts       # Storage key constants
│   │   └── seoConstants.ts        # getRouteSeo, structured data schemas
│   ├── hooks/                     # Cross-page reusable hooks
│   │   ├── useA11y.ts             # CVD, contrast, reduced-motion — deferred cloud hydration
│   │   ├── useChessBoard.ts       # FEN → 8×8 board array (memoized)
│   │   ├── useDatabaseSearch.ts   # Lichess/ChessDB position lookup
│   │   ├── useDOM.ts              # Small DOM utilities (useOutsideClick, useFocusTrap…)
│   │   ├── useDragDrop.ts         # Custom drag-and-drop (no @dnd-kit)
│   │   ├── useFENHistory.ts       # History CRUD + localStorage persistence
│   │   ├── useFenValidation.ts    # Debounced FEN validation
│   │   ├── useHomeExport.ts       # Export orchestration for HomePage
│   │   ├── useInteractiveBoard.ts # Board state + undo/redo + FEN generation
│   │   ├── useKeyboard.ts         # useEscapeKey, useEditorKeyboard, useListboxKeyboard
│   │   ├── useLocalStorage.ts     # Debounced localStorage read/write
│   │   ├── useNotifications.ts    # Toast notification system
│   │   ├── usePagination.ts       # Generic pagination logic
│   │   ├── usePiece.ts            # Piece-related helpers
│   │   ├── usePieceImages.ts      # Piece SVG → HTMLImageElement loading
│   │   ├── useSearchParams.ts     # URL search param read/write
│   │   ├── useTheme.ts            # Board colour theme (light/dark squares + presets)
│   │   └── index.ts               # Barrel re-exports (@hooks alias)
│   ├── utils/
│   │   ├── a11yUtils.ts           # applyColorVision, applyContrast, applyReducedMotion
│   │   ├── archiveManager.ts      # ZIP batch compilation (fflate)
│   │   ├── canvasExporter.ts      # downloadPNG/JPEG, copyToClipboard — export orchestrator
│   │   ├── canvasRenderer.ts      # createUltraQualityCanvas() — off-screen draw
│   │   ├── coordinateCalculations.ts # Square bounds, coordinate label drawing
│   │   ├── databaseSearch.ts      # Database search API calls
│   │   ├── exportRaster.ts        # createRasterBlob() — main-thread canvas rasterisation
│   │   ├── exportState.ts         # Cancel/pause/resume state machine
│   │   ├── historyUtils.ts        # FEN history filter/sort utilities
│   │   ├── imageOptimizer.ts      # calculateRenderSurfaceSize, getMaxCanvasSize (Safari cap)
│   │   ├── logger.ts              # Structured logger (logger.warn/error/info)
│   │   ├── latexHandoff.ts        # sessionStorage hand-off of positions to LaTeX Studio
│   │   ├── pageScroll.ts          # isTextEntryTarget — keyboard shortcut guard
│   │   ├── pieceUtils.ts          # Piece image helpers
│   │   ├── saveBlob.ts            # File download via <a download>
│   │   ├── svgExporter.ts         # generateBoardSVG(), downloadSVG()
│   │   ├── viewTransition.ts      # canAnimateViewTransition() — API + reduced-motion check
│   │   ├── syncHydration.ts       # hydrateFromSync() — deferred cloud→localStorage hydration
│   │   ├── themeMode.ts           # readThemeModePreference, applyThemeMode
│   │   └── index.ts               # Barrel re-exports (@utils alias)
│   ├── ui/                        # Reusable UI primitives
│   │   ├── Checkbox.tsx
│   │   ├── CustomSelect.tsx       # Accessible listbox with keyboard navigation
│   │   ├── DatePicker.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── Logo.tsx
│   │   ├── MembershipIdentity/    # Supporter badge components
│   │   ├── Modal/                 # Modal + ModalShell
│   │   ├── NotificationContainer.tsx
│   │   ├── Pagination/
│   │   ├── Seo.tsx
│   │   ├── Switch.tsx
│   │   └── index.ts
│   └── contexts/
│       ├── FENBatchContext.tsx    # FEN batch list (add/remove/clear, localStorage)
│       ├── ModalContext.tsx       # Global alert/confirm modal
│       └── index.ts
│
├── components/
│   ├── board/
│   │   └── MiniPreview.tsx        # Thumbnail board for history cards
│   ├── features/
│   │   ├── BoardStylePanel.tsx    # Board style controls wrapper
│   │   ├── ColorPicker/           # HSV/HEX picker
│   │   ├── ExportProgress.tsx     # Export progress overlay
│   │   ├── Fen/                   # FENInputField with validation feedback
│   │   └── History/               # HistoryFilters, StatusBadge, ConfirmationModal
│   ├── interactions/
│   │   ├── Editor/                # Master editor — ChessEditor, CommandBar, DatabaseSearch, ShareDialog
│   │   ├── DraggablePiece.tsx     # Draggable piece wrapper (memo'd)
│   │   ├── DroppableSquare.tsx    # Drop target per square (memo'd)
│   │   ├── DragProvider.tsx       # Drag context wrapper
│   │   ├── InteractiveBoard/      # 8×8 grid of DroppableSquares
│   │   ├── PiecePalette/          # Off-board piece picker
│   │   └── TrashZone.tsx          # Drop-to-delete zone
│   └── layout/
│       └── Navbar/                # App shell nav (section drawer, responsive account dropdown)
│
├── pages/
│   ├── HomePage/                  # Primary board workspace
│   ├── ExportPage/                # Full-screen export studio (board style + settings)
│   ├── AdvancedFENInputPage/      # Batch FEN studio — up to 10 positions
│   ├── LatexPage/                 # LaTeX Studio — up to 100 positions → skak / chessboard / diagram
│   ├── FENHistoryPage/            # FEN history browser with filters
│   ├── SettingsPage/              # Settings tabs (appearance, board, account, security)
│   ├── AboutPage/                 # About sections (FAQ, Privacy, Contribute, Donate)
│   ├── AuthPage/                  # Sign in, sign up, forgot password, MFA pages
│   └── NotFoundPage.tsx
│
├── routes/
│   ├── Router.tsx                 # wouter <Switch> with every route
│   ├── pages.ts                   # Page component exports
│   └── navigation.ts              # navigateWithTransition — View Transitions + scroll-to-top
│
└── styles/
    ├── animations.css             # @keyframes definitions + .animate-* utility classes
    ├── base.css                   # HTML/body/element resets (@layer base)
    ├── components.css             # Shared layout classes (page-container, main-content-offset)
    ├── theme.css                  # @theme variables, CSS custom properties, color tokens
    ├── utilities.css              # Scrollbar, marching-ants, safe-area, print styles
    ├── _variables.scss            # SCSS breakpoint + spacing variables
    └── _mixins.scss               # SCSS mixins (viewport-up/down, touch, hover-capable…)
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
@contexts     → src/shared/contexts
@contexts/*   → src/shared/contexts/*
@constants    → src/shared/constants
@constants/*  → src/shared/constants/*
@app-types    → src/shared/types
@app-types/*  → src/shared/types/*
```

Convention: use `@/x` for app-structure paths (`@/components`, `@/auth`). Use bare form `@x` for shared-layer barrels (`@utils`, `@hooks`, `@constants`, `@app-types`).

---

## Routing

Routing is handled by **wouter** (not React Router). All routes are in `src/routes/Router.tsx`; `src/routes/pages.ts` resolves each page through one cached dynamic import. The current page loads before hydration; navigation loads destination JS/CSS before starting its transition. Unvisited browser-history destinations use Suspense, and failed imports reach the existing error boundary. Internal imports point to leaf modules so shared barrels do not pull unrelated features into the shell.

Page changes run through `navigateWithTransition` (see Page animations above). The document itself scrolls: `#main-content` is a flex column without its own overflow, so pages size themselves with `flex-1`, sticky elements are positioned against the viewport, and the browser handles Arrow, Page Up/Down, Home, End and Space scrolling natively.

| Path                    | Component              |
| ----------------------- | ---------------------- |
| `/`                     | `HomePage`             |
| `/export`               | `ExportPage`           |
| `/about`                | `AboutPage`            |
| `/settings`             | `SettingsPage`         |
| `/fen-history`          | `FENHistoryPage`       |
| `/advanced-fen`         | `AdvancedFENInputPage` |
| `/latex`                | `LatexPage`            |
| `/auth/sign-in`         | `SignInPage`           |
| `/auth/sign-up`         | `SignUpPage`           |
| `/auth/forgot-password` | `ForgotPasswordPage`   |
| `/auth/mfa`             | `MfaChallengePage`     |
| `*`                     | `NotFoundPage`         |

---

## State Management

| Layer            | Tool                   | Examples                                   |
| ---------------- | ---------------------- | ------------------------------------------ |
| Component state  | `useState`             | Modal open/close, form values              |
| Derived state    | `useMemo`              | Parsed FEN → board array                   |
| Cross-tree state | Context API            | FEN batch list, modal state                |
| Persistence      | localStorage           | FEN history, theme preferences, settings   |
| Drag state       | `useDragDrop` (custom) | Active piece, drag origin                  |
| Cloud sync       | Supabase               | KV via `syncStorage.ts` (RLS owner-scoped) |

Context providers persist to localStorage via `useEffect`. All hydration uses `safeJSONParse`.

Drag state lives exclusively in `useInteractiveBoard.ts` and the custom `useDragDrop` hook. It must not be mirrored into React state — doing so causes 64-square cascade re-renders through the memoized `DroppableSquare` grid.

---

## Canvas Rendering

### Display Board

The interactive board is rendered as a grid of `DroppableSquare` components, each containing a `DraggablePiece`. Squares use Tailwind CSS utilities backed by CSS custom properties. Piece images are same-origin SVGs in `/piece/` and `/fairypiece/`. A bounded source-keyed cache shares loaded and in-flight images; the board and exporter use the same `HTMLImageElement`. Catalogue letter SVGs are decoded only when needed by the board or selected palette.

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
5. For SVG: `downloadSVG()` in `svgExporter.ts` embeds piece images as base64 data URLs
6. File downloaded via `<a download>`
7. Batch export iterates the FEN list and packages outputs via `archiveManager.ts` (fflate)

---

## Authentication and Cloud Sync

Authentication is entirely optional. The app is fully functional without an account.

All auth logic is in `src/auth/` — a self-contained module. Nothing outside this folder touches Supabase directly.

**Services:**

- `Supabase.ts` — singleton Supabase client
- `syncStorage.ts` — the only approved KV interface for `user_data` table
- `profile.ts` — display name and supporter tier operations
- `dataMigration.ts` — one-time localStorage → Supabase migration on first login
- `membership.ts` — supporter tier logic (`getMembershipTier`)
- `securityEvents.ts` — recent login event log

**Security gate:** `SecurityLock.tsx` / `useSecurityCheck` is fail-closed — `isLocked` defaults to `true` and only unlocks on positive server confirmation via the `refresh_security_session` RPC.

**Cloud sync:** `syncStorage.set(key, value)` upserts into `user_data`. Each row is owner-scoped by Supabase RLS: `auth.uid() = user_id`. No user can read another user's rows. The local localStorage copy is the source of truth; cloud is best-effort sync on top.

**Accessibility preferences** (`useColorVision`, `useContrast`, `useReducedMotionPreference` — all in `useA11y.ts`) hydrate from cloud on an idle callback after first paint — they do not block initial render.

---

_Last updated: July 2026_
