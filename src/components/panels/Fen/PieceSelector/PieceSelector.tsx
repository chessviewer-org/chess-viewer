import { memo } from 'react';

import { PIECE_SETS } from '@constants';

import { SearchableSelect } from '@shared/ui';

/** Props for the `PieceSelector` searchable dropdown. */
interface PieceSelectorProps {
  pieceStyle: string;
  setPieceStyle: (style: string) => void;
  /** Hide the "Piece Style" field label (compact contexts). */
  hideLabel?: boolean;
}

/** Searchable select for choosing the active piece set. */
function PieceSelector({
  pieceStyle,
  setPieceStyle,
  hideLabel = false
}: PieceSelectorProps) {
  return (
    <SearchableSelect
      options={PIECE_SETS}
      value={pieceStyle}
      onChange={setPieceStyle}
      {...(hideLabel ? {} : { label: 'Piece Style' })}
      placeholder="Search piece style..."
      emptyMessage="No matching piece styles"
    />
  );
}
export default memo(PieceSelector);
