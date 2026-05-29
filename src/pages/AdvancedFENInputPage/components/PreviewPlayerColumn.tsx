import { memo } from 'react';

import { Copy, Download, FlipVertical2 } from 'lucide-react';

import { ADVANCED_FEN_CONFIG } from '@constants';

import { logger } from '@utils';
import type { useAdvancedFEN } from '../hooks/useAdvancedFEN';
import BoardDisplay from './BoardDisplay';
import PlaybackControls from './PlaybackControls';

const { INTERVAL_OPTIONS } = ADVANCED_FEN_CONFIG;

type AdvancedFENReturn = ReturnType<typeof useAdvancedFEN>;

/** Props for the sticky board preview and playback column in the Preview/Export tab. */
interface PreviewPlayerColumnProps {
  state: AdvancedFENReturn['state'];
  handlers: AdvancedFENReturn['handlers'];
}

/** Sticky column containing the live board display, playback controls, and single/batch download buttons. */
const PreviewPlayerColumn = memo(function PreviewPlayerColumn({
  state,
  handlers
}: PreviewPlayerColumnProps) {
  return (
    <div className="lg:col-span-6 w-full flex flex-col items-center lg:sticky lg:top-8 animate-fadeIn">
      <div className="w-full bg-surface border border-border/40 rounded-2xl p-5 sm:p-6 flex flex-col items-center shadow-sm">
        <BoardDisplay
          boardState={state.boardState}
          isFlipped={state.isFlipped}
          showCoordinates={state.showCoordinates}
          pieceImages={state.pieceImages}
          isBoardReady={state.isBoardReady}
          lightSquare={state.theme.lightSquare}
          darkSquare={state.theme.darkSquare}
        />

        <PlaybackControls
          isPlaying={state.isPlaying}
          interval={state.intervalTime}
          showIntervalMenu={state.showIntervalMenu}
          intervalOptions={INTERVAL_OPTIONS.map((opt) => opt.value)}
          currentIndex={state.safeCurrentIndex}
          totalCount={state.validFens.length}
          onTogglePlay={handlers.handleTogglePlay}
          onSetInterval={handlers.handleSetIntervalTime}
          onToggleIntervalMenu={handlers.handleToggleIntervalMenu}
          onPrevious={handlers.handlePrevious}
          onNext={handlers.handleNext}
        />

        <div className="grid grid-cols-3 gap-3 w-full mt-6 border-t border-border/40 pt-4">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(state.currentFen);
              } catch (err) {
                logger.error('Copy failed:', err);
              }
            }}
            className="px-2 py-2.5 bg-surface-elevated hover:bg-surface-hover border border-border/60 text-text-primary rounded-xl font-semibold transition duration-150 text-[10px] sm:text-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <Copy className="w-3.5 h-3.5 text-text-secondary" />
            <span>Copy FEN</span>
          </button>

          <button
            type="button"
            onClick={handlers.handleFlipBoard}
            className="px-2 py-2.5 bg-surface-elevated hover:bg-surface-hover border border-border/60 text-text-primary rounded-xl font-semibold transition duration-150 text-[10px] sm:text-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <FlipVertical2 className="w-3.5 h-3.5 text-text-secondary" />
            <span>Flip Board</span>
          </button>

          <button
            type="button"
            onClick={() => handlers.setWizardStep(2)}
            className="px-2 py-2.5 bg-accent hover:bg-accent-hover text-bg rounded-xl font-bold transition duration-150 text-[10px] sm:text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
});

PreviewPlayerColumn.displayName = 'PreviewPlayerColumn';
export default PreviewPlayerColumn;
