# ChessViewer — Documentation

Technical documentation for ChessViewer. ChessViewer is a rolling release: `master` is always what runs on [chessvision.org](https://chessvision.org), and changes are listed by month in [CHANGELOG.md](../CHANGELOG.md).

- Source: [github.com/chessviewer-org/chess-viewer](https://github.com/chessviewer-org/chess-viewer)
- Live site: [chessvision.org](https://chessvision.org)
- Issues: [GitHub Issues](https://github.com/chessviewer-org/chess-viewer/issues)

---

## Architecture

- [Architecture](architecture/ARCHITECTURE.md) — stack, project structure, routing, build and prerender, hosting, state, rendering, auth
- [Decisions](architecture/DECISIONS.md) — architectural decision records (ADRs)

## Reference

- [Fairy Chess](reference/FAIRY_CHESS.md) — Fairy FEN, neutral and rotated symbols, named Popeye walks, Popeye files
- [LaTeX Studio](reference/LATEX_EXPORT.md) — the `/latex` page, `skak` / `chessboard` / `diagram` markup, document settings, TeX installation, safety gates
- [Export Pipeline](reference/EXPORT_PIPELINE.md) — quality presets, resolution tables, pipeline flow, browser limits, file reference
- [FEN Notation](reference/FEN.md) — FEN format, validation rules, parser
- [Accessibility](reference/ACCESSIBILITY.md) — current status, known gaps, planned improvements
- [Performance](reference/PERFORMANCE.md) — payload and PageSpeed audits with measurements

## Guides

- [FAQ](guides/FAQ.md) — common questions from users and contributors
- [Code Quality Setup](guides/LINTING_SETUP.md) — ESLint, Prettier, Husky, commitlint, TypeScript
- [Roadmap](../ROADMAP.md) — implemented features, priorities, known technical debt

## Root-Level Files

- [CHANGELOG.md](../CHANGELOG.md) — version history by month
- [CONTRIBUTING.md](../CONTRIBUTING.md) — setup, quality gates, PR process
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) — community standards
- [SECURITY.md](../SECURITY.md) — vulnerability reporting

---

## Screenshots

| Page              | Screenshot                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Standard editor   | [screenshot-home.png](assets/screenshot-home.png)                                                                                                            |
| Fairy chess       | [symbols](assets/screenshot-fairy-chess.png), [named pieces](assets/screenshot-fairy-named-pieces.png), [Popeye problem](assets/screenshot-fairy-popeye.png) |
| LaTeX Studio      | [diagrams](assets/screenshot-latex-diagrams.png), [document](assets/screenshot-latex-document.png), [export](assets/screenshot-latex-export.png)             |
| Export            | [board style](assets/screenshot-export.png), [export settings](assets/screenshot-export-settings.png)                                                        |
| Batch export      | [positions](assets/screenshot-advanced-fen.png), [preview](assets/screenshot-advanced-fen-preview.png)                                                       |
| History           | [screenshot-history.png](assets/screenshot-history.png)                                                                                                      |
| Settings          | [screenshot-settings.png](assets/screenshot-settings.png)                                                                                                    |
| Sign in / sign up | [sign in](assets/screenshot-sign-in.png), [sign up](assets/screenshot-sign-up.png)                                                                           |

---

## Quick Reference

### Commands

```bash
pnpm dev              # dev server on :3000
pnpm build            # vite build + CSP hashes + prerender → dist/
pnpm preview          # serve dist/ on :4173
pnpm validate         # typecheck + lint + format:check + test (the CI contract)
pnpm test             # unit tests (node:test)
pnpm typecheck        # tsc --noEmit — must be 0 errors
pnpm lint             # ESLint — must be 0 warnings
pnpm lint:fix         # ESLint auto-fix (also sorts imports)
pnpm format           # Prettier write
pnpm pieces:fairy     # regenerate public/fairypiece from the base sets
pnpm build:analyze    # build + bundle visualizer
```

### For New Contributors

1. Read [Architecture](architecture/ARCHITECTURE.md) for the system overview and file locations.
2. Check [Decisions](architecture/DECISIONS.md) for the rationale behind key choices.
3. Review [Export Pipeline](reference/EXPORT_PIPELINE.md) before touching canvas or export code, and [Fairy Chess](reference/FAIRY_CHESS.md) before touching FEN parsing.
4. Run `pnpm validate` — all four gates must pass before opening a PR.

---

_Last updated: October 2026_
