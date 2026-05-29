# CHANGES — refactor/v6.0.0-ux-overhaul

Branch base: `develop` (includes Phase A: `0f3b2e3`, `76a732d`, `8e3acdb`).
Scope this PR: frontend trim + restructure tasks only.

## In scope (this PR)

- **Task 2** — Trim `ControlPanel` to FEN actions + Advanced FEN link. Move `PieceSelector` and `DisplayOptions` out of the right column (they remain in the wizard's `PieceDisplayStep`).
- **Task 9** — Remove "Theme Customization" tab from `SettingsPage`. Redirect `?tab=theme` → default tab. Theming is reachable via the in-board gear popover (Task 1) and the wizard's `ThemeStudioStep`.
- **Task 10** — Remove "Export Customization" tab from `SettingsPage`. Redirect `?tab=export` → default tab. Export config is reachable via the wizard's `ExportSettingsStep`. The three localStorage keys (`chess-board-size`, `chess-file-name`, `chess-export-quality`) are already owned by `useHomeBoardState.ts`; deleting the Settings copies removes duplicate state.
- **Task 1** — Refactor `ChessEditor`'s in-board gear button to open a floating Quick Theme popover anchored to the gear (not the existing right-side swap panel). Popover content: theme color preset grid only. A new `QuickThemePopover` component is added (reuses the existing `ThemePresetButton` tile); `ThemeMainView` is intentionally left intact for future reuse by Task 3 (wizard custom studio). The right-side `PiecePalette` stays visible at all times — the previous Theme/Palette swap on gear click is removed.

## Deferred to follow-up PRs

- **Task 3** — Theme studio redesign with HSL picker. Substantial UI build; needs its own PR.
- **Task 4** — Wizard step 2 redesign + 3 net-new board features (last-move highlight, side-to-move indicator, square-notation overlay) that don't exist in the codebase yet.
- **Task 5** — Wizard step 3 dynamic export preview, conditional format options, filename templating.
- **Task 6** — Nav user menu redesign.
- **Task 7** — Account Profile page (requires `profiles` table writes, avatar upload, sessions list).
- **Task 8** — Security & Privacy page (requires new `get_security_overview` RPC, OAuth identity queries, encryption-key rotation crypto).
- **Task 11** — Data Management polish (storage breakdown, encrypted `.cvb` export, account deletion cascade).
- **Task 12** — Live-sync verification matrix (requires browser-driven testing — no Playwright in repo).
- **Task 13** — Performance audit (React Profiler, before/after metrics — needs browser tooling).

## Decisions & deviations from the brief

1. **Brief said "single PR"** but listed "one Conventional Commit per task" and a deliverable list (PERFORMANCE.md, SECURITY-CHECKLIST.md, screenshots) that doesn't fit one PR. Per the user's `AUDIT.md` roll-out plan (one PR per phase) and the user's session-start scope decision, this PR delivers only the trim + restructure tasks above. Other tasks become follow-up PRs.
2. **Brief said "gear icon at top-left of the chess board."** Code has it at top-right of the board area (`ChessEditor.tsx:84-94`). Treated as the same icon.
3. **Brief said "REMOVE: Main/Custom toggle from this context."** Interpreted as: the in-board gear popover shows only theme presets. Custom theming UI moves entirely to the wizard's `ThemeStudioStep` (Task 3 — out of scope for this PR; existing `ThemeMainView`'s Custom mode keeps existing behavior wherever else it is reachable until Task 3 lands).
4. **No multi-agent coordination.** The roster (`@FE-AGENT`, etc.) is treated as sequential role-hats, not separate processes.

## Out of scope (explicitly not touched)

- Backend RPCs / schema changes (no Supabase migrations in this PR).
- Multi-agent cross-validation (single-pass implementation).
- Screenshots, PERFORMANCE.md, SECURITY-CHECKLIST.md (require deferred tasks first).

## Verification

- All three gates green per CLAUDE.md: `pnpm test`, `npx tsc --noEmit`, `pnpm lint`.
- Browser-driven verification (sharpness on resize, popover behavior, scrollbar absence) **not** performed in this PR — no Playwright/Puppeteer in the repo and no skill installed it. Requires manual eyes-on.
