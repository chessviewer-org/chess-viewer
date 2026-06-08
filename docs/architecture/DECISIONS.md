# Architectural Decision Records

Records of key architectural and technical decisions made during ChessVision's development.

---

## ADR-001: React as UI Framework

**Date:** 2025-12-27 | **Status:** Accepted

**Decision:** React 19.x with functional components and hooks only.

**Rationale:** Large ecosystem, strong TypeScript support, efficient updates via hooks and memoization. Team familiarity.

**Trade-offs:** Larger bundle than vanilla JS; runtime overhead compared to compiled frameworks (Svelte).

---

## ADR-002: HTML5 Canvas for Board Rendering

**Date:** 2025-12-28 | **Status:** Accepted

**Decision:** HTML5 Canvas API for both display rendering and image export.

**Rationale:** Direct pixel manipulation for high-resolution exports, GPU-accelerated drawing, consistent cross-browser `toBlob` / `toDataURL` API.

**Trade-offs:** Canvas content is inaccessible to screen readers. No built-in hover/click detection on pieces — requires manual coordinate math.

**Rejected alternatives:**

- SVG: harder to export as raster at large sizes; performance issues at ultra-high resolution
- DOM (div-based): poor export quality
- WebGL: overkill for 2D; compatibility concerns

---

## ADR-003: Supabase for Optional Backend

**Date:** 2026-05-23 | **Status:** Accepted (supersedes zero-backend ADR-003-original)

**Decision:** Supabase provides optional authentication, KV storage (`user_data` table), and RLS-enforced data access. All user data is end-to-end encrypted client-side before transmission.

**Rationale:** Users requested cross-device sync. Supabase was chosen for its Row-Level Security, built-in auth with TOTP MFA, and PostgreSQL RPC support (needed for the security gate pattern).

**Constraints:**

- All Supabase access through the singleton at `supabaseClient.ts`. No second client.
- `syncStorage.ts` is the only approved interface for user KV data. Direct `from('user_data')` calls outside this file are forbidden.
- RLS must be ON for all tables. Default-deny.
- Privileged writes (e.g., updating `last_verified_at`) go through RPC only — direct UPDATE policy is disabled by design.

**Trade-offs:** App now requires a Supabase project for cloud sync features. Core functionality (rendering, export, local history) remains fully offline.

---

## ADR-004: Tailwind CSS for Styling

**Date:** 2025-12-28 | **Status:** Accepted (upgraded to Tailwind 4)

**Decision:** Tailwind 4 utility-first CSS. All theme colors are CSS variables defined in `src/index.css` (`--accent`, `--bg-primary`, etc.). No hardcoded hex values in JSX or Tailwind classes.

**Rationale:** Rapid UI development, consistent design system, small production bundle, built-in responsive and dark mode support.

**Trade-offs:** Verbose `className` attributes; custom overrides require CSS variable definitions rather than arbitrary values.

---

## ADR-005: Client-Side FEN Parsing

**Date:** 2025-12-28 | **Status:** Accepted

**Decision:** FEN parsing implemented in TypeScript on the client (`fenParser.ts`). `MAX_FEN_LENGTH = 93` enforced before any parse attempt.

**Rationale:** No server round-trip, instant validation feedback, works offline. Full FEN parser is lightweight (~2 KB). A full chess engine (chess.js: ~80 KB) is unnecessary since we only need position parsing, not move validation.

---

## ADR-006: localStorage for Local Persistence

**Date:** 2025-12-29 | **Status:** Accepted

**Decision:** Browser `localStorage` API for all local state persistence (history, settings, theme). All hydration uses `safeJSONParse` (prototype-pollution-safe).

**Rationale:** Synchronous API, available everywhere, sufficient for 5–10 MB of user data.

**Trade-offs:** Device-specific. Can be cleared by browser. No automatic backup (addressed by Data Management export/import feature).

---

## ADR-007: SVG Piece Sets from Lichess

**Date:** 2025-12-28 | **Status:** Accepted

**Decision:** SVG piece sets sourced from Lichess (MIT-licensed), stored in `/public/pieces/`, cached in memory via `pieceImageCache.ts` (keyed by SVG URL).

**Rationale:** Excellent quality at any export size, open-source, community-maintained, small per-piece file size (~2–5 KB each).

---

## ADR-008: Vite as Build Tool

**Date:** 2025-12-28 | **Status:** Accepted (upgraded to Vite 8)

**Decision:** Vite with manual chunk splitting: `vendor-react`, `vendor-icons`, `vendor-motion`, `vendor-dnd`, `vendor-virtualization`.

**Rationale:** Fast HMR, native ES modules in dev, optimized production builds, built-in TypeScript support.

**Constraints:** `assetsInlineLimit: 4096` — SVG chess pieces must remain HTTP-cacheable. Chunk size warning threshold: 500 KB.

---

## ADR-009: React DnD for Board Editing

**Date:** 2025-12-28 | **Status:** Accepted

**Decision:** `react-dnd` with dual backends: HTML5 for desktop, Touch for mobile. DnD state lives exclusively in `useInteractiveBoard.ts` and `react-dnd` monitors — never mirrored into React state.

**Rationale:** Mirroring drag state into React state causes 64-square cascade re-renders on every drag event. `react-dnd` monitors provide efficient, targeted subscriptions.

**Constraints:** `BoardSquare`, `DraggablePiece`, `DroppableSquare` must stay `memo()`'d. `CustomDragLayer` reads only from `useDragLayer`, never from parent state.

---

## ADR-010: TypeScript 6 Strict Mode

**Date:** 2026-05-23 | **Status:** Accepted

**Decision:** Full TypeScript 6 strict mode: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitAny`. Zero `any`, `@ts-ignore`, or non-null assertions (`!`) in the codebase.

**Rationale:** Prevents entire classes of runtime bugs. TypeScript 6 catches issues that TypeScript 4/5 permitted.

**Constraints:** All canonical types live in `src/shared/types/` and are imported via the `@app-types` alias. No local type redeclarations that duplicate these.

---

## ADR-011: Web Workers for Large Exports

**Date:** 2026-04-17 | **Status:** Accepted

**Decision:** SVG-to-raster conversion for exports above 4,000 px routes through `svgRasterWorker.ts` via `OffscreenCanvas`. Never call `canvasRenderer` synchronously on the main thread for export-size operations.

**Rationale:** Prevents main thread blocking during large canvas operations. `OffscreenCanvas` in a Worker avoids UI freezes and Safari OOM patterns.

**Constraints:** After every `HTMLCanvasElement` blob generation: `canvas.width = 0; canvas.height = 0`. Safari does not GC canvas GPU memory on reference drop — this disposal is mandatory.

---

## ADR-012: No Analytics or Tracking

**Date:** 2025-12-28 | **Status:** Accepted

**Decision:** No analytics, tracking, or telemetry of any kind.

**Rationale:** Privacy-first design. No GDPR/CCPA compliance overhead. Faster page load. Issues are reported through GitHub, not discovered through analytics.

---

## ADR-013: nginx (Docker) for Hosting

**Date:** 2025-12-28 | **Updated:** 2026-06-08 | **Status:** Accepted

**Decision:** Serve the static `dist/` build from nginx in a Docker container at `chessvision.org`. SPA routing, caching, and all security headers + CSP live in `nginx.conf`.

**Rationale:** Full control over the served headers/CSP, vendor-neutral and portable, no platform lock-in, and the app is a static bundle that runs anywhere.

**Note:** The app is a static site (`dist/` folder) that can be self-hosted on any host or static CDN. Superseded the earlier Vercel-based hosting (`vercel.json` removed; its headers were ported into `nginx.conf`).

---

## ADR-014: Semantic Versioning

**Date:** 2025-12-28 | **Status:** Accepted

**Decision:** SemVer 2.0.0: MAJOR.MINOR.PATCH.

- MAJOR: breaking changes, removed localStorage keys, incompatible behavior
- MINOR: new features, backwards-compatible
- PATCH: bug fixes, backwards-compatible

---

## Proposing a New Decision

1. Open a GitHub Discussion with your proposal.
2. Reference the existing ADR you are challenging, if any.
3. Provide rationale and evidence.
4. Discuss trade-offs before implementing.
5. Update this file if the decision is accepted.

---

_Last updated: May 2026 — v6.0.0_  
_Maintainer: [@BilgeGates](https://github.com/BilgeGates)_
