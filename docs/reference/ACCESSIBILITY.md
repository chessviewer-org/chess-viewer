# Accessibility

Current accessibility status of ChessVision. This document is honest about what exists and what does not.

---

## Summary

The interactive board editor is now operable end-to-end without a mouse: it exposes a screen-reader model of the position (an `aria-live` description plus per-square `role="gridcell"` labels) **and** a full keyboard interaction model — a roving cursor, pick-up/place, and remove — that is a complete alternative to drag-and-drop. App-wide arrow/page/home/end/space keyboard scrolling works on every route, including the content routes (About, Settings, FEN history) whose scroll lives on an inner column rather than the shell — the scroll-container resolver now finds those, fixing the earlier "arrow keys do nothing" gap. Numeric controls (e.g. the export board size) are adjustable from the keyboard and properly labelled. Drag-and-drop is also fixed for touch devices: the DnD backend is selected by device capability (TouchBackend on touch, HTML5Backend on mouse/pen) and vertical finger swipes scroll the page instead of being swallowed by the board.

---

## What Is Implemented

### Keyboard Navigation

- Tab / Shift+Tab — move between focusable elements
- Enter / Space — activate buttons and checkboxes
- Escape — close modals
- **Arrow Up/Down, PageUp/PageDown, Home/End, Space — scroll the page on every
  route.** Mounted app-wide via `usePageScrollKeys`
  (`src/shared/hooks/usePageScrollKeys.ts`, called once in `App.tsx`). It resolves
  the active scroll region via `getScrollContainer` (`src/shared/utils/pageScroll.ts`)
  in this order: (1) the nearest scrollable ancestor of the focused element;
  (2) an explicit `[data-page-scroll]` container if it overflows; (3) the shell
  `#main-content` overflow if it overflows; (4) the largest scrollable descendant
  inside `#main-content`; (5) the document/window (mobile).
  - **Fix (June 2026):** steps 2 and 4 were added because the resolver previously
    only looked at `#main-content` or a `<main>` landmark. On the highest-traffic
    content routes (About, Settings) the scroll actually lives on an inner `<div>`
    that owns `lg:overflow-y-auto`, so `#main-content` itself never overflows and
    the keys silently did nothing. About/Settings/FEN-history now carry
    `data-page-scroll`, and the descendant scan catches any future page whose
    scroll lives on an anonymous element.
  - Suppressed while typing in a field, inside an open dialog/listbox/menu, while
    a control that owns the arrow keys has focus (the board grid, range sliders,
    identified via `data-arrow-keys="self"`), or when another handler already
    claimed the key (`event.defaultPrevented` — e.g. a settings tablist or accent
    radiogroup roving-arrow), so the page never double-acts.
- Editor action shortcuts (`useEditorKeyboard`): `F` flip · `Ctrl/Cmd+Z` undo ·
  `Ctrl/Cmd+Y` / `Ctrl/Cmd+Shift+Z` redo · `Delete`/`Backspace` remove the
  selected piece · `Escape` clear selection.
- **Numeric / stepped controls are keyboard-adjustable without the mouse:**
  - The export wizard's **custom board size** (`ExportSettingsStep.tsx`) is a
    native `<input type="number" step="0.1">` — Arrow Up/Down (and the platform
    stepper) increment/decrement by the step. It now carries an `aria-label`
    (field name + 4–16 cm range), `aria-invalid`, and an `aria-describedby` /
    `role="alert"` link to its validation message.
  - All other "pick a number" controls (resolution `1x–4x`, board-size presets
    `4/8/12 cm`, export quality) are real `<button>`s in a group, operated with
    Tab + Enter/Space — no mouse required.
  - Settings choosers (accent colour, board colour preset) are `role="radiogroup"`
    with roving `tabIndex` and full Arrow / Home / End selection.

### Interactive Board — Keyboard Piece Placement & Movement (edit mode)

A complete keyboard alternative to drag-and-drop, in `useBoardKeyboard`
(`src/components/interactions/InteractiveBoard/useBoardKeyboard.ts`):

- The board grid is a **single tab stop** (`tabIndex={0}`) with a **roving
  cursor** exposed via `aria-activedescendant`, not 64 tab stops.
- **Arrow keys** move the cursor across the 64 squares (orientation-aware — Up
  always moves toward the top of the board as displayed, even when flipped).
- **Enter / Space** picks up the piece under the cursor, then places it on the
  next Enter/Space; **Escape** cancels a pickup; **Delete/Backspace** removes the
  piece under the cursor.
- **Palette pieces are real `<button>`s** (`aria-label="Place white knight"`);
  activating one hands the piece to the board's cursor and moves focus to the
  grid for placement (`PiecePalette` → `ChessEditor` → `InteractiveBoard`).
- Every action — cursor move, pickup, placement, removal, cancel — is announced
  through a dedicated polite `aria-live` region.
- The cursor ring uses the `--color-accent` token and is shown only while the
  grid holds focus; the focus ring is the standard `focus-visible:ring-accent`.
- The keyboard state is a **single small object** (cursor + held piece) in the
  board container, never mirrored into the 64 memo'd square components — only the
  one or two cells whose `isCursor`/`isHeldSource` flag changes re-render, so the
  64-square performance budget is preserved.

### ARIA and Semantic HTML

- `role="dialog"`, `aria-modal`, `aria-labelledby` on modals — including `Modal`, `ModalShell`, `AuthModal`, and `SecurityLockModal`
- `role="img"` with a descriptive `aria-label` on `ChessBoard`
- `aria-describedby` and `aria-invalid` on the FEN input field
- `role="dialog"` and `aria-valuenow` on the export progress bar
- `aria-label` on primary action buttons
- Skip-to-main-content link in `App.tsx`
- Focus trap in modal components via the shared `useFocusTrap` hook (`src/shared/hooks/useFocusTrap.ts`): moves focus into the dialog on open, cycles Tab/Shift+Tab within it, and restores focus to the previously focused element on close
- Explicit `<label htmlFor>`/`id` associations on the auth forms (sign in, sign up, MFA verification)
- Keyboard handling in Navbar: Escape closes mobile menu, scroll lock when menu is open

### Interactive Board Screen-Reader Model (edit mode)

- The board grid carries `role="grid"` with a descriptive `aria-label` (including the keyboard instructions); each square is a `role="gridcell"` with an `aria-label` such as `"white pawn, e4"` or `"e4, empty"`, and `aria-selected` reflects the keyboard cursor/selection.
- A visually hidden `aria-live="polite"` region announces the full position, grouped by colour (e.g. `"White: white king e1. Black: black queen d8"`), and updates when the position or board orientation changes. A second polite region narrates each keyboard action (see above).
- Position description is generated by `describeBoardPosition` / `pieceToName` in `src/shared/utils/boardUtils.ts` from the parsed 8×8 board array (orientation-aware).
- The inner draggable piece element is `aria-hidden="true"` and not a tab stop: the wrapping control (palette `<button>` or board `gridcell`) provides the accessible name, so there is no double announcement and no focusable-but-inert control. The piece `<img>` is `alt=""` (decorative). The deprecated `aria-grabbed` attribute is not used.

### Touch / Mobile Drag-and-Drop

- The DnD backend is chosen by device capability in `DndProvider`
  (`src/components/interactions/DndProvider/DndProvider.tsx`): **TouchBackend** on
  touch devices (`pointer: coarse` / `ontouchstart` / `maxTouchPoints`), where the
  native HTML5 drag API does not fire — this is why dragging previously "did
  nothing" on phone/tablet — and **HTML5Backend** on mouse/pen devices for
  precise native dragging.
- `touch-action: none` is now applied **inline on the draggable piece only**
  (not as a global class on every piece), so a finger that starts on a piece can
  still scroll: the TouchBackend's `scrollAngleRanges` route mostly-vertical
  swipes (±30° of straight up/down) to page scroll, while horizontal/diagonal
  motion starts a piece drag. The page no longer "freezes" under the finger.
- **`delayTouchStart` is `0` (not a long-press delay).** A non-zero start delay
  in react-dnd-touch-backend@16 silently disables `scrollAngleRanges`: while the
  delay timer is pending the backend short-circuits the move handler before the
  scroll-angle check runs, so — combined with `touch-action: none` on the piece —
  a vertical scroll that started on a piece froze the page for the delay window
  and was then mis-classified as a drag. With no delay the first finger move is
  classified at once: a near-vertical swipe scrolls the page, and only a
  horizontal/diagonal move past `touchSlop` (~12px) begins a drag. `touchSlop`,
  not a timer, is what stops a tap from accidentally grabbing a piece.
- The grey/blue mobile **tap-highlight flash is suppressed on the board grid and
  piece palette only** (`-webkit-tap-highlight-color: transparent`, scoped in
  `src/index.css`): each square is click-to-select, so every tap and the first
  move of a drag previously flashed a highlight box over the square mid-gesture.
  It is left intact on ordinary links/buttons so sighted touch users keep native
  tap feedback there.
- **Pinch-zoom is preserved**: the viewport meta is
  `width=device-width, initial-scale=1.0` with no `maximum-scale` /
  `user-scalable=no`, so the page can still be zoomed (WCAG 1.4.4 / 1.4.10).

### Responsive Design

- Tailwind CSS with mobile-first breakpoints
- Touch-friendly on mobile devices (drag-and-drop and scrolling both work)

---

## What Is Not Implemented

- No text alternative for the exported/preview canvas board content (the `ChessBoard` display component) — only the interactive editor board is described to screen readers
- No `aria-live` regions for export completion or scan/search results (the interactive board position and keyboard actions are announced; export status is not)
- No high contrast theme or `prefers-contrast` media query support
- No automated accessibility tests in CI (no axe-core, Pa11y, or Lighthouse CI)
- No formal WCAG 2.2 AA compliance audit has been completed (the board keyboard/touch work below was verified manually, not by an automated audit)

---

## Known Issues

| Issue                                              | Impact                                                         |
| -------------------------------------------------- | -------------------------------------------------------------- |
| Export/preview `ChessBoard` has no text equivalent | Outside the editor, the rendered position is not described     |
| No status announcements for export completion      | Screen readers are silent during and after export              |
| Color contrast not verified                        | May not meet WCAG 2.2 AA on some themes / custom board colours |

---

## WCAG 2.2 AA — Criteria Now Covered (board editor + global nav)

- **2.1.1 Keyboard** — page scrolling on every route; full keyboard board
  editing (move/place/remove pieces, palette placement) with no keyboard trap
  (the former focusable-but-inert draggable piece was removed).
- **2.5.1 Pointer Gestures** — board editing no longer requires a path-based drag
  gesture; a single-pointer/keyboard pick-and-place alternative exists.
- **2.4.7 Focus Visible** — `focus-visible:ring-accent` on the grid, palette
  buttons, and action buttons; a roving accent cursor on the focused square.
- **4.1.2 Name, Role, Value** — grid (`role="grid"`), cells (`role="gridcell"` +
  algebraic `aria-label` + `aria-selected`), `aria-activedescendant`, palette
  `<button>`s with names.
- **4.1.3 Status Messages** — polite `aria-live` regions for the position
  description and for each keyboard action; the custom-board-size validation
  message is a `role="alert"`.
- **1.3.1 Info and Relationships / 3.3.1 Error Identification** — the custom
  board-size number input is programmatically labelled (`aria-label`) and links
  its error via `aria-invalid` + `aria-describedby`.

---

## Planned Improvements

**Low effort:**

- Add `aria-label` to remaining unlabeled buttons
- Add `aria-live="polite"` region for export status announcements

**Medium effort:**

- Extend the board text description to the export/preview `ChessBoard` display component
- Add `prefers-reduced-motion` support to the remaining framer-motion animations

**High effort:**

- Full WCAG 2.2 AA compliance audit and remediation (incl. colour-contrast verification on custom board colours)
- Automated accessibility testing in CI

---

## Contributing

Priority areas for accessibility contributions:

1. `aria-live` announcements for export progress and completion
2. Text equivalent for the export/preview `ChessBoard` display component
3. Colour-contrast verification on custom board colours
4. Automated axe-core integration

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for setup instructions.

---

_Last updated: June 2026 — v6.0.0 (board keyboard model, app-wide keyboard scrolling — now correctly resolving inner page scroll columns, keyboard-adjustable + labelled numeric controls, capability-based DnD backend for touch)_
