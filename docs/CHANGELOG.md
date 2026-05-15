# Changelog

All notable changes to **ChessVision** are documented in this file.  
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Known Remaining Gaps

- Keyboard shortcuts for board actions are still not implemented.

---

## [5.5.0] - 2026-05-09

### Added

- TypeScript app entry points and config (`src/index.tsx`, `src/App.tsx`, `tsconfig*.json`, `vite-env.d.ts`).
- `LayoutProvider` for centralized layout and navbar state management.

### Changed

- Refactored entire application entry point logic for better state flow.

### Removed

- Deprecated duplicate and outdated components to simplify the codebase: `DndProvider`, `CustomDragLayer`, `ChessEditor`, `FENInputList`, `BoardPreview`, `PieceSelector`, `PiecePalette`.
- Removed standalone `fenParser.js` utility (logic centralized).

---

## [5.4.0] - 2026-05-07

### Added

- Theme editing and customization flows with apply/cancel features in `SettingsPage`.

### Changed

- Extensive responsive layout updates to `HomePage`, `ChessEditor`, and `AdvancedFENInputPage`.
- Enhanced UX animations and transitions across `Navbar`, `Toast`, and `HelpCenterDrawer`.

---

## [5.3.0] - 2026-05-07

### Added

- `validateFEN` guards inside export functions to prevent exporting corrupted FEN states.

### Fixed

- Touch device detection allowing proper drag-and-drop fallback to `HTML5Backend` on desktops.
- Enforced `MAX_FEN_LENGTH` in input and paste actions to eliminate infinite crash loops.
- Drag layer `currentOffset` calculations to correctly center dragged pieces under the cursor.

### Performance

- Optimized piece image rendering using `useRef` to skip unnecessary re-renders.
- Added `willReadFrequently` flag to canvas context for rendering optimization.

---

## [5.2.0] - 2026-05-06

### Changed

- Increased `MAX_TOTAL_PRESETS` to allow saving more custom board themes.
- Re-formatted route definitions and internal component spacings for consistency.

---

## [5.1.0] - 2026-05-04

### Changed

- Improved formatting and whitespace consistency across documentation files (`ARCHITECTURE.md`, `FAQ.md`, `KNOWN_ISSUES.md`).
- Standardized git commit message linting and pre-commit hooks to strictly use `pnpm`.
- Adjusted `Navbar` layout to natively accept right-slot properties.

---

## [5.0.15] - 2026-05-04 (Patches 5.0.1 - 5.0.15)

### Fixed

- Series of patch updates and Dependabot version bumps for underlying dependencies (`globals`, `lucide-react`, `postcss`, `@commitlint/cli`).
- AudioContext lifecycle management to prevent sound distortion.
- DraggablePiece Z-index positioning issues during active interactions.

## [5.0.0] - 2026-04-17

### Fixed

- **CRITICAL — Export Dimension Bug:** Board size selection (4cm / 6cm / 8cm) now correctly determines the physical pixel output of all exports. Previously, the size selector had no effect on actual export dimensions.
  - `Print 8×` @ 4cm → 3,776px (small print diagram)
  - `Print 8×` @ 6cm → 5,664px (medium print diagram)
  - `Print 8×` @ 8cm → 7,552px (large print diagram)
  - Quality multiplier now scales resolution independently of physical print size.
- **Export Module Property Access:** Corrected incorrect property names in `getExportInfo` — `baseSizeCm` renamed to `physicalSizeCm`, `dpi` renamed to `effectiveDPI`.
- **Coordinate Positioning:** Rank and file labels now scale proportionally with board pixel dimensions using dynamic center calculations. Formula: `fontSize = min(480px, max(10px, borderSize × 0.72))`, `borderSize = min(800px, max(18px, boardPixels × 0.05))`.
- **Coordinate Container Borders:** Removed visual borders around coordinate label containers for clean export output.
- **Circular Export Dependencies:** Resolved all circular export issues across component index files throughout the codebase.
- **React Build Errors:** Fixed component export patterns that caused Vite build failures on fresh installs.

### Added

- **Dynamic Board Size Scaling System:** Export pipeline now accurately maps physical size selection to pixel output across all four quality tiers: Print 8×, Print 16×, Social 24×, Max 32×.
- **Advanced FEN Editor:** New `/advanced-fen` route providing multi-position management. Includes a Positions tab for listing and editing multiple FEN strings, and a Preview/Export tab with single-position and batch export (PNG, JPEG, SVG) and slideshow playback with configurable interval.
- **FEN History — Archive System:** Positions can now be moved from Active to Archive. Archived items display a Reactivate button. Header badge reflects the currently active tab count.
- **FEN History — Status Indicators:** Each history entry now displays a freshness label (Fresh / Aging / Stale) with a timestamp.
- **20 Preset Board Themes:** Theme Studio ships with: Wood, Classic, Brown, Sand, Slate, Marble, Blue, Ocean, Green, Forest, Mint, Purple, Lavender, Red, Coral, Sunset, Pink, Burgundy, Custom 1, Custom 2.
- **Custom Color Mixer:** Under the Custom tab in Theme Studio, users can independently set Light Square and Dark Square colors via a hue slider and saturation/lightness canvas.
- **Export Customization Page:** New Settings → Export Customization tab with Board Size selector (4×4 Small / 6×6 Medium / 8×8 Large / Custom cm), File Name input, and Print/Social quality tier selection.
- **Help Center Panel:** Slide-in panel accessible from the main toolbar with searchable articles covering Interactive Board Editor, FEN Notation Support, Export Options, and all major features.
- **Light/Dark Mode Toggle:** Persistent light and dark theme preference stored across sessions.
- **Comprehensive JSDoc Documentation:** Detailed JSDoc comments added across the entire codebase covering all public functions, parameters, return types, and complex logic blocks.

### Changed

- **Piece Palette Layout:** Redesigned with clearly labeled WHITE and BLACK section headers for improved usability.
- **Import Organization:** All source files now follow a consistent import ordering: React/framework → third-party libraries → internal utilities → components → styles. Imports within each group are alphabetically sorted.
- **Documentation:** All markdown files (`README.md`, `CONTRIBUTING.md`, feature docs) rewritten in professional technical style without emoji decorations.
- **Comment Cleanup:** Removed low-value inline comments (e.g., `// set state`, `// return value`) while preserving explanations for non-obvious logic.
- **Export Logic Refactored:** Dimension calculation extracted into a dedicated scaling utility for accuracy and testability across all quality/size matrix combinations.

---

---

## [v4.0.0] - 2026-02-02

### Added

#### Progressive Web App (PWA) Support

- **Service Worker** - Implemented offline-first caching strategy with Workbox
- **Web App Manifest** - Added comprehensive manifest.json with app icons and metadata
- **Installability** - Users can now install the app on desktop and mobile devices
- **Offline Mode** - Full functionality available without internet connection
- **App Icons** - Added complete set of PWA icons (192x192, 512x512, maskable icons)
- **Theme Color** - Added theme color support for better native app experience
- **Cache Management** - Intelligent caching of static assets and API responses

### Changed

- Updated build configuration to support PWA features
- Enhanced app metadata for better mobile experience
- Improved loading performance with service worker precaching

---

## [v3.5.4] - 2026-02-01

### Fixed

#### Modal Bugs

- **ThemeModal** - Fixed piece preview display issues:
  - Corrected piece key mapping (wK, wQ, etc.) for proper piece rendering
  - Restored theme color template selections to previous working state
  - Fixed board preview showing pieces correctly in theme selector

#### Accessibility Improvements

- **ThemeModal** - Added comprehensive ARIA support:
  - Added `role="dialog"`, `aria-modal`, `aria-labelledby`
  - Implemented tab pattern with `role="tablist"`, `role="tab"`, `aria-selected`
  - Added tabpanel structure with `role="tabpanel"`, `aria-labelledby`
  - Enhanced button focus styles with `focus-visible` rings
- **ThemePresetButton** - Added descriptive `aria-label` with color values
- **Theme grid** - Added `role="group"` with `aria-label`

### Added

#### Performance Optimizations

- **React.lazy code splitting** - All pages now lazy-loaded (HomePage, AboutPage, DownloadPage, SupportPage)
- **Intersection Observer** - Created `useIntersectionObserver` hook for lazy rendering theme presets
- **Performance hooks** - Added `useDebounce` and `useIdleCallback` hooks in usePerformance.js
- **GPU acceleration** - Added `will-change` properties, `transform: translateZ(0)` for GPU layer promotion
- **CSS containment** - Added `contain` property to modals and board elements
- **Reduced CSS duplication** - Single source of truth for scrollbar and animation styles
- **Better tree-shaking** - Removed unused props improves bundle optimization

#### UI Animations

- Added `animate-fadeIn` keyframe animation
- Added `animate-slideUp` keyframe animation
- Added `animate-scaleIn` keyframe animation
- All animations respect `--animation-duration` CSS variable

#### Custom Scrollbar

- Blue themed custom scrollbar with sharp corners (no border-radius)
- Scrollbar colors: blue-500/60 thumb, gray-800/50 track
- Hover and active states for better UX
- Firefox support with `scrollbar-width` and `scrollbar-color`

#### Accessibility (A11y) Enhancements

- **Skip Navigation Link** - Added skip-to-main-content link in App.jsx for keyboard users
- **Main Landmark** - Wrapped content in `<main id="main-content">` for screen readers
- **404 Page** - Created professional NotFoundPage with navigation options
- **Footer ARIA** - Added `role="contentinfo"`, aria-labels to external links
- **Navbar Keyboard Support**:
  - Escape key closes mobile menu
  - Body scroll lock when menu is open
  - Focus-visible styles on logo buttons
  - `onKeyDown` handlers for Enter/Space key activation
  - `aria-label` on all interactive elements
- **NotificationContainer** - Added `role="region"`, `aria-live="polite"`, keyboard dismiss
- **FENInputField** - Added `aria-describedby`, `aria-invalid`, `aria-label` attributes
- **ExportProgress** - Added `role="dialog"`, `aria-modal`, `aria-valuenow` on progress bar
- **FamousPositionButton** - Added `aria-label`, focus-visible styles
- **PickerModal (Color Picker)**:
  - Added `role="dialog"`, `aria-modal`, `aria-labelledby`
  - Canvas has `role="img"` with descriptive aria-label
  - Hue slider has proper `id` and `htmlFor` label association
  - Action buttons have `type="button"` and focus-visible styles
- **UserGuide** - Added `aria-expanded`, `aria-controls`, `id` for collapsible content
- **Input (base)** - Added `useId` for label association, `aria-invalid`, `aria-describedby` for errors
- **Checkbox (base)** - Added `useId` for proper label-input association, focus-within styles
- **Select (base)** - Added listbox ARIA pattern with `role="listbox"`, `aria-selected`, keyboard navigation

#### New Components

- **NotFoundPage** (`src/pages/NotFoundPage.jsx`) - 404 error page with:
  - Gradient animated 404 text
  - Home and Go Back navigation buttons
  - Proper heading hierarchy
  - Responsive design

#### Animations

- **slideInRight** - New keyframe animation for notifications
- **shimmer** - New keyframe animation for progress bars (moved from inline)

### Fixed

#### Board Preview Bugs

- **ThemeModal preview** - Fixed live board preview not rendering pieces correctly
  - Added `isBoardReady` check to ensure board state and piece images are loaded before rendering
  - Added loading indicator while pieces are being fetched
  - Improved conditional rendering for piece images
- **AdvancedFENInputModal preview** - Fixed board preview not displaying pieces properly
  - Added `isBoardReady` validation for proper piece rendering
  - Added loading indicator during piece image loading
  - Fixed piece image access pattern for consistent rendering

#### Hook Improvements

- **useChessBoard hook** - Fixed empty initial board state issue
  - Added `useMemo` for initial board parsing to prevent empty state on first render
  - Added try-catch error handling for FEN parsing
  - Board now initializes with parsed FEN immediately instead of empty array

#### Bug Fixes

- **ThemeAdvancedPickerView** - Fixed JSX syntax errors and improved color picker functionality
- **AdvancedFENInputModal preview** - Fixed board preview not rendering pieces
  - Added proper array structure validation for boardState
  - Added fallback to default FEN when currentFen is empty
  - Improved `isBoardReady` checks with Array.isArray validation

#### CSS Fixes

- Fixed duplicate and broken CSS in reduce-motion media query
- Removed malformed CSS block syntax at end of index.css

#### Code Quality

- **Removed duplicate CSS** - Consolidated custom-scrollbar styles from 3 files into `index.css`:
  - Removed inline `<style>` from ControlPanel.jsx
  - Removed inline `<style>` from FENHistoryModal.jsx (dangerouslySetInnerHTML)
  - Removed inline `<style>` from NotificationContainer.jsx
- **Removed unused variables**:
  - `positionKey` prop from FamousPositionButton
  - `onNotification` parameter from useTheme hook
- **Removed inline styles** - Moved shimmer animation from ExportProgress inline style to CSS

#### Router

- Added catch-all `*` route for 404 handling
- Improved PageLoader with `role="status"` and `aria-live="polite"`

### Changed

#### UI/UX Improvements

- **ThemeModal** - Expanded from `max-w-md` to `max-w-lg` for better content visibility
- **ThemeModal header** - Added gradient background and improved icon styling
- **ThemePresetButton** - Extracted as separate memoized component with lazy loading

#### About Page & UserGuide

- Removed excessive emojis (⭐ and Sparkles icon)
- Cleaner, more professional appearance
- "Recommended" badge now text-only without emoji

#### Router

- Implemented Suspense with loading spinner fallback for lazy-loaded pages
- Reduced initial bundle size through code splitting

### Performance

- **ThemeMainView** - Uses Intersection Observer for lazy rendering presets (100px rootMargin)
- **Modal classes** - Added `modal-backdrop` and `modal-content` classes with optimized properties
- **Transition utilities** - Enhanced `transition-smooth` and `transition-smooth-fast` with `will-change`

#### CSS Improvements

- **Scrollbar consolidation** - All scrollbar styles now in single location (`index.css`)
- **Animation centralization** - All @keyframes moved to base layer in index.css
- **Focus-visible styles** - Added consistent focus-visible ring styles across components

#### Component Updates

- **Navbar** - Added Escape key listener, scroll lock, improved keyboard navigation
- **Footer** - Added aria-hidden to decorative icons, focus styles on links
- **Router** - Added NotFoundPage lazy import and route
- **PickerModal** - Improved accessibility with ARIA attributes and focus management

---

## [v3.5.3] - 2026-01-23

### Fixed

#### Code Quality

- Resolved git merge conflicts in HueSlider.jsx and colorUtils.js
- Fixed unreachable code warning in colorUtils.js (duplicate return statement)
- Fixed all ESLint warnings (unused variables, array index keys)
- Prefixed unused props with underscore in PickerModal, HueSlider, imageOptimizer

#### Props & State Management

- Fixed AdvancedFENInputModal props - now correctly receives `lightSquare`/`darkSquare` instead of `boardTheme`
- Updated theme color handling to use direct color values

### Changed

#### UI/UX Improvements

- **AdvancedFENInputModal completely refactored** with tab-based interface:
  - Positions tab - FEN input management
  - Preview tab - Live board preview with slideshow
  - Export tab - Batch export options
- Reduced modal size from `max-w-6xl` to `max-w-2xl` for better UX
- Reduced modal height from `max-h-[90vh]` to `max-h-[80vh]`
- Compact header with integrated tab navigation
- Smaller, more efficient footer buttons

#### Code Refactoring

- Replaced array index keys with proper unique keys in:
  - ThemeSettingsView (recentColors)
  - BoardPreview (squares, navigation dots)
  - FENInputList (FEN rows)
  - UserGuide (pros/cons lists)
  - AboutPage (format comparisons)

---

## [v3.5.2] - 2026-01-18

### Fixed

#### Console & Logging

- Replaced console.log/error statements with logger utility (dev-only output)

#### Memory & Performance

- Added setTimeout cleanup refs in AdvancedFENInputModal and other components
- Fixed memory leaks from timeout cleanup issues
- Fixed React memo comparisons

#### Board Coordinates

- Fixed coordinate misalignment - coordinates now display and export correctly
- Improved coordinate positioning for all board sizes

#### Export & Rendering

- Fixed export coordinate accuracy
- Removed debug code affecting export performance

#### User Interface

- Fixed clipboard paste functionality for FEN notation
- Fixed canvas overflow on mobile devices

### Added

- **Error Boundary** - ErrorBoundary component wrapping App for graceful error recovery
- **ARIA labels** - Accessibility attributes to Modal, Button, ActionButtons, ChessBoard
- **Focus trap** - Modal component traps focus with Tab key cycling
- **Logger utility** - Development-only logging (src/utils/logger.js)
- **Error handler** - Centralized errorHandler.js utility with ErrorTypes

### Changed

- Modal now has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Button supports `aria-label` prop and `aria-disabled` attribute
- ChessBoard has `role="img"` with dynamic board description

---

## [v3.5.1] - 2026-01-04

### Fixed

- Chess pieces missing in exported images
- JPEG export background rendering
- Responsive layout on small screens

### Changed

- Increased coordinate font size and weight
- Enlarged chess pieces on board
- Added border around chessboard

### Added

- ARCHITECTURE.md documentation
- CHANGELOG.md for version tracking
- SECURITY.md with security policies
- FAQ.md
- CONTRIBUTING.md
- CODE_OF_CONDUCT.md
- MIT License

### Dependencies

- Bumped qs from 6.14.0 to 6.14.1

---

## [v3.5.0] - 2026-01-03

### Added

- Multi-FEN input (up to 10 positions)
- Pagination with live board previews
- Color picker with HSL/RGB/HEX

### Changed

- React.memo optimizations
- Faster export pipeline
- Reduced bundle size
- Better mobile responsiveness
- Improved FEN validation with error messages

### Fixed

- FEN parsing edge cases
- Export scaling on high-DPI displays
- Cross-browser UI inconsistencies
- Color picker modal z-index

---

## [v3.0.0] - 2026-01-02

### Added

- PNG and JPEG export with quality settings
- Board theme customization system
- Enhanced FEN validation

### Changed

- Refactored color picker
- Improved canvas scaling
- Internal architecture cleanup

---

## [v2.0.0] - 2025-12-29

### Added

- Custom light/dark square colors
- Pre-defined board themes
- Piece selector with previews
- Theme favorites

### Changed

- Redesigned control panel
- Responsive layout improvements

### Fixed

- Reduced unnecessary re-renders
- Optimized board redraw
- Lazy loading for piece images

---

## [v1.0.0] - 2025-12-28

### Initial Release

- FEN notation support with validation
- Canvas-based board renderer
- 23 piece sets
- Board flip and coordinate toggle
- PNG/JPEG export (400px-1600px)
- React 19.x + Tailwind CSS
- LocalStorage for preferences

---

## Version Support

| Version     | Status                  | Security Updates |
| ----------- | ----------------------- | ---------------- |
| v5.0.x      | Active                  | Yes              |
| v4.0.x      | Supported until 2026-09 | Yes              |
| v3.5.x      | Supported until 2026-06 | Security only    |
| v1.x–v3.0.x | Deprecated              | No               |

---

**Last Updated:** May 6, 2026  
**© 2026 Khatai Huseynzada. MIT License.**
