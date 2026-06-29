# Code Quality Setup

ESLint, Prettier, Husky, and Commitlint configuration reference for ChessVision.

All tools are already installed and configured in the repository. This document explains what each tool does and how to use it.

---

## Tools

| Tool         | Purpose                                         | Config file         |
| ------------ | ----------------------------------------------- | ------------------- |
| ESLint 9     | Static analysis — zero warnings allowed in CI   | `eslint.config.js`  |
| Prettier 3   | Code formatting                                 | (default config)    |
| Husky 9      | Git hooks                                       | `.husky/`           |
| lint-staged  | Run linters only on staged files                | `package.json`      |
| commitlint   | Enforce Conventional Commits on commit messages | (commitlint config) |
| TypeScript 6 | Type checking — zero errors required            | `tsconfig.json`     |

---

## Daily Commands

```bash
# Run all four quality gates (required before every commit)
pnpm validate      # typecheck + lint + format:check + test

# Individual gates
pnpm typecheck     # tsc --noEmit — 0 errors required
pnpm lint          # ESLint — 0 warnings allowed
pnpm lint:fix      # auto-fix
pnpm format        # Prettier write
pnpm format:check  # Prettier check without writing
pnpm test          # node:test unit tests
```

---

## ESLint

Configured in `eslint.config.js` with:

- `@typescript-eslint` — TypeScript-aware rules
- `eslint-plugin-react` — React-specific rules
- `eslint-plugin-react-hooks` — `react-hooks/exhaustive-deps` is an **error**, not a warning
- `eslint-plugin-react-refresh` — Vite HMR compatibility

Key enforced rules:

- No `any`, `@ts-ignore`, or non-null assertions
- No bare `console.log` in production paths
- `react/jsx-no-target-blank` — `target="_blank"` requires `rel="noopener noreferrer"`
- No unused variables or imports

Zero warnings allowed in CI (`--max-warnings=0`).

---

## Prettier

Default configuration with the following project preferences:

- Single quotes
- Semicolons required
- 2-space indentation
- Trailing commas where valid in ES5
- Print width: 100 characters

Runs automatically on staged files via Husky + lint-staged before every commit.

---

## Husky Hooks

**Pre-commit:** Runs `lint-staged` — lints and formats only staged files.

**Commit-msg:** Runs commitlint to validate the commit message format.

If a hook fails:

```bash
# Fix lint errors manually
pnpm lint:fix

# Fix formatting
pnpm format

# Re-stage and commit
git add -p
git commit -m "fix: your message"
```

---

## Commit Message Format

This project uses a prefix convention (enforced by commitlint):

```
<type>: <subject>
```

| Type       | Use case                               |
| ---------- | -------------------------------------- |
| `feat`     | New feature                            |
| `fix`      | Bug fix                                |
| `update`   | Modification to existing functionality |
| `refactor` | Code cleanup, no behavior change       |
| `docs`     | Documentation only                     |
| `perf`     | Performance improvement                |
| `test`     | Test additions or corrections          |
| `style`    | Formatting, visual-only changes        |
| `chore`    | Build config, dependency bumps         |
| `ci`       | CI/CD changes                          |
| `revert`   | Revert a previous commit               |

Subject: imperative mood, lowercase start, no trailing period, max 72 characters.

**Valid:**

```
feat: add URL-based position sharing
fix: piece drag offset on touch devices
refactor: consolidate export dimension calculation
docs: update export pipeline reference
```

**Invalid:**

```
Added new feature          # missing type
FEAT: add dark mode        # type must be lowercase
feat:add feature           # missing space after colon
feat: Add feature.         # uppercase start, trailing period
```

---

## TypeScript

TypeScript 6 strict mode is enforced via `tsconfig.json`:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitAny": true
}
```

Type check command:

```bash
pnpm typecheck
```

Zero errors required. `any`, `@ts-ignore`, and non-null assertions (`!`) are forbidden.

---

## VS Code Integration

Recommended extensions (`.vscode/extensions.json`):

- `dbaeumer.vscode-eslint`
- `esbenp.prettier-vscode`

Recommended settings (`.vscode/settings.json`):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

---

## Troubleshooting

**Husky hooks not running:**

```bash
# Reinstall Husky
pnpm prepare
```

**ESLint cache stale:**

```bash
rm -rf node_modules/.cache && pnpm lint
```

**Commit blocked by commitlint:**

```bash
# Test your message before committing
echo "feat: your description" | npx commitlint
```

---

_Last updated: May 2026 — v6.1.0_
