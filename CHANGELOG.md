# Changelog

All notable changes to ChessVision are documented here, grouped by month.

---

## July 2026

### Fixed

- **board:** piece SVGs that fail to load under resource pressure (cache eviction + failed re-fetch) now leave the square empty instead of rendering the raw piece key (`wB`, `bQ`…) as canvas text ([#201](https://github.com/chessvision-org/chess-vision/issues/201))

### Removed

- Semantic-release, versioning workflow, and release-announce workflow — the project ships as a web app with no npm publish or store submission, so automated tagging added noise without value. Monthly changelog entries replace per-commit releases.

---

## June 2026

### Added

- **pieces:** piece SVGs are now self-hosted under `public/piece/`; Lichess CDN dependency removed — faster loads, no external requests, no CORS or opaque-cache issues ([#160](https://github.com/chessvision-org/chess-vision/issues/160))
- **seo:** structured data (JSON-LD), per-page `<h1>` headings, and richer `<meta>` descriptions across all routes ([#156](https://github.com/chessvision-org/chess-vision/issues/156))
- **ui:** swipe gesture on the board theme preset strip — swipe left/right to cycle presets on touch devices ([#169](https://github.com/chessvision-org/chess-vision/issues/169))
- **ui:** shared `Pagination` component replacing per-page inline pager implementations
- **auth:** email/password sign-in with TOTP-based MFA via Supabase; no custom TOTP logic
- **sync:** cross-device cloud sync via Supabase with Row-Level Security — each account reads and writes only its own data
- **security:** `useSecurityCheck` enforces a 90-day re-verification window; fail-closed by default
- **db-search:** ChessDB added as a fourth database search provider alongside Lichess, PDB, and YACPDB
- **export:** Export Studio — `/export` route with a two-step wizard (Board Style → Export Settings) replacing the inline export panel
- **board:** `useEditorKeyboard` and `useBoardKeyboardNav` — keyboard-driven piece placement and square navigation with full ARIA support
- **pwa:** `vite-plugin-pwa` with Workbox caching; app is installable on desktop and mobile
- **a11y:** `describeBoardPosition` — screen-reader utility generating natural-language board state descriptions

### Changed

- Full migration to TypeScript 6 strict mode (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitAny`)
- Drag-and-drop migrated from `react-dnd` to `@dnd-kit/core` — ghost piece centers precisely on cursor; stale DOM connector leak fixed
- Routing — all pages use `React.lazy` + `Suspense` + `AnimatePresence`; new routes: `/export`, `/auth/*`
- Settings migrated from sidebar navigation to a tabbed layout
- All colors moved to Tailwind 4 CSS variables; no hardcoded hex in JSX
- Responsive editor rebuilt with a three-zone breakpoint system using `@container` queries
- FEN History redesigned with favorites deduplication, freshness indicators, and IntersectionObserver-driven infinite scroll
- Package manager locked to `pnpm@10.33.0`; Node.js requirement raised to `>=22.12.0`
- Deployed to Cloudflare Pages; GitHub Pages workflow removed

### Fixed

- **auth:** sign-up failures, display name persistence, and form-level sign-in error placement ([#176](https://github.com/chessvision-org/chess-vision/issues/176))
- **auth:** `name`/`id` attributes added to auth forms for password manager autofill
- **board:** in-flight piece fetches abort when piece style changes mid-load ([#154](https://github.com/chessvision-org/chess-vision/issues/154))
- **db-search:** all four database providers now return real results ([#170](https://github.com/chessvision-org/chess-vision/issues/170))
- **env:** Vite env vars read with dot notation so they survive the production build ([#173](https://github.com/chessvision-org/chess-vision/issues/173))
- **export:** frame rendering, coordinate placement, and quality-gating corrected
- **export:** canvas dimensions reset on render failure ([#193](https://github.com/chessvision-org/chess-vision/issues/193))
- **export:** right-side border no longer clips on mobile preview ([#200](https://github.com/chessvision-org/chess-vision/issues/200))
- **csp:** style-src hash auto-computed from `index.html` at build time; Cloudflare analytics beacon allowed
- **ui:** modals centered against `dvh` on mobile ([#133](https://github.com/chessvision-org/chess-vision/issues/133))
- **ui:** pagination dots no longer stretch in flex-col layouts ([#168](https://github.com/chessvision-org/chess-vision/issues/168))
- **prerender:** prerender-origin stripped from asset URLs in snapshots
- **share:** focus trap, Escape key, and piece-loading guard added to ShareDialog
- **a11y:** skip-link visible only on keyboard focus, not mouse or programmatic focus
- **db:** profiles and `user_security` rows backfilled for accounts created before the trigger was added

### Removed

- `react-dnd` — replaced by `@dnd-kit/core`
- `react-window` — replaced by IntersectionObserver-driven windowing
- Gemini Vision integration (`geminiVision`, `geminiKeyStorage`)
- Legacy SCSS module system — replaced by Tailwind 4 CSS variables

---

## May 2026

### Added

- GitHub Sponsors funding configuration
- GitHub Pages deployment workflow (later superseded by Cloudflare Pages)
- TypeScript app entry points and config (`src/index.tsx`, `src/App.tsx`, `tsconfig*.json`)
- `LayoutProvider` for centralized layout and navbar state
- `validateFEN` guards inside export functions
- Automated release workflow (`semantic-release`) — later removed in July 2026

### Changed

- Brand name standardized to **ChessVision** across all documentation and source
- `MAX_TOTAL_PRESETS` increased to allow more custom board themes
- Responsive layout updates to `HomePage`, `ChessEditor`, and `AdvancedFENInputPage`

### Fixed

- **storage:** app context, theme, FEN history, and export now read stored values through safe readers; direct `localStorage` reads blocked to prevent crashes on malformed data
- **canvas:** SVG export and raster export release their canvases after encoding, preventing GPU memory accumulation
- Touch device detection for DnD backend fallback
- `MAX_FEN_LENGTH` enforced on paste actions to prevent crash loops
- Drag layer `currentOffset` corrected so dragged pieces center under the cursor
- `AudioContext` lifecycle management to prevent sound distortion

### Removed

- Deprecated duplicate components: `DndProvider`, `CustomDragLayer`, `ChessEditor`, `FENInputList`, `BoardPreview`, `PieceSelector`, `PiecePalette`
- Standalone `fenParser.js` — logic centralized to `fenParser.ts`

---

## April 2026

### Fixed

- **Critical — export dimension bug:** board size selection (4 cm / 6 cm / 8 cm) now correctly determines pixel output across all quality tiers; previously the size selector had no effect on actual export dimensions
- Export module property names corrected: `baseSizeCm` → `physicalSizeCm`, `dpi` → `effectiveDPI`
- Coordinate label scaling made proportional to board pixel dimensions
- Circular export dependencies resolved

### Added

- **Dynamic board size scaling** — export pipeline maps physical size to pixel output across Print 8×, Print 16×, Social 24×, Max 32× tiers
- **Advanced FEN Editor** — `/advanced-fen` route for multi-position management, batch export, and slideshow playback
- **FEN History** — archive, favorites, freshness indicators (Fresh / Aging / Stale)
- **20 preset board themes** — Wood, Classic, Brown, Sand, Slate, Marble, Blue, Ocean, Green, Forest, Mint, Purple, Lavender, Red, Coral, Sunset, Pink, Burgundy, Custom 1, Custom 2
- **Custom color mixer** — independent light/dark square color controls via hue slider and saturation/lightness canvas
- **Help Center** — slide-in panel with searchable articles
- **Light/dark mode toggle** — persistent across sessions

---

## February 2026

### Added

- PWA manifest and service worker with offline-first caching (Workbox)
- PWA icons (192×192, 512×512, maskable) — app installable on desktop and mobile
- `React.lazy` code splitting for all pages
- `useIntersectionObserver` hook for lazy-rendering theme presets
- `useDebounce` and `useIdleCallback` hooks
- `NotFoundPage` (404) with home navigation
- Skip navigation link
- `ErrorBoundary` wrapping the full app
- ARIA `role="region"` + `aria-live="polite"` on `NotificationContainer`

### Changed

- `AdvancedFENInputModal` refactored to tab-based interface (Positions / Preview / Export)
- `ThemeModal` — piece preview key mapping and board preview rendering corrected; ARIA attributes added

### Fixed

- CSS performance optimizations and animation enhancements
- Tailwind CSS configuration expanded with custom colors, spacing, and typography

---

## January 2026

### Added

- Multi-FEN input (up to 10 positions)
- Color picker with HSL/RGB/HEX modes
- PNG and JPEG export with quality settings
- Board theme customization system
- Advanced FEN modal configuration with presets and storage keys
- CodeQL Advanced Security Analysis workflow
- CI pipeline for automated linting and formatting checks
- ESLint, Prettier, Husky, commitlint, lint-staged configuration
- `ErrorBoundary` component
- ARIA labels on `Modal`, `Button`, `ActionButtons`, `ChessBoard`
- Focus trap in `Modal`
- Centralized `logger.ts` and `errorHandler.ts`
- Sitemap, robots.txt, `.nvmrc`
- Community docs: `ARCHITECTURE.md`, `CHANGELOG.md`, `SECURITY.md`, `FAQ.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`

### Fixed

- Chess pieces missing in exported images
- JPEG export background rendering
- Responsive layout on small screens
- Board coordinate misalignment in display and export
- `console.log` statements replaced with `logger` utility
- Memory leaks from uncleaned `setTimeout` refs

### Changed

- `React.memo` optimizations
- Reduced bundle size
- Improved FEN validation error messages
- Board size handling migrated to centimeters for export and display calculations

---

## December 2025

### Initial release

- FEN notation support with validation
- Canvas-based board renderer
- 23 Lichess piece sets
- Board flip and coordinate toggle
- Custom light/dark square colors and pre-defined board themes
- Piece selector with previews
- PNG/JPEG export (400–1600 px)
- React 19 + Tailwind CSS
- `localStorage` for preferences

---

_© 2026 Khatai Huseynzada. AGPL-3.0 License._
