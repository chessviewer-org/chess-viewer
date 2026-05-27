import { memo, useCallback } from 'react';

import DraggablePiece from '../DraggablePiece/DraggablePiece';
import { getPieceImageKey, PALETTE_PIECES } from '@constants';
import type { PieceSymbol } from '@app-types/chess';

/** Props for the `PiecePalette` drag source sidebar. */
export interface PiecePaletteProps {
  pieceImages: Record<string, HTMLImageElement | null>;
  isLoading: boolean;
  className?: string;
}

/** Internal structure of a palette piece entry. */
interface PalettePiece {
  id: string;
  piece: PieceSymbol;
  color: 'w' | 'b';
  name: string;
}

/** Sidebar grid of all 12 draggable chess pieces (6 white, 6 black). */
const WHITE_PIECES = PALETTE_PIECES.filter((p: PalettePiece) => p.color === 'w');
const BLACK_PIECES = PALETTE_PIECES.filter((p: PalettePiece) => p.color === 'b');

export const PiecePalette = memo(function PiecePalette({
  pieceImages,
  isLoading,
  className = ''
}: PiecePaletteProps) {

  const renderPieceGroup = useCallback(
    (pieces: PalettePiece[], label: string) => (
      <div className="space-y-2 sm:space-y-2.5">
        <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-center py-2 rounded-md text-white bg-accent border border-accent-hover">
          {label}
        </h3>
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
          {pieces.map((p) => {
            const imageKey = getPieceImageKey(p.piece);
            const pieceImage = imageKey ? pieceImages[imageKey] || null : null;

            return (
              <div
                key={p.id}
                className={`
                  aspect-square rounded-md lg:rounded-lg
                  bg-surface-elevated hover:bg-surface-hover
                  border border-border/50 hover:border-accent/50
                  flex items-center gap-2 justify-center
                  transition-colors duration-200
                  min-h-[3.8rem] sm:min-h-[4.1rem]
                  ${isLoading ? 'opacity-50' : ''}
                `}
                title={p.name}
              >
                <DraggablePiece
                  piece={p.piece}
                  pieceImage={pieceImage}
                  isFromPalette={true}
                  size="72%"
                  disabled={isLoading || !pieceImage}
                />
              </div>
            );
          })}
        </div>
      </div>
    ),
    [pieceImages, isLoading]
  );

  return (
    <div className={`flex flex-col gap-3 sm:gap-3.5 ${className}`}>
      <div className="text-sm font-semibold text-text-primary flex items-center gap-2 px-1">
        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
        <span className="hidden sm:inline">Drag pieces to board</span>
        <span className="sm:hidden">Pieces</span>
      </div>

      <div className="flex flex-col gap-2.5 sm:gap-3 xl:flex-1 xl:justify-around">
        {renderPieceGroup(WHITE_PIECES, 'White')}
        {renderPieceGroup(BLACK_PIECES, 'Black')}
      </div>
    </div>
  );
});

PiecePalette.displayName = 'PiecePalette';

export default PiecePalette;
