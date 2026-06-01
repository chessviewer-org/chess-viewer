import { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';

import { RotateCcw, X } from 'lucide-react';

import {
  CustomDragLayer,
  InteractiveBoard,
  PiecePalette,
  TrashZone
} from '@/components/interactions';
import { useInteractiveBoard, usePieceImages } from '@/hooks';

const BASE_BOARD_SIZE = 400;

function getBoardSize() {
  if (typeof window === 'undefined') return BASE_BOARD_SIZE;
  const padding = 32; // Total horizontal padding
  const availableWidth = window.innerWidth - padding;

  if (window.innerWidth < 768) {
    return Math.min(availableWidth, 400);
  }
  if (window.innerWidth < 1024) {
    return Math.min(360, window.innerWidth * 0.55);
  }
  if (window.innerWidth < 1280) {
    return Math.min(400, window.innerWidth * 0.45);
  }
  return Math.min(400, window.innerWidth * 0.35);
}

function getGutterSize(boardSize: number) {
  return Math.round(boardSize / 16);
}

interface ChessEditorProps {
  fen: string;
  onFenChange: (fen: string) => void;
  pieceStyle: string;
  showCoords: boolean;
  lightSquare: string;
  darkSquare: string;
  flipped: boolean;
  onPieceImagesChange?: (
    images: Record<string, HTMLImageElement | null>
  ) => void;
  className?: string;
}

export const ChessEditor = memo(function ChessEditor({
  fen,
  onFenChange,
  pieceStyle,
  showCoords,
  lightSquare,
  darkSquare,
  flipped,
  onPieceImagesChange,
  className = ''
}: ChessEditorProps) {
  const { pieceImages, isLoading, loadProgress } = usePieceImages(pieceStyle);
  const [boardSize, setBoardSize] = useState(() => getBoardSize());
  const [gutterSize, setGutterSize] = useState(() => getGutterSize(boardSize));
  const cellSize = useMemo(() => boardSize / 8, [boardSize]);

  const pieceImagesRef = useRef(pieceImages);
  useEffect(() => {
    pieceImagesRef.current = pieceImages;
  }, [pieceImages]);

  useEffect(() => {
    const handleResize = () => {
      const newSize = getBoardSize();
      setBoardSize(newSize);
      setGutterSize(getGutterSize(newSize));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    board,
    handlePieceDrop,
    handlePieceRemove,
    clearBoard,
    resetBoard,
    syncFromFen
  } = useInteractiveBoard(fen, onFenChange);

  useEffect(() => {
    syncFromFen(fen);
  }, [fen, syncFromFen]);

  useEffect(() => {
    onPieceImagesChange?.(pieceImages);
  }, [pieceImages, onPieceImagesChange]);

  const handleTrashDrop = useCallback(
    (row: number, col: number) => {
      handlePieceRemove(row, col);
    },
    [handlePieceRemove]
  );

  const renderFileCoordinates = () => {
    const files = flipped
      ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
      : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    return (
      <div className="flex mt-1" style={{ paddingLeft: `${gutterSize}px` }}>
        {files.map((file) => (
          <div
            key={file}
            className="text-[11px] font-semibold text-text-secondary text-center select-none"
            style={{ width: `${cellSize}px` }}
          >
            {file}
          </div>
        ))}
      </div>
    );
  };

  const renderRankCoordinates = () => {
    const ranks = flipped
      ? ['1', '2', '3', '4', '5', '6', '7', '8']
      : ['8', '7', '6', '5', '4', '3', '2', '1'];

    return (
      <div
        className="flex flex-col flex-shrink-0"
        style={{ width: `${gutterSize}px` }}
      >
        {ranks.map((rank) => (
          <div
            key={rank}
            className="flex items-center justify-center text-[11px] font-bold text-text-secondary select-none"
            style={{ height: `${cellSize}px` }}
          >
            {rank}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col gap-6 w-full max-w-[100vw] overflow-x-hidden ${className}`}
    >
      <CustomDragLayer pieceImages={pieceImages} boardSize={boardSize} />

      <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start w-full min-h-0 flex-1">
        {/* Board Container */}
        <div className="flex-shrink-0 flex justify-center w-full lg:w-auto max-w-full overflow-hidden">
          <div
            className="relative flex flex-col items-center justify-center max-w-full"
            style={{
              width: showCoords ? boardSize + gutterSize : boardSize
            }}
          >
            <div className="flex max-w-full">
              {showCoords && renderRankCoordinates()}
              <div
                style={{
                  width: boardSize,
                  height: boardSize,
                  flexShrink: 0,
                  maxWidth: '100%'
                }}
              >
                <InteractiveBoard
                  board={board}
                  lightSquare={lightSquare}
                  darkSquare={darkSquare}
                  pieceImages={pieceImages}
                  isLoading={isLoading}
                  flipped={flipped}
                  onPieceDrop={handlePieceDrop}
                />
              </div>
            </div>

            {showCoords && renderFileCoordinates()}

            {isLoading && (
              <div
                className="absolute flex flex-col items-center justify-center bg-surface/90 backdrop-blur-sm z-50 animate-fadeInScale"
                style={{
                  top: 0,
                  left: showCoords ? gutterSize : 0,
                  width: boardSize,
                  height: boardSize
                }}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-border"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
                  </div>
                  <div className="text-text-primary text-sm font-semibold animate-pulse text-center px-4 break-words">
                    Loading pieces {loadProgress}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tools and Actions Container */}
        <div className="flex flex-col gap-6 flex-1 w-full lg:w-auto min-w-0">
          <div className="flex-1 w-full max-w-full overflow-hidden rounded-xl border border-border/40 bg-surface/30">
            <PiecePalette
              pieceImages={pieceImages}
              isLoading={isLoading}
              className="w-full h-full p-2 sm:p-4"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 w-full">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  resetBoard();
                }}
                className="
                    flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[44px]
                    text-base sm:text-sm font-semibold text-bg
                    bg-accent hover:bg-accent-hover
                    border border-accent/20
                    rounded-lg transition-colors duration-200 shadow-sm
                    hover:shadow-md hover:shadow-accent/25
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg
                    active:scale-[0.98]
                  "
                title="Reset to starting position"
                aria-label="Reset to starting position"
              >
                <RotateCcw className="w-5 h-5 sm:w-4 sm:h-4" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  clearBoard();
                }}
                className="
                    flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[44px]
                    text-base sm:text-sm font-semibold text-text-secondary
                    bg-surface-elevated hover:bg-surface-hover
                    border border-border hover:border-error/40
                    rounded-lg transition-colors duration-200 shadow-sm
                    hover:text-error
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 focus-visible:ring-offset-bg
                    active:scale-[0.98]
                  "
                title="Clear all pieces"
                aria-label="Clear all pieces"
              >
                <X className="w-5 h-5 sm:w-4 sm:h-4" />
                <span>Clear</span>
              </button>
            </div>

            <div className="flex-shrink-0 w-full sm:w-auto h-16 sm:h-auto min-h-[44px]">
              <TrashZone
                onDrop={handleTrashDrop}
                className="h-full w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ChessEditor.displayName = 'ChessEditor';

export default ChessEditor;
