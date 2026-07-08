import { memo } from 'react';

import {
  BoardThemePicker,
  PieceGridShared
} from '@/components/features/ColorPicker';
import { usePieceSort } from '@hooks';
import { PIECE_SORT_OPTIONS } from '@constants';

import { CustomSelect } from '@shared/ui';

export interface BoardStylePanelProps {
  lightSquare: string;
  darkSquare: string;
  pieceStyle: string;
  onApplyTheme: (light: string, dark: string) => void;
  onSelectPiece: (id: string) => void;
  /** Max rows for the theme picker grid. Defaults to 3. */
  themeRows?: number;
  /** Rows for the piece grid. Defaults to 2. */
  pieceRows?: number;
}

/**
 * Shared board-style panel: theme colour picker + piece-set grid with sort
 * dropdown. Used by Export Studio (BoardStyleStep), the Advanced FEN wizard
 * (WizardVisualSetup), and anywhere else that needs the same controls.
 *
 * The caller is responsible for persisting / debouncing colour changes.
 */
const BoardStylePanel = memo(function BoardStylePanel({
  lightSquare,
  darkSquare,
  pieceStyle,
  onApplyTheme,
  onSelectPiece,
  themeRows = 3,
  pieceRows = 2
}: BoardStylePanelProps) {
  const { pieceSort, setPieceSort, sortedPieceSets } = usePieceSort();

  return (
    <div className="flex flex-col gap-6">
      <BoardThemePicker
        lightSquare={lightSquare}
        darkSquare={darkSquare}
        onApply={onApplyTheme}
        maxRows={themeRows}
      />

      <div className="border-t border-border lg:hidden" />

      <div>
        <div className="mb-2 flex items-end justify-between gap-3 shrink-0">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Piece set
          </span>
          <div className="w-40 shrink-0">
            <CustomSelect
              value={pieceSort}
              onChange={setPieceSort}
              options={PIECE_SORT_OPTIONS}
            />
          </div>
        </div>
        <PieceGridShared
          sets={sortedPieceSets}
          resetKey={pieceSort}
          pieceStyle={pieceStyle}
          onSelect={onSelectPiece}
          rows={pieceRows}
        />
      </div>
    </div>
  );
});

BoardStylePanel.displayName = 'BoardStylePanel';
export default BoardStylePanel;
