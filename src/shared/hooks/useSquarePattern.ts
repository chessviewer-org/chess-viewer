import {
  readSquarePattern,
  SQUARE_PATTERN_CHANGE_EVENT,
  SQUARE_PATTERN_STORAGE_KEY
} from '@/shared/utils/boardPattern';
import { type SquarePattern } from '@chessviewer-org/chess-viewer';
import { usePreferenceSetting } from './useA11y';

export function useSquarePatternSetting(): [
  SquarePattern,
  (next: SquarePattern) => void
] {
  return usePreferenceSetting(
    SQUARE_PATTERN_STORAGE_KEY,
    SQUARE_PATTERN_CHANGE_EVENT,
    readSquarePattern
  );
}
