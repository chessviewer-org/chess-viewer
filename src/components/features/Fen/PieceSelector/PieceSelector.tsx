import { SearchableSelect } from '@/components/ui';
import { PIECE_SETS } from '@/constants';

interface PieceSelectorProps {
  pieceStyle: string;
  setPieceStyle: (style: string) => void;
}

/**
 * @param {PieceSelectorProps} props
 * @returns {JSX.Element}
 */
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
export default PieceSelector;
