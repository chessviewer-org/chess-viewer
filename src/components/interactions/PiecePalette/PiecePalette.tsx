import { memo, useCallback } from 'react';

import { getPieceImageKey, PALETTE_PIECES } from '@constants';
import type { PieceSymbol } from '@app-types/chess';

import DraggablePiece from '../DraggablePiece/DraggablePiece';

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
const WHITE_PIECES = PALETTE_PIECES.filter(
  (p: PalettePiece) => p.color === 'w'
);
const BLACK_PIECES = PALETTE_PIECES.filter(
  (p: PalettePiece) => p.color === 'b'
);

export const PiecePalette = memo(function PiecePalette({
  pieceImages,
  isLoading,
  className = ''
}: PiecePaletteProps) {
  const renderPiece = useCallback(
    (p: PalettePiece) => {
      const imageKey = getPieceImageKey(p.piece);
      const pieceImage = imageKey ? pieceImages[imageKey] || null : null;

      return (
        <div
          key={p.id}
          className={`
            aspect-square flex-1 min-w-0 rounded-md
            bg-surface-elevated hover:bg-surface-hover
            border border-border/50 hover:border-accent/50
            flex items-center justify-center
            transition-colors duration-200
            ${isLoading ? 'opacity-50' : ''}
          `}
          title={p.name}
        >
          <DraggablePiece
            piece={p.piece}
            pieceImage={pieceImage}
            isFromPalette={true}
            size="90%"
            disabled={isLoading || !pieceImage}
          />
        </div>
      );
    },
    [pieceImages, isLoading]
  );

  const renderGroup = useCallback(
    (pieces: PalettePiece[], label: string) => (
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Refined header — light, spaced, muted (no chunky accent fill). */}
        <span className="block w-full text-sm font-semibold uppercase tracking-wider text-text-muted text-center pb-1.5">
          {label}
        </span>
        {/* Tray: more padding so pieces have room to breathe. */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-3 rounded-lg border border-white/10 bg-black/20">
          {pieces.map(renderPiece)}
        </div>
      </div>
    ),
    [renderPiece]
  );

  return (
    <div className={`flex items-stretch ${className}`}>
      {/* Two distinct labelled trays side by side; no divider line. */}
      <div className="flex items-stretch gap-4 w-full">
        {renderGroup(WHITE_PIECES, 'White')}
        {renderGroup(BLACK_PIECES, 'Black')}
      </div>
    </div>
  );
});

PiecePalette.displayName = 'PiecePalette';

export default PiecePalette;
