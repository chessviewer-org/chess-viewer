# Contributing to ChessVision

Thank you for considering a contribution. ChessVision is open source and welcomes
bug reports, feature requests, documentation improvements, and code.

It is also held to a strict, automated quality bar. The standards below are
enforced by Git hooks and the CI/CD pipeline — they are not discretionary and
cannot be waived on a per-PR basis. Pull requests that do not conform are
**blocked automatically**.

Please read this document in full before opening your first pull request. This
guide describes the workflow against the **v5.5.9 stable line** on `master`.
Forward-looking development for the next major release happens on `develop`.

---

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Project Status & Scope](#project-status--scope)
- [Maintenance Scope (v5.x)](#maintenance-scope-v5x)
- [Engineering Standards](#engineering-standards)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Branch Model](#branch-model)
- [Commit Conventions](#commit-conventions)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Labels and Project Board](#labels-and-project-board)
- [Code of Conduct](#code-of-conduct)
- [Security](#security)
- [Contact](#contact)

---

## Ways to Contribute

- Report bugs — see [Reporting Bugs](#reporting-bugs).
- Suggest features — see [Feature Requests](#feature-requests).
- Improve or add code — bug fixes, refactors, performance work.
- Improve documentation.
- Review open pull requests.

---

## Project Status & Scope

ChessVision is an open-source project maintained on a volunteer basis.

- There is **no bounty program** and **no budget for paid contributions**. We do
  not purchase or contract development, design, audit, or marketing services.
- All contributions are accepted strictly on a voluntary, open-source basis and
  must meet the standards in this document.

**Sponsorship is separate from contribution.** Voluntary donations through
[GitHub Sponsors](https://github.com/sponsors/chessvision-org) help fund
maintenance, dependency upkeep, and hosting. They are not payment for work, they
confer no influence over the roadmap or review process, and contributing never
requires a sponsorship. Inquiries about *being paid to contribute* will be
declined — see [`.github/RESPONSE_TEMPLATES.md`](.github/RESPONSE_TEMPLATES.md).

---

## Maintenance Scope (v5.x)

The `master` branch is in maintenance mode. Knowing what is in scope before you
start saves review round-trips.

### In scope for v5.5.x patch releases

- Security patches (dependency CVEs, SAST findings).
- Dependabot dependency bumps for direct dependencies, reviewed and merged in batches.
- Documentation corrections, typo fixes, and link-rot repair.
- CI and release-pipeline fixes.
- Build-configuration fixes that do not alter user-facing behavior.

### Not in scope for v5.5.x patch releases

- New user-facing features.
- Schema or API changes.
- Breaking changes to `localStorage` keys, FEN history format, or settings shape.
- TypeScript migration of additional files.
- Performance refactors that change observable behavior.

Pull requests against `master` that fall outside this scope will be redirected to
`develop`.

---

## Engineering Standards

Every contribution **must** satisfy all of the following. Each is enforced by
automation (local Git hooks and/or CI).

### 1. Atomic Commits

One logical task per commit. A commit must not mix unrelated concerns (e.g.
application source + dependency bumps + documentation rewrites in a single
commit).

- Enforced locally by [`scripts/validate-atomic-commit.js`](scripts/validate-atomic-commit.js)
  via the `pre-commit` hook, which classifies staged files by domain and rejects
  commits that span unrelated domains.
- Co-located changes that belong together (a source file, its `*.test.js`, and
  the docs describing it) are treated as one atomic unit.
- Mechanical mass changes (a repo-wide format sweep, a dependency bump) may
  bypass the local check with `ATOMIC_COMMIT_BYPASS=1 git commit ...`. Use this
  sparingly and only for genuinely mechanical changes.

### 2. Conventional Commits

Commit messages **and** PR titles must follow
[Conventional Commits](https://www.conventionalcommits.org/) — see
[Commit Conventions](#commit-conventions) for the full type list and rules.

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
- pnpm >= 9 (the lockfile is produced by pnpm 10.33.0)
- Git

### Installation

```bash
# Replace YOUR_USERNAME with your fork's owner.
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
  these render ×64 per board state change. Use the form
  `const X = memo(function X({ props }) { ... })`.
- Heavy canvas/export work (>1000px) must be offloaded to the SVG raster Web
  Worker — never run synchronously on the main thread.
- After every canvas blob generation: `canvas.width = 0; canvas.height = 0`
  (Safari OOM prevention). This invariant must not be removed.
- No bare `console.log` in production paths — use `logger.js`.
- `safeJSONParse` is mandatory for every untrusted string-to-object conversion.
  Direct `JSON.parse` on external data is forbidden.
- `sanitizeFileName`, `sanitizeInput`, and `sanitizeHexColor` apply at system
  boundaries.
- `MAX_FEN_LENGTH = 93` is enforced before any FEN parse.
- All exported functions use `export function` declarations rather than
  arrow-function exports, and carry JSDoc with `@param` and `@returns`.
- Import order: framework → third-party → `@/` path aliases → relative paths.
- Functions are small and single-purpose. Prefer well-named identifiers over
  running commentary; avoid unnecessary inline comments.

---

## Branch Model

- `master` — stable. Receives only changes within the v5.x maintenance scope.
- `develop` — active development for the next major release.

Feature branches target `develop`. Patch branches within the v5.x maintenance
scope target `master` directly.

```bash
# Feature branch (targets develop):
git checkout -b feat/your-feature-name develop

# Bug-fix branch (targets master if within maintenance scope, else develop):
git checkout -b fix/bug-description master
```

---

## Commit Conventions

ChessVision uses [Conventional Commits](https://www.conventionalcommits.org/).
Commitlint enforces the format on the `commit-msg` hook; non-conforming messages
are rejected locally, and Danger re-checks the PR title.

```
<type>(<optional-scope>): <subject>
```

Allowed types:

| Type       | Use case                                                |
| ---------- | ------------------------------------------------------- |
| `feat`     | New user-facing feature                                 |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `style`    | Formatting/whitespace; no code-behavior change          |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or correcting tests                              |
| `build`    | Build-system or external-dependency changes             |
| `ci`       | CI configuration changes                                |
| `chore`    | Other changes that do not modify source or test files   |
| `revert`   | Reverts a previous commit                               |

Rules: lower-case type, non-empty subject, no trailing period, header ≤ 100
characters. The optional scope in parentheses identifies the affected subsystem.

> Note: the legacy `update:` prefix is **not** a valid type. Use `feat`, `fix`,
> or `refactor` as appropriate.

Examples:

```
feat(board): add board flip toggle
fix(export): release canvas after svgExporter blob generation
docs(contributing): update commit-message convention
chore(deps): bump react-router-dom from 7.15.0 to 7.15.1
```

`semantic-release` operates against `master` and derives version bumps from these
prefixes.

---

## Reporting Bugs

1. Search [existing issues](https://github.com/chessvision-org/chess-vision/issues)
   to avoid duplicates.
2. Reproduce the bug on the latest tagged release (or `master` HEAD if you build
   locally).
3. Open a new issue using one of the two bug templates:
   - **Bug Report** — the structured form (`bug_report.yml`). Preferred.
   - **Bug Report (Quick)** — the plain Markdown alternative (`bug_report.md`).
     Use when the structured form is not appropriate.

Include in every report:

- A one-sentence summary of the defect.
- Numbered reproduction steps from a clean session.
- Expected behavior.
- Actual behavior, with error messages, stack traces, or console output if any.
- Browser and version, operating system, and whether the issue reproduces on
  desktop, mobile, or both.
- The ChessVision version or commit hash.

Bugs in the export pipeline must additionally name the export preset, the
requested board size, and any cancellation or pause activity.

### Triage and Severity

Maintainers apply `area:*`, `priority:*`, and `effort:*` labels on triage.

- **Crash-class** bugs (canvas OOM, navigation crashes, export regressions) are
  prioritized for backport to `master` as a v5.5.x patch.
- **Functional** bugs that do not crash or destroy data are routinely triaged;
  non-routine fixes may be deferred to the next major release.
- **Cosmetic** issues are deferred to the next major unless trivial.

---

## Feature Requests

Use the **Feature Request** template (`feature_request.yml`) on the New Issue
picker. Each request should describe:

- The problem the feature solves, framed in terms of a user task.
- The proposed behavior.
- Alternatives considered.
- Whether the request applies to the v5.x stable line or the next major release.

Feature requests against `master` are accepted only when they fall within the
v5.x maintenance scope. New user-facing features generally land on `develop` and
ship in the next major release.

---

## Submitting a Pull Request

1. Branch from the appropriate base (`master` for in-scope v5.x patches,
   `develop` otherwise).
2. Make atomic, Conventional commits.
3. Run all gates locally:
   ```bash
   pnpm test           # node --test against src/utils/fenParser.test.js
   pnpm lint           # ESLint with --max-warnings=0
   npx tsc --noEmit    # TypeScript strict, 0 errors
   pnpm format:check   # Prettier check, no writes
   ```
4. Open a PR against the chosen base with a Conventional Commit **title** and a
   description that explains **what** changed and **why**, linking any related
   issue (e.g. `Fixes #123`). Include screenshots for any UI change.
5. Address automated review (Danger) and human review feedback by pushing
   updates to the same branch.

### What the Pipeline Enforces Automatically

| Stage        | Check                                                            |
| ------------ | --------------------------------------------------------------- |
| `pre-commit` | `lint-staged` (Prettier + ESLint) and atomic-commit validation  |
| `commit-msg` | `commitlint` Conventional Commit validation                     |
| CI (Danger)  | Conventional PR title, description, test coverage, FEN test rule |
| CI (quality) | ESLint zero-warning + Prettier check                            |
| CI (build)   | Production build must succeed                                   |

### Pre-submission Checklist

- [ ] Commits are atomic (one logical task each).
- [ ] PR title and commits follow Conventional Commits.
- [ ] `pnpm test && npx tsc --noEmit && pnpm lint` all pass with zero warnings.
- [ ] `pnpm format:check` passes.
- [ ] Tests added/updated for behavioral changes.
- [ ] No `any`, `@ts-ignore`, or non-null `!`; no hardcoded hex in JSX.
- [ ] No console errors or warnings introduced.
- [ ] Documentation updated if observable behavior changed.
- [ ] Branch is up to date with the chosen base (`master` or `develop`).
- [ ] If touching the export pipeline: the Safari `canvas.width = 0` disposal
      invariant is preserved.
- [ ] PR description explains what and why, with issue references.

---

## Labels and Project Board

All open issues are tracked on the
[ChessVision project board](https://github.com/orgs/chessvision-org/projects/1)
and carry the following label families:

| Family       | Values                                | Meaning            |
| ------------ | ------------------------------------- | ------------------ |
| `area:*`     | `area:export`, `area:ci`, `area:auth` | Subsystem affected |
| `priority:*` | `priority:high`, `priority:low`       | Triage priority    |
| `effort:*`   | `effort:small`, `effort:large`        | Expected effort    |

Type labels (`bug`, `enhancement`, `documentation`, `question`, etc.) are applied
in addition to the triage labels above. Issues without these labels are awaiting
triage by a maintainer; contributors should not self-apply labels they do not
have permission to set.

---

## Code of Conduct

This project is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By
participating, you are expected to uphold it.

---

## Security

Security-sensitive reports must not be filed as public GitHub issues. The
supported disclosure channel is documented in [SECURITY.md](SECURITY.md).

---

## Contact

- GitHub Issues: https://github.com/chessvision-org/chess-vision/issues
- Repository: https://github.com/chessvision-org/chess-vision
- Project board: https://github.com/orgs/chessvision-org/projects/1
- Live demo: https://chessvision.org
- Sponsorship: https://github.com/sponsors/chessvision-org
- General contact: contact@chessvision.org
- Security reports: see [SECURITY.md](SECURITY.md)
