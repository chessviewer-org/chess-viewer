import { memo, useCallback, useMemo, useState } from 'react';

import { FENInputField } from '@/components/features';
import { Switch } from '@ui';
import { LATEX_PACKAGE_META, pieceCounts } from '@utils';
import {
  type StudioPosition,
  type StudioSettings,
  positionWarnings,
  usableFen
} from '../utils/latexProject';
import type { LatexProjectActions } from '../hooks/useLatexProject';
import { readFenFromClipboard } from '../utils/clipboardFen';
import { ColorField, TextField } from './controls';
import { PaperBoard } from './PaperBoard';

const PREVIEW_SIZE = 320;

const GROUP_TITLE =
  'text-[11px] font-bold uppercase tracking-wider text-text-muted';

const LINK_BUTTON =
  'self-start rounded-md px-1 text-xs font-semibold text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40';

interface DiagramEditorProps {
  position: StudioPosition;
  number: number;
  total: number;
  settings: StudioSettings;
  actions: LatexProjectActions;
  onNotify: (message: string, type?: 'success' | 'error') => void;
}

function listWarning(label: string, invalid: string[]): string | null {
  return invalid.length ? `Ignored ${label}: ${invalid.join(', ')}` : null;
}

export const DiagramEditor = memo(function DiagramEditor({
  position,
  number,
  total,
  settings,
  actions,
  onNotify
}: DiagramEditorProps) {
  const meta = LATEX_PACKAGE_META[settings.latexPackage];
  const isDiagram = settings.latexPackage === 'diagram';
  const [applied, setApplied] = useState(false);
  const fen = usableFen(position.fen);
  const counts = fen ? pieceCounts(fen) : null;
  const warnings = useMemo(() => positionWarnings(position), [position]);

  const { id } = position;
  const patch = useCallback(
    (change: Partial<StudioPosition>) => actions.updatePosition(id, change),
    [actions, id]
  );
  const handleFen = useCallback(
    (next: string) => patch({ fen: next }),
    [patch]
  );
  const handlePaste = useCallback(async () => {
    const result = await readFenFromClipboard();
    if (result.ok) patch({ fen: result.fen });
    else onNotify(result.reason, 'error');
  }, [patch, onNotify]);

  const applyShared = () => {
    actions.applyToAll({
      author: position.author,
      source: position.source,
      award: position.award,
      stipulation: position.stipulation,
      remark: position.remark
    });
    setApplied(true);
    onNotify(`Details copied to all ${total} diagrams`);
  };

  return (
    <div className="flex flex-col gap-5 border-t border-border/60 p-3 sm:p-4">
      <div className="grid gap-4 @xl:grid-cols-[9rem_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-1.5">
          <PaperBoard
            position={position}
            settings={settings}
            size={PREVIEW_SIZE}
            alt={`Diagram ${number}`}
            className="w-full max-w-[12rem] rounded-md"
          />
          {counts && (
            <p className="text-[11px] text-text-muted">
              White {counts.white} · Black {counts.black}
            </p>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <FENInputField
            key={id}
            fen={position.fen}
            onChange={handleFen}
            onPaste={() => void handlePaste()}
            allowBatch={false}
          />
          {meta.supportsFlip && (
            <Switch
              label="Black at the bottom"
              description="Turn the board around for this diagram."
              checked={position.flipped}
              onChange={(flipped) => patch({ flipped })}
            />
          )}
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className={`${GROUP_TITLE} mb-3`}>Problem</legend>
        <div className="grid gap-3 @xs:grid-cols-2">
          <TextField
            label="Stipulation"
            value={position.stipulation}
            onChange={(stipulation) => patch({ stipulation })}
            placeholder="#2, h#3, +, ="
          />
          <TextField
            label="Author"
            value={position.author}
            onChange={(author) => patch({ author })}
            placeholder="Loyd, Sam"
            hint={
              isDiagram
                ? 'Surname, First name; use ; between authors.'
                : undefined
            }
          />
          <TextField
            label="Source"
            value={position.source}
            onChange={(source) => patch({ source })}
            placeholder="Chess Monthly, 1903"
          />
          <TextField
            label="Award"
            value={position.award}
            onChange={(award) => patch({ award })}
            placeholder="1st Prize"
          />
        </div>
        <button
          type="button"
          className={LINK_BUTTON}
          disabled={total < 2}
          onClick={applyShared}
          onBlur={() => setApplied(false)}
        >
          {applied ? 'Copied to every diagram' : 'Use these details for all'}
        </button>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className={`${GROUP_TITLE} mb-3`}>Notes</legend>
        {!isDiagram && (
          <TextField
            label="Caption"
            value={position.caption}
            onChange={(caption) => patch({ caption })}
            placeholder="Initial position"
          />
        )}
        <TextField
          label="Remark"
          value={position.remark}
          onChange={(remark) => patch({ remark })}
          placeholder="Dedicated to …"
        />
        <TextField
          label="Solution"
          value={position.solution}
          onChange={(solution) => patch({ solution })}
          multiline
          rows={3}
          maxLength={2000}
          placeholder="1.Qh5! Nf6 2.Qxf7#"
          hint={
            settings.solutions
              ? 'Printed in the Solutions section at the end.'
              : 'Turn on the Solutions section under Document to print it.'
          }
        />
      </fieldset>

      {meta.supportsMarks ? (
        <fieldset className="flex flex-col gap-3">
          <legend className={`${GROUP_TITLE} mb-3`}>
            Highlights and arrows
          </legend>
          <div className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-start gap-3">
            <TextField
              label="Highlighted squares"
              value={position.squares}
              onChange={(squares) => patch({ squares })}
              placeholder="e4 d5"
              error={listWarning('squares', warnings.squares)}
            />
            <ColorField
              label="Colour"
              value={position.squareColor}
              onChange={(squareColor) => patch({ squareColor })}
            />
            <TextField
              label="Circled squares"
              value={position.rings}
              onChange={(rings) => patch({ rings })}
              placeholder="f7"
              error={listWarning('squares', warnings.rings)}
            />
            <ColorField
              label="Colour"
              value={position.ringColor}
              onChange={(ringColor) => patch({ ringColor })}
            />
            <TextField
              label="Arrows"
              value={position.arrows}
              onChange={(arrows) => patch({ arrows })}
              placeholder="e2-e4 g1-f3"
              error={listWarning('arrows', warnings.arrows)}
            />
            <ColorField
              label="Colour"
              value={position.arrowColor}
              onChange={(arrowColor) => patch({ arrowColor })}
            />
          </div>
        </fieldset>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-[11px] leading-relaxed text-text-muted">
          Highlights and arrows need the Annotated board style.
          {isDiagram
            ? ' Problem diagrams always print White at the bottom.'
            : ''}
        </p>
      )}
    </div>
  );
});
