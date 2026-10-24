import { memo, useLayoutEffect, useRef, useState } from 'react';

import { BOARD_THEMES } from '@constants';
import { useSquarePatternSetting } from '@/shared/hooks/useSquarePattern';

import {
  drawBoardPiece,
  fillBoardSquare,
  isHatchedSquare
} from '@/shared/utils/boardPattern';
import { boardImagesReady, getPieceKey } from '@/shared/utils/pieceUtils';
import { isLightSquare } from '@chessviewer-org/chess-viewer';
import { logger } from '@/shared/utils/logger';
import { parseFEN } from '@/shared/utils/fenParser';

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
    const [squarePattern] = useSquarePatternSetting();

    useLayoutEffect(() => {
      const canvas = canvasRef.current;
      return () => {
        if (!canvas) return;
        canvas.width = 0;
        canvas.height = 0;
      };
    }, []);

    useLayoutEffect(() => {
      if (!canvasRef.current || !fen || Object.keys(pieceImages).length === 0) {
        return;
      }
      if (piecesLoading && !boardImagesReady(fen, pieceImages)) return;
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

      const cssSize = Math.round(
        canvas.clientWidth || canvas.parentElement?.clientWidth || size
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
        const fill = {
          light: defaultLight,
          dark: defaultDark,
          pattern: squarePattern
        };
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const x = edge(col);
            const y = edge(row);
            const w = edge(col + 1) - x;
            const h = edge(row + 1) - y;
            fillBoardSquare(ctx, x, y, w, h, isLightSquare(row, col), fill);
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
                drawBoardPiece(
                  ctx,
                  img,
                  x + offset,
                  y + offset,
                  pieceSize,
                  isHatchedSquare(isLightSquare(row, col), fill)
                    ? {
                        color: defaultLight,
                        square: { x, y, width: cellW, height: cellW }
                      }
                    : null
                );
              }
            }
          }
        }
      } catch (err: unknown) {
        logger.error('Preview render error:', err);
        setHasError(true);
      }
    }, [
      fen,
      lightSquare,
      darkSquare,
      squarePattern,
      pieceImages,
      piecesLoading,
      size
    ]);
    return (
      <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            imageRendering: 'auto',
            display: 'block',
            borderRadius: '0'
          }}
        />

        {hasError && (
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
