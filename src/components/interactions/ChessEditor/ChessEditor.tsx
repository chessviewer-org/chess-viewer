import { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Copy, RotateCcw, Settings, X } from 'lucide-react';

import ThemeMainView from '@/components/features/ColorPicker/views/ThemeMainView';
import CustomDragLayer from '../CustomDragLayer/CustomDragLayer';
import InteractiveBoard from '../InteractiveBoard/InteractiveBoard';
import PiecePalette from '../PiecePalette/PiecePalette';
import TrashZone from '../TrashZone/TrashZone';
import { useInteractiveBoard, usePieceImages, useTheme } from '@hooks';

/**
 * Calculates the optimal board size based on the available container width.
 * This ensures the board remains responsive even in split-pane or embedded layouts.
 */
function calculateBoardSize(containerWidth: number, showCoords: boolean) {
  if (containerWidth <= 0) return 320;

  // ResizeObserver contentRect already excludes padding — no extra subtraction.
  // Account for the coordinate gutter so board+gutter never exceeds container.
  const widthFactor = showCoords ? 1.0625 : 1;

  let raw: number;
  if (containerWidth < 640) {
    raw = Math.min(containerWidth / widthFactor, 400);
  } else if (containerWidth < 1024) {
    raw = Math.min((containerWidth * 0.9) / widthFactor, 480);
  } else {
    raw = Math.min((containerWidth * 0.8) / widthFactor, 520);
  }

  // Snap to the nearest multiple of 8 so every grid cell is exactly an integer
  // number of pixels — eliminates sub-pixel gap lines between squares.
  return Math.floor(raw / 8) * 8;
}

const getGutterSize = (boardSize: number) => Math.round(boardSize / 16);

export interface ChessEditorProps {
  fen: string;
  onFenChange: (fen: string) => void;
  pieceStyle: string;
  showCoords: boolean;
  lightSquare: string;
  darkSquare: string;
  flipped: boolean;
  onPieceImagesChange?: (images: Record<string, HTMLImageElement>) => void;
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
  const { pieceImages, isLoading } = usePieceImages(pieceStyle);
  const [boardSize, setBoardSize] = useState(400);
  const [gutterSize, setGutterSize] = useState(() => getGutterSize(400));
  const cellSize = useMemo(() => boardSize / 8, [boardSize]);
  
  const [isVisualSettingsOpen, setIsVisualSettingsOpen] = useState(false);
  const { applyCustomTheme } = useTheme();

  const containerRef = useRef<HTMLDivElement>(null);

  const pieceImagesRef = useRef(pieceImages);
  useEffect(() => {
    pieceImagesRef.current = pieceImages;
  }, [pieceImages]);

  // Use ResizeObserver to adapt to parent container changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          const newSize = calculateBoardSize(width, showCoords);
          setBoardSize(newSize);
          setGutterSize(getGutterSize(newSize));
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [showCoords]);

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
        className="flex flex-col shrink-0"
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
      ref={containerRef}
      className={`flex flex-col gap-4 sm:gap-6 w-full min-w-0 overflow-x-hidden ${className}`}
    >
      <CustomDragLayer pieceImages={pieceImages} boardSize={boardSize} />

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-center lg:items-stretch w-full min-h-0">
        {/* Board Container */}
        <div className="shrink-0 flex justify-center w-full lg:w-auto max-w-full min-w-0">
          <div
            className="relative flex flex-col items-center justify-center min-w-0"
            style={{
              width: showCoords ? boardSize + gutterSize : boardSize,
              maxWidth: '100%'
            }}
          >
            <div className="flex justify-between items-center mb-2 w-full">
              <button
                type="button"
                onClick={() => setIsVisualSettingsOpen((prev) => !prev)}
                className={`p-1.5 rounded-lg transition-colors duration-200 ${isVisualSettingsOpen ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
                title="Visual Settings"
                aria-label="Toggle Visual Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(fen)}
                className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors duration-200"
                title="Copy FEN"
                aria-label="Copy FEN to clipboard"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <div className="flex max-w-full">
              {showCoords && renderRankCoordinates()}
              <div
                style={{
                  width: boardSize,
                  height: boardSize,
                  flexShrink: 0,
                  maxWidth: '100%',
                  position: 'relative'
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
                className="absolute flex flex-col items-center justify-center bg-surface z-30"
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
                  <div className="text-text-primary text-sm font-semibold animate-pulse text-center px-4 wrap-break-word">
                    Loading pieces...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tools and Actions Container */}
        <div className="flex flex-col gap-4 sm:gap-6 flex-1 w-full lg:w-auto min-w-0 lg:self-stretch">
          <div className="flex-1 w-full overflow-hidden rounded-xl border border-border/40 bg-surface-elevated min-h-50 sm:min-h-60 relative">
            <AnimatePresence mode="wait" initial={false}>
              {isVisualSettingsOpen ? (
                <motion.div
                  key="theme-view"
                  className="w-full h-full"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ThemeMainView
                    currentLight={lightSquare}
                    currentDark={darkSquare}
                    onThemeApply={(l: string, d: string) => applyCustomTheme(l, d)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="palette-view"
                  className="w-full h-full"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                >
                  <PiecePalette
                    pieceImages={pieceImages}
                    isLoading={isLoading}
                    className="w-full h-full p-2 sm:p-4"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
            <div className="flex flex-row gap-2 sm:gap-3 flex-1 w-full min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  resetBoard();
                }}
                className="
                    flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-11
                    text-base sm:text-sm font-semibold text-bg
                    bg-accent hover:bg-accent-hover
                    border border-accent/20
                    rounded-lg transition duration-200 ease-out shadow-sm
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
                    flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-11
                    text-base sm:text-sm font-semibold text-text-secondary
                    bg-surface-elevated hover:bg-surface-hover
                    border border-border hover:border-error/40
                    rounded-lg transition duration-200 ease-out shadow-sm
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

            <div className="shrink-0 w-full sm:w-auto h-12 sm:h-auto min-h-11">
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
