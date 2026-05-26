# Contributing to ChessVision

Contributions are welcome: bug reports, feature requests, documentation improvements, and code changes. This document describes the workflow for contributions against the **v5.5.3 stable line** on `master`. Forward-looking development for the next major release happens on `develop`.

Read this document in full before opening your first pull request. The repository enforces several quality gates and conventions that are not optional.

---

## Ways to Contribute

- Report bugs (see [Reporting Bugs](#reporting-bugs))
- Suggest features (see [Feature Requests](#feature-requests))
- Improve or add code (bug fixes, refactors, optimizations)
- Improve documentation
- Review pull requests

---

## Reporting Bugs

Before opening an issue:

1. Search [existing issues](https://github.com/BilgeGates/chess-vision/issues) to avoid duplicates.
2. Reproduce the bug on the latest tagged release (or `master` HEAD if you build locally).
3. Open a new issue using one of the two bug templates:
   - **Bug Report** — the structured form (`bug_report.yml`). Preferred.
   - **Bug Report (Quick)** — the plain Markdown alternative (`bug_report.md`). Use when the structured form is not appropriate.

Include in every report:

- A one-sentence summary of the defect.
- Numbered reproduction steps from a clean session.
- Expected behavior.
- Actual behavior, with error messages, stack traces, or console output if any.
- Browser and version, operating system, and whether the issue reproduces on desktop, mobile, or both.
- The ChessVision version or commit hash.

Bugs in the export pipeline must additionally name the export preset, the requested board size, and any cancellation or pause activity.

### Triage and severity

Every open issue carries an `area:*`, `priority:*`, and `effort:*` label. Maintainers apply these on triage.

- **Crash-class** bugs (canvas OOM, navigation crashes, export regressions) are prioritized for backport to `master` as a v5.5.x patch.
- **Functional** bugs that do not crash or destroy data are routinely triaged; non-routine fixes may be deferred to the next major release.
- **Cosmetic** issues are deferred to the next major unless trivial.

---

## Feature Requests

Use the **Feature Request** template (`feature_request.yml`) on the New Issue picker. Each request should describe:

- The problem the feature solves, framed in terms of a user task.
- The proposed behavior.
- Alternatives considered.
- Whether the request applies to the v5.x stable line or to the next major release.

Feature requests against `master` are accepted only when they fall within the v5.x maintenance scope (see [Maintenance Scope](#maintenance-scope-v5x)). New user-facing features generally land on `develop` and ship in the next major.

---

## Maintenance Scope (v5.x)

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

Pull requests against `master` that fall outside this scope will be redirected to `develop`.

---

## Labels and Project Board

All open issues are tracked on the [ChessVision project board](https://github.com/users/BilgeGates/projects/4) and carry the following label families:

| Family       | Values                                | Meaning            |
| ------------ | ------------------------------------- | ------------------ |
| `area:*`     | `area:export`, `area:ci`, `area:auth` | Subsystem affected |
| `priority:*` | `priority:high`, `priority:low`       | Triage priority    |
| `effort:*`   | `effort:small`, `effort:large`        | Expected effort    |

Type labels (`bug`, `enhancement`, `documentation`, `question`, etc.) are applied in addition to the triage labels above. Issues without these labels are awaiting triage by a maintainer; contributors should not self-apply labels they do not have permission to set.

---

## Development Setup

### Prerequisites

- Node.js >= 20
- pnpm >= 9 (lockfile is produced by pnpm 10.33.0)
- Git

### Installation

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/chess-vision.git
cd chess-vision
pnpm install
pnpm dev
```

The dev server runs at `http://localhost:3000`.

### Build

```bash
pnpm build    # production build → dist/
pnpm preview  # serve dist/ locally
```

---

## Making Changes

### Branch Model

- `master` — stable. Receives only changes within the v5.x maintenance scope.
- `develop` — active development for the next major release.

Feature branches target `develop`. Patch branches against the v5.x line target `master` directly and must remain within the maintenance scope.

```bash
# Feature branch (targets develop):
git checkout -b feat/your-feature-name develop

# Bug-fix branch (targets master if within maintenance scope, else develop):
git checkout -b fix/bug-description master
```

### Coding Standards

- All exported functions use `export function` declarations rather than arrow-function exports.
- All exported functions and components carry JSDoc with `@param` and `@returns`.
- Memoized components: `const X = memo(function X({ props }) { ... })`.
- Import order: React and framework imports first, then third-party packages, then `@/` aliased paths, then relative paths.
- No unnecessary inline comments; well-named identifiers are preferred over running commentary.
- Functions are small and single-purpose.
- `safeJSONParse` is mandatory for every untrusted string-to-object conversion. Direct `JSON.parse` on external data is forbidden.
- `sanitizeFileName`, `sanitizeInput`, and `sanitizeHexColor` apply at system boundaries.
- `MAX_FEN_LENGTH = 93` is enforced before any FEN parse.
- The Safari canvas-disposal invariant (`canvas.width = 0` after every blob generation) must not be removed.

### Commit Messages

ChessVision uses [Conventional Commits](https://www.conventionalcommits.org/). Commitlint enforces the format on the `commit-msg` hook; non-conforming messages are rejected locally.

| Type       | Use case                                                |
| ---------- | ------------------------------------------------------- |
| `feat`     | New user-facing feature                                 |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or correcting tests                              |
| `build`    | Build-system or external-dependency changes             |
| `ci`       | CI configuration changes                                |
| `chore`    | Other changes that do not modify source or test files   |
| `revert`   | Reverts a previous commit                               |

Optional scope in parentheses identifies the affected subsystem.

Examples:

```
feat(board): add board flip toggle
fix(export): release canvas after svgExporter blob generation
docs(contributing): update commit-message convention
chore(deps): bump react-router-dom from 7.15.0 to 7.15.1
```

`semantic-release` operates against `master` and derives version bumps from these prefixes.

---

## Submitting a Pull Request

1. Push your branch to your fork.
2. Open a pull request against the appropriate base branch:
   - `develop` for new features and any change outside the v5.x maintenance scope.
   - `master` for v5.x patches that remain within the maintenance scope.
3. In the PR description, include:
   - What changed and why.
   - Related issue references (for example, `Fixes #123`).
   - Screenshots for any UI change.
4. Address review feedback and push updates to the same branch.

### Pre-submission Checklist

- [ ] All three quality gates pass locally:

  ```bash
  pnpm test           # node --test against src/utils/fenParser.test.js
  pnpm lint           # ESLint with --max-warnings=0
  pnpm format:check   # Prettier check, no writes
  ```

- [ ] Code follows the standards in [Coding Standards](#coding-standards).
- [ ] No console errors or warnings introduced.
- [ ] Changes tested locally across the relevant scenarios.
- [ ] Documentation updated if observable behavior changed.
- [ ] Commit messages follow Conventional Commits.
- [ ] Branch is up to date with the chosen base (`master` or `develop`).
- [ ] If touching the export pipeline: the Safari `canvas.width = 0` disposal invariant is preserved.

---

## Documentation

Contributing to documentation is as valuable as code contributions:

- Improve clarity in README or docs/
- Add JSDoc where missing
- Fix typos or outdated information
- Document architectural decisions in docs/DECISIONS.md

---

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## Security

Security-sensitive reports must not be filed as public GitHub issues. The supported disclosure channel is documented in [SECURITY.md](SECURITY.md).

---

## Contact

- GitHub Issues: https://github.com/BilgeGates/chess-vision/issues
- Repository: https://github.com/BilgeGates/chess-vision
- Project board: https://github.com/users/BilgeGates/projects/4
- Live demo: https://chess-vision-site.vercel.app
- Support email: chessvision@protonmail.com
