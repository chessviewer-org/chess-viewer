import { memo, useMemo, useState } from 'react';

import { Clipboard, History, Plus, Search } from '@/assets/icons';

import { useFENHistory } from '@hooks';
import { LATEX_MAX_POSITIONS } from '@utils';
import {
  type LatexProject,
  type StudioPosition,
  fenProblem
} from '../utils/latexProject';
import type { LatexProjectActions } from '../hooks/useLatexProject';
import { Pager, Section, TextField } from './controls';
import { PaperBoard } from './PaperBoard';

const PAGE_SIZE = 8;
const HISTORY_LIMIT = 50;

const ACTION_BUTTON =
  'inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-lg border border-border/60 bg-surface px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40';

interface RowProps {
  position: StudioPosition;
  index: number;
  selected: boolean;
  project: LatexProject;
  onSelect: (id: string) => void;
}

const DiagramRow = memo(function DiagramRow({
  position,
  index,
  selected,
  project,
  onSelect
}: RowProps) {
  const problem = useMemo(() => fenProblem(position.fen), [position.fen]);
  const title =
    [position.stipulation, position.caption].filter(Boolean).join(' · ') ||
    'Untitled';
  const subtitle = problem ?? (position.author || position.source || '—');

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(position.id)}
        aria-current={selected ? 'true' : undefined}
        className={`flex min-h-0 w-full items-center gap-3 rounded-lg border px-2 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          selected
            ? 'border-accent/60 bg-accent/10'
            : 'border-transparent hover:bg-surface-hover'
        }`}
      >
        <span className="w-6 shrink-0 text-right font-mono text-[11px] font-semibold text-text-muted">
          {index + 1}
        </span>
        <PaperBoard
          position={position}
          settings={project.settings}
          alt=""
          plain
          className="size-10 shrink-0 rounded-sm"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-text-primary">
            {title}
          </span>
          <span
            className={`block truncate text-xs ${problem ? 'text-error' : 'text-text-muted'}`}
          >
            {subtitle}
          </span>
        </span>
      </button>
    </li>
  );
});

interface DiagramNavigatorProps {
  project: LatexProject;
  isFull: boolean;
  actions: LatexProjectActions;
  onOpen: (id: string) => void;
  onAdd: () => void;
  onNotify: (message: string, type?: 'success' | 'error') => void;
  className?: string | undefined;
}

interface ManualPage {
  page: number;
  anchor: string;
}

export const DiagramNavigator = memo(function DiagramNavigator({
  project,
  isFull,
  actions,
  onOpen,
  onAdd,
  onNotify,
  className
}: DiagramNavigatorProps) {
  const [query, setQuery] = useState('');
  const [manual, setManual] = useState<ManualPage | null>(null);
  const [pasting, setPasting] = useState(false);
  const [bulk, setBulk] = useState('');
  const { rawHistory } = useFENHistory('');

  const historyFens = useMemo(
    () => [
      ...new Set(rawHistory.slice(0, HISTORY_LIMIT).map((entry) => entry.fen))
    ],
    [rawHistory]
  );

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const indexed = project.positions.map((position, index) => ({
      position,
      index
    }));
    if (!needle) return indexed;
    return indexed.filter(({ position }) =>
      [
        position.fen,
        position.caption,
        position.author,
        position.source,
        position.stipulation
      ].some((field) => field.toLowerCase().includes(needle))
    );
  }, [project.positions, query]);

  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const selectedAt = matches.findIndex(
    ({ position }) => position.id === project.selectedId
  );
  const followPage = selectedAt < 0 ? 0 : Math.floor(selectedAt / PAGE_SIZE);
  const page = Math.min(
    manual?.anchor === `${project.selectedId}|${query}`
      ? manual.page
      : followPage,
    pageCount - 1
  );
  const shown = matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const addBulk = () => {
    const added = actions.addFromText(bulk);
    if (!added) {
      onNotify('No valid FEN found. Put one FEN per line.', 'error');
      return;
    }
    onNotify(`Added ${added} diagram${added === 1 ? '' : 's'}`);
    setBulk('');
    setPasting(false);
  };

  const addHistory = () => {
    const added = actions.addFens(historyFens);
    onNotify(
      added
        ? `Imported ${added} diagram${added === 1 ? '' : 's'} from history`
        : 'History is empty',
      added ? 'success' : 'error'
    );
  };

  const addBlank = () => {
    setQuery('');
    onAdd();
  };

  return (
    <Section
      title="Diagrams"
      description={`${project.positions.length} of ${LATEX_MAX_POSITIONS}, printed in this order.`}
      className={className}
      actions={
        <button
          type="button"
          onClick={addBlank}
          disabled={isFull}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-bold text-bg hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-40"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add
        </button>
      }
    >
      <label className="relative block">
        <span className="sr-only">Search diagrams</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          maxLength={100}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search author, stipulation, FEN…"
          className="w-full rounded-lg border border-border bg-surface py-2 pr-3 pl-9 text-sm text-text-primary placeholder:text-text-muted outline-none focus-visible:border-accent"
        />
      </label>

      {shown.length === 0 ? (
        <p role="status" className="py-6 text-center text-xs text-text-muted">
          No diagram matches “{query}”.
        </p>
      ) : (
        <ul className="flex flex-col gap-1" aria-label="Diagrams">
          {shown.map(({ position, index }) => (
            <DiagramRow
              key={position.id}
              position={position}
              index={index}
              selected={position.id === project.selectedId}
              project={project}
              onSelect={onOpen}
            />
          ))}
        </ul>
      )}

      <Pager
        page={page}
        pageCount={pageCount}
        label="Diagram list"
        onChange={(next) =>
          setManual({ page: next, anchor: `${project.selectedId}|${query}` })
        }
      />

      <div className="mt-auto flex flex-col gap-3 border-t border-border/60 pt-3">
        {pasting ? (
          <>
            <TextField
              label="One diagram per line"
              value={bulk}
              onChange={setBulk}
              multiline
              rows={5}
              mono
              maxLength={100000}
              hint="FEN | author | source | stipulation — only the FEN is required."
              placeholder="8/8/8/3k4/8/4K3/3Q4/8 w - - 0 1 | Loyd, Sam | Chess Monthly 1903 | #2"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`${ACTION_BUTTON} border-accent/50 text-accent hover:text-accent-hover`}
                disabled={isFull || !bulk.trim()}
                onClick={addBulk}
              >
                Add diagrams
              </button>
              <button
                type="button"
                className={ACTION_BUTTON}
                onClick={() => setPasting(false)}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={ACTION_BUTTON}
              disabled={isFull}
              onClick={() => setPasting(true)}
            >
              <Clipboard className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Paste list</span>
            </button>
            <button
              type="button"
              className={ACTION_BUTTON}
              disabled={isFull || !historyFens.length}
              onClick={addHistory}
            >
              <History className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">From history</span>
            </button>
          </div>
        )}
      </div>
    </Section>
  );
});
