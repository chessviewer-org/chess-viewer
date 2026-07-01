# Changelog

All notable changes to ChessVision are documented here, grouped by month.
Entries follow the [Conventional Commits](https://www.conventionalcommits.org)
categories — Features, Bug Fixes, Performance Improvements, and Reverts — each
linking back to the commit that introduced the change. There are no version tags;
`master` is always production and every month is a rolling release.

---

## June 2026

### Features

- **auth:** implement MFA/2FA flows with backup codes and enhanced security locking ([2244b1d](https://github.com/chessvision-org/chess-vision/commit/2244b1dc))
- **auth:** add membership and security-events services, and expose membership state in the profile context ([498e304](https://github.com/chessvision-org/chess-vision/commit/498e3045))
- **board:** add undo/redo history and keyboard navigation for the interactive board ([26847ee](https://github.com/chessvision-org/chess-vision/commit/26847eed))
- **board-style:** add a shared board-style module and board-style settings components ([95781e1](https://github.com/chessvision-org/chess-vision/commit/95781e1c))
- **database:** integrate the Lichess opening explorer for position search in the edge function and the frontend ([cfb9f5f](https://github.com/chessvision-org/chess-vision/commit/cfb9f5fd))
- **db-search:** add ChessDB as a fourth database provider in the frontend and the Supabase edge function ([6e92816](https://github.com/chessvision-org/chess-vision/commit/6e928161))
- **db-search:** add a dynamic `og-image` edge function generating per-position Open Graph images from FEN ([f711b01](https://github.com/chessvision-org/chess-vision/commit/f711b018))
- **editor:** enhance the board editor with a command bar, database search, board sharing, and improved keyboard controls ([ff0e317](https://github.com/chessvision-org/chess-vision/commit/ff0e3179))
- **fen:** redesign the FEN history page with an improved layout and favorites deduplication ([53434dd](https://github.com/chessvision-org/chess-vision/commit/53434dd9))
- **history:** implement cloud-sync budget truncation and storage merging ([f59fab1](https://github.com/chessvision-org/chess-vision/commit/f59fab1a))
- **navbar:** redesign the menu with a theme-coloured knight logo, profile header, supporter badge, and standalone theme toggle ([50ef418](https://github.com/chessvision-org/chess-vision/commit/50ef4182))
- **pwa:** register the service worker and add PWA type definitions ([c1908ba](https://github.com/chessvision-org/chess-vision/commit/c1908bae))
- **profile:** add relational profile CRUD, a shared `ProfileContext`, supporter status, and cloud profile seeding on first login ([d62a4fc](https://github.com/chessvision-org/chess-vision/commit/d62a4fc7))
- **responsive:** add an SCSS module system with mobile/tablet layouts and container-query breakpoints ([d01c4de](https://github.com/chessvision-org/chess-vision/commit/d01c4de8))
- **settings:** switch to a tabbed layout with appearance, board, account, security, accessibility, data, and developer sections ([f47b19c](https://github.com/chessvision-org/chess-vision/commit/f47b19c2))
- **settings:** add a DeveloperOptions page and show per-category storage usage with clear actions ([7647248](https://github.com/chessvision-org/chess-vision/commit/7647248b))
- **seo:** add structured data, page headings, and richer metadata ([bf8bfda](https://github.com/chessvision-org/chess-vision/commit/bf8bfda4)), closes [#156](https://github.com/chessvision-org/chess-vision/issues/156)
- **theme:** add selectable accent-colour presets with a light/dark mode resolver and E2EE-synced persistence ([61d5b78](https://github.com/chessvision-org/chess-vision/commit/61d5b78f))
- **theme:** apply the persisted accent on boot to prevent FOUC ([ba45346](https://github.com/chessvision-org/chess-vision/commit/ba453469))
- **dnd:** wire `DndContext`, sensors, and `DragOverlay` for the `@dnd-kit` migration ([b11c2f0](https://github.com/chessvision-org/chess-vision/commit/b11c2f06))
- **a11y:** add `describeBoardPosition` for screen-reader board modeling, `useFocusTrap`/`useListboxKeyboard`, reduced-motion, and keyboard navigation across UI, board, and `CustomSelect` ([778f18a](https://github.com/chessvision-org/chess-vision/commit/778f18a6))
- **about:** split the About page into modular sections with structured changelog data ([1c3bf2f](https://github.com/chessvision-org/chess-vision/commit/1c3bf2f6))
- **layout:** add a reusable `PageTabs` navigation and a `Switch` UI primitive ([57ed3e9](https://github.com/chessvision-org/chess-vision/commit/57ed3e9e))
- **pieces:** self-host piece SVGs and drop the Lichess CDN dependency ([1e89ef5](https://github.com/chessvision-org/chess-vision/commit/1e89ef51)), closes [#160](https://github.com/chessvision-org/chess-vision/issues/160)
- **ui:** add a swipe gesture to the board theme presets ([801d3ca](https://github.com/chessvision-org/chess-vision/commit/801d3cac)), closes [#169](https://github.com/chessvision-org/chess-vision/issues/169)
- **ui:** replace inline pagers with a shared `Pagination` component ([09e1742](https://github.com/chessvision-org/chess-vision/commit/09e17423))

### Bug Fixes

- **auth:** resolve sign-up failures and display-name persistence ([46430ab](https://github.com/chessvision-org/chess-vision/commit/46430ab5)), closes [#176](https://github.com/chessvision-org/chess-vision/issues/176)
- **auth:** show sign-in failures at form level, not under the password field ([7919c3e](https://github.com/chessvision-org/chess-vision/commit/7919c3eb)), closes [#176](https://github.com/chessvision-org/chess-vision/issues/176)
- **auth:** fix sign-up email validation and mobile sidebar layout ([1e82d61](https://github.com/chessvision-org/chess-vision/commit/1e82d617))
- **auth:** add `name`/`id` attributes to sign-in and sign-up forms for password-manager autofill ([4a71da8](https://github.com/chessvision-org/chess-vision/commit/4a71da86))
- **board:** abort in-flight piece fetches when the piece style changes ([cd8adb7](https://github.com/chessvision-org/chess-vision/commit/cd8adb7f)), closes [#154](https://github.com/chessvision-org/chess-vision/issues/154)
- **csp:** auto-compute the style-src hash from `index.html` at build time and allow the Cloudflare analytics beacon ([9b68ff0](https://github.com/chessvision-org/chess-vision/commit/9b68ff04))
- **db:** backfill `profiles` and `user_security` for accounts created before the trigger existed ([e248049](https://github.com/chessvision-org/chess-vision/commit/e248049d))
- **deploy:** add full security headers, CSP, and redirects for Cloudflare Pages ([2b7c9e6](https://github.com/chessvision-org/chess-vision/commit/2b7c9e61))
- **dnd:** detach the react-dnd drag/drop connectors on unmount in `DraggablePiece`, `DroppableSquare`, and `TrashZone` to stop node-ref leaks ([3184b49](https://github.com/chessvision-org/chess-vision/commit/3184b497))
- **dpiEncoder:** clamp JPEG DPI to the 16-bit range to prevent field overflow ([4d25a4c](https://github.com/chessvision-org/chess-vision/commit/4d25a4c2))
- **env:** read Vite env vars with dot notation so they survive the production build ([caa76ec](https://github.com/chessvision-org/chess-vision/commit/caa76ecb)), closes [#173](https://github.com/chessvision-org/chess-vision/issues/173)
- **export:** register the worker task cancel handle so `cancelExport` stops the raster worker, and honor pause/cancel between batch items ([f6074d3](https://github.com/chessvision-org/chess-vision/commit/f6074d3d))
- **export:** dispose the worker canvas and bitmap on every exit path; release the JPEG and placeholder canvases on any failure ([ded0a75](https://github.com/chessvision-org/chess-vision/commit/ded0a756))
- **export:** fix frame rendering, coordinate placement, and quality-gating ([ba7380b](https://github.com/chessvision-org/chess-vision/commit/ba7380b4))
- **export:** reset canvas dimensions on render failure ([b47b436](https://github.com/chessvision-org/chess-vision/commit/b47b436b)), closes [#193](https://github.com/chessvision-org/chess-vision/issues/193)
- **export:** prevent right-side border clipping on mobile preview ([ba6128d](https://github.com/chessvision-org/chess-vision/commit/ba6128d0)), closes [#200](https://github.com/chessvision-org/chess-vision/issues/200)
- **prerender:** strip the prerender origin from asset URLs in snapshots ([aac14ce](https://github.com/chessvision-org/chess-vision/commit/aac14ce1))
- **share:** add a focus trap, Escape key, and a piece-loading guard to `ShareDialog` ([27090e3](https://github.com/chessvision-org/chess-vision/commit/27090e30))
- **svgExporter:** escape the data URL before embedding it in the SVG `image` href ([68141b0](https://github.com/chessvision-org/chess-vision/commit/68141b09))
- **syncStorage:** make the auth subscription idempotent and dispose it on HMR ([94946c1](https://github.com/chessvision-org/chess-vision/commit/94946c16))
- **useEditorBoardSize:** prevent board overflow on narrow phone screens ([29d4b99](https://github.com/chessvision-org/chess-vision/commit/29d4b997))
- **useSecurityCheck:** guard unlock against `getUser`/RPC failures to stay fail-closed ([be910a1](https://github.com/chessvision-org/chess-vision/commit/be910a1b))
- **a11y:** show the skip-link only on keyboard focus, not on mouse or programmatic focus ([55892af](https://github.com/chessvision-org/chess-vision/commit/55892afe))
- **ui:** center modals against `dvh` on mobile ([1c45841](https://github.com/chessvision-org/chess-vision/commit/1c45841b)), closes [#133](https://github.com/chessvision-org/chess-vision/issues/133)
- **ui:** pin pagination dot dimensions so they no longer stretch in flex-col layouts ([b170bb8](https://github.com/chessvision-org/chess-vision/commit/b170bb8d)), closes [#168](https://github.com/chessvision-org/chess-vision/issues/168)
- **db-search:** make all four database providers return real results ([e5fdd31](https://github.com/chessvision-org/chess-vision/commit/e5fdd31a)), closes [#170](https://github.com/chessvision-org/chess-vision/issues/170)

### Performance Improvements

- **board:** stabilise `DraggablePiece` and `DroppableSquare` props and update the board canvas hook to preserve 64-square memoization ([e03941d](https://github.com/chessvision-org/chess-vision/commit/e03941d1))
- **FENHistory:** virtualize the history grid, then move to IntersectionObserver-driven infinite scroll, and cap the active-history length to bound DOM size and memory ([3bd8bbd](https://github.com/chessvision-org/chess-vision/commit/3bd8bbd5))
- **useHomeBoardState:** memoize the return so a stable board reference preserves DnD memoization ([b96d737](https://github.com/chessvision-org/chess-vision/commit/b96d7372))
- **canvas:** improve piece-image cache-key handling ([9ab0578](https://github.com/chessvision-org/chess-vision/commit/9ab05782))
- Add a route-prefetch registry and optimize history persistence with worker-based raster export ([fbb14b1](https://github.com/chessvision-org/chess-vision/commit/fbb14b19))

---

## May 2026

### Features

- **auth:** email/password sign-in and sign-up, TOTP two-factor setup, MFA verification, `SecurityLockModal`, and the fail-closed `useSecurityCheck` hook via Supabase ([b2e0bdd](https://github.com/chessvision-org/chess-vision/commit/b2e0bdd6))
- **auth:** lazy-loaded security lock and `useAuth` wired through an `AuthProvider` ([10713bb](https://github.com/chessvision-org/chess-vision/commit/10713bb4))
- **sync:** `useSupabaseSync` background synchronization with `syncStorage` as the single owner-scoped KV door to `user_data` ([fa6a442](https://github.com/chessvision-org/chess-vision/commit/fa6a442d))
- **db:** add the `user_data` and `user_security` tables with Row-Level Security and owner-scoped policies ([0ca4a7f](https://github.com/chessvision-org/chess-vision/commit/0ca4a7f4))
- **db-search:** chess-problem database integration with server-side lookup, a Supabase edge function, and a manual search panel ([c6c9830](https://github.com/chessvision-org/chess-vision/commit/c6c98300))
- **export:** singleton SVG rasterization Web Worker for asynchronous off-thread PNG/JPEG conversion ([1e4939b](https://github.com/chessvision-org/chess-vision/commit/1e4939b7))
- **export:** `dpiEncoder` for writing DPI metadata into PNG/JPEG blobs, plus progressive chunked export ([6087292](https://github.com/chessvision-org/chess-vision/commit/6087292a))
- **export:** Export Studio wizard — visual-setup and export-settings steps with smart batch file naming ([d6e42cb](https://github.com/chessvision-org/chess-vision/commit/d6e42cb7))
- **fen:** typed FEN parser and detailed validation with specific error messages, plus `useDebouncedFENValidation` ([238c1b0](https://github.com/chessvision-org/chess-vision/commit/238c1b04))
- **fen:** favorite-FEN toolbar action ([05c7a11](https://github.com/chessvision-org/chess-vision/commit/05c7a11a))
- **board:** memoized `BoardGrid` and `BoardSquare` with optimized props-equality comparison ([30a27a9](https://github.com/chessvision-org/chess-vision/commit/30a27a92))
- **editor:** interactive DnD board — `ChessEditor`, `InteractiveBoard`, `DraggablePiece`, `DroppableSquare`, `PiecePalette`, `TrashZone`, and `CustomDragLayer` ([9ae2a97](https://github.com/chessvision-org/chess-vision/commit/9ae2a979))
- **CommandBar:** copy, share, open, and download actions for the editor ([52600d3](https://github.com/chessvision-org/chess-vision/commit/52600d3f))
- **homepage:** replace the settings sidebar with a quick theme popover ([65f2b87](https://github.com/chessvision-org/chess-vision/commit/65f2b87f))
- **theme:** custom theme presets, `useThemeCustomization`, and dedicated mixer/preset panels ([27036bf](https://github.com/chessvision-org/chess-vision/commit/27036bf7))
- **utils:** centralize the color-conversion, coordinate, archive-management, history, validation, and logger utilities behind a single barrel ([a57a763](https://github.com/chessvision-org/chess-vision/commit/a57a7630))
- Migrate the whole codebase to TypeScript — app entry points, config, canonical `@app-types`, and typed components/hooks throughout ([87b44d1](https://github.com/chessvision-org/chess-vision/commit/87b44d15))
- Add Docker multi-stage build, `docker-compose`, and initial nginx configuration for serving the app ([e0371fd](https://github.com/chessvision-org/chess-vision/commit/e0371fd0))
- **usePrefetchRoute:** lazy-page loading with route prefetch on hover/focus ([1f6451b](https://github.com/chessvision-org/chess-vision/commit/1f6451b3))
- Add `LayoutContext` for navbar state and `KnightIcon` with a glass-filling hover effect ([6e9b88c](https://github.com/chessvision-org/chess-vision/commit/6e9b88cc))

### Bug Fixes

- **advanced-fen:** enforce FEN length limits, allow clearing the input, and add `maxLength` to the position fields ([2dd9ba3](https://github.com/chessvision-org/chess-vision/commit/2dd9ba3b))
- **canvas:** throw on an empty board-parse result and prevent zero dimensions in `createUltraQualityCanvas` ([681e063](https://github.com/chessvision-org/chess-vision/commit/681e0638))
- **csp:** remove `'unsafe-inline'` from the Content-Security-Policy and correct the `img-src` value ([13f7caa](https://github.com/chessvision-org/chess-vision/commit/13f7caa3))
- **dnd:** fix touch-device detection to restore `HTML5Backend` on desktop and tune `delayTouchStart` ([5c42474](https://github.com/chessvision-org/chess-vision/commit/5c424743))
- **drag-layer:** use `currentOffset` centered on the cursor for the drag preview ([cdc1b84](https://github.com/chessvision-org/chess-vision/commit/cdc1b849))
- **export:** add a `validateFEN` guard before PNG/JPEG/clipboard export ([f6d7348](https://github.com/chessvision-org/chess-vision/commit/f6d73488))
- **export:** correct the quality-preset tiers and default export resolution ([ed07ec1](https://github.com/chessvision-org/chess-vision/commit/ed07ec19))
- **fen:** enforce `MAX_FEN_LENGTH` in `getFENValidationError` and set the correct limit ([16b9ac9](https://github.com/chessvision-org/chess-vision/commit/16b9ac9b))
- **optimizer:** replace the hardcoded 16384 canvas cap with UA-aware detection ([d3bc51f](https://github.com/chessvision-org/chess-vision/commit/d3bc51f3))
- **security:** enhance the security-check logic, harden abort handling, and improve MFA error handling in `useSecurityCheck` ([b71fcb7](https://github.com/chessvision-org/chess-vision/commit/b71fcb74))
- **syncStorage:** handle missing data and decryption errors gracefully ([52572ac](https://github.com/chessvision-org/chess-vision/commit/52572ac6))
- Clean up canvas dimensions on unmount to prevent memory leaks ([dfd3362](https://github.com/chessvision-org/chess-vision/commit/dfd3362c))
- Rename the project throughout from _FENForsty Pro_ to _ChessVision_ across source, docs, manifest, and metadata ([3ce88c3](https://github.com/chessvision-org/chess-vision/commit/3ce88c3d))

### Performance Improvements

- **board:** drive the export bitmap from the observed container width ([76a732d](https://github.com/chessvision-org/chess-vision/commit/76a732d8))
- **useInteractiveBoard:** memoize the return value for a stable board reference ([23d543c](https://github.com/chessvision-org/chess-vision/commit/23d543c6))

---

## April 2026

### Features

- Dynamic board-size scaling — the export pipeline maps physical size to pixel output across Print 8×, Print 16×, Social 24×, and Max 32× tiers ([508b4fe](https://github.com/chessvision-org/chess-vision/commit/508b4fe0))

### Bug Fixes

- **export:** improve export sizing and drag-preview behaviour and polish the export flow and settings ([a164c67](https://github.com/chessvision-org/chess-vision/commit/a164c673))
- **audio:** manage the `AudioContext` lifecycle to prevent sound distortion ([4032208](https://github.com/chessvision-org/chess-vision/commit/4032208f))
- **board:** optimize the `arePropsEqual` comparison in `BoardGrid` for cheaper 64-square diffing ([72e54d9](https://github.com/chessvision-org/chess-vision/commit/72e54d98))
- **canvas:** add the `willReadFrequently` option to the canvas context for faster repeated reads ([33d0629](https://github.com/chessvision-org/chess-vision/commit/33d0629f))
- **fen-history:** improve persistence and cleanup of the FEN history store ([10ab14d](https://github.com/chessvision-org/chess-vision/commit/10ab14de))
- **piece-images:** switch piece-image handling to a ref to avoid needless re-renders ([63cc39c](https://github.com/chessvision-org/chess-vision/commit/63cc39cc))
- **a11y:** improve piece alt text on `BoardSquare` for screen readers ([c6a3884](https://github.com/chessvision-org/chess-vision/commit/c6a38842))
- Reformat the documentation and source for consistent whitespace and table formatting ([0a09ed1](https://github.com/chessvision-org/chess-vision/commit/0a09ed14))

---

## March 2026

### Features

- **advanced-fen:** the Advanced FEN Input page with multi-position management, playback controls, and a positions tab ([0d7a3bb](https://github.com/chessvision-org/chess-vision/commit/0d7a3bb7))
- **export:** SVG export for the chess board and high-resolution canvas rendering with customizable options ([25337e6](https://github.com/chessvision-org/chess-vision/commit/25337e68))
- **export:** `BoardSizeControl`, `ExportOptionsDialog`, `ExportProgress`, and `ExportSettings` components ([92b919c](https://github.com/chessvision-org/chess-vision/commit/92b919cb))
- **theme:** `ThemeCustomization` with preset cards, a color-picker panel, and duplicate-combination warnings ([f25f198](https://github.com/chessvision-org/chess-vision/commit/f25f198e))
- **history:** `HistoryFilters` and `StatusBadge` for filtering by search, status, source, and favorites ([71ac6df](https://github.com/chessvision-org/chess-vision/commit/71ac6dfe))
- **routing:** page-transition animations with `AnimatePresence` ([0c24da7](https://github.com/chessvision-org/chess-vision/commit/0c24da73))
- **utils:** hex/RGB/HSL/HSV color-conversion utilities as the single colour-math source ([9ad1b93](https://github.com/chessvision-org/chess-vision/commit/9ad1b93b))

### Bug Fixes

- **security:** address multiple vulnerabilities from recent audits and harden the security headers ([d7b8976](https://github.com/chessvision-org/chess-vision/commit/d7b8976a))
- **color-picker:** correct canvas coordinate calculations for accurate color picking ([e8beb00](https://github.com/chessvision-org/chess-vision/commit/e8beb00e))
- **editor:** improve `BOARD_SIZE_EXPR` responsiveness and adjust the `ChessEditor` layout ([f83b2c6](https://github.com/chessvision-org/chess-vision/commit/f83b2c65))
- **layout:** prevent horizontal overflow in the main application layout ([8185717](https://github.com/chessvision-org/chess-vision/commit/81857176))

---

## February 2026

### Features

- **pwa:** `manifest.json`, favicon, PWA icons, and install support ([2b376b1](https://github.com/chessvision-org/chess-vision/commit/2b376b1c))
- **routing:** lazy-loaded routes with `Suspense` and a `NotFoundPage` (404) ([a611500](https://github.com/chessvision-org/chess-vision/commit/a611500e))
- **hooks:** `useIntersectionObserver` for lazy rendering, plus `useDebounce` and `useIdleCallback` ([2d44170](https://github.com/chessvision-org/chess-vision/commit/2d44170c))
- **settings:** `SettingsPage` with Theme and Export customization tabs ([4141139](https://github.com/chessvision-org/chess-vision/commit/41411395))
- **fen:** `FENBatchContext` for managing FEN batch operations with localStorage persistence ([72d2eba](https://github.com/chessvision-org/chess-vision/commit/72d2eba9))
- **help:** `HelpCenterDrawer` with content sections and search ([7cd24d0](https://github.com/chessvision-org/chess-vision/commit/7cd24d02))
- **theme:** `ThemeModal` preview with corrected board and piece-preview rendering ([fe6751e](https://github.com/chessvision-org/chess-vision/commit/fe6751e6))
- **tailwind:** expand the config with custom colors, spacing, animations, and typography ([e34b635](https://github.com/chessvision-org/chess-vision/commit/e34b6351))
- **a11y:** a skip-navigation link and accessibility improvements across `Modal`, `Input`, `Select`, `Checkbox`, and `NotificationContainer` ([1447ee9](https://github.com/chessvision-org/chess-vision/commit/1447ee91))

### Bug Fixes

- **board:** optimize `BoardGrid` memoization and refactor `useChessBoard` to use memoization for stability ([4605373](https://github.com/chessvision-org/chess-vision/commit/46053736))
- **build:** replace `.eslintrc.js` with `eslint.config.js` and refine the webpack alias configuration ([7d165e8](https://github.com/chessvision-org/chess-vision/commit/7d165e8a))
- **ci:** remove `main`-branch references, upgrade the Node.js version, and improve dependency caching ([19e959f](https://github.com/chessvision-org/chess-vision/commit/19e959f6))
- **context:** re-export `useFENBatch` and `useThemeSettings` from the hooks barrel and fix import ordering ([c1eb0f5](https://github.com/chessvision-org/chess-vision/commit/c1eb0f55))

---

## January 2026

### Features

- **error-handling:** a centralized error-handling utility and an `ErrorBoundary` wrapping the full app ([685cbd9](https://github.com/chessvision-org/chess-vision/commit/685cbd99))
- **logging:** a centralized `logger` utility wired through the export functions ([c860052](https://github.com/chessvision-org/chess-vision/commit/c860052a))
- **theme:** `ThemeSettingsContext` for managing theme settings and recent colors ([ab11d23](https://github.com/chessvision-org/chess-vision/commit/ab11d237))
- **fen:** `FENInputList`/`FENInputRow` for managing multiple positions and the tab-based `AdvancedFENInputModal` ([6e8da00](https://github.com/chessvision-org/chess-vision/commit/6e8da00f))
- **ci:** a CodeQL Advanced Security Analysis workflow and a lint/format CI pipeline ([bdc2e40](https://github.com/chessvision-org/chess-vision/commit/bdc2e408))
- **tooling:** ESLint configuration, `.editorconfig`, `.nvmrc`, and VSCode recommendations ([af718e0](https://github.com/chessvision-org/chess-vision/commit/af718e01))
- **seo:** `robots.txt` and `sitemap.xml` for indexing and crawl control ([679a4cb](https://github.com/chessvision-org/chess-vision/commit/679a4cb2))
- **docs:** a contributing guide and enhanced bug-report / feature-request templates ([070068e](https://github.com/chessvision-org/chess-vision/commit/070068ed))

### Bug Fixes

- Fix responsive layout issues and the JPEG export background ([4b9e522](https://github.com/chessvision-org/chess-vision/commit/4b9e5227))
- **fen:** ensure valid FEN handling and improve board-rendering logic ([1da56e6](https://github.com/chessvision-org/chess-vision/commit/1da56e68))
- **fen-parser:** resolve parser syntax errors ([5791919](https://github.com/chessvision-org/chess-vision/commit/579191eb))
- **theme:** fix `ThemeModal` re-rendering on color changes and the board-readiness check in `ThemeMainView` ([d7372da](https://github.com/chessvision-org/chess-vision/commit/d7372dad))
- Remove unused imports and correct `useEffect` dependencies for ESLint ([5e36f22](https://github.com/chessvision-org/chess-vision/commit/5e36f22f))

---

## December 2025

### Features

- **pieces:** initial `PIECE_SETS` data for the 23 Lichess piece sets ([2bc139c](https://github.com/chessvision-org/chess-vision/commit/2bc139cf))

Initial release — FEN notation support with validation, a canvas-based board
renderer, board flip and coordinate toggle, custom light/dark square colors and
predefined board themes, a piece selector with previews, PNG/JPEG export
(400–1600 px), and `localStorage` for preferences, built on React 19 and Tailwind
CSS.

---

_© 2026 Khatai Huseynzada. AGPL-3.0 License._
