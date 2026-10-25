import { memo } from 'react';

import type { BoardArrow, Square } from '@/engines/core/arrows';
import type { Brush, Shape } from '../hooks/useBoardDrawing';
import styles from '../styles/board.module.scss';

const HEAD_LENGTH = 0.32;
const HEAD_HALF_WIDTH = 0.2;
const TAIL_GAP = 0.12;
const BEST_WIDTH = 0.17;
const ALTERNATIVE_WIDTH = 0.12;
const DRAWN_WIDTH = 0.15;
const RING_RADIUS = 0.45;
const RING_WIDTH = 0.07;

const BRUSH_CLASS: Record<Brush, string> = {
  green: styles.green,
  red: styles.red,
  blue: styles.blue,
  yellow: styles.yellow
};

interface BoardShapesProps {
  arrows: readonly BoardArrow[];
  shapes: readonly Shape[];
  pending: Shape | null;
  flipped: boolean;
}

export const BoardShapes = memo(function BoardShapes({
  arrows,
  shapes,
  pending,
  flipped
}: BoardShapesProps) {
  if (!arrows.length && !shapes.length && !pending) return null;
  const centre = ([row, col]: Square) =>
    [(flipped ? 7 - col : col) + 0.5, (flipped ? 7 - row : row) + 0.5] as const;

  const arrow = (
    from: Square,
    to: Square,
    width: number,
    className: string,
    key: string
  ) => {
    const [x1, y1] = centre(from);
    const [x2, y2] = centre(to);
    const length = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / length;
    const uy = (y2 - y1) / length;
    const bx = x2 - ux * HEAD_LENGTH;
    const by = y2 - uy * HEAD_LENGTH;
    return (
      <g key={key} className={`${styles.arrow} ${className}`}>
        <line
          x1={x1 + ux * TAIL_GAP}
          y1={y1 + uy * TAIL_GAP}
          x2={bx}
          y2={by}
          strokeWidth={width}
        />
        <polygon
          stroke="none"
          points={`${x2},${y2} ${bx - uy * HEAD_HALF_WIDTH},${by + ux * HEAD_HALF_WIDTH} ${bx + uy * HEAD_HALF_WIDTH},${by - ux * HEAD_HALF_WIDTH}`}
        />
      </g>
    );
  };

  const drawn = (shape: Shape, className: string) => {
    const key = `${shape.from}-${shape.to}-${shape.brush}`;
    if (shape.from[0] === shape.to[0] && shape.from[1] === shape.to[1]) {
      const [cx, cy] = centre(shape.from);
      return (
        <circle
          key={key}
          cx={cx}
          cy={cy}
          r={RING_RADIUS}
          strokeWidth={RING_WIDTH}
          className={`${styles.ring} ${BRUSH_CLASS[shape.brush]} ${className}`}
        />
      );
    }
    return arrow(
      shape.from,
      shape.to,
      DRAWN_WIDTH,
      `${BRUSH_CLASS[shape.brush]} ${className}`,
      key
    );
  };

  return (
    <svg className={styles.shapes} viewBox="0 0 8 8" aria-hidden="true">
      {arrows.map(({ from, to, rank, tone }) =>
        arrow(
          from,
          to,
          rank === 0 ? BEST_WIDTH : ALTERNATIVE_WIDTH,
          `${tone === 'threat' ? styles.threat : styles.hint} ${rank === 0 ? styles.best : styles.alternative}`,
          `${from}-${to}-${tone}`
        )
      )}
      {shapes.map((shape) => drawn(shape, styles.drawn))}
      {pending && drawn(pending, styles.pending)}
    </svg>
  );
});
