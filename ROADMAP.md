# Roadmap

Implemented features and planned work. No timeline commitments.

---

## Implemented (v6.0.0)

### Core

- FEN notation parsing and validation (`MAX_FEN_LENGTH = 93`)
- Canvas-based board renderer with coordinates
- Interactive drag-and-drop board editor (React DnD, HTML5 + Touch backends)
- Board flip and coordinate label toggle
- 23 piece sets
- 20+ preset board themes; up to 48 total presets including user-created ones
- Custom board color picker (HSL/RGB/HEX)
- Multiple color picker views (main, advanced, settings)

### Export

- PNG and JPEG export with DPI metadata embedding
- SVG export (Advanced FEN page: single and batch)
- 4 quality levels: 8× (Print), 16× (Print), 24× (Social), 32× (Social)
- Board size selection (4 cm, 6 cm, 8 cm) for print mode
- Max export: 30,208 × 30,208 px at 9,600 DPI
- Pause / resume / cancel export
- Batch export with ZIP archive (Advanced FEN Input page)
- Clipboard copy
- Web Worker-based SVG rasterization for exports above 4,000 px

### Pages and Routing

- Home page (`/`) — board playground and export studio
- About page (`/about`)
- Download / PWA install guide (`/download`)
- Support page (`/support`)
- Settings page (`/settings`) — export customization, theme studio, data management
- FEN History page (`/fen-history`) — browsable history with archive
- Advanced FEN Input page (`/advanced-fen`) — batch editor with playback
- 404 page
- All pages lazy-loaded with code splitting

### State and Persistence

- FEN history with localStorage persistence (300 ms debounced writes)
- FEN history archive with auto-archival and freshness indicators (Fresh / Aging / Stale)
- History filtering, sorting, favorites, and pinning
- Recent colors list (up to 12)
- Theme and settings persistence across sessions
- FEN batch list persistence

### Authentication and Cloud Sync

- Email/password sign-in with TOTP-based MFA
- End-to-end encrypted cloud sync via Supabase
- 90-day re-verification security gate (fail-closed)
- Automatic localStorage → Supabase migration on first sign-in
- Data management: export backup, restore from backup, full reset

### App and UI

- Light / dark color-scheme toggle with `prefers-color-scheme` fallback
- Skip-to-main-content link
- Navbar hidden on tool pages for distraction-free editing
- ErrorBoundary wrapping the full app
- Toast notification system
- PWA manifest

### Performance

- `React.lazy` code splitting for all pages
- `memo()` on `BoardSquare`, `DraggablePiece`, `DroppableSquare`
- `useMemo` / `useCallback` on hot render paths
- Piece image caching via `pieceImageCache.ts`
- Virtualised FEN history list (`react-window`)
- History persistence debounced at 300 ms
- Export pause / resume / cancel with per-checkpoint cancellation hooks
- Safari canvas OOM prevention: `canvas.width = 0` after every blob generation

### Code Quality

- TypeScript 6 strict mode across entire codebase
- Centralised `logger.ts` (dev-only output)
- Conventional commits enforced via commitlint + Husky
- ESLint with react-hooks plugin, zero warnings in CI
- Prettier with pre-commit hook

---

## Not Yet Implemented

### High Priority

1. **SVG export on Home page** — SVG export is currently only in the Advanced FEN flow; parity with Home page export toolbar is pending.
2. **URL-based position sharing** — `?fen=...` query param to load a position from a link.
3. **Keyboard shortcuts** — Flip board, export, clear, copy, toggle coordinates.

### Medium Priority

- Undo / redo for interactive board edits
- Arrow and highlight annotations on squares
- PGN import
- Game import from Lichess or Chess.com URL
- Custom piece set upload

### Low Priority / High Effort

- Full WCAG 2.1 AA accessibility compliance
- Board text description for screen readers (generated from parsed FEN)
- Position database / famous games browser
- i18n / multi-language support

---

## Not Planned

- Move animation or game playback
- Chess engine integration or position analysis
- Native mobile apps
- WebSocket multiplayer or real-time collaboration

---

## Known Technical Debt

- Canvas board has no DOM accessible alternative for screen readers
- Automated test coverage is limited to FEN parser unit tests
- 24×/32× Social exports may crash on Safari/iOS (canvas memory cap)
- No Lighthouse CI or bundle size tracking in the build pipeline
- Case-insensitive filesystem artefact: `export/` and `Export/` directories coexist in `features/`; same for `fen/`/`Fen/`, `history/`/`History/`

---

*Last updated: May 2026 — v6.0.0*
