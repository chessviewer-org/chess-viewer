import { memo } from 'react';

import {
  compositionNotes,
  compositionPieces,
  type CaptionPiece
} from '@utils/compositionCaption';
import { getPieceKey } from '@/shared/utils/pieceUtils';

interface CompositionLegendProps {
  fen: string;
  pieceImages?: Record<string, HTMLImageElement>;
}

export const CompositionLegend = memo(function CompositionLegend({
  fen,
  pieceImages
}: CompositionLegendProps) {
  let notes: string[] = [];
  let pieces: CaptionPiece[] = [];
  try {
    notes = [...new Set(compositionNotes(fen))];
    pieces = compositionPieces(fen);
  } catch {
    return null;
  }
  if (!notes.length && !pieces.length) return null;
  return (
    <div
      aria-label="Fairy problem details"
      className="w-full space-y-2 border-t border-border/50 pt-3 text-xs text-text-secondary"
    >
      {notes.length > 0 && (
        <p className="break-words text-text-primary">{notes.join(' · ')}</p>
      )}
      {pieces.length > 0 && (
        <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {pieces.map(({ label, squares, cell }) => {
            const key = getPieceKey(cell);
            const image = key ? pieceImages?.[key] : undefined;
            return (
              <li key={label} className="flex min-w-0 items-center gap-2">
                {image && (
                  <img
                    src={image.src}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6 shrink-0 rounded-sm bg-white p-0.5 ring-1 ring-black/10"
                  />
                )}
                <span className="min-w-0 break-words">
                  {label}{' '}
                  <span className="font-mono text-text-primary">
                    {squares.join(', ')}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
