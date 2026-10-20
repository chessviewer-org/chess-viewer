import { memo, useCallback, useMemo, useState } from 'react';

import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Trash2
} from '@/assets/icons';

import { FENInputField } from '@/components/features';
import { Switch } from '@ui';
import {
  LATEX_MAX_POSITIONS,
  LATEX_PACKAGE_META,
  type LatexCaptionStyle,
  pieceCounts
} from '@utils';
import {
  type StudioPosition,
  type StudioSettings,
  positionWarnings,
  usableFen
} from '../utils/latexProject';
import type { LatexProjectActions } from '../hooks/useLatexProject';
import { readFenFromClipboard } from '../utils/clipboardFen';
import { ICON_BUTTON, MarkField, TextField } from './controls';
import { CAPTION_STYLE_OPTIONS } from '../utils/captionStyles';
import { PaperBoard } from './PaperBoard';

const SUMMARY =
  'flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 rounded-md text-[11px] font-bold uppercase tracking-wider text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden';

const WIDE_QUERY = '(min-width: 1024px)';

function styleLabel(style: LatexCaptionStyle): string {
  return (
    CAPTION_STYLE_OPTIONS.find((option) => option.value === style)?.label ??
    style
  );
}

function isWide(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(WIDE_QUERY).matches;
}

const LINK_BUTTON =
  'self-start rounded-md px-1 text-xs font-semibold text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40';

interface DiagramEditorProps {
  position: StudioPosition;
  index: number;
  total: number;
  previousId: string | null;
  nextId: string | null;
  onBack: () => void;
  className?: string | undefined;
  settings: StudioSettings;
  actions: LatexProjectActions;
  onNotify: (message: string, type?: 'success' | 'error') => void;
}

function listWarning(label: string, invalid: string[]): string | null {
  return invalid.length ? `Ignored ${label}: ${invalid.join(', ')}` : null;
}

export const DiagramEditor = memo(function DiagramEditor({
  position,
  index,
  total,
  previousId,
  nextId,
  onBack,
  className = '',
  settings,
  actions,
  onNotify
}: DiagramEditorProps) {
  const number = index + 1;
  const meta = LATEX_PACKAGE_META[settings.latexPackage];
  const isDiagram = settings.latexPackage === 'diagram';
  const [applied, setApplied] = useState(false);
  const [wide] = useState(isWide);
  const style = position.captionStyle ?? settings.captionStyle;
  const isGame = style === 'game';
  const isPlain = style === 'plain';
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
    actions.applyToAll(
      isGame
        ? { event: position.event, date: position.date }
        : {
            author: position.author,
            source: position.source,
            award: position.award,
            stipulation: position.stipulation,
            remark: position.remark
          }
    );
    setApplied(true);
    onNotify(`Details copied to all ${total} diagrams`);
  };

  return (
    <section
      aria-labelledby="diagram-editor-title"
      className={`@container flex min-w-0 flex-col gap-5 rounded-2xl border border-border bg-surface p-4 sm:p-5 ${className}`}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/60 pb-3">
        <button
          type="button"
          onClick={onBack}
          className={`${ICON_BUTTON} lg:hidden`}
          aria-label="Back to all diagrams"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <h2
          id="diagram-editor-title"
          className="min-w-0 flex-1 text-sm font-bold whitespace-nowrap text-text-primary"
        >
          Diagram {number}
          <span className="font-normal text-text-muted"> of {total}</span>
        </h2>
        <div className="flex items-center">
          <button
            type="button"
            className={ICON_BUTTON}
            disabled={!previousId}
            aria-label="Previous diagram"
            onClick={() => previousId && actions.select(previousId)}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={ICON_BUTTON}
            disabled={!nextId}
            aria-label="Next diagram"
            onClick={() => nextId && actions.select(nextId)}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
          <button
            type="button"
            className={ICON_BUTTON}
            disabled={index === 0}
            aria-label="Move earlier"
            onClick={() => actions.move(id, -1)}
          >
            <ChevronDown className="size-4 rotate-180" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={ICON_BUTTON}
            disabled={index === total - 1}
            aria-label="Move later"
            onClick={() => actions.move(id, 1)}
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={ICON_BUTTON}
            disabled={total >= LATEX_MAX_POSITIONS}
            aria-label="Duplicate diagram"
            onClick={() => actions.duplicate(id)}
          >
            <Copy className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${ICON_BUTTON} hover:text-error`}
            aria-label="Delete diagram"
            onClick={() => actions.remove(id)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="grid gap-5 @2xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <div className="mx-auto flex w-full max-w-[15rem] flex-col gap-1.5 @2xl:mx-0">
          <PaperBoard
            position={position}
            settings={settings}
            alt={`Diagram ${number} as printed`}
            className="w-full"
          />
          {counts && (
            <p className="text-center text-[11px] text-text-muted tabular-nums">
              White {counts.white} · Black {counts.black}
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <FENInputField
            key={id}
            fen={position.fen}
            onChange={handleFen}
            onPaste={() => void handlePaste()}
            allowBatch={false}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Caption style
            </span>
            <select
              value={position.captionStyle ?? ''}
              onChange={(event) =>
                patch({
                  captionStyle:
                    (event.target.value as LatexCaptionStyle) || null
                })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus-visible:border-accent"
            >
              <option value="">
                Document default ({styleLabel(settings.captionStyle)})
              </option>
              {CAPTION_STYLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {isGame ? (
            <div className="grid gap-3 @sm:grid-cols-2">
              <TextField
                label="White"
                value={position.white}
                onChange={(white) => patch({ white })}
                placeholder="Kasparov, Garry"
              />
              <TextField
                label="Black"
                value={position.black}
                onChange={(black) => patch({ black })}
                placeholder="Topalov, Veselin"
              />
              <TextField
                label="Event"
                value={position.event}
                onChange={(event) => patch({ event })}
                placeholder="Wijk aan Zee"
              />
              <TextField
                label="Date"
                value={position.date}
                onChange={(date) => patch({ date })}
                placeholder="1999"
              />
            </div>
          ) : (
            <div className="grid gap-3 @sm:grid-cols-2">
              <TextField
                label="Stipulation"
                value={position.stipulation}
                onChange={(stipulation) => patch({ stipulation })}
                placeholder="#2, h#3, Win, Draw"
              />
              {!isPlain && (
                <>
                  <TextField
                    label="Award"
                    value={position.award}
                    onChange={(award) => patch({ award })}
                    placeholder="1st Prize"
                  />
                  <TextField
                    label="Author"
                    value={position.author}
                    onChange={(author) => patch({ author })}
                    placeholder="Loyd, Sam"
                    hint={
                      isDiagram
                        ? 'Surname, First name; ; between authors'
                        : undefined
                    }
                  />
                  <TextField
                    label="Source"
                    value={position.source}
                    onChange={(source) => patch({ source })}
                    placeholder="Chess Monthly, 1903"
                  />
                </>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {meta.supportsFlip ? (
              <Switch
                label="Black at the bottom"
                checked={position.flipped}
                onChange={(flipped) => patch({ flipped })}
              />
            ) : (
              <span />
            )}
            <button
              type="button"
              className={LINK_BUTTON}
              disabled={total < 2}
              onClick={applyShared}
              onBlur={() => setApplied(false)}
            >
              {applied
                ? 'Copied to every diagram'
                : 'Use these details for all'}
            </button>
          </div>
        </div>
      </div>

      <details open={wide} className="group border-t border-border/60 pt-4">
        <summary className={SUMMARY}>
          Notes and solution
          <ChevronDown
            className="size-4 transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="mt-3 grid gap-3 @2xl:grid-cols-2">
          <div className="flex flex-col gap-3">
            {(!isDiagram || isGame) && (
              <TextField
                label={isGame ? 'Caption under the board' : 'Caption'}
                value={position.caption}
                onChange={(caption) => patch({ caption })}
                placeholder={isGame ? 'after 23...Qxd4' : 'Initial position'}
              />
            )}
            <TextField
              label="Remark"
              value={position.remark}
              onChange={(remark) => patch({ remark })}
              placeholder="Dedicated to …"
            />
          </div>
          <TextField
            label="Solution"
            value={position.solution}
            onChange={(solution) => patch({ solution })}
            multiline
            rows={isDiagram ? 3 : 5}
            maxLength={2000}
            placeholder="1.Qh5! Nf6 2.Qxf7#"
            hint={
              settings.solutions
                ? 'Printed in the Solutions section.'
                : 'Turn on Solutions under Document to print it.'
            }
          />
        </div>
      </details>

      <details open={wide} className="group border-t border-border/60 pt-4">
        <summary className={SUMMARY}>
          Highlights and arrows
          <ChevronDown
            className="size-4 transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        {meta.supportsMarks ? (
          <div className="mt-3 grid gap-3 @2xl:grid-cols-3">
            <MarkField
              label="Highlighted squares"
              value={position.squares}
              color={position.squareColor}
              placeholder="e4 d5"
              error={listWarning('squares', warnings.squares)}
              onChange={(squares) => patch({ squares })}
              onColorChange={(squareColor) => patch({ squareColor })}
            />
            <MarkField
              label="Circled squares"
              value={position.rings}
              color={position.ringColor}
              placeholder="f7"
              error={listWarning('squares', warnings.rings)}
              onChange={(rings) => patch({ rings })}
              onColorChange={(ringColor) => patch({ ringColor })}
            />
            <MarkField
              label="Arrows"
              value={position.arrows}
              color={position.arrowColor}
              placeholder="e2-e4 g1-f3"
              error={listWarning('arrows', warnings.arrows)}
              onChange={(arrows) => patch({ arrows })}
              onColorChange={(arrowColor) => patch({ arrowColor })}
            />
          </div>
        ) : (
          <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
            Available with the Annotated board style under Document.
          </p>
        )}
      </details>
    </section>
  );
});
