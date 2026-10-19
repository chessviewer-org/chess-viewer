import { memo, useMemo } from 'react';

import { Switch } from '@ui';
import {
  LATEX_COLUMN_RANGE,
  LATEX_DOCUMENT_CLASSES,
  LATEX_FONT_SIZES,
  LATEX_MARGIN_RANGE_MM,
  LATEX_PACKAGES,
  LATEX_PACKAGE_META,
  LATEX_PAPER_SIZES,
  type LatexBoardSize
} from '@utils';
import { estimateFit } from '../utils/layoutFit';
import type { StudioSettings } from '../utils/latexProject';
import { RangeField, Section, Segmented, TextField } from './controls';

const PACKAGE_COPY: Record<
  (typeof LATEX_PACKAGES)[number],
  { title: string; summary: string }
> = {
  diagram: {
    title: 'Problem diagram',
    summary: 'Author, source, award, stipulation and piece count.'
  },
  chessboard: {
    title: 'Annotated board',
    summary: 'Arrows, highlights, coordinates and side to move.'
  },
  skak: {
    title: 'Classic board',
    summary: 'Plain diagrams with coordinates.'
  }
};

const MODE_OPTIONS = [
  {
    value: 'document',
    label: 'Document',
    hint: 'A complete file that compiles on its own.'
  },
  {
    value: 'snippet',
    label: 'Snippet',
    hint: 'Only the lines to paste into your own document.'
  },
  {
    value: 'standalone',
    label: 'Figure',
    hint: 'A cropped PDF of just the diagrams, ready to include elsewhere.'
  }
] as const;

const SIZE_OPTIONS: ReadonlyArray<{ value: LatexBoardSize; label: string }> = [
  { value: 'tiny', label: 'Tiny' },
  { value: 'small', label: 'Small' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' }
];

const COLUMN_OPTIONS = Array.from(
  { length: LATEX_COLUMN_RANGE.max - LATEX_COLUMN_RANGE.min + 1 },
  (_, offset) => {
    const value = LATEX_COLUMN_RANGE.min + offset;
    return { value, label: String(value) };
  }
);

const CLASS_OPTIONS = LATEX_DOCUMENT_CLASSES.map((value) => ({
  value,
  label: value[0]!.toUpperCase() + value.slice(1)
}));

const PAPER_OPTIONS = LATEX_PAPER_SIZES.map((value) => ({
  value,
  label: value === 'letter' ? 'Letter' : value.toUpperCase()
}));

const FONT_OPTIONS = LATEX_FONT_SIZES.map((value) => ({
  value,
  label: `${value} pt`
}));

interface SettingsPanelProps {
  settings: StudioSettings;
  onChange: (patch: Partial<StudioSettings>) => void;
}

export const SettingsPanel = memo(function SettingsPanel({
  settings,
  onChange
}: SettingsPanelProps) {
  const isDiagram = settings.latexPackage === 'diagram';
  const isChessboard = settings.latexPackage === 'chessboard';
  const isDocument = settings.mode === 'document';
  const fit = useMemo(() => estimateFit(settings), [settings]);

  return (
    <>
      <Section title="Style" description="How every board is typeset.">
        <div
          role="radiogroup"
          aria-label="LaTeX package"
          className="grid gap-2 sm:grid-cols-3"
        >
          {LATEX_PACKAGES.map((id) => {
            const copy = PACKAGE_COPY[id];
            const active = settings.latexPackage === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ latexPackage: id })}
                className={`flex min-h-0 flex-col gap-1 rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-text-muted/40 hover:bg-surface-elevated'
                }`}
              >
                <span className="text-xs font-bold text-text-primary">
                  {copy.title}
                </span>
                <span className="font-mono text-[10px] text-text-muted">
                  {LATEX_PACKAGE_META[id].label}
                </span>
                <span className="text-[11px] leading-snug text-text-muted">
                  {copy.summary}
                </span>
              </button>
            );
          })}
        </div>

        <Segmented
          label="Board size"
          value={settings.boardSize}
          options={SIZE_OPTIONS}
          onChange={(boardSize) => onChange({ boardSize })}
        />

        {isDiagram ? (
          <p className="text-[11px] leading-relaxed text-text-muted">
            Problem diagrams always print White at the bottom, without
            coordinates, with the piece count beside the stipulation.
          </p>
        ) : (
          <>
            <Switch
              label="Coordinates"
              description="Show file letters and rank numbers."
              checked={settings.showCoords}
              onChange={(showCoords) => onChange({ showCoords })}
            />
            {isChessboard && (
              <Switch
                label="Side-to-move marker"
                description="A small square beside the board shows who is to move."
                checked={settings.showMover}
                onChange={(showMover) => onChange({ showMover })}
              />
            )}
            <Switch
              label="Piece count"
              description="Print (white+black) beside the stipulation."
              checked={settings.pieceCount}
              onChange={(pieceCount) => onChange({ pieceCount })}
            />
          </>
        )}
      </Section>

      <Section title="Document" description="The page around the diagrams.">
        <Segmented
          label="Output"
          value={settings.mode}
          options={MODE_OPTIONS}
          onChange={(mode) => onChange({ mode })}
        />

        <Segmented
          label="Diagrams per row"
          value={settings.columns}
          options={COLUMN_OPTIONS}
          onChange={(columns) => onChange({ columns })}
        />
        {fit &&
          (fit.fits ? (
            <p role="status" className="text-[11px] text-success">
              Fits: each board is about {Math.round(fit.boardMm)} mm in a{' '}
              {Math.round(fit.cellMm)} mm column.
            </p>
          ) : (
            <div
              role="alert"
              className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-[11px] leading-relaxed text-text-secondary"
            >
              <p>
                Boards are about {Math.round(fit.boardMm)} mm wide but each
                column is only {Math.round(fit.cellMm)} mm, so they will
                overlap.
                {fit.maxColumns > 0
                  ? ` ${fit.maxColumns} per row fits.`
                  : ' Choose a smaller board size or smaller margins.'}
              </p>
              {fit.maxColumns > 0 && (
                <button
                  type="button"
                  onClick={() => onChange({ columns: fit.maxColumns })}
                  className="min-h-0 self-start rounded-md border border-warning/50 px-2.5 py-1 font-semibold text-text-primary hover:bg-warning/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Use {fit.maxColumns} per row
                </button>
              )}
            </div>
          ))}

        <Switch
          label="Number the diagrams"
          description="Print No. 1, No. 2, … above each board."
          checked={settings.numbering}
          onChange={(numbering) => onChange({ numbering })}
        />
        <Switch
          label="Solutions section"
          description="List every solution you entered at the end."
          checked={settings.solutions}
          onChange={(solutions) => onChange({ solutions })}
        />

        {isDocument && (
          <div className="flex flex-col gap-4 border-t border-border/60 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Title"
                value={settings.title}
                onChange={(title) => onChange({ title })}
                maxLength={200}
                hint="Adds a title page when filled in."
              />
              <TextField
                label="Document author"
                value={settings.documentAuthor}
                onChange={(documentAuthor) => onChange({ documentAuthor })}
                maxLength={200}
              />
            </div>
            <Segmented
              label="Paper"
              value={settings.paper}
              options={PAPER_OPTIONS}
              onChange={(paper) => onChange({ paper })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Segmented
                label="Document class"
                value={settings.documentClass}
                options={CLASS_OPTIONS}
                onChange={(documentClass) => onChange({ documentClass })}
              />
              <Segmented
                label="Font size"
                value={settings.fontSize}
                options={FONT_OPTIONS}
                onChange={(fontSize) => onChange({ fontSize })}
              />
            </div>
            <RangeField
              label="Margin"
              value={settings.marginMm}
              min={LATEX_MARGIN_RANGE_MM.min}
              max={LATEX_MARGIN_RANGE_MM.max}
              unit="mm"
              onChange={(marginMm) => onChange({ marginMm })}
            />
          </div>
        )}
      </Section>
    </>
  );
});
