import {
  type CSSProperties,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef
} from 'react';

import type { BoardCell } from '@app-types';

import { useSquarePatternSetting } from '@/shared/hooks/useSquarePattern';
import { describeBoardPosition } from '@/shared/utils/boardCells';
import { hatchBackgroundCss } from '@/shared/utils/boardPattern';
import { BoardRank } from './BoardRank';
import { useBoardKeyboard } from '../hooks/useBoardKeyboard';

const BOARD_INDICES = [0, 1, 2, 3, 4, 5, 6, 7] as const;
const EMPTY_RANK: readonly BoardCell[] = Array<BoardCell>(8).fill('');

// Types
export interface BoardKeyboardApi {
  pickUpFromPalette: (piece: BoardCell) => void;
  clearHeld: () => void;
}

interface InteractiveBoardProps {
  board: BoardCell[][];
  lightSquare: string;
  darkSquare: string;
  pieceImages: Record<string, HTMLImageElement | null>;
  flipped: boolean;
  onPieceDrop?: (
    piece: BoardCell,
    fromRow: number | undefined,
    fromCol: number | undefined,
    toRow: number,
    toCol: number,
    isFromPalette: boolean
  ) => void;
  onSquareSelect?: ((row: number, col: number) => void) | undefined;
  selectedSquare?: readonly [number, number] | null | undefined;
  onPieceRemove?: ((row: number, col: number) => void) | undefined;
  onKeyboardApi?: ((api: BoardKeyboardApi) => void) | undefined;
}

export const InteractiveBoard = memo(function InteractiveBoard({
  board,
  lightSquare,
  darkSquare,
  pieceImages,
  flipped,
  onPieceDrop,
  onSquareSelect,
  selectedSquare,
  onPieceRemove,
  onKeyboardApi
}: InteractiveBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const onSquareSelectRef = useRef(onSquareSelect);
  useLayoutEffect(() => {
    onSquareSelectRef.current = onSquareSelect;
  }, [onSquareSelect]);
  const selectSquare = useCallback((row: number, col: number) => {
    onSquareSelectRef.current?.(row, col);
  }, []);
  const [squarePattern] = useSquarePatternSetting();
  const {
    cursor,
    heldFrom,
    activeDescendantId,
    announcement,
    onKeyDown,
    onBlur,
    pickUpFromPalette,
    clearHeld
  } = useBoardKeyboard({
    board,
    flipped,
    ...(onPieceDrop ? { onPieceDrop } : {}),
    ...(onPieceRemove ? { onPieceRemove } : {})
  });

  useEffect(() => {
    if (!onKeyboardApi) return;
    onKeyboardApi({
      pickUpFromPalette: (piece: BoardCell) => {
        pickUpFromPalette(piece);
        boardRef.current?.focus();
      },
      clearHeld
    });
  }, [onKeyboardApi, pickUpFromPalette, clearHeld]);

  const ranks = useMemo(
    () =>
      BOARD_INDICES.map((displayRow) => {
        const row = flipped ? 7 - displayRow : displayRow;
        return (
          <BoardRank
            key={row}
            row={row}
            rank={board[row] ?? EMPTY_RANK}
            flipped={flipped}
            lightSquare={lightSquare}
            darkSquare={darkSquare}
            pieceImages={pieceImages}
            onSelect={selectSquare}
            selectedCol={
              selectedSquare?.[0] === row ? selectedSquare[1] : undefined
            }
            cursorCol={cursor?.row === row ? cursor.col : undefined}
            heldCol={heldFrom?.row === row ? heldFrom.col : undefined}
          />
        );
      }),
    [
      board,
      lightSquare,
      darkSquare,
      flipped,
      pieceImages,
      selectSquare,
      selectedSquare,
      cursor,
      heldFrom
    ]
  );

  const boardDescription = useMemo(
    () => describeBoardPosition(board, flipped),
    [board, flipped]
  );

  const setRef = useCallback((node: HTMLDivElement | null) => {
    boardRef.current = node;
  }, []);

  return (
    <div className="w-full h-full" style={{ contain: 'layout' }}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {boardDescription}
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <div
        ref={setRef}
        role="grid"
        tabIndex={0}
        aria-label="Chess board, edit mode. Use arrow keys to move, Enter or Space to pick up and place a piece, Delete to remove, Escape to cancel."
        {...(activeDescendantId
          ? { 'aria-activedescendant': activeDescendantId }
          : {})}
        data-square-pattern={squarePattern}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className="grid grid-cols-8 grid-rows-8 overflow-hidden w-full h-full"
        style={
          {
            gap: 0,
            zIndex: 1,
            borderRadius: 0,
            contain: 'layout style paint',
            fontSize: 0,
            lineHeight: 0,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            '--board-light': lightSquare,
            '--board-hatch': hatchBackgroundCss(lightSquare)
          } as CSSProperties
        }
      >
        {ranks}
      </div>
    </div>
  );
});

InteractiveBoard.displayName = 'InteractiveBoard';
