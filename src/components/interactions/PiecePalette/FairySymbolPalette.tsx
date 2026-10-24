import { memo } from 'react';

import {
  FAIRY_BOXES,
  FAIRY_ROTATIONS,
  fairyCode,
  type FairyRotation
} from '@constants';
import type { BoardCell } from '@app-types';
import {
  cellName,
  cellToFenPiece,
  isFairyCell,
  parseCellCode
} from '@/shared/utils/boardCells';
import { getPieceKey } from '@/shared/utils/pieceUtils';
import { namedCell, parseNamedCell } from '@/shared/utils/fairyCells';

import { DraggablePiece } from '../Board';
import styles from './styles/fairy-symbol-palette.module.scss';

export interface FairySymbolPaletteProps {
  pieceImages: Record<string, HTMLImageElement | null>;
  rotation: FairyRotation;
  onRotationChange: (rotation: FairyRotation) => void;
  className?: string;
  onKeyboardPick?: ((piece: BoardCell) => void) | undefined;
  selectedPiece?: BoardCell | null | undefined;
  onSelect?: ((piece: BoardCell) => void) | undefined;
  cataloguePiece?: BoardCell | null;
}

const COLORS = [
  { color: 'w', label: 'White' },
  { color: 'b', label: 'Black' },
  { color: 'n', label: 'Neutral' }
] as const;

export const FairySymbolPalette = memo(function FairySymbolPalette({
  pieceImages,
  rotation,
  onRotationChange,
  className = '',
  onKeyboardPick,
  selectedPiece,
  onSelect,
  cataloguePiece
}: FairySymbolPaletteProps) {
  const catalogue = cataloguePiece ? parseNamedCell(cataloguePiece) : null;
  const catalogueGlyph = cataloguePiece ? parseCellCode(cataloguePiece) : null;

  const renderPiece = (piece: BoardCell) => {
    const imageKey = getPieceKey(piece);
    const image = imageKey ? (pieceImages[imageKey] ?? null) : null;
    const disabled = !image;
    const name = cellName(piece);
    return (
      <button
        key={piece}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(piece);
        }}
        onKeyDown={(e) => {
          if (
            !disabled &&
            onKeyboardPick &&
            (e.key === 'Enter' || e.key === ' ')
          ) {
            e.preventDefault();
            e.stopPropagation();
            onKeyboardPick(piece);
          }
        }}
        aria-label={`Place ${name}`}
        aria-pressed={selectedPiece === piece}
        title={name}
        className={`${styles.pieceBtn} ${selectedPiece === piece ? styles.selected : ''}`}
      >
        <DraggablePiece
          piece={piece}
          pieceImage={image}
          isFromPalette
          size="100%"
          disabled={disabled}
        />
      </button>
    );
  };

  return (
    <div className={`${styles.root} ${className}`}>
      <div className={styles.header}>
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <span className="font-semibold">Symbols</span>
          <a
            href="#fairy-catalogue"
            className="hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Catalogue
          </a>
          <a
            href="#fairy-problem"
            className="hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Problem
          </a>
        </div>
        <div className={styles.rotationRow}>
          <div
            className={styles.rotationSwitch}
            role="group"
            aria-label="Piece rotation clockwise"
          >
            {FAIRY_ROTATIONS.map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} degrees clockwise`}
                title={`${value}° clockwise`}
                aria-pressed={rotation === value}
                onClick={(e) => {
                  e.stopPropagation();
                  onRotationChange(value);
                  if (
                    value !== rotation &&
                    selectedPiece &&
                    !parseNamedCell(selectedPiece)
                  ) {
                    const selected = parseCellCode(
                      getPieceKey(selectedPiece) ?? ''
                    );
                    if (selected) {
                      const code = fairyCode(
                        selected.color,
                        selected.type,
                        value
                      );
                      onSelect?.(
                        isFairyCell(code) ? code : cellToFenPiece(code)
                      );
                    }
                  }
                }}
              >
                {value}°
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.stacked}>
        <div className={styles.stackedRow}>
          {COLORS.map(({ color, label }) => (
            <div
              key={color}
              className={`${styles.stackedGroup} ${color === 'n' ? styles.neutralGroup : ''}`}
              role="group"
              aria-label={`${label} pieces`}
            >
              <span className={styles.stackedGroupLabel}>{label}</span>
              <div className={styles.stackedPieceRow}>
                {FAIRY_BOXES.filter((box) => box.color === color).map((box) => {
                  if (catalogue && catalogueGlyph?.type === box.type)
                    return renderPiece(
                      namedCell(box.color, catalogue.walk, catalogue.attributes)
                    );
                  const code = fairyCode(box.color, box.type, rotation);
                  return renderPiece(
                    isFairyCell(code) ? code : cellToFenPiece(code)
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

FairySymbolPalette.displayName = 'FairySymbolPalette';
