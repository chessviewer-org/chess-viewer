import { parseFEN, validateFENDetailed } from '@/shared/utils/fenParser';
import { isPopeye, parsePopeye, serializePopeye } from '@/shared/utils/popeye';
import { assertNativePieces, popeyeFenOptions } from './input';
import { PopeyeClient } from './client';
import type { PopeyeMove } from './output';
import { DEFAULT_ANALYSIS_SETTINGS } from './settings';

export interface PreviousMove {
  from: number;
  to: number;
}

/** A native one-ply search. Search/output options never alter legal move generation. */
export function buildMoveInput(fen: string, side: 'w' | 'b'): string {
  if (!validateFENDetailed(fen).isValid)
    throw new Error('Enter a valid position first.');
  const board = parseFEN(fen);
  assertNativePieces(board);
  const commands = (
    isPopeye(fen) ? parsePopeye(fen).commands : popeyeFenOptions(fen)
  )
    .filter(({ keyword }) => keyword === 'condition' || keyword === 'option')
    .map(({ keyword, value }) => ({
      keyword,
      value:
        keyword === 'option'
          ? value
              .replace(/\bNonTrivial\s+\d+\s+\d+\b/gi, '')
              .replace(
                /\b(?:MaxSolutions|MaxTime|Defence|Threat|MaxFlightsquares|StartMoveNumber|UpToMoveNumber|Intelligent|Beep)\s+\d+\b/gi,
                ''
              )
              .replace(
                /\b(?:Try|TrivialTriesAvoid|SetPlay|WhiteToPlay|Variation|MoveNumbers|NoThreat|NoShortVariations|Duplex|HalfDuplex|PostKeyPlay|Intelligent|StopOnShortSolutions|Beep|Quodlibet)\b/gi,
                ''
              )
              .trim()
          : value
    }))
    .filter(({ value }) => value.length > 0);
  commands.push({ keyword: 'stipulation', value: '~1' });
  commands.push({
    keyword: 'option',
    value: side === 'b' ? 'NoBoard HalfDuplex' : 'NoBoard'
  });
  return serializePopeye(board, { commands, fenMetadata: '' });
}

export function matchingMoves(
  moves: readonly PopeyeMove[],
  from: number,
  to: number
): PopeyeMove[] {
  return moves.filter(
    ({ intent }) =>
      (intent.from === from && (intent.to === to || intent.via === to)) ||
      (intent.exchange && intent.to === from && intent.from === to)
  );
}

export class PopeyeMoveResolver {
  private client: PopeyeClient | null = null;
  private reject: ((error: Error) => void) | null = null;
  private cached: { key: string; moves: PopeyeMove[] } | null = null;

  cancel() {
    this.client?.destroy();
    this.client = null;
    this.reject?.(new DOMException('Position changed', 'AbortError'));
    this.reject = null;
  }

  async resolve(
    fen: string,
    side: 'w' | 'b',
    from: number,
    to: number,
    previousMove?: PreviousMove
  ): Promise<PopeyeMove[]> {
    this.cancel();
    const key = JSON.stringify([fen, side, previousMove]);
    if (this.cached?.key === key)
      return matchingMoves(this.cached.moves, from, to);
    const input = buildMoveInput(fen, side);
    const moves = await new Promise<PopeyeMove[]>((resolve, reject) => {
      this.reject = reject;
      const client = new PopeyeClient((state) => {
        if (
          state.status === 'complete' &&
          !/Partial solution/i.test(state.output)
        ) {
          this.reject = null;
          client.destroy();
          this.client = null;
          this.cached = { key, moves: state.moves };
          resolve(state.moves);
        } else if (
          ['error', 'timeout', 'stopped', 'complete'].includes(state.status)
        ) {
          this.reject = null;
          client.destroy();
          this.client = null;
          reject(
            new Error(state.message || 'Popeye could not check this move.')
          );
        }
      });
      this.client = client;
      client.start(
        input,
        { ...DEFAULT_ANALYSIS_SETTINGS, seconds: 5, memoryMb: 16 },
        previousMove
      );
    });
    return matchingMoves(moves, from, to);
  }
}
