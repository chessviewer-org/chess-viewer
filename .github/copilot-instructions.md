# Copilot Instructions for ChessVision

ChessVision is a React 19 + TypeScript (strict) + Vite chess board editor and
export tool, backed by Supabase. Use these instructions when generating commit
messages, reviewing pull requests, and suggesting code.

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):
`<type>(<optional-scope>): <subject>` — lower-case type, no trailing period,
header under 100 characters.

| Type       | Use for                                            |
| ---------- | -------------------------------------------------- |
| `feat`     | New feature or capability                          |
| `fix`      | Bug fix or correction                              |
| `docs`     | Documentation only                                 |
| `style`    | Formatting / visual tweaks, no logic change        |
| `refactor` | Restructuring with no behavior change              |
| `perf`     | Performance improvement (memoization, render, lag) |
| `test`     | Adding or correcting tests                         |
| `chore`    | Tooling, configs, minor dependency bumps           |
| `ci`       | CI configuration                                   |
| `build`    | Build system or dependencies                       |

## Pull request review

When reviewing a PR, check for these and leave suggestions where they apply:

- **Scope.** Prefer one change per PR — ideally one commit touching one file.
  Several files are fine only when they are small, related changes. Flag PRs
  that mix unrelated concerns (e.g. a feature plus a dependency bump plus a docs
  rewrite).
- **PR title** is a valid Conventional Commit.
- **Tests** accompany behavioral changes. Any change to
  `src/shared/utils/fenParser.ts` must update `fenParser.test.ts`.
- **No `pnpm validate` regressions** — types, lint (zero warnings), format, and
  tests must all stay green.

## Code suggestions — project invariants

- **TypeScript strict:** never suggest `any`, `@ts-ignore`, or non-null `!`.
  Use type guards and generics.
- **Colors** come from Tailwind CSS variables (`--accent`, `--bg-primary`,
  etc.) — never hardcoded hex values in JSX.
- **Memoization:** `BoardSquare`, `DraggablePiece`, and `DroppableSquare` are
  `memo()`'d and render ×64 per board change — don't add props that break memo.
- **Canvas memory:** after every canvas blob generation, set
  `canvas.width = 0; canvas.height = 0` (Safari OOM prevention). Offload
  export-size (>1000px) raster work to the SVG Web Worker, never the main thread.
- **Security:** use `safeJSONParse` for all external string→object parsing
  (localStorage, Supabase). Apply `sanitizeInput` / `sanitizeHexColor` /
  `sanitizeFileName` at system boundaries. Keep `useSecurityCheck` fail-closed.
  Never weaken Supabase RLS.
- **Logging:** use `logger.ts`, not bare `console.log`, in production paths.
