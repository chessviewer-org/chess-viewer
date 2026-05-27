# ChessVision — Documentation

Technical documentation for ChessVision v6.0.0.

---

## Index

### Core

- [Architecture](ARCHITECTURE.md) — System design, folder structure, component groups, routing, auth
- [Decisions](DECISIONS.md) — Architectural decision records (ADRs)

### Technical References

- [Export Pipeline](EXPORT_PIPELINE.md) — Canvas export system, quality modes, API reference
- [FEN Notation](FEN.md) — FEN format reference and parser implementation
- [Accessibility](ACCESSIBILITY.md) — Current accessibility status and known gaps
- [Linting Setup](LINTING_SETUP.md) — ESLint, Prettier, Husky, commitlint configuration

### Project Information

- [Changelog](CHANGELOG.md) — Version history
- [FAQ](FAQ.md) — Common questions
- [Roadmap](../ROADMAP.md) — Implemented features and planned work

---

## Quick Reference

### Development Commands

```bash
pnpm dev              # dev server on :3000
pnpm build            # production build → dist/
pnpm test             # FEN parser unit tests
npx tsc --noEmit      # type check — must be 0 errors
pnpm lint             # ESLint — must be 0 warnings
pnpm format           # Prettier
```

### For New Contributors

1. Read [Architecture](ARCHITECTURE.md) for system overview and file locations
2. Check [Decisions](DECISIONS.md) for context on why things are built the way they are
3. Review [Export Pipeline](EXPORT_PIPELINE.md) before touching canvas or export code
4. All three quality gates must pass: `pnpm test && npx tsc --noEmit && pnpm lint`

---

## Repository

- Source: [github.com/BilgeGates/chess-vision](https://github.com/BilgeGates/chess-vision)
- Demo: [chess-vision-site.vercel.app](https://chess-vision-site.vercel.app)
- Issues: [GitHub Issues](https://github.com/BilgeGates/chess-vision/issues)

---

_Last updated: May 2026 — v6.0.0_
