# FENForsty Pro — Documentation

Technical documentation for FENForsty Pro v5.0.0.

---

## Documentation Index

### Core Documentation

- **[Architecture](ARCHITECTURE.md)** — System design, folder structure, component groups, routing
- **[State Management](STATE_MANAGEMENT.md)** — React hooks, Context API patterns, localStorage persistence
- **[Decisions](DECISIONS.md)** — Architectural decision records (ADRs)

### Technical References

- **[Export Pipeline](EXPORT_PIPELINE.md)** — Canvas export system, quality modes, API reference
- **[Performance](PERFORMANCE.md)** — Implemented optimisations, memory usage, browser limits
- **[Accessibility](ACCESSIBILITY.md)** — Current accessibility status
- **[FEN Notation](FEN.md)** — FEN format reference and parser implementation
- **[Known Issues](KNOWN_ISSUES.md)** — Tracked issues and limitations
- **[Design Errors Analysis](DESIGN_ERRORS_ANALYSIS.md)** — Identified design issues and fixes

### Project Information

- **[Changelog](CHANGELOG.md)** — Version history (v1.0.0 → v5.0.0)
- **[FAQ](FAQ.md)** — Common questions
- **[Linting Setup](LINTING_SETUP.md)** — ESLint, Prettier, Husky, commitlint configuration
- **[Roadmap](ROADMAP.md)** — Implemented features and planned work

---

## Quick Reference

### For Developers

1. Read [Architecture](ARCHITECTURE.md) for a full system overview and file structure
2. Review [State Management](STATE_MANAGEMENT.md) for hook and context patterns
3. Check [Known Issues](KNOWN_ISSUES.md) before starting work
4. See [Export Pipeline](EXPORT_PIPELINE.md) for canvas/export details

### For Contributors

1. Review [Decisions](DECISIONS.md) for context on why things are built the way they are
2. Check [Design Errors Analysis](DESIGN_ERRORS_ANALYSIS.md) for open design issues
3. Follow code style in existing files — zero ESLint warnings enforced in CI

---

## Current Status (v5.0.0)

### What Works

- FEN parsing and validation
- Canvas board rendering with 23+ piece sets and 20+ themes
- Interactive drag-and-drop board editor
- PNG/JPEG export up to 24,192×24,192 px (Social 32×)
- SVG export (Advanced FEN page single + batch export)
- Print mode with physical dimension accuracy (DPI-correct output)
- Batch export of multiple FEN positions
- FEN history with archive, filtering, and favorites
- Light/dark color scheme with `prefers-color-scheme` support
- PWA manifest
- Settings page, FEN history page, advanced FEN input page
- All pages lazy-loaded with code splitting

### Known Limitations

- No WCAG accessibility compliance for canvas content (screen readers cannot access board)
- 24×/32× Social exports may fail on Safari/iOS (canvas area limit)
- No keyboard shortcuts for board actions
- Home page export toolbar has PNG/JPEG only (SVG is currently in Advanced FEN flow)
- Automated tests are minimal and currently failing in the Node test runner
- `export/` and `Export/` (and similar pairs) directories duplicated in `features/` due to case-insensitive filesystem

---

## Repository Links

- **Source:** [github.com/BilgeGates/chess_viewer](https://github.com/BilgeGates/chess_viewer)
- **Demo:** [chess-viewer-site.vercel.app](https://chess-viewer-site.vercel.app)
- **Issues:** [GitHub Issues](https://github.com/BilgeGates/chess_viewer/issues)

---

**Last Updated:** May 6, 2026  
**Version:** 5.0.0
