import { memo, type CSSProperties } from 'react';
import type { BoardCell } from '@app-types';
import type { BoardAnimation } from '@/engines/animation';
import { getPieceKey } from '@/shared/utils/pieceUtils';
import { useSquarePatternSetting } from '@/shared/hooks/useSquarePattern';
import styles from '../styles/move-animation.module.scss';

interface Props {
  id: number;
  animation: BoardAnimation;
  board: BoardCell[][];
  pieceImages: Record<string, HTMLImageElement>;
  flipped: boolean;
  lightSquare: string;
  onDone: (id: number) => void;
}

function point(square: number, flipped: boolean) {
  return {
    x: (flipped ? 7 - (square % 8) : square % 8) * 100,
    y: (flipped ? 7 - Math.floor(square / 8) : Math.floor(square / 8)) * 100
  };
}

export const MoveAnimation = memo(function MoveAnimation({
  id,
  animation,
  board,
  pieceImages,
  flipped,
  lightSquare,
  onDone
}: Props) {
  const [pattern] = useSquarePatternSetting();
  const stages = Math.min(
    3,
    Math.max(1, ...animation.motions.map((motion) => motion.path.length - 1))
  );
  const covered = new Set(
    animation.motions
      .filter((motion) => !motion.removed)
      .map((motion) => motion.path.at(-1))
  );
  const source = (piece: BoardCell) => {
    const key = getPieceKey(piece);
    return key ? pieceImages[key]?.src : undefined;
  };
  return (
    <div
      className={styles.layer}
      aria-hidden="true"
      data-stages={stages}
      data-square-pattern={pattern}
      style={{ '--board-light': lightSquare } as CSSProperties}
    >
      {Array.from({ length: 64 }, (_, square) => ({
        square,
        piece: board[Math.floor(square / 8)]![square % 8]!
      })).map(({ piece, square }) => {
        const src = source(piece);
        if (!src || covered.has(square)) return null;
        const position = point(square, flipped);
        return (
          <span
            key={`static-${square}`}
            className={styles.still}
            data-shade={
              (Math.floor(square / 8) + (square % 8)) % 2 ? 'dark' : 'light'
            }
            style={
              {
                '--x': `${position.x}%`,
                '--y': `${position.y}%`
              } as CSSProperties
            }
          >
            <img src={src} alt="" draggable={false} />
          </span>
        );
      })}
      {animation.motions.flatMap((motion) => {
        const src = source(motion.piece);
        if (!src || !motion.path.length) return [];
        const count = Math.max(1, motion.path.length - 1);
        return Array.from({ length: count }, (_, index) => {
          const from = point(motion.path[index]!, flipped);
          const to = point(
            motion.path[Math.min(index + 1, motion.path.length - 1)]!,
            flipped
          );
          const last = index === count - 1;
          return (
            <span
              key={`${motion.id}-${index}-${motion.path[index]}`}
              className={styles.segment}
              data-last={last}
              data-removed={motion.removed}
              data-shade="dark"
              data-motion-piece={motion.piece}
              style={
                {
                  '--from-x': `${from.x}%`,
                  '--from-y': `${from.y}%`,
                  '--to-x': `${to.x}%`,
                  '--to-y': `${to.y}%`,
                  '--segments': count,
                  '--segment-index': index
                } as CSSProperties
              }
              onAnimationEnd={last ? () => onDone(id) : undefined}
            >
              <img src={src} alt="" draggable={false} />
            </span>
          );
        });
      })}
    </div>
  );
});
