const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;
const eventPath = process.env.GITHUB_EVENT_PATH;

if (!token || !repo || !eventPath) {
  console.error(
    'pr-checks: missing GITHUB_TOKEN, GITHUB_REPOSITORY, or GITHUB_EVENT_PATH'
  );
  process.exit(1);
}

const event = JSON.parse(await readFile(eventPath));
const prNumber = event.pull_request?.number;
if (!prNumber) {
  console.log('pr-checks: not a pull_request event, skipping');
  process.exit(0);
}

const [owner, repoName] = repo.split('/');
const api = `https://api.github.com/repos/${owner}/${repoName}`;

async function ghFetch(path, init) {
  const res = await fetch(`${api}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...init?.headers
    }
  });
  if (!res.ok) {
    throw new Error(
      `GitHub API ${path} failed: ${res.status} ${await res.text()}`
    );
  }
  return res.json();
}

async function readFile(path) {
  const { readFile: read } = await import('node:fs/promises');
  return read(path, 'utf8');
}

async function listChangedFiles() {
  const files = [];
  let page = 1;
  for (;;) {
    const batch = await ghFetch(
      `/pulls/${prNumber}/files?per_page=100&page=${page}`
    );
    files.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return files;
}

const pr = await ghFetch(`/pulls/${prNumber}`);
const files = await listChangedFiles();

const modified = files
  .filter((f) => f.status === 'modified')
  .map((f) => f.filename);
const created = files
  .filter((f) => f.status === 'added')
  .map((f) => f.filename);
const deleted = files
  .filter((f) => f.status === 'removed')
  .map((f) => f.filename);
const touched = [...modified, ...created];
const allChanged = [...touched, ...deleted];

const failures = [];
const warnings = [];

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
  failures.push(
    `**PR title must follow Conventional Commits.**\n\n` +
      `Received: \`${pr.title}\`\n\n` +
      `Expected format: \`<type>(optional-scope): <subject>\`\n` +
      `Allowed types: ${CONVENTIONAL_TYPES.map((t) => `\`${t}\``).join(', ')}\n\n` +
      `Examples:\n` +
      `- \`feat(export): add SVG batch export\`\n` +
      `- \`fix: correct FEN parsing on en passant\``
  );
} else if (/\.$/.test(pr.title)) {
  failures.push('**PR title must not end with a period.**');
}

if (!pr.body || pr.body.trim().length < 20) {
  warnings.push(
    '**PR description is missing or too short.**\n\n' +
      'Describe what changed and why. Link related issues with `Closes #N`.'
  );
}

const CLOSES_PATTERN = /(?:closes|fixes|resolves)\s+#\d+/i;

if (pr.body && !CLOSES_PATTERN.test(pr.body)) {
  warnings.push(
    '**PR has no closing issue reference.**\n\n' +
      'Add `Closes #N` (or `Fixes #N` / `Resolves #N`) to link the related issue.'
  );
}

const touchedSmartNaming = touched.some((f) =>
  f.endsWith('src/pages/AdvancedFENInputPage/hooks/parseSmartNaming.ts')
);
const touchedSmartNamingTest = touched.some((f) =>
  f.endsWith('src/pages/AdvancedFENInputPage/hooks/parseSmartNaming.test.ts')
);

if (touchedSmartNaming && !touchedSmartNamingTest) {
  failures.push(
    '**`parseSmartNaming.ts` changed without updating `parseSmartNaming.test.ts`.**\n\n' +
      'Every change to a pure logic module must be covered by a corresponding test.'
  );
}

const changedPackageJson = allChanged.includes('package.json');
const changedLockfile = allChanged.includes('pnpm-lock.yaml');

if (changedPackageJson && !changedLockfile) {
  warnings.push(
    '**`package.json` changed but `pnpm-lock.yaml` did not.**\n\n' +
      'Run `pnpm install` and commit the updated lockfile so CI does not fail.'
  );
}

if (allChanged.length > 50) {
  warnings.push(
    `**Large PR:** ${allChanged.length} files changed.\n\n` +
      'Consider splitting into smaller focused PRs — they are faster to review and easier to revert.'
  );
}

const MARKER = '<!-- pr-checks-report -->';

function renderReport() {
  const lines = [MARKER, '## PR Checks', ''];
  if (failures.length === 0 && warnings.length === 0) {
    lines.push('All checks passed.');
    return lines.join('\n');
  }
  for (const f of failures) lines.push(`❌ ${f}`, '');
  for (const w of warnings) lines.push(`⚠️ ${w}`, '');
  return lines.join('\n');
}

async function upsertComment(body) {
  const comments = await ghFetch(`/issues/${prNumber}/comments?per_page=100`);
  const existing = comments.find((c) => c.body?.startsWith(MARKER));
  if (existing) {
    await ghFetch(`/issues/comments/${existing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body })
    });
  } else {
    await ghFetch(`/issues/${prNumber}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body })
    });
  }
}

await upsertComment(renderReport());

if (failures.length > 0) {
  console.error(`pr-checks: ${failures.length} failure(s)`);
  for (const f of failures) console.error(`  - ${f.split('\n')[0]}`);
  process.exit(1);
}

console.log(
  `pr-checks: passed (${warnings.length} warning${warnings.length === 1 ? '' : 's'})`
);
