# Contributing to ChessVision

ChessVision operates under an **enterprise-grade engineering governance model**.
Contributions are welcome, but they are held to a strict, automated quality bar.
These standards are enforced by Git hooks and the CI/CD pipeline — they are not
discretionary, and they cannot be waived on a per-PR basis.

Read this document in full before opening a pull request. PRs that do not
conform will be **blocked automatically**.

---

## Project Status & Scope

ChessVision is a **purely open-source project**, maintained on a volunteer
basis.

- There is **no bounty program** and **no budget** for paid contributions.
- We do **not** purchase or contract development, design, audit, or marketing
  services.
- All contributions are accepted strictly on a voluntary, open-source basis and
  must meet the standards below.

Inquiries about payment or paid services will be declined. See
[`.github/RESPONSE_TEMPLATES.md`](.github/RESPONSE_TEMPLATES.md).

---

## Non-Negotiable Engineering Standards

Every contribution **must** satisfy all of the following. Each is enforced by
automation (local Git hooks and/or CI).

### 1. Atomic Commits

One logical task per commit. A commit must not mix unrelated concerns (e.g.
application source + dependency bumps + documentation rewrites in a single
commit).

- Enforced locally by [`scripts/validate-atomic-commit.js`](scripts/validate-atomic-commit.js)
  via the `pre-commit` hook, which classifies staged files by domain and rejects
  commits that span unrelated domains.
- Co-located changes that belong together (a source file, its `*.test.ts`, and
  the docs describing it) are treated as one atomic unit.
- Mechanical mass changes (a repo-wide format sweep, a dependency bump) may
  bypass the local check with `ATOMIC_COMMIT_BYPASS=1 git commit ...`. Use this
  sparingly and only for genuinely mechanical changes.

### 2. Conventional Commits

Commit messages **and** PR titles must follow
[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional-scope>): <subject>
```

Allowed types (enforced by `commitlint` and Danger):

| Type       | Use case                                             |
| ---------- | ---------------------------------------------------- |
| `feat`     | New feature                                          |
| `fix`      | Bug fix                                              |
| `docs`     | Documentation only                                   |
| `style`    | Formatting/whitespace; no code-behavior change       |
| `refactor` | Code change that neither fixes a bug nor adds a feat |
| `perf`     | Performance improvement                              |
| `test`     | Adding or correcting tests                           |
| `chore`    | Tooling/maintenance                                  |
| `ci`       | CI configuration                                     |
| `build`    | Build system or dependencies                         |
| `revert`   | Reverts a previous commit                            |

Rules: lower-case type, non-empty subject, no trailing period, header ≤ 100
chars. Enforced by the `commit-msg` hook (`commitlint`) and re-checked on the
PR title by Danger.

> Note: the legacy `update:` prefix is **not** a valid type. Use `feat`,
> `fix`, or `refactor` as appropriate.

### 3. Zero-Warning Quality Gates

All three gates must pass with **zero** warnings/errors:

```bash
pnpm lint           # ESLint — 0 warnings (--max-warnings=0)
npx tsc --noEmit    # TypeScript 6 strict — 0 errors
pnpm test           # FEN parser unit tests (node --test)
```

Prettier formatting is enforced on staged files via `lint-staged` in the
`pre-commit` hook, and re-checked in CI.

### 4. Mandatory Testing

- Behavioral source changes must include or update tests. Danger **warns** when
  `src/**` changes ship without any test change.
- **Any** change to `src/utils/fenParser.ts` **requires** a matching change to
  `src/utils/fenParser.test.js`. Danger **fails** the PR otherwise.

---

## Development Setup

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Git

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/chess-vision.git
cd chess-vision
pnpm install        # also installs Git hooks via husky
pnpm dev            # dev server at http://localhost:3000
```

### Build

```bash
pnpm build    # production build → dist/
pnpm preview  # serve dist/ locally
```

---

## Coding Standards

- TypeScript 6 strict mode throughout — **no** `any`, `@ts-ignore`, or non-null
  assertions (`!`). Use type guards and generics.
- All colors via Tailwind CSS variables (`--accent`, `--bg-primary`, etc.) — **no**
  hardcoded hex values in JSX.
- `memo()` is required on `BoardSquare`, `DraggablePiece`, `DroppableSquare` —
  these render ×64 per board state change.
- Heavy canvas/export work (>1000px) must be offloaded to the SVG raster Web
  Worker — never run synchronously on the main thread.
- After every canvas blob generation: `canvas.width = 0; canvas.height = 0`
  (Safari OOM prevention).
- No bare `console.log` in production paths — use `logger.ts`.
- Import order: framework → third-party → `@/` path aliases → relative paths.

---

## Submitting a Pull Request

1. Branch from `master` (`feature/<name>` or `fix/<description>`).
2. Make atomic, Conventional commits.
3. Run all gates locally: `pnpm test && npx tsc --noEmit && pnpm lint`.
4. Open a PR against `master` with a Conventional Commit **title** and a
   description that explains **what** changed and **why**, linking any related
   issue (e.g. `Fixes #123`).
5. Address automated review (Danger) and human review feedback.

### What the pipeline enforces automatically

| Stage        | Check                                                            |
| ------------ | ---------------------------------------------------------------- |
| `pre-commit` | `lint-staged` (Prettier + ESLint) and atomic-commit validation   |
| `commit-msg` | `commitlint` Conventional Commit validation                      |
| CI (Danger)  | Conventional PR title, description, test coverage, FEN test rule |
| CI (quality) | ESLint zero-warning + Prettier check                             |
| CI (build)   | Production build must succeed                                    |

### Pre-submission Checklist

- [ ] Commits are atomic (one logical task each).
- [ ] PR title and commits follow Conventional Commits.
- [ ] `pnpm test && npx tsc --noEmit && pnpm lint` all pass with zero warnings.
- [ ] Tests added/updated for behavioral changes.
- [ ] No `any`, `@ts-ignore`, or non-null `!`; no hardcoded hex in JSX.
- [ ] PR description explains what and why, with issue references.

---

## Reporting Bugs

1. Search existing issues to avoid duplicates.
2. Reproduce on the latest version.
3. Include: clear description, steps to reproduce, expected vs. actual behavior,
   screenshots/recordings if applicable, and browser/OS versions.

Submit at: https://github.com/BilgeGates/chess-vision/issues

---

## Feature Requests

Include a description of the proposed feature, the use case, expected behavior,
and optional mockups.

---

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## Contact

- GitHub Issues: https://github.com/BilgeGates/chess-vision/issues
- Security issues: [chessvision@protonmail.com](mailto:chessvision@protonmail.com)
