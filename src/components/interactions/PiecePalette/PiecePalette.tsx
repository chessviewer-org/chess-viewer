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
            aspect-square flex-1 min-w-11 rounded-md overflow-hidden
            bg-surface-elevated hover:bg-surface-hover
            border border-border/50 hover:border-border
            grid place-items-center p-0.5
            transition-colors duration-200
            ${isLoading ? 'opacity-50' : ''}
          `}
          title={p.name}
        >
          <DraggablePiece
            piece={p.piece}
            pieceImage={pieceImage}
            isFromPalette={true}
            size="100%"
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
        {/* Section label — neutral tone; accent is reserved for active/CTA states. */}
        <span className="block w-full text-fluid-sm font-semibold uppercase tracking-wider text-text-secondary text-center pb-1.5">
          {label}
        </span>
        {/* Tray: `items-stretch` lets each square cell drive the row height so
            no piece cell is clipped at the bottom. Gutter/padding are fluid
            (gap-fluid-xs) so the tray tightens on phones and opens up on wide. */}
        <div className="flex items-stretch gap-fluid-xs p-fluid-xs rounded-lg border border-white/10 bg-black/20">
          {pieces.map(renderPiece)}
        </div>
      </div>
    ),
    [renderPiece]
  );

  return (
    <div className={`flex items-stretch ${className}`}>
      {/* Two labelled trays. They stack on the narrowest phones so each tray
          gets the full content width (keeping every piece cell ≥44px), and sit
          side by side from xs up. No divider line. */}
      <div className="flex flex-col xs:flex-row items-stretch gap-3 xs:gap-2 sm:gap-4 w-full">
        {renderGroup(WHITE_PIECES, 'White')}
        {renderGroup(BLACK_PIECES, 'Black')}
      </div>
    </div>
  );
});

PiecePalette.displayName = 'PiecePalette';

export default PiecePalette;
