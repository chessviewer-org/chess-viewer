import { memo, useEffect, useRef, useState } from 'react';

import { usePieceImages } from '@hooks';
import { logger, parseFEN } from '@utils';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
export interface MiniPreviewProps {
  fen: string;
  lightSquare?: string;
  darkSquare?: string;
  pieceStyle?: string;
  size?: number;
}
const MiniPreview = memo(
  function MiniPreview({
    fen,
    lightSquare,
    darkSquare,
    pieceStyle = 'cburnett',
    size = 160
  }: MiniPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasError, setHasError] = useState(false);
    const { pieceImages, isLoading, error } = usePieceImages(pieceStyle);

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

      // Default to theme-aware colors if not provided
      const style = getComputedStyle(document.documentElement);
      const defaultLight = lightSquare || style.getPropertyValue('--color-light-square').trim() || '#f0d9b5';
      const defaultDark = darkSquare || style.getPropertyValue('--color-dark-square').trim() || '#b58863';

      const squareSize = size / 8;
      const scale = 2;
      setHasError(false);
      canvas.width = size * scale;
      canvas.height = size * scale;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.scale(scale, scale);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      try {
        const board = parseFEN(fen);
        if (!board || !Array.isArray(board) || board.length !== 8) {
          throw new Error('Invalid board structure');
        }
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const isLight = (row + col) % 2 === 0;
            const x = col * squareSize;
            const y = row * squareSize;
            ctx.fillStyle = isLight ? defaultLight : defaultDark;
            ctx.fillRect(x, y, squareSize, squareSize);
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
                const x = col * squareSize;
                const y = row * squareSize;
                const pieceSize = squareSize * 0.9;
                const offset = (squareSize - pieceSize) / 2;
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
      } catch (err) {
        logger.error('Preview render error:', err);
        setHasError(true);
      }
      return () => {
        canvas.width = 0;
        canvas.height = 0;
      };
    }, [fen, lightSquare, darkSquare, pieceImages, size]);
    return (
      <div
        className="relative w-full h-full"
        style={{
          aspectRatio: '1 / 1'
        }}
      >
        <canvas
          ref={canvasRef}
          className={`w-full h-full transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
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

        {(hasError || error) && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-error/10 border border-error/30">
            <div className="text-center px-2">
              <p className="text-[10px] text-error font-medium">
                {error || 'Invalid FEN'}
              </p>
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
      prevProps.pieceStyle === nextProps.pieceStyle &&
      prevProps.size === nextProps.size
    );
  }
);
MiniPreview.displayName = 'MiniPreview';
export default MiniPreview;
