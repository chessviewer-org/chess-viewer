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
import { existsSync } from 'node:fs';

const BYPASS = process.env.ATOMIC_COMMIT_BYPASS === '1';

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
      /^(vite|vitest|tsconfig|tsconfig\.[\w.]+|postcss|tailwind|eslint|\.prettierrc|\.commitlintrc|\.lintstagedrc|docker-compose)\b/.test(
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

/** @returns {string[]} staged file paths (added/copied/modified/renamed) */
function getStagedFiles() {
  // -z + NUL split keeps paths with spaces/unicode intact.
  const raw = execSync('git diff --cached --name-only --diff-filter=ACMR -z', {
    encoding: 'utf8'
  });
  return raw.split('\0').filter((p) => p.length > 0);
}

function isMidMergeOrRebase() {
  try {
    const gitDir = execSync('git rev-parse --git-dir', {
      encoding: 'utf8'
    }).trim();
    return (
      existsSync(`${gitDir}/MERGE_HEAD`) ||
      existsSync(`${gitDir}/rebase-merge`) ||
      existsSync(`${gitDir}/rebase-apply`)
    );
  } catch {
    return false;
  }
}

function main() {
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
  lines.push('    ATOMIC_COMMIT_BYPASS=1 git commit ...');
  lines.push('');

  if (BYPASS) {
    console.warn(lines.join('\n'));
    console.warn(
      '  ⚠ ATOMIC_COMMIT_BYPASS=1 set — proceeding despite the above.\n'
    );
    process.exit(0);
  }

  console.error(lines.join('\n'));
  process.exit(1);
}

main();
