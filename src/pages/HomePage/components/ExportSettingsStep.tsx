import { Check } from 'lucide-react';

import type {
  BoardSizePreset,
  ExportFormat,
  ExportResolution,
  useExportWizard
} from '../hooks/useExportWizard';

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'svg', label: 'SVG' }
];

const RESOLUTIONS: ExportResolution[] = [1, 2, 3, 4];
const BOARD_PRESETS: BoardSizePreset[] = [4, 8, 12];

/** Props for wizard step 3 — format, resolution, board size, and file naming. */
export interface ExportSettingsStepProps {
  wizard: ReturnType<typeof useExportWizard>;
}

/** Wizard step 3: format toggles, resolution selector, board size control, and per-format file names. */
export default function ExportSettingsStep({
  wizard
}: ExportSettingsStepProps) {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
          Export Settings
        </h2>
        <p className="text-sm text-text-secondary">
          Select formats, render density, board size and naming.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          Download Formats
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map((format) => (
            <button
              key={format.value}
              type="button"
              onClick={() => wizard.toggleFormat(format.value)}
              className={`rounded-xl border p-3 flex flex-col items-center gap-2 transition-colors ${
                wizard.selectedFormats.includes(format.value)
                  ? 'border-accent bg-accent/10 text-text-primary'
                  : 'border-border/60 text-text-secondary hover:bg-surface-elevated'
              }`}
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  wizard.selectedFormats.includes(format.value)
                    ? 'border-accent bg-accent text-bg'
                    : 'border-border'
                }`}
              >
                {wizard.selectedFormats.includes(format.value) && (
                  <Check className="w-3 h-3" />
                )}
              </span>
              <span className="text-xs font-semibold">{format.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          Export Settings
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {RESOLUTIONS.map((resolution) => (
            <button
              key={resolution}
              type="button"
              onClick={() => wizard.setResolutionValue(resolution)}
              className={`rounded-lg border py-2 text-sm font-semibold transition-colors ${
                wizard.resolution === resolution
                  ? 'border-accent bg-accent/10 text-text-primary'
                  : 'border-border/60 text-text-secondary hover:bg-surface-elevated'
              }`}
            >
              {resolution}x
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          BoardSize Control
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {BOARD_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => wizard.selectBoardSizePreset(preset)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                wizard.boardSizePreset === preset
                  ? 'border-accent bg-accent/10 text-text-primary'
                  : 'border-border/60 text-text-secondary hover:bg-surface-elevated'
              }`}
            >
              {preset}sm
            </button>
          ))}

          <button
            type="button"
            onClick={() => wizard.selectBoardSizePreset('custom')}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              wizard.boardSizePreset === 'custom'
                ? 'border-accent bg-accent/10 text-text-primary'
                : 'border-border/60 text-text-secondary hover:bg-surface-elevated'
            }`}
          >
            Custom
          </button>

          <input
            type="number"
            min={4}
            max={16}
            step={0.1}
            value={wizard.customBoardSizeInput}
            onFocus={() => wizard.selectBoardSizePreset('custom')}
            onChange={(event) =>
              wizard.updateCustomBoardSize(event.target.value)
            }
            placeholder="4-16"
            className="w-24 rounded-lg border border-border/60 bg-surface px-2 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>
        {wizard.customBoardSizeError && (
          <p className="text-xs text-error">{wizard.customBoardSizeError}</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">File Name</h3>
        <input
          value={wizard.fileNamesInput}
          onChange={(event) => wizard.updateFileNames(event.target.value)}
          placeholder="e.g. Position1, Tactic2"
          className="w-full rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
        {wizard.fileNameError && (
          <p className="text-xs text-error">{wizard.fileNameError}</p>
        )}
        <p className="text-xs text-text-secondary">
          Use comma-separated names. Unfilled slots fall back to{' '}
          <strong>chessboard</strong>.
        </p>
      </section>
    </div>
  );
}
