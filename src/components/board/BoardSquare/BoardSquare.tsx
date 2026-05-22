import { memo } from 'react';
import { PieceSymbol } from '@/shared/types';

const PIECE_NAMES: Record<string, string> = {
  K: 'White King',
  Q: 'White Queen',
  R: 'White Rook',
  B: 'White Bishop',
  N: 'White Knight',
  P: 'White Pawn',
  k: 'Black King',
  q: 'Black Queen',
  r: 'Black Rook',
  b: 'Black Bishop',
  n: 'Black Knight',
  p: 'Black Pawn'
};

export interface BoardSquareProps {
  piece: PieceSymbol;
  isLight: boolean;
  lightSquare: string;
  darkSquare: string;
  pieceImages: Record<string, HTMLImageElement>;
  isLoading: boolean;
  row: number;
  col: number;
}

function arePropsEqual(prevProps: BoardSquareProps, nextProps: BoardSquareProps) {
  return (
    prevProps.piece === nextProps.piece &&
    prevProps.isLight === nextProps.isLight &&
    prevProps.lightSquare === nextProps.lightSquare &&
    prevProps.darkSquare === nextProps.darkSquare &&
    prevProps.pieceImages === nextProps.pieceImages &&
    prevProps.isLoading === nextProps.isLoading
  );
}
/**
 * @param {BoardSquareProps} props
 * @returns {JSX.Element}
 */
const BoardSquare = memo(function BoardSquare(props: BoardSquareProps) {
  const { isLight, lightSquare, darkSquare, piece, pieceImages, isLoading } =
    props;
  const backgroundColor = isLight ? lightSquare : darkSquare;
  const color = piece && piece === piece.toUpperCase() ? 'w' : 'b';
  const pieceKey = piece ? color + piece.toUpperCase() : '';
  const pieceImage = piece ? pieceImages[pieceKey] : null;
  return (
    <div
      className="w-full h-full flex items-center justify-center relative"
      style={{
        backgroundColor,
        minWidth: 0,
        minHeight: 0
      }}
    >
      {piece && pieceImage && !isLoading && (
        <img
          src={pieceImage.src}
          alt={PIECE_NAMES[piece as keyof typeof PIECE_NAMES] ?? (piece as string)}
          className="w-[85%] h-[85%] object-contain pointer-events-none"
          style={{ imageRendering: 'auto' }}
          draggable="false"
        />
      )}
    </div>
  );
}, arePropsEqual);
BoardSquare.displayName = 'BoardSquare';
export default BoardSquare;
