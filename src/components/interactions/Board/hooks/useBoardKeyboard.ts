import { useCallback, useMemo, useRef, useState } from 'react';

import type { PieceSymbol } from '@app-types';

import { pieceToName } from '@/shared/utils';

const FILES = 'abcdefgh';

interface Cell {
  row: number;
  col: number;
}

function squareName(row: number, col: number): string {
  return `${FILES[col] ?? col}${8 - row}`;
}

interface HeldPiece {
  piece: PieceSymbol;
  from: Cell | null;
}

export interface UseBoardKeyboardParams {
  board: (PieceSymbol | '')[][];
  flipped: boolean;
  onPieceDrop?: (
    piece: PieceSymbol,
    fromRow: number | undefined,
    fromCol: number | undefined,
    toRow: number,
    toCol: number,
    isFromPalette: boolean
  ) => void;
  onPieceRemove?: ((row: number, col: number) => void) | undefined;
}

export interface UseBoardKeyboardResult {
  cursor: Cell | null;
  heldFrom: Cell | null;
  activeDescendantId: string | undefined;
  announcement: string;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onBlur: () => void;
  pickUpFromPalette: (piece: PieceSymbol) => void;
}

export function useBoardKeyboard({
  board,
  flipped,
  onPieceDrop,
  onPieceRemove
}: UseBoardKeyboardParams): UseBoardKeyboardResult {
  const [cursor, setCursor] = useState<Cell | null>(null);
  const [held, setHeld] = useState<HeldPiece | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const heldRef = useRef<HeldPiece | null>(null);
  heldRef.current = held;
  const cursorRef = useRef<Cell | null>(cursor);
  cursorRef.current = cursor;

  const announce = useCallback((msg: string) => {
    setAnnouncement((prev) => (prev.endsWith(' ') ? msg : `${msg} `));
  }, []);

  const moveCursor = useCallback(
    (dRow: number, dCol: number) => {
      setCursor((cur) => {
        if (cur === null) {
          const row = flipped ? 7 : 0;
          const col = flipped ? 7 : 0;
          const piece = board[row]?.[col] || '';
          const name = piece ? `${pieceToName(piece)}, ` : '';
          announce(`${name}${squareName(row, col)}`);
          return { row, col };
        }
        const dispRow = flipped ? 7 - cur.row : cur.row;
        const dispCol = flipped ? 7 - cur.col : cur.col;
        const nextDispRow = Math.min(7, Math.max(0, dispRow + dRow));
        const nextDispCol = Math.min(7, Math.max(0, dispCol + dCol));
        const row = flipped ? 7 - nextDispRow : nextDispRow;
        const col = flipped ? 7 - nextDispCol : nextDispCol;
        if (row === cur.row && col === cur.col) return cur;
        const piece = board[row]?.[col] || '';
        const name = piece ? `${pieceToName(piece)}, ` : '';
        announce(`${name}${squareName(row, col)}`);
        return { row, col };
      });
    },
    [flipped, board, announce]
  );

  const activate = useCallback(() => {
    const cur = cursorRef.current;
    if (cur === null) return;
    const carried = heldRef.current;
    if (carried) {
      onPieceDrop?.(
        carried.piece,
        carried.from?.row,
        carried.from?.col,
        cur.row,
        cur.col,
        carried.from === null
      );
      setHeld(null);
      announce(
        `${pieceToName(carried.piece)} placed on ${squareName(cur.row, cur.col)}`
      );
      return;
    }
    const piece = board[cur.row]?.[cur.col] || '';
    if (!piece) {
      announce(`${squareName(cur.row, cur.col)} is empty, nothing to pick up`);
      return;
    }
    setHeld({ piece, from: { row: cur.row, col: cur.col } });
    announce(
      `${pieceToName(piece)} picked up from ${squareName(cur.row, cur.col)}. Move with arrow keys, press Enter to place, Escape to cancel.`
    );
  }, [board, onPieceDrop, announce]);

  const cancel = useCallback(() => {
    if (heldRef.current) {
      announce('Cancelled');
      setHeld(null);
    }
  }, [announce]);

  const removeAtCursor = useCallback(() => {
    const cur = cursorRef.current;
    if (cur === null) return;
    const piece = board[cur.row]?.[cur.col] || '';
    if (!piece) return;
    onPieceRemove?.(cur.row, cur.col);
    announce(
      `${pieceToName(piece)} removed from ${squareName(cur.row, cur.col)}`
    );
  }, [board, onPieceRemove, announce]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveCursor(-1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveCursor(1, 0);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveCursor(0, -1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveCursor(0, 1);
          break;
        case 'Enter':
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          activate();
          break;
        case 'Escape':
          if (heldRef.current) {
            e.preventDefault();
            e.stopPropagation();
            cancel();
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          removeAtCursor();
          break;
        default:
          break;
      }
    },
    [moveCursor, activate, cancel, removeAtCursor]
  );

  const onBlur = useCallback(() => {
    setCursor(null);
    const carried = heldRef.current;
    if (carried && carried.from !== null) setHeld(null);
  }, []);

  const pickUpFromPalette = useCallback(
    (piece: PieceSymbol) => {
      setHeld({ piece, from: null });
      setCursor((cur) => cur ?? { row: flipped ? 7 : 0, col: flipped ? 7 : 0 });
      announce(
        `${pieceToName(piece)} selected. Move to a square with arrow keys, press Enter to place, Escape to cancel.`
      );
    },
    [announce, flipped]
  );

  const activeDescendantId = cursor
    ? `sq-${cursor.row}-${cursor.col}`
    : undefined;
  const heldFrom = held?.from ?? null;

  return useMemo(
    () => ({
      cursor,
      heldFrom,
      activeDescendantId,
      announcement,
      onKeyDown,
      onBlur,
      pickUpFromPalette
    }),
    [
      cursor,
      heldFrom,
      activeDescendantId,
      announcement,
      onKeyDown,
      onBlur,
      pickUpFromPalette
    ]
  );
}
