import { memo } from 'react';

export const DragGhost = memo(function DragGhost({
  pieceKey,
  pieceImages,
  cellSize
}: {
  pieceKey?: string;
  pieceImages: Record<string, HTMLImageElement | null>;
  cellSize: number;
}) {
  const src = pieceKey ? pieceImages[pieceKey]?.src : undefined;
  if (!pieceKey || !src) return null;

  // The ghost is always exactly one board square (`cellSize`). Both the board
  // piece (100% of a cell) and the palette piece render at this size, so the
  // dragged image never grows or shrinks relative to its origin. Reading the
  // dragged element's own rect would mis-size it: palette/board cells differ
  // and a DragOverlay rendered to <body> can't resolve a `%` size against the
  // square. A fixed pixel cell size is the only source that stays correct.

  return (
    <div
      aria-hidden="true"
      style={{ width: cellSize, height: cellSize, willChange: 'transform' }}
    >
      <img
        src={src}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: 0.92,
          filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.55))',
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          imageRendering: 'auto'
        }}
        draggable={false}
      />
    </div>
  );
});

DragGhost.displayName = 'DragGhost';
