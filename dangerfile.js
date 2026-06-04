/**
 * dangerfile.js — automated PR checks for ChessVision.
 *
 * Runs in CI via `pnpm danger ci` on pull_request events. These checks mirror
 * what's described in CONTRIBUTING.md and exist to give contributors fast,
 * friendly feedback before a human review:
 *
 *   1. PR title follows Conventional Commits (types kept in sync with
 *      .commitlintrc.json).
 *   2. Source changes ship with test changes.
 *   3. PR has a meaningful description.
 *   4. PR stays small and focused (warns on sprawling diffs).
 *   5. Handy reminders (lockfile sync, FEN parser tests).
 *
 * `fail()` asks for a change before merge; `warn()` / `message()` are advisory.
 */

import { danger, fail, markdown, message, warn } from 'danger';

const pr = danger.github.pr;
const modified = danger.git.modified_files;
const created = danger.git.created_files;
const allChanged = [...modified, ...created, ...danger.git.deleted_files];
const touched = [...modified, ...created];

// Conventional Commit types — MUST match .commitlintrc.json type-enum.
const CONVENTIONAL_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'chore',
  'ci',
  'build',
  'revert'
];

// ---------------------------------------------------------------------------
// 1. Conventional Commit PR title
// ---------------------------------------------------------------------------
const titlePattern = new RegExp(
  `^(${CONVENTIONAL_TYPES.join('|')})(\\([\\w$.\\-*/ ]+\\))?(!)?: .+`
);

if (!titlePattern.test(pr.title)) {
  fail(
    [
      `**PR title is not a valid Conventional Commit.**`,
      '',
      `Received: \`${pr.title}\``,
      '',
      `Expected: \`<type>(optional-scope): <subject>\``,
      `Allowed types: ${CONVENTIONAL_TYPES.map((t) => `\`${t}\``).join(', ')}`,
      '',
      'Examples: `feat(export): add SVG batch export`, `fix: correct FEN parsing on en passant`'
    ].join('\n')
  );
} else if (/\.$/.test(pr.title)) {
  fail('**PR title must not end with a period.**');
}

// ---------------------------------------------------------------------------
// 2. Mandatory testing — source changes require test changes
// ---------------------------------------------------------------------------
const isSource = (f) =>
  f.startsWith('src/') &&
  /\.[jt]sx?$/.test(f) &&
  !/\.(test|spec)\.[jt]sx?$/.test(f);

const isTest = (f) =>
  /\.(test|spec)\.[jt]sx?$/.test(f) || /(^|\/)(__tests__|tests?)\//.test(f);

const sourceChanges = touched.filter(isSource);
const testChanges = touched.filter(isTest);

if (sourceChanges.length > 0 && testChanges.length === 0) {
  warn(
    [
      '**Source changed but no tests were added or updated.**',
      '',
      'If this PR changes behavior, please add or update a co-located',
      '`*.test.ts`. If it is a pure refactor or cosmetic change with no',
      'behavior change, just note that in the description.'
    ].join('\n')
  );
}

// fenParser is a hard invariant: any change requires its test to change too.
const touchedFenParser = touched.some((f) =>
  f.endsWith('src/shared/utils/fenParser.ts')
);
const touchedFenParserTest = touched.some((f) =>
  f.endsWith('src/shared/utils/fenParser.test.ts')
);

if (touchedFenParser && !touchedFenParserTest) {
  fail(
    '**`fenParser.ts` changed without updating `fenParser.test.ts`.** ' +
      'Every change to the FEN parser requires a corresponding test (see CONTRIBUTING.md).'
  );
}

// ---------------------------------------------------------------------------
// 3. PR description must exist
// ---------------------------------------------------------------------------
if (!pr.body || pr.body.trim().length < 20) {
  fail(
    '**PR description is missing or too short.** Describe what changed and why, ' +
      'and link any related issue (e.g. `Fixes #123`).'
  );
}

// ---------------------------------------------------------------------------
// 4. Atomic / scoped PR — advisory
// ---------------------------------------------------------------------------
const BIG_PR_FILE_COUNT = 40;

if (allChanged.length > BIG_PR_FILE_COUNT) {
  warn(
    `**Large PR:** ${allChanged.length} files changed. If you can, split this ` +
      'into smaller PRs (one change each) — they are much easier to review.'
  );
}

// ---------------------------------------------------------------------------
// 5. Invariant reminders
// ---------------------------------------------------------------------------
const depsChanged = touched.some(
  (f) => f === 'package.json' || f === 'pnpm-lock.yaml'
);
const onlyPackageJson =
  touched.includes('package.json') && !touched.includes('pnpm-lock.yaml');

if (depsChanged && onlyPackageJson) {
  warn(
    '`package.json` changed but `pnpm-lock.yaml` did not. Run `pnpm install` and ' +
      'commit the updated lockfile so CI `--frozen-lockfile` does not fail.'
  );
}

const editedHooksOrCi = allChanged.some(
  (f) => f.startsWith('.husky/') || f.startsWith('.github/workflows/')
);
if (editedHooksOrCi) {
  message(
    'This PR modifies git hooks or CI workflows — verify the pipeline still ' +
      'blocks non-conforming commits/PRs.'
  );
}

markdown(
  [
    '### Reviewer checklist',
    '',
    '- [ ] `pnpm test && npx tsc --noEmit && pnpm lint` all green (0 warnings).',
    '- [ ] Commits are atomic and Conventional.',
    '- [ ] No `any`, `@ts-ignore`, or non-null `!`.',
    '- [ ] No hardcoded hex colors in JSX.',
    '- [ ] Canvas blobs followed by `canvas.width = 0`.'
  ].join('\n')
);
