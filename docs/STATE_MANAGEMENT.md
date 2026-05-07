# State Management Documentation

Guide to state management architecture in FENForsty Pro.

---

## Table of Contents

- [Overview](#overview)
- [State Categories](#state-categories)
- [Global State — Context API](#global-state--context-api)
- [Hook-Based State](#hook-based-state)
- [Component State](#component-state)
- [State Persistence](#state-persistence)
- [Derived State](#derived-state)
- [Performance Optimisations](#performance-optimisations)
- [Best Practices](#best-practices)

---

## Overview

FENForsty Pro uses **React hooks and the Context API exclusively** for state management. No external state libraries (Redux, Zustand, MobX, etc.) are used.

**Reasons:**

- Application state complexity is well within React's built-in scope
- Smaller bundle size
- No additional abstractions for contributors to learn
- Context covers the two pieces of cross-tree state (theme settings, FEN batch list)

---

## State Categories

```
State
│
├── Component State (useState)
│   ├── Modal open/closed flags
│   ├── Form field values
│   └── Temporary / ephemeral UI state
│
├── Cross-Tree State (Context API)
│   ├── ThemeSettingsContext  — color picker preferences, recent colors
│   └── FENBatchContext       — batch FEN list
│
├── Persisted State (localStorage)
│   ├── FEN history            (key: 'fen-history')
│   ├── FEN history archive    (key: 'fen-history-archive')
│   ├── Board theme colors     (key: 'chess-light-square', 'chess-dark-square')
│   ├── Theme settings         (key: 'themeSettings')
│   ├── Recent colors          (key: 'recentColors')
│   ├── Batch FEN list         (key: 'fenBatchList')
│   └── App color scheme       (key: 'chess-theme' → 'light' | 'dark')
│
└── Derived State (useMemo)
    ├── Parsed FEN → 8×8 board array
    ├── Filtered / sorted history list
    └── Computed colour values
```

---

## Global State — Context API

### ThemeSettingsContext

**File:** `src/contexts/ThemeSettingsContext.jsx`  
**Hook:** `useThemeSettings()`

Manages color-picker UI preferences and the list of recently used colors. Does **not** manage board square colors (those are handled by `useTheme`).

**Default settings:**

```javascript
const defaultSettings = {
  autoApply: false,
  showRGB: true,
  enableAnimations: true,
  showColorNames: false,
  enableKeyboardShortcuts: true,
  showHexValues: true,
  enableSoundEffects: false,
  compactMode: false,
  showRecentColors: true,
  enableColorBlindMode: false
};
```

**Side effects applied to `<html>`:**

| Setting                      | DOM effect                                                |
| ---------------------------- | --------------------------------------------------------- |
| `enableAnimations: false`    | Adds `no-animations` class; sets `--transition-speed: 0s` |
| `compactMode: true`          | Adds `compact-mode` class                                 |
| `enableColorBlindMode: true` | Adds `color-blind-mode` class                             |

**Provided values:**

| Value                       | Type     | Description                  |
| --------------------------- | -------- | ---------------------------- |
| `settings`                  | object   | Current settings object      |
| `updateSetting(key, value)` | function | Update one setting           |
| `updateSettings(obj)`       | function | Replace full settings object |
| `resetSettings()`           | function | Restore defaults             |
| `recentColors`              | string[] | Up to 12 recent hex colors   |
| `addRecentColor(hex)`       | function | Prepend color, trim to 12    |
| `clearRecentColors()`       | function | Clear recent colors list     |
| `playSound(type)`           | function | Play UI sound (if enabled)   |

**Persistence:** settings and recentColors are written to localStorage on every change.

---

### FENBatchContext

**File:** `src/contexts/FENBatchContext.jsx`  
**Hook:** `useFENBatch()`

Manages the ordered list of FEN strings used for batch export on the Advanced FEN Input page.

**Provided values:**

| Value                         | Type               | Description                        |
| ----------------------------- | ------------------ | ---------------------------------- |
| `batchList`                   | string[]           | Current list of valid FEN strings  |
| `addToBatch(fen)`             | function → boolean | Add FEN if valid and not duplicate |
| `removeFromBatch(index)`      | function           | Remove entry by index              |
| `clearBatch()`                | function           | Empty the list                     |
| `updateBatchItem(index, fen)` | function → boolean | Replace entry if valid             |

**Persistence:** `batchList` is written to `localStorage` key `'fenBatchList'` on every change.

**Validation:** Every write checks `validateFEN(fen)` before accepting the value.

---

## Hook-Based State

### useChessBoard

**File:** `src/hooks/useChessBoard.js`

Simple memoised FEN parser. Does **not** hold multiple state values — it takes a `fen` string and returns a stable `board` array.

```javascript
// Signature
function useChessBoard(fen: string): string[][]

// Usage
const board = useChessBoard(fen); // 8×8 array, '' = empty square
```

Returns `createEmptyBoard()` on invalid or empty FEN.

---

### useTheme

**File:** `src/hooks/useTheme.js`

Manages board square colors (light square color and dark square color), current theme name, and theme change history.

**Returned values:**

| Value                 | Type     | Description                                     |
| --------------------- | -------- | ----------------------------------------------- |
| `lightSquare`         | string   | Hex color for light squares (default `#f0d9b5`) |
| `darkSquare`          | string   | Hex color for dark squares (default `#b58863`)  |
| `currentTheme`        | string   | Name of active theme preset or `'custom'`       |
| `themeHistory`        | object[] | Recent theme changes                            |
| `setLightSquare(hex)` | function | Update light square color                       |
| `setDarkSquare(hex)`  | function | Update dark square color                        |
| `applyTheme(preset)`  | function | Apply a named theme preset                      |

**Persistence:** Colors saved to `localStorage` keys `'chess-light-square'` and `'chess-dark-square'`. Also attempts cloud storage via `window.storage` if available.

**Cross-tab sync:** Listens to the `storage` event to keep color state consistent across browser tabs.

---

### useFENHistory

**File:** `src/hooks/useFENHistory.js`

The most complex hook in the codebase. Manages the full FEN history lifecycle including active entries, archiving, filtering, and drag-session tracking.

**Parameters:**

```javascript
const historyApi = useFENHistory(fen, onFavoriteStatusChange);
```

**Key returned values:**

| Value                        | Description                    |
| ---------------------------- | ------------------------------ |
| `fenHistory`                 | Current active history entries |
| `archive`                    | Archived (inactive) entries    |
| `filters` / `archiveFilters` | Active filter state            |
| `isLoadingArchive`           | Async loading flag             |
| `addToHistory(fen)`          | Add new FEN entry              |
| `toggleFavorite(id)`         | Mark/unmark as favorite        |
| `removeEntry(id)`            | Delete entry                   |
| `clearHistory()`             | Delete all entries             |
| `archiveEntries(ids)`        | Move entries to archive        |
| `reactivateEntry(id)`        | Move archived entry back       |
| `filteredHistory`            | Memoised filtered list         |
| `startDragSession(fen)`      | Begin inactivity timer (60s)   |
| `endDragSession()`           | Commit drag session to history |

**Persistence:** History is written to `localStorage` key `'fen-history'` with a 300ms debounce. Archive is managed separately via `archiveManager.js`.

**Auto-archival:** Inactive entries are automatically moved to the archive by `performAutoArchival` on a periodic timer.

---

### useInteractiveBoard

**File:** `src/hooks/useInteractiveBoard.js`

Manages the 8×8 board array for the drag-and-drop board editor (`ChessEditor`).

**Parameters:**

```javascript
const api = useInteractiveBoard(initialFen, onFenChange);
```

**Key returned values:**

| Value                       | Description                                   |
| --------------------------- | --------------------------------------------- |
| `board`                     | Current 8×8 board array                       |
| `boardKey`                  | Incremented key that forces re-mount on reset |
| `syncFromFen(fen)`          | Update board from external FEN change         |
| `movePiece(from, to)`       | Move piece between squares                    |
| `placePiece(square, piece)` | Place piece on square                         |
| `removePiece(square)`       | Remove piece from square                      |
| `clearBoard()`              | Empty all squares                             |
| `resetBoard(fen)`           | Reset to a given FEN                          |

Internally converts the board array to FEN using `boardUtils.boardToFEN` and calls `onFenChange` whenever the position changes.

---

### useColorState

**File:** `src/hooks/useColorState.js`

Local state for a single color picker instance.

**Returned values:** `hexInput`, `tempColor`, `copiedText`, `activePalette`, `isOpen`, and handlers: `handleColorSelect`, `handleRandom`, `handleReset`, `handleCopy`, `toggleOpen`, `closeModal`.

---

### Other Hooks

| Hook                      | Purpose                                                          |
| ------------------------- | ---------------------------------------------------------------- |
| `useCanvasPicker`         | Canvas-based color sampling from chess board                     |
| `useColorConversion`      | HSV ↔ RGB ↔ Hex color format conversion                          |
| `useLocalStorage`         | Generic typed localStorage getter/setter with JSON serialisation |
| `useNotifications`        | Toast notification queue (add, dismiss, auto-expire)             |
| `useOutsideClick`         | Ref + event listener for detecting clicks outside an element     |
| `usePieceImages`          | Loads and caches all piece SVG images for the selected piece set |
| `usePerformance`          | Optional performance timing markers (dev only)                   |
| `useScrollLock`           | Locks `<body>` scroll when a modal is open                       |
| `useIntersectionObserver` | Wrapper for `IntersectionObserver` used in virtualised lists     |

---

## Component State

Modal visibility, form field values, and other ephemeral UI state are kept as `useState` local to the component that owns them. Examples:

```javascript
// Modal open/close
const [isExportModalOpen, setIsExportModalOpen] = useState(false);

// Form input
const [fenInput, setFenInput] = useState('');

// Dropdown
const [selectedFormat, setSelectedFormat] = useState('png');
```

---

## State Persistence

All persistence uses `localStorage`. On pages that also support an optional `window.storage` interface (a cloud storage shim), both are written with localStorage as the guaranteed fallback.

| localStorage Key      | Owner Hook / Context   | Data                             |
| --------------------- | ---------------------- | -------------------------------- |
| `chess-theme`         | `App.tsx`              | `'light'` or `'dark'`            |
| `chess-light-square`  | `useTheme`             | Hex color string                 |
| `chess-dark-square`   | `useTheme`             | Hex color string                 |
| `themeSettings`       | `ThemeSettingsContext` | Settings object (JSON)           |
| `recentColors`        | `ThemeSettingsContext` | Array of hex strings (JSON)      |
| `fenBatchList`        | `FENBatchContext`      | Array of FEN strings (JSON)      |
| `fen-history`         | `useFENHistory`        | Array of history entries (JSON)  |
| `fen-history-archive` | `archiveManager`       | Array of archived entries (JSON) |

---

## Derived State

Expensive computations are memoised with `useMemo` to avoid redundant recalculation:

```javascript
// FEN → board array (useChessBoard)
const board = useMemo(() => parseFEN(fen), [fen]);

// History filtering (useFENHistory)
const filteredHistory = useMemo(
  () => applyFilters(fenHistory, filters),
  [fenHistory, filters]
);

// Color conversion (useColorConversion)
const rgb = useMemo(() => hexToRgb(hex), [hex]);
```

---

## Performance Optimisations

- `useCallback` on all event handlers exposed from hooks to keep stable references for memoised child components
- `useFENHistory` uses a `fenHistoryRef` to avoid stale closure issues in callbacks that would otherwise recreate on every render
- `FENBatchContext.addToBatch` has an empty dependency array — it uses a functional updater (`setBatchList(prev => ...)`) so it never needs to capture `batchList`
- History persistence is debounced 300ms to avoid thrashing localStorage on rapid state changes
- `ThemeSettingsContext` merges all DOM class mutations into a single `useEffect` keyed on `enableAnimations`, `compactMode`, and `enableColorBlindMode`

---

## Best Practices

1. **Use the provided hooks rather than reading from localStorage directly.** All persistence logic is encapsulated in the hooks and contexts.
2. **Do not put UI state inside the context.** Contexts hold only data that many components across the tree need.
3. **Always use `useCallback` for handlers passed as props** to memoised components to avoid unnecessary re-renders.
4. **Validate FEN before any state update.** All write operations in `FENBatchContext` and `useFENHistory` call `validateFEN` first.
5. **Functional updaters for cross-callback state.** When a `useCallback` with an empty dependency array needs to read state, always use `setState(prev => ...)`.

---

**Last Updated:** May 6, 2026  
**Version:** 5.0.0
