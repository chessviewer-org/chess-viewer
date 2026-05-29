import React, { memo } from 'react';

/** Props for the lightweight canvas-free board renderer used in the batch preview player. */
export interface BoardDisplayProps {
  boardState: string[][];
  isFlipped: boolean;
  showCoordinates: boolean;
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
    <div className="flex flex-col w-full max-w-100">
      <div className="flex w-full">
        {showCoordinates && (
          <div className="flex flex-col shrink-0" style={{ width: '5%' }}>
            {ranks.map((rank) => (
              <div
                key={rank}
                className="flex items-center justify-center text-[min(11px,2.5vw)] font-bold text-text-secondary h-[12.5%]"
              >
                {rank}
              </div>
            ))}
          </div>
        )}
        <div className="flex-1 grid grid-cols-8 grid-rows-8 overflow-hidden shadow-md aspect-square">
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
      </div>
      {showCoordinates && (
        <div className="flex w-full" style={{ paddingLeft: '5%' }}>
          {files.map((file) => (
            <div
              key={file}
              className="flex-1 text-[min(11px,2.5vw)] font-bold text-text-secondary text-center mt-1"
            >
              {file}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

BoardDisplay.displayName = 'BoardDisplay';
export default BoardDisplay;
