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
          opacity: 0.95,
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
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
