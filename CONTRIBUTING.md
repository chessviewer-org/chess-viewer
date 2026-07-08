# Contributing to ChessViewer

Thanks for taking the time to contribute! ChessViewer is an open-source project
and contributions of all sizes are welcome — bug reports, fixes, features, and
docs.

---

## Quick start

```bash
git clone https://github.com/YOUR_USERNAME/chess-viewer.git
cd chess-viewer
pnpm install        # also sets up Git hooks
pnpm dev            # dev server at http://localhost:3000
```

Requirements: **Node 22+** and **pnpm 10+**.

---

## Branching model

```
master  ←  feat/<name>
        ←  fix/<name>
        ←  bugfix/<name>
        ←  chore/<name>
```

- **`master`** is the only long-lived branch. It is always deployable.
- Create a short-lived branch off `master` for every change.
- Open a PR against `master` when your work is ready for review.
- `archive/develop` is a read-only snapshot kept for history — do not target it.

One branch per change. One PR per branch.

---

## Before you open a pull request

Run the full quality gate — the same checks CI runs:

```bash
pnpm validate       # typecheck + lint + format-check + tests
```

If `pnpm validate` passes locally, CI will pass.

Things the project enforces (hooks and CI will catch violations):

| Rule                                               | Why                      |
| -------------------------------------------------- | ------------------------ |
| No `any`, `@ts-ignore`, or non-null `!`            | TypeScript strict mode   |
| Colors via CSS variables, not hardcoded hex in JSX | Design token consistency |
| Tests for behavioral changes                       | Regressions caught early |
| `pnpm validate` green before every commit          | Fast feedback loop       |

---

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject
```

Types: `feat` · `fix` · `refactor` · `perf` · `docs` · `test` · `chore` · `ci` · `build` · `revert`

Rules enforced by commitlint:

- lowercase type and subject
- no trailing period
- header ≤ 100 characters
- blank line before body

Examples:

```
feat(export): add SVG download support
fix(board): correct piece rendering in Safari
docs: update setup instructions for Node 22
```

---

## Opening a pull request

1. **Branch off `master`** — `feat/<name>`, `fix/<name>`, or `bugfix/<name>`.
2. Make your changes and run `pnpm validate`.
3. **Open the PR against `master`**.
   - Use a Conventional Commit title.
   - Explain **what** changed and **why** in the description.
   - Link the issue it closes: `Fixes #123`.
4. A maintainer will review. Automated checks run on every PR — if one fails
   the log will point you to the fix.

PRs are merged with **squash merge** so every change lands as a single,
well-described commit on `master`.

---

## Reporting bugs and requesting features

Open an [issue](https://github.com/chessviewer-org/chess-viewer/issues) using
the provided templates. For questions and ideas use
[Discussions](https://github.com/chessviewer-org/chess-viewer/discussions).

---

## Code of Conduct

By participating you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).
