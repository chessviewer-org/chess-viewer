import { Fragment, type ReactNode, useEffect, useState } from 'react';

import { ChevronLeft, ChevronRight, History } from '@/assets/icons';

import changelogRaw from '../../../../CHANGELOG.md?raw';
import { REPO_CHANGELOG_URL, REPO_URL } from '../utils/aboutConstants';
import {
  type ChangelogCategory,
  type ChangelogEntry,
  type ChangelogYear,
  parseChangelog
} from '../utils/parseChangelog';
import { Lead, SectionHeading } from './parts';

// Constants
const REPO_COMMITS_URL = `${REPO_URL}/commits`;

const CATEGORY_LABELS: Record<ChangelogCategory, string> = {
  Features: 'Features',
  'Bug Fixes': 'Bug fixes',
  'Performance Improvements': 'Performance',
  Reverts: 'Reverts'
};

// Helpers
function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|_[^_]+_)/g).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${i}-${part}`;
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={key}
          className="rounded bg-surface-hover px-1 py-0.5 font-mono text-[0.85em] text-text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('_') && part.endsWith('_')) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

function EntryRow({ entry }: { entry: ChangelogEntry }) {
  return (
    <li className="flex items-start gap-2.5 py-1 text-base leading-relaxed text-text-secondary">
      <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted" />
      <span className="min-w-0">
        {entry.scope && (
          <span className="mr-1.5 font-mono text-warning">{entry.scope}:</span>
        )}
        {renderInlineMarkdown(entry.text)}
        {entry.hash && entry.commitUrl && (
          <>
            {' '}
            <a
              href={entry.commitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-accent hover:underline"
            >
              #{entry.hash}
            </a>
          </>
        )}
        {entry.issueNumber && entry.issueUrl && (
          <>
            {' '}
            (closes{' '}
            <a
              href={entry.issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-warning hover:underline"
            >
              #{entry.issueNumber}
            </a>
            )
          </>
        )}
      </span>
    </li>
  );
}

function totalEntriesInYear(year: ChangelogYear): number {
  return year.months.reduce(
    (n, m) => n + m.groups.reduce((gn, g) => gn + g.entries.length, 0),
    0
  );
}

export default function ChangelogSection() {
  const [years, setYears] = useState<ChangelogYear[] | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setYears(parseChangelog(changelogRaw));
  }, []);

  const totalEntries =
    years?.reduce((n, y) => n + totalEntriesInYear(y), 0) ?? 0;

  const totalPages = years?.length ?? 0;
  const page = years?.[pageIndex];

  const goTo = (next: number) =>
    setPageIndex(Math.min(Math.max(next, 0), totalPages - 1));

  return (
    <div className="space-y-8 stagger-children">
      <div className="space-y-3">
        <SectionHeading icon={History} title="Changelog" />
        <Lead>
          Every notable change to ChessViewer, grouped by month, taken directly
          from{' '}
          <a
            href={REPO_CHANGELOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-accent hover:underline"
          >
            CHANGELOG.md
          </a>{' '}
          — {totalEntries} changes so far. There are no version tags; every
          complete month is a rolling release. Browse every{' '}
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

      {page && (
        <>
          <ol>
            {page.months.map((month) => (
              <li key={month.title} className="mb-8 list-none">
                <h3 className="font-display text-xl font-bold text-text-primary sm:text-2xl">
                  {month.title}
                </h3>
                <hr className="mt-2 mb-6 border-t border-warning" />

                {month.note && (
                  <p className="mb-4 text-base leading-relaxed text-text-secondary">
                    {renderInlineMarkdown(month.note)}
                  </p>
                )}

                {month.groups.map((group) => (
                  <div key={group.category} className="mb-6 last:mb-0">
                    <h4 className="mb-1.5 text-lg font-bold text-text-muted">
                      {CATEGORY_LABELS[group.category]}
                    </h4>
                    <ul>
                      {group.entries.map((entry, i) => (
                        <EntryRow key={`${entry.hash ?? i}`} entry={entry} />
                      ))}
                    </ul>
                  </div>
                ))}
              </li>
            ))}
          </ol>

          {totalPages > 1 && (
            <nav
              aria-label="Changelog years"
              className="flex items-center justify-between gap-4 pt-2"
            >
              <button
                type="button"
                onClick={() => goTo(pageIndex - 1)}
                disabled={pageIndex === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40 focus-ring"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Newer
              </button>

              <div className="flex items-center gap-2">
                {years?.map((y, i) => (
                  <button
                    key={y.year}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={i === pageIndex ? 'page' : undefined}
                    className={`min-w-11 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors focus-ring ${
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40 focus-ring"
              >
                Older
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
