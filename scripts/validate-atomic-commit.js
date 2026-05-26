#!/usr/bin/env node
// @ts-check
/**
 * validate-atomic-commit.js
 *
 * Enforces "atomic commit" discipline: one logical task per commit.
 *
 * Strategy: classify every staged file into a logical CATEGORY based on its
 * path, then reject the commit when it spans unrelated categories. Some
 * categories are designed to travel together (e.g. a source change plus its
 * co-located test and the docs that describe it), so they are grouped into
 * compatible "domains". A commit is atomic when all touched categories
 * collapse into a single domain.
 *
 * This script reads the staged file list from git directly; it takes no
 * arguments. Exit code 0 = atomic, 1 = rejected, 0 with notice = nothing to
 * validate (e.g. merge commit, no staged files).
 *
 * Escape hatch: set ATOMIC_COMMIT_BYPASS=1 to skip (logged loudly). Intended
 * only for mechanical mass changes (formatting sweeps, dependency bumps) that
 * legitimately touch many categories. CI re-checks via Danger regardless.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BYPASS = process.env.ATOMIC_COMMIT_BYPASS === '1';

// This validator enforces *developer* commit discipline. Automated commits made
// by CI tooling (notably the @semantic-release/git plugin, which commits a
// version bump across package.json + CHANGELOG.md) legitimately span multiple
// domains and must never be blocked. Skip when running in CI or when the commit
// message is a semantic-release / automated release commit.
const IS_CI = process.env.CI === 'true' || process.env.CI === '1';

/**
 * Ordered classification rules. First match wins, so put the most specific
 * patterns first. Each category belongs to exactly one domain.
 *
 * @type {ReadonlyArray<{ category: string, domain: string, test: (p: string) => boolean }>}
 */
const RULES = [
  // --- CI / automation / governance -------------------------------------
  {
    category: 'ci',
    domain: 'infra',
    test: (p) => p.startsWith('.github/workflows/')
  },
  {
    category: 'git-hooks',
    domain: 'infra',
    test: (p) => p.startsWith('.husky/') || p === 'dangerfile.js'
  },
  {
    category: 'automation-scripts',
    domain: 'infra',
    test: (p) => p.startsWith('scripts/')
  },

  // --- dependencies ------------------------------------------------------
  {
    category: 'deps',
    domain: 'deps',
    test: (p) =>
      p === 'package.json' ||
      p === 'pnpm-lock.yaml' ||
      p === 'package-lock.json' ||
      p === 'yarn.lock' ||
      p === 'pnpm-workspace.yaml'
  },

  // --- build / tooling config -------------------------------------------
  {
    category: 'build-config',
    domain: 'infra',
    test: (p) =>
      /^(vite|vitest|tsconfig|tsconfig\.[\w.]+|postcss|tailwind|eslint|\.prettierrc|\.commitlintrc|\.lintstagedrc|vercel|docker-compose)\b/.test(
        p
      ) ||
      p === 'Dockerfile' ||
      p === 'nginx.conf' ||
      p.endsWith('.config.js') ||
      p.endsWith('.config.ts')
  },

  // --- tests (co-located *.test.* or anything under a tests dir) --------
  {
    category: 'tests',
    domain: 'src',
    test: (p) =>
      /\.(test|spec)\.[jt]sx?$/.test(p) || /(^|\/)(__tests__|tests?)\//.test(p)
  },

  // --- documentation -----------------------------------------------------
  {
    category: 'docs',
    domain: 'src',
    test: (p) =>
      p.endsWith('.md') ||
      p.startsWith('docs/') ||
      p.startsWith('.github/ISSUE_TEMPLATE/') ||
      p === '.github/pull_request_template.md'
  },

  // --- application source -----------------------------------------------
  {
    category: 'source',
    domain: 'src',
    test: (p) => p.startsWith('src/') && /\.[jt]sx?$/.test(p)
  },
  {
    category: 'styles',
    domain: 'src',
    test: (p) => /\.(css|scss)$/.test(p)
  },
  {
    category: 'assets',
    domain: 'src',
    test: (p) =>
      p.startsWith('public/') || /\.(png|jpe?g|gif|svg|webp|ico)$/.test(p)
  },

  // --- database / backend schema ----------------------------------------
  {
    category: 'database',
    domain: 'db',
    test: (p) => p.startsWith('supabase/')
  }
];

const FALLBACK = { category: 'other', domain: 'misc' };

/** @param {string} filePath */
function classify(filePath) {
  for (const rule of RULES) {
    if (rule.test(filePath)) {
      return { category: rule.category, domain: rule.domain };
    }
  }
  return FALLBACK;
}

/** @returns {string[]} staged file paths (added/copied/modified/renamed/deleted) */
function getStagedFiles() {
  // -z + NUL split keeps paths with spaces/unicode intact.
  const raw = execSync('git diff --cached --name-only --diff-filter=ACMRD -z', {
    encoding: 'utf8'
  });
  return raw.split('\0').filter((p) => p.length > 0);
}

function gitDir() {
  return execSync('git rev-parse --git-dir', { encoding: 'utf8' }).trim();
}

function isMidMergeOrRebase() {
  try {
    const dir = gitDir();
    return (
      existsSync(`${dir}/MERGE_HEAD`) ||
      existsSync(`${dir}/rebase-merge`) ||
      existsSync(`${dir}/rebase-apply`)
    );
  } catch {
    return false;
  }
}

/**
 * Detect an automated release commit (semantic-release / release bots). These
 * intentionally bundle a version bump (package.json, pnpm-lock.yaml) with the
 * generated CHANGELOG.md and must not be treated as non-atomic.
 *
 * The prepared commit message is staged at .git/COMMIT_EDITMSG before the
 * pre-commit hook runs, so we can read it directly.
 */
function isAutomatedReleaseCommit() {
  try {
    const msg = readFileSync(`${gitDir()}/COMMIT_EDITMSG`, 'utf8');
    // semantic-release uses "chore(release): <version> [skip ci]"; also honor
    // the conventional [skip ci] / [ci skip] markers used by release tooling.
    return (
      /^chore\(release\):/m.test(msg) ||
      /\[skip ci\]/i.test(msg) ||
      /\[ci skip\]/i.test(msg)
    );
  } catch {
    return false;
  }
}

function main() {
  // Automated CI commits (semantic-release version bumps, release bots) span
  // many domains by design — never block them.
  if (IS_CI || isAutomatedReleaseCommit()) {
    process.exit(0);
  }

  // Merges/rebases legitimately combine many categories — never block them.
  if (isMidMergeOrRebase()) {
    process.exit(0);
  }

  const files = getStagedFiles();

  if (files.length === 0) {
    // Nothing staged (or hook fired with an empty index) — let git decide.
    process.exit(0);
  }

  /** @type {Map<string, string[]>} domain -> files */
  const byDomain = new Map();
  /** @type {Map<string, Set<string>>} domain -> categories */
  const categoriesByDomain = new Map();

  for (const file of files) {
    const { category, domain } = classify(file);
    if (!byDomain.has(domain)) {
      byDomain.set(domain, []);
      categoriesByDomain.set(domain, new Set());
    }
    byDomain.get(domain)?.push(file);
    categoriesByDomain.get(domain)?.add(category);
  }

  const domains = [...byDomain.keys()];

  if (domains.length <= 1) {
    // Single logical domain — atomic. Done.
    process.exit(0);
  }

  // More than one domain touched → not atomic.
  const lines = [];
  lines.push('');
  lines.push('  ✖ Non-atomic commit detected.');
  lines.push('');
  lines.push(
    '  This commit mixes changes from unrelated areas. Each commit must'
  );
  lines.push('  represent ONE logical task. Split the staged changes:');
  lines.push('');

  for (const domain of domains) {
    const cats = [...(categoriesByDomain.get(domain) ?? [])].join(', ');
    lines.push(`  ▸ ${domain}  (${cats})`);
    for (const file of byDomain.get(domain) ?? []) {
      lines.push(`      ${file}`);
    }
    lines.push('');
  }

  lines.push('  How to split:');
  lines.push('    git reset                       # unstage everything');
  lines.push('    git add <files for task A>      # stage one domain');
  lines.push('    git commit -m "feat: task A"');
  lines.push('    git add <files for task B>      # stage the next');
  lines.push('    git commit -m "docs: task B"');
  lines.push('');
  lines.push(
    '  Mechanical mass changes (format sweep, dep bump) may bypass with:'
  );
  lines.push('ATOMIC_COMMIT_BYPASS=1 git commit ...');
  lines.push('');

  if (BYPASS) {
    process.stderr.write(`${lines.join('\n')}\n`);
    process.stderr.write(
      'ATOMIC_COMMIT_BYPASS=1 set — proceeding despite the above.\n\n'
    );
    process.exit(0);
  }

  process.stderr.write(`${lines.join('\n')}\n`);
  process.exit(1);
}

main();
