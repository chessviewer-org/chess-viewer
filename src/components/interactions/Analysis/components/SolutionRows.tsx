import {
  type CSSProperties,
  memo,
  useEffect,
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
    <div
      className={styles.miniBoard}
      role="img"
      aria-label={describeBoardPosition(move.board, flipped)}
      data-square-pattern={squarePattern}
      style={
        {
          '--board-light': lightSquare
        } as CSSProperties
      }
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
          <span
            key={`${actualRow}-${col}`}
            data-shade={(actualRow + col) % 2 === 0 ? 'light' : 'dark'}
          >
            {image && <img src={image.src} alt="" draggable={false} />}
          </span>
        );
      })}
    </div>
  );
}

function tokens(text: string, moves: readonly PreviewMove[]) {
  const parts: Array<{ key: number; text: string; move?: PreviewMove }> = [];
  let offset = 0;
  for (const move of moves) {
    const index = text.indexOf(move.text, offset);
    if (index < 0) continue;
    if (index > offset)
      parts.push({ key: offset, text: text.slice(offset, index) });
    parts.push({ key: index, text: move.text, move });
    offset = index + move.text.length;
  }
  if (offset < text.length)
    parts.push({ key: offset, text: text.slice(offset) });
  return parts;
}

interface MoveLineProps {
  text: string;
  moves: PreviewMove[];
  selected: PreviewMove | null;
  hovered: PreviewMove | null;
  previewId: string;
  show: (move: PreviewMove, element: HTMLElement) => void;
  hidePointer: () => void;
  hideFocus: () => void;
  select: (move: PreviewMove) => void;
}

const MoveLine = memo(function MoveLine({
  text,
  moves,
  selected,
  hovered,
  previewId,
  show,
  hidePointer,
  hideFocus,
  select
}: MoveLineProps) {
  const parts = useMemo(() => tokens(text, moves), [text, moves]);
  return (
    <span className={styles.lineText}>
      {parts.map((part) => {
        const move = part.move;
        return move ? (
          <button
            key={part.key}
            type="button"
            className={styles.moveButton}
            aria-label={`Show ${part.text} on the board`}
            aria-describedby={hovered === move ? previewId : undefined}
            aria-pressed={selected === move}
            onMouseEnter={(event) => show(move, event.currentTarget)}
            onMouseLeave={hidePointer}
            onFocus={(event) => show(move, event.currentTarget)}
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
  const [hover, setHover] = useState<{
    move: PreviewMove;
    left: number;
    top: number;
    size: number;
  } | null>(null);
  const [selected, setSelected] = useState<PreviewMove | null>(null);
  const previewRequest = useRef(0);
  const scrollingForPreview = useRef(false);
  const autoScrollPending = useRef(false);
  const previewSource = useRef<HTMLElement | null>(null);
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
    if (hover && !availableMoves.has(hover.move)) setHover(null);
  }, [availableMoves, selected, hover, onPreview]);

  useEffect(() => {
    if (!hover) return;
    const hide = () => {
      if (autoScrollPending.current) return;
      scrollingForPreview.current = false;
      setHover(null);
    };
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [hover]);

  useEffect(() => {
    if (!hover || !scrollingForPreview.current) return;
    const release = (event: PointerEvent) => {
      scrollingForPreview.current = false;
      if (!previewSource.current?.contains(event.target as Node))
        setHover(null);
    };
    window.addEventListener('pointermove', release, { once: true });
    return () => window.removeEventListener('pointermove', release);
  }, [hover]);

  const show = useCallback((move: PreviewMove, element: HTMLElement) => {
    const request = ++previewRequest.current;
    scrollingForPreview.current = false;
    autoScrollPending.current = false;
    previewSource.current = element;
    const place = () => {
      if (request !== previewRequest.current) return;
      const moveRect = element.getBoundingClientRect();
      const rowRect =
        element.closest('[data-solution-row]')?.getBoundingClientRect() ??
        moveRect;
      const bounds =
        element.closest('[data-analysis-panel]')?.getBoundingClientRect() ??
        new DOMRect(0, 0, window.innerWidth, window.innerHeight);
      const top = rowRect.bottom + PREVIEW_GAP;
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
            place();
            autoScrollPending.current = false;
          })
        );
        return;
      }
      const size = Math.max(
        0,
        Math.min(PREVIEW_SIZE, bounds.width - 2 * PREVIEW_GAP, available)
      );
      if (size < 1) {
        setHover(null);
        return;
      }
      setHover({
        move,
        size,
        left: Math.max(
          bounds.left + PREVIEW_GAP,
          Math.min(moveRect.left, bounds.right - size - PREVIEW_GAP)
        ),
        top
      });
    };
    place();
  }, []);
  const hidePointer = useCallback(() => {
    if (scrollingForPreview.current) return;
    ++previewRequest.current;
    setHover(null);
  }, []);
  const hideFocus = useCallback(() => {
    scrollingForPreview.current = false;
    autoScrollPending.current = false;
    ++previewRequest.current;
    setHover(null);
  }, []);
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
      <div className={styles.solutions} aria-label={label}>
        {solutions.slice(0, limit).map((solution, index) => {
          const header = (
            <>
              <MoveLine
                text={solution.key}
                moves={solution.moves}
                selected={selected}
                hovered={hover?.move ?? null}
                previewId={previewId}
                show={show}
                hidePointer={hidePointer}
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
                      text={variation.text}
                      moves={variation.moves}
                      selected={selected}
                      hovered={hover?.move ?? null}
                      previewId={previewId}
                      show={show}
                      hidePointer={hidePointer}
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
              move={hover.move}
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
