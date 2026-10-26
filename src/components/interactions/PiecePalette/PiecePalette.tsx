import { memo, useCallback, type CSSProperties, type ReactNode } from 'react';

import { PALETTE_PIECES } from '@constants';
import type { BoardCell } from '@app-types';
import { getPieceKey } from '@/shared/utils/pieceUtils';

import { DraggablePiece } from '../Board';
import styles from './styles/piece-palette.module.scss';

// Types
export interface PaletteEntry {
  piece: BoardCell;
  name: string;
}

export interface PaletteGroup {
  label: string;
  entries: readonly PaletteEntry[];
  columns?: number;
  trail?: ReactNode;
}

export interface PiecePaletteProps {
  pieceImages: Record<string, HTMLImageElement | null>;
  groups?: readonly PaletteGroup[];
  className?: string;
  adaptive?: boolean;
  fit?: boolean;
  pairedGroups?: boolean;
  onKeyboardPick?: ((piece: BoardCell) => void) | undefined;
  selectedPiece?: BoardCell | null | undefined;
  onSelect?: ((piece: BoardCell) => void) | undefined;
}

// Constants
const STANDARD_GROUPS: readonly PaletteGroup[] = [
  { label: 'White', color: 'w' },
  { label: 'Black', color: 'b' }
].map(({ label, color }) => ({
  label,
  entries: PALETTE_PIECES.filter((p) => p.color === color)
}));

export const PiecePalette = memo(function PiecePalette({
  pieceImages,
  groups = STANDARD_GROUPS,
  className = '',
  adaptive = false,
  fit = false,
  pairedGroups = false,
  onKeyboardPick,
  selectedPiece,
  onSelect
}: PiecePaletteProps) {
  const renderStackedPiece = useCallback(
    (p: PaletteEntry) => {
      const imageKey = getPieceKey(p.piece);
      const pieceImage = imageKey ? (pieceImages[imageKey] ?? null) : null;
      const disabled = !pieceImage;
      const isSelected = selectedPiece === p.piece;
      return (
        <button
          key={p.piece}
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

  const rows = groups.flatMap((_, index) =>
    index % 2 ? [] : [groups.slice(index, index + 2)]
  );

  return (
    <div
      className={`${styles.root} ${adaptive ? styles.adaptive : ''} ${fit ? styles.fit : ''} ${pairedGroups ? styles.pairedGroups : ''} ${className}`}
    >
      <div className={styles.stacked}>
        {rows.map((row) => (
          <div key={row[0]?.label} className={styles.stackedRow}>
            {row.map(({ label, entries, columns = 6, trail }) => (
              <div
                key={label}
                role="group"
                aria-label={label}
                className={styles.stackedGroup}
                style={{ '--cols': columns } as CSSProperties}
              >
                <span className={styles.stackedGroupLabel}>{label}</span>
                <div className={styles.stackedPieceRow}>
                  {entries.map(renderStackedPiece)}
                  {trail}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

PiecePalette.displayName = 'PiecePalette';
