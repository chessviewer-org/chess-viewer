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
const BOARD_PRESETS: BoardSizePreset[] = [4, 6, 8];

export interface ExportSettingsStepProps {
  wizard: ReturnType<typeof useExportWizard>;
  onExport: () => void;
}

export default function ExportSettingsStep({
  wizard,
  onExport
}: ExportSettingsStepProps) {
  const inputCls =
    'rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm ' +
    'text-text-primary focus:outline-none transition-colors';

  const presetBtn = (active: boolean) =>
    `flex-1 flex justify-center items-center rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none ${
      active
        ? 'bg-accent/10 text-text-primary'
        : 'bg-surface text-text-secondary hover:bg-surface-elevated focus:bg-surface-elevated'
    }`;

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 lg:p-5 gap-6">
      {/* ── Settings ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        {/* Format */}
        <div className="space-y-2.5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Format
          </h3>
          <div className="flex w-full rounded-lg border border-border/60 overflow-hidden">
            {FORMATS.map((fmt, idx) => {
              const active = wizard.selectedFormats.includes(fmt.value);
              return (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() => wizard.toggleFormat(fmt.value)}
                  className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-semibold transition-colors focus:outline-none ${
                    idx !== FORMATS.length - 1
                      ? 'border-r border-border/60'
                      : ''
                  } ${
                    active
                      ? 'bg-accent/10 text-text-primary'
                      : 'text-text-secondary hover:bg-surface-elevated focus:bg-surface-elevated'
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
        <div className="space-y-2.5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Quality
          </h3>
          <div className="flex w-full gap-2">
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
        <div className="space-y-2.5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Board Size
          </h3>
          <div className="flex w-full items-center gap-2">
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
            <div className="h-5 w-px bg-border/60 shrink-0" />
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
              className={`flex-1 min-w-0 text-center rounded-lg px-3 py-1.5 text-sm transition-colors focus:outline-none ${
                wizard.boardSizePreset === 'custom'
                  ? 'bg-accent/10 text-text-primary'
                  : 'bg-surface text-text-secondary hover:bg-surface-elevated focus:bg-surface-elevated'
              }`}
            />
          </div>
          {wizard.customBoardSizeError && (
            <p className="text-xs text-error">{wizard.customBoardSizeError}</p>
          )}
        </div>

        {/* File Name */}
        <div className="space-y-2.5">
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
          <div className="mt-2 rounded-lg border border-border/50 bg-surface-elevated/50 p-3">
            <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
              Pro Tips
            </h4>
            <ul className="list-inside list-disc space-y-1 text-[11px] leading-relaxed text-text-muted">
              <li>
                Use commas to name multiple formats sequentially (e.g.,{' '}
                <code>image1, vector1</code> for PNG and SVG).
              </li>
              <li>
                Empty slots will automatically default to{' '}
                <strong>chess-position</strong>.
              </li>
            </ul>
          </div>
        </div>

        {/* Download Action */}
        <div className="mt-4">
          <button
            type="button"
            onClick={onExport}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-bg transition-colors hover:bg-accent-hover focus:outline-none focus:bg-accent-hover flex items-center justify-center gap-2"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
