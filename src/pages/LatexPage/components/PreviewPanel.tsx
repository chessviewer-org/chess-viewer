import { type CSSProperties, memo, useMemo, useState } from 'react';

import { pieceCounts } from '@utils';
import { tokenizeLatexLine, type LatexTokenKind } from '../utils/latexSyntax';
import { segmentButton } from '../utils/controlStyles';
import {
  type BuildResult,
  type StudioPosition,
  type StudioSettings,
  usableFen
} from '../utils/latexProject';
import { Pager } from './controls';
import { PaperBoard } from './PaperBoard';

const CODE_PAGE_LINES = 120;

const TOKEN_CLASS: Record<LatexTokenKind, string> = {
  command: 'text-accent',
  key: 'text-success',
  bracket: 'text-text-muted',
  text: ''
};

type View = 'preview' | 'code';

const VIEWS: ReadonlyArray<{ value: View; label: string }> = [
  { value: 'preview', label: 'Preview' },
  { value: 'code', label: 'Code' }
];

function rowsPerPage(columns: number): number {
  return columns === 1 ? 2 : 3;
}

interface PreviewCardProps {
  position: StudioPosition;
  number: number;
  settings: StudioSettings;
}

const PreviewCard = memo(function PreviewCard({
  position,
  number,
  settings
}: PreviewCardProps) {
  const isDiagram = settings.latexPackage === 'diagram';
  const fen = usableFen(position.fen);
  const counts = fen ? pieceCounts(fen) : null;
  const credits = [position.author, position.source, position.award]
    .filter(Boolean)
    .join(' — ');
  const showCount = counts && (isDiagram || settings.pieceCount);

  return (
    <figure className="flex min-w-0 flex-col items-center gap-2 text-center">
      {settings.numbering && (
        <p className="text-xs font-bold text-neutral-900">No. {number}</p>
      )}
      <PaperBoard
        position={position}
        settings={settings}
        alt={`Diagram ${number}`}
        className="w-full max-w-[15rem]"
      />
      <figcaption className="w-full space-y-0.5 break-words text-xs text-neutral-700">
        {credits && <p className="leading-snug">{credits}</p>}
        {(position.stipulation || showCount) && (
          <p className="font-semibold text-neutral-900">
            {position.stipulation}
            {position.stipulation && showCount ? ' ' : ''}
            {showCount && (
              <span className="font-normal text-neutral-500">
                ({counts.white}+{counts.black})
              </span>
            )}
          </p>
        )}
      </figcaption>
    </figure>
  );
});

interface CodeLine {
  number: number;
  text: string;
}

const CodePage = memo(function CodePage({
  lines,
  gutter
}: {
  lines: CodeLine[];
  gutter: number;
}) {
  return (
    <pre
      tabIndex={0}
      aria-label="Generated LaTeX source"
      className="flex-1 rounded-xl border border-border bg-surface-elevated p-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap break-all text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <code>
        {lines.map(({ number, text }) => (
          <span key={number} className="flex">
            <span
              aria-hidden="true"
              className="mr-4 shrink-0 text-right text-text-muted/60 select-none"
              style={{ minWidth: `${gutter}ch` }}
            >
              {number}
            </span>
            <span className="min-w-0">
              {tokenizeLatexLine(text).map((token) => (
                <span key={token.start} className={TOKEN_CLASS[token.kind]}>
                  {token.text}
                </span>
              ))}
            </span>
          </span>
        ))}
      </code>
    </pre>
  );
});

interface PreviewPanelProps {
  build: BuildResult;
  positions: StudioPosition[];
  settings: StudioSettings;
}

export const PreviewPanel = memo(function PreviewPanel({
  build,
  positions,
  settings
}: PreviewPanelProps) {
  const [view, setView] = useState<View>('preview');
  const [pages, setPages] = useState<Record<View, number>>({
    preview: 0,
    code: 0
  });

  const printable = useMemo(
    () => positions.filter((position) => usableFen(position.fen) !== null),
    [positions]
  );
  const lines = useMemo(
    () =>
      build.code
        .split('\n')
        .map((text, offset): CodeLine => ({ number: offset + 1, text })),
    [build.code]
  );

  const columns = Math.min(settings.columns, 4);
  const perPage = columns * rowsPerPage(columns);
  const pageCount =
    view === 'preview'
      ? Math.max(1, Math.ceil(printable.length / perPage))
      : Math.max(1, Math.ceil(lines.length / CODE_PAGE_LINES));
  const page = Math.min(pages[view], pageCount - 1);
  const setPage = (next: number) =>
    setPages((current) => ({ ...current, [view]: next }));

  const titled =
    page === 0 && settings.mode === 'document' && settings.title.trim();

  return (
    <section
      aria-label="Document preview"
      className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Preview or code"
          className="flex overflow-hidden rounded-lg border border-border/60"
        >
          {VIEWS.map((option, index) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={view === option.value}
              onClick={() => setView(option.value)}
              className={`${segmentButton(view === option.value)} min-w-20 ${
                index < VIEWS.length - 1 ? 'border-r border-border/60' : ''
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Pager
          page={page}
          pageCount={pageCount}
          label={view === 'preview' ? 'Preview' : 'Code'}
          onChange={setPage}
        />
      </header>

      {build.error ? (
        <p className="py-10 text-center text-sm text-text-muted">
          Nothing to show yet.
        </p>
      ) : view === 'preview' ? (
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex-1 rounded-lg bg-white p-5 shadow-lg ring-1 ring-black/5 sm:p-8">
            {titled && (
              <header className="mb-6 text-center">
                <p className="font-serif text-lg font-bold break-words text-neutral-900">
                  {settings.title}
                </p>
                {settings.documentAuthor.trim() && (
                  <p className="mt-1 font-serif text-sm break-words text-neutral-600">
                    {settings.documentAuthor}
                  </p>
                )}
              </header>
            )}
            <div
              className="grid grid-cols-[repeat(var(--preview-columns),minmax(0,1fr))] gap-x-4 gap-y-8 max-sm:grid-cols-[repeat(min(var(--preview-columns),2),minmax(0,1fr))]"
              style={{ '--preview-columns': columns } as CSSProperties}
            >
              {printable
                .slice(page * perPage, (page + 1) * perPage)
                .map((position, offset) => (
                  <PreviewCard
                    key={position.id}
                    position={position}
                    number={page * perPage + offset + 1}
                    settings={settings}
                  />
                ))}
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-text-muted">
            An approximation of the printed page; fonts and spacing come from
            LaTeX.
          </p>
        </div>
      ) : (
        <CodePage
          lines={lines.slice(
            page * CODE_PAGE_LINES,
            (page + 1) * CODE_PAGE_LINES
          )}
          gutter={String(lines.length).length}
        />
      )}
    </section>
  );
});
