import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { ChessBoard } from '@app-types';
import type { Notify, PreviewMove } from '@/engines/core/types';
import type { PopeyeMove } from '@/engines/popeye/output';
import type { PopeyeMoveResolver, PreviousMove } from '@/engines/popeye/moves';
import { positionContext, serializePosition } from '@/shared/utils/fenParser';
import { parseCellCode } from '@/shared/utils/boardCells';
import { parseNamedCell } from '@/shared/utils/fairyCells';

interface Props {
  active: boolean;
  fen: string;
  board: ChessBoard;
  preview: PreviewMove | null;
  onCommit: (move: PopeyeMove, fen: string) => void;
  onNotify?: Notify | undefined;
}

export function usePopeyeMoves({
  active,
  fen,
  board,
  preview,
  onCommit,
  onNotify
}: Props) {
  const resolver = useRef<PopeyeMoveResolver | null>(null);
  const request = useRef(0);
  const [previous, setPrevious] = useState<{
    fen: string;
    move: PreviousMove;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [choices, setChoices] = useState<PopeyeMove[]>([]);

  const cancel = useCallback(() => {
    request.current++;
    resolver.current?.cancel();
    setPending(false);
    setChoices([]);
  }, []);
  useLayoutEffect(() => {
    cancel();
    setPrevious((current) => (current?.fen === fen ? current : null));
    return cancel;
  }, [fen, board, active, cancel]);

  const commit = useCallback(
    (move: PopeyeMove) => {
      const next = serializePosition(move.board, positionContext(fen));
      setPrevious({ fen: next, move: move.intent });
      setChoices([]);
      onCommit(move, next);
    },
    [fen, onCommit]
  );

  const move = useCallback(
    async (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
      if (!active) return;
      cancel();
      const version = request.current;
      const piece = board[fromRow]?.[fromCol];
      if (!piece) return;
      const code = parseNamedCell(piece) ?? parseCellCode(piece);
      const color = code?.color ?? (piece === piece.toUpperCase() ? 'w' : 'b');
      const source = serializePosition(board, positionContext(fen));
      const context =
        preview && 'intent' in preview
          ? (preview as PopeyeMove).intent
          : previous?.fen === fen
            ? previous.move
            : undefined;
      setPending(true);
      try {
        const { PopeyeMoveResolver } = await import('@/engines/popeye/moves');
        if (request.current !== version) return;
        resolver.current ??= new PopeyeMoveResolver();
        const resolve = (side: 'w' | 'b') =>
          resolver.current!.resolve(
            source,
            side,
            fromRow * 8 + fromCol,
            toRow * 8 + toCol,
            context
          );
        const candidates =
          color === 'n'
            ? [...(await resolve('w')), ...(await resolve('b'))]
            : await resolve(color);
        if (request.current !== version) return;
        const unique = [
          ...new Map(
            candidates.map((candidate) => [
              JSON.stringify(candidate.board),
              candidate
            ])
          ).values()
        ];
        if (unique.length === 1) commit(unique[0]!);
        else setChoices(unique);
      } catch (error) {
        if (
          request.current === version &&
          !(error instanceof DOMException && error.name === 'AbortError')
        )
          onNotify?.(
            error instanceof Error
              ? error.message
              : 'Popeye could not check this move.',
            'error'
          );
      } finally {
        if (request.current === version) setPending(false);
      }
    },
    [active, fen, board, preview, previous, cancel, commit, onNotify]
  );

  return {
    move,
    pending,
    choices,
    choose: commit,
    cancel,
    previousMove: previous?.fen === fen ? previous.move : undefined
  };
}
