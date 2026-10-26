# Architectural Decision Records

Records of key architectural and technical decisions made during ChessViewer's development.

---

## ADR-001: React API on the Preact Runtime

**Date:** 2025-12-27 | **Updated:** 2026-10 | **Status:** Accepted

**Decision:** Components use the React API (functional components and hooks only). Since the move to Preact 11, `@preact/preset-vite` aliases `react` and `react-dom` to Preact at build time.

**Rationale:** The React API keeps the large ecosystem, TypeScript support and team familiarity, while Preact ships a much smaller runtime.

**Trade-offs:** A few React-only behaviours differ (for example passive effect cleanup timing), so persistence and drag cleanup run before a new page mounts.

---

## ADR-002: DOM Board, Canvas and SVG for Export

**Date:** 2025-12-28 | **Updated:** 2026-10 | **Status:** Accepted

**Decision:** The interactive board is a DOM grid of memoized squares with ARIA grid semantics. Raster exports are drawn on an off-screen HTML5 canvas; vector exports are generated as SVG.

**Rationale:** A DOM board is accessible to screen readers and keyboards and handles pointer input natively. The canvas gives direct pixel control for high-resolution exports with a consistent `toBlob` API.

**Trade-offs:** The board and the exporter are two renderers that must stay visually in sync; both read the same piece images and theme values.

**Rejected alternatives:**

- SVG: harder to export as raster at large sizes; performance issues at ultra-high resolution
- DOM (div-based): poor export quality
- WebGL: overkill for 2D; compatibility concerns

---

## ADR-003: Supabase for Optional Backend

**Date:** 2026-05-23 | **Status:** Accepted (supersedes zero-backend ADR-003-original)

**Decision:** Supabase provides optional authentication, KV storage (`user_data` table), and RLS-enforced data access. Privacy is enforced by Row-Level Security: every row is owner-scoped — one account cannot read another's data. No client-side encryption.

**Rationale:** Users requested cross-device sync. Supabase was chosen for its Row-Level Security, built-in auth with TOTP MFA, and PostgreSQL RPC support (needed for the security gate pattern). Client-side E2EE was considered and rejected as overengineering — RLS owner-scoping provides the necessary privacy guarantee without key-management complexity.

**Constraints:**

- All Supabase access through the singleton in `src/auth/core/Supabase.ts`. No second client.
- `syncStorage.ts` is the only approved interface for user KV data. Direct `from('user_data')` calls outside this file are forbidden.
- RLS must be ON for all tables. Default-deny.
- Privileged writes (e.g., updating `last_verified_at`) go through RPC only — direct UPDATE policy is disabled by design.

**Trade-offs:** App now requires a Supabase project for cloud sync features. Core functionality (rendering, export, local history) remains fully offline.

---

## ADR-004: Tailwind CSS for Styling

**Date:** 2025-12-28 | **Status:** Accepted (upgraded to Tailwind 4)

**Decision:** Tailwind 4 utility-first CSS, with SCSS modules for larger components. All theme colors are CSS variables defined in `src/styles/theme.css`. No hardcoded hex values in JSX or Tailwind classes.

**Rationale:** Rapid UI development, consistent design system, small production bundle, built-in responsive and dark mode support.

**Trade-offs:** Verbose `className` attributes; custom overrides require CSS variable definitions rather than arbitrary values.

---

## ADR-005: Client-Side FEN Parsing

**Date:** 2025-12-28 | **Status:** Accepted

**Decision:** FEN and Fairy FEN parsing run on the client. The parser lives in `@chessviewer-org/chess-viewer`; `src/shared/utils/fenParser.ts` wraps it for the app. `MAX_FEN_LENGTH = 93` is enforced for orthodox FEN before any parse attempt; Fairy FEN has its own bounded limit.

**Rationale:** No server round-trip, instant validation feedback, works offline. A full chess engine (chess.js: ~80 KB) is unnecessary since we only need position parsing, not move validation.

---

## ADR-006: localStorage for Local Persistence

**Date:** 2025-12-29 | **Status:** Accepted

**Decision:** Browser `localStorage` API for all local state persistence (history, settings, theme). All hydration uses `safeJSONParse` (prototype-pollution-safe).

**Rationale:** Synchronous API, available everywhere, sufficient for 5–10 MB of user data.

**Trade-offs:** Device-specific. Can be cleared by browser. No automatic backup (addressed by Data Management export/import feature).

---

## ADR-007: SVG Piece Sets from Lichess

**Date:** 2025-12-28 | **Status:** Accepted

**Decision:** 20 SVG piece sets sourced from Lichess, self-hosted in `public/piece/` (authors and terms per set in `public/piece/ATTRIBUTION.md`). `companion` and `leipzig` retain Lichess's “freeware” classification and their authors' names rather than being mislabeled GPL or CC. Fairy symbols are generated from the included sets into `public/fairypiece/` with `pnpm pieces:fairy`. Images are cached in memory by `pieceUtils.ts`, keyed by source URL.

**Rationale:** Excellent quality at any export size, small files, and no runtime dependency on the Lichess CDN.

---

## ADR-008: Vite as Build Tool

**Date:** 2025-12-28 | **Status:** Accepted (upgraded to Vite 8)

**Decision:** Vite with Rolldown's native code splitting and Oxc minification. One explicit group keeps Preact and wouter together (`preact-router`); every page is its own dynamic chunk.

**Rationale:** Fast HMR, native ES modules in dev, optimized production builds, built-in TypeScript support.

**Constraints:** `assetsInlineLimit: 4096` — SVG chess pieces must remain HTTP-cacheable. Chunk size warning threshold: 500 KB.

---

## ADR-009: Custom Drag and Drop for Board Editing

**Date:** 2025-12-28 | **Updated:** 2026-10 | **Status:** Accepted (replaced `@dnd-kit`, which replaced `react-dnd`)

**Decision:** Drag and drop uses the in-house `useDragDrop` and `useDragState` hooks with pointer events. Drag state lives outside the React board state.

**Rationale:** Mirroring drag state into React state causes 64-square cascade re-renders on every pointer move. The custom hooks give targeted subscriptions, pointer-fast dragging and adjustable touch sensitivity without a library.

**Constraints:** `BoardSquare`, `DraggablePiece`, `DroppableSquare` must stay `memo()`'d. A new prop on any of these must be referentially stable (`useMemo`/`useCallback`) or it re-renders all 64 squares.

---

## ADR-010: TypeScript Strict Mode

**Date:** 2026-05-23 | **Updated:** 2026-10 | **Status:** Accepted

**Decision:** Full strict mode with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `noImplicitAny`. Zero `any`, `@ts-ignore`, or non-null assertions (`!`) in the codebase. `tsc` comes from TypeScript 7; ESLint uses the separate TypeScript 6 API package.

**Rationale:** Prevents entire classes of runtime bugs. TypeScript 7 type-checks the project roughly eight times faster than the TypeScript 6 compiler.

**Constraints:** All canonical types live in `src/shared/types/` and are imported via the `@app-types` alias. No local type redeclarations that duplicate these.

---

## ADR-011: Web Workers for Large Exports

**Date:** 2026-04-17 | **Status:** Superseded (2026-10)

**Superseded:** the worker path never succeeded in practice — `createImageBitmap` in a worker cannot decode SVG blobs that embed `data:image/png` pieces, so every export fell back to the main-thread canvas. The worker and `workerRasterExport.ts` were removed; rasterisation runs on the canvas path, and the Safari disposal constraint below still applies.

**Decision:** SVG-to-raster conversion for exports above 4,000 px routes through `svgRasterWorker.ts` via `OffscreenCanvas`. Never call `canvasRenderer` synchronously on the main thread for export-size operations.

**Rationale:** Prevents main thread blocking during large canvas operations. `OffscreenCanvas` in a Worker avoids UI freezes and Safari OOM patterns.

**Constraints:** After every `HTMLCanvasElement` blob generation: `canvas.width = 0; canvas.height = 0`. Safari does not GC canvas GPU memory on reference drop — this disposal is mandatory.

---

## ADR-012: No Tracking, Aggregate Visit Counts Only

**Date:** 2025-12-28 | **Updated:** 2026-10-25 | **Status:** Accepted

**Decision:** No tracking cookies, advertising pixels, fingerprinting or telemetry. Visits are counted in aggregate with Cloudflare Web Analytics, which Cloudflare injects at the edge.

**Rationale:** Privacy-first design with enough signal to know whether the site is used. Cloudflare Web Analytics sets no cookies, uses no client-side storage and reports only totals, so there is no GDPR/CCPA consent overhead. It counts browsers that run JavaScript, which leaves out most bots. Issues are still reported through GitHub, not discovered through analytics.

**Previously:** no analytics of any kind. Changed because server-side request counts include bots and cannot show real visitors.

---

## ADR-013: Cloudflare Pages for Hosting

**Date:** 2025-12-28 | **Updated:** 2026-10 | **Status:** Accepted

**Decision:** GitHub Actions builds every push to `master` and deploys `dist/` to Cloudflare Pages. Security headers, CSP and cache lifetimes live in `public/_headers`; legacy redirects in `public/_redirects`.

**Rationale:** Edge caching close to every visitor, free TLS, DDoS protection and WAF, and deployment with one `wrangler pages deploy` step. The CSP hashes are written into `_headers` at build time.

**Note:** The app stays a static bundle. The `Dockerfile` and `nginx.conf` remain for self-hosting the same `dist/` anywhere. History: Vercel (`vercel.json`), then nginx in Docker, then Cloudflare Pages.

---

## ADR-014: No versioned releases

**Date:** 2025-12-28 | **Updated:** 2026-07-01 | **Status:** Superseded

**Original decision:** SemVer 2.0.0 with semantic-release automation.

**Superseded by:** ChessViewer ships as a web app with no npm publish or extension store submission. Automated tagging added noise without value — a patch commit every few hours would produce a new tag with no meaningful signal. The project now follows a rolling-release model: `master` is always production, changes are documented in `CHANGELOG.md` by month, and GitHub milestones group open work by theme rather than version.

---

## ADR-015: Build-Time Prerender with Inlined Page Styles

**Date:** 2026-10 | **Status:** Accepted

**Decision:** `scripts/prerender.mjs` renders every public route in headless Chrome after `vite build` and writes static HTML. Each page's stylesheets are inlined into a `<style>` block; the original `<link>` stays with `disabled` so it is not fetched but still counts as loaded for Vite's preload helper. Page metadata is written into `<head>` by the `Seo` component, and a reload snapshot restores the last rendered page before scripts load.

**Rationale:** Crawlers and first-time visitors get complete HTML with metadata in `<head>`, and the first paint no longer waits for render-blocking stylesheet requests. Mobile Lighthouse improved from 86 to 100 on a local build (FCP 2.5 s → 1.2 s).

**Trade-offs:** Each HTML response is about 20 KB larger compressed, and the page CSS is not shared from cache between routes. The prerender step needs Chrome in CI.

---

## Proposing a New Decision

1. Open a GitHub Discussion with your proposal.
2. Reference the existing ADR you are challenging, if any.
3. Provide rationale and evidence.
4. Discuss trade-offs before implementing.
5. Update this file if the decision is accepted.

---

_Last updated: October 2026_  
_Maintainer: [Khatai Huseynzada](https://github.com/BilgeGates)_
