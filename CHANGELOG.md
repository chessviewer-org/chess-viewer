# Changelog

All notable changes to ChessVision are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Known Gaps

- Keyboard shortcuts for board actions not yet implemented.

---

## [6.0.0] - 2026-05-23

### Added

- **Authentication** — Email/password sign-in with TOTP-based multi-factor authentication (Supabase TOTP; no custom TOTP logic).
- **Cloud sync** — User data synced across devices via Supabase. Privacy model: Row-Level Security scopes every row to its owner — one account cannot read another's data. No client-side encryption; RLS is the privacy boundary.
- **Security gate** — `useSecurityCheck` enforces a 90-day re-verification interval for privileged operations. Fail-closed by default.
- **Data migration** — Automatic localStorage → Supabase migration on first sign-in (`dataMigration.ts`).
- **Supabase RLS** — Row-Level Security active on all tables (`user_data`, `user_security`). `user_security.last_verified_at` writable only via `refresh_security_session` RPC.
- **SecurityLockModal** and **TwoFactorSetup** components.
- `syncStorage.ts` as the single approved KV interface for cloud-backed user data.

### Changed

- Full codebase migration to TypeScript 6 strict mode (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitAny`).
- Canonical type definitions consolidated in `src/shared/types/` (`@app-types` alias).
- `MAX_FEN_LENGTH` confirmed at 93 characters in `src/shared/utils/validation.ts`.
- All colors moved to Tailwind 4 CSS variables in `src/index.css`; no hardcoded hex values in JSX.
- Package manager locked to `pnpm@10.33.0`. Node.js engine requirement raised to `>=22.12.0`.

---

## [5.5.0] - 2026-05-09

### Added

- TypeScript app entry points and config (`src/index.tsx`, `src/App.tsx`, `tsconfig*.json`, `vite-env.d.ts`).
- `LayoutProvider` for centralized layout and navbar state management.

### Changed

- Refactored application entry point logic for better state flow.

### Removed

- Deprecated duplicate components: `DndProvider`, `CustomDragLayer`, `ChessEditor`, `FENInputList`, `BoardPreview`, `PieceSelector`, `PiecePalette`.
- Standalone `fenParser.js` (logic centralized to `fenParser.ts`).

---

## [5.4.0] - 2026-05-07

### Added

- Theme editing and customization flows with apply/cancel in `SettingsPage`.

### Changed

- Responsive layout updates to `HomePage`, `ChessEditor`, and `AdvancedFENInputPage`.
- UX animations and transitions across `Navbar`, `Toast`, and `HelpCenterDrawer`.

---

## [5.3.0] - 2026-05-07

### Added

- `validateFEN` guards inside export functions to prevent exporting corrupted FEN states.

### Fixed

- Touch device detection for DnD backend fallback to `HTML5Backend` on desktops.
- `MAX_FEN_LENGTH` enforced on paste actions to prevent crash loops.
- Drag layer `currentOffset` calculation corrected so dragged pieces center under the cursor.

### Performance

- Piece image rendering optimized via `useRef` to skip unnecessary re-renders.
- `willReadFrequently` flag added to canvas context.

---

## [5.2.0] - 2026-05-06

### Changed

- `MAX_TOTAL_PRESETS` increased to allow saving more custom board themes.
- Route definitions and internal component spacing reformatted for consistency.

---

## [5.1.0] - 2026-05-04

### Changed

- Documentation formatting and whitespace consistency across `ARCHITECTURE.md`, `FAQ.md`.
- Git commit message linting and pre-commit hooks standardized to `pnpm`.
- `Navbar` layout updated to accept right-slot properties natively.

---

## [5.0.15] - 2026-05-04

### Fixed

- Series of Dependabot dependency bumps (`globals`, `lucide-react`, `postcss`, `@commitlint/cli`).
- `AudioContext` lifecycle management to prevent sound distortion.
- `DraggablePiece` z-index positioning during active drag interactions.

---

## [5.0.0] - 2026-04-17

### Fixed

- **Critical — Export dimension bug:** Board size selection (4 cm / 6 cm / 8 cm) now correctly determines pixel output across all quality tiers. Previously, the size selector had no effect on actual export dimensions.
- Export module property names corrected: `baseSizeCm` → `physicalSizeCm`, `dpi` → `effectiveDPI`.
- Coordinate label scaling made proportional to board pixel dimensions.
- Circular export dependencies resolved across component index files.
- React build errors from component export patterns fixed.

### Added

- **Dynamic board size scaling** — Export pipeline maps physical size to pixel output across all four quality tiers: Print 8×, Print 16×, Social 24×, Max 32×.
- **Advanced FEN Editor** — `/advanced-fen` route for multi-position management, batch export (PNG, JPEG, SVG), and slideshow playback.
- **FEN History archive** — Positions can be moved from Active to Archive. Archived items show a Reactivate button.
- **FEN History freshness indicators** — Fresh / Aging / Stale labels with timestamps per entry.
- **20 preset board themes** — Wood, Classic, Brown, Sand, Slate, Marble, Blue, Ocean, Green, Forest, Mint, Purple, Lavender, Red, Coral, Sunset, Pink, Burgundy, Custom 1, Custom 2.
- **Custom color mixer** — Independent light/dark square color controls via hue slider and saturation/lightness canvas.
- **Export Customization page** — Board size selector, file name input, Print/Social quality tier selection.
- **Help Center** — Slide-in panel with searchable articles.
- **Light/dark mode toggle** — Persistent across sessions.

### Changed

- Piece Palette redesigned with WHITE and BLACK section headers.
- All markdown documentation rewritten without emoji decorations.
- Export dimension calculation extracted into a dedicated scaling utility.

---

## [4.0.0] - 2026-02-02

### Added

- PWA manifest and service worker with offline-first caching (Workbox).
- PWA icons (192×192, 512×512, maskable).
- Installable on desktop and mobile.

---

## [3.5.4] - 2026-02-01

### Fixed

- `ThemeModal` — piece preview key mapping, board preview rendering.
- ARIA attributes added to `ThemeModal` (`role="dialog"`, `aria-modal`, `aria-labelledby`, tab pattern).
- `ThemePresetButton` — descriptive `aria-label`.

### Added

- `React.lazy` code splitting for all pages.
- `useIntersectionObserver` hook for lazy rendering theme presets.
- `useDebounce` and `useIdleCallback` hooks.
- `NotFoundPage` (404) with home navigation.
- Skip navigation link in `App.tsx`.
- `ErrorBoundary` wrapping the full app.
- `role="region"` + `aria-live="polite"` on `NotificationContainer`.

### Changed

- `AdvancedFENInputModal` refactored to tab-based interface (Positions / Preview / Export).
- Modal size reduced from `max-w-6xl` to `max-w-2xl`.

---

## [3.5.3] - 2026-01-23

### Fixed

- Git merge conflicts in `HueSlider.jsx` and `colorUtils.js`.
- All ESLint warnings (unused variables, array index keys).
- `AdvancedFENInputModal` props — now correctly receives `lightSquare`/`darkSquare`.

---

## [3.5.2] - 2026-01-18

### Fixed

- `console.log`/error statements replaced with `logger` utility.
- Memory leaks from uncleaned `setTimeout` refs.
- Board coordinate misalignment in display and export.

### Added

- `ErrorBoundary` component.
- ARIA labels on `Modal`, `Button`, `ActionButtons`, `ChessBoard`.
- Focus trap in `Modal` component.
- Centralized `logger.ts` and `errorHandler.ts` utilities.

---

## [3.5.1] - 2026-01-04

### Fixed

- Chess pieces missing in exported images.
- JPEG export background rendering.
- Responsive layout on small screens.

### Added

- `ARCHITECTURE.md`, `CHANGELOG.md`, `SECURITY.md`, `FAQ.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`.

---

## [3.5.0] - 2026-01-03

### Added

- Multi-FEN input (up to 10 positions).
- Color picker with HSL/RGB/HEX modes.

### Changed

- `React.memo` optimizations.
- Reduced bundle size.
- Improved FEN validation error messages.

---

## [3.0.0] - 2026-01-02

### Added

- PNG and JPEG export with quality settings.
- Board theme customization system.

---

## [2.0.0] - 2025-12-29

### Added

- Custom light/dark square colors.
- Pre-defined board themes.
- Piece selector with previews.

---

## [1.0.0] - 2025-12-28

### Initial Release

- FEN notation support with validation.
- Canvas-based board renderer.
- 23 piece sets.
- Board flip and coordinate toggle.
- PNG/JPEG export (400–1600 px).
- React 19.x + Tailwind CSS.
- localStorage for preferences.

---

## Version Support

| Version | Status        | Security Updates |
| ------- | ------------- | ---------------- |
| v6.x    | Active        | Yes              |
| v5.x    | Critical only | Yes              |
| < v5.0  | Unsupported   | No               |

---

_Last updated: June 2026_  
_© 2026 Khatai Huseynzada. AGPL-3.0 License._
