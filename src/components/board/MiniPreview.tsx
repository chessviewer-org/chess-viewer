import { memo, useEffect, useRef, useState } from 'react';

import { BOARD_THEMES } from '@constants';

import { logger, parseFEN } from '@utils';

/** Props for the `MiniPreview` canvas thumbnail component. */
interface MiniPreviewProps {
  fen: string;
  lightSquare?: string;
  darkSquare?: string;
  /**
   * Pre-loaded piece images, hoisted to the parent so a grid of previews shares
   * a single `usePieceImages` load instead of one hook instance per card.
   */
  pieceImages: Record<string, HTMLImageElement>;
  /** Whether the parent's piece images are still loading. */
  piecesLoading?: boolean;
  size?: number;
}
const MiniPreview = memo(
  function MiniPreview({
    fen,
    lightSquare,
    darkSquare,
    pieceImages,
    piecesLoading = false,
    size = 160
  }: MiniPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasError, setHasError] = useState(false);
    // Only show the loading state (hidden board + spinner) on the FIRST load,
    // when there are no piece images to draw yet. When the user switches piece
    // sets, the previously rendered board stays on screen until the new images
    // are ready and the canvas redraws — no flicker / blank gap.
    const hasImages = Object.keys(pieceImages).length > 0;
    const isLoading = piecesLoading && !hasImages;

    useEffect(() => {
      if (!canvasRef.current || !fen || Object.keys(pieceImages).length === 0) {
        return;
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', {
        alpha: false,
        desynchronized: true
      });
      if (!ctx) {
        setHasError(true);
        return;
      }

      const style = getComputedStyle(document.documentElement);
      const defaultLight =
        lightSquare ||
        style.getPropertyValue('--color-light-square').trim() ||
        (BOARD_THEMES['classic']?.light ?? '#f0d9b5');
      const defaultDark =
        darkSquare ||
        style.getPropertyValue('--color-dark-square').trim() ||
        (BOARD_THEMES['classic']?.dark ?? '#b58863');

      // Render at the REAL displayed device-pixel size, not a fixed 160×2.
      // The card preview stretches the canvas via `w-full h-full`; sizing the
      // backing store to (CSS px × devicePixelRatio) of the actual box keeps
      // the thumbnail crisp instead of upscaling a small canvas (the blur).
      const cssSize = Math.max(
        size,
        Math.round(canvas.clientWidth || canvas.parentElement?.clientWidth || 0)
      );
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      setHasError(false);
      canvas.width = Math.round(cssSize * dpr);
      canvas.height = Math.round(cssSize * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.scale(dpr, dpr);
      // Piece SVGs are rasterised at a high intrinsic size (256px, see
      // pieceImageCache) and drawn DOWN to cell size here, so high-quality
      // smoothing gives the crispest result; disabling it aliased the
      // downscale into jagged, low-quality pieces.
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      try {
        const board = parseFEN(fen);
        if (!board || !Array.isArray(board) || board.length !== 8) {
          throw new Error('Invalid board structure');
        }
        // Snap every square to integer CSS-pixel edges so adjacent fills share
        // an exact boundary. Using `col * squareSize` with a fractional
        // squareSize leaves sub-pixel gaps that render as thin hairlines
        // ("cuts") inside the board — computing each edge from the rounded next
        // edge eliminates them.
        const edge = (i: number) => Math.round((i * cssSize) / 8);
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const isLight = (row + col) % 2 === 0;
            const x = edge(col);
            const y = edge(row);
            const w = edge(col + 1) - x;
            const h = edge(row + 1) - y;
            ctx.fillStyle = isLight ? defaultLight : defaultDark;
            ctx.fillRect(x, y, w, h);
          }
        }
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const fenChar = board[row]?.[col];
            if (fenChar) {
              const color = fenChar === fenChar.toUpperCase() ? 'w' : 'b';
              const pieceType = fenChar.toUpperCase();
              const pieceKey = color + pieceType;
              const img = pieceImages[pieceKey];
              if (img && img.complete && img.naturalWidth > 0) {
                const x = edge(col);
                const y = edge(row);
                const cellW = edge(col + 1) - x;
                // Snap the piece box to whole DEVICE pixels. With ctx.scale(dpr),
                // a fractional CSS offset lands the SVG between device pixels and
                // the rasteriser blurs it. Rounding to 1/dpr keeps edges crisp.
                const snap = (val: number) => Math.round(val * dpr) / dpr;
                const pieceSize = snap(cellW * 0.9);
                const offset = snap((cellW - pieceSize) / 2);
                ctx.drawImage(
                  img,
                  x + offset,
                  y + offset,
                  pieceSize,
                  pieceSize
                );
              }
            }
          }
        }
      } catch (err: unknown) {
        logger.error('Preview render error:', err);
        setHasError(true);
      }
      return () => {
        canvas.width = 0;
        canvas.height = 0;
      };
    }, [fen, lightSquare, darkSquare, pieceImages, size]);
    return (
      <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          style={{
            imageRendering: 'auto',
            display: 'block',
            borderRadius: '0'
          }}
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/60">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {hasError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-error/10 border border-error/30">
            <div className="text-center px-2">
              <p className="text-[10px] text-error font-medium">Invalid FEN</p>
            </div>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.fen === nextProps.fen &&
      prevProps.lightSquare === nextProps.lightSquare &&
      prevProps.darkSquare === nextProps.darkSquare &&
      prevProps.pieceImages === nextProps.pieceImages &&
      prevProps.piecesLoading === nextProps.piecesLoading &&
      prevProps.size === nextProps.size
    );
  }
);
MiniPreview.displayName = 'MiniPreview';
export default MiniPreview;
