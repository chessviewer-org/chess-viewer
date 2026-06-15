import { memo, useCallback } from 'react';

import { useDrop } from 'react-dnd';

import { ItemTypes } from '@constants';
import type { PieceSymbol } from '@app-types/chess';

import { pieceToName } from '@utils';
import DraggablePiece from '../DraggablePiece/DraggablePiece';

const FILES = 'abcdefgh';

/** The drag item payload passed between react-dnd sources and targets. */
export interface DragItem {
  piece: PieceSymbol;
  pieceKey?: string;
  fromRow: number;
  fromCol: number;
  isFromPalette: boolean;
}

/** Props for the `DroppableSquare` memo'd drop target cell. */
export interface DroppableSquareProps {
  row: number;
  col: number;
  piece: PieceSymbol | '';
  isLight: boolean;
  lightColor: string;
  darkColor: string;
  pieceImage: HTMLImageElement | null;
  onDrop?: (
    piece: PieceSymbol,
    fromRow: number | undefined,
    fromCol: number | undefined,
    toRow: number,
    toCol: number,
    isFromPalette: boolean
  ) => void;
  /** Select this square (click). Enables keyboard delete of its piece. */
  onSelect?: ((row: number, col: number) => void) | undefined;
  /** Whether this square is the active selection (keyboard target). */
  isSelected?: boolean;
  /** Whether the roving keyboard cursor is currently on this square. */
  isCursor?: boolean;
  /** Whether this square holds the piece that was picked up for keyboard move. */
  isHeldSource?: boolean;
  isLoading: boolean;
}

export const DroppableSquare = memo(
  function DroppableSquare({
    row,
    col,
    piece,
    isLight,
    lightColor,
    darkColor,
    pieceImage,
    onDrop,
    onSelect,
    isSelected = false,
    isCursor = false,
    isHeldSource = false,
    isLoading
  }: DroppableSquareProps) {
    const bgColor = isLight ? lightColor : darkColor;

    const squareName = `${FILES[col] ?? col}${8 - row}`;
    const ariaLabel = piece
      ? `${pieceToName(piece)}, ${squareName}`
      : `${squareName}, empty`;

    const handleSelect = useCallback(() => {
      onSelect?.(row, col);
    }, [onSelect, row, col]);

    const handleDrop = useCallback(
      (item: DragItem) => {
        if (onDrop) {
          onDrop(
            item.piece,
            item.fromRow,
            item.fromCol,
            row,
            col,
            item.isFromPalette
          );
        }
      },
      [onDrop, row, col]
    );

    const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>(
      () => ({
        accept: ItemTypes.PIECE,
        drop: handleDrop,
        canDrop: () => true,
        collect: (monitor) => ({
          isOver: monitor.isOver({
            shallow: true
          })
        })
      }),
      [handleDrop]
    );

    return (
      <div
        ref={(node) => {
          drop(node);
          // Detach the react-dnd connector on unmount so the backend removes its
          // node-bound listeners; without this the cell (and its piece <img>)
          // stays detached-but-referenced via the listener, leaking every time
          // the board unmounts on route change. Connector returns a value; the
          // cleanup must return void, so we don't forward it.
          return () => {
            drop(null);
          };
        }}
        id={`sq-${row}-${col}`}
        onClick={handleSelect}
        role="gridcell"
        aria-label={ariaLabel}
        aria-selected={isSelected || isCursor}
        className="w-full h-full flex items-center justify-center relative cursor-pointer"
        style={{
          backgroundColor: bgColor,
          zIndex: isCursor || isSelected || isHeldSource ? 2 : 0,
          // Ring precedence: pointer drag-over → keyboard cursor → keyboard
          // selection. Click-selection uses a thin neutral (text-primary) ring
          // so it reads as a default highlight rather than the accent yellow.
          // The held-source square keeps a faint accent ring so the user can
          // see where the carried piece came from.
          boxShadow: isOver
            ? 'inset 0 0 0 3px rgba(255, 255, 255, 0.5)'
            : isCursor
              ? 'inset 0 0 0 3px var(--color-accent), inset 0 0 0 5px rgba(0,0,0,0.35)'
              : isSelected
                ? 'inset 0 0 0 2px var(--color-text-primary)'
                : isHeldSource
                  ? 'inset 0 0 0 3px var(--color-accent)'
                  : 'none',
          contain: 'layout style',
          minWidth: 0,
          minHeight: 0
        }}
        data-row={row}
        data-col={col}
      >
        {piece && pieceImage && !isLoading && (
          // `key` on the piece char remounts this wrapper when the piece on the
          // square changes, re-firing the `animate-piece-in` keyframe — the CSS
          // replacement for the former per-square framer-motion AnimatePresence.
          <div
            key={piece}
            className="w-full h-full flex items-center justify-center animate-piece-in"
            style={{
              contain: 'layout style',
              opacity: isHeldSource ? 0.45 : 1
            }}
          >
            <DraggablePiece
              piece={piece}
              pieceImage={pieceImage}
              row={row}
              col={col}
              isFromPalette={false}
              // Fill the (integer-pixel) square edge-to-edge. The Lichess SVGs
              // carry their own internal margin, so 100% looks right AND keeps
              // the image box pixel-aligned — a fractional inset (e.g. 92%)
              // centred the SVG on a sub-pixel offset, which softened it.
              size="100%"
            />
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.piece === nextProps.piece &&
      prevProps.isLight === nextProps.isLight &&
      prevProps.lightColor === nextProps.lightColor &&
      prevProps.darkColor === nextProps.darkColor &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.row === nextProps.row &&
      prevProps.col === nextProps.col &&
      prevProps.onDrop === nextProps.onDrop &&
      prevProps.onSelect === nextProps.onSelect &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isCursor === nextProps.isCursor &&
      prevProps.isHeldSource === nextProps.isHeldSource &&
      prevProps.pieceImage === nextProps.pieceImage
    );
  }
);

DroppableSquare.displayName = 'DroppableSquare';
export default DroppableSquare;
