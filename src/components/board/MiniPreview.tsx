import { memo, useEffect, useRef, useState } from 'react';

import { BOARD_THEMES } from '@constants';

import { getPieceKey, isLightSquare, logger, parseFEN } from '@utils';

interface MiniPreviewProps {
  fen: string;
  lightSquare?: string;
  darkSquare?: string;

  pieceImages: Record<string, HTMLImageElement>;

  piecesLoading?: boolean;
  size?: number;
}
export const MiniPreview = memo(
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
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      try {
        const board = parseFEN(fen);
        if (!board || !Array.isArray(board) || board.length !== 8) {
          throw new Error('Invalid board structure');
        }
        const edge = (i: number) => Math.round((i * cssSize) / 8);
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const x = edge(col);
            const y = edge(row);
            const w = edge(col + 1) - x;
            const h = edge(row + 1) - y;
            ctx.fillStyle = isLightSquare(row, col)
              ? defaultLight
              : defaultDark;
            ctx.fillRect(x, y, w, h);
          }
        }
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const fenChar = board[row]?.[col];
            const pieceKey = getPieceKey(fenChar ?? '');
            if (pieceKey) {
              const img = pieceImages[pieceKey];
              if (img && img.complete && img.naturalWidth > 0) {
                const x = edge(col);
                const y = edge(row);
                const cellW = edge(col + 1) - x;
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
