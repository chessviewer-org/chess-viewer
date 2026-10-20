import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { boardOutlineWidth } from '@chessviewer-org/chess-viewer';
import { LATEX_PACKAGE_META } from '@utils';
import {
  type StudioPosition,
  type StudioSettings,
  previewDataUri
} from '../utils/latexProject';

const MIN_BOARD_PX = 32;
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function useSquareWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const measured = entry?.contentRect.width ?? 0;
      setWidth(Math.max(MIN_BOARD_PX, Math.floor(measured)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

interface PaperBoardProps {
  position: StudioPosition;
  settings: StudioSettings;
  alt: string;
  plain?: boolean;
  className?: string;
}

export const PaperBoard = memo(function PaperBoard({
  position,
  settings,
  alt,
  plain = false,
  className = ''
}: PaperBoardProps) {
  const [ref, width] = useSquareWidth();
  const meta = LATEX_PACKAGE_META[settings.latexPackage];
  const coords =
    !plain && settings.latexPackage !== 'diagram' && settings.showCoords;
  const flipped = meta.supportsFlip && position.flipped;

  const boardPx = width
    ? Math.floor((width - boardOutlineWidth(width) * 2) / 8) * 8
    : 0;
  const imagePx = boardPx ? boardPx + boardOutlineWidth(boardPx) * 2 : 0;

  const src = useMemo(() => {
    if (!boardPx) return null;
    return previewDataUri(
      meta.supportsFlip ? position : { ...position, flipped: false },
      { size: boardPx, showAnnotations: !plain && meta.supportsMarks }
    );
  }, [position, meta, plain, boardPx]);

  const labelStyle = { fontSize: `${Math.max(9, width / 30)}px` };
  const files = flipped ? [...FILES].reverse() : FILES;
  const ranks = flipped ? [...RANKS].reverse() : RANKS;

  return (
    <div
      className={`grid ${coords ? 'grid-cols-[auto_minmax(0,1fr)] gap-x-1' : ''} ${className}`}
    >
      {coords && (
        <div
          aria-hidden="true"
          className="grid grid-rows-8 font-serif text-neutral-700"
          style={{ ...labelStyle, height: width || undefined }}
        >
          {ranks.map((rank) => (
            <span key={rank} className="flex items-center justify-end">
              {rank}
            </span>
          ))}
        </div>
      )}
      <div ref={ref} className="min-w-0">
        <div
          className="grid place-items-center bg-white"
          style={{ width: width || '100%', height: width || undefined }}
        >
          {src ? (
            <img
              src={src}
              alt={alt}
              width={imagePx}
              height={imagePx}
              decoding="async"
              className="block"
            />
          ) : (
            width > 0 && (
              <span className="px-2 text-center text-[11px] font-semibold text-red-700">
                Invalid FEN
              </span>
            )
          )}
        </div>
      </div>
      {coords && (
        <>
          <span aria-hidden="true" />
          <div
            aria-hidden="true"
            className="grid grid-cols-8 pt-0.5 font-serif text-neutral-700"
            style={{ ...labelStyle, width: width || undefined }}
          >
            {files.map((file) => (
              <span key={file} className="text-center">
                {file}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
});
