import { memo, useMemo } from 'react';

import { Layout } from 'lucide-react';

import ChessBoard from '@/components/board/ChessBoard/ChessBoard';

import type { HomeStateForExport } from './ExportStudio.types';

/** Props for the sticky live-preview panel rendered alongside the wizard steps. */
interface ExportStudioPreviewProps {
  homeState: HomeStateForExport;
  activeBoardSize: number;
}

/** Clamps value between min and max inclusive. */
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPreviewBoardSize(sizeSm: number) {
  const clamped = clamp(sizeSm, 4, 16);
  const ratio = (clamped - 4) / 12;
  return Math.round(260 + ratio * 320);
}

function getCoordinateBorder(boardSize: number, showCoords: boolean) {
  if (!showCoords) return 0;
  return Math.round(Math.max(18, Math.min(800, boardSize * 0.05))) * 2;
}

const ExportStudioPreview = memo(function ExportStudioPreview({
  homeState,
  activeBoardSize
}: ExportStudioPreviewProps) {
  const previewBoardSize = useMemo(
    () => getPreviewBoardSize(activeBoardSize),
    [activeBoardSize]
  );
  const previewFrameSize = useMemo(
    () =>
      previewBoardSize +
      getCoordinateBorder(previewBoardSize, homeState.showCoords),
    [homeState.showCoords, previewBoardSize]
  );

  return (
    <div className="hidden md:flex min-h-0 self-start md:sticky md:top-0 h-[calc(100dvh-5rem-1px)] lg:h-[calc(100dvh-6rem-1px)] w-full bg-surface-muted/40 p-4 sm:p-6 lg:p-8 items-center justify-center overflow-hidden">
      <div className="w-full h-full flex items-center justify-center">
        <div
          className="relative transition-all duration-300 ease-out"
          style={{
            width: `min(${previewFrameSize}px, 100%)`,
            height: `min(${previewFrameSize}px, 100%)`,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          <div className="absolute -top-6 left-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted/60">
            <Layout className="w-3 h-3" />
            Live Preview
          </div>
          <ChessBoard
            fen={homeState.fen}
            pieceStyle={homeState.pieceStyle}
            showCoords={homeState.showCoords}
            lightSquare={homeState.lightSquare}
            darkSquare={homeState.darkSquare}
            boardSize={previewBoardSize}
            flipped={homeState.flipped}
          />
        </div>
      </div>
    </div>
  );
});

export default ExportStudioPreview;
