import {
  memo,
  useEffect,
  useLayoutEffect,
  useId,
  useMemo,
  useCallback,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from '@/assets/icons';
import type { ChessBoard } from '@app-types';
import { usePieceImages } from '@/shared/hooks/usePieceImages';
import { describeBoardPosition } from '@/shared/utils/boardCells';
import { getPieceKey } from '@/shared/utils/pieceUtils';
import { useSquarePatternSetting } from '@/shared/hooks/useSquarePattern';
import { BoardBackdrop } from '../../Board/components/BoardBackdrop';
import type { PreviewMove, SolutionLine } from '@/engines/core/types';
import { moveAt, moveTokens, type MoveLocation } from '../solutionMoves';
import styles from '../styles/analysis.module.scss';

const PREVIEW_SIZE = 224;
const PREVIEW_GAP = 6;
const MIN_PREVIEW_SIZE = 128;

interface Props {
  label: string;
  solutions: SolutionLine[];
  limit: number;
  emptyText: string;
  onPreview: (board: ChessBoard | null, move?: PreviewMove) => void;
  onPlay?: ((move: PreviewMove) => void) | undefined;
  pieceStyle: string;
  lightSquare: string;
  darkSquare: string;
  flipped: boolean;
}

function MiniBoard({
  move,
  pieceStyle,
  lightSquare,
  darkSquare,
  flipped
}: Omit<
  Props,
  'label' | 'solutions' | 'limit' | 'emptyText' | 'onPreview' | 'onPlay'
> & {
  move: PreviewMove;
}) {
  const { pieceImages } = usePieceImages(pieceStyle, { board: move.board });
  const [squarePattern] = useSquarePatternSetting();
  return (
    <svg
      className={styles.miniBoard}
      viewBox="0 0 8 8"
      shapeRendering="geometricPrecision"
      role="img"
      aria-label={describeBoardPosition(move.board, flipped)}
    >
      <BoardBackdrop
        light={lightSquare}
        dark={darkSquare}
        hatched={squarePattern === 'hatched'}
      />
      {Array.from({ length: 64 }, (_, index) => {
        const col = flipped ? 7 - (index % 8) : index % 8;
        // Engine boards use rank 8 first, just like the editor.
        const actualRow = flipped
          ? 7 - Math.floor(index / 8)
          : Math.floor(index / 8);
        const cell = move.board[actualRow]?.[col] ?? '';
        const key = getPieceKey(cell);
        const image = key ? pieceImages[key] : undefined;
        return (
          <image
            key={`${actualRow}-${col}`}
            x={index % 8}
            y={Math.floor(index / 8)}
            width="1"
            height="1"
            href={image?.src}
          />
        );
      })}
    </svg>
  );
}

interface MoveLineProps {
  solutionId: number;
  variationId?: number;
  text: string;
  moves: PreviewMove[];
  selected: PreviewMove | null;
  hovered: PreviewMove | null;
  previewId: string;
  show: (
    location: MoveLocation,
    element: HTMLElement,
    origin: 'pointer' | 'focus'
  ) => void;
  hideFocus: () => void;
  select: (move: PreviewMove) => void;
}

const MoveLine = memo(function MoveLine({
  solutionId,
  variationId,
  text,
  moves,
  selected,
  hovered,
  previewId,
  show,
  hideFocus,
  select
}: MoveLineProps) {
  const parts = useMemo(() => moveTokens(text, moves), [text, moves]);
  return (
    <span className={styles.lineText}>
      {parts.map((part) => {
        const move = part.move;
        const location = {
          solutionId,
          ...(variationId !== undefined ? { variationId } : {}),
          moveIndex: part.moveIndex!
        };
        return move ? (
          <button
            key={part.key}
            type="button"
            className={styles.moveButton}
            aria-label={`Show ${part.text} on the board`}
            aria-describedby={hovered === move ? previewId : undefined}
            aria-pressed={selected === move}
            data-preview-move=""
            data-preview-active={hovered === move}
            onMouseEnter={(event) =>
              show(location, event.currentTarget, 'pointer')
            }
            onFocus={(event) => show(location, event.currentTarget, 'focus')}
            onBlur={hideFocus}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              select(move);
            }}
          >
            {part.text}
          </button>
        ) : (
          <span key={part.key}>{part.text}</span>
        );
      })}
    </span>
  );
});

export const SolutionRows = memo(function SolutionRows({
  label,
  solutions,
  limit,
  emptyText,
  onPreview,
  onPlay,
  pieceStyle,
  lightSquare,
  darkSquare,
  flipped
}: Props) {
  const previewId = useId();
  const solutionsRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<{
    location: MoveLocation;
    element: HTMLElement;
    origin: 'pointer' | 'focus';
  } | null>(null);
  const [hover, setHover] = useState<{
    left: number;
    top: number;
    size: number;
  } | null>(null);
  const [selected, setSelected] = useState<PreviewMove | null>(null);
  const scrollingForPreview = useRef(false);
  const autoScrollPending = useRef(false);
  const hoveredMove = target
    ? moveAt(solutions.slice(0, limit), target.location)
    : undefined;
  const availableMoves = useMemo(
    () =>
      new Set(
        solutions.flatMap((solution) => [
          ...solution.moves,
          ...solution.variations.flatMap((variation) => variation.moves)
        ])
      ),
    [solutions]
  );

  useEffect(() => {
    if (selected && !availableMoves.has(selected)) {
      setSelected(null);
      onPreview(null);
    }
  }, [availableMoves, selected, onPreview]);

  const hideFocus = useCallback(() => {
    scrollingForPreview.current = false;
    autoScrollPending.current = false;
    setTarget(null);
    setHover(null);
  }, []);

  useEffect(() => {
    if (!target || target.origin !== 'pointer') return;
    const followPointer = (event: PointerEvent) => {
      if (autoScrollPending.current) return;
      scrollingForPreview.current = false;
      const move =
        event.target instanceof Element
          ? event.target.closest('[data-preview-move]')
          : null;
      if (!move || !solutionsRef.current?.contains(move)) hideFocus();
    };
    window.addEventListener('pointermove', followPointer);
    return () => window.removeEventListener('pointermove', followPointer);
  }, [target, hideFocus]);

  const show = useCallback(
    (
      location: MoveLocation,
      element: HTMLElement,
      origin: 'pointer' | 'focus'
    ) => {
      scrollingForPreview.current = false;
      autoScrollPending.current = false;
      setTarget({ location, element, origin });
    },
    []
  );

  useLayoutEffect(() => {
    if (!target) return;
    if (!hoveredMove || !target.element.isConnected) {
      hideFocus();
      return;
    }
    const { element } = target;
    let cancelled = false;
    const place = () => {
      if (cancelled) return;
      const moveRect = element.getBoundingClientRect();
      const rowRect =
        element.closest('[data-solution-row]')?.getBoundingClientRect() ??
        moveRect;
      const bounds =
        element.closest('[data-analysis-panel]')?.getBoundingClientRect() ??
        new DOMRect(0, 0, window.innerWidth, window.innerHeight);
      const pixelRatio = window.devicePixelRatio;
      const top =
        Math.round((rowRect.bottom + PREVIEW_GAP) * pixelRatio) / pixelRatio;
      const available = window.innerHeight - top - PREVIEW_GAP;
      const scrollRemaining =
        document.documentElement.scrollHeight -
        window.innerHeight -
        window.scrollY;
      if (
        available < MIN_PREVIEW_SIZE &&
        scrollRemaining > 1 &&
        !scrollingForPreview.current
      ) {
        scrollingForPreview.current = true;
        autoScrollPending.current = true;
        window.scrollBy(
          0,
          Math.min(MIN_PREVIEW_SIZE - available, scrollRemaining)
        );
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (cancelled) return;
            place();
            autoScrollPending.current = false;
          })
        );
        return;
      }
      const availableSize = Math.max(
        0,
        Math.min(PREVIEW_SIZE, bounds.width - 2 * PREVIEW_GAP, available)
      );
      // Align the board and each of its eight squares to device pixels.
      const size =
        (Math.floor((availableSize * pixelRatio) / 8) * 8) / pixelRatio;
      if (size < 1) {
        hideFocus();
        return;
      }
      setHover({
        size,
        left:
          Math.round(
            Math.max(
              bounds.left + PREVIEW_GAP,
              Math.min(moveRect.left, bounds.right - size - PREVIEW_GAP)
            ) * pixelRatio
          ) / pixelRatio,
        top
      });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      cancelled = true;
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [target, hoveredMove, hideFocus]);
  const select = useCallback(
    (move: PreviewMove) => {
      hideFocus();
      if (move.fen && onPlay) {
        onPlay(move);
        return;
      }
      const next = selected === move ? null : move;
      setSelected(next);
      onPreview(next?.board ?? null, next ?? undefined);
    },
    [selected, onPreview, onPlay, hideFocus]
  );

  return (
    <>
      <div ref={solutionsRef} className={styles.solutions} aria-label={label}>
        {solutions.slice(0, limit).map((solution, index) => {
          const header = (
            <>
              <MoveLine
                solutionId={solution.id}
                text={solution.key}
                moves={solution.moves}
                selected={selected}
                hovered={hoveredMove ?? null}
                previewId={previewId}
                show={show}
                hideFocus={hideFocus}
                select={select}
              />
            </>
          );
          return solution.variations.length ? (
            <details key={solution.id} className={styles.solution}>
              <summary
                className={styles.solutionHeader}
                data-solution-row=""
                aria-label={`Solution ${index + 1}, show variations`}
              >
                {header}
                <ChevronDown className={styles.chevron} />
              </summary>
              <div
                className={styles.variations}
                aria-label={`Variations for solution ${index + 1}`}
              >
                {solution.variations.map((variation) => (
                  <div
                    key={variation.id}
                    className={styles.variation}
                    data-solution-row=""
                  >
                    <MoveLine
                      solutionId={solution.id}
                      variationId={variation.id}
                      text={variation.text}
                      moves={variation.moves}
                      selected={selected}
                      hovered={hoveredMove ?? null}
                      previewId={previewId}
                      show={show}
                      hideFocus={hideFocus}
                      select={select}
                    />
                  </div>
                ))}
              </div>
            </details>
          ) : (
            <div key={solution.id} className={styles.solution}>
              <div className={styles.solutionHeader} data-solution-row="">
                {header}
              </div>
            </div>
          );
        })}
        {solutions.length === 0 && <p className={styles.empty}>{emptyText}</p>}
      </div>
      {hover &&
        hoveredMove &&
        createPortal(
          <div
            id={previewId}
            role="tooltip"
            className={styles.preview}
            style={{
              left: hover.left,
              top: hover.top,
              width: hover.size
            }}
          >
            <MiniBoard
              move={hoveredMove}
              pieceStyle={pieceStyle}
              lightSquare={lightSquare}
              darkSquare={darkSquare}
              flipped={flipped}
            />
          </div>,
          document.body
        )}
    </>
  );
});
