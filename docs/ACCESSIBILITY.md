# Accessibility

Current accessibility status of ChessVision. This document is honest about what exists and what does not.

---

## Summary

The application is built primarily for sighted users who interact via mouse or touchscreen. Keyboard navigation is partially supported through browser defaults. Screen reader support for the chess board is not implemented.

---

## What Is Implemented

### Keyboard Navigation (Browser Defaults)

- Tab / Shift+Tab — move between focusable elements
- Enter / Space — activate buttons and checkboxes
- Escape — close modals

### ARIA and Semantic HTML

- `role="dialog"`, `aria-modal`, `aria-labelledby` on modals
- `role="img"` with a descriptive `aria-label` on `ChessBoard`
- `aria-describedby` and `aria-invalid` on the FEN input field
- `role="dialog"` and `aria-valuenow` on the export progress bar
- `aria-label` on primary action buttons
- Skip-to-main-content link in `App.tsx`
- Focus trap in modal components
- Keyboard handling in Navbar: Escape closes mobile menu, scroll lock when menu is open

### Responsive Design

- Tailwind CSS with mobile-first breakpoints
- Touch-friendly on mobile devices

---

## What Is Not Implemented

- No text alternative for canvas board content — screen readers cannot read the chess position
- No `aria-live` regions for board state changes or export completion
- No custom keyboard shortcuts for board actions (flip, export, clear)
- No high contrast theme or `prefers-contrast` media query support
- No automated accessibility tests in CI (no axe-core, Pa11y, or Lighthouse CI)
- No WCAG 2.1 compliance testing has been done

---

## Known Issues

| Issue                                           | Impact                                            |
| ----------------------------------------------- | ------------------------------------------------- |
| Canvas board has no accessible text alternative | Screen reader users cannot access the position    |
| No status announcements for export completion   | Screen readers are silent during and after export |
| No custom focus styles                          | Focus visibility depends on browser defaults      |
| Color contrast not verified                     | May not meet WCAG AA on some themes               |

---

## Planned Improvements

**Low effort:**

- Add `aria-label` to remaining unlabeled buttons
- Add `aria-live="polite"` region for export status announcements
- Add custom `focus-visible` styles

**Medium effort:**

- Generate a text description of the board position from the parsed FEN (e.g., "White king on e1, black queen on d8...")
- Add `prefers-reduced-motion` support to animations
- Add keyboard shortcuts for common board actions

**High effort:**

- SVG board rendering option as an accessible alternative to Canvas
- Full WCAG 2.1 AA compliance audit and remediation
- Automated accessibility testing in CI

---

## Contributing

Priority areas for accessibility contributions:

1. Text description generator for the chess board (parseable from the 8×8 board array)
2. `aria-live` announcements for export progress and completion
3. Keyboard shortcut implementation
4. Automated axe-core integration

See [CONTRIBUTING.md](../CONTRIBUTING.md) for setup instructions.

---

_Last updated: May 2026 — v6.0.0_
