import React, { memo } from 'react';

/** Props for the lightweight canvas-free board renderer used in the batch preview player. */
interface BoardDisplayProps {
  boardState: string[][];
  isFlipped: boolean;
  showCoordinates: boolean;
  showThinFrame?: boolean;
  pieceImages: Record<string, { src: string }>;
  isBoardReady: boolean;
  lightSquare: string;
  darkSquare: string;
}

/** CSS-grid board that renders a BoardMatrix with optional coordinate labels and piece images. */
const BoardDisplay = memo(function BoardDisplay({
  boardState,
  isFlipped,
  showCoordinates,
  showThinFrame = false,
  pieceImages,
  isBoardReady,
  lightSquare,
  darkSquare
}: BoardDisplayProps): React.JSX.Element {
  if (!isBoardReady) {
    return (
      <div className="flex items-center justify-center bg-surface-elevated rounded-lg w-full max-w-100 aspect-square">
        <div className="text-text-muted text-sm">Loading...</div>
      </div>
    );
  }
  const ranks = isFlipped
    ? ['1', '2', '3', '4', '5', '6', '7', '8']
    : ['8', '7', '6', '5', '4', '3', '2', '1'];
  const files = isFlipped
    ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
    : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  return (
    <div className="relative w-full max-w-100 aspect-square">
      {/* 
        The board grid always occupies the top 95% and right 95% of the container. 
        This leaves a permanent 5% gutter on the left for ranks and 5% gutter on the bottom for files,
        preventing the board from resizing when coordinates are toggled.
      */}
      <div
        className="absolute top-0 right-0 grid grid-cols-8 grid-rows-8 overflow-hidden shadow-md"
        style={{ width: '95%', height: '95%' }}
      >
        {Array.from({ length: 64 }).map((_, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          const actualRow = isFlipped ? 7 - row : row;
          const actualCol = isFlipped ? 7 - col : col;
          const isLight = (row + col) % 2 === 0;
          const piece = boardState[actualRow]?.[actualCol] || '';
          const color = piece === piece.toUpperCase() ? 'w' : 'b';
          const pieceKey = piece ? color + piece.toUpperCase() : null;
          return (
            <div
              key={`sq-${row}-${col}`}
              className="relative flex items-center justify-center"
              style={{
                backgroundColor: isLight ? lightSquare : darkSquare,
                minWidth: 0,
                minHeight: 0
              }}
            >
              {pieceKey && pieceImages[pieceKey] && (
                <img
                  src={pieceImages[pieceKey].src}
                  alt={piece}
                  className="w-[85%] h-[85%] object-contain"
                  draggable="false"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Thin Frame Border */}
      {showThinFrame && (
        <div
          className="absolute top-0 right-0 pointer-events-none"
          style={{
            width: '95%',
            height: '95%',
            outline: `2px solid ${darkSquare}`,
            opacity: 0.9
          }}
        />
      )}

      {showCoordinates && (
        <>
          <div
            className="absolute top-0 left-0 flex flex-col pr-1"
            style={{ width: '5%', height: '95%' }}
          >
            {ranks.map((rank) => (
              <div
                key={rank}
                className="flex items-center justify-center text-[min(14px,3.5vw)] font-bold text-text-secondary h-[12.5%]"
              >
                {rank}
              </div>
            ))}
          </div>
          <div
            className="absolute bottom-0 right-0 flex pt-1"
            style={{ width: '95%', height: '5%' }}
          >
            {files.map((file) => (
              <div
                key={file}
                className="flex-1 flex items-center justify-center text-[min(14px,3.5vw)] font-bold text-text-secondary"
              >
                {file}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

BoardDisplay.displayName = 'BoardDisplay';
export default BoardDisplay;
