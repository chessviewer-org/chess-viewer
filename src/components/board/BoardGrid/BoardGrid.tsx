import { memo } from 'react';
import { ChessBoard } from '@/shared/types';
import BoardSquare from '../BoardSquare';

export interface BoardGridProps {
  board: ChessBoard;
  lightSquare: string;
  darkSquare: string;
  pieceImages: Record<string, HTMLImageElement>;
  isLoading: boolean;
  flipped?: boolean;
}

function arePropsEqual(prev: BoardGridProps, next: BoardGridProps) {
  if (prev.isLoading !== next.isLoading) return false;
  if (prev.lightSquare !== next.lightSquare) return false;
  if (prev.darkSquare !== next.darkSquare) return false;
  if (prev.flipped !== next.flipped) return false;
  if (prev.pieceImages !== next.pieceImages) return false;
  if (prev.board === next.board) return true;
  const pb = prev.board,
    nb = next.board;
  if (!pb || !nb || pb.length !== nb.length) return false;
  for (let r = 0; r < 8; r++) {
    const prevRow = pb[r];
    const nextRow = nb[r];
    if (!prevRow || !nextRow) return false;
    for (let c = 0; c < 8; c++) {
      if (prevRow[c] !== nextRow[c]) return false;
    }
  }
  return true;
}

/**
 * @param {BoardGridProps} props
 * @returns {JSX.Element}
 */
const BoardGrid = memo(function BoardGrid(props: BoardGridProps) {
  const { board, lightSquare, darkSquare, pieceImages, isLoading } = props;
  return (
    <div className="grid grid-cols-8" style={{ gap: 0, fontSize: 0, lineHeight: 0 }}>
      {Array.from({
        length: 64
      }).map((_, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const isLight = (row + col) % 2 === 0;
        const piece = board[row]?.[col] || '';
        return (
          <BoardSquare
            key={`square-${row}-${col}`}
            piece={piece}
            isLight={isLight}
            lightSquare={lightSquare}
            darkSquare={darkSquare}
            pieceImages={pieceImages}
            isLoading={isLoading}
            row={row}
            col={col}
          />
        );
      })}
    </div>
  );
}, arePropsEqual);

BoardGrid.displayName = 'BoardGrid';

export default BoardGrid;
