import type { SolutionLine } from '../core/types';
import { parseUciMove, play, sanMove, type Position } from '../rules/moves';
import { positionFen } from '../rules/position';
import { orthodoxMoveAnimation } from '../rules/animation';

const MAX_PLIES = 16;

export interface SearchInfo {
  multipv: number;
  depth: number;
  cp?: number;
  mate?: number;
  pv: string[];
}

export function parseInfo(line: string): SearchInfo | null {
  if (!line.startsWith('info ') || /\b(?:lowerbound|upperbound)\b/.test(line))
    return null;
  const field = (name: string) =>
    new RegExp(`\\b${name} (-?\\d+)`).exec(line)?.[1];
  const depth = field('depth');
  const cp = /\bscore cp (-?\d+)/.exec(line)?.[1];
  const mate = /\bscore mate (-?\d+)/.exec(line)?.[1];
  const pv = / pv ((?:[a-h][1-8][a-h][1-8][qrbn]? ?)+)/.exec(line)?.[1];
  if (!depth || !pv || (cp === undefined && mate === undefined)) return null;
  return {
    multipv: Number(field('multipv') ?? 1),
    depth: Number(depth),
    ...(cp !== undefined && { cp: Number(cp) }),
    ...(mate !== undefined && { mate: Number(mate) }),
    pv: pv.trim().split(' ')
  };
}

export function scoreText(info: SearchInfo, turn: Position['turn']): string {
  const sign = turn === 'w' ? 1 : -1;
  if (info.mate !== undefined) return `#${info.mate * sign}`;
  const pawns = ((info.cp ?? 0) * sign) / 100;
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(1)}`;
}

export function searchLine(
  position: Position,
  fullmove: number,
  info: SearchInfo
): SolutionLine {
  const moves: SolutionLine['moves'] = [];
  let text = '';
  let current = position;
  let number = fullmove;
  for (const uci of info.pv.slice(0, MAX_PLIES)) {
    const move = parseUciMove(current, uci);
    if (!move) break;
    const san = sanMove(current, move);
    const prefix =
      current.turn === 'w' ? `${number}. ` : text ? '' : `${number}... `;
    text += `${text ? ' ' : ''}${prefix}${san}`;
    const animation = orthodoxMoveAnimation(current, move);
    current = play(current, move);
    moves.push({
      text: san,
      board: current.board,
      fen: positionFen(current),
      animation
    });
    if (current.turn === 'w') number++;
  }
  return {
    id: info.multipv,
    key: `${scoreText(info, position.turn)}  ${text}`,
    moves,
    variations: []
  };
}
