# Accessibility Documentation

Current accessibility state of **ChessVision v5.5.3**. This document describes what is implemented on `master`, what is not, and the known limitations. ChessVision does not currently claim WCAG 2.1 AA conformance.

---

## Table of Contents

- [Overview](#overview)
- [What is Implemented](#what-is-implemented)
- [What is Not Implemented](#what-is-not-implemented)
- [Known Limitations](#known-limitations)
- [Testing Status](#testing-status)
- [Planned Improvements](#planned-improvements)
- [Contributing](#contributing)
- [References](#references)

---

## Overview

ChessVision relies on a canvas-based board rendering pipeline. Canvas content is opaque to assistive technologies; this is the principal accessibility constraint on the v5.x line. The application provides basic semantic HTML, browser-default keyboard navigation, focus management in modals, a skip-to-main-content link, a light/dark colour-scheme toggle, and configurable board colours. It does not provide custom keyboard shortcuts, an accessible board alternative, or screen-reader announcements of board state.

This document is intentionally written as an audit rather than a marketing claim. Where ChessVision falls short, it is stated plainly.

---

## What is Implemented

### Browser-default keyboard navigation

- `Tab` and `Shift-Tab` navigate between focusable elements.
- `Enter` activates buttons and links.
- `Space` toggles checkboxes and activates buttons.
- `Esc` closes modals where the modal component implements it.

No application-specific keyboard shortcuts are defined.

### Semantic HTML

The application uses semantic landmark elements (`<main>`, `<nav>`, `<button>`, `<input>`, `<select>`) rather than generic `<div>` containers for interactive content.

### ARIA attributes (partial)

- `aria-label` is present on selected interactive elements.
- `aria-modal` is set on the modal component.
- `role="dialog"` is set on modals.

Coverage is incomplete; `aria-describedby` and `aria-live` regions are not in use.

### Focus management

- A focus trap is active inside open modals.
- Focus is restored to the trigger element when a modal closes.
- A skip-to-main-content link is present in the app shell.
- Focus-visible styles are present on the primary `Button` component using browser-native focus rings.

### Colour-scheme support

- The application reads `prefers-color-scheme` on first load and exposes a light/dark toggle through `App.tsx`. The choice persists in `localStorage`.
- Board colours are user-configurable through the colour picker.

### Responsive layout

Built with Tailwind 4 utilities. Layout adapts to mobile, tablet, and desktop viewports. Touch interactions are wired through `react-dnd-touch-backend`.

### Error boundaries

The application is wrapped in a top-level `ErrorBoundary` so that uncaught component errors render a fallback rather than a blank page.

---

## What is Not Implemented

### Application-specific keyboard shortcuts

The following are **not** wired up in v5.5.3 and are listed as planned in the roadmap:

- Flip board
- Export
- Toggle coordinates
- Copy current FEN
- Open theme selector

### Accessible board alternative

The canvas-rendered board has no DOM-equivalent representation. Screen readers cannot read piece placement, board state, or move history. No text description is generated from the parsed FEN.

### Status announcements

- No `aria-live` regions for export progress, validation feedback, or board changes.
- Long-running export operations are not announced to assistive technologies.

### High-contrast and reduced-motion

- No `prefers-contrast` media-query handling.
- No `prefers-reduced-motion` handling; framer-motion animations run regardless of the user preference.

### Automated accessibility testing

- `axe-core`, `pa11y`, `pa11y-ci`, `jest-axe`, and Lighthouse CI are **not** installed or configured. The repository's `package.json` confirms their absence.
- No screen-reader testing has been performed against NVDA, JAWS, or VoiceOver as part of release acceptance.

---

## Known Limitations

### Canvas board is not screen-reader accessible

This is the most significant accessibility limitation. Users who rely on screen readers cannot read the board. There is no equivalent DOM tree, no text alternative, and no live announcement of board state changes.

### Colour contrast not verified

Default board palettes have not been audited against WCAG AA contrast ratios. Users may select colour combinations that fail contrast checks; the application does not warn against this.

### Keyboard-only users are inconvenienced

Without application-specific shortcuts, all common actions (flip, export, copy FEN, switch theme) require traversing the full tab order. This is functional but slow.

### Export feedback is visual-only

Export progress is reported visually through `ExportProgress`. There is no audio cue and no `aria-live` text fallback. Users who cannot see the screen do not receive completion feedback.

---

## Testing Status

### Performed

- Manual keyboard-traversal smoke tests on desktop Chrome and Firefox.
- Manual responsive checks across desktop, tablet, and mobile viewport sizes.

### Not performed

- Screen-reader testing (NVDA, JAWS, VoiceOver, TalkBack).
- Keyboard-only navigation acceptance testing.
- Automated colour-contrast scans.
- Automated accessibility audits in CI/CD.
- Testing with users of assistive technologies.
- WCAG 2.1 AA conformance verification.

---

## Planned Improvements

The following improvements are planned for a future major release. They are not commitments for v5.x patch releases.

### Near-term (low cost)

1. Apply `aria-label` to all interactive elements in the board playground and the Advanced FEN editor.
2. Add an `.sr-only` utility class for visually hidden text alternatives.
3. Add a basic textual description of the current board derived from the parsed FEN.
4. Add `aria-live` announcements for export start, progress milestones, and completion.
5. Define custom high-visibility focus styles on all primary interactive components.

### Medium-term

1. Add application-specific keyboard shortcuts for flip, export, copy FEN, and theme selection.
2. Generate a structured FEN-derived position description (which side to move, material balance, last-move target square) for screen readers.
3. Add a high-contrast theme preset.
4. Honour `prefers-reduced-motion` by gating the framer-motion page transitions.

### Long-term

1. Provide a DOM-rendered board alternative (SVG with semantic markup) as an accessibility-first rendering mode.
2. Pursue full WCAG 2.1 AA conformance with an external audit.
3. Add automated accessibility testing to CI (`axe-core` or `pa11y-ci`).
4. Test with users of NVDA, JAWS, and VoiceOver and integrate findings into release acceptance.

---

## Contributing

Accessibility contributions are welcome. The highest-leverage areas are:

1. ARIA labels on currently unlabelled interactive elements.
2. A screen-reader-equivalent text description for the canvas board.
3. Application-specific keyboard shortcuts for the highest-frequency actions.
4. Setting up automated accessibility testing (`axe-core`).
5. Running real-world screen-reader sessions and reporting findings.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the contribution workflow.

---

## References

### Standards and guidance

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)

### Testing tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/)
- [WAVE Web Accessibility Evaluation Tool](https://wave.webaim.org/)
- [NVDA](https://www.nvaccess.org/) (free, Windows)
- VoiceOver (macOS / iOS, built in)
- TalkBack (Android, built in)

---

**Last Updated:** 2026-05-23  
**Applies To:** v5.5.3  
**Conformance Claim:** None. ChessVision does not currently meet WCAG 2.1 AA.
