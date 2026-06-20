import { Check } from 'lucide-react';

import { usePieceImages } from '@hooks';

import type {
  BoardSizePreset,
  ExportFormat,
  ExportResolution,
  useExportWizard
} from '../hooks/useExportWizard';
import BoardPreviewCanvas from './BoardPreviewCanvas';
import type { HomeStateForExport } from './ExportStudio.types';

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'svg', label: 'SVG' }
];

const RESOLUTIONS: ExportResolution[] = [1, 2, 3, 4];
const BOARD_PRESETS: BoardSizePreset[] = [4, 6, 8];

export interface ExportSettingsStepProps {
  wizard: ReturnType<typeof useExportWizard>;
  homeState: HomeStateForExport;
}

export default function ExportSettingsStep({
  wizard,
  homeState
}: ExportSettingsStepProps) {
  const { pieceImages, isLoading } = usePieceImages(homeState.pieceStyle);

  const inputCls =
    'rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm ' +
    'text-text-primary focus:outline-none focus:border-accent transition-colors';

  const presetBtn = (active: boolean) =>
    `rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
      active
        ? 'border-accent bg-accent/10 text-text-primary'
        : 'border-border/60 text-text-secondary hover:bg-surface-elevated'
    }`;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: board preview fills the panel ───────────────────────────── */}
      <div className="hidden md:flex flex-col h-full w-[40%] shrink-0 p-4 lg:p-5 gap-3">
        <div className="flex-1 min-h-0 flex items-start justify-center">
          <div className="w-full max-w-sm lg:max-w-md">
            <BoardPreviewCanvas
              fen={homeState.fen}
              lightSquare={homeState.lightSquare}
              darkSquare={homeState.darkSquare}
              pieceImages={pieceImages}
              piecesLoading={isLoading}
              showCoords={homeState.showCoords}
              showCoordinateBorder={homeState.showCoordinateBorder}
              flipped={homeState.flipped}
            />
          </div>
        </div>

        {/* Size indicator below board */}
        <div className="shrink-0 flex items-center justify-center gap-2 py-1">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-xs font-bold text-text-muted tabular-nums">
            {wizard.activeBoardSize} cm export
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>
      </div>

      {/* ── Right: controls ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-0 overflow-y-auto divide-y divide-border/40">
        {/* Format */}
        <div className="p-4 lg:p-5 space-y-2.5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Format
          </h3>
          <div className="flex gap-2">
            {FORMATS.map((fmt) => {
              const active = wizard.selectedFormats.includes(fmt.value);
              return (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() => wizard.toggleFormat(fmt.value)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-accent bg-accent/10 text-text-primary'
                      : 'border-border/60 text-text-secondary hover:bg-surface-elevated'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                      active
                        ? 'border-accent bg-accent text-bg'
                        : 'border-border'
                    }`}
                  >
                    {active && <Check className="w-2.5 h-2.5" />}
                  </span>
                  {fmt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality */}
        <div className="p-4 lg:p-5 space-y-2.5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Quality
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {RESOLUTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => wizard.setResolutionValue(r)}
                className={presetBtn(wizard.resolution === r)}
              >
                {r}×
              </button>
            ))}
          </div>
        </div>

        {/* Board Size */}
        <div className="p-4 lg:p-5 space-y-2.5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Board Size
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {BOARD_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => wizard.selectBoardSizePreset(preset)}
                className={presetBtn(wizard.boardSizePreset === preset)}
              >
                {preset} cm
              </button>
            ))}
            <div className="h-5 w-px bg-border/60" />
            <input
              type="number"
              inputMode="decimal"
              min={4}
              max={8}
              step={0.5}
              value={wizard.customBoardSizeInput}
              onFocus={() => wizard.selectBoardSizePreset('custom')}
              onChange={(e) => wizard.updateCustomBoardSize(e.target.value)}
              placeholder="cm"
              aria-label="Custom board size in centimetres (4 to 8)"
              aria-invalid={wizard.customBoardSizeError ? true : undefined}
              className={`w-20 ${inputCls} ${wizard.boardSizePreset === 'custom' ? 'border-accent' : ''}`}
            />
          </div>
          {wizard.customBoardSizeError && (
            <p className="text-xs text-error">{wizard.customBoardSizeError}</p>
          )}
        </div>

        {/* File Name */}
        <div className="p-4 lg:p-5 space-y-2.5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            File Name
          </h3>
          <input
            value={wizard.fileNamesInput}
            onChange={(e) => wizard.updateFileNames(e.target.value)}
            placeholder="e.g. Position1, Tactic2"
            className={`w-full ${inputCls}`}
          />
          {wizard.fileNameError && (
            <p className="text-xs text-error">{wizard.fileNameError}</p>
          )}
          <p className="text-xs text-text-muted">
            Comma-separated. Empty slots use <strong>chessboard</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
