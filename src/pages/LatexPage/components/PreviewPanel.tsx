import { type CSSProperties, memo, useMemo, useState } from 'react';

import { pieceCounts } from '@utils';
import {
  type StudioPosition,
  type StudioSettings,
  usableFen
} from '../utils/latexProject';
import { PaperBoard } from './PaperBoard';

const PAGE_SIZE = 12;
const PREVIEW_SIZE = 260;

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
        size={PREVIEW_SIZE}
        alt={`Diagram ${number}`}
        className="w-full max-w-[15rem]"
      />
      <figcaption className="space-y-0.5 text-xs text-neutral-700">
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

interface PreviewPanelProps {
  positions: StudioPosition[];
  settings: StudioSettings;
}

export const PreviewPanel = memo(function PreviewPanel({
  positions,
  settings
}: PreviewPanelProps) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const printable = useMemo(
    () => positions.filter((position) => usableFen(position.fen) !== null),
    [positions]
  );
  const shown = printable.slice(0, visible);
  const columns = Math.min(settings.columns, 4);
  const titled = settings.mode === 'document' && settings.title.trim();

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex-1 rounded-lg bg-white p-5 shadow-lg ring-1 ring-black/5 sm:p-8">
        {titled && (
          <header className="mb-6 text-center">
            <p className="font-serif text-lg font-bold text-neutral-900">
              {settings.title}
            </p>
            {settings.documentAuthor.trim() && (
              <p className="mt-1 font-serif text-sm text-neutral-600">
                {settings.documentAuthor}
              </p>
            )}
          </header>
        )}
        <div
          className="grid grid-cols-[repeat(var(--preview-columns),minmax(0,1fr))] gap-x-4 gap-y-8 max-sm:grid-cols-[repeat(min(var(--preview-columns),2),minmax(0,1fr))]"
          style={{ '--preview-columns': columns } as CSSProperties}
        >
          {shown.map((position, index) => (
            <PreviewCard
              key={position.id}
              position={position}
              number={index + 1}
              settings={settings}
            />
          ))}
        </div>
      </div>
      {visible < printable.length && (
        <button
          type="button"
          onClick={() => setVisible((count) => count + PAGE_SIZE)}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border/60 bg-surface px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Show {Math.min(PAGE_SIZE, printable.length - visible)} more
        </button>
      )}
      <p className="text-[11px] leading-relaxed text-text-muted">
        An approximation of the printed page; fonts and spacing come from LaTeX.
      </p>
    </div>
  );
});
