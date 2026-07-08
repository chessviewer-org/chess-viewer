import { memo, type ReactNode, useMemo } from 'react';

import { DisplayOptions } from '@/components/features';
import BoardPreviewCanvas from '@/pages/ExportPage/components/BoardPreviewCanvas';
import { ADVANCED_FEN_CONFIG } from '@constants';

import styles from '../styles/advanced-fen-layout.module.scss';
import type { ExportFormat, useAdvancedFEN } from '../hooks/useAdvancedFEN';
import PlaybackControls from './PlaybackControls';

const { INTERVAL_OPTIONS } = ADVANCED_FEN_CONFIG;

const FORMAT_LABEL: Record<ExportFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  svg: 'svg'
};

const FORMAT_ORDER: ExportFormat[] = ['jpeg', 'png', 'svg'];

function formatFormats(formats: ExportFormat[]): string {
  const labels = FORMAT_ORDER.filter((f) => formats.includes(f)).map(
    (f) => FORMAT_LABEL[f]
  );
  if (labels.length === 0) return '—';
  if (labels.length === 1) return labels[0] as string;
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

function SummaryBadge({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="px-2 py-1 rounded border border-border/40 bg-surface-elevated text-[10px] font-bold text-text-secondary flex items-center gap-1.5 shadow-sm">
      <span className="uppercase tracking-wider opacity-60">{label}</span>
      {children}
    </div>
  );
}

type AdvancedFENReturn = ReturnType<typeof useAdvancedFEN>;

interface InteractiveBoardColumnProps {
  state: AdvancedFENReturn['state'];
  handlers: AdvancedFENReturn['handlers'];
}

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

  return (
    <div
      className={`w-full flex flex-col gap-3 animate-fadeIn mx-auto transition-all duration-300 ${styles['boardWidth']}`}
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
          <SummaryBadge label="Size">
            <span className="text-accent">{summaryParts.size}</span>
          </SummaryBadge>
          <SummaryBadge label="Quality">
            <span className="text-accent">{summaryParts.quality}</span>
          </SummaryBadge>
          <SummaryBadge label="Format">
            <span className="text-accent uppercase tracking-wider">
              {summaryParts.formats}
            </span>
          </SummaryBadge>
          <SummaryBadge label="Name">
            <span className="text-text-primary font-mono lowercase">
              {summaryParts.name}
            </span>
          </SummaryBadge>
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
