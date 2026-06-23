/**
 * dangerfile.js — automated PR gate for ChessVision.
 *
 * Philosophy: fail() only on hard violations that must be fixed before merge.
 * No noisy warnings on cosmetic/refactor PRs. No bot-generated checklists
 * that duplicate the PR template.
 *
 * Gates:
 *   1. PR title follows Conventional Commits.
 *   2. PR has a meaningful description.
 *   3. fenParser.ts changes require fenParser.test.ts changes.
 *   4. package.json changes require a lockfile update.
 */

import { danger, fail, warn } from 'danger';

const pr = danger.github.pr;
const modified = danger.git.modified_files;
const created = danger.git.created_files;
const deleted = danger.git.deleted_files;
const touched = [...modified, ...created];
const allChanged = [...touched, ...deleted];

// ---------------------------------------------------------------------------
// 1. Conventional Commit PR title
// ---------------------------------------------------------------------------
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

const titlePattern = new RegExp(
  `^(${CONVENTIONAL_TYPES.join('|')})(\\([\\w$.\\-*/ ]+\\))?(!)?: .+`
);

if (!titlePattern.test(pr.title)) {
  fail(
    `**PR title must follow Conventional Commits.**\n\n` +
      `Received: \`${pr.title}\`\n\n` +
      `Expected format: \`<type>(optional-scope): <subject>\`\n` +
      `Allowed types: ${CONVENTIONAL_TYPES.map((t) => `\`${t}\``).join(', ')}\n\n` +
      `Examples:\n` +
      `- \`feat(export): add SVG batch export\`\n` +
      `- \`fix: correct FEN parsing on en passant\``
  );
} else if (/\.$/.test(pr.title)) {
  fail('**PR title must not end with a period.**');
}

// ---------------------------------------------------------------------------
// 2. PR description
// ---------------------------------------------------------------------------
if (!pr.body || pr.body.trim().length < 20) {
  fail(
    '**PR description is missing or too short.**\n\n' +
      'Describe what changed and why. Link related issues with `Fixes #N`.'
  );
}

// ---------------------------------------------------------------------------
// 3. FEN parser hard invariant
// ---------------------------------------------------------------------------
const touchedFenParser = touched.some((f) =>
  f.endsWith('src/shared/utils/fenParser.ts')
);
const touchedFenParserTest = touched.some((f) =>
  f.endsWith('src/shared/utils/fenParser.test.ts')
);

if (touchedFenParser && !touchedFenParserTest) {
  fail(
    '**`fenParser.ts` changed without updating `fenParser.test.ts`.**\n\n' +
      'Every change to the FEN parser must be covered by a corresponding test.'
  );
}

// ---------------------------------------------------------------------------
// 4. Lockfile consistency
// ---------------------------------------------------------------------------
const changedPackageJson = allChanged.includes('package.json');
const changedLockfile = allChanged.includes('pnpm-lock.yaml');

if (changedPackageJson && !changedLockfile) {
  warn(
    '**`package.json` changed but `pnpm-lock.yaml` did not.**\n\n' +
      'Run `pnpm install` and commit the updated lockfile so CI does not fail.'
  );
}

// ---------------------------------------------------------------------------
// 5. Large PR advisory (warn only, never block)
// ---------------------------------------------------------------------------
if (allChanged.length > 50) {
  warn(
    `**Large PR:** ${allChanged.length} files changed.\n\n` +
      'Consider splitting into smaller focused PRs — they are faster to review and easier to revert.'
  );
}
