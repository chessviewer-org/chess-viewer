# Changelog

All notable changes to ChessVision are documented here, grouped by month.
Entries follow the [Conventional Commits](https://www.conventionalcommits.org)
categories — Features, Bug Fixes, Performance Improvements, and Reverts — each
linking back to the commit that introduced the change. There are no version tags;
`master` is always production and every complete month is a rolling release.

---

## June 2026

### Features

- **auth:** implement MFA/2FA flows with backup codes and enhanced security locking ([#2244b1d](https://github.com/chessvision-org/chess-vision/commit/2244b1dc))
- **auth:** add membership and security-events services, and expose membership state in the profile context ([#498e304](https://github.com/chessvision-org/chess-vision/commit/498e3045))
- **profile:** add relational profile CRUD, a shared `ProfileContext`, supporter status, and cloud profile seeding on first login ([#d62a4fc](https://github.com/chessvision-org/chess-vision/commit/d62a4fc7))
- **profile:** wire `ProfileProvider` at the app root and add the `useProfile` consumer hook ([#53d3b69](https://github.com/chessvision-org/chess-vision/commit/53d3b693))
- **schema:** add the `supporter_until` column and the `set_supporter_status` RPC ([#141da04](https://github.com/chessvision-org/chess-vision/commit/141da04b))
- **board:** add undo/redo history for the interactive board ([#26847ee](https://github.com/chessvision-org/chess-vision/commit/26847eed))
- **board:** integrate keyboard navigation into the board ([#945b47a](https://github.com/chessvision-org/chess-vision/commit/945b47a5))
- **board-style:** add a shared board-style module and board-style settings components ([#95781e1](https://github.com/chessvision-org/chess-vision/commit/95781e1c))
- **database:** integrate the Lichess opening explorer for position search in the edge function and the frontend ([#cfb9f5f](https://github.com/chessvision-org/chess-vision/commit/cfb9f5fd))
- **db-search:** add ChessDB as a fourth database provider in the frontend and the Supabase edge function ([#6e92816](https://github.com/chessvision-org/chess-vision/commit/6e928161))
- **db-search:** add a dynamic `og-image` edge function generating per-position Open Graph images from FEN ([#f711b01](https://github.com/chessvision-org/chess-vision/commit/f711b018))
- **editor:** enhance the board editor with a command bar, database search, board sharing, and improved keyboard controls ([#ff0e317](https://github.com/chessvision-org/chess-vision/commit/ff0e3179))
- **editor:** add keyboard shortcuts, gemini vision scanning, and board sharing ([#34c8335](https://github.com/chessvision-org/chess-vision/commit/34c83351))
- **fen:** redesign the FEN history page with an improved layout and favorites deduplication ([#53434dd](https://github.com/chessvision-org/chess-vision/commit/53434dd9))
- **history:** implement cloud-sync budget truncation and storage merging ([#f59fab1](https://github.com/chessvision-org/chess-vision/commit/f59fab1a))
- **navbar:** redesign the menu with a theme-coloured knight logo, profile header, supporter badge, and standalone theme toggle ([#50ef418](https://github.com/chessvision-org/chess-vision/commit/50ef4182))
- **pwa:** register the service worker and add PWA type definitions ([#c1908ba](https://github.com/chessvision-org/chess-vision/commit/c1908bae))
- **responsive:** add an SCSS module system with mobile/tablet layouts and container-query breakpoints ([#d01c4de](https://github.com/chessvision-org/chess-vision/commit/d01c4de8))
- **settings:** switch to a tabbed layout with appearance, board, account, security, accessibility, data, and developer sections ([#f47b19c](https://github.com/chessvision-org/chess-vision/commit/f47b19c2))
- **settings:** add a DeveloperOptions page ([#7647248](https://github.com/chessvision-org/chess-vision/commit/7647248b))
- **settings:** add appearance, board-preferences, and accessibility sections with a high-contrast preference ([#0a003f5](https://github.com/chessvision-org/chess-vision/commit/0a003f54))
- **settings:** show per-category storage usage with clear actions ([#625f2e5](https://github.com/chessvision-org/chess-vision/commit/625f2e50))
- **account:** add an avatar-URL editor and a copyable user ID ([#b0bf799](https://github.com/chessvision-org/chess-vision/commit/b0bf7999))
- **security:** add a two-factor status and last-sign-in overview ([#0a290b0](https://github.com/chessvision-org/chess-vision/commit/0a290b0a))
- **seo:** add structured data, page headings, and richer metadata ([#bf8bfda](https://github.com/chessvision-org/chess-vision/commit/bf8bfda4)), closes [#156](https://github.com/chessvision-org/chess-vision/issues/156)
- **theme:** add selectable accent-colour presets with a light/dark mode resolver and E2EE-synced persistence ([#61d5b78](https://github.com/chessvision-org/chess-vision/commit/61d5b78f))
- **theme:** apply the persisted accent on boot to prevent FOUC ([#ba45346](https://github.com/chessvision-org/chess-vision/commit/ba453469))
- **dnd:** wire `DndContext`, sensors, and `DragOverlay` for the `@dnd-kit` migration ([#b11c2f0](https://github.com/chessvision-org/chess-vision/commit/b11c2f06))
- **a11y:** add `describeBoardPosition` for screen-reader board modeling ([#778f18a](https://github.com/chessvision-org/chess-vision/commit/778f18a6))
- **a11y:** add `useFocusTrap`, `useListboxKeyboard`, reduced-motion, and page-scroll keyboard hooks, and keyboard navigation across UI and `CustomSelect` ([#3e0e1fd](https://github.com/chessvision-org/chess-vision/commit/3e0e1fd0))
- **a11y:** add color-vision simulation and contrast tools, and an accessibility settings section ([#db99b76](https://github.com/chessvision-org/chess-vision/commit/db99b76c))
- **about:** split the About page into modular sections with structured changelog data ([#1c3bf2f](https://github.com/chessvision-org/chess-vision/commit/1c3bf2f6))
- **layout:** add a reusable `PageTabs` navigation ([#57ed3e9](https://github.com/chessvision-org/chess-vision/commit/57ed3e9e))
- **ui:** add a `Switch` primitive and export the UI primitives barrel ([#13e1757](https://github.com/chessvision-org/chess-vision/commit/13e17572))
- **pieces:** self-host piece SVGs and drop the Lichess CDN dependency ([#1e89ef5](https://github.com/chessvision-org/chess-vision/commit/1e89ef51)), closes [#160](https://github.com/chessvision-org/chess-vision/issues/160)
- **ui:** add a swipe gesture to the board theme presets ([#801d3ca](https://github.com/chessvision-org/chess-vision/commit/801d3cac)), closes [#169](https://github.com/chessvision-org/chess-vision/issues/169)
- **ui:** replace inline pagers with a shared `Pagination` component ([#09e1742](https://github.com/chessvision-org/chess-vision/commit/09e17423))

### Bug Fixes

- **auth:** resolve sign-up failures and display-name persistence ([#46430ab](https://github.com/chessvision-org/chess-vision/commit/46430ab5)), closes [#176](https://github.com/chessvision-org/chess-vision/issues/176)
- **auth:** show sign-in failures at form level, not under the password field ([#7919c3e](https://github.com/chessvision-org/chess-vision/commit/7919c3eb)), closes [#176](https://github.com/chessvision-org/chess-vision/issues/176)
- **auth:** fix sign-up email validation and mobile sidebar layout ([#1e82d61](https://github.com/chessvision-org/chess-vision/commit/1e82d617))
- **auth:** add `name`/`id` attributes to sign-in and sign-up forms for password-manager autofill ([#4a71da8](https://github.com/chessvision-org/chess-vision/commit/4a71da86))
- **auth:** remove a duplicate MFA factor lookup in security unlock ([#a0baea8](https://github.com/chessvision-org/chess-vision/commit/a0baea8b))
- **board:** abort in-flight piece fetches when the piece style changes ([#cd8adb7](https://github.com/chessvision-org/chess-vision/commit/cd8adb7f)), closes [#154](https://github.com/chessvision-org/chess-vision/issues/154)
- **csp:** auto-compute the style-src hash from `index.html` at build time and allow the Cloudflare analytics beacon ([#9b68ff0](https://github.com/chessvision-org/chess-vision/commit/9b68ff04))
- **db:** backfill `profiles` and `user_security` for accounts created before the trigger existed ([#e248049](https://github.com/chessvision-org/chess-vision/commit/e248049d))
- **deploy:** add full security headers, CSP, and redirects for Cloudflare Pages ([#2b7c9e6](https://github.com/chessvision-org/chess-vision/commit/2b7c9e61))
- **dnd:** detach the react-dnd drag/drop connectors on unmount in `DraggablePiece`, `DroppableSquare`, and `TrashZone` to stop node-ref leaks ([#3184b49](https://github.com/chessvision-org/chess-vision/commit/3184b497))
- **dpiEncoder:** clamp JPEG DPI to the 16-bit range to prevent field overflow ([#4d25a4c](https://github.com/chessvision-org/chess-vision/commit/4d25a4c2))
- **env:** read Vite env vars with dot notation so they survive the production build ([#caa76ec](https://github.com/chessvision-org/chess-vision/commit/caa76ecb)), closes [#173](https://github.com/chessvision-org/chess-vision/issues/173)
- **export:** register the worker task cancel handle so `cancelExport` stops the raster worker, and honor pause/cancel between batch items ([#f6074d3](https://github.com/chessvision-org/chess-vision/commit/f6074d3d))
- **export:** dispose the worker canvas and bitmap on every exit path; release the JPEG and placeholder canvases on any failure ([#ded0a75](https://github.com/chessvision-org/chess-vision/commit/ded0a756))
- **export:** fix frame rendering, coordinate placement, and quality-gating ([#ba7380b](https://github.com/chessvision-org/chess-vision/commit/ba7380b4))
- **export:** reset canvas dimensions on render failure ([#b47b436](https://github.com/chessvision-org/chess-vision/commit/b47b436b)), closes [#193](https://github.com/chessvision-org/chess-vision/issues/193)
- **export:** prevent right-side border clipping on mobile preview ([#ba6128d](https://github.com/chessvision-org/chess-vision/commit/ba6128d0)), closes [#200](https://github.com/chessvision-org/chess-vision/issues/200)
- **prerender:** strip the prerender origin from asset URLs in snapshots ([#aac14ce](https://github.com/chessvision-org/chess-vision/commit/aac14ce1))
- **seo:** redirect legacy URLs to current routes ([#cc02270](https://github.com/chessvision-org/chess-vision/commit/cc022704))
- **share:** add a focus trap, Escape key, and a piece-loading guard to `ShareDialog` ([#27090e3](https://github.com/chessvision-org/chess-vision/commit/27090e30))
- **svgExporter:** escape the data URL before embedding it in the SVG `image` href ([#68141b0](https://github.com/chessvision-org/chess-vision/commit/68141b09))
- **svgPieceLoader:** fall back to a placeholder data URL when canvas conversion fails ([#8a105f1](https://github.com/chessvision-org/chess-vision/commit/8a105f18))
- **syncStorage:** make the auth subscription idempotent and dispose it on HMR ([#94946c1](https://github.com/chessvision-org/chess-vision/commit/94946c16))
- **dataMigration:** test the cloud value not the wrapper so empty entries do not block migration ([#2f6ad36](https://github.com/chessvision-org/chess-vision/commit/2f6ad36e))
- **ui:** harden the error boundary ([#3a32273](https://github.com/chessvision-org/chess-vision/commit/3a32273b))
- **useEditorBoardSize:** prevent board overflow on narrow phone screens ([#29d4b99](https://github.com/chessvision-org/chess-vision/commit/29d4b997))
- **useSecurityCheck:** guard unlock against `getUser`/RPC failures to stay fail-closed ([#be910a1](https://github.com/chessvision-org/chess-vision/commit/be910a1b))
- **a11y:** show the skip-link only on keyboard focus, not on mouse or programmatic focus ([#55892af](https://github.com/chessvision-org/chess-vision/commit/55892afe))
- **ui:** center modals against `dvh` on mobile ([#1c45841](https://github.com/chessvision-org/chess-vision/commit/1c45841b)), closes [#133](https://github.com/chessvision-org/chess-vision/issues/133)
- **ui:** pin pagination dot dimensions so they no longer stretch in flex-col layouts ([#b170bb8](https://github.com/chessvision-org/chess-vision/commit/b170bb8d)), closes [#168](https://github.com/chessvision-org/chess-vision/issues/168)
- **db-search:** make all four database providers return real results ([#e5fdd31](https://github.com/chessvision-org/chess-vision/commit/e5fdd31a)), closes [#170](https://github.com/chessvision-org/chess-vision/issues/170)

### Performance Improvements

- **board:** stabilise `DraggablePiece` and `DroppableSquare` props and update the board canvas hook to preserve 64-square memoization ([#e03941d](https://github.com/chessvision-org/chess-vision/commit/e03941d1))
- **FENHistory:** virtualize the history grid, then move to IntersectionObserver-driven infinite scroll, and cap the active-history length to bound DOM size and memory ([#3bd8bbd](https://github.com/chessvision-org/chess-vision/commit/3bd8bbd5))
- **useHomeBoardState:** memoize the return so a stable board reference preserves DnD memoization ([#b96d737](https://github.com/chessvision-org/chess-vision/commit/b96d7372))
- **canvas:** improve piece-image cache-key handling ([#9ab0578](https://github.com/chessvision-org/chess-vision/commit/9ab05782))
- **routing:** add a route-prefetch registry and optimize history persistence with worker-based raster export ([#fbb14b1](https://github.com/chessvision-org/chess-vision/commit/fbb14b19))

---

## May 2026

### Features

- **auth:** email/password sign-in and sign-up, TOTP two-factor setup, MFA verification, `SecurityLockModal`, and the fail-closed `useSecurityCheck` hook via Supabase ([#b2e0bdd](https://github.com/chessvision-org/chess-vision/commit/b2e0bdd6))
- **auth:** lazy-loaded security lock and `useAuth` wired through an `AuthProvider` ([#10713bb](https://github.com/chessvision-org/chess-vision/commit/10713bb4))
- **auth:** add the auth module barrel (components, hooks, services, types) ([#d04842c](https://github.com/chessvision-org/chess-vision/commit/d04842cc))
- **sync:** `useSupabaseSync` background synchronization with `syncStorage` as the single owner-scoped KV door to `user_data` ([#fa6a442](https://github.com/chessvision-org/chess-vision/commit/fa6a442d))
- **db:** add the `user_data` and `user_security` tables with Row-Level Security and owner-scoped policies ([#0ca4a7f](https://github.com/chessvision-org/chess-vision/commit/0ca4a7f4))
- **db-search:** chess-problem database integration with server-side lookup, a Supabase edge function, and a manual search panel ([#c6c9830](https://github.com/chessvision-org/chess-vision/commit/c6c98300))
- **db-search:** add the `useDatabaseSearch` manual-search hook ([#a5b2efd](https://github.com/chessvision-org/chess-vision/commit/a5b2efd1))
- **export:** singleton SVG rasterization Web Worker for asynchronous off-thread PNG/JPEG conversion ([#1e4939b](https://github.com/chessvision-org/chess-vision/commit/1e4939b7))
- **export:** `dpiEncoder` for writing DPI metadata into PNG/JPEG blobs, plus progressive chunked export ([#6087292](https://github.com/chessvision-org/chess-vision/commit/6087292a))
- **export:** Export Studio wizard — visual-setup and export-settings steps with smart batch file naming ([#d6e42cb](https://github.com/chessvision-org/chess-vision/commit/d6e42cb7))
- **export:** add `svgPieceLoader` to load and cache piece images as data URLs ([#527b646](https://github.com/chessvision-org/chess-vision/commit/527b646c))
- **fen:** typed FEN parser and detailed validation with specific error messages, plus `useDebouncedFENValidation` ([#238c1b0](https://github.com/chessvision-org/chess-vision/commit/238c1b04))
- **fen:** favorite-FEN toolbar action ([#05c7a11](https://github.com/chessvision-org/chess-vision/commit/05c7a11a))
- **fen:** `FENHistoryPage` for managing FEN history with filtering and archiving ([#d5bff0d](https://github.com/chessvision-org/chess-vision/commit/d5bff0d5))
- **export:** `parseSmartNaming` to auto-name batch positions from comma-separated names and bracket ranges ([#b07312a](https://github.com/chessvision-org/chess-vision/commit/b07312a2))
- **home:** build the `HomePage` with inline export and performance optimizations ([#4223dd9](https://github.com/chessvision-org/chess-vision/commit/4223dd93))
- **board:** memoized `BoardGrid` and `BoardSquare` with optimized props-equality comparison ([#30a27a9](https://github.com/chessvision-org/chess-vision/commit/30a27a92))
- **editor:** interactive DnD board — `ChessEditor`, `InteractiveBoard`, `DraggablePiece`, `DroppableSquare`, `PiecePalette`, `TrashZone`, and `CustomDragLayer` ([#9ae2a97](https://github.com/chessvision-org/chess-vision/commit/9ae2a979))
- **CommandBar:** copy, share, open, and download actions for the editor ([#52600d3](https://github.com/chessvision-org/chess-vision/commit/52600d3f))
- **homepage:** replace the settings sidebar with a quick theme popover ([#65f2b87](https://github.com/chessvision-org/chess-vision/commit/65f2b87f))
- **theme:** custom theme presets, `useThemeCustomization`, and dedicated mixer/preset panels ([#27036bf](https://github.com/chessvision-org/chess-vision/commit/27036bf7))
- **utils:** centralize the color-conversion, coordinate, archive-management, history, validation, and logger utilities behind a single barrel ([#a57a763](https://github.com/chessvision-org/chess-vision/commit/a57a7630))
- **hooks:** add `useCanvasPicker` for hue-saturation-value color picking and `useColorConversion` ([#4831562](https://github.com/chessvision-org/chess-vision/commit/4831562b))
- **ts:** migrate the whole codebase to TypeScript — app entry points, config, canonical `@app-types`, and typed components/hooks throughout ([#87b44d1](https://github.com/chessvision-org/chess-vision/commit/87b44d15))
- **docker:** add a multi-stage build, `docker-compose`, and initial nginx configuration for serving the app ([#e0371fd](https://github.com/chessvision-org/chess-vision/commit/e0371fd0))
- **routing:** lazy-page loading with route prefetch on hover/focus ([#1f6451b](https://github.com/chessvision-org/chess-vision/commit/1f6451b3))
- **ui:** add `KnightIcon` with a glass-filling hover effect and chess-piece entrance animations ([#6e9b88c](https://github.com/chessvision-org/chess-vision/commit/6e9b88cc))
- **layout:** add `LayoutContext` for navbar right-slot state ([#62c8483](https://github.com/chessvision-org/chess-vision/commit/62c84833))

### Bug Fixes

- **advanced-fen:** enforce FEN length limits, allow clearing the input, and add `maxLength` to the position fields ([#2dd9ba3](https://github.com/chessvision-org/chess-vision/commit/2dd9ba3b))
- **canvas:** throw on an empty board-parse result and prevent zero dimensions in `createUltraQualityCanvas` ([#681e063](https://github.com/chessvision-org/chess-vision/commit/681e0638))
- **csp:** remove `'unsafe-inline'` from the Content-Security-Policy and correct the `img-src` value ([#13f7caa](https://github.com/chessvision-org/chess-vision/commit/13f7caa3))
- **dnd:** fix touch-device detection to restore `HTML5Backend` on desktop and tune `delayTouchStart` ([#5c42474](https://github.com/chessvision-org/chess-vision/commit/5c424743))
- **drag-layer:** use `currentOffset` centered on the cursor for the drag preview ([#cdc1b84](https://github.com/chessvision-org/chess-vision/commit/cdc1b849))
- **export:** add a `validateFEN` guard before PNG/JPEG/clipboard export ([#f6d7348](https://github.com/chessvision-org/chess-vision/commit/f6d73488))
- **export:** correct the quality-preset tiers and default export resolution ([#ed07ec1](https://github.com/chessvision-org/chess-vision/commit/ed07ec19))
- **fen:** enforce `MAX_FEN_LENGTH` in `getFENValidationError` and set the correct limit ([#16b9ac9](https://github.com/chessvision-org/chess-vision/commit/16b9ac9b))
- **optimizer:** replace the hardcoded 16384 canvas cap with UA-aware detection ([#d3bc51f](https://github.com/chessvision-org/chess-vision/commit/d3bc51f3))
- **security:** enhance the security-check logic, harden abort handling, and improve MFA error handling in `useSecurityCheck` ([#b71fcb7](https://github.com/chessvision-org/chess-vision/commit/b71fcb74))
- **syncStorage:** handle missing data and decryption errors gracefully ([#52572ac](https://github.com/chessvision-org/chess-vision/commit/52572ac6))
- **memory:** clean up canvas dimensions on unmount to prevent memory leaks ([#dfd3362](https://github.com/chessvision-org/chess-vision/commit/dfd3362c))

### Performance Improvements

- **board:** drive the export bitmap from the observed container width ([#76a732d](https://github.com/chessvision-org/chess-vision/commit/76a732d8))
- **useInteractiveBoard:** memoize the return value for a stable board reference ([#23d543c](https://github.com/chessvision-org/chess-vision/commit/23d543c6))

---

## April 2026

### Features

- **export:** dynamic board-size scaling — the pipeline maps physical size to pixel output across Print 8×, Print 16×, Social 24×, and Max 32× tiers ([#508b4fe](https://github.com/chessvision-org/chess-vision/commit/508b4fe0))
- **build:** migrate the package manager to `pnpm@10.33.0` with a workspace config and raise the pinned versions ([#14d82b3](https://github.com/chessvision-org/chess-vision/commit/14d82b3f))

### Bug Fixes

- **export:** improve export sizing, drag-preview behaviour, and polish the export flow and settings ([#a164c67](https://github.com/chessvision-org/chess-vision/commit/a164c673))
- **audio:** manage the `AudioContext` lifecycle to prevent sound distortion ([#4032208](https://github.com/chessvision-org/chess-vision/commit/4032208f))
- **board:** optimize the `arePropsEqual` comparison in `BoardGrid` for cheaper 64-square diffing ([#72e54d9](https://github.com/chessvision-org/chess-vision/commit/72e54d98))
- **canvas:** add the `willReadFrequently` option to the canvas context for faster repeated reads ([#33d0629](https://github.com/chessvision-org/chess-vision/commit/33d0629f))
- **canvas:** optimize canvas resizing and rendering in `ChessBoard` ([#da96c90](https://github.com/chessvision-org/chess-vision/commit/da96c90c))
- **fen-history:** improve persistence and cleanup of the FEN history store ([#10ab14d](https://github.com/chessvision-org/chess-vision/commit/10ab14de))
- **piece-images:** switch piece-image handling to a ref to avoid needless re-renders ([#63cc39c](https://github.com/chessvision-org/chess-vision/commit/63cc39cc))
- **drag-layer:** update z-index handling in `DraggablePiece` for reliable drag visibility ([#862a8c7](https://github.com/chessvision-org/chess-vision/commit/862a8c70))
- **theme:** optimize theme-history management in `applyTheme` and `applyCustomTheme` ([#67a8365](https://github.com/chessvision-org/chess-vision/commit/67a8365d))
- **a11y:** improve piece alt text on `BoardSquare` for screen readers ([#c6a3884](https://github.com/chessvision-org/chess-vision/commit/c6a38842))
- **modal:** update the `Modal` structure for improved accessibility and animation handling ([#dec6c39](https://github.com/chessvision-org/chess-vision/commit/dec6c39f))
- **perf:** improve the font-loading strategy in `index.html` ([#9dff17e](https://github.com/chessvision-org/chess-vision/commit/9dff17e5))
- **layout:** prevent horizontal overflow and refine responsive layout in `ChessEditor`, `PiecePalette`, and `HomePage` ([#8fe0626](https://github.com/chessvision-org/chess-vision/commit/8fe0626f))
- **docs:** fix table formatting and whitespace across the documentation and source ([#0a09ed1](https://github.com/chessvision-org/chess-vision/commit/0a09ed14))

---

## March 2026

### Features

- **advanced-fen:** the Advanced FEN Input page with FEN management, playback controls, a positions tab, and a quick-actions panel ([#0d7a3bb](https://github.com/chessvision-org/chess-vision/commit/0d7a3bb7))
- **export:** SVG export for the chess board and high-resolution canvas rendering with customizable options ([#25337e6](https://github.com/chessvision-org/chess-vision/commit/25337e68))
- **export:** `BoardSizeControl`, `ExportOptionsDialog`, `ExportProgress`, and `ExportSettings` components ([#53c8dd7](https://github.com/chessvision-org/chess-vision/commit/53c8dd74))
- **theme:** `ThemeCustomization` with preset cards, a color-picker panel, an add-preset card, and duplicate-combination warnings ([#f25f198](https://github.com/chessvision-org/chess-vision/commit/f25f198e))
- **theme:** `ThemeSelector` and theme-customization constants for board themes ([#7f46049](https://github.com/chessvision-org/chess-vision/commit/7f460491))
- **fen:** `FENInputField`, `FENInputList`, and `PieceSelector` with clipboard, validation, and favorite handling ([#8c2a9ab](https://github.com/chessvision-org/chess-vision/commit/8c2a9abb))
- **history:** `HistoryFilters`, `StatusBadge`, and a `ConfirmationModal` for filtering by search, status, source, and favorites ([#71ac6df](https://github.com/chessvision-org/chess-vision/commit/71ac6dfe))
- **layout:** add a `ToolPageHeader` for full-screen tool pages ([#680dd47](https://github.com/chessvision-org/chess-vision/commit/680dd478))
- **routing:** page-transition animations with `AnimatePresence` and app-wide UI motion polish ([#0c24da7](https://github.com/chessvision-org/chess-vision/commit/0c24da73))
- **utils:** hex/RGB/HSL/HSV color-conversion utilities as the single colour-math source ([#9ad1b93](https://github.com/chessvision-org/chess-vision/commit/9ad1b93b))
- **theme:** a preload-cleanup and theme-initialization script to manage user theme preferences without FOUC ([#cc97398](https://github.com/chessvision-org/chess-vision/commit/cc97398e))

### Bug Fixes

- **security:** address multiple vulnerabilities from recent audits and harden the security headers ([#d7b8976](https://github.com/chessvision-org/chess-vision/commit/d7b8976a))
- **color-picker:** correct canvas coordinate calculations for accurate color picking ([#e8beb00](https://github.com/chessvision-org/chess-vision/commit/e8beb00e))
- **editor:** improve `BOARD_SIZE_EXPR` responsiveness and adjust the `ChessEditor` layout ([#f83b2c6](https://github.com/chessvision-org/chess-vision/commit/f83b2c65))
- **layout:** prevent horizontal overflow in the main application layout ([#8185717](https://github.com/chessvision-org/chess-vision/commit/81857176))
- **scroll:** adjust overflow properties for better scrolling and add a shrink-width animation ([#827f3ec](https://github.com/chessvision-org/chess-vision/commit/827f3ec9))

### Performance Improvements

- **board:** simplify `arePropsEqual` and clean up `BoardGrid`/`BoardSquare` memoization ([#99d9613](https://github.com/chessvision-org/chess-vision/commit/99d9613f))
- **utils:** simplify FEN parsing, coordinate calculation, and image-optimization helpers ([#77610a6](https://github.com/chessvision-org/chess-vision/commit/77610a6f))

---

## February 2026

### Features

- **tailwind:** expand the config with custom colors, spacing, animations, and typography, and enhance the CSS structure ([#e34b635](https://github.com/chessvision-org/chess-vision/commit/e34b6351))
- **ui:** accessibility and unique-ID handling across `Button`, `Input`, `Select`, `Checkbox`, `Modal`, `PickerModal`, and `NotificationContainer` ([#5df7d38](https://github.com/chessvision-org/chess-vision/commit/5df7d388))
- **theme:** `ThemeModal` preview with corrected board and piece-preview rendering, and a refactored `ThemeSettingsView` ([#fe6751e](https://github.com/chessvision-org/chess-vision/commit/fe6751e6))
- **routing:** lazy-loaded routes with `Suspense`, performance utilities, and a `NotFoundPage` (404) ([#a611500](https://github.com/chessvision-org/chess-vision/commit/a611500e))
- **hooks:** `useIntersectionObserver` for lazy rendering, plus `useDebounce` and `useIdleCallback` ([#2d44170](https://github.com/chessvision-org/chess-vision/commit/2d44170c))
- **a11y:** add a skip-navigation link and adjust the main-content structure ([#1447ee9](https://github.com/chessvision-org/chess-vision/commit/1447ee91))
- **pwa:** `manifest.json`, favicon, logo images, and install support ([#2b376b1](https://github.com/chessvision-org/chess-vision/commit/2b376b1c))
- **settings:** `SettingsPage` with Theme and Export customization tabs ([#4141139](https://github.com/chessvision-org/chess-vision/commit/41411395))
- **about:** an About page with clearer content and layout ([#c309292](https://github.com/chessvision-org/chess-vision/commit/c309292b))
- **fen:** `FENBatchContext` for managing FEN batch operations with localStorage persistence ([#72d2eba](https://github.com/chessvision-org/chess-vision/commit/72d2eba9))
- **advanced-fen:** context-based FEN management on the Advanced FEN Input page, wired through a `FENBatchProvider` ([#8da1af8](https://github.com/chessvision-org/chess-vision/commit/8da1af8d))
- **fen:** clipboard history and favorites in `FENInputField`, plus board utility functions ([#3a7aa91](https://github.com/chessvision-org/chess-vision/commit/3a7aa91d))
- **help:** `HelpCenterDrawer` with content sections and search, and a `ClipboardHistory` panel ([#7cd24d0](https://github.com/chessvision-org/chess-vision/commit/7cd24d02))
- **export:** a thin-frame display option and print styles for clean high-resolution output ([#df881d1](https://github.com/chessvision-org/chess-vision/commit/df881d1c))
- **build:** migrate the build from webpack to Vite and switch the package manager toward pnpm ([#25c7cab](https://github.com/chessvision-org/chess-vision/commit/25c7cabf))
- **ui:** add the UI-primitives component set ([#f0fc39d](https://github.com/chessvision-org/chess-vision/commit/f0fc39d5))

### Bug Fixes

- **board:** optimize `BoardGrid` memoization and refactor `useChessBoard` to use memoization for stability ([#4605373](https://github.com/chessvision-org/chess-vision/commit/46053736))
- **build:** replace `.eslintrc.js` with `eslint.config.js` and refine the webpack/Vite alias configuration ([#7d165e8](https://github.com/chessvision-org/chess-vision/commit/7d165e8a))
- **ci:** remove `main`-branch references, upgrade Node.js, migrate CI to pnpm, and improve dependency caching ([#19e959f](https://github.com/chessvision-org/chess-vision/commit/19e959f6))
- **context:** re-export `useFENBatch` and `useThemeSettings` from the hooks barrel and fix import ordering ([#c1eb0f5](https://github.com/chessvision-org/chess-vision/commit/c1eb0f55))
- **theme:** optimize theme toggling and stabilise FEN-history references ([#55e35da](https://github.com/chessvision-org/chess-vision/commit/55e35da7))

---

## January 2026

### Features

- **theme:** rework the color-picker architecture and unify the theme system ([#adf9fa4](https://github.com/chessvision-org/chess-vision/commit/adf9fa4c))
- **error-handling:** a centralized error-handling utility and an `ErrorBoundary` wrapping the full app ([#685cbd9](https://github.com/chessvision-org/chess-vision/commit/685cbd99))
- **logging:** a centralized `logger` utility wired through the export functions ([#c860052](https://github.com/chessvision-org/chess-vision/commit/c860052a))
- **theme:** `ThemeSettingsContext` for managing theme settings and recent colors ([#ab11d23](https://github.com/chessvision-org/chess-vision/commit/ab11d237))
- **fen:** tab-based `AdvancedFENInputModal` UI, `FENInputList`/`FENInputRow`, a live `BoardPreview`, and modal presets/storage keys ([#f54eed4](https://github.com/chessvision-org/chess-vision/commit/f54eed41))
- **editor:** pass piece style and theme colors down to the `ControlPanel` children ([#5de745b](https://github.com/chessvision-org/chess-vision/commit/5de745b6))
- **fen:** migrate board-size handling to centimeters for export and display calculations ([#d47354a](https://github.com/chessvision-org/chess-vision/commit/d47354a3))
- **ci:** a CodeQL Advanced Security Analysis workflow and a lint/format CI pipeline ([#bdc2e40](https://github.com/chessvision-org/chess-vision/commit/bdc2e408))
- **tooling:** ESLint, Prettier, husky, commitlint, and lint-staged configuration ([#d5cf69c](https://github.com/chessvision-org/chess-vision/commit/d5cf69c1))
- **tooling:** `.editorconfig`, `.nvmrc`, and VSCode extension recommendations ([#c82fab5](https://github.com/chessvision-org/chess-vision/commit/c82fab5a))
- **layout:** a `Footer` with a GitHub link and current-year display ([#e72705f](https://github.com/chessvision-org/chess-vision/commit/e72705f9))
- **seo:** `robots.txt` and `sitemap.xml` for indexing and crawl control ([#679a4cb](https://github.com/chessvision-org/chess-vision/commit/679a4cb2))
- **docs:** a contributing guide, code of conduct, security policy, and enhanced issue templates ([#070068e](https://github.com/chessvision-org/chess-vision/commit/070068ed))
- **docs:** architecture, FEN, FAQ, export-pipeline, state-management, roadmap, and ADR documentation ([#dcc4a11](https://github.com/chessvision-org/chess-vision/commit/dcc4a11c))

### Bug Fixes

- **layout:** fix responsive layout issues and the JPEG export background ([#4b9e522](https://github.com/chessvision-org/chess-vision/commit/4b9e5227))
- **fen:** ensure valid FEN handling and improve board-rendering logic ([#1da56e6](https://github.com/chessvision-org/chess-vision/commit/1da56e68))
- **fen-parser:** resolve parser syntax errors ([#5791919](https://github.com/chessvision-org/chess-vision/commit/579191eb))
- **theme:** fix `ThemeModal` re-rendering on color changes and the board-readiness check in `ThemeMainView` ([#d7372da](https://github.com/chessvision-org/chess-vision/commit/d7372dad))
- **eslint:** remove unused imports and correct `useEffect` dependencies ([#5e36f22](https://github.com/chessvision-org/chess-vision/commit/5e36f22f))
- **lint:** standardize single-quote style across all components and exports ([#863c435](https://github.com/chessvision-org/chess-vision/commit/863c435d))

---

## December 2025

### Features

- **board:** canvas-based chess board renderer with FEN parsing and a flip-board toggle ([#0ad19e7](https://github.com/chessvision-org/chess-vision/commit/0ad19e7d))
- **pieces:** custom piece sets and the initial `PIECE_SETS` data for the 23 Lichess piece styles ([#2bc139c](https://github.com/chessvision-org/chess-vision/commit/2bc139cf))
- **export:** image export from the board with an ultra-quality canvas path and SVG rendering ([#cb16172](https://github.com/chessvision-org/chess-vision/commit/cb161726))
- **editor:** a control panel with theme management and a status message, plus custom light/dark square colors ([#ebf63c9](https://github.com/chessvision-org/chess-vision/commit/ebf63c96))
- **board:** consolidate coordinate metrics and drawing so labels stay aligned at any size ([#b69f69f](https://github.com/chessvision-org/chess-vision/commit/b69f69f2))

### Bug Fixes

- **fen:** improve FEN parsing logic and harden error handling ([#be218bb](https://github.com/chessvision-org/chess-vision/commit/be218bb1))
- **export:** simplify `createExportCanvas` and improve error handling ([#41391d6](https://github.com/chessvision-org/chess-vision/commit/41391d6a))

Initial release — a canvas-based board renderer, board flip and coordinate
toggle, custom light/dark square colors and predefined board themes, a piece
selector with previews, and PNG/JPEG export, built on React 19 and Tailwind CSS.

---

_© 2026 Khatai Huseynzada. AGPL-3.0 License._
