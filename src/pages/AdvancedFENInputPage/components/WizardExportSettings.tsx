import { memo } from 'react';

import { Archive, Check, Download, Lightbulb } from '@/assets/icons';

import type {
  BoardSizePreset,
  ExportFormat,
  ExportResolution,
  useAdvancedFEN
} from '../hooks/useAdvancedFEN';

// Types
type AdvancedFENReturn = ReturnType<typeof useAdvancedFEN>;

// Constants
const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'svg', label: 'SVG' }
];

const RESOLUTIONS: ExportResolution[] = [1, 2, 3, 4];
const BOARD_PRESETS: Exclude<BoardSizePreset, 'custom'>[] = [4, 6, 8];

interface WizardExportSettingsProps {
  state: AdvancedFENReturn['state'];
  handlers: AdvancedFENReturn['handlers'];
}

const WizardExportSettings = memo(function WizardExportSettings({
  state,
  handlers
}: WizardExportSettingsProps) {
  const inputCls =
    'rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm ' +
    'text-text-primary focus:outline-none transition-colors';

  const presetBtn = (active: boolean) =>
    `flex-1 flex justify-center items-center rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none ${
      active
        ? 'bg-accent/10 text-text-primary'
        : 'bg-surface text-text-secondary hover:bg-surface-elevated focus:bg-surface-elevated'
    }`;

  const noFormats = state.selectedFormats.length === 0;

  return (
    <div className="flex flex-col h-full animate-fadeIn gap-6">
      <div className="space-y-2.5">
        <h3 className="section-eyebrow">Format</h3>
        <div className="flex w-full rounded-lg border border-border/60 overflow-hidden">
          {FORMATS.map((fmt, idx) => {
            const active = state.selectedFormats.includes(fmt.value);
            return (
              <button
                key={fmt.value}
                type="button"
                onClick={() => handlers.toggleFormat(fmt.value)}
                className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-semibold transition-colors focus:outline-none ${
                  idx !== FORMATS.length - 1 ? 'border-r border-border/60' : ''
                } ${
                  active
                    ? 'bg-accent/10 text-text-primary'
                    : 'text-text-secondary hover:bg-surface-elevated focus:bg-surface-elevated'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                    active ? 'border-accent bg-accent text-bg' : 'border-border'
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

      <div className="space-y-2.5">
        <h3 className="section-eyebrow">Quality</h3>
        <div className="flex w-full gap-2">
          {RESOLUTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handlers.setExportQuality(r)}
              className={presetBtn(state.exportQuality === r)}
            >
              {r}×
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <h3 className="section-eyebrow">Board Size</h3>
        <div className="flex w-full items-center gap-2">
          {BOARD_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlers.selectBoardSizePreset(preset)}
              className={presetBtn(state.boardSizePreset === preset)}
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
            value={state.customBoardSizeInput}
            onFocus={() => handlers.selectBoardSizePreset('custom')}
            onChange={(e) => handlers.updateCustomBoardSize(e.target.value)}
            placeholder="cm"
            aria-label="Custom board size in centimetres (4 to 8)"
            aria-invalid={state.customBoardSizeError ? true : undefined}
            className={`flex-1 min-w-0 text-center rounded-lg px-3 py-1.5 text-sm transition-colors focus:outline-none ${
              state.boardSizePreset === 'custom'
                ? 'bg-accent/10 text-text-primary'
                : 'bg-surface text-text-secondary hover:bg-surface-elevated focus:bg-surface-elevated'
            }`}
          />
        </div>
        {state.customBoardSizeError && (
          <p className="text-xs text-error">{state.customBoardSizeError}</p>
        )}
      </div>

      <div className="space-y-2.5">
        <h3 className="section-eyebrow">File Name</h3>
        <div className="relative">
          <input
            value={state.fileNamesInput}
            onChange={(e) => handlers.updateFileNames(e.target.value)}
            placeholder="e.g. Position1, Tactic2"
            className={`w-full ${inputCls}`}
          />
          <div className="mt-1.5 px-1 flex justify-between items-center text-[10px] text-text-secondary">
            <span>Preview for Board {state.safeCurrentIndex + 1}:</span>
            <span className="font-mono font-medium text-accent">
              {state.activeFileName}
            </span>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-border/40 bg-surface-elevated overflow-hidden shadow-sm relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
          <div className="p-4 flex gap-3.5">
            <div className="shrink-0 mt-0.5">
              <div className="bg-accent/10 p-1.5 rounded-lg">
                <Lightbulb className="w-4 h-4 text-accent" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
                Pro Tip{' '}
                <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-accent/10 text-accent">
                  Smart Naming
                </span>
              </h4>
              <ul className="space-y-2.5 text-xs leading-relaxed text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-accent font-bold opacity-70 mt-0.5">
                    •
                  </span>
                  <span>
                    Enter a single name (e.g.,{' '}
                    <code className="bg-surface/80 px-1.5 py-0.5 rounded-md border border-border/50 text-text-primary font-mono text-[10px]">
                      Tactic
                    </code>
                    ) to auto-number positions (
                    <code className="bg-surface/80 px-1.5 py-0.5 rounded-md border border-border/50 text-text-primary font-mono text-[10px]">
                      Tactic-1
                    </code>
                    , etc).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-bold opacity-70 mt-0.5">
                    •
                  </span>
                  <span>
                    Use brackets for ranges:{' '}
                    <code className="bg-surface/80 px-1.5 py-0.5 rounded-md border border-border/50 text-text-primary font-mono text-[10px]">
                      Sicilian[1-4], Trap[5-6]
                    </code>{' '}
                    to assign specific names to ranges.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <label className="flex items-center gap-2 cursor-pointer group w-fit">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={state.isChained}
              onChange={(e) => handlers.setIsChained(e.target.checked)}
              className="peer sr-only"
            />
            <div className="w-4 h-4 rounded border border-border/80 bg-surface peer-checked:bg-accent peer-checked:border-accent transition-colors"></div>
            <Check
              className="absolute w-3 h-3 text-bg opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
              strokeWidth={3}
            />
          </div>
          <span className="text-sm font-semibold text-text-primary group-hover:text-text-primary transition-colors select-none">
            Apply to all positions
          </span>
        </label>
      </div>

      <div className="space-y-3 pt-4 border-t border-border/40">
        <button
          type="button"
          onClick={handlers.handleExportActive}
          disabled={noFormats}
          className="w-full py-2.5 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-lg font-semibold transition duration-150 text-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Active Position ({state.safeCurrentIndex + 1})
        </button>
        <button
          type="button"
          onClick={handlers.handleExportBatch}
          disabled={noFormats}
          className="w-full py-3 bg-accent hover:bg-accent-hover text-bg rounded-lg font-bold transition duration-150 text-sm active:scale-[0.98] shadow-lg shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Archive className="w-4 h-4" />
          Download All as ZIP ({state.validFens.length})
        </button>
      </div>
    </div>
  );
});

WizardExportSettings.displayName = 'WizardExportSettings';
export default WizardExportSettings;
