import { memo } from 'react';
import { SearchableSelect } from '@shared/ui';
import { PIECE_SETS } from '@constants';

/** Props for the `PieceSelector` searchable dropdown. */
interface PieceSelectorProps {
  pieceStyle: string;
  setPieceStyle: (style: string) => void;
}

/** Searchable select for choosing the active piece set. */
function PieceSelector({ pieceStyle, setPieceStyle }: PieceSelectorProps) {
  return (
    <SearchableSelect
      options={PIECE_SETS}
      value={pieceStyle}
      onChange={setPieceStyle}
      label="Piece Style"
      placeholder="Search piece style..."
      emptyMessage="No matching piece styles"
    />
  );
}
export default memo(PieceSelector);
