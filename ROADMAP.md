# ChessVision Roadmap — v5.5.3 (stable)

This document describes the state of the **`master` branch at v5.5.3** and the maintenance posture for the v5.x line. It is intentionally a snapshot of what is in this branch today — not a forward-looking feature plan. Forward-looking work happens on `develop` and will be reflected here only after it has been merged and released on `master`.

No timeline commitments are made or implied.

---

## 1. Release Posture

ChessVision v5.5.3 is the current stable release. The v5.5.x patch line is in **maintenance mode**: dependency hygiene, security patching, build/release infrastructure, and documentation refinement only. No new user-facing features will land on v5.5.x.

The v5.5.0 → v5.5.3 patch series consisted of:

- **v5.5.0** — Branding consistency pass and release infrastructure
- **v5.5.1** — Branding fixes, `RELEASES.md` history, SAST & logic review
- **v5.5.2** — Dev-dependency batch and CI workflow refresh
- **v5.5.3** — Final Dependabot batch

This pattern (chore-only patch releases) is the intended steady state for the v5.x line.

---

## 2. Implemented in v5.5.3

The following capabilities are present and functional on the current `master` branch. They are inventoried directly from the source tree.

### 2.1 Core Board

- FEN notation parsing and validation (`MAX_FEN_LENGTH = 93`, enforced in `src/utils/validation.js` and `src/utils/fenParser.ts`)
- Canvas-based board renderer with coordinate labels (`src/utils/canvasRenderer.js`)
- Interactive drag-and-drop board editor built on `react-dnd` with `HTML5Backend` and `TouchBackend`
- Board flip and coordinate-visibility toggles
- Piece sets and theme presets (board palette + piece set selection)
- Custom board color picker (HSV / RGB / HEX) with multiple picker views

### 2.2 Export Pipeline

- PNG and JPEG export via `canvasExporter.js`
- DPI-correct export with physical-dimension targeting (cm → px conversion through `imageOptimizer.js`)
- Multiple quality presets, board-size selection, and chunked main-thread export for large canvases (`advancedExport.js`)
- ZIP-based batch export from the Advanced FEN Input page (`archiveManager.js`)
- Pause / resume / cancel state machine for long-running exports
- Clipboard copy
- Safari/iOS canvas-memory protection: explicit `canvas.width = 0` disposal after every blob generation
- SVG board generation (`svgExporter.js`)

### 2.3 Pages and Routing

All routes are `React.lazy`-loaded with a `Suspense` fallback and animated with `framer-motion` `AnimatePresence`:

- `/` — Home (board playground, primary export entry point)
- `/about`
- `/download` (PWA install guide)
- `/support`
- `/settings` — tabbed: **Export Customization**, **Theme Customization**, **Data Management**
- `/fen-history` — browsable history with filters, archive, and favorites
- `/advanced-fen` — batch FEN editor with playback
- `*` — 404

### 2.4 State and Persistence

- `FENBatchContext` — batch FEN list, persisted to `localStorage`
- `ThemeSettingsContext` — theme preferences, recent colors, sound preferences
- `LayoutContext` — UI layout state
- `useFENHistory` — FEN history with 300 ms debounced `localStorage` writes
- History archive with auto-archival, filtering, sorting, favorites, and pinning
- All `localStorage` reads routed through `safeJSONParse` (no direct `JSON.parse` on untrusted strings)
- **Local-only persistence.** v5.5.3 does not include cloud sync, user accounts, or any server-side data store.

### 2.5 Data Management (Settings → Data Management)

- Export full app state to a JSON backup file
- Restore from a backup file
- Full local reset
- All flows use `safeJSONParse` and `sanitizeFileName` at boundaries

### 2.6 Performance

- `React.memo` on board-render hot path (`BoardSquare`, `DraggablePiece`, `DroppableSquare`)
- `useMemo` / `useCallback` on hot render paths
- Piece-image caching via `pieceImageCache.js`
- Virtualized FEN history list (`react-window` + `react-window-infinite-loader`)
- Per-page code splitting via `React.lazy`
- Manual Vite chunking for vendor bundles (react, icons, motion, dnd, virtualization)

### 2.7 Tooling and Release Engineering

- pnpm 10 monorepo (`packageManager: pnpm@10.33.0`)
- Vite 8, React 19, Tailwind 4, TypeScript 6 (mixed JS/TS — see § 3.1)
- ESLint 9 with `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`; production lint gate at `--max-warnings=0`
- Prettier, Husky pre-commit, `lint-staged`, commitlint with Conventional Commits
- `semantic-release` configured against `master`
- Testing: `node --test` against `src/utils/fenParser.test.js` (no experimental flags required)
- CI on GitHub Actions; CodeQL extended-queries enabled
- Dependabot configured for dependency PRs

---

## 3. Known Limitations in v5.5.3

These are accurate, surveyed limitations of the v5.x line — not aspirational tasks. They inform what the next major release will need to address but are **not commitments** for v5.x patches.

### 3.1 Mixed JavaScript / TypeScript

The v5.x source tree is predominantly `.jsx` / `.js` with a small TypeScript footprint (notably `fenParser.ts`, `fenValidationDetailed.ts`, `useDebouncedFENValidation.ts`). The repo's `tsconfig` and ESLint configuration target both, but TypeScript coverage is partial. Full migration is a v6.x-scope concern.

### 3.2 Test Coverage

Automated test coverage is limited to FEN parser unit tests (`src/utils/fenParser.test.js`). Component and integration testing are not present in v5.5.3.

### 3.3 Export Pipeline

- Very-large exports (24× / 32× Social presets, multi-cm canvases) execute on the main thread via chunked rendering in `advancedExport.js`. There is no Web Worker / `OffscreenCanvas` raster path in v5.x.
- Safari and iOS WebKit can OOM on the largest canvas sizes despite the explicit `canvas.width = 0` disposal pattern. This is a platform limitation that the v5.x pipeline mitigates but does not eliminate.

### 3.4 Accessibility

- The canvas-rendered board has no DOM-equivalent representation for screen readers.
- No board text description is generated from the parsed FEN.
- Full WCAG 2.1 AA conformance is not claimed for v5.5.3.

### 3.5 Persistence Scope

v5.5.3 persistence is `localStorage` only. There is no authentication, no server-side data, no cross-device sync, and no end-to-end encryption surface. Data Management's backup/restore is the only mechanism for moving state between devices.

### 3.6 Build and Bundle Observability

- No Lighthouse CI integration.
- No automated bundle-size regression tracking in the build pipeline.
- Manual `pnpm build:analyze` (vite-bundle-visualizer) is the supported inspection path.

### 3.7 Filesystem Artefact

Case-insensitive-filesystem residue exists in `src/components/features/`: directory pairs such as `export/` / `Export/`, `fen/` / `Fen/`, `history/` / `History/` coexist. Treated as cosmetic in v5.x; resolution deferred.

---

## 4. Maintenance Policy for the v5.x Line

### 4.1 In scope for v5.5.x patch releases

- Security patches (dependency CVEs, SAST findings)
- Dependabot dependency bumps for direct dependencies
- Documentation corrections, typos, link rot
- CI / release-pipeline fixes
- Build-config fixes that do not alter user-facing behavior

### 4.2 Not in scope for v5.5.x patch releases

- New user-facing features
- Schema or API changes
- Breaking changes to `localStorage` keys, FEN history format, or settings shape
- TypeScript migration of additional files
- Performance refactors that change observable behavior

### 4.3 Bug-fix policy

- **Crash-class** bugs (canvas OOM workarounds, regression in export, navigation crashes): backported to `master` as a v5.5.x patch.
- **Functional** bugs that do not crash or destroy data: triaged; routine fixes ship in the next minor; non-routine fixes are deferred to the next major.
- **Cosmetic / polish** issues: deferred to the next major unless trivial.

### 4.4 Supply-chain hygiene

- Dependabot PRs are reviewed and merged in batches (see v5.5.2 / v5.5.3 changelog entries).
- Major-version bumps of direct dependencies are evaluated individually and may be deferred to the next major.
- `semantic-release` operates against `master`; tags and GitHub Releases are authored automatically from Conventional Commits.

### 4.5 Branch model

- `master` — stable; receives only the changes described in § 4.1.
- `develop` — active development; the next major's surface area accumulates here.
- Feature branches target `develop`. Patch branches against the v5.x line target `master` directly (chore / fix scope only).

---

## 5. Out of Scope (v5.x)

The following are explicitly out of scope for the entire v5.x line. They may be considered for a future major release but carry no commitment here:

- Move animation, game playback, or PGN replay
- Chess-engine integration or position analysis
- Native mobile applications
- Multiplayer, real-time collaboration, or WebSocket transport
- i18n / localisation

---

*This roadmap reflects `master` at v5.5.3. It will be revised when the next merge to `master` lands.*
