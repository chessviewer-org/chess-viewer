# Accessibility

Current accessibility status of ChessViewer. This document is honest about what exists and what does not.

---

## Summary

The interactive board editor is operable end-to-end without a mouse: it exposes a screen-reader model of the position (an `aria-live` description plus a `role="grid"` → `role="row"` → `role="gridcell"` structure with per-square labels) **and** a full keyboard interaction model — a roving cursor, pick-up/place, and remove — that is a complete alternative to drag-and-drop. The document itself scrolls, so arrow, page, Home, End and Space keys scroll every route natively. Numeric controls (e.g. the export board size) are adjustable from the keyboard and properly labelled. Drag and drop uses pointer events, so it works with mouse, pen and touch, and vertical finger swipes scroll the page instead of being swallowed by the board. Lighthouse reports no accessibility failures on a production build.

---

## What Is Implemented

### Keyboard Navigation

- Tab / Shift+Tab — move between focusable elements
- Enter / Space — activate buttons and checkboxes
- Escape — close modals
- **Arrow Up/Down, PageUp/PageDown, Home/End, Space — scroll the page on every
  route.** The document itself scrolls (`#main-content` has no overflow of its
  own), so the browser handles these keys natively. The board grid and range
  sliders keep their own arrow-key behaviour because they consume the keys
  while focused.
  - **Changed (October 2026):** the app-wide `usePageScrollKeys` hook and its
    scroll-container resolver (`pageScroll.ts`, `[data-page-scroll]`,
    `data-arrow-keys="self"`) were removed together with the nested scroll
    container they existed to work around.
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
(`src/components/interactions/Board/hooks/useBoardKeyboard.ts`):

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
- Focus trap in modal components via the shared `useFocusTrap` hook (`src/shared/hooks/useDOM.ts`): moves focus into the dialog on open, cycles Tab/Shift+Tab within it, and restores focus to the previously focused element on close
- Explicit `<label htmlFor>`/`id` associations on the auth forms (sign in, sign up, MFA verification)
- Keyboard handling in Navbar: Escape closes mobile menu, scroll lock when menu is open. The collapsed mobile menu is `inert` + `aria-hidden` while closed, so its links/buttons are not in the tab order or the accessibility tree when hidden (WCAG 2.4.3 / 4.1.2)
- **Every interactive `<button>` carries an explicit `type="button"`** so an enclosing form can never be submitted by an action control (verified by a repo-wide scan)
- **Icon-only controls have an `aria-label`; every decorative icon is `aria-hidden="true"`** so screen readers announce the control's name once, not the icon glyph (Navbar, modals, export/progress, FEN-history, advanced-FEN, clipboard-history, playback, notifications)
- **Visible focus on every interactive control**: `focus-visible:ring-accent` (or `outline-accent`) on the Navbar logo/menu/account triggers, all modal buttons, the `Checkbox` (focus ring moved to the wrapping label via `:has(:focus-visible)` after its native outline was suppressed), and the page/wizard/history action buttons
- **Custom controls expose correct name/role/value**: `Switch` (`role="switch"`), `CustomSelect` / `SearchableSelect` (`role="combobox"` + `role="listbox"`/`option`, `aria-activedescendant`, dedicated `useListboxKeyboard`), `PageTabs` and the auth / FEN-history / advanced-FEN tab strips (`role="tablist"`/`role="tab"` + `aria-selected`), the advanced-FEN wizard stepper (`aria-current="step"`), and popover triggers (`aria-haspopup` + `aria-expanded`)
- The drop-to-delete `TrashZone` is a pointer-only affordance marked `aria-hidden="true"` (it has no click/keyboard action); its function — removing a piece — is fully available to keyboard/SR users via Delete/Backspace on the board cursor, so it no longer advertises a non-operable `role="button"`

### Interactive Board Screen-Reader Model (edit mode)

- The board grid carries `role="grid"` with a descriptive `aria-label` (including the keyboard instructions); each rank is a `role="row"` (`display: contents`, so the layout is unchanged) and each square is a `role="gridcell"` with an `aria-label` such as `"white pawn, e4"` or `"e4, empty"`, and `aria-selected` reflects the keyboard cursor/selection.
- A visually hidden `aria-live="polite"` region announces the full position, grouped by colour (e.g. `"White: white king e1. Black: black queen d8"`), and updates when the position or board orientation changes. A second polite region narrates each keyboard action (see above).
- Position description is generated by `describeBoardPosition` / `cellName` in `src/shared/utils/boardCells.ts` from the parsed 8×8 board array (orientation-aware).
- The date picker in History filters uses the same grid → row → gridcell structure, one row per week.
- Toolbar buttons whose `aria-label` differs from their visible text include that text in the name ("Save to favorites", "Reset to starting position"), so voice-control users can say what they see.
- The navbar and error-page logo is decorative (`alt=""`) because the brand name is written next to it.
- The inner draggable piece element is `aria-hidden="true"` and not a tab stop: the wrapping control (palette `<button>` or board `gridcell`) provides the accessible name, so there is no double announcement and no focusable-but-inert control. The piece `<img>` is `alt=""` (decorative). The deprecated `aria-grabbed` attribute is not used.

### Touch / Mobile Drag-and-Drop

- Drag and drop is built on pointer events in `useDragDrop` (`src/shared/hooks/useDragDrop.ts`),
  so mouse, pen and touch share one code path.
- On touch, a piece is picked up after a 200 ms press-and-hold. Moving the finger
  before that cancels the pick-up, so a swipe that starts on a piece scrolls the
  page instead of dragging it. The dragged piece is drawn 1.4× larger so it stays
  visible under the finger.
- The movement threshold depends on the pointer type and the drag sensitivity
  setting in Settings → Accessibility (`dragThreshold` in `a11yUtils.ts`).
- The grey/blue mobile **tap-highlight flash is suppressed on the board grid and
  piece palette only** (`-webkit-tap-highlight-color: transparent`, scoped in
  `src/styles/utilities.css`): each square is click-to-select, so every tap and the first
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

## WCAG 2.2 AA — Criteria Now Covered (app-wide)

- **3.2.2 On Input / 2.5.x** — no action `<button>` can implicitly submit a form
  (explicit `type="button"` everywhere), preventing unexpected context changes.

### Board editor + global nav

- **2.1.1 Keyboard** — page scrolling on every route; full keyboard board
  editing (move/place/remove pieces, palette placement) with no keyboard trap
  (the former focusable-but-inert draggable piece was removed).
- **2.5.1 Pointer Gestures** — board editing no longer requires a path-based drag
  gesture; a single-pointer/keyboard pick-and-place alternative exists.
- **2.4.7 Focus Visible** — `focus-visible:ring-accent` on the grid, palette
  buttons, and action buttons; a roving accent cursor on the focused square.
- **4.1.2 Name, Role, Value** — grid (`role="grid"`), cells (`role="gridcell"` +
  algebraic `aria-label` + `aria-selected`), `aria-activedescendant`, palette
  `<button>`s with names. App-wide: icon-only controls are named via `aria-label`
  with their icons `aria-hidden`; tab strips use `role="tab"`/`aria-selected`;
  popover triggers use `aria-haspopup`/`aria-expanded`; the collapsed mobile menu
  is `inert`/`aria-hidden`.
- **4.1.3 Status Messages** — polite `aria-live` regions for the position
  description and for each keyboard action; the custom-board-size validation
  message is a `role="alert"`.
- **1.3.1 Info and Relationships / 3.3.1 Error Identification** — the custom
  board-size number input is programmatically labelled (`aria-label`) and links
  its error via `aria-invalid` + `aria-describedby`.

---

## Planned Improvements

**Low effort:**

- Add `aria-live="polite"` region for export status announcements
  (the notification toast region is already `aria-live="polite"`; export
  progress is not yet announced)
- Add roving-`tabIndex` + arrow-key traversal to the auth / FEN-history /
  advanced-FEN tab strips (they now expose `role="tab"` + `aria-selected`, but
  unlike `PageTabs` they are still individual tab stops rather than a single
  roving one)

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

_Last updated: October 2026 (grid rows for the board and date picker, toolbar names that include their visible text, decorative logo)_
