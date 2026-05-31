import { memo } from 'react';

import { Link, Link2Off, Sparkles } from 'lucide-react';

import type { useAdvancedFEN } from '../hooks/useAdvancedFEN';

type AdvancedFENReturn = ReturnType<typeof useAdvancedFEN>;

/** Props for the export settings wizard panel (format, resolution, smart naming, batch export). */
interface WizardExportSettingsProps {
  state: AdvancedFENReturn['state'];
  handlers: AdvancedFENReturn['handlers'];
}

/** Wizard step 2: format selector, resolution picker, smart file naming, and single/batch export triggers. */
const WizardExportSettings = memo(function WizardExportSettings({
  state,
  handlers
}: WizardExportSettingsProps) {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
            File Format
          </label>
          <div className="flex bg-surface-elevated border border-border/40 rounded-xl p-1 w-full max-w-70">
            {(['png', 'jpeg', 'svg'] as const).map((format) => {
              const isActive = state.exportFormat === format;
              return (
                <button
                  key={format}
                  type="button"
                  onClick={() => handlers.setExportFormat(format)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition duration-150 uppercase ${
                    isActive
                      ? 'bg-accent text-bg shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {format === 'jpeg' ? 'JPG' : format}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
            Resolution Sizing
          </label>
          <div className="flex bg-surface-elevated border border-border/40 rounded-xl p-1 w-full max-w-70">
            {([1, 2, 4] as const).map((quality) => {
              const isActive = state.exportQuality === quality;
              return (
                <button
                  key={quality}
                  type="button"
                  onClick={() => handlers.setExportQuality(quality)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition duration-150 ${
                    isActive
                      ? 'bg-accent text-bg shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {quality}x
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 items-start">
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
            Smart Naming
          </label>
          <input
            type="text"
            value={state.smartNamingInput}
            onChange={(e) => handlers.setSmartNamingInput(e.target.value)}
            placeholder="e.g. Siciliya[1-4], İspan[5-6]"
            className="w-full bg-surface-elevated border border-border/60 hover:border-border rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition duration-150"
          />

          <div className="flex items-center justify-between bg-surface-elevated/40 border border-border/40 rounded-xl p-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-text-primary">
                Chain Sync
              </span>
              <span className="text-[8px] text-text-muted leading-tight">
                {state.isChained
                  ? 'Linked: Updates apply to all positions'
                  : 'Unlinked: Position specific sizes'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handlers.setIsChained(!state.isChained)}
              className={`p-1.5 rounded-lg border transition duration-150 active:scale-[0.98] ${
                state.isChained
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-surface border-border text-text-muted hover:text-text-secondary'
              }`}
              title={
                state.isChained
                  ? 'Linked (Changing size/format applies to all)'
                  : 'Unlinked (Changing applies only to this position)'
              }
            >
              {state.isChained ? (
                <Link className="w-3.5 h-3.5" />
              ) : (
                <Link2Off className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="bg-bg/40 border border-border/40 rounded-xl p-3 space-y-1.5 w-full">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wide block">
            Parsed File Name Output
          </span>
          <div className="max-h-26.25 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {state.parsedNames.map((name, idx) => (
              <div
                key={name + '-' + (state.validFens[idx] || idx)}
                className="flex justify-between items-center text-[9px] font-mono text-text-secondary"
              >
                <span>Pos {idx + 1}:</span>
                <span
                  className={
                    idx === state.safeCurrentIndex
                      ? 'text-accent font-bold'
                      : ''
                  }
                >
                  {name || `Position-${idx + 1}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-border/40">
        <button
          type="button"
          onClick={handlers.handleExportActive}
          className="w-full py-2.5 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-xl font-semibold transition duration-150 text-xs active:scale-[0.98]"
        >
          Download Active Position ({state.safeCurrentIndex + 1})
        </button>
        <button
          type="button"
          onClick={handlers.handleExportBatch}
          className="w-full py-3 bg-accent hover:bg-accent-hover text-bg rounded-xl font-bold transition duration-150 text-xs active:scale-[0.98] shadow-lg shadow-accent/20 flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 fill-current shrink-0" />
          <span>Download All ({state.validFens.length} Positions)</span>
        </button>
      </div>
    </div>
  );
});

WizardExportSettings.displayName = 'WizardExportSettings';
export default WizardExportSettings;
