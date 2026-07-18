# Contributing

Thanks for contributing! Bug reports, fixes, features, and docs are all welcome.

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/chess-viewer.git
cd chess-viewer
pnpm install        # also sets up Git hooks
pnpm dev            # dev server at http://localhost:3000
```

Requirements: **Node 22+** and **pnpm 10+**.

## Branching

- Branch off `master` — use `feat/<name>`, `fix/<name>`, or `chore/<name>`.
- **`master`** is always deployable. Keep branches short-lived.
- One branch per change. One PR per branch.

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject
```

Types: `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `chore` · `ci` · `build` · `revert`

Rules: lowercase, no trailing period, header ≤ 100 characters.

Examples:

```
feat(export): add SVG download support
fix(board): correct piece rendering in Safari
docs: update setup instructions for Node 22
```

## Before opening a PR

Run the quality gate — the same checks CI runs:

```bash
pnpm validate       # typecheck + lint + format-check + tests
```

If it passes locally, CI will pass.

## Opening a PR

1. Branch off `master`.
2. Make changes, run `pnpm validate`.
3. Open PR against `master` with a Conventional Commit title.
4. Explain **what** changed and **why** in the description.
5. Link the issue it closes: `Fixes #123`.

PRs are squash-merged so every change lands as a single commit on `master`.

## Reporting bugs

Open an [issue](https://github.com/chessviewer-org/chess-viewer/issues) using
the provided templates. For questions, use
[Discussions](https://github.com/chessviewer-org/chess-viewer/discussions).

## Code of Conduct

By participating you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).
