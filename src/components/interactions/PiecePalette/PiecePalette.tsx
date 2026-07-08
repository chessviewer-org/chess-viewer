import { memo, useCallback } from 'react';

import { PALETTE_PIECES } from '@constants';
import type { PieceSymbol } from '@app-types';
import { getPieceKey } from '@/shared/utils';

import { DraggablePiece } from '../Board/components/DraggablePiece';
import styles from './styles/piece-palette.module.scss';

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
  const renderStackedPiece = useCallback(
    (p: PalettePiece) => {
      const imageKey = getPieceKey(p.piece);
      const pieceImage = imageKey ? (pieceImages[imageKey] ?? null) : null;
      const disabled = isLoading || !pieceImage;
      return (
        <div
          key={p.id}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onKeyboardPick?.(p.piece);
            }
          }}
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
            dragIdPrefix="stk-"
          />
        </div>
      );
    },
    [pieceImages, isLoading, onKeyboardPick]
  );

  const renderFlatPiece = useCallback(
    (p: PalettePiece) => {
      const imageKey = getPieceKey(p.piece);
      const pieceImage = imageKey ? (pieceImages[imageKey] ?? null) : null;
      const disabled = isLoading || !pieceImage;
      return (
        <div
          key={p.id}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onKeyboardPick?.(p.piece);
            }
          }}
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
            dragIdPrefix="flt-"
          />
        </div>
      );
    },
    [pieceImages, isLoading, onKeyboardPick]
  );

  return (
    <div className={`${styles.root} ${className}`}>
      <div className={styles.stacked}>
        <div className={styles.stackedRow}>
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
      </div>

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
