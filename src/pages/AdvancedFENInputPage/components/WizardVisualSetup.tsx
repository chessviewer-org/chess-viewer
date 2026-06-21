import { memo } from 'react';

import { Check, Maximize2 } from 'lucide-react';

import { BOARD_THEMES, PIECE_SETS } from '@/shared/constants/chessConstants';

import type { useAdvancedFEN } from '../hooks/useAdvancedFEN';

type AdvancedFENReturn = ReturnType<typeof useAdvancedFEN>;

/** Props for the visual configuration wizard panel (theme, piece style, coord options). */
interface WizardVisualSetupProps {
  state: AdvancedFENReturn['state'];
  handlers: AdvancedFENReturn['handlers'];
}

/** Wizard step 1: theme preset picker, piece style toggle strip, and display option checkboxes. */
const WizardVisualSetup = memo(function WizardVisualSetup({
  state,
  handlers
}: WizardVisualSetupProps) {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Theme
          </label>
          <span className="text-[10px] text-text-muted">
            Click circles to select preset themes
          </span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 pb-2 pt-1 max-h-35 overflow-y-auto pr-1 scrollbar-thin">
          {Object.entries(BOARD_THEMES).map(([key, theme]) => {
            const isActive =
              state.theme.lightSquare === theme.light &&
              state.theme.darkSquare === theme.dark;
            return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  handlers.handleApplyPresetTheme(theme.light, theme.dark)
                }
                className="group relative flex flex-col items-center gap-1 focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-md"
                title={theme.name}
              >
                <div
                  className={`w-10 h-10 rounded-full border-2 transition duration-200 overflow-hidden flex relative ${
                    isActive
                      ? 'border-accent scale-105 shadow-md shadow-accent/20'
                      : 'border-border/60 group-hover:border-text-secondary'
                  }`}
                >
                  <div
                    className="w-1/2 h-full"
                    style={{ backgroundColor: theme.light }}
                  />
                  <div
                    className="w-1/2 h-full"
                    style={{ backgroundColor: theme.dark }}
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-accent drop-shadow" />
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-11">
                  {theme.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
          Piece Style
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin max-w-full">
          {PIECE_SETS.map((piece) => {
            const isActive = state.pieceStyle === piece.id;
            return (
              <button
                key={piece.id}
                type="button"
                onClick={() => handlers.setPieceStyle(piece.id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-accent/10 border-accent text-accent shadow-sm'
                    : 'bg-surface-elevated hover:bg-surface-hover border-border/60 text-text-secondary hover:text-text-primary'
                }`}
              >
                {piece.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={state.showCoordsLocal}
            onChange={(e) => handlers.setShowCoordsLocal(e.target.checked)}
            className="w-4 h-4 rounded border-border text-accent bg-surface"
          />
          <span className="text-xs font-medium text-text-secondary">
            Show Coordinates
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={state.showCoordinateBorder}
            onChange={(e) => handlers.setShowCoordinateBorder(e.target.checked)}
            className="w-4 h-4 rounded border-border text-accent bg-surface"
          />
          <span className="text-xs font-medium text-text-secondary">
            Coordinate Border
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={state.showThinFrame}
            onChange={(e) => handlers.setShowThinFrame(e.target.checked)}
            className="w-4 h-4 rounded border-border text-accent bg-surface"
          />
          <span className="text-xs font-medium text-text-secondary">
            Thin Outer Frame
          </span>
        </label>
      </div>

      <div className="pt-4 border-t border-border/40 flex justify-end">
        <button
          type="button"
          onClick={handlers.handleApplyToAll}
          className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border/60 text-text-secondary hover:text-text-primary rounded-xl font-bold transition duration-150 text-xs flex items-center gap-1.5 active:scale-[0.98]"
          title="Globally sync the current visual configuration to all positions in the queue"
        >
          <Maximize2 className="w-3.5 h-3.5 text-text-muted" />
          <span>Apply Style to All Positions</span>
        </button>
      </div>
    </div>
  );
});

WizardVisualSetup.displayName = 'WizardVisualSetup';
export default WizardVisualSetup;
