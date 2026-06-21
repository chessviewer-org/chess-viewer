import { memo, useCallback } from 'react';

import { getPieceImageKey, PALETTE_PIECES } from '@constants';
import type { PieceSymbol } from '@app-types/chess';

import styles from '../../../scss/piece-palette.module.scss';
import DraggablePiece from '../DraggablePiece/DraggablePiece';

export interface PiecePaletteProps {
  pieceImages: Record<string, HTMLImageElement | null>;
  isLoading: boolean;
  className?: string;
  onKeyboardPick?: ((piece: PieceSymbol) => void) | undefined;
}

interface PalettePiece {
  id: string;
  piece: PieceSymbol;
  color: 'w' | 'b';
  name: string;
}

const WHITE_PIECES = PALETTE_PIECES.filter(
  (p: PalettePiece) => p.color === 'w'
);
const BLACK_PIECES = PALETTE_PIECES.filter(
  (p: PalettePiece) => p.color === 'b'
);

export const PiecePalette = memo(function PiecePalette({
  pieceImages,
  isLoading,
  className = '',
  onKeyboardPick
}: PiecePaletteProps) {
  // Stacked view (yan-yana layout, ≥564px) — bordered piece buttons
  const renderStackedPiece = useCallback(
    (p: PalettePiece) => {
      const imageKey = getPieceImageKey(p.piece);
      const pieceImage = imageKey ? (pieceImages[imageKey] ?? null) : null;
      const disabled = isLoading || !pieceImage;
      return (
        <button
          key={p.id}
          type="button"
          disabled={disabled}
          onClick={() => onKeyboardPick?.(p.piece)}
          aria-label={`Place ${p.name}`}
          title={p.name}
          className={`${styles.stackedPieceBtn} ${isLoading ? 'opacity-50' : ''}`}
        >
          <DraggablePiece
            piece={p.piece}
            pieceImage={pieceImage}
            isFromPalette
            size="100%"
            disabled={disabled}
          />
        </button>
      );
    },
    [pieceImages, isLoading, onKeyboardPick]
  );

  // Flat view (tək sütun, <564px) — borderless, geniş touch target
  const renderFlatPiece = useCallback(
    (p: PalettePiece) => {
      const imageKey = getPieceImageKey(p.piece);
      const pieceImage = imageKey ? (pieceImages[imageKey] ?? null) : null;
      const disabled = isLoading || !pieceImage;
      return (
        <button
          key={p.id}
          type="button"
          disabled={disabled}
          onClick={() => onKeyboardPick?.(p.piece)}
          aria-label={`Place ${p.name}`}
          title={p.name}
          className={`${styles.flatPieceBtn} ${isLoading ? 'opacity-50' : ''}`}
        >
          <DraggablePiece
            piece={p.piece}
            pieceImage={pieceImage}
            isFromPalette
            size="100%"
            disabled={disabled}
          />
        </button>
      );
    },
    [pieceImages, isLoading, onKeyboardPick]
  );

  return (
    <div className={`${styles.root} ${className}`}>
      {/* Yan-yana layout (≥564px): White sıra + Black sıra */}
      <div className={styles.stacked}>
        <div className={styles.stackedGroup}>
          <span className={styles.stackedGroupLabel}>White</span>
          <div className={styles.stackedPieceRow}>
            {WHITE_PIECES.map(renderStackedPiece)}
          </div>
        </div>
        <div className={styles.stackedGroup}>
          <span className={styles.stackedGroupLabel}>Black</span>
          <div className={styles.stackedPieceRow}>
            {BLACK_PIECES.map(renderStackedPiece)}
          </div>
        </div>
      </div>

      {/* Tək sütun (<564px): board altında iki horizontal sıra */}
      <div className={styles.flat}>
        <div className={styles.flatGroup}>
          {WHITE_PIECES.map(renderFlatPiece)}
        </div>
        <div className={styles.flatSep} />
        <div className={styles.flatGroup}>
          {BLACK_PIECES.map(renderFlatPiece)}
        </div>
      </div>
    </div>
  );
});

PiecePalette.displayName = 'PiecePalette';

export default PiecePalette;
