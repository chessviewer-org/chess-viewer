import { useEffect, useMemo, useRef, useState } from 'react';

import {
  ChevronLeft,
  ChevronRight,
  GitCommitHorizontal,
  History
} from 'lucide-react';

import { REPO_CHANGELOG_URL, REPO_URL } from '../aboutConstants';
import changelog from '../changelogData.json';
import { Lead, SectionHeading } from '../parts';

/**
 * One commit, as emitted by `scripts/generate-changelog.mjs` into
 * `changelogData.json`. `scope` is the conventional-commit scope, or null.
 */
interface ChangelogCommit {
  hash: string;
  date: string;
  type: 'feat' | 'fix' | 'perf' | 'refactor';
  scope: string | null;
  desc: string;
}

interface ChangelogMonth {
  month: string;
  commits: ChangelogCommit[];
}

interface ChangelogYear {
  year: number;
  count: number;
  months: ChangelogMonth[];
}

interface ChangelogData {
  generatedAt: string;
  total: number;
  years: ChangelogYear[];
}

/**
 * A flattened render item. A year's nested month/commit tree is flattened into
 * one sequence so it can be revealed incrementally as the user scrolls, while
 * still rendering month headers inline.
 */
type RenderItem =
  | { kind: 'month'; key: string; month: string; year: number; count: number }
  | { kind: 'commit'; key: string; commit: ChangelogCommit };

const DATA = changelog as ChangelogData;
const YEARS = DATA.years;

/** How many items to reveal per scroll step. */
const PAGE_SIZE = 40;

const REPO_COMMITS_URL = `${REPO_URL}/commits`;
const commitUrl = (hash: string) => `${REPO_URL}/commit/${hash}`;

/**
 * Per-commit-type colour treatment, backed by theme tokens so both light and
 * dark stay intentional; no raw hex.
 */
const TYPE_STYLES: Record<ChangelogCommit['type'], string> = {
  feat: 'bg-accent/10 text-accent',
  fix: 'bg-error/10 text-error',
  perf: 'bg-warning/10 text-warning',
  refactor: 'bg-surface-hover text-text-secondary'
};

const TYPE_LABELS: Record<ChangelogCommit['type'], string> = {
  feat: 'Feature',
  fix: 'Fix',
  perf: 'Perf',
  refactor: 'Refactor'
};

/** Flatten one year into month-header + commit render items, in order. */
function flattenYear(year: ChangelogYear): RenderItem[] {
  const items: RenderItem[] = [];
  for (const m of year.months) {
    items.push({
      kind: 'month',
      key: `m-${year.year}-${m.month}`,
      month: m.month,
      year: year.year,
      count: m.commits.length
    });
    for (const c of m.commits) {
      items.push({ kind: 'commit', key: `c-${c.hash}`, commit: c });
    }
  }
  return items;
}

function MonthHeader({
  month,
  year,
  count
}: {
  month: string;
  year: number;
  count: number;
}) {
  return (
    <div className="sticky top-0 z-10 mt-6 flex items-center justify-between gap-3 bg-bg/95 py-1.5 backdrop-blur first:mt-0">
      <h4 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
        {month} {year}
      </h4>
      <span className="text-xs text-text-muted">{count}</span>
    </div>
  );
}

function CommitRow({ commit }: { commit: ChangelogCommit }) {
  const typeStyle = TYPE_STYLES[commit.type] ?? TYPE_STYLES.refactor;
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-border bg-surface-elevated px-4 py-3 transition-colors hover:bg-surface-hover">
      {/* Fixed-width badge so every description starts at the same column,
          regardless of label length (Feature vs Perf). */}
      <span
        className={`inline-flex w-20 shrink-0 items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${typeStyle}`}
        style={{ fontSize: '0.8rem' }}
      >
        {TYPE_LABELS[commit.type] ?? commit.type}
      </span>
      <span className="min-w-0 flex-1 text-sm leading-relaxed text-text-secondary">
        {commit.scope && (
          <span className="mr-1.5 font-mono text-xs text-text-muted">
            {commit.scope}
          </span>
        )}
        {commit.desc}
      </span>
      <span className="shrink-0 font-mono text-xs text-text-muted">
        {commit.date}
      </span>
      <a
        href={commitUrl(commit.hash)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-1.5 py-0.5 font-mono text-xs text-text-secondary transition-colors hover:bg-surface hover:text-accent"
        title={`View commit ${commit.hash} on GitHub`}
      >
        <GitCommitHorizontal className="h-3 w-3" aria-hidden="true" />
        {commit.hash}
      </a>
    </li>
  );
}

/**
 * Changelog section: the full meaningful git history (feat / fix / perf /
 * refactor), grouped by year → month, both newest-first. One year per page;
 * the year pagination sits at the bottom.
 *
 * To stay smooth even with ~1000+ commits in a year, each year is flattened and
 * revealed incrementally as the user scrolls (an `IntersectionObserver`
 * sentinel grows the window), so only the visible portion is ever in the DOM
 * and each chunk eases in. The data is generated from the real git log by
 * `scripts/generate-changelog.mjs` — never hand-edited.
 */
export default function ChangelogSection() {
  const [pageIndex, setPageIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const totalPages = YEARS.length;
  const page = YEARS[pageIndex];

  // Flatten the active year once; recompute only when the page changes.
  const items = useMemo(() => (page ? flattenYear(page) : []), [page]);

  // Reset the reveal window whenever the year page changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [pageIndex]);

  const hasMore = visibleCount < items.length;

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, items.length));
        }
      },
      { rootMargin: '800px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, items.length]);

  if (!page) return null;

  const goTo = (next: number) =>
    setPageIndex(Math.min(Math.max(next, 0), totalPages - 1));

  const visibleItems = items.slice(0, visibleCount);

  return (
    <div className="space-y-8 animate-pageEnter">
      <div className="space-y-3">
        <SectionHeading icon={History} title="Changelog" />
        <Lead>
          The full history of meaningful changes to ChessVision — every feature,
          fix, performance, and refactor commit — taken straight from the
          project&apos;s git log and grouped by month. {DATA.total} changes in
          total. For the curated summary read the{' '}
          <a
            href={REPO_CHANGELOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-accent hover:underline"
          >
            changelog
          </a>{' '}
          or browse every{' '}
          <a
            href={REPO_COMMITS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-accent hover:underline"
          >
            commit on GitHub
          </a>
          .
        </Lead>
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-3xl font-bold text-text-primary">
          {page.year}
        </h3>
        <span className="text-sm text-text-muted">
          {page.count} change{page.count === 1 ? '' : 's'}
        </span>
      </div>

      <ol className="space-y-2">
        {visibleItems.map((item) =>
          item.kind === 'month' ? (
            <li key={item.key} className="list-none">
              <MonthHeader
                month={item.month}
                year={item.year}
                count={item.count}
              />
            </li>
          ) : (
            <div key={item.key} className="animate-cardReveal">
              <CommitRow commit={item.commit} />
            </div>
          )
        )}
      </ol>

      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center py-6 text-sm text-text-muted"
          aria-hidden="true"
        >
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
            Loading more…
          </span>
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Changelog years"
          className="flex items-center justify-between gap-4 pt-2"
        >
          <button
            type="button"
            onClick={() => goTo(pageIndex - 1)}
            disabled={pageIndex === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Newer
          </button>

          <div className="flex items-center gap-2">
            {YEARS.map((y, i) => (
              <button
                key={y.year}
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === pageIndex ? 'page' : undefined}
                className={`min-w-11 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                  i === pageIndex
                    ? 'bg-accent text-bg'
                    : 'border border-border bg-surface text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {y.year}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => goTo(pageIndex + 1)}
            disabled={pageIndex === totalPages - 1}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Older
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
