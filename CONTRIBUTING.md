# Contributing to ChessVision

Thanks for taking the time to contribute! ChessVision is an open-source project,
and contributions of all sizes are welcome — bug reports, fixes, features, and
docs.

This guide is short on purpose. The goal is to help you get a change merged
without surprises, not to put you through hoops.

## Getting started

```bash
git clone https://github.com/YOUR_USERNAME/chess-vision.git
cd chess-vision
pnpm install        # also sets up Git hooks
pnpm dev            # dev server at http://localhost:3000
```

Requirements: **Node 22+** and **pnpm 10+**.

## Before you open a pull request

Run the checks locally — the same ones run in CI:

```bash
pnpm validate       # typecheck + lint + format + tests, in one command
```

If `pnpm validate` passes, your PR will pass the quality gates.

A few things the project cares about (the hooks will tell you if you miss one):

- **Keep each PR small and focused.** Aim for **one commit touching one file**.
  Several files in one commit is fine only when they are small, related changes
  that belong together (a fix and its test, a component and its styles).
- **Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org/):
  `type(scope): subject` — e.g. `fix: correct piece rendering in Safari`.
  Common types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`.
- **TypeScript strict mode** — no `any`, `@ts-ignore`, or non-null `!`.
- **Colors** come from Tailwind CSS variables, not hardcoded hex values.
- **Tests** for behavioral changes. Any change to `fenParser.ts` needs a
  matching test in `fenParser.test.ts`.
- **Write it yourself.** We don't accept unreviewed AI-generated PRs. Using a
  tool to help is fine, but you must understand, test, and stand behind every
  line you submit.

Don't worry about memorizing these — `pnpm validate` and the commit hook check
them for you before anything reaches CI.

## Opening the pull request

1. **Create a branch for each change**, off `develop`
   (e.g. `fix/export-scaling` or `feat/svg-export`). One change, one branch.
2. Make your changes and run `pnpm validate`.
3. **Open the PR against `develop`** — never against `master`. Maintainers
   promote `develop` to `master` after testing. Use a Conventional Commit title
   and explain **what** changed and **why**. Link the issue it closes:
   `Fixes #123`.

A maintainer will review it. Automated checks run on every PR; if one fails, the
log will point you to the fix. Feel free to ask questions in the PR — we're
happy to help you get it across the line.

## Reporting bugs and requesting features

Open an [issue](https://github.com/chessvision-org/chess-vision/issues) using the
templates. For questions and ideas, use
[Discussions](https://github.com/chessvision-org/chess-vision/discussions).

## Code of Conduct

By participating, you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).
