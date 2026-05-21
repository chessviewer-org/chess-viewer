# 1. Project DNA

ChessVision is a client-only React 19 + Vite chess diagram generator that parses FEN, renders a canvas board, and exports ultra-high-res images. State is React Hooks + two Contexts with localStorage persistence only, no backend, no analytics, no API calls. Styling is Tailwind CSS with themeable CSS variables and heavy memoization for performance.

# 2. Workspace Map (Where things are)

- Entry and shell: [src/index.jsx](src/index.jsx) boots; [src/App.jsx](src/App.jsx) wires providers, layout, and Navbar visibility.
- Routing: [src/routes/Router.jsx](src/routes/Router.jsx) lazy-loads pages behind a single Suspense boundary.
- Pages: [src/pages](src/pages) holds route views; advanced batch editor lives in [src/pages/AdvancedFENInputPage](src/pages/AdvancedFENInputPage).
- Components: [src/components/board](src/components/board) is canvas board UI; [src/components/features](src/components/features) are domain panels (Export, Fen, History, Theme, Help, etc.); [src/components/interactions](src/components/interactions) is drag-and-drop editor; [src/components/layout](src/components/layout) is app shell; [src/components/ui](src/components/ui) are primitives.
- Contexts: Theme settings in [src/contexts/ThemeSettingsContext.jsx](src/contexts/ThemeSettingsContext.jsx); batch FEN list in [src/contexts/FENBatchContext.jsx](src/contexts/FENBatchContext.jsx).
- Hooks: all custom hooks in [src/hooks](src/hooks); FEN history logic in [src/hooks/useFENHistory.js](src/hooks/useFENHistory.js); board parsing hook in [src/hooks/useChessBoard.js](src/hooks/useChessBoard.js); DnD editor state in [src/hooks/useInteractiveBoard.js](src/hooks/useInteractiveBoard.js).
- Core utils: FEN parse in [src/utils/fenParser.js](src/utils/fenParser.js); validation in [src/utils/validation.js](src/utils/validation.js); board to FEN in [src/utils/boardUtils.js](src/utils/boardUtils.js).
- Export pipeline: sizing math in [src/utils/coordinateCalculations.js](src/utils/coordinateCalculations.js); render in [src/utils/canvasRenderer.js](src/utils/canvasRenderer.js); orchestration in [src/utils/canvasExporter.js](src/utils/canvasExporter.js); batch export in [src/utils/advancedExport.js](src/utils/advancedExport.js); SVG export in [src/utils/svgExporter.js](src/utils/svgExporter.js).
- Storage helpers and safety: [src/utils/archiveManager.js](src/utils/archiveManager.js), [src/utils/historyUtils.js](src/utils/historyUtils.js), [src/utils/errorHandler.js](src/utils/errorHandler.js), [src/utils/logger.js](src/utils/logger.js), [src/utils/performance.js](src/utils/performance.js), [src/utils/pieceImageCache.js](src/utils/pieceImageCache.js).
- Constants and config: [src/constants](src/constants) holds chess, DnD, and theme constants.
- Docs: authoritative references in [docs](docs) including Architecture, State, Export, Performance, Accessibility, Known Issues, and Roadmap.

# 3. Development Guidelines (Strict)

- Use pnpm only; do not use npm or yarn.
- No backend, no API calls, no analytics; all state is localStorage.
- ESLint is zero-warnings; no console usage in production paths, use logger.
- React Hooks rules are strict; exhaustive deps required.
- Conventional Commits enforced by commitlint + Husky.
- Tailwind CSS only; honor existing design tokens and CSS variable theming.
- localStorage keys: chess-theme, chess-light-square, chess-dark-square, themeSettings, recentColors, fenBatchList, fen-history, fen-history-archive.
- Export limits: 24x/32x may exceed Safari canvas limits; print mode is DPI-accurate; social mode is fixed pixel size with forced coordinates.
- Security hardening: CSP is strict, inline scripts removed, localStorage parsing uses safeJSONParse, MAX_FEN_LENGTH enforced.
- Accessibility is partial; canvas is not screen-reader accessible; do not claim WCAG compliance.
- Tests exist only for FEN parser; no component test harness.

# 4. RESOURCE CONSERVATION DIRECTIVE (CRITICAL)

- NEVER use find, grep, or cat to explore the workspace blindly. Use the Workspace Map above to go directly to the target file.
- ALWAYS ask for permission before modifying multiple files.
- Keep your responses short, outputting ONLY the modified code.

# 5. The "3-Stage Agentic Workflow"

Whenever you are asked to build a new feature or fix a bug, you MUST internally process the task through these 3 personas before giving the final output:

1. [FE Designer]: Check how the change impacts UI/UX. Ensure it follows responsive design (mobile/desktop) and Tailwind constraints.
2. [Code Optimizer]: Review the logic. Can this function be written with better performance? Are we using useMemo/useCallback correctly to prevent re-renders?
3. [QA Engineer]: Mentally test the code. Does this break existing FEN logic? Are there edge cases? If you find an error in your own thought process, fix it before responding.

Do NOT scan the entire project for logic explanations. If you are asked to modify the FEN parser, Canvas Exporter, or History state, you MUST first read docs/TECH_DECISIONS.md... Otherwise, ignore that file to save context tokens.
