import { memo, useLayoutEffect, useRef, useState } from 'react';

import { BOARD_THEMES } from '@constants';
import { useSquarePatternSetting } from '@/shared/hooks/useSquarePattern';

import {
  boardOutlineWidth,
  getDisplayCoordinates,
  getSquareBounds,
  isLightSquare
} from '@chessviewer-org/chess-viewer';
import {
  drawBoardPiece,
  fillBoardSquare,
  isHatchedSquare
} from '@/shared/utils/boardPattern';
import { boardImagesReady, getPieceKey } from '@/shared/utils/pieceUtils';
import { logger } from '@/shared/utils/logger';
import { parseFEN } from '@/shared/utils/fenParser';

// Constants
const DEFAULT_LIGHT = BOARD_THEMES['classic']?.light ?? '#f0d9b5';
const DEFAULT_DARK = BOARD_THEMES['classic']?.dark ?? '#b58863';

const GUTTER_RATIO = 0.05;

// Types
interface BoardPreviewCanvasProps {
  fen: string;
  lightSquare?: string;
  darkSquare?: string;
  pieceImages: Record<string, HTMLImageElement>;
  piecesLoading?: boolean;
  showCoords?: boolean;
  showThinFrame?: boolean;
  flipped?: boolean;
}

const BoardPreviewCanvas = memo(
  function BoardPreviewCanvas({
    fen,
    lightSquare,
    darkSquare,
    pieceImages,
    piecesLoading = false,
    showCoords = false,
    showThinFrame = false,
    flipped = false
  }: BoardPreviewCanvasProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasError, setHasError] = useState(false);
    const [wrapperPx, setWrapperPx] = useState(0);
    const [squarePattern] = useSquarePatternSetting();

    useLayoutEffect(() => {
      const el = wrapperRef.current;
      if (!el) return;
      setWrapperPx(Math.round(el.getBoundingClientRect().width));
      const obs = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect.width;
        if (w) setWrapperPx(Math.round(w));
      });
      obs.observe(el);
      return () => obs.disconnect();
    }, []);

    const gutter = wrapperPx > 0 ? Math.round(wrapperPx * GUTTER_RATIO) : 0;
    const boardPx = Math.max(0, wrapperPx - gutter);
    const outlinePx = boardOutlineWidth(boardPx);

    const hasImages = Object.keys(pieceImages).length > 0;

    useLayoutEffect(() => {
      const canvas = canvasRef.current;
      return () => {
        if (!canvas) return;
        canvas.width = 0;
        canvas.height = 0;
      };
    }, []);

    useLayoutEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || boardPx <= 0 || !fen || !hasImages) return;
      if (piecesLoading && !boardImagesReady(fen, pieceImages)) return;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        setHasError(true);
        return;
      }

      const light = lightSquare ?? DEFAULT_LIGHT;
      const dark = darkSquare ?? DEFAULT_DARK;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);

      canvas.width = Math.round(boardPx * dpr);
      canvas.height = Math.round(boardPx * dpr);
      canvas.style.width = `${boardPx}px`;
      canvas.style.height = `${boardPx}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      setHasError(false);

      try {
        const board = parseFEN(fen);
        if (!board || board.length !== 8) throw new Error('Invalid FEN');

        const sq = boardPx / 8;
        const snap = (v: number) => Math.round(v * dpr) / dpr;
        const fill = { light, dark, pattern: squarePattern };

        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const [dRow, dCol] = getDisplayCoordinates(row, col, flipped);
            const b = getSquareBounds(dRow, dCol, sq, 0, 0);
            fillBoardSquare(
              ctx,
              b.x,
              b.y,
              b.width,
              b.height,
              isLightSquare(row, col),
              fill
            );
          }
        }

        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const fenChar = board[row]?.[col];
            const pieceKey = getPieceKey(fenChar ?? '');
            if (!pieceKey) continue;
            const img = pieceImages[pieceKey];
            if (!img?.complete || !img.naturalWidth) continue;
            const [dRow, dCol] = getDisplayCoordinates(row, col, flipped);
            const b = getSquareBounds(dRow, dCol, sq, 0, 0);
            const pad = snap(sq * 0.04);
            const ps = snap(sq - pad * 2);
            drawBoardPiece(
              ctx,
              img,
              snap(b.centerX - ps / 2),
              snap(b.centerY - ps / 2),
              ps,
              isHatchedSquare(isLightSquare(row, col), fill)
                ? { color: light, square: b }
                : null
            );
          }
        }
      } catch (err: unknown) {
        logger.error('BoardPreviewCanvas render error:', err);
        setHasError(true);
      }
    }, [
      fen,
      lightSquare,
      darkSquare,
      squarePattern,
      pieceImages,
      piecesLoading,
      flipped,
      hasImages,
      boardPx
    ]);

    const ranks = flipped
      ? ['1', '2', '3', '4', '5', '6', '7', '8']
      : ['8', '7', '6', '5', '4', '3', '2', '1'];
    const files = flipped
      ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
      : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    return (
      <div
        ref={wrapperRef}
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '95%',
            height: '95%'
          }}
        >
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="block"
            style={{ boxShadow: `0 0 0 ${outlinePx}px #000` }}
          />
          {showThinFrame && (
            <div
              className="absolute pointer-events-none box-border"
              style={{
                inset: `-${outlinePx + 2}px`,
                border: '2px solid #333',
                zIndex: 10
              }}
            />
          )}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-error/10 border border-error/30">
              <p className="text-[10px] text-error font-medium">Invalid FEN</p>
            </div>
          )}
        </div>

        {showCoords && (
          <div
            className="absolute top-0 left-0 flex flex-col pr-1"
            style={{ width: '5%', height: '95%' }}
            aria-hidden="true"
          >
            {ranks.map((rank) => (
              <div
                key={rank}
                className="flex items-center justify-center text-text-secondary font-bold select-none h-[12.5%]"
                style={{ fontSize: `max(9px, ${boardPx * 0.028}px)` }}
              >
                {rank}
              </div>
            ))}
          </div>
        )}

        {showCoords && (
          <div
            className="absolute bottom-0 right-0 flex pt-1"
            style={{ width: '95%', height: '5%' }}
            aria-hidden="true"
          >
            {files.map((file) => (
              <div
                key={file}
                className="flex-1 flex items-center justify-center text-text-secondary font-bold select-none lowercase"
                style={{ fontSize: `max(9px, ${boardPx * 0.028}px)` }}
              >
                {file}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.fen === next.fen &&
    prev.lightSquare === next.lightSquare &&
    prev.darkSquare === next.darkSquare &&
    prev.pieceImages === next.pieceImages &&
    prev.piecesLoading === next.piecesLoading &&
    prev.showCoords === next.showCoords &&
    prev.showThinFrame === next.showThinFrame &&
    prev.flipped === next.flipped
);

BoardPreviewCanvas.displayName = 'BoardPreviewCanvas';
export default BoardPreviewCanvas;
