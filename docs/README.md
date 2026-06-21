# ChessVision — Documentation

Technical documentation for ChessVision v6.0.0.

- Source: [github.com/chessvision-org/chess-vision](https://github.com/chessvision-org/chess-vision)
- Demo: [chessvision.org](https://chessvision.org)
- Issues: [GitHub Issues](https://github.com/chessvision-org/chess-vision/issues)

---

## Architecture

- [Architecture](architecture/ARCHITECTURE.md) — Stack, project structure, path aliases, routing, state, canvas, auth
- [Decisions](architecture/DECISIONS.md) — Architectural decision records (ADRs)

## Reference

- [Export Pipeline](reference/EXPORT_PIPELINE.md) — Quality presets, resolution tables, pipeline flow, browser limits, file reference
- [FEN Notation](reference/FEN.md) — FEN format, validation rules, parser implementation
- [Accessibility](reference/ACCESSIBILITY.md) — Current status, known gaps, planned improvements

## Guides

- [Roadmap](guides/ROADMAP.md) — Implemented features, priority items, known technical debt
- [FAQ](guides/FAQ.md) — Common questions from users and contributors
- [Code Quality Setup](guides/LINTING_SETUP.md) — ESLint, Prettier, Husky, commitlint, TypeScript configuration

## Root-Level Files

- [CHANGELOG.md](../CHANGELOG.md) — Full version history
- [CONTRIBUTING.md](../CONTRIBUTING.md) — Setup, quality gates, PR process
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) — Community standards
- [SECURITY.md](../SECURITY.md) — Vulnerability reporting

---

## Quick Reference

### Commands

```bash
pnpm dev              # dev server on :3000
pnpm build            # production build → dist/
pnpm validate         # typecheck + lint + format:check + test (the CI contract)
pnpm test             # FEN parser unit tests
pnpm typecheck        # tsc --noEmit — must be 0 errors
pnpm lint             # ESLint — must be 0 warnings
pnpm lint:fix         # ESLint auto-fix (also sorts imports)
pnpm format           # Prettier write
pnpm build:analyze    # build + bundle visualizer
```

### For New Contributors

1. Read [Architecture](architecture/ARCHITECTURE.md) for the system overview and file locations.
2. Check [Decisions](architecture/DECISIONS.md) for the rationale behind key choices.
3. Review [Export Pipeline](reference/EXPORT_PIPELINE.md) before touching canvas or export code.
4. Run `pnpm validate` — all four gates must pass before opening a PR.

---

_Last updated: June 2026 — v6.0.0_
