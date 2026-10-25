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
import type { BoardArrow } from '@/engines/core/arrows';
import { BoardBackdrop } from './BoardBackdrop';
import { BoardRank } from './BoardRank';
import { BoardShapes } from './BoardShapes';
import { useBoardDrawing } from '../hooks/useBoardDrawing';
import { hintColor, threatColor } from '@/shared/utils/color/accent';
import styles from '../styles/board.module.scss';
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
  arrows?: readonly BoardArrow[] | undefined;
  destinations?:
    ReadonlyArray<{ to: [number, number]; capture: boolean }> | undefined;
  onPieceRemove?: ((row: number, col: number) => void) | undefined;
  onKeyboardApi?: ((api: BoardKeyboardApi) => void) | undefined;
  onKeyboardInteraction?: (() => void) | undefined;
}

const NO_ARROWS: readonly BoardArrow[] = [];

export const InteractiveBoard = memo(function InteractiveBoard({
  board,
  lightSquare,
  darkSquare,
  pieceImages,
  flipped,
  onPieceDrop,
  onSquareSelect,
  selectedSquare,
  arrows,
  destinations,
  onPieceRemove,
  onKeyboardApi,
  onKeyboardInteraction
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
    ...(onPieceRemove ? { onPieceRemove } : {}),
    ...(onKeyboardInteraction ? { onInteract: onKeyboardInteraction } : {})
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

  const destinationsByRow = useMemo(() => {
    const rows = new Map<number, Map<number, boolean>>();
    for (const { to, capture } of destinations ?? [])
      rows.set(to[0], (rows.get(to[0]) ?? new Map()).set(to[1], capture));
    return rows;
  }, [destinations]);

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
            hatched={squarePattern === 'hatched'}
            pieceImages={pieceImages}
            onSelect={selectSquare}
            selectedCol={
              selectedSquare?.[0] === row ? selectedSquare[1] : undefined
            }
            cursorCol={cursor?.row === row ? cursor.col : undefined}
            heldCol={heldFrom?.row === row ? heldFrom.col : undefined}
            destinations={destinationsByRow.get(row)}
          />
        );
      }),
    [
      board,
      squarePattern,
      flipped,
      pieceImages,
      selectSquare,
      selectedSquare,
      cursor,
      heldFrom,
      destinationsByRow
    ]
  );

  const boardDescription = useMemo(
    () => describeBoardPosition(board, flipped),
    [board, flipped]
  );

  const setRef = useCallback((node: HTMLDivElement | null) => {
    boardRef.current = node;
  }, []);

  const drawing = useBoardDrawing(boardRef, flipped);
  const { shapes, pending, clear } = drawing;
  useEffect(clear, [board, clear]);
  const visibleSquares = useMemo(
    () =>
      squarePattern === 'hatched' ? [lightSquare] : [lightSquare, darkSquare],
    [squarePattern, lightSquare, darkSquare]
  );
  const rootStyle = useMemo(
    () =>
      ({
        '--hint-color': hintColor(...visibleSquares),
        '--threat-color': threatColor(...visibleSquares)
      }) as CSSProperties,
    [visibleSquares]
  );

  return (
    <div className={styles.root} style={rootStyle} {...drawing.handlers}>
      <div
        className={styles.visuallyHidden}
        aria-live="polite"
        aria-atomic="true"
      >
        {boardDescription}
      </div>
      <div
        className={styles.visuallyHidden}
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
      <div
        ref={setRef}
        role="grid"
        tabIndex={0}
        aria-label="Chess board, edit mode. Click a piece, then its destination to move it; click the selected piece again to cancel. Or use arrow keys to move, Enter or Space to pick up and place a piece, Delete to remove, Escape to cancel."
        {...(activeDescendantId
          ? { 'aria-activedescendant': activeDescendantId }
          : {})}
        data-square-pattern={squarePattern}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className={styles.grid}
        style={
          {
            '--board-light': lightSquare
          } as CSSProperties
        }
      >
        <BoardBackdrop
          light={lightSquare}
          dark={darkSquare}
          hatched={squarePattern === 'hatched'}
        />
        {ranks}
      </div>
      <BoardShapes
        arrows={arrows ?? NO_ARROWS}
        shapes={shapes}
        pending={pending}
        flipped={flipped}
      />
    </div>
  );
});

InteractiveBoard.displayName = 'InteractiveBoard';
