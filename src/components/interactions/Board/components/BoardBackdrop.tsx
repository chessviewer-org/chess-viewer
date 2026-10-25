import { memo, useId } from 'react';

import { HATCH_DIVISIONS, hatchLineWidth } from '@chessviewer-org/chess-viewer';
import styles from '../styles/board.module.scss';

const STEP = 1 / HATCH_DIVISIONS;
const DIAGONALS = Array.from({ length: 16 * HATCH_DIVISIONS + 1 }, (_, n) => {
  const sum = n * STEP;
  return `M${sum},0L0,${sum}`;
}).join('');
const DARK_SQUARES = Array.from({ length: 64 }, (_, index) => {
  const row = Math.floor(index / 8);
  const col = index % 8;
  return (row + col) % 2 ? `M${col},${row}h1v1h-1z` : '';
}).join('');

interface BoardBackdropProps {
  light: string;
  dark: string;
  hatched: boolean;
}

export const BoardBackdrop = memo(function BoardBackdrop({
  light,
  dark,
  hatched
}: BoardBackdropProps) {
  const clipId = useId();
  return (
    <svg
      className={styles.backdrop}
      viewBox="0 0 8 8"
      preserveAspectRatio="none"
      shapeRendering="geometricPrecision"
      aria-hidden="true"
    >
      <rect width="8" height="8" fill={light} />
      {hatched ? (
        <>
          <clipPath id={clipId}>
            <path d={DARK_SQUARES} />
          </clipPath>
          <path
            d={DIAGONALS}
            clipPath={`url(#${clipId})`}
            stroke={dark}
            strokeWidth={hatchLineWidth(1)}
            fill="none"
          />
        </>
      ) : (
        <path d={DARK_SQUARES} fill={dark} />
      )}
    </svg>
  );
});
