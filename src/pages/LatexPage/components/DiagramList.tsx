import { memo, useCallback, useMemo, useState } from 'react';

import {
  ChevronDown,
  Clipboard,
  Copy,
  History,
  Plus,
  Trash2
} from '@/assets/icons';

import { useFENHistory } from '@hooks';
import { LATEX_MAX_POSITIONS, STARTING_FEN } from '@utils';
import {
  type LatexProject,
  type StudioPosition,
  fenProblem
} from '../utils/latexProject';
import type { LatexProjectActions } from '../hooks/useLatexProject';
import { Section, TextField } from './controls';
import { DiagramEditor } from './DiagramEditor';
import { PaperBoard } from './PaperBoard';

const THUMB_SIZE = 112;
const HISTORY_LIMIT = 50;
const FILTER_THRESHOLD = 6;

const ICON_BUTTON =
  'inline-flex size-8 min-h-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-30';

const ACTION_BUTTON =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border/60 bg-surface px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40';

interface DiagramRowProps {
  position: StudioPosition;
  index: number;
  total: number;
  open: boolean;
  project: LatexProject;
  actions: LatexProjectActions;
  onToggle: (id: string) => void;
  onNotify: (message: string, type?: 'success' | 'error') => void;
}

const DiagramRow = memo(function DiagramRow({
  position,
  index,
  total,
  open,
  project,
  actions,
  onToggle,
  onNotify
}: DiagramRowProps) {
  const problem = useMemo(() => fenProblem(position.fen), [position.fen]);
  const title =
    [position.stipulation, position.caption].filter(Boolean).join(' · ') ||
    'Untitled';
  const subtitle =
    problem ?? (position.author || position.source || 'No author');
  const panelId = `diagram-${position.id}`;

  return (
    <li
      className={`overflow-hidden rounded-xl border transition-[border-color,box-shadow] ${
        open
          ? 'border-accent/60 bg-surface shadow-md'
          : 'border-border bg-surface hover:border-text-muted/40'
      }`}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onClick={() => onToggle(position.id)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-h-0 min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <PaperBoard
            position={position}
            settings={project.settings}
            size={THUMB_SIZE}
            alt=""
            plain
            className="size-12 shrink-0 rounded"
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <span className="font-mono text-[11px] font-semibold text-text-muted">
                {index + 1}
              </span>
              <span className="truncate text-sm font-semibold text-text-primary">
                {title}
              </span>
            </span>
            <span
              className={`block truncate text-xs ${problem ? 'text-error' : 'text-text-muted'}`}
            >
              {subtitle}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            className={ICON_BUTTON}
            disabled={index === 0}
            aria-label={`Move diagram ${index + 1} up`}
            onClick={() => actions.move(position.id, -1)}
          >
            <ChevronDown className="size-4 rotate-180" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={ICON_BUTTON}
            disabled={index === total - 1}
            aria-label={`Move diagram ${index + 1} down`}
            onClick={() => actions.move(position.id, 1)}
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${ICON_BUTTON} max-sm:hidden`}
            disabled={total >= LATEX_MAX_POSITIONS}
            aria-label={`Duplicate diagram ${index + 1}`}
            onClick={() => actions.duplicate(position.id)}
          >
            <Copy className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${ICON_BUTTON} hover:text-error`}
            aria-label={`Delete diagram ${index + 1}`}
            onClick={() => actions.remove(position.id)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {open && (
        <div id={panelId}>
          <DiagramEditor
            position={position}
            number={index + 1}
            total={total}
            settings={project.settings}
            actions={actions}
            onNotify={onNotify}
          />
        </div>
      )}
    </li>
  );
});

interface DiagramListProps {
  project: LatexProject;
  isFull: boolean;
  actions: LatexProjectActions;
  onNotify: (message: string, type?: 'success' | 'error') => void;
}

export const DiagramList = memo(function DiagramList({
  project,
  isFull,
  actions,
  onNotify
}: DiagramListProps) {
  const [collapsedId, setCollapsedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [pasting, setPasting] = useState(false);
  const [bulk, setBulk] = useState('');
  const { rawHistory } = useFENHistory('');

  const historyFens = useMemo(
    () => [
      ...new Set(rawHistory.slice(0, HISTORY_LIMIT).map((entry) => entry.fen))
    ],
    [rawHistory]
  );

  const shown = useMemo(() => {
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

  const openId = collapsedId === project.selectedId ? null : project.selectedId;

  const toggle = useCallback(
    (id: string) => {
      if (id === project.selectedId) {
        setCollapsedId((current) => (current === id ? null : id));
        return;
      }
      setCollapsedId(null);
      actions.select(id);
    },
    [actions, project.selectedId]
  );

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

  return (
    <Section
      title="Diagrams"
      description="Each position becomes one numbered diagram, in this order."
      actions={
        <span className="rounded-full bg-surface-elevated px-2.5 py-1 font-mono text-[11px] font-semibold text-text-secondary">
          {project.positions.length}/{LATEX_MAX_POSITIONS}
        </span>
      }
    >
      {project.positions.length >= FILTER_THRESHOLD && (
        <TextField
          label="Filter"
          value={query}
          onChange={setQuery}
          placeholder="Author, stipulation, FEN…"
          maxLength={100}
        />
      )}

      {shown.length === 0 ? (
        <p role="status" className="py-3 text-center text-xs text-text-muted">
          No diagram matches “{query}”.
        </p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Diagrams">
          {shown.map(({ position, index }) => (
            <DiagramRow
              key={position.id}
              position={position}
              index={index}
              total={project.positions.length}
              open={openId === position.id}
              project={project}
              actions={actions}
              onToggle={toggle}
              onNotify={onNotify}
            />
          ))}
        </ul>
      )}

      {pasting ? (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-3">
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
          <div className="flex gap-2">
            <button
              type="button"
              className={`${ACTION_BUTTON} border-accent/40 text-accent hover:text-accent-hover`}
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
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 xs:grid-cols-3">
          <button
            type="button"
            className={ACTION_BUTTON}
            disabled={isFull}
            onClick={() => actions.addFen(STARTING_FEN)}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add diagram
          </button>
          <button
            type="button"
            className={ACTION_BUTTON}
            disabled={isFull}
            onClick={() => setPasting(true)}
          >
            <Clipboard className="size-4" aria-hidden="true" />
            Paste a list
          </button>
          <button
            type="button"
            className={ACTION_BUTTON}
            disabled={isFull || !historyFens.length}
            onClick={addHistory}
          >
            <History className="size-4" aria-hidden="true" />
            From history
          </button>
        </div>
      )}
    </Section>
  );
});
