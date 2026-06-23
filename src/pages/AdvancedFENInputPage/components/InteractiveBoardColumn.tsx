import { memo, useMemo } from 'react';

import { DisplayOptions } from '@/components/features';
import BoardPreviewCanvas from '@/pages/ExportPage/components/BoardPreviewCanvas';
import { ADVANCED_FEN_CONFIG } from '@constants';

import type { useAdvancedFEN } from '../hooks/useAdvancedFEN';
import type { ExportFormat } from '../hooks/useAdvancedFEN/useAdvancedFEN.types';
import PlaybackControls from './PlaybackControls';

const { INTERVAL_OPTIONS } = ADVANCED_FEN_CONFIG;

const FORMAT_LABEL: Record<ExportFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  svg: 'svg'
};

const FORMAT_ORDER: ExportFormat[] = ['jpeg', 'png', 'svg'];

/** Joins formats as "jpg", "jpg and png", or "jpg, png and svg". */
function formatFormats(formats: ExportFormat[]): string {
  const labels = FORMAT_ORDER.filter((f) => formats.includes(f)).map(
    (f) => FORMAT_LABEL[f]
  );
  if (labels.length === 0) return '—';
  if (labels.length === 1) return labels[0] as string;
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

type AdvancedFENReturn = ReturnType<typeof useAdvancedFEN>;

interface InteractiveBoardColumnProps {
  state: AdvancedFENReturn['state'];
  handlers: AdvancedFENReturn['handlers'];
}

/**
 * Left column for the preview/export tabs: a read-only board preview whose
 * appearance is driven entirely by the Board Style tab (theme, piece set,
 * coordinates, frame, flip), the playback controls, and — because the board
 * cannot be resized here — a one-line summary of the active position's export
 * settings (size / quality / formats / file name) that updates as the user
 * steps through positions.
 */
const InteractiveBoardColumn = memo(function InteractiveBoardColumn({
  state,
  handlers
}: InteractiveBoardColumnProps) {
  const summaryParts = useMemo(() => {
    const sizeInput =
      state.boardSizePreset === 'custom'
        ? state.customBoardSizeInput
        : String(state.boardSizePreset);
    const size = `${sizeInput || '—'}cm`;
    const quality = `${state.exportQuality}x`;
    const formats = formatFormats(state.selectedFormats);
    const name =
      state.parsedNames[state.safeCurrentIndex] ||
      `Position-${state.safeCurrentIndex + 1}`;
    return { size, quality, formats, name };
  }, [
    state.boardSizePreset,
    state.customBoardSizeInput,
    state.exportQuality,
    state.selectedFormats,
    state.parsedNames,
    state.safeCurrentIndex
  ]);

  // The user requested a single, slightly larger size across all tabs (no jumping)
  const widthClasses = 'max-w-[440px] lg:max-w-[500px]';

  return (
    <div
      className={`w-full flex flex-col gap-3 animate-fadeIn mx-auto transition-all duration-300 ${widthClasses}`}
    >
      <BoardPreviewCanvas
        fen={state.currentFen}
        lightSquare={state.theme.lightSquare}
        darkSquare={state.theme.darkSquare}
        pieceImages={state.pieceImages}
        piecesLoading={!state.isBoardReady}
        showCoords={state.showCoordsLocal}
        showThinFrame={state.showThinFrame}
        flipped={state.isFlipped}
      />

      {state.activeTab === 'export-settings' && (
        <div className="flex items-center justify-center gap-2 flex-wrap select-none mt-1 ml-[9%] w-[91%]">
          <div className="px-2 py-1 rounded border border-border/40 bg-surface-elevated text-[10px] font-bold text-text-secondary flex items-center gap-1.5 shadow-sm">
            <span className="uppercase tracking-wider opacity-60">Size</span>
            <span className="text-accent">{summaryParts.size}</span>
          </div>
          <div className="px-2 py-1 rounded border border-border/40 bg-surface-elevated text-[10px] font-bold text-text-secondary flex items-center gap-1.5 shadow-sm">
            <span className="uppercase tracking-wider opacity-60">Quality</span>
            <span className="text-accent">{summaryParts.quality}</span>
          </div>
          <div className="px-2 py-1 rounded border border-border/40 bg-surface-elevated text-[10px] font-bold text-text-secondary flex items-center gap-1.5 shadow-sm">
            <span className="uppercase tracking-wider opacity-60">Format</span>
            <span className="text-accent uppercase tracking-wider">
              {summaryParts.formats}
            </span>
          </div>
          <div className="px-2 py-1 rounded border border-border/40 bg-surface-elevated text-[10px] font-bold text-text-secondary flex items-center gap-1.5 shadow-sm">
            <span className="uppercase tracking-wider opacity-60">Name</span>
            <span className="text-text-primary font-mono lowercase">
              {summaryParts.name}
            </span>
          </div>
        </div>
      )}

      {state.validFens.length > 1 && (
        <div className="ml-[9%] w-[91%]">
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
        </div>
      )}

      {state.activeTab === 'preview-style' && (
        <div className="mt-1 ml-[9%] w-[91%]">
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
      )}
    </div>
  );
});

InteractiveBoardColumn.displayName = 'InteractiveBoardColumn';
export default InteractiveBoardColumn;
