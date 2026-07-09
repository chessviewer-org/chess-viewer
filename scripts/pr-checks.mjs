const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;
const eventPath = process.env.GITHUB_EVENT_PATH;

if (!token || !repo || !eventPath) {
  console.error('pr-checks: missing GITHUB_TOKEN, GITHUB_REPOSITORY, or GITHUB_EVENT_PATH');
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
  if (!res.ok) throw new Error(`GitHub API ${path} failed: ${res.status} ${await res.text()}`);
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
    const batch = await ghFetch(`/pulls/${prNumber}/files?per_page=100&page=${page}`);
    files.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return files;
}

const pr = await ghFetch(`/pulls/${prNumber}`);
const files = await listChangedFiles();

const modified = files.filter((f) => f.status === 'modified').map((f) => f.filename);
const created = files.filter((f) => f.status === 'added').map((f) => f.filename);
const deleted = files.filter((f) => f.status === 'removed').map((f) => f.filename);
const touched = [...modified, ...created];
const allChanged = [...touched, ...deleted];

const failures = [];
const warnings = [];

const TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci', 'build', 'revert'];

const titleRe = new RegExp(`^(${TYPES.join('|')})(\\([\\w$.\\-*/ ]+\\))?(!)?: .+`);

if (!titleRe.test(pr.title)) {
  failures.push(
    `PR title must follow Conventional Commits.\n\n` +
    `Expected: \`<type>(scope): <subject>\`\n` +
    `Allowed types: ${TYPES.map((t) => `\`${t}\``).join(', ')}\n\n` +
    `Got: \`${pr.title}\``
  );
} else if (/\.$/.test(pr.title)) {
  failures.push('PR title must not end with a period.');
}

if (!pr.body || pr.body.trim().length < 20) {
  warnings.push(
    'PR description is missing or too short.\n\n' +
    'Describe what changed and why. Link issues with `Closes #N`.'
  );
}

if (pr.body && !/(?:closes|fixes|resolves)\s+#\d+/i.test(pr.body)) {
  warnings.push(
    'PR has no closing issue reference.\n\n' +
    'Add `Closes #N` (or `Fixes #N` / `Resolves #N`) to link the issue.'
  );
}

if (
  touched.some((f) => f.endsWith('src/pages/AdvancedFENInputPage/hooks/parseSmartNaming.ts')) &&
  !touched.some((f) => f.endsWith('src/pages/AdvancedFENInputPage/hooks/parseSmartNaming.test.ts'))
) {
  failures.push(
    '`parseSmartNaming.ts` changed without updating its test.\n\n' +
    'Pure logic changes need corresponding tests.'
  );
}

if (allChanged.includes('package.json') && !allChanged.includes('pnpm-lock.yaml')) {
  warnings.push(
    '`package.json` changed but `pnpm-lock.yaml` did not.\n\n' +
    'Run `pnpm install` and commit the lockfile.'
  );
}

if (allChanged.length > 50) {
  warnings.push(
    `Large PR: ${allChanged.length} files changed.\n\n` +
    'Consider splitting into smaller PRs — easier to review and revert.'
  );
}

const MARKER = '<!-- pr-checks-report -->';

function renderReport() {
  if (failures.length === 0 && warnings.length === 0) return `${MARKER}\n## PR Checks\n\nAll checks passed.`;
  const parts = [`${MARKER}\n## PR Checks\n`];
  for (const f of failures) parts.push(`\n❌ ${f}\n`);
  for (const w of warnings) parts.push(`\n⚠️ ${w}\n`);
  return parts.join('');
}

async function upsertComment(body) {
  const comments = await ghFetch(`/issues/${prNumber}/comments?per_page=100`);
  const existing = comments.find((c) => c.body?.startsWith(MARKER));
  const opts = {
    method: existing ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body })
  };
  await ghFetch(existing ? `/issues/comments/${existing.id}` : `/issues/${prNumber}/comments`, opts);
}

await upsertComment(renderReport());

if (failures.length > 0) {
  console.error(`pr-checks: ${failures.length} failure(s)`);
  for (const f of failures) console.error(`  - ${f.split('\n')[0]}`);
  process.exit(1);
}

console.log(`pr-checks: passed (${warnings.length} warning${warnings.length === 1 ? '' : 's'})`);
