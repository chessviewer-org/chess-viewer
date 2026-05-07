# FENForsty Pro — Roadmap

Potential future features and known technical debt. No timeline commitments.

---

## Implemented (v5.0.0)

### Core

- FEN notation parsing and validation
- Canvas-based board renderer (ChessBoard)
- Interactive drag-and-drop board editor (ChessEditor, React DnD)
- Board flip and coordinate toggle
- 23+ piece sets
- 20+ board theme presets
- Custom board color picker (HSV/RGB/HEX)
- Multiple color picker views (main, advanced, settings)

### Export

- PNG and JPEG export
- SVG export (Advanced FEN page: single and batch)
- 4 quality levels: 8× (Print), 16× (Print), 24× (Social), 32× (Social)
- Board size selection (4 cm, 6 cm, 8 cm) for print mode
- Physical dimension accuracy (DPI-correct output)
- Pause / resume / cancel export
- Batch FEN export (Advanced FEN Input page with `FENBatchContext`)
- Copy board to clipboard

### Pages & Routing

- Home page (`/`) — main board + controls
- About page (`/about`)
- Download / PWA install guide (`/download`)
- Support page (`/support`)
- Settings page (`/settings`) — export and theme customisation tabs
- FEN History page (`/fen-history`)
- Advanced FEN Input page (`/advanced-fen`) — batch editor
- 404 Not Found page
- All pages lazy-loaded with code splitting

### State & Persistence

- FEN history with localStorage persistence (300 ms debounced)
- FEN history archive with auto-archival
- History filtering and sorting
- Favorites
- Recent colors list (up to 12)
- Theme and settings persistence across sessions
- FEN batch list persistence

### App & UI

- Light / dark color-scheme toggle with `prefers-color-scheme` fallback
- Theme customization (preset themes + custom light/dark square colors)
- Skip-to-main-content link (keyboard accessibility)
- Navbar hidden on tool pages for distraction-free experience
- ErrorBoundary wrapping the full app
- Toast notification system
- PWA manifest (`manifest.json`)

### Performance

- React.lazy code splitting for all pages
- `useMemo` / `useCallback` throughout hooks
- Piece image caching (`pieceImageCache.js`)
- Virtualised lists with `react-window`
- History debounced persistence
- `rafThrottle` for drag handlers
- Export pause/resume/cancel

### Accessibility

- Skip navigation link
- ARIA roles on modals (role="dialog", aria-modal, aria-labelledby)
- FEN input: aria-describedby, aria-invalid
- Export progress: role="dialog", aria-valuenow
- Keyboard navigation in Navbar (Escape, Enter, Space)
- Focus trap in modals
- scroll-lock on mobile menu open

### Code Quality

- JSDoc comments across the codebase
- Centralised `logger.js` (dev-only output)
- Centralised `errorHandler.js`
- Conventional commits enforced via commitlint + husky
- ESLint with react-hooks plugin, zero max-warnings in CI
- Prettier formatting with pre-commit hook

---

## Not Yet Implemented

## Priority Roadmap Items

1. **SVG export parity:** add SVG action to Home page export controls (Advanced FEN already supports SVG).
2. **Site theme change improvements:** extend theme system with clearer global presets/workflows and reduce split behaviour between Home and Settings.
3. **Direct game import from external sources:** support pasting/reading Lichess or Chess.com game URLs (or PGN text) and converting to position list/FEN.

---

### Low Effort

- [ ] URL-based position sharing (`?fen=...`)
- [ ] Keyboard shortcuts for board actions

### Medium Effort

- [ ] Undo/redo for interactive board edits
- [ ] Arrow and highlight annotations on squares
- [ ] PGN import
- [ ] Direct game import from Lichess/Chess.com URL or PGN text
- [ ] Custom piece set upload
- [ ] Export to ZIP archive (batch download as single file)

### High Effort

- [ ] Full WCAG 2.1 AA accessibility compliance (canvas alternative text, screen reader)
- [ ] Web Worker for off-thread export rendering
- [ ] Position database / famous games browser
- [ ] i18n / multi-language support

---

## Known Technical Debt

- Canvas is not accessible to screen readers — no DOM alternative for board position
- Automated test coverage is limited and current Node test import path is broken
- Export at 24×/32× Social may crash on iOS/Safari (canvas memory limit)
- No Lighthouse CI in build pipeline
- No bundle size tracking (vite-bundle-visualizer only on demand)
- `export/` and `Export/` directories are duplicated in `features/` (case-insensitive filesystem artefact)
- Same duplication exists for `fen/` / `Fen/`, `history/` / `History/`, `theme/` / `Theme/`

---

## Not Planned

- Move animation or game playback
- Chess engine integration or position analysis
- User accounts or cloud sync
- Native mobile apps
- Backend or database

---

**Last Updated:** May 6, 2026  
**Version:** 5.0.0
