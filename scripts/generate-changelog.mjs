/**
 * Generates src/pages/about/changelogData.json from the real git history.
 *
 * Includes only meaningful commits (feat / fix / perf / refactor), drops merges,
 * and groups them by year → month (both newest-first). The About page's
 * Changelog section reads this file: one year per page, months within a year.
 *
 * Run: `node scripts/generate-changelog.mjs` (or `pnpm changelog`).
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'src/pages/about/changelogData.json');

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

// feat | fix | perf | refactor, optional (scope), then the description.
const TYPE_RE = /^(feat|fix|perf|refactor)(\(([^)]+)\))?:\s*(.+)$/i;
const UNIT = '\x1f';

const raw = execSync(
  `git log --no-merges --pretty=format:"%h${UNIT}%ad${UNIT}%s" --date=short`,
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
);

const commits = [];
for (const line of raw.split('\n')) {
  if (!line.trim()) continue;
  const [hash, date, ...rest] = line.split(UNIT);
  const subject = rest.join(UNIT);
  const m = TYPE_RE.exec(subject);
  if (!m) continue;
  const desc = m[4].trim();
  commits.push({
    hash,
    date,
    type: m[1].toLowerCase(),
    scope: m[3] ? m[3].toLowerCase() : null,
    desc: desc.charAt(0).toUpperCase() + desc.slice(1)
  });
}

const byYear = new Map();
for (const c of commits) {
  const [y, mo] = c.date.split('-');
  const year = Number(y);
  const monthIdx = Number(mo) - 1;
  if (!byYear.has(year)) byYear.set(year, new Map());
  const months = byYear.get(year);
  if (!months.has(monthIdx)) months.set(monthIdx, []);
  months.get(monthIdx).push(c);
}

const years = [...byYear.keys()]
  .sort((a, b) => b - a)
  .map((year) => {
    const monthMap = byYear.get(year);
    const months = [...monthMap.keys()]
      .sort((a, b) => b - a)
      .map((monthIdx) => ({
        month: MONTHS[monthIdx],
        commits: monthMap.get(monthIdx) // already newest-first from git
      }));
    const count = months.reduce((n, m) => n + m.commits.length, 0);
    return { year, count, months };
  });

const out = {
  generatedAt: new Date().toISOString().slice(0, 10),
  total: commits.length,
  years
};

writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
console.log(
  `changelog: wrote ${commits.length} commits across ${years.length} years`
);
for (const y of years) console.log(`  ${y.year}: ${y.count}`);
