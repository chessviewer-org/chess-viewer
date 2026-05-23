# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note:** Versions `v5.0.1` through `v5.5.3` were tagged retroactively on 2026-05-10 (v5.0.1–v5.5.0) and 2026-05-23 (v5.5.1–v5.5.3) to document development history that had previously gone untagged. GitHub Releases for all versions were published on 2026-05-23. Authored dates below reflect the real commit timeline. Automated semantic-release will manage entries from the next version onward.

## [v5.5.3] - Final dependabot batch

_Authored: 2026-05-17→2026-05-19_

### Chores

- chore(deps-dev): bump @vitejs/plugin-react from 6.0.1 to 6.0.2 (5201c49)
- chore(deps): bump lucide-react from 1.14.0 to 1.16.0 (6ad140f)
- chore(deps): bump react-router-dom from 7.15.0 to 7.15.1 (e93d8ca)
- chore(deps-dev): bump @commitlint/config-conventional (87aaab6)
- chore(deps-dev): bump lint-staged from 17.0.2 to 17.0.4 (fa7efd2)
- chore(deps-dev): bump tailwindcss from 4.2.4 to 4.3.0 (eaf2c67)
- chore(deps-dev): bump @commitlint/cli from 20.5.3 to 21.0.0 (bf02ebc)

**Commits:** 16 · **Range:** `b4226b8..598eca8` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.5.3)

## [v5.5.2] - Dev-dependency batch & CI workflow refresh

_Authored: 2026-05-10→2026-05-12_

### Chores

- chore: remove generate-tags script for automated release notes and tagging (b4226b8)
- chore: enhance documentation for FEN-related functions in useInteractiveBoard hook (0948cac)
- chore: simplify validation logic in validateFENDetailed function (7fd47fa)
- chore: enhance documentation for export functions in canvasExporter.js (5adef37)
- chore: add generate-tags script for automated release notes and tagging (ab29ead)
- chore: update release configuration to use 'master' branch and format plugin settings (1305471)
- chore: update GitHub Actions workflow to use latest actions and pnpm (3d70308)
- chore: remove KNOWN_ISSUES.md documentation file (e7dd221)
- chore: remove outdated dependency audit and design errors analysis documentation (a95d8e5)
- chore: remove outdated documentation files for performance, security audit, and state management (848c5c0)
- chore(deps-dev): bump @tailwindcss/postcss from 4.2.4 to 4.3.0 (e58cbdc)

**Commits:** 12 · **Range:** `bf3e872..b4226b8` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.5.2)

## [v5.5.1] - Branding consistency & release infrastructure

_Authored: 2026-05-10_

### Features

- feat: add release workflow for automated semantic versioning (17a279d)
- feat: add RELEASES.md to document version history and major changes (cdcc73b)
- feat: add SAST & Logic Review Report with security findings and remediation suggestions (8698647)

### Bug Fixes

- fix: update spelling of Chess Vision to ChessVision in ACCESSIBILITY.md for consistency (bf3e872)
- fix: update spelling of Chess Vision to ChessVision in DECISIONS.md for consistency (a5767b1)
- fix: update spelling of Chess Vision to ChessVision in ARCHITECTURE.md for consistency (c096ce1)
- fix: update spelling of Chess Vision to ChessVision in feature_request.yml for consistency (174c5ec)
- fix: update spelling of Chess Vision to ChessVision in bug_report.yml for consistency (9aa48f3)
- fix: update spelling of Chess Vision to ChessVision in SECURITY.md for consistency (2c6124c)
- fix: update spelling of Chess Vision to ChessVision in EXPORT_PIPELINE.md for consistency (424ad46)
- fix: update spelling of Chess Vision to ChessVision in FAQ.md for consistency (fbdaa73)
- fix: update spelling of Chess Vision to ChessVision in README.md for consistency (e961c5b)
- fix: update spelling of Chess Vision to ChessVision in ROADMAP.md for consistency (ed08b2f)
- fix: update spelling of Chess Vision to ChessVision in STATE_MANAGEMENT.md for consistency (bb1521a)
- fix: update spelling of Chess Vision to ChessVision in manifest.json for consistency (42e0af8)
- fix: update spelling of Chess Vision to ChessVision in robots.txt for consistency (04c11db)
- fix: update spelling of Chess Vision to ChessVision in HelpCenter.jsx for consistency (62dc064)
- fix: update spelling of Chess Vision to ChessVision in AboutPage.jsx for consistency (951fac1)
- fix: standardize spelling of Chess Vision to ChessVision throughout README.md (5f8d9a8)
- fix: update spelling of Chess Vision to ChessVision for consistency (d6fc0a7)
- fix: correct spelling of Chess Vision to ChessVision for consistency (f386830)
- fix: correct repository name in CONTRIBUTING.md for clarity (b8cd847)

### Refactors

- refactor: update application name in .env.example for consistency (486ec60)

### Chores

- chore: add semantic-release dependency for automated versioning (6afabc2)
- chore: add .releaserc configuration for semantic release (004b9c9)

**Commits:** 25 · **Range:** `b7a8e1d..bf3e872` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.5.1)

## [v5.5.0] - fast-uri 3.1.2 & feature batch

_Authored: 2026-05-09_

### Features

- feat: enhance FENInputField with debounced validation and improved error handling (a3fce05)
- feat: add KnightIcon component with glass-filling hover effect (6e9b88c)
- feat: implement useDebouncedFENValidation hook for improved FEN validation and board synchronization (e5b856d)
- feat: add saveExportFen method to commit FEN history for export (308ff74)
- feat: add chess piece entrance animation and SVG liquid fill hover effect (abfb66d)
- feat: add notification handler to streamline message display logic (2809f81)
- feat: enhance FEN parsing with detailed validation and error handling (238c1b0)
- feat: add detailed FEN validation function with specific error messages (ae0248c)

### Bug Fixes

- fix: allow console log in production environment for better debugging (228f889)
- fix: handle different item types in ClipboardHistory component (684e068)
- fix: add newline at end of vite-env.d.ts for consistency (dd07c30)
- fix: update logo asset to improve visual branding (599c186)
- fix: remove redundant storage event dispatch in useLocalStorage hook (148c482)
- fix: simplify piece image state update in usePieceImages hook (4d058db)
- fix: remove redundant check for empty board in FEN validation (292be2f)
- fix: optimize file size estimation for PNG and JPEG exports (3658cb7)
- fix: add tailwindCSS lint configuration to ignore unknown classes (2458e98)

### Refactors

- refactor: add TypeScript interface for PieceSelector props to improve type safety (60f7de6)
- refactor: streamline DndProvider by removing unused code and simplifying backend configuration (53c792e)
- refactor: clean up formatting and improve readability in ChessEditor component (2c35fb4)
- refactor: simplify DroppableSquare component structure and enhance piece rendering (338140c)
- refactor: format handleDrop function parameters for improved readability (01c1ebc)
- refactor: improve CustomDragLayer structure and optimize drag state handling (06aa246)
- refactor: format PiecePalette component for improved readability (1904b46)
- refactor: adjust Navbar component layout and styling for improved visual hierarchy (39531d1)
- refactor: update export info display in ExportProgress component for clarity (b0c1e0d)
- refactor: remove unused FEN validation error handling in ControlPanel component (f6e6225)
- refactor: implement feature X to enhance user experience and fix bug Y in module Z (dd9a9fc)

### Chores

- chore: remove unnecessary blank lines in TrashZone component (f105879)
- chore: update favicon and logo images (046c858)
- chore: remove Codacy security scan workflow (e93c0bb)

**Commits:** 33 · **Range:** `bf9169d..b7a8e1d` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.5.0)

## [v5.4.3] - Dependabot rollup PR #65

_Authored: 2026-05-09_

**Commits:** 1 · **Range:** `ea94be1..bf9169d` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.4.3)

## [v5.4.2] - fast-uri bump & fix batch

_Authored: 2026-05-08_

### Features

- feat: add dependency and security audit reports (15eed00)

### Bug Fixes

- fix: update security policy to reflect project name change to Chess Vision (090ce6c)
- fix: update project name from chessviewer to chess-vision in package.json (2bc2339)
- fix: update project name references from FENForsty Pro to Chess Vision (0165d7f)
- fix: update project name references from FENForsty Pro to Chess Vision in index.html (08ccef0)
- fix: update project name references from FENForsty Pro to Chess Vision in README.md (115aa0e)
- fix: update project name references from FENForsty Pro to Chess Vision in documentation files (71bba2e)
- fix: update project name references from FENForsty Pro to Chess Vision in manifest.json (271b32e)
- fix: update references from chess-viewer-site to chess-vision-site in robots.txt and sitemap.xml (6c2c022)
- fix: update project name references from FENForsty Pro to Chess Vision (41012a5)
- fix: update project name references from FENForsty Pro to Chess Vision (3ce88c3)

### Refactors

- refactor: application name in .env.example to Chess Vision (4bd2c2b)

### Chores

- chore(deps): bump fast-uri in the npm_and_yarn group across 1 directory (ea94be1)

**Commits:** 18 · **Range:** `f1777e6..ea94be1` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.4.2)

## [v5.4.1] - PR #64 fixes

_Authored: 2026-05-08_

### Refactors

- refactor: remove CodeQL security scanning workflow (c4da2a8)
- refactor: remove CodeQL workflow for security scanning (3dd6411)
- refactor: downgrade CodeQL action versions for improved stability (a4f719b)

**Commits:** 10 · **Range:** `40ab97e..f1777e6` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.4.1)

## [v5.4.0] - Develop sync (PR #63)

_Authored: 2026-05-07_

### Features

- feat: implement ControlPanel component with FEN input and clipboard functionality (07f1235)

### Bug Fixes

- fix: remove unnecessary eslint comment from LayoutContext.jsx (3772ee2)
- fix: update import path for ControlPanel component to remove file extension (09af941)
- fix: correct Content-Security-Policy img-src value by removing 'blob:' entry (c6b6d46)

### Refactors

- refactor: improve board size calculation and enhance type safety in ChessEditorProps (af133f1)
- refactor: enhance type safety in CustomDragLayer component props and state management (ffc3089)
- refactor: enhance type safety in DndProvider component props and global declarations (dbbbcf3)
- refactor: enhance type safety in DraggablePiece component props (8ba2f3f)
- refactor: enhance type safety in FENInputRow and FENInputList components (acee0c0)
- refactor: enhance type safety in DroppableSquare component props and handlers (3868bf8)
- refactor: enhance type safety in PiecePalette component props and internal types (a004b2f)
- refactor: enhance type safety in InteractiveBoard component props and handlers (8a5003a)
- refactor: improve type safety and clean up TrashZone component (5a8b7bd)
- refactor: enhance layout and styling of BoardDisplay component for improved responsiveness (f628c5c)
- refactor: simplify onChange handling and remove debounce logic in FENInputField (1cd0d2b)
- refactor: update BoardPreview component props typing for better type safety (eae3930)
- refactor: adjust font weight and letter spacing for headings and FEN notation (726b30e)
- refactor: replace JSON.parse with structuredClone for preset backup (2cb7905)
- refactor: enhance SVG generation by sanitizing input and improving accessibility features (72885a1)
- refactor: enhance accessibility and adjust canvas dimensions in ThemeAdvancedPickerView component (aaca8bf)
- refactor: update button styles and icon sizes in PrimaryActions component (5652f31)
- refactor: replace JSON.parse with safeJSONParse in loadPresets function (a4fb933)
- refactor: optimize ClipboardHistory component with virtualization and improved state management (44fccf1)
- refactor: enhance accessibility features in ThemeMainView component (01b9da3)
- refactor: adjust button padding and grid layout in ActionButtons component (ed03e3c)
- refactor: adjust image rendering style and update loading spinner dimensions in ChessBoard component (e7e922f)
- refactor: update Tailwind CSS configuration and improve theme variable management in index.css (65832eb)
- refactor: enhance type safety and improve function signatures in App.tsx (da00fa8)
- refactor: correct Tailwind CSS plugin configuration in postcss.config.js (73b896b)
- refactor: remove Tailwind CSS configuration file (ff1408d)
- refactor: improve manualChunks configuration for better code splitting (5a0e688)
- refactor: code structure for improved readability and maintainability (d77cd11)
- refactor: remove ControlPanel component (d88ff31)

### Chores

- chore: update Node.js version to 24.15.0 in .nvmrc (85dcf1b)

**Commits:** 35 · **Range:** `d063d05..40ab97e` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.4.0)

## [v5.3.0] - Develop sync (PR #62)

_Authored: 2026-05-07_

### Features

- feat: add CONTRIBUTORS.md to recognize project contributors and their contributions (577a446)

### Refactors

- refactor: rename JavaScript files to TypeScript and update last modified date (4a39d33)

### Documentation

- docs: update LINTING_SETUP.md to replace npm with pnpm and adjust linting commands (5981dd6)
- docs: update EXPORT_PIPELINE.md to include SVG export details and clarify export formats (b9fc141)
- docs: update CHANGELOG.md to include recent development activity and enhancements (b9f4b68)
- docs: update DESIGN_ERRORS_ANALYSIS.md file extension and last modified date (0970c79)
- docs: update FAQ.md to reflect SVG export availability and increase preset board themes count (3b9a074)
- docs: update FEN.md to reflect TypeScript file changes and update last modified date (64fafee)
- docs: update KNOWN_ISSUES.md to clarify SVG export limitations and correct FEN length validation (e2dfe73)
- docs: update PERFORMANCE.md with last updated date (8b5c5ef)
- docs: update README.md to reflect changes in canvas board themes and SVG export capabilities (ed5a163)
- docs: update ROADMAP.md with feature adjustments, priority roadmap items, and last updated date (198b211)
- docs: update STATE_MANAGEMENT.md to reflect TypeScript file changes and last updated date (203f1fd)
- docs: update DECISIONS.md with SVG export implementation details and last updated date (6883c34)
- docs: update accessibility documentation with recent improvements and last updated date (7581953)

**Commits:** 19 · **Range:** `2c9c8f8..d063d05` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.3.0)

## [v5.2.0] - Develop sync (27 feats, PR #61)

_Authored: 2026-05-05→2026-05-06_

### Features

- feat: enhance FENInputField with local state management and improved performance (50f274b)
- feat: add DraggablePiece component for draggable chess pieces (64975c9)
- feat: add DroppableSquare component for handling piece drops in chess (8dd5ffe)
- feat: implement InteractiveBoard component for drag-and-drop chess interactions (b5f25b2)
- feat: add PiecePalette component for draggable chess pieces (0ca9973)
- feat: add TrashZone component for handling piece removal (96a9792)
- feat: add DndProvider component for drag-and-drop functionality (5d117df)
- feat: add CustomDragLayer component for enhanced drag-and-drop functionality (be9df88)
- feat: implement ChessEditor component for interactive chess editing (9ae2a97)
- feat: add PieceSelector component for selecting chess piece styles (864aa65)
- feat: add FENInputList and FENInputRow components for managing FEN positions (edf64d3)
- feat: add FENInputField component for FEN string input and clipboard management (f1834bb)
- feat: implement FEN parser and validation functions (a3eac2c)
- feat: add BoardPreview component for live chess position display (d19dc24)
- feat: add entry point for the application with routing and styling (4bd0ade)
- feat: implement main application component with theme management and routing (3e86261)
- feat: add vite-env.d.ts for Vite client type references (f93dbeb)
- feat: add TypeScript index files for components in Fen and interactions directories (6f41bc2)
- feat: update file extensions in Vite configuration for TypeScript support (d8f8b6c)
- feat: add TypeScript types for Node, React, and ReactDOM to enhance type safety (e64a4c1)
- feat: add TypeScript configuration files for project setup (87b44d1)
- feat: add useRef for pieceImages in ChessEditor to optimize image handling (067ce45)
- feat: optimize CustomDragLayer for smoother drag animations and improved performance (65ccb31)
- feat: update Navbar component to accept rightSlot prop and adjust layout styles (8a57ffe)
- feat: enhance NotificationContainer with dynamic notification duration and improved animations (111f169)
- feat: export LayoutProvider and useLayout from LayoutContext (32ecebd)
- feat: add LayoutContext for managing navbar state (ae2ce7b)

### Bug Fixes

- fix: increase delayTouchStart in touchBackendOptions for improved responsiveness (fc7c71a)
- fix: remove 'unsafe-inline' from Content-Security-Policy for improved security (13f7caa)
- fix: update script source in index.html to use TypeScript entry point (ea6fd22)
- fix: increase default notification duration for better visibility (f71d58d)
- fix: update notification handling to include warning type (dece837)
- fix: update pre-commit script to use pnpm for lint-staged execution (6eb114b)
- fix: update commit message validation to use pnpm for consistency (b22555c)

### Refactors

- refactor: remove DroppableSquare component to simplify codebase (5bb65cc)
- refactor: remove DraggablePiece component to simplify codebase (fd5b77f)
- refactor: remove DndProvider component to simplify codebase (b36b337)
- refactor: remove PieceSelector component to simplify codebase (fec45e4)
- refactor: remove PiecePalette component to simplify codebase (8c634c4)
- refactor: remove TrashZone component to simplify codebase (386de3e)
- refactor: remove InteractiveBoard component to simplify codebase (24b0dc0)
- refactor: remove CustomDragLayer component to simplify codebase (94a3883)
- refactor: remove ChessEditor component to simplify codebase (e440fd9)
- refactor: remove FENInputList component to simplify codebase (c5fe723)
- refactor: remove FENInputField component to simplify codebase (4daf9a4)
- refactor: remove BoardPreview component to simplify codebase (2c0915e)
- refactor: remove fenParser.js to simplify utility functions (3ed7646)
- refactor: remove App.jsx to simplify application structure (26203b1)
- refactor: remove index.jsx file to streamline entry point (9a6556e)
- refactor: remove index.js files for components in the Fen and interactions directories (f6a24e0)
- refactor: simplify piece image assignment in InteractiveBoard component (cd75ce1)
- refactor: code structure for improved readability and maintainability (8295e4d)

**Commits:** 55 · **Range:** `c70e223..2c9c8f8` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.2.0)

## [v5.1.0] - Theme preset cap & tooling churn

_Authored: 2026-05-04_

### Features

- feat: add theme edit controls with apply and cancel functionality in SettingsPage (e7e142a)

### Bug Fixes

- fix: update MAX_TOTAL_PRESETS to allow for more theme options (c70e223)
- fix: import DndProvider in HomePage for drag-and-drop functionality (2d9fff2)
- fix(validation): update MAX_FEN_LENGTH to enforce correct FEN string limits (77ed13d)
- fix(AdvancedFENInputPage): enforce FEN length limits and improve layout for better usability (2dd9ba3)

### Refactors

- refactor: enhance PaginationDots component with disabled state handling for pagination buttons (3e4c473)
- refactor: enhance ThemeCustomization component with pagination and improved state management (1ea5a87)
- refactor: streamline preset loading and saving logic for improved consistency (138bc63)
- refactor: implement feature X to enhance user experience and fix bug Y in module Z (fc93909)

### Chores

- chore: refine button styles and transitions in FENHistoryPage for improved UI consistency (b65c987)
- chore: update layout and styling in DownloadPage for improved responsiveness and user experience (c592562)
- chore: update layout and styling in AboutPage for improved responsiveness and user experience (6f175bd)
- chore: implement pending board state management for piece removal and updates (1a4a814)
- chore: refine page transition effects for smoother animations and improved user experience (12c94f1)
- chore: update layout and styling in HomePage for improved responsiveness and user experience (37f719d)
- chore: refine transition effects and styling in PresetCard for improved user experience (2e5f1c4)
- chore: improve styling and transitions in ThemeCustomization for better user experience (d56be78)
- chore: enhance button styles with smoother transitions and improved hover effects (d5e56ac)
- chore: refine transition effects in SearchableSelect for improved performance and user experience (824a1f6)
- chore: update animation effects in Toast component for smoother transitions (ea19723)
- chore: refine styling and animations in ErrorFallback component for improved user experience (c11afa8)
- chore: add animation to dropdown in CustomSelect component for enhanced user experience (fe3d749)
- chore: enhance Navbar with mobile menu functionality and improved styling (f008646)
- chore: remove scale effect from TrashZone hover state for consistent styling (758494a)
- chore: update transition effects in PiecePalette for improved hover responsiveness (c2b1ab1)
- chore: simplify InteractiveBoard component by removing unused props and optimizing drop handling (40c81b4)
- chore: update transition duration for opacity in DraggablePiece component (ac0885f)
- chore: refactor DndProvider to improve touch device detection and backend options (6290440)
- chore: enhance ChessEditor responsiveness with dynamic board and gutter sizes (b23cae0)
- chore: update transition durations for improved performance and consistency in UserGuide component (69397e8)
- chore: add animations to Help Center drawer for improved user experience (4b94490)
- chore: set maxLength for FEN input field to enforce FEN string length limit (5d75cc5)
- chore: update grid layout and button transition styles for improved responsiveness and consistency (9973849)
- chore: enforce FEN length limit in handleFenChange and handlePasteFEN for improved validation (e6379f5)
- chore: update hover effects for ThemePresetButton and CustomThemeCard for improved user interaction (4cd10cc)
- chore: refine SelectedPreview styles for improved hover effects and transitions (b60153f)
- chore: update button styles for consistent transition effects (6dcb72b)
- chore: update ColorSwatch styles for improved hover effects and transitions (00dd80c)
- chore: refine button styles for consistent transition effects and improved accessibility (69326e9)
- chore: update ActionButtons styles for improved layout and transition effects (3d4dce6)
- chore: refine animation durations and easing for smoother transitions (5a7331c)
- chore: enhance layout styles for improved responsiveness and transition effects (ee52a80)
- chore: update Tailwind CSS configuration with new breakpoints and animation timings (1f251f1)
- chore: implement feature X to enhance user experience and fix bug Y in module Z (c54d16c)
- chore: add @craco/craco to devDependencies for enhanced configuration (57db913)

**Commits:** 59 · **Range:** `33907a4..c70e223` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.1.0)

## [v5.0.15] - Dependabot — @commitlint/cli 20.5.3

_Authored: 2026-05-04_

### Chores

- chore(deps-dev): bump @commitlint/cli from 20.5.2 to 20.5.3 (573fcc0)

**Commits:** 2 · **Range:** `3ef0a67..33907a4` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.15)

## [v5.0.14] - Dependabot — globals 17.6.0

_Authored: 2026-05-04_

### Chores

- chore(deps-dev): bump globals from 17.5.0 to 17.6.0 (41f5f46)

**Commits:** 2 · **Range:** `a7a2f17..3ef0a67` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.14)

## [v5.0.13] - Dependabot — lucide-react 1.14.0

_Authored: 2026-05-04_

### Chores

- chore(deps): bump lucide-react from 1.11.0 to 1.14.0 (52fdc6e)

**Commits:** 2 · **Range:** `73fc992..a7a2f17` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.13)

## [v5.0.12] - Dependabot — postcss 8.5.13

_Authored: 2026-05-02→2026-05-04_

### Refactors

- refactor(HomePage): remove unused layout components for cleaner structure (0c56626)

### Chores

- chore(deps-dev): bump postcss from 8.5.12 to 8.5.13 (5e7f438)

**Commits:** 6 · **Range:** `7d69b38..73fc992` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.12)

## [v5.0.11] - PR #54 merge

_Authored: 2026-05-02_

**Commits:** 1 · **Range:** `c185c73..7d69b38` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.11)

## [v5.0.10] - Bug fixes & master merge

_Authored: 2026-05-02_

### Bug Fixes

- fix(dnd): fix touch device detection to restore HTML5Backend on desktop (5c42474)
- fix(drag-layer): use currentOffset centered on cursor for drag preview (cdc1b84)
- fix(advanced-fen): add maxLength to FEN input fields in PositionsTab (17a20c4)
- fix(advanced-fen): allow empty value in updateFen to unblock input clearing (aff0351)
- fix(export): add validateFEN guard before PNG/JPEG/clipboard export (d83c400)
- fix(optimizer): replace hardcoded 16384 canvas cap with UA-aware detection (d3bc51f)
- fix(canvas): throw on empty board parse result in createUltraQualityCanvas (681e063)
- fix(fen): enforce MAX_FEN_LENGTH in getFENValidationError via length guard (16b9ac9)
- fix(export): add validateFEN guard before PNG/JPEG/clipboard export (f6d7348)
- fix: reorder font stack in CSS variable for improved consistency (2bd93e3)
- fix: improve button hover effects and animation in Navbar component (1443ca8)
- fix: update height calculation in HomePage component for improved responsiveness (3d015c6)

**Commits:** 13 · **Range:** `4032208..c185c73` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.10)

## [v5.0.9] - Sound playback & AudioContext lifecycle fixes

_Authored: 2026-04-29_

### Bug Fixes

- fix: enhance sound playback functionality and manage AudioContext lifecycle (4032208)
- fix: clean up import formatting and improve value memoization in FENBatchProvider (b201e75)
- fix: update animation styles in Toast component for improved visual effect (ecd6661)
- fix: enhance FEN history management with improved persistence and cleanup (10ab14d)
- fix: simplify value handling in useLocalStorage for clarity (5447768)
- fix: optimize theme history management in applyTheme and applyCustomTheme functions (67a8365)
- fix: refactor piece images handling to use ref for improved performance (63cc39c)
- fix: reformat ThemeCustomization component for improved readability and consistency (838228d)
- fix: reformat route definitions for improved readability and consistency (e6ff659)
- fix: update Modal component structure for improved accessibility and animation handling (dec6c39)
- fix: add willReadFrequently option to canvas context for improved performance (33d0629)
- fix: format Card component's div for improved readability (1c265ec)
- fix: remove unnecessary line breaks in Badge component for improved readability (39d6f94)
- fix: improve readability of TrashZone component by formatting span element (1100d33)
- fix: update zIndex handling in DraggablePiece for improved drag visibility (862a8c7)
- fix: update styles in UserGuide for improved consistency and readability (49b2f79)
- fix: remove unnecessary whitespace in HelpCenterDrawer for cleaner code (fcf57dd)
- fix: update styles in FENInputRow and FENInputList for improved consistency and readability (5753086)
- fix: update styles in BoardPreview for improved consistency and readability (44e42a6)
- fix: format label display in ThemeSettingsView for improved readability (8160871)
- fix: remove inline styles from HueSlider for improved maintainability (8c351de)
- fix: update styles in PickerModal for improved responsiveness and accessibility (6d77d53)
- fix: optimize canvas context for improved performance in ColorPicker.jsx (5274d0c)
- fix: optimize canvas resizing and rendering in ChessBoard.jsx (da96c90)
- fix: enhance piece alt text for accessibility in BoardSquare.jsx (c6a3884)
- fix: streamline classNames object for improved readability in classNames.js (60e72e6)
- fix: refactor arePropsEqual function for improved performance and clarity in BoardGrid.jsx fix: enhance font fallback and adjust CSS variables in index.css (72e54d9)
- fix: improve formatting and readability in App.jsx (0a09ed1)
- fix: enhance formatting and clarity in LINTING_SETUP.md (f3b39f0)
- fix: improve table formatting and whitespace in DESIGN_ERRORS_ANALYSIS.md (58bbc15)
- fix: improve formatting and whitespace in KNOWN_ISSUES.md (5e44fa1)
- fix: improve table formatting in STATE_MANAGEMENT.md (3b98e6d)
- fix: improve formatting and whitespace in FEN.md (7ee597e)
- fix: improve table formatting in FAQ.md (85a41f0)
- fix: improve table formatting in EXPORT_PIPELINE.md (3ea345a)
- fix: clean up formatting and whitespace in CHANGELOG.md (63d8f23)
- fix: improve table formatting in ARCHITECTURE.md (67ba681)
- fix: correct quotation style in CodeQL analysis category (f38b419)
- fix: correct formatting of Technology Stack section in README.md (710ef86)
- fix: remove redundant line from feature request template (48a1815)
- fix: remove unnecessary line from bug report template (e13e307)
- fix: correct formatting of Migration Guide section in pull request template (92a6dd7)
- fix: correct formatting of commit message guidelines in CONTRIBUTING.md (f88f607)
- fix: correct formatting inconsistencies in CODE_OF_CONDUCT.md (b2f8bc5)

### Refactors

- refactor: simplify InteractiveBoard component structure for improved readability (a18c9a4)
- refactor: extract drag state selection logic into a separate function for improved readability (e0b9f22)
- refactor: implement feature X to enhance user experience and optimize performance (18c6203)
- refactor: improve performance by updating font loading strategy in index.html (9dff17e)
- refactor: add onPieceImagesChange prop to HomePage component (9259b8e)

**Commits:** 49 · **Range:** `8b76902..4032208` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.9)

## [v5.0.8] - Dependabot — @commitlint/cli 20.5.2

_Authored: 2026-04-26→2026-04-27_

### Chores

- chore(deps-dev): bump @commitlint/cli from 20.5.0 to 20.5.2 (47874af)

**Commits:** 2 · **Range:** `ad94bc8..8b76902` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.8)

## [v5.0.7] - Dependabot — react-router-dom 7.14.2

_Authored: 2026-04-26→2026-04-27_

### Chores

- chore(deps): bump react-router-dom from 7.14.1 to 7.14.2 (98a8856)

**Commits:** 2 · **Range:** `85a1884..ad94bc8` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.7)

## [v5.0.6] - Dependabot — lucide-react 1.11.0

_Authored: 2026-04-26→2026-04-27_

### Chores

- chore(deps): bump lucide-react from 1.8.0 to 1.11.0 (01c3838)

**Commits:** 2 · **Range:** `5f822d1..85a1884` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.6)

## [v5.0.5] - Dependabot — postcss 8.5.12

_Authored: 2026-04-26→2026-04-27_

### Chores

- chore(deps-dev): bump postcss from 8.5.10 to 8.5.12 (14c5b92)

**Commits:** 2 · **Range:** `040cdd9..5f822d1` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.5)

## [v5.0.4] - Chess viewer student polish

_Authored: 2026-04-26→2026-04-27_

### Bug Fixes

- fix: polish export flow and settings (40678fb)

**Commits:** 9 · **Range:** `10b2c8c..040cdd9` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.4)

## [v5.0.3] - Chess viewer cleanup

_Authored: 2026-04-26_

### Bug Fixes

- fix: improve export sizing and drag preview (a164c67)

**Commits:** 2 · **Range:** `bb9ac0b..10b2c8c` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.3)

## [v5.0.2] - Dependabot — @vitejs/plugin-react 5.2.0

_Authored: 2026-04-19_

### Chores

- chore(deps-dev): bump @vitejs/plugin-react from 4.5.2 to 5.2.0 (ca7df5b)

**Commits:** 2 · **Range:** `a299cd2..bb9ac0b` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.2)

## [v5.0.1] - Dependabot — eslint/js 9.39.4

_Authored: 2026-04-18→2026-04-19_

### Chores

- chore(deps-dev): bump @eslint/js from 9.39.2 to 9.39.4 (cd4e1cd)
- chore: refactor CodeQL workflow for improved analysis configuration (d32429a)

**Commits:** 4 · **Range:** `93e2bb2..a299cd2` · [GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.1)

## [v5.0.0] - Export Engine Overhaul

_Released: 2026-04-17_

### Features

- Advanced FEN Editor at `/advanced-fen` with multi-position management, Positions and Preview/Export tabs
- Batch export across PNG, JPEG, and SVG
- Slideshow playback with configurable interval
- FEN History: Archive tab to move positions out of active view without deletion
- FEN History: reactivate archived positions at any time
- FEN History: freshness indicators (Fresh / Aging / Stale) with timestamps
- Theme Studio with 20 preset board themes and 2 custom slots
- Custom Color Mixer with independent Light Square / Dark Square controls and hue canvas
- Export Customization: board size selector (4×4 / 6×6 / 8×8 / Custom cm)
- Export Customization: file name input
- Export Customization: print quality tiers (Print 8×, Print 16×, Social 24×, Max 32×)
- Help Center: searchable in-app help panel covering all major features
- Light / Dark mode with persistent theme preference

### Bug Fixes

- Critical export dimension bug: board size selection now correctly maps to pixel output across all quality tiers (e.g. Print 8× @ 4cm → 3,776px; @ 6cm → 5,664px; @ 8cm → 7,552px)
- Incorrect property access in `getExportInfo` (`baseSizeCm` → `physicalSizeCm`, `dpi` → `effectiveDPI`)
- Coordinate label borders no longer appear in exported images
- Coordinate positioning scales proportionally with board dimensions
- Circular export dependencies across component index files resolved
- React build errors caused by incorrect component export patterns resolved

### Code Quality

- Comprehensive JSDoc documentation added across the codebase
- Standardized import ordering in all source files
- Markdown documentation rewritten in professional technical style
- Low-value inline comments removed
- Export dimension logic extracted into a dedicated scaling utility

[GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v5.0.0)

---

## Historical releases (v1.x – v4.x)

> Reformatted from the original GitHub Release notes into the project's standard Keep-a-Changelog layout. Original wording has been condensed; refer to the linked GitHub Release for the author's full prose. Repository was renamed from `chess_viewer` to `chess-vision` during the v4.x line.

## [v4.0.0] - PWA Support

_Released: 2026-02-02_

### Features

- Service Worker with offline-first caching via Workbox
- Web App Manifest with app icons (192x192, 512x512, maskable) and metadata
- Installable as a native-like app on desktop and mobile
- Full offline functionality
- Theme color metadata for native app experience
- Intelligent caching of static assets

### Performance

- Service worker precaching improves first-load and repeat-visit performance
- Build configuration updated for PWA features

[GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v4.0.0)

## [v3.5.4] - Accessibility, performance & modal fixes

_Released: 2026-02-01_

### Features

- Accessibility improvements across modals, buttons, and board components
- Performance optimizations on board rendering

### Bug Fixes

- Modal focus management corrected
- Board redraw inefficiencies addressed

[GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v3.5.4)

## [v3.5.3] - Tab-Based Modal Refactor & Code Quality

_Released: 2026-01-23_

### Features

- Tab-based Advanced FEN Input modal: Positions, Preview, Export tabs
- Modal sized down from `max-w-6xl` to `max-w-2xl` for better focus
- Compact header with integrated navigation
- Improved mobile responsiveness on the modal

### Bug Fixes

- Resolved merge conflicts in `HueSlider.jsx` and `colorUtils.js`
- Removed duplicate return statement in color utilities
- Fixed `lightSquare`/`darkSquare` prop passing in modals

### Code Quality

- All 16 ESLint warnings resolved (unused variables, array index keys)
- Array index keys replaced with unique identifiers
- Unused props prefixed with underscore
- Consistent single-quote string formatting

### Known Issues at Release

- ThemeModal live preview did not update
- AdvancedFENInputModal board preview did not render

[GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v3.5.3)

## [v3.5.2] - Bug Fixes & Accessibility Improvements

_Released: 2026-01-18_

### Features

- ErrorBoundary component with user-friendly fallback UI
- Logger utility (`src/utils/logger.js`) for development-only logging
- Centralized error handler (`src/utils/errorHandler.js`)
- ARIA labels on Modal, Button, ActionButtons, ChessBoard
- Focus trap in Modal components for keyboard navigation

### Bug Fixes

- 74 `console.log`/`console.error` statements replaced with logger utility
- Memory leaks fixed via `setTimeout` cleanup refs
- Board coordinate misalignment corrected in display and export
- Coordinate positioning fixed in exported images
- Clipboard paste of FEN notation restored
- Canvas overflow on mobile devices resolved
- React memo comparison functions corrected to prevent re-renders

### Code Quality

- Modal: `role="dialog"`, `aria-modal`, `aria-labelledby`
- Button: `aria-label` prop, `aria-disabled` attribute
- ChessBoard: `role="img"` with dynamic board description

[GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v3.5.2)

## [v3.5.1] - Export rendering & visual polish

_Released: 2026-01-04_

### Bug Fixes

- Critical export issue where chess pieces were not rendered correctly in PNG/JPEG exports

### Features

- Larger, bolder fonts for coordinate readability
- Increased chess piece size for clearer board visualization
- Subtle border around the chessboard for visual definition

[GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v3.5.1)

## [v3.5.0] - Performance, Stability & Polish

_Released: 2026-01-03_

### Features

- Faster export pipeline
- Improved color picker accuracy
- Improved mobile responsiveness
- Smoother UI interactions

### Bug Fixes

- FEN parsing edge cases
- Export scaling issues
- Cross-browser UI inconsistencies

### Code Quality

- Extensive use of `React.memo`
- Optimized hooks and utilities
- Cleaner folder structure
- Reduced bundle size

[GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v.3.5.0)

## [v3.0.0] - Ultra-HD Export & Power Features

_Released: 2026-01-03_

### Features

- Advanced color picker with HEX, RGB, and HSL inputs
- FEN history with auto-save
- Favorite positions
- Famous classical positions library

### Code Quality

- Component structure refactored along Atomic Design principles
- Improved canvas scaling logic

[GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v3.0.0)

## [v2.0.0] - Customization & UX Upgrade

_Released: 2026-01-03_

### Features

- Custom light and dark square colors
- Multiple board themes
- Improved piece selector
- Responsive layout improvements

### Bug Fixes

- Improved FEN validation
- Control panel UX corrections

### Performance

- Reduced unnecessary re-renders
- Optimized board redraw logic

[GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v.2.0.0)

## [v1.0.0] - Initial Stable Release

_Released: 2026-01-03_

### Features

- Full FEN notation support
- Interactive chessboard renderer
- Multiple piece styles
- Board flip and coordinate toggle
- Real-time board updates
- PNG and JPEG export
- High-quality canvas rendering
- Custom board size control

### Tech Stack

- React 18
- Tailwind CSS
- HTML5 Canvas

[GitHub Release](https://github.com/BilgeGates/chess-vision/releases/tag/v1.0.0)
