import { memo, useEffect, useRef, useState } from 'react';

import {
  FileCoordinates,
  RankCoordinates
} from '@/components/interactions/ChessEditor/EditorCoordinates';
import { BOARD_THEMES } from '@constants';

import {
  getDisplayCoordinates,
  getSquareBounds,
  isLightSquare,
  logger,
  parseFEN
} from '@utils';

const DEFAULT_LIGHT = BOARD_THEMES['classic']?.light ?? '#f0d9b5';
const DEFAULT_DARK = BOARD_THEMES['classic']?.dark ?? '#b58863';

const GUTTER_RATIO = 0.09;

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

/**
 * Live board preview for the Export Studio.
 *
 * Layout: a fixed outer wrapper whose size never changes when coords toggle.
 * The gutter (rank left, file bottom) is always reserved as empty space inside
 * the wrapper. The board canvas fills the remaining area. Coordinates are
 * absolutely positioned into the gutter slots.
 *
 * "Board Frame" is an outline on the canvas wrapper — outside the pixels,
 * does not affect canvas size.
 */
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

    // Observe the outer wrapper width once — stable, no state churn.
    useEffect(() => {
      const el = wrapperRef.current;
      if (!el) return;
      const obs = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect.width;
        if (w) setWrapperPx(Math.round(w));
      });
      obs.observe(el);
      setWrapperPx(Math.round(el.getBoundingClientRect().width));
      return () => obs.disconnect();
    }, []);

    // gutter is always reserved regardless of showCoords.
    const gutter = wrapperPx > 0 ? Math.round(wrapperPx * GUTTER_RATIO) : 0;
    // board fills everything except the left rank gutter and bottom file gutter.
    const boardPx = Math.max(0, wrapperPx - gutter);
    const cellSize = boardPx > 0 ? boardPx / 8 : 0;

    const hasImages = Object.keys(pieceImages).length > 0;
    const isLoading = piecesLoading && !hasImages;

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || boardPx <= 0 || !fen || !hasImages) return;

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

        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const [dRow, dCol] = getDisplayCoordinates(row, col, flipped);
            const b = getSquareBounds(dRow, dCol, sq, 0, 0);
            ctx.fillStyle = isLightSquare(row, col) ? light : dark;
            ctx.fillRect(b.x, b.y, b.width, b.height);
          }
        }

        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const fenChar = board[row]?.[col];
            if (!fenChar) continue;
            const color = fenChar === fenChar.toUpperCase() ? 'w' : 'b';
            const img = pieceImages[color + fenChar.toUpperCase()];
            if (!img?.complete || !img.naturalWidth) continue;
            const [dRow, dCol] = getDisplayCoordinates(row, col, flipped);
            const b = getSquareBounds(dRow, dCol, sq, 0, 0);
            const pad = snap(sq * 0.04);
            const ps = snap(sq - pad * 2);
            ctx.drawImage(
              img,
              snap(b.centerX - ps / 2),
              snap(b.centerY - ps / 2),
              ps,
              ps
            );
          }
        }
      } catch (err) {
        logger.error('BoardPreviewCanvas render error:', err);
        setHasError(true);
      }

      return () => {
        canvas.width = 0;
        canvas.height = 0;
      };
    }, [
      fen,
      lightSquare,
      darkSquare,
      pieceImages,
      flipped,
      hasImages,
      boardPx
    ]);

    return (
      // Outer wrapper: fills available width, height = width (square).
      // The gutter space is always part of the layout — toggling coords never
      // changes the wrapper size, so nothing shifts.
      <div
        ref={wrapperRef}
        style={{ width: '100%', aspectRatio: '1 / 1', position: 'relative' }}
      >
        {/* Board canvas — offset right by gutter, offset up from bottom by gutter */}
        <div
          className="box-content border-[3px] transition-colors"
          style={{
            position: 'absolute',
            left: `${gutter}px`,
            top: 0,
            width: `${boardPx}px`,
            height: `${boardPx}px`,
            borderColor: showThinFrame
              ? (darkSquare ?? DEFAULT_DARK)
              : 'transparent'
          }}
        >
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className={`block transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/60">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {hasError && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-error/10 border border-error/30">
              <p className="text-[10px] text-error font-medium">Invalid FEN</p>
            </div>
          )}
        </div>

        {/* Rank labels — left gutter column, top-aligned with the board */}
        {showCoords && cellSize > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${gutter}px`,
              height: `${boardPx}px`,
              paddingRight: showThinFrame ? '6px' : '2px'
            }}
          >
            <RankCoordinates
              flipped={flipped}
              cellSize={cellSize}
              gutterSize={gutter}
            />
          </div>
        )}

        {/* File labels — bottom gutter row, starts at left edge so
            FileCoordinates' own paddingLeft (gutterSize) aligns it with the board */}
        {showCoords && cellSize > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              height: `${gutter}px`,
              width: '100%',
              paddingTop: showThinFrame ? '6px' : '2px'
            }}
          >
            <FileCoordinates
              flipped={flipped}
              cellSize={cellSize}
              gutterSize={gutter}
            />
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
