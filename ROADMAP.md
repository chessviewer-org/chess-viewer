# ChessVision — Roadmap

What is built, what is next, and what is not planned. Milestone targets below are planning estimates, not hard commitments.

---

## Implemented (v6.0.1)

### Core Editor

- FEN notation parsing and validation (93-character cap, real-time feedback)
- Drag-and-drop board editor powered by `@dnd-kit` (pointer and touch sensors)
- Board flip and coordinate label toggle
- Undo/redo for interactive board edits
- 23 piece sets (Lichess CDN, rasterized to 256px blob URLs for crisp rendering)
- 20 preset board themes
- Custom colour picker (HSV/RGB/HEX)
- Piece palette for off-board placement
- Trash zone for piece removal by drag

### Export

- PNG and JPEG raster export with DPI metadata (pHYs chunk / JFIF fields)
- SVG vector export with piece images embedded as base64
- 4 quality presets: 1× (300 DPI), 2× (600 DPI), 3× (900 DPI), 4× (1200 DPI)
- Board size selection in centimetres (4, 6, 8 cm) for physical print accuracy
- Export pause, resume, and cancel
- Full-screen Export Studio (board style + export settings in one view)
- Batch export (Advanced FEN Input) — multiple positions → ZIP download
- Copy board to clipboard (PNG)

### Pages

- Home page (`/`) — main board editor + controls
- Export page (`/export`) — full-screen export studio
- About page (`/about`) — FAQ, privacy, contribute, donate sections
- Settings page (`/settings`) — appearance, board, account, security, data
- FEN History page (`/fen-history`) — browsable history with filters and search
- Advanced FEN Input page (`/advanced-fen`) — batch position editor
- 404 page
- All pages lazy-loaded with code splitting and hover-prefetch

### State and Persistence

- FEN history with localStorage persistence (debounced 300ms)
- History freshness badges (Fresh / Aging / Stale) with timestamps
- History filtering, sorting, favouriting, and pinning
- Recent colours list (up to 12)
- Theme and settings persistence across sessions
- FEN batch list persistence

### Account and Cloud Sync (Optional)

- Email/password authentication via Supabase
- TOTP-based two-factor authentication
- Cloud sync of settings and history (row-level security, owner-scoped)
- 90-day re-verification gate for privileged operations
- Data migration from localStorage on first sign-in
- Supporter/membership tiers via GitHub Sponsors

### Performance

- Code splitting for all pages (React.lazy + Suspense)
- Hover-prefetch for likely next routes
- Piece image caching (`pieceImageCache.ts`, max 36 images)
- Memoized board components (`DroppableSquare`, `DraggablePiece` — render ×64)
- SVG → raster export through Web Worker (OffscreenCanvas) when pieces are CDN URLs
- Virtualised FEN history grid with `react-window`
- Debounced localStorage writes
- Deferred cloud hydration for accessibility preferences (requestIdleCallback)
- Service Worker (Workbox) for offline use and hard-refresh performance

### App

- Light/dark theme with `prefers-color-scheme` fallback and animated transition
- Neutral focus ring on inputs (1px, not accent-coloured)
- Toast notification system
- Global modal system (alert / confirm)
- Skip-to-main-content link
- PWA manifest and installability
- Position database search (Lichess, PDB, YACPDB) on demand
- Share board via URL or image

### Code Quality

- TypeScript 6 strict mode (no `any`, no `!`, no `@ts-ignore`)
- ESLint zero-warnings in CI
- Conventional Commits enforced via commitlint + Husky
- Atomic commit validator (one logical domain per commit)
- Prettier formatting with pre-commit hook via lint-staged
- FEN parser unit tests (node:test, co-located)

---

## Not Yet Implemented

### Priority Items

1. **Full keyboard control of the board** — arrow keys to move pieces, no mouse required
2. **Annotations** — right-click square highlighting (red/yellow/green/blue) and arrow overlays ([#161](https://github.com/chessvision-org/chess-vision/issues/161), _v6.2.0_)
3. **AI position import** — Open Folder picks a board image and a vision model extracts the FEN directly onto the board ([#163](https://github.com/chessvision-org/chess-vision/issues/163), _v6.3.0_)
4. **PGN import** — paste a PGN and step through positions
5. **Direct game import** — paste a Lichess URL and extract positions

### Lower Priority

- [ ] URL-based position sharing (`?fen=...`)
- [ ] Custom & fairy piece sets — hybrid pieces, themed sets, user upload ([#162](https://github.com/chessvision-org/chess-vision/issues/162), _v6.2.0_)
- [ ] i18n / multi-language support
- [ ] Full WCAG 2.1 AA compliance — canvas still has no DOM alternative for screen readers
- [ ] Lichess browser extension (Phase 3 on the roadmap)
- [ ] npm package release (`@chessvision-org/core`) for headless board rendering

---

## Known Technical Debt

- Canvas board is not accessible to screen readers — no DOM alternative for the 64-square position
- Automated test coverage is limited to the FEN parser — no component tests or E2E suite
- No Lighthouse CI or bundle-size tracking in the pipeline (vite-bundle-visualizer available on demand via `pnpm build:analyze`)

---

## Not Planned

- Chess engine integration or position analysis
- Move animation or game playback
- Native mobile apps
- Multi-player or real-time features

---

## Release Milestones

Active milestones tracked on the [project board](https://github.com/orgs/chessvision-org/projects/1):

| Milestone | Focus                                                           | Target   |
| --------- | --------------------------------------------------------------- | -------- |
| v6.0.1    | Critical fixes                                                  | Jun 2026 |
| v6.0.2    | Mobile responsive                                               | Jul 2026 |
| v6.0.3    | Polish                                                          | Jul 2026 |
| v6.1.0    | Swipe & interaction                                             | Sep 2026 |
| v6.2.0    | Features — annotations, custom/fairy piece sets, click-to-place | Oct 2026 |
| v6.3.0    | AI & Import — Open Folder FEN extraction                        | Nov 2026 |

---

**Last updated:** June 2026 — v6.0.1
