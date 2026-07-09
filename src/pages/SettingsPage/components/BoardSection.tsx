import { memo, useCallback, useEffect, useState } from 'react';

import { LayoutGrid } from '@/assets/icons';

import { MiniPreview } from '@/components/board';
import {
  BoardThemePicker,
  PieceGridShared as PieceGrid
} from '@/components/features/ColorPicker';
import {
  useBoardPieceSet,
  useDebouncedCommit,
  useLocalStorage,
  usePieceImages,
  usePieceSort
} from '@hooks';
import {
  BOARD_COLOR_KEYS,
  DEFAULT_DARK_SQUARE,
  DEFAULT_LIGHT_SQUARE,
  PERSIST_DEBOUNCE_MS,
  PIECE_SORT_OPTIONS,
  STARTING_FEN
} from '@constants';

import { sanitizeHexColor } from '@utils';
import { CustomSelect } from '@ui';
import { SettingsBlock, SettingsHeading } from './parts';

const BoardSection = memo(function BoardSection() {
  const [storedLight, setStoredLight] = useLocalStorage<string>(
    BOARD_COLOR_KEYS.LIGHT,
    DEFAULT_LIGHT_SQUARE
  );
  const [storedDark, setStoredDark] = useLocalStorage<string>(
    BOARD_COLOR_KEYS.DARK,
    DEFAULT_DARK_SQUARE
  );

  const [lightSquare, setLightSquare] = useState(storedLight);
  const [darkSquare, setDarkSquare] = useState(storedDark);

  useEffect(() => setLightSquare(storedLight), [storedLight]);
  useEffect(() => setDarkSquare(storedDark), [storedDark]);

  const debouncedCommit = useDebouncedCommit(PERSIST_DEBOUNCE_MS);

  const [pieceStyle, setPieceStyle] = useBoardPieceSet();
  const { pieceImages, isLoading } = usePieceImages(pieceStyle);
  const { pieceSort, setPieceSort, sortedPieceSets } = usePieceSort();

  const applyPreset = useCallback(
    (light: string, dark: string) => {
      const safeLight = sanitizeHexColor(light, DEFAULT_LIGHT_SQUARE);
      const safeDark = sanitizeHexColor(dark, DEFAULT_DARK_SQUARE);
      setLightSquare(safeLight);
      setDarkSquare(safeDark);
      debouncedCommit(() => {
        setStoredLight(safeLight);
        setStoredDark(safeDark);
      });
    },
    [debouncedCommit, setStoredLight, setStoredDark]
  );

  return (
    <div className="space-y-6 stagger-children">
      <SettingsHeading
        icon={LayoutGrid}
        title="Board Style"
        description="Colours and pieces for the board and your exports. Saved on this device, and synced when signed in."
      />

      <SettingsBlock title="Square colours">
        <div className="flex flex-col gap-5 md:flex-row md:items-stretch md:gap-6">
          <div className="mx-auto w-full max-w-[24rem] shrink-0 overflow-hidden md:mx-0 md:w-80 lg:w-96">
            <MiniPreview
              fen={STARTING_FEN}
              lightSquare={lightSquare}
              darkSquare={darkSquare}
              pieceImages={pieceImages}
              piecesLoading={isLoading}
              size={384}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <BoardThemePicker
              lightSquare={lightSquare}
              darkSquare={darkSquare}
              onApply={applyPreset}
            />
          </div>
        </div>
      </SettingsBlock>

      <SettingsBlock
        title="Piece set"
        action={
          <div className="w-44">
            <CustomSelect
              value={pieceSort}
              onChange={setPieceSort}
              options={PIECE_SORT_OPTIONS}
            />
          </div>
        }
      >
        <PieceGrid
          sets={sortedPieceSets}
          resetKey={pieceSort}
          pieceStyle={pieceStyle}
          onSelect={setPieceStyle}
        />
      </SettingsBlock>
    </div>
  );
});

BoardSection.displayName = 'BoardSection';
export default BoardSection;
