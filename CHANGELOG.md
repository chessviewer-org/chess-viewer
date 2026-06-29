# Changelog

All notable changes to ChessVision are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Known Gaps

- Keyboard shortcuts for board actions not yet implemented.

---

# [6.1.0](https://github.com/chessvision-org/chess-vision/compare/v6.0.0...v6.1.0) (2026-06-29)

### Bug Fixes

- **a11y:** show skip-link only on keyboard focus, not mouse/programmatic ([55892af](https://github.com/chessvision-org/chess-vision/commit/55892afef5c0b65c5bb0765ac98dbb194255fc3a))
- **auth:** add name/id attributes to sign-in and sign-up forms for password manager autofill ([4a71da8](https://github.com/chessvision-org/chess-vision/commit/4a71da864d2859238a39ae2c99fd5217285c648a))
- **auth:** fix signup email validation and mobile sidebar layout ([1e82d61](https://github.com/chessvision-org/chess-vision/commit/1e82d6175dcc37a8f7f506ca4e8f18860c537738))
- **auth:** resolve sign-up failures and display name persistence ([46430ab](https://github.com/chessvision-org/chess-vision/commit/46430ab5f7c70265fd02e1567e0093863211582e))
- **auth:** show sign-in failures at form level, not under the password ([#176](https://github.com/chessvision-org/chess-vision/issues/176)) ([7919c3e](https://github.com/chessvision-org/chess-vision/commit/7919c3ebb74aa7de234f8ba8d29a7d7d14662e02)), closes [#134](https://github.com/chessvision-org/chess-vision/issues/134)
- **board:** abort in-flight piece fetches when piece style changes ([#154](https://github.com/chessvision-org/chess-vision/issues/154)) ([cd8adb7](https://github.com/chessvision-org/chess-vision/commit/cd8adb7f29847085345037277870051301cc803a))
- **csp:** allow React inline styles and Cloudflare analytics beacon ([68a7f62](https://github.com/chessvision-org/chess-vision/commit/68a7f627340a3469f35a6cfa390690374d3b1afc))
- **csp:** allow React inline styles and Cloudflare analytics beacon ([f4d8b20](https://github.com/chessvision-org/chess-vision/commit/f4d8b203b7b6d014d7dbed142972df6bf7beba24))
- **csp:** auto-compute style-src hash from index.html at build time ([9b68ff0](https://github.com/chessvision-org/chess-vision/commit/9b68ff04da3108f8a1e878f15dabcfa40315523b))
- **db-search:** make all four databases return real results ([#170](https://github.com/chessvision-org/chess-vision/issues/170)) ([e5fdd31](https://github.com/chessvision-org/chess-vision/commit/e5fdd31ac8b5f5914538a65c90edebb1dc183ef3))
- **db:** backfill profiles and user_security for pre-trigger users ([e248049](https://github.com/chessvision-org/chess-vision/commit/e248049d403f65531a02e5cff3ea73a469ac16cc))
- **deploy:** add Cloudflare Pages \_redirects and \_headers ([72d731f](https://github.com/chessvision-org/chess-vision/commit/72d731fb23c86ae655b802b82012604a963ee2d0))
- **deploy:** add full security headers and CSP to Cloudflare Pages \_headers ([2b7c9e6](https://github.com/chessvision-org/chess-vision/commit/2b7c9e61314f77650c442f4f288b04107795f837))
- **deploy:** remove SPA fallback from \_redirects ([7d52f01](https://github.com/chessvision-org/chess-vision/commit/7d52f01fe9f3095d5892c435c704d6726c79082c))
- **env:** read Vite env vars with dot notation so they survive the build ([#173](https://github.com/chessvision-org/chess-vision/issues/173)) ([caa76ec](https://github.com/chessvision-org/chess-vision/commit/caa76ecb0f462d4e931f5a8bc9185f4010a64df4))
- **export:** fix frame rendering, coordinate placement, and quality-gating ([ba7380b](https://github.com/chessvision-org/chess-vision/commit/ba7380b4866b0696f8aef52453ac0518819cb760))
- **export:** prevent right-side border clipping on mobile preview ([#200](https://github.com/chessvision-org/chess-vision/issues/200)) ([ba6128d](https://github.com/chessvision-org/chess-vision/commit/ba6128d06bb6bfeab6db330d9ac8bbdfc5af9b9e))
- **export:** reset canvas dimensions on render failure ([#193](https://github.com/chessvision-org/chess-vision/issues/193)) ([b47b436](https://github.com/chessvision-org/chess-vision/commit/b47b436b974c3e8086c9e66504a98d763e545d44))
- **prerender:** strip prerender-origin from asset URLs in snapshots ([aac14ce](https://github.com/chessvision-org/chess-vision/commit/aac14ce1ce2735cd84857a6719dc8542d3f5e739))
- **seo:** redirect legacy URLs to current routes ([cc02270](https://github.com/chessvision-org/chess-vision/commit/cc0227042b72200276ec8b5c059b6000c99f30f0))
- **share:** add focus trap, Escape key, and piece-loading guard to ShareDialog ([27090e3](https://github.com/chessvision-org/chess-vision/commit/27090e3023ddf926734bccfa91ab5d39dae7c52b))
- **ui:** center modals against dvh on mobile ([#133](https://github.com/chessvision-org/chess-vision/issues/133)) ([1c45841](https://github.com/chessvision-org/chess-vision/commit/1c45841b64320a701e54ce8c07a4907dd96bd2f8))
- **ui:** pin pagination dot dimensions with inline styles to prevent flex-col stretch ([#168](https://github.com/chessvision-org/chess-vision/issues/168)) ([b170bb8](https://github.com/chessvision-org/chess-vision/commit/b170bb8de129642dffb93b275976f67733d5f9a5))

### Features

- **pieces:** self-host piece SVGs, drop Lichess CDN dependency ([#160](https://github.com/chessvision-org/chess-vision/issues/160)) ([1e89ef5](https://github.com/chessvision-org/chess-vision/commit/1e89ef511d3e376f4788fde997eebc46e06a2125))
- **seo:** add structured data, page headings, and richer metadata ([#156](https://github.com/chessvision-org/chess-vision/issues/156)) ([bf8bfda](https://github.com/chessvision-org/chess-vision/commit/bf8bfdac6229458d4e122d14117eb2ec698455c4))
- **ui:** add swipe gesture to board theme presets ([#169](https://github.com/chessvision-org/chess-vision/issues/169)) ([801d3ca](https://github.com/chessvision-org/chess-vision/commit/801d3cac65eb3cd64f6afa981819f5851500af38))
- **ui:** replace inline pagers with shared Pagination component ([09e1742](https://github.com/chessvision-org/chess-vision/commit/09e17423008843a79098f664111d8253ec108701))

### Reverts

- Revert "fix(csp): allow React inline styles and Cloudflare analytics beacon" ([f2886e8](https://github.com/chessvision-org/chess-vision/commit/f2886e86d27646c84697057765f9b4934c2b658a))

## [6.0.0] - 2026-06-23

### Added

- **Authentication** — Email/password sign-in with TOTP-based multi-factor authentication (Supabase TOTP; no custom TOTP logic).
- **Cloud sync** — User data synced across devices via Supabase. Privacy model: Row-Level Security scopes every row to its owner — one account cannot read another's data. No client-side encryption; RLS is the privacy boundary.
- **Security gate** — `useSecurityCheck` enforces a 90-day re-verification interval for privileged operations. Fail-closed by default.
- **Data migration** — Automatic localStorage → Supabase migration on first sign-in (`dataMigration.ts`).
- **Supabase RLS** — Row-Level Security active on all tables (`user_data`, `user_security`). `user_security.last_verified_at` writable only via `refresh_security_session` RPC.
- **SecurityLockModal** and **TwoFactorSetup** components.
- `syncStorage.ts` as the single approved KV interface for cloud-backed user data.
- **Drag-and-drop migration to @dnd-kit** — Replaced `react-dnd` with `@dnd-kit/core` throughout the board editor. Ghost piece now centers precisely on the cursor via a `snapCenterToCursor` modifier; `pointerWithin` collision strategy prevents off-by-one square drops.
- **ChessDB integration** — Added ChessDB as a fourth database search provider alongside Lichess, PDB, and YACPDB. Search results now surface from four independent sources simultaneously.
- **Dynamic OG image** — Supabase Edge Function (`og-image`) generates per-position Open Graph images from FEN. Custom FEN positions on the home page receive a unique preview image for social sharing.
- **Accent colour system** — Selectable accent colour presets (CSS variable tokens) with E2EE-synced persistence. Accent applies across focus rings, highlights, and interactive states without any hardcoded hex in JSX.
- **Profile & membership** — `ProfileContext` provides shared profile state app-wide. `profileService` exposes relational profile CRUD, supporter badge, and `supporter_until` column via `set_supporter_status` RPC.
- **Security activity log** — `SecurityEventsService` records auth events; the Security settings section surfaces last sign-in time and 2FA status.
- **Avatar URL editor & copyable user ID** — Account settings section allows updating avatar URL and copying the internal user identifier.
- **Per-category storage usage** — Settings Data Management section shows storage consumed per category with individual clear actions.
- **High-contrast preference** — Accessibility settings expose a high-contrast toggle persisted to cloud sync.
- **Color vision simulation** — `useColorVision` and `useContrast` hooks added for accessibility; contrast ratio calculation extracted to a standalone utility.
- **Keyboard navigation for the board** — `useEditorKeyboard` and `useBoardKeyboardNav` hooks implement keyboard-driven piece placement and square navigation with full ARIA support.
- **Page scroll keyboard hook** — Global keyboard handler (`usePageScrollKeys`) for accessibility-first scroll interactions.
- **PWA service worker** — `vite-plugin-pwa` integrated with Workbox caching rules; `registerSW.js` wired in `index.html`. App is installable on desktop and mobile.
- **Route prefetch registry** — `usePrefetchRoute` prefetches lazy page chunks on link hover/focus; `prefetchByPath` maps every route to its dynamic import factory.
- **Board preview canvas** — `BoardPreviewCanvas` component renders a static read-only board preview used on the Export page and AdvancedFEN wizard.
- **Export Studio** — `/export` route hosts a two-step wizard (Board Style → Export Settings) replacing the inline export panel. Preserves state across hard refresh via `sessionStorage`.
- **Smart Naming for batch export** — `parseSmartNaming` parses comma-separated names and bracket ranges (`Sicilian[1-4], Trap[5-6]`) to auto-assign per-position file names across a batch. Comprehensive `node:test` suite co-located.
- **`useEffectiveReducedMotion`** — Combines OS preference with the in-app reduced-motion toggle for animation decisions throughout the router and components.
- **`switch` UI primitive** — Accessible toggle Switch component added to `@shared/ui`.
- **`useFocusTrap` and `useListboxKeyboard`** — Reusable accessibility hooks for modal focus containment and listbox keyboard patterns.
- **DeveloperOptions page** — Hidden settings section exposing internal flags for development use.
- **Lichess-style brand loader** — Animated SVG logo fills bottom-to-top on a loop in the `PageLoader` Suspense fallback.
- **`describeBoardPosition`** — Screen-reader utility that generates a natural-language description of the current board state for assistive technology.
- **SCSS module system** — All component layout styles migrated from inline Tailwind to co-located `.module.scss` files with a shared `_variables.scss` / `_mixins.scss` system and container-query mixins.

### Changed

- Full codebase migration to TypeScript 6 strict mode (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitAny`).
- Canonical type definitions consolidated in `src/shared/types/` (`@app-types` alias).
- `MAX_FEN_LENGTH` confirmed at 93 characters in `src/shared/utils/validation.ts`.
- All colors moved to Tailwind 4 CSS variables in `src/index.css`; no hardcoded hex values in JSX.
- Package manager locked to `pnpm@10.33.0`. Node.js engine requirement raised to `>=22.12.0`.
- **Responsive editor layout overhaul** — Three-zone breakpoint system (`< 564px` single-column, `564–800px` tablet with commandbar top strip, `800–1024px` tablet with commandbar in panel, `≥ 1024px` desktop). Board height and panel height are kept pixel-identical at all side-by-side breakpoints via `align-items: stretch` + `justify-content: space-between`.
- **Tablet layout** — Database search moves to a full-width row below the board+panel pair on tablet. CommandBar becomes a full-width strip above both columns on small tablets (< 800px container) and moves into the right panel on large tablets.
- **Coordinate alignment fix** — Right panel receives `paddingBottom = cellSize × 8 × 0.05` when coordinates are active, aligning the Drop-to-Remove zone exactly with the bottom of the board squares regardless of viewport size.
- **AdvancedFEN Export Settings tab** — Board preview sticks to the top of the layout; only the settings panel scrolls. Desktop mode is fully 100 vh with no page-level overflow.
- **ExportPage refresh resilience** — Config is persisted to `sessionStorage` on navigation; hard refresh restores the export session instead of showing an empty state or redirecting.
- **FENHistoryPage favorites pagination** — `favoritesData` and `filteredFavorites` memoized with `useMemo`; `FENHistoryGrid` reset effect no longer fires on every re-render, fixing the broken "load more" on the Favorites tab.
- **Batch export file naming** — `sanitizeFileName` applied to every resolved name in both single-position and batch export paths. Empty `fileNamesInput` falls back to `Position-N` instead of producing nameless files in the ZIP.
- **`parseSmartNaming` fallback** — Out-of-range bracket ranges (e.g., `Game[5-8]` with 3 FENs) now fall back to the range's own base name (`Game-N`) rather than the generic `Position-N`.
- **Settings layout** — Migrated from sidebar navigation to a tabbed layout. Sections restructured: Appearance, Accessibility, Board, Account, Security, Data, Developer.
- **Navbar redesign** — Theme-coloured knight logo component (`Logo.tsx`). ThemeToggle extracted to a standalone navbar button. Mobile menu unifies profile block with supporter badge and donate link.
- **PageTabs component** — New reusable tab navigation used by Settings, ExportPage, AdvancedFEN, and FENHistory pages. Supports collapsible tab groups.
- **About page** — Split into modular section components (About, Privacy, Thanks, Changelog). Structured changelog data served from constants.
- **Accent focus rings** — Removed accent-coloured focus rings from `CustomSelect`, modal close button, notification actions, and `Switch`; replaced with muted borders for visual consistency.
- **`useEditorBoardSize`** — Board size derived from `ResizeObserver` on the container element. `cellSize` measured from the actual rendered `boardElementRef` so the drag ghost is pixel-identical to placed pieces at any viewport, including screens where `max-width` clamps the board below the container width.
- **Export quality tiers** — Quality presets corrected: Print 8×, Print 16×, Social 24×, Max 32×. Default changed to 2× for sensible out-of-box file sizes.
- **FEN History** — Redesigned with improved layout, favorites deduplication by board-field (most-recently-favorited first), freshness indicators, and infinite scroll via `IntersectionObserver` (replaces `react-window` virtualization).
- **`AuthPage`** — Auth flows (sign-in, sign-up, forgot password, MFA challenge) migrated to a dedicated `/auth/*` route subtree; modal-based auth removed.
- **Routing** — All pages use `React.lazy` + `Suspense` + `<AnimatedPage>` + `AnimatePresence`. New routes: `/export`, `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password`, `/auth/mfa`.
- **`safeJSONParse`** — Used at every `localStorage` / Supabase / edge-function read boundary. Direct `JSON.parse` on external data is forbidden.
- **Container queries** — Editor, palette, and layout breakpoints use `@container` queries on the workspace container instead of viewport media queries, so breakpoints track content width after the sidebar offsets.
- **PiecePalette** — Stacked view (White / Black groups, 6-column grid each) shown at all breakpoints. Flat single-row view removed.
- **Piece image cache** — `pieceImageCache.ts` is the single `HTMLImageElement` cache; `getPieceImageKey` generates stable lookup keys.
- **`logger.ts`** — Only approved logging interface; bare `console.*` removed from all production paths.
- **CI workflows** — CodeQL upgraded to Node 24 runtime. PR labeler rules updated. Danger check wired for PRs. `pnpm audit --audit-level=high` runs on every push.
- **nginx config** — CSP updated with `img-src blob:` and `worker-src blob:` directives. PWA routes (`/sw.js`, `/registerSW.js`) receive dedicated cache-control headers.
- **`esbuild` override** — Pinned to `>=0.28.1` to resolve advisory.

### Fixed

- **DnD connector ref leak** — `DraggablePiece`, `DroppableSquare`, and `TrashZone` now detach their react-dnd connectors on unmount, preventing stale DOM listener accumulation.
- **Worker canvas disposal** — SVG raster worker disposes the `OffscreenCanvas` and `ImageBitmap` on every exit path (success, error, cancel) to prevent Safari GPU memory exhaustion.
- **JPEG canvas disposal** — `exportRaster` releases the JPEG canvas on any failure during draw or blob conversion.
- **Export cancellation** — Pause and cancel signals are honoured between batch export items; worker task cancel handle registered so `cancelExport` correctly stops in-flight raster jobs.
- **SVG data URL escaping** — `svgExporter` escapes the data URL before embedding it in the SVG `<image href>` attribute.
- **DPI encoder overflow** — `dpiEncoder` clamps JPEG DPI to the 16-bit field range to prevent metadata corruption on high-DPI exports.
- **Duplicate MFA factor lookup** — Removed redundant factor lookup in `useSecurityUnlock` that caused a spurious second Supabase call.
- **`syncStorage` auth subscription** — Auth state subscription made idempotent and disposed on HMR to prevent duplicate listeners across hot reloads.
- **`dataMigration` empty-entry guard** — Cloud value tested directly (not its wrapper) so empty entries no longer block the first-login migration.
- **`usePieceImages` placeholder canvas** — Memory released after placeholder encoding; `useMemo` wrapper removed (was ineffective on object identity).
- **Security unlock fail-closed** — `useSecurityCheck` and `useSecurityUnlock` guard `getUser` and RPC calls; submitting state resets on failure.
- **`useHomeBoardState` memoization** — Return value memoized to preserve stable board reference and prevent DnD memo invalidation.
- **`FolderOpen` import** — Missing `FolderOpen` icon import in `CommandBar` resolved (`ReferenceError` on open-folder action).
- **Board overflow on narrow phones** — `useEditorBoardSize` prevents the board container from exceeding the viewport width on very narrow screens.
- **Export page empty state** — Visiting `/export` directly or after a hard refresh now shows a "Back to Editor" empty state instead of silently redirecting to `/`.
- **`useSecurityCheck` fail-closed default** — Defaults to `isLocked = true`; only unlocks on positive server confirmation via `refresh_security_session` RPC.

### Performance

- **`DroppableSquare` and `DraggablePiece` prop stabilization** — Props are referentially stable so `React.memo` prevents unnecessary re-renders across all 64 squares on every board interaction.
- **FEN history cap** — Active history list length capped to prevent unbounded memory growth.
- **`willReadFrequently`** — Canvas 2D context hint applied for repeated `getImageData` calls in the color picker.
- **Worker-based raster export** — SVG → PNG/JPEG conversion runs in an `OffscreenCanvas` Web Worker; main thread never blocks during high-resolution exports.
- **`useHomeBoardState` stable reference** — `useMemo` on the return object prevents the board from remounting on unrelated parent renders.

### Removed

- **`react-dnd`** — Replaced by `@dnd-kit/core`.
- **`react-window`** — Virtualization replaced by `IntersectionObserver`-driven windowing in `FENHistoryGrid`.
- **Gemini Vision** — `geminiVision` and `geminiKeyStorage` modules removed.
- **`ClipboardHistory` standalone component** — Inline clipboard history view integrated directly into `ChessEditor`.
- **`ThemeSubmenu`** — Replaced by standalone `ThemeToggle` button in the navbar.
- **`SupportPage`** and **`ToolPageHeader`** — Removed; support link folded into navbar dropdown.
- **`HelpCenterDrawer`** — Removed from production build.
- **Legacy SCSS modules** — Replaced by the new `*.module.scss` system.
- **Barrel index files** for `Navbar`, `Logo`, and `PageTabs` — Removed in favour of direct imports.
- **`SettingsSidebar`** — Replaced by tabbed settings layout.
- **`CONTRIBUTORS.md`** — Removed.
- **Accent theme hooks** — Replaced by the new CSS-variable accent system.
- **Intersection-observer and crypto utility re-exports** — Unused barrel re-exports cleaned up.

### Security

- `safeJSONParse` enforced at every external data boundary; prototype-poisoning keys (`__proto__`, `constructor`, `prototype`) stripped unconditionally.
- `MAX_FEN_LENGTH = 93` enforced before any parse — including FENs from URLs, shares, and paste actions.
- `useSecurityCheck` is fail-closed: defaults `isLocked = true`; only unlocks on confirmed RPC response.
- RLS remains ON for every Supabase table; `user_security.last_verified_at` writable only via `refresh_security_session` RPC.
- CSP allow-list updated for every new outbound host; `script-src` and `default-src` remain `'self'` with no `unsafe-inline` or `unsafe-eval`.
- `esbuild` advisory resolved via dependency override.

---

## [5.6.0] - 2026-05-31

### Added

- GitHub Sponsors funding configuration (`FUNDING.yml`).
- GitHub Pages deployment workflow; project migrated off Vercel (`vercel.json` removed).
- PGP public key published to the public directory for security contact.

### Changed

- Domain and contact migration: `robots.txt` crawl settings, Code of Conduct contact email, live-demo URLs across README, CONTRIBUTING, SECURITY, and the PR template updated to the new domain.
- Hardened CI security-audit job and extended Danger governance.

---

## [5.5.9] - 2026-05-27

### Fixed

- **Storage read hardening** — App context, theme, FEN history, and export now read stored values through safe readers; direct `localStorage` reads are blocked to prevent crashes on malformed data.
- FEN parser tests run through the stable bundle rather than an experimental loader.
- Release commits skip the pre-commit hook so automated `semantic-release` runs no longer fail.

### Changed

- Added enterprise governance infrastructure and expanded `CONTRIBUTING.md`.

---

## [5.5.6] - 2026-05-26

### Fixed

- **Canvas memory release** — SVG export and raster export release their canvases after encoding, preventing GPU memory accumulation.
- `no-console` lint rule enforced; TypeScript files added to ESLint coverage.

### Changed

- CodeQL scanning configuration resolved; CI actions bumped to v5/v7 (Node 24) with extended queries.
- Documentation audit: README, CONTRIBUTING, ARCHITECTURE, SECURITY, and ROADMAP aligned with the v5.5.x line; `MAX_FEN_LENGTH` corrected throughout.

---

## [5.5.1] - 2026-05-10

### Added

- Automated semantic-versioning release workflow (`semantic-release` + `.releaserc`).
- `RELEASES.md` documenting version history.
- SAST & logic review report with security findings.

### Changed

- Brand name standardized to **ChessVision** (one word) across all docs, templates, and source.

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
