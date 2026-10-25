# Architecture

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Path Aliases](#path-aliases)
- [Routing](#routing)
- [Build, Prerender and Hosting](#build-prerender-and-hosting)
- [State Management](#state-management)
- [Board Rendering](#board-rendering)
- [Export System](#export-system)
- [Authentication and Cloud Sync](#authentication-and-cloud-sync)

---

## Overview

ChessViewer is a Preact single-page app with build-time prerendering for its public routes. Editing, rendering and export all run in the browser. wouter handles client navigation; the host serves the prerendered HTML for known routes and falls back to `index.html` for everything else.

The app has three workspaces that share one editor:

- **Standard** (`/`) — orthodox FEN editor and diagram generator
- **Fairy chess** (`/fairy-chess`) — neutral and rotated symbols, 163 named Popeye walks, stipulations and conditions
- **LaTeX Studio** (`/latex`) — turns up to 100 positions into `skak`, `chessboard` or `diagram` markup

Optional sign-in syncs history and settings through a hand-written Supabase client protected by row-level security.

**Core principles:**

- Functional components and hooks only — no class components
- The board is a DOM grid; exports are drawn on an off-screen canvas or written as SVG
- Local storage is the source of truth; cloud sync is opt-in and layered on top
- Every page is lazy-loaded through one cached dynamic import
- TypeScript 7 strict mode throughout (the TypeScript 6 API package is used only by ESLint)
- There is no active service worker: `public/sw.js` retires legacy workers and the inline boot script `src/boot/retire-service-worker.js` removes old registrations

---

## Technology Stack

| Category        | Library / Tool                                                  | Version |
| --------------- | --------------------------------------------------------------- | ------- |
| UI framework    | Preact (via `@preact/preset-vite`)                              | 11.x    |
| Language        | TypeScript                                                      | 7.x     |
| Build tool      | Vite (Rolldown bundler, Oxc minifier)                           | 8.x     |
| Styling         | Tailwind CSS + SCSS modules                                     | 4.x     |
| Routing         | wouter                                                          | 3.x     |
| Chess domain    | `@chessviewer-org/chess-viewer`                                 | 1.x     |
| Drag and drop   | Custom hooks (`useDragDrop`, `useDragState`) — no library       | —       |
| Page animations | View Transitions API (`navigateWithTransition`)                 | —       |
| Icons           | Embedded Lucide SVG paths (`src/assets/icons/`) — no package    | —       |
| ZIP export      | fflate                                                          | 0.8.x   |
| QR codes        | uqr                                                             | 0.1.x   |
| Fonts           | Inter variable, self-hosted in `public/fonts/inter/`            | —       |
| Backend / Auth  | Custom Supabase client (`src/auth/core/Supabase.ts`)            | —       |
| Prerender       | Puppeteer (build time only)                                     | 25.x    |
| Hosting         | Cloudflare Pages (`wrangler pages deploy`); Docker/nginx option | —       |
| Package manager | pnpm                                                            | 12.x    |

> **Preact instead of React** — `@preact/preset-vite` aliases `react` and `react-dom` to Preact at build time. Source code uses the React API; Preact provides it with a smaller runtime. `preact` and `@types/react` coexist in `package.json` for this reason.

> **Chess domain package** — `@chessviewer-org/chess-viewer` provides FEN and Fairy FEN parsing and validation, board types, SVG diagram generation, DPI metadata (`changeDPI`) and all LaTeX markup. It is published on npm and developed in [chess-viewer-utils](https://github.com/chessviewer-org/chess-viewer-utils).

> **Icon system** — `lucide-react` is not installed. The SVG path data for the icons in use lives in `src/assets/icons/index.tsx`, and `createLucideIcon` in `src/assets/icons/createIcon.tsx` turns each path list into a component with the Lucide API. Icon paths come from [Lucide](https://lucide.dev) (ISC License).

> **Supabase client** — `@supabase/supabase-js` is not installed. `src/auth/core/Supabase.ts` is a hand-written HTTP client that covers only the APIs in use: Auth (sign-in, sign-up, MFA, sessions), PostgREST queries and RPC calls. The exported `supabase` singleton is the only approved entry point.

> **Page animations** — `framer-motion` is not installed. `src/routes/navigation.ts` passes `navigateWithTransition` to wouter's `<Router aroundNav>`. A navigation that changes the path runs inside `document.startViewTransition`, resets scroll and cross-fades the pages for 180 ms. Tab switches on Settings, About, Export and Advanced FEN use the same transition. It falls back to an instant navigation when the API is missing or the user prefers reduced motion (`canAnimateViewTransition`).

---

## Project Structure

```
src/
├── App.tsx                        # Root: theme bootstrap, providers, router
├── index.tsx                      # Entry: hydrate or render, snapshot restore, prefetch
├── index.css                      # Global styles and @font-face
│
├── boot/                          # Inlined into index.html at build time (CSP-hashed)
│   ├── theme-init.js              # Applies the saved theme before first paint
│   ├── route-guard.js             # Restores the reload snapshot or flags a stale prerender
│   └── retire-service-worker.js   # Unregisters legacy service workers
│
├── auth/                          # Self-contained auth module
│   ├── core/                      # Supabase.ts client, AuthProvider, context, useAuth
│   ├── mfa/                       # TOTP API, useMfa, TwoFactor setup components
│   ├── profile/                   # profile.ts (display name), membership.ts (supporter tier)
│   ├── security/                  # securityEvents.ts (recent sign-in events)
│   ├── storage/                   # syncStorage.ts (user_data KV), dataMigration.ts
│   └── index.ts
│
├── components/
│   ├── board/                     # MiniPreview — thumbnail board for history cards
│   ├── features/
│   │   ├── BoardStyle/            # BoardStylePanel, DisplayOptions
│   │   ├── ColorPicker/           # HSV/HEX picker
│   │   ├── Export/                # ExportProgress overlay
│   │   ├── Fen/                   # FENInputField, FENInputToolbar, FenToolbar
│   │   └── History/               # HistoryFilters, StatusBadge, ConfirmationModal
│   ├── interactions/
│   │   ├── Board/                 # InteractiveBoard, BoardRank, DroppableSquare,
│   │   │                          #   DraggablePiece, TrashZone, useBoardKeyboard
│   │   ├── Editor/                # DiagramWorkspace, ChessEditor, CommandBar,
│   │   │                          #   DatabaseSearchPanel, ShareDialog, DragProvider
│   │   ├── FairySetup/            # FairyCatalogue, FairyProblem (Popeye card),
│   │   │                          #   CompositionLegend, SearchField, Segmented
│   │   └── PiecePalette/          # PiecePalette, FairySymbolPalette
│   └── layout/
│       ├── Navbar/                # Navbar, NavbarMenu, visibility and menu state
│       └── Sidebar/               # PageSidebarLayout, PageTabs
│
├── pages/
│   ├── HomePage/                  # Standard workspace
│   ├── FairyChessPage/            # Fairy workspace (DiagramWorkspace + FairyProblem)
│   ├── LatexPage/                 # LaTeX Studio: diagrams, document, export
│   ├── ExportPage/                # Board style and export settings
│   ├── AdvancedFENInputPage/      # Batch export of up to 10 positions
│   ├── FENHistoryPage/            # History with filters, favourites and archive
│   ├── SettingsPage/              # Account, appearance, board, accessibility, data
│   ├── DocsPage/                  # User documentation (/docs)
│   ├── AboutPage/                 # About, FAQ, privacy, changelog, donate
│   ├── AuthPages/                 # Sign in, sign up, forgot password, MFA
│   └── NotFoundPage/
│
├── routes/
│   ├── Router.tsx                 # wouter <Switch> with every route
│   ├── pages.ts                   # Route → cached page import, prefetch on intent
│   ├── pageModule.ts              # Shared, retryable dynamic import wrapper
│   └── navigation.ts              # navigateWithTransition
│
├── shared/
│   ├── constants/                 # chessConstants, fairyCatalogue, fairyPieces,
│   │                              #   dragDropConstants, syncConstants, seoConstants
│   ├── contexts/                  # FENBatchContext, ModalContext
│   ├── hooks/                     # useInteractiveBoard, useFENHistory, usePieceImages,
│   │                              #   useDragDrop, useTheme, useA11y, useHomeExport …
│   ├── styles/                    # ui.module.scss (shared form controls)
│   ├── types/                     # Canonical types — import via @app-types
│   ├── ui/                        # Seo, Modal, CustomSelect, DatePicker, Pagination …
│   └── utils/                     # Export, pieces, Popeye, snapshots, sync, logging …
│
└── styles/                        # theme.css tokens, base, components, utilities,
                                   #   animations, SCSS variables, mixins, patterns
```

Notable utilities in `src/shared/utils/`:

| File                                                        | Role                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------ |
| `canvasExporter.ts`, `exportRaster.ts`, `canvasRenderer.ts` | Raster export                                          |
| `svgExporter.ts`                                            | SVG export with embedded pieces and fairy legend       |
| `imageOptimizer.ts`, `exportState.ts`                       | Dimension math, Safari cap, cancel/pause state         |
| `pieceUtils.ts`, `pieceSources.ts`, `pieceRequest.ts`       | Piece image loading, shared cache, embedding           |
| `fenParser.ts`, `boardCells.ts`, `fairyCells.ts`            | FEN / Fairy FEN helpers around the domain package      |
| `popeye.ts`, `fairyLatex.ts`, `compositionCaption.ts`       | Popeye import/export, fairy LaTeX, legends             |
| `pageSnapshot.ts`, `stateFingerprint.ts`, `hydration.ts`    | Reload snapshot and hydration guards                   |
| `syncHydration.ts`, `pendingWrites.ts`                      | Deferred cloud hydration, flushing writes before hide  |
| `latexHandoff.ts`                                           | sessionStorage hand-off of positions to LaTeX Studio   |
| `analytics.ts`                                              | Optional Web Analytics loader (`VITE_CF_BEACON_TOKEN`) |
| `humanVerification.ts`, `databaseSearch.ts`                 | Turnstile token and Lichess/ChessDB lookups            |
| `archiveManager.ts`                                         | History archive (not ZIP export)                       |

---

## Path Aliases

Defined in `tsconfig.json` and `vite.config.js`:

```
@/*            → src/*
@shared/*      → src/shared/*
@components/*  → src/components/*
@pages/*       → src/pages/*
@hooks(/*)     → src/shared/hooks
@utils(/*)     → src/shared/utils
@ui(/*)        → src/shared/ui
@contexts(/*)  → src/shared/contexts
@constants(/*) → src/shared/constants
@app-types(/*) → src/shared/types
```

Use `@/x` for app-structure paths (`@/components`, `@/auth`) and the bare form for shared-layer barrels (`@utils`, `@hooks`, `@constants`, `@app-types`). Prefer importing the implementation module over a barrel when the barrel would pull unrelated code into a page chunk.

---

## Routing

All routes live in `src/routes/Router.tsx`; `src/routes/pages.ts` resolves each page through one cached dynamic import. The current page loads before hydration, and client navigation loads the destination's JS and CSS before the transition starts. Unvisited history entries use Suspense, and failed imports reach the error boundary, which can retry.

| Path                    | Component              | Prerendered | Indexed |
| ----------------------- | ---------------------- | ----------- | ------- |
| `/`                     | `HomePage`             | yes         | yes     |
| `/fairy-chess`          | `FairyChessPage`       | yes         | yes     |
| `/latex`                | `LatexPage`            | yes         | yes     |
| `/advanced-fen`         | `AdvancedFENInputPage` | yes         | yes     |
| `/export`               | `ExportPage`           | yes         | yes     |
| `/fen-history`          | `FENHistoryPage`       | yes         | yes     |
| `/docs`                 | `DocsPage`             | yes         | yes     |
| `/about`                | `AboutPage`            | yes         | yes     |
| `/settings`             | `SettingsPage`         | yes         | no      |
| `/auth/sign-in`         | `SignInPage`           | yes         | no      |
| `/auth/sign-up`         | `SignUpPage`           | yes         | no      |
| `/auth/forgot-password` | `ForgotPasswordPage`   | yes         | no      |
| `/auth/mfa`             | `MfaChallengePage`     | no          | no      |
| `*`                     | `NotFoundPage`         | no          | no      |

Legacy paths (`/support`, `/donate`, `/download`) redirect with 301 in `public/_redirects`.

---

## Build, Prerender and Hosting

`pnpm build` runs three steps:

1. **`vite build`** — bundles the app. The `inline-boot-scripts` plugin in `vite.config.js` compiles each `src/boot/*.js` file with esbuild and inlines it into `index.html`.
2. **`scripts/update-csp-hash.mjs`** — hashes every inline script and writes the hashes into the `script-src` directive of `dist/_headers`. No inline script runs without a matching hash.
3. **`scripts/prerender.mjs`** — opens each route from `scripts/prerendered-routes.mjs` in headless Chrome, waits for the page to settle and writes the HTML. Each page's stylesheets are inlined into a `<style>` block; the original `<link>` stays with `disabled`, so the browser does not fetch it and Vite's preload helper still treats it as loaded.

**SEO metadata** — the `Seo` component writes the title, description, robots, canonical, Open Graph/Twitter tags and JSON-LD into `document.head`, updating existing tags rather than adding duplicates. Prerendered pages therefore ship their metadata in `<head>`, and client navigation keeps it current. Route descriptions live in `src/shared/constants/seoConstants.ts`.

**Reload snapshot** — on `pagehide` the app stores the rendered `#root` HTML, keyed by build and a fingerprint of local and session storage. On reload `route-guard.js` restores it before scripts load, and `index.tsx` hydrates on top of it. When there is no matching snapshot, a prerendered page that does not fit the current URL or local state is hidden until the app renders (`prerender-stale`) or rendered from scratch (`prerender-dirty`).

**Files for crawlers and agents** — `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt` and `public/.well-known/ai-catalog.json`.

**Hosting** — GitHub Actions (`.github/workflows/deploy.yml`) builds every push to `master` and deploys `dist/` to Cloudflare Pages. `public/_headers` sets the security headers, CSP and cache lifetimes; hashed assets in `/static/*` and fonts are cached for a year. Cloudflare also injects its cookieless Web Analytics beacon at the edge. A `Dockerfile` with `nginx.conf` remains for self-hosting the same `dist/`.

---

## State Management

| Layer            | Tool                             | Examples                                    |
| ---------------- | -------------------------------- | ------------------------------------------- |
| Component state  | `useState`                       | Modal open/close, form values               |
| Derived state    | `useMemo`                        | Parsed FEN → board array                    |
| Cross-tree state | Context API                      | FEN batch list, modal state                 |
| Persistence      | localStorage (`useLocalStorage`) | FEN history, theme, settings, LaTeX project |
| Drag state       | `useDragDrop`, `useDragState`    | Active piece, drag origin                   |
| Cloud sync       | Supabase                         | KV via `syncStorage.ts` (RLS owner-scoped)  |

Writes are debounced, and `pendingWrites.ts` flushes them before the page hides. All hydration uses `safeJSONParse`.

Drag state must not be mirrored into React state. Doing so re-renders all 64 memoized squares on every pointer move.

---

## Board Rendering

### Display board

The interactive board is a CSS grid: `InteractiveBoard` renders eight `BoardRank` rows (`role="row"`, `display: contents`) of `DroppableSquare` cells (`role="gridcell"`), each holding a `DraggablePiece`. `useBoardKeyboard` adds keyboard editing through `aria-activedescendant`. Squares are memoized, so a move or cursor change only reconciles the affected ranks.

Piece images are same-origin SVGs in `/piece/<set>/` and `/fairypiece/<set>/`. A bounded, source-keyed cache shares loaded and in-flight images, and the board and the exporter use the same `HTMLImageElement`. Fairy letter glyphs are decoded only when the board or the selected palette needs them.

### Export canvas

`createUltraQualityCanvas()` in `canvasRenderer.ts` draws an off-screen `HTMLCanvasElement`:

- Board pixels: `round((cm / 2.54) × 300 × multiplier)`
- `getMaxCanvasSize()` caps at 16,384 px on Safari and 32,767 px elsewhere
- After every `canvas.toBlob()`: `canvas.width = 0; canvas.height = 0` — mandatory for Safari GPU memory release

---

## Export System

See [EXPORT_PIPELINE.md](../reference/EXPORT_PIPELINE.md) for the full reference.

1. The download button in the CommandBar opens `/export` (Board Style and Export Settings tabs).
2. The user picks formats (PNG, JPEG, SVG — several at once), quality (1×–4×), board size (4, 6, 8 cm or a custom value between 4 and 8) and file names.
3. PNG/JPEG: `createRasterBlob()` renders on the main-thread canvas, then `changeDPI()` writes the DPI metadata.
4. SVG: `generateBoardSVG()` embeds every piece as a data URL, plus the fairy legend and source notation when present.
5. The file is saved through `<a download>` (`saveBlob.ts`).
6. Batch export on `/advanced-fen` repeats this for every position and packs the files into a ZIP with fflate.

---

## Authentication and Cloud Sync

Authentication is optional; the app is fully functional without an account. All auth code lives in `src/auth/`, and nothing outside it calls Supabase directly.

| Module                       | Role                                                  |
| ---------------------------- | ----------------------------------------------------- |
| `core/Supabase.ts`           | Singleton client: Auth, PostgREST, RPC                |
| `core/AuthProvider.tsx`      | Session state from one `INITIAL_SESSION` listener     |
| `storage/syncStorage.ts`     | The only approved interface to the `user_data` table  |
| `storage/dataMigration.ts`   | One-time localStorage → Supabase migration on sign-in |
| `mfa/`                       | TOTP enrolment, challenge and management              |
| `profile/profile.ts`         | Display name                                          |
| `profile/membership.ts`      | Supporter tier                                        |
| `security/securityEvents.ts` | Recent sign-in events                                 |

`syncStorage.set(key, value)` upserts into `user_data`; RLS enforces `auth.uid() = user_id`, so no user can read another user's rows. It never rejects: network and database errors are logged and returned as `'error'`. Concurrent reads for the same user and key share one in-flight request.

Accessibility preferences (`useColorVision`, `useContrast`, `useReducedMotionPreference` in `useA11y.ts`) hydrate from the cloud on an idle callback after first paint, so they never block rendering.

Database searches need a Cloudflare Turnstile token (`humanVerification.ts`) before the proxy forwards the FEN to Lichess or ChessDB. Fairy positions are never sent to these services.

---

_Last updated: October 2026_
