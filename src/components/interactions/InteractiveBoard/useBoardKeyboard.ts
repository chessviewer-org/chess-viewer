import { useCallback, useMemo, useRef, useState } from 'react';

import type { PieceSymbol } from '@app-types';

import { pieceToName } from '@utils';

const FILES = 'abcdefgh';

/** A board coordinate in matrix space (`row` 0 = rank 8, `col` 0 = file a). */
interface Cell {
  row: number;
  col: number;
}

/** Algebraic name (e.g. `"e4"`) for a matrix cell. */
function squareName(row: number, col: number): string {
  return `${FILES[col] ?? col}${8 - row}`;
}

/** A picked-up piece travelling with the keyboard cursor. */
interface HeldPiece {
  piece: PieceSymbol;
  /** Origin square, or `null` when the piece came from the palette. */
  from: Cell | null;
}

/** Inputs the board keyboard layer needs from its host. */
export interface UseBoardKeyboardParams {
  board: (PieceSymbol | '')[][];
  /** Display orientation; drives which matrix cell each arrow key targets. */
  flipped: boolean;
  /** Commit a move/placement (same signature as the DnD drop handler). */
  onPieceDrop?: (
    piece: PieceSymbol,
    fromRow: number | undefined,
    fromCol: number | undefined,
    toRow: number,
    toCol: number,
    isFromPalette: boolean
  ) => void;
  /** Remove the piece on a square (Delete/Backspace). */
  onPieceRemove?: ((row: number, col: number) => void) | undefined;
}

/** What the board renders from the keyboard layer. */
export interface UseBoardKeyboardResult {
  /**
   * Matrix cell under the roving focus cursor, or `null` when no keyboard
   * navigation has happened yet. Stays `null` through pointer/programmatic
   * focus so no stray a8 ring is painted — it only becomes a real cell once
   * the user presses an arrow/Enter/Delete key.
   */
  cursor: Cell | null;
  /** Origin square of the carried piece, or `null` when nothing is held. */
  heldFrom: Cell | null;
  /** DOM id of the focused gridcell, or `undefined` when the cursor is hidden. */
  activeDescendantId: string | undefined;
  /** Latest action sentence for the polite live region. */
  announcement: string;
  /** Attach to the grid container's `onKeyDown`. */
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  /** Reset cursor/held state and hide the cursor when focus leaves the board. */
  onBlur: () => void;
  /**
   * Hand a palette piece to the keyboard cursor (a new piece, no origin
   * square). The grid should be focused right after so arrow keys place it.
   */
  pickUpFromPalette: (piece: PieceSymbol) => void;
}

/**
 * Keyboard interaction model for the interactive board — a full drag-and-drop
 * alternative (WCAG 2.1.1 Keyboard, 2.5.1 Pointer Gestures).
 *
 * Arrow keys move a roving focus cursor across the 64 squares; Enter/Space picks
 * up the piece under the cursor, then places it on the next Enter/Space (or onto
 * the cursor square). Escape cancels a pickup; Delete/Backspace removes the
 * piece under the cursor. Every action is announced through a polite live
 * region.
 *
 * The state here is a SINGLE small object (cursor + held piece), never mirrored
 * into the 64 square components — only the one or two cells whose `isCursor` /
 * `isHeldSource` flag changes re-render, so the memo'd-square perf budget holds.
 */
export function useBoardKeyboard({
  board,
  flipped,
  onPieceDrop,
  onPieceRemove
}: UseBoardKeyboardParams): UseBoardKeyboardResult {
  const [cursor, setCursor] = useState<Cell | null>(null);
  const [held, setHeld] = useState<HeldPiece | null>(null);
  const [announcement, setAnnouncement] = useState('');

  // Held piece is read inside the keydown handler without making the callback
  // depend on it (keeps the grid's onKeyDown reference stable across pickups).
  const heldRef = useRef<HeldPiece | null>(null);
  heldRef.current = held;
  const cursorRef = useRef<Cell | null>(cursor);
  cursorRef.current = cursor;

  const announce = useCallback((msg: string) => {
    // Toggle a trailing regular space so identical consecutive messages still
    // change the text node and fire a fresh live-region announcement (e.g.
    // arrowing across two empty squares). A trailing space is inaudible to
    // screen readers, unlike a visible/irregular-whitespace marker.
    setAnnouncement((prev) => (prev.endsWith(' ') ? msg : `${msg} `));
  }, []);

  // One arrow step in DISPLAY space, mapped to matrix space via `flipped`, so
  // ArrowUp always moves toward the top of the board the user sees.
  const moveCursor = useCallback(
    (dRow: number, dCol: number) => {
      setCursor((cur) => {
        // First arrow press just reveals the cursor at the display-top-left
        // square of the current orientation — no movement, no a8 default.
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
      // Drop the carried piece onto the cursor square.
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
    // Hide the cursor ring when focus leaves the grid — the cursor only exists
    // during active keyboard interaction, never at rest. This is what keeps a
    // stray a8 (or post-flip) ring from being painted after a click or a
    // programmatic focus.
    setCursor(null);
    // Drop a board-sourced pickup when focus leaves the grid so the source
    // square's dimmed highlight doesn't linger. A palette-sourced pickup
    // (`from === null`) is preserved across the palette→board focus hop so the
    // carried piece survives until it is placed or Escape cancels it.
    const carried = heldRef.current;
    if (carried && carried.from !== null) setHeld(null);
  }, []);

  const pickUpFromPalette = useCallback(
    (piece: PieceSymbol) => {
      setHeld({ piece, from: null });
      // Reveal the cursor at the display-top-left square so the carried palette
      // piece has a visible landing target the moment the grid gains focus.
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
