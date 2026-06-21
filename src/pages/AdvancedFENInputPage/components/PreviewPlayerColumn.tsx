import { memo } from 'react';

import { DisplayOptions } from '@/components/features';
import { ADVANCED_FEN_CONFIG } from '@constants';

import type { useAdvancedFEN } from '../hooks/useAdvancedFEN';
import BoardDisplay from './BoardDisplay';
import PlaybackControls from './PlaybackControls';

const { INTERVAL_OPTIONS } = ADVANCED_FEN_CONFIG;

type AdvancedFENReturn = ReturnType<typeof useAdvancedFEN>;

interface PreviewPlayerColumnProps {
  state: AdvancedFENReturn['state'];
  handlers: AdvancedFENReturn['handlers'];
}

/** Sticky column: live board display, playback controls, and display options. */
const PreviewPlayerColumn = memo(function PreviewPlayerColumn({
  state,
  handlers
}: PreviewPlayerColumnProps) {
  return (
    <div className="w-full flex flex-col items-center animate-fadeIn gap-6 max-w-125 lg:max-w-150 mx-auto">
      <BoardDisplay
        boardState={state.boardState}
        isFlipped={state.isFlipped}
        showCoordinates={state.showCoordsLocal}
        showThinFrame={state.showThinFrame}
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

      <div className="w-full mt-6">
        <DisplayOptions
          showCoords={state.showCoordsLocal}
          setShowCoords={handlers.setShowCoordsLocal}
          showThinFrame={state.showThinFrame}
          setShowThinFrame={handlers.setShowThinFrame}
          applyToAll={state.isChained}
          setApplyToAll={handlers.setIsChained}
          hideLabel={true}
        />
      </div>
    </div>
  );
});

PreviewPlayerColumn.displayName = 'PreviewPlayerColumn';
export default PreviewPlayerColumn;
