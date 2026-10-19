import { memo, useMemo } from 'react';

import { LATEX_PACKAGE_META } from '@utils';
import {
  type StudioPosition,
  type StudioSettings,
  previewDataUri
} from '../utils/latexProject';

interface PaperBoardProps {
  position: StudioPosition;
  settings: StudioSettings;
  size: number;
  alt: string;
  plain?: boolean;
  className?: string;
}

export const PaperBoard = memo(function PaperBoard({
  position,
  settings,
  size,
  alt,
  plain = false,
  className = ''
}: PaperBoardProps) {
  const meta = LATEX_PACKAGE_META[settings.latexPackage];
  const isDiagram = settings.latexPackage === 'diagram';
  const src = useMemo(
    () =>
      previewDataUri(
        meta.supportsFlip ? position : { ...position, flipped: false },
        {
          size,
          showCoords: !plain && !isDiagram && settings.showCoords,
          showAnnotations: !plain && meta.supportsMarks
        }
      ),
    [position, meta, isDiagram, settings.showCoords, size, plain]
  );

  return (
    <div
      className={`grid aspect-square place-items-center overflow-hidden bg-white ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className="size-full object-contain"
        />
      ) : (
        <span className="px-2 text-center text-[11px] font-semibold text-red-700">
          Invalid FEN
        </span>
      )}
    </div>
  );
});
