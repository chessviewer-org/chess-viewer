import { memo, useCallback } from 'react';

import { PALETTE_PIECES } from '@constants';
import type { BoardCell } from '@app-types';
import { getPieceKey } from '@/shared/utils/pieceUtils';

import { DraggablePiece } from '../Board';
import styles from './styles/piece-palette.module.scss';

// Types
export interface PiecePaletteProps {
  pieceImages: Record<string, HTMLImageElement | null>;
  className?: string;
  onKeyboardPick?: ((piece: BoardCell) => void) | undefined;
  selectedPiece?: BoardCell | null | undefined;
  onSelect?: ((piece: BoardCell) => void) | undefined;
}

interface PalettePiece {
  id: string;
  piece: BoardCell;
  color: 'w' | 'b';
  name: string;
}

// Constants
const WHITE_PIECES = PALETTE_PIECES.filter(
  (p: PalettePiece) => p.color === 'w'
);
const BLACK_PIECES = PALETTE_PIECES.filter(
  (p: PalettePiece) => p.color === 'b'
);

export const PiecePalette = memo(function PiecePalette({
  pieceImages,
  className = '',
  onKeyboardPick,
  selectedPiece,
  onSelect
}: PiecePaletteProps) {
  const renderStackedPiece = useCallback(
    (p: PalettePiece) => {
      const imageKey = getPieceKey(p.piece);
      const pieceImage = imageKey ? (pieceImages[imageKey] ?? null) : null;
      const disabled = !pieceImage;
      const isSelected = selectedPiece === p.piece;
      return (
        <button
          key={p.id}
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(p.piece);
          }}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onKeyboardPick?.(p.piece);
            }
          }}
          aria-label={`Place ${p.name}`}
          aria-pressed={isSelected}
          title={p.name}
          className={`${styles.stackedPieceBtn} ${isSelected ? styles.selected : ''}`}
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
    [pieceImages, onKeyboardPick, selectedPiece, onSelect]
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
    </div>
  );
});

PiecePalette.displayName = 'PiecePalette';
