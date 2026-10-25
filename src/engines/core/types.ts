import type { ChessBoard } from '@app-types';
import type { BoardAnimation } from '../animation';

export type AnalysisStatus =
  'idle' | 'loading' | 'running' | 'complete' | 'stopped' | 'timeout' | 'error';

export interface PreviewMove {
  text: string;
  board: ChessBoard;
  fen?: string;
  animation?: BoardAnimation;
}

export interface SolutionVariation {
  id: number;
  text: string;
  moves: PreviewMove[];
}

export interface SolutionLine {
  id: number;
  key: string;
  moves: PreviewMove[];
  variations: SolutionVariation[];
}

export type Notify = (
  message: string,
  type: 'success' | 'error' | 'info' | 'warning'
) => void;
