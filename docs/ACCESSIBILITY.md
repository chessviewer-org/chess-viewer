# Accessibility Documentation

Current accessibility state of FENForsty Pro.

---

## Table of Contents

- [Overview](#overview)
- [What Actually Exists](#what-actually-exists)
- [What Doesn't Exist](#what-doesnt-exist)
- [Known Issues](#known-issues)
- [Future Plans](#future-plans)

---

## Overview

This document honestly describes the accessibility status of FENForsty Pro based on actual implementation.

### Reality Check

- ❌ **No WCAG compliance testing done**
- ✅ Basic browser keyboard navigation works
- ❌ No custom accessibility features implemented
- ⚠️ Minimal screen reader support (just semantic HTML)
- ✅ Responsive design with Tailwind CSS
- ✅ Color customization available

---

## What Actually Exists

### 1. Browser Default Keyboard Navigation

The standard browser keyboard shortcuts work:

- `Tab` / `Shift+Tab` - Navigate between elements
- `Enter` - Click buttons/links
- `Space` - Toggle checkboxes, click buttons
- `Esc` - Close modals (if implemented in modal component)

**No custom keyboard shortcuts exist.**

### 2. Semantic HTML

Basic HTML tags are used:

```jsx
<main>
  <button>...</button>
  <input type="text" />
  <select>...</select>
</main>
```

**No ARIA attributes implemented.**

### 3. Responsive Design

- Built with Tailwind CSS
- Works on mobile, tablet, and desktop
- Touch-friendly on mobile devices

### 4. Canvas Board Rendering

- HTML5 Canvas for chess board
- High-quality rendering
- Export up to 12,800×12,800px

### 5. Color Customization

- Multiple board themes
- Custom color picker
- Users can adjust board colors

### 6. Dependencies

Based on `package.json`:

```json
{
  "react": "^19.2.3",
  "react-dom": "^19.2.3",
  "react-router-dom": "^7.11.0",
  "lucide-react": "^0.562.0",
  "react-icons": "^5.5.0",
  "tailwindcss": "^3.3.5"
}
```

**No accessibility-specific libraries installed** (no axe-core, no Pa11y, no ARIA testing tools).

---

## What Doesn't Exist

### Not Implemented

1. **Custom Keyboard Shortcuts**
   - No Ctrl+E for export
   - No Ctrl+S for save
   - No F for flip board
   - No C for toggle coordinates
   - No T for theme selector

2. **ARIA Attributes (Partial)**
   - ✅ Basic `aria-label` on some buttons (v3.5.2)
   - ✅ `aria-modal` on Modal component (v3.5.2)
   - ✅ `role="dialog"` on modals (v3.5.2)
   - ❌ No `aria-describedby`
   - ❌ No `aria-live` regions

3. **Screen Reader Support**
   - No text description for canvas board
   - No announcement of board changes
   - No FEN position descriptions
   - No export status announcements

4. **Focus Management (Partial)**
   - ✅ Focus trap in Modal component (v3.5.2)
   - ✅ Focus restoration after modal close (v3.5.2)
   - ❌ No skip-to-content link
   - ✅ Basic focus-visible styles on Button (v3.5.2)

5. **Accessibility Testing**
   - No automated testing setup
   - No axe-core integration
   - No Pa11y CI
   - No Lighthouse accessibility audits in CI/CD
   - No screen reader testing done

6. **Custom Focus Styles**

```css
/* This doesn't exist - using browser defaults */
*:focus-visible {
  /* No custom styles */
}
```

7. **Screen Reader Only Text**

```css
/* This utility class doesn't exist */
.sr-only {
  /* Not implemented */
}
```

8. **High Contrast Mode**
   - No `prefers-contrast` media query
   - No high contrast theme option

9. **Reduced Motion**
   - No `prefers-reduced-motion` support
   - Animations not disabled for users who prefer reduced motion

10. **Dark Mode**
    - No system dark mode detection
    - Only light theme available

---

## Known Issues

### Critical Accessibility Problems

1. **Canvas is Not Accessible**
   - Screen readers cannot read the chess board
   - No text alternative provided
   - Visually impaired users cannot understand board position

2. **No Keyboard Shortcuts**
   - Users must tab through all UI elements
   - No quick access to common actions
   - Time-consuming for keyboard-only users

3. **Minimal Screen Reader Support**
   - Most interactive elements lack labels
   - No status announcements
   - Poor experience for screen reader users

4. **Export Process Silent**
   - No visual or audio feedback during export
   - Screen readers don't announce completion
   - Users don't know when export finishes

5. **Color Contrast Unknown**
   - No testing done for WCAG compliance
   - Classic chess colors likely below AA standard
   - No contrast checker implemented

6. **No Focus Indicators**
   - Using browser defaults only
   - May be hard to see on some themes
   - No custom, high-visibility focus ring

---

## Testing Status

### What's Been Tested

- ⚠️ Manual testing on desktop Chrome only
- ⚠️ Basic responsive testing on mobile

### What Hasn't Been Tested

- ❌ No screen reader testing (NVDA, JAWS, VoiceOver)
- ❌ No keyboard-only navigation testing
- ❌ No color contrast testing
- ❌ No automated accessibility audits
- ❌ No testing with assistive technologies
- ❌ No WCAG compliance verification

### Testing Tools NOT Used

```bash
# These are NOT installed or configured:
# - @axe-core/react
# - pa11y
# - pa11y-ci
# - lighthouse (not in CI)
# - jest-axe
```

---

## Future Plans

### If We Add Accessibility (Planned)

#### Phase 1: Basic (Easy to Add)

1. Add ARIA labels to all buttons
2. Add `sr-only` utility class
3. Add basic screen reader text for canvas
4. Add simple keyboard shortcuts
5. Add custom focus styles

#### Phase 2: Medium (More Work)

1. Implement focus management in modals
2. Add status announcements (aria-live)
3. Create FEN position descriptions
4. Add high contrast theme
5. Support `prefers-reduced-motion`

#### Phase 3: Advanced (Major Effort)

1. SVG board option (better than canvas for accessibility)
2. Full WCAG 2.1 AA compliance
3. Comprehensive screen reader support
4. Automated accessibility testing in CI/CD
5. Voice control support

---

## Honest Summary

### What Works

✅ Basic HTML structure is semantic  
✅ Standard browser keyboard navigation  
✅ Responsive layout  
✅ Works on mobile and desktop  
✅ Color customization helps some users  
✅ Basic ARIA labels on buttons and modals (v3.5.2)
✅ Focus trap in modals (v3.5.2)
✅ Error boundary for graceful failures (v3.5.2)

### What Doesn't Work

❌ Canvas board is completely inaccessible  
❌ No screen reader support for board  
❌ No keyboard shortcuts  
❌ No accessibility testing  
❌ No WCAG compliance

### Bottom Line

**This app is built for sighted users who use a mouse or touchscreen.**

Users who rely on:

- Screen readers: **Will have major difficulties**
- Keyboard-only navigation: **Will be inconvenienced**
- High contrast: **May struggle with default colors**
- Assistive technologies: **Limited or no support**

**We acknowledge these limitations and plan to improve accessibility in future versions.**

---

## Contributing

Want to help make this accessible? Priority areas:

1. Add ARIA labels to buttons and inputs
2. Create screen reader text for canvas board
3. Implement keyboard shortcuts
4. Add focus management to modals
5. Set up automated accessibility testing (axe-core)
6. Test with actual screen readers

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

## Resources

### For Future Implementation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)

### Testing Tools to Add

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE Extension](https://wave.webaim.org/)

### Screen Readers for Testing

- [NVDA](https://www.nvaccess.org/) (Free, Windows)
- VoiceOver (macOS/iOS built-in)
- TalkBack (Android built-in)

---

**Last Updated:** May 6, 2026  
**Status:** ⚠️ Limited accessibility - NOT WCAG compliant  
**Recent Improvements (v3.5.2):** Basic ARIA labels, focus trap in modals
**Accessibility Level:** Partial - some ARIA attributes added

---

## Disclaimer

This application currently does not meet WCAG 2.1 accessibility standards. We are transparent about these limitations and committed to improving accessibility in future releases. If you have accessibility needs that are not met, please contact us or contribute improvements via GitHub.
