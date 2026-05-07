# Known Issues

Tracked issues, limitations, and workarounds.

---

## Table of Contents

- [Critical Issues](#critical-issues)
- [High Priority Issues](#high-priority-issues)
- [Medium Priority Issues](#medium-priority-issues)
- [Low Priority Issues](#low-priority-issues)
- [Browser-Specific Issues](#browser-specific-issues)
- [Limitations by Design](#limitations-by-design)
- [Workarounds](#workarounds)
- [Reporting New Issues](#reporting-new-issues)

---

## Critical Issues

None currently tracked.

---

## High Priority Issues

Currently tracking **0** high priority issues.

> **Security hardening completed 2026-03-12:**
>
> - Inline `<script>` blocks removed from `index.html`; moved to external files
>   (`/public/theme-init.js`, `/public/preload-cleanup.js`) to allow a strict
>   `script-src 'self'` CSP without `'unsafe-inline'`.
> - All `JSON.parse` calls on localStorage data replaced with `safeJSONParse`
>   (prototype-pollution-safe reviver, typed fallback, schema check before use).
> - All `console.*` calls in production paths replaced with the dev-only `logger`
>   utility — no information leaks to the browser console in production builds.
> - `vercel.json` updated: added `Strict-Transport-Security`, `Cross-Origin-Opener-Policy`,
>   `Cross-Origin-Resource-Policy`, `base-uri 'self'`, `form-action 'self'`, and an
>   immutable asset-cache header; removed `'unsafe-inline'` from `script-src`.
> - `isValidFENFormat` now rejects inputs exceeding `MAX_FEN_LENGTH` (93 chars)
>   before any parsing begins.
> - `sanitizeHexColor` now applied consistently before any hex color value is
>   used from localStorage, preventing CSS injection via stored colour strings.

---

## Medium Priority Issues

### 1. Canvas Accessibility Limited

**Issue:** Screen readers cannot directly interact with HTML5 Canvas elements.

**Impact:** Users relying on screen readers have limited access to board visualization.

**Affected Versions:** All versions  
**Browsers:** All  
**Reported:** 2025-12-28  
**Status:** 🟡 Open - Planned for future release

**Workaround:**

- Text descriptions provided via ARIA labels
- FEN notation available for screen readers

**Related:**

- [ACCESSIBILITY.md](ACCESSIBILITY.md)

---

### 2. Safari Canvas Size Limit

**Issue:** Safari has a maximum canvas size of 16,384×16,384px, lower than other browsers.

**Impact:** Cannot export at 24× or 32× Social quality on Safari/iOS. Maximum safe export is 16× Print.

**Affected Versions:** All versions  
**Browsers:** Safari (macOS, iOS)  
**Reported:** 2025-12-29  
**Status:** 🟡 Open - Browser limitation

**Technical Details:**

```
Safari limit:   16,384 px max dimension, 268 MP max area
24× Social:     18,112 × 18,112 px = 327 MP  ❌ Exceeds area limit
32× Social:     24,192 × 24,192 px = 585 MP  ❌ Exceeds area limit
16× Print @8cm: 15,104 × 15,104 px = 228 MP  ✅ Within limit
```

**Workaround:**

- Use Chrome, Firefox, or Edge for ultra-HD exports
- Limit Safari exports to 16× maximum
- Application warns users on Safari when selecting 32×

**Related:**

- [EXPORT_PIPELINE.md - Browser Limitations](EXPORT_PIPELINE.md#browser-limitations)

---

### 3. Mobile Keyboard Overlaps Controls

**Issue:** On mobile devices, when editing FEN input, the virtual keyboard covers important controls.

**Impact:** Users cannot see export/apply buttons while typing.

**Affected Versions:** All versions  
**Browsers:** All mobile browsers  
**Reported:** 2025-12-30  
**Status:** 🟡 Open - Investigating

**Workaround:**

- Scroll down after opening keyboard
- Use "Done" on keyboard to close it
- Rotate to landscape for more space

**Planned Fix:** Adjust layout on keyboard open

---

### 4. Multi-FEN Preview Shows Empty Board

**Issue:** When using the Multi-FEN/Gallery feature with some positions, the preview thumbnails may render as empty boards instead of showing the actual position.

**Impact:** Users cannot preview positions before batch export.

**Affected Versions:** v5.0.0+  
**Browsers:** All  
**Reported:** 2026-01-18  
**Status:** 🟡 Open - Investigating

**Steps to Reproduce:**

1. Open Advanced FEN Input page (`/advanced-fen`)
2. Enter multiple FEN positions
3. Some preview thumbnails may show empty boards

**Workaround:**

- Click on individual positions to verify
- Use single-FEN mode for critical exports

**Planned Fix:** Under investigation

---

### 5. ThemeModal Color Picker Visual Glitch

**Issue:** In the Theme settings modal, when using the advanced color picker, the color gradient canvas occasionally displays incorrectly or shows visual artifacts.

**Impact:** Difficult to select precise colors in advanced picker mode.

**Affected Versions:** v5.0.0+  
**Browsers:** All (more common on Firefox)  
**Reported:** 2026-01-18  
**Status:** 🟡 Open - Investigating

**Steps to Reproduce:**

1. Open Theme settings
2. Click on a color to open advanced picker
3. Move mouse rapidly across the color gradient
4. Canvas may show visual glitches

**Workaround:**

- Use preset colors instead
- Enter hex values directly
- Move mouse slowly in picker

**Planned Fix:** v3.6.0

---

## Low Priority Issues

### 1. FEN History Limit Not Visible

**Issue:** Users aren't notified when history reaches 50-item limit.

**Impact:** Oldest positions are silently removed.

**Affected Versions:** All versions  
**Browsers:** All  
**Reported:** 2026-01-02  
**Status:** 🟢 Open - Low priority

**Workaround:**

- Export important positions
- Use Favorites for positions you want to keep

**Planned Fix:** Add notification when history limit reached

---

### 2. Coordinate Text Scaling on Extreme Sizes

**Issue:** Coordinate labels become too small or too large at extreme board sizes.

**Impact:** Coordinates may be hard to read at 400px or 1600px.

**Affected Versions:** All versions  
**Browsers:** All  
**Reported:** 2026-01-03  
**Status:** 🟢 Open - Enhancement

**Workaround:**

- Use standard sizes (600-1000px) for best results
- Toggle coordinates off if unreadable

**Planned Fix:** Dynamic font scaling (already partially addressed in v5.0.0 — border and font sizes now scale proportionally with board pixels)

---

### 3. Export Progress Not Granular

**Issue:** Export progress jumps from 0% to 100% instantly for small exports.

**Impact:** No visual feedback for fast exports.

**Affected Versions:** All versions  
**Browsers:** All  
**Reported:** 2026-01-03  
**Status:** 🟢 Open - Enhancement

**Note:** This is actually good (export is fast!), but could show intermediate steps.

**Planned Fix:** v4.0.0 - Multi-step progress bar

---

## Browser-Specific Issues

### Safari

#### Issue: Clipboard API Limited

**Problem:** Safari restricts clipboard access more than other browsers.

**Impact:** "Copy to Clipboard" may not work without explicit user gesture.

**Workaround:**

- Click copy button directly (don't use keyboard shortcut)
- Grant clipboard permissions when prompted

#### Issue: localStorage Quota in Private Mode

**Problem:** Private browsing limits localStorage to ~10MB.

**Impact:** History and favorites may not save in private mode.

**Workaround:**

- Use normal browsing mode
- Or export positions manually

---

### Firefox

#### Issue: Canvas Export Slightly Slower

**Problem:** Firefox's canvas toBlob() is ~10-20% slower than Chrome.

**Impact:** Export takes slightly longer.

**Note:** Still completes in under 2 seconds for HD exports.

**Status:** 🟢 Minor - Browser behavior

---

### Mobile Browsers

#### Issue: Large Exports May Timeout

**Problem:** Exporting 32× (512MB memory) may crash on low-end mobile devices.

**Impact:** App may reload, losing unsaved work.

**Workaround:**

- Use lower quality settings on mobile (Low/Medium)
- Export on desktop for ultra-HD
- Close other apps to free memory

**Related:** [PERFORMANCE.md - Memory Management](PERFORMANCE.md#memory-management)

---

## Limitations by Design

These are intentional design decisions, not bugs.

### 1. No Backend / Cloud Sync

**Limitation:** Cannot sync positions across devices.

**Reason:** Privacy-first architecture (see [ADR-003](DECISIONS.md#adr-003-zero-backend-architecture))

**Alternatives:**

- Export positions as files
- Share FEN strings via email/messaging
- Use browser sync if available (Chrome, Firefox)

---

### 2. No Move Validation

**Limitation:** Application accepts any FEN notation, doesn't validate if position is legal.

**Reason:** We're a diagram generator, not a chess engine.

**Examples:**

```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
✅ Valid starting position

8/8/8/8/8/8/8/8 w - - 0 1
✅ Accepted (empty board)

KKKKKKKK/8/8/8/8/8/8/kkkkkkkk w - - 0 1
✅ Accepted (impossible position, but valid FEN syntax)
```

**If you need move validation:**

- Use [Lichess Analysis](https://lichess.org/analysis)
- Use [Chess.com Analysis](https://www.chess.com/analysis)
- Use chess.js library in your own code

---

### 3. 50-Item History Limit

**Limitation:** History stores only last 50 positions.

**Reason:** Prevent localStorage bloat and performance issues.

**Workaround:**

- Use Favorites for important positions (unlimited)
- Export history before clearing

---

### 4. SVG Export Is Not Available in Home Toolbar

**Limitation:** SVG export is currently exposed in the Advanced FEN page, not in the Home page action toolbar.

**Reason:** Export UX is split between Home (quick actions) and Advanced FEN (extended actions).

**Status:** 🟡 Open - UX consistency task

**Workaround:**

- Use Advanced FEN page for SVG export (single or batch)

---

### 5. No Animation or Move Replay

**Limitation:** Cannot animate moves or replay games.

**Reason:** Static diagram generator, not a FENForsty Pro/player.

**Status:** 🚫 Not planned

**Alternatives:**

- [Lichess](https://lichess.org) - Full game analysis
- [Chess.com](https://chess.com) - Game replay
- [ChessBase](https://chessbase.com) - Professional analysis

---

## Workarounds

### General Troubleshooting

#### Export Issues

**Problem:** Export fails or produces corrupted image.

**Solutions:**

1. Refresh the page and try again
2. Use lower quality setting
3. Clear browser cache: `Ctrl+Shift+Delete`
4. Try incognito/private mode
5. Update browser to latest version
6. Try different browser

---

#### Performance Issues

**Problem:** Application is slow or laggy.

**Solutions:**

1. Close other browser tabs
2. Disable browser extensions temporarily
3. Reduce board size (use 600px instead of 1200px)
4. Clear localStorage: `localStorage.clear()` in console
5. Update graphics drivers
6. Try on desktop if using mobile

---

#### Display Issues

**Problem:** Board looks distorted or colors are wrong.

**Solutions:**

1. Check browser zoom is at 100%
2. Disable browser color filters/night mode
3. Reset theme to default
4. Clear cache and reload
5. Check monitor color calibration

---

### Recovery Commands

#### Clear All Data

```javascript
// Open browser console (F12) and run:
localStorage.clear();
location.reload();
```

#### Export All History

```javascript
// Save history before clearing
const history = JSON.parse(localStorage.getItem('fenHistory') || '[]');
console.log(JSON.stringify(history, null, 2));
// Copy from console
```

#### Reset Specific Settings

```javascript
// Reset theme only
localStorage.removeItem('theme');

// Reset piece set only
localStorage.removeItem('pieceSet');

// Reset history only
localStorage.removeItem('fenHistory');
```

---

## Reporting New Issues

### Before Reporting

1. ✅ Check this document for known issues
2. ✅ Try the workarounds listed above
3. ✅ Update to latest version
4. ✅ Try in different browser
5. ✅ Clear cache and reload

### How to Report

**GitHub Issues:** [Create New Issue](https://github.com/BilgeGates/chess_viewer/issues/new)

**Include:**

- **Version:** Check `package.json` (currently v5.0.0)
- **Browser:** Chrome 120, Safari 17, etc.
- **OS:** Windows 11, macOS 14, etc.
- **Steps to reproduce:**
  1. Step 1
  2. Step 2
  3. Expected vs actual result
- **Screenshots:** If visual issue
- **Console errors:** Open DevTools (F12), check Console tab

**Example Report:**

```markdown
**Bug:** Export fails with "Out of memory" error

**Version:** v5.0.0
**Browser:** Chrome 120 on Windows 11
**Board Size:** 1200px
**Export Settings:** PNG, 32× quality

**Steps:**

1. Load starting position
2. Set board size to 1200px
3. Click Export → PNG → Ultra (32×)
4. Click "Export Now"

**Expected:** Download starts
**Actual:** Error message "Out of memory"

**Console Error:**
```

RangeError: Invalid array length
at createExportCanvas (canvasExporter.js:45)

```

**Screenshots:** [attached]
```

---

## Issue Statistics

Statistics are not actively tracked. See sections above for current open issues.

---

## Recently Fixed Issues

### v5.0.0 (2026-04-17)

✅ **Fixed:** Export dimension bug — board size selection now produces correct physical dimensions  
✅ **Fixed:** Coordinate system positioning — labels now scale proportionally  
✅ **Fixed:** Circular export dependency issues

### v4.0.0 (2026-02-02)

✅ **Fixed:** PWA manifest and installability  
✅ **Fixed:** Service worker and offline caching

### v3.5.4 (2026-02-01)

✅ **Fixed:** ThemeModal piece preview rendering  
✅ **Fixed:** AdvancedFENInputModal board preview

### v3.5.2 (2026-01-18)

✅ **Fixed:** Console logs replaced with logger utility  
✅ **Fixed:** setTimeout memory leaks  
✅ **Fixed:** Coordinates display and export alignment

---

## Future Improvements

Issues planned for upcoming releases:

### Next Release

- [ ] Fix mobile keyboard overlap with controls
- [ ] Add history limit notification
- [ ] Add SVG action to Home page export controls
- [ ] URL-based position sharing (`?fen=...`)

### Long-term

- [ ] Full WCAG 2.1 AA accessibility compliance (requires SVG or DOM-based rendering)
- [ ] Web Worker for off-thread export rendering
- [ ] Optional cloud sync (with explicit user consent)

---

## Help & Support

### Documentation

- [FAQ](FAQ.md) - Frequently asked questions
- [Troubleshooting](FAQ.md#troubleshooting) - Common problems
- [Export Guide](EXPORT_PIPELINE.md) - Export system details
- [Performance Guide](PERFORMANCE.md) - Optimization tips

### Community

- [GitHub Discussions](https://github.com/BilgeGates/chess_viewer/discussions) - Ask questions
- [GitHub Issues](https://github.com/BilgeGates/chess_viewer/issues) - Report bugs

### Contact

- **Email:** [darkdeveloperassistant@gmail.com](mailto:darkdeveloperassistant@gmail.com)
- **Response time:** 24-48 hours (business days)

---

## Contributing

Found a bug? Want to fix it?

1. Check [CONTRIBUTING.md](CONTRIBUTING.md)
2. Fork the repository
3. Create a fix
4. Submit a pull request
5. Reference the issue number
   **All contributions welcome!** 🙏

---

**Last Updated:** May 6, 2026  
**Version:** 5.0.0  
**Maintainer:** [@BilgeGates](https://github.com/BilgeGates)

**Note:** This document is actively maintained. Issues are updated as they are discovered, fixed, or deprioritised.
