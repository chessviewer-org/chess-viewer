import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  BoardThemePickerShared,
  PieceGridShared,
  type PieceSort,
  sortPieceSets
} from '@/components/board-style';
import DisplayOptions from '@/components/panels/DisplayOptions/DisplayOptions';
import { useBoardPieceSet } from '@/pages/settings/useBoardPieceSet';
import { useLocalStorage, usePieceImages } from '@hooks';

import { sanitizeHexColor } from '@utils';
import { CustomSelect } from '@shared/ui';
import BoardPreviewCanvas from './BoardPreviewCanvas';
import type { HomeStateForExport } from './ExportStudio.types';

const DEFAULT_LIGHT = '#f0d9b5';
const DEFAULT_DARK = '#b58863';

/** Delay (ms) before a live colour drag is written to homeState / storage. */
const PERSIST_DEBOUNCE_MS = 350;

const PIECE_SORT_OPTIONS: Array<{ value: PieceSort; label: string }> = [
  { value: 'popular', label: 'Most popular' },
  { value: 'name', label: 'Name (A–Z)' }
];

interface BoardStyleStepProps {
  homeState: HomeStateForExport;
}

/**
 * ExportStudio step 1: board style editor.
 *
 * Left panel (40%): live board preview pinned to the top, with the compact
 * Display Options block beneath a separator. Right panel (60%): theme picker
 * and piece-set grid — no inner scroll, the panel is sized to fit.
 *
 * Colour changes are debounced before writing back to homeState to keep the
 * live colour drag smooth.
 */
export default function BoardStyleStep({ homeState }: BoardStyleStepProps) {
  const [lightSquare, setLightSquare] = useState(homeState.lightSquare);
  const [darkSquare, setDarkSquare] = useState(homeState.darkSquare);

  useEffect(
    () => setLightSquare(homeState.lightSquare),
    [homeState.lightSquare]
  );
  useEffect(() => setDarkSquare(homeState.darkSquare), [homeState.darkSquare]);

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    },
    []
  );

  const [, setBoardPieceSet] = useBoardPieceSet();
  const { pieceImages, isLoading } = usePieceImages(homeState.pieceStyle);

  const [pieceSort, setPieceSort] = useLocalStorage<PieceSort>(
    'cv_piece_sort',
    'popular'
  );
  const sortedPieceSets = useMemo(() => sortPieceSets(pieceSort), [pieceSort]);

  const applyPreset = useCallback(
    (light: string, dark: string) => {
      const safeLight = sanitizeHexColor(light, DEFAULT_LIGHT);
      const safeDark = sanitizeHexColor(dark, DEFAULT_DARK);
      setLightSquare(safeLight);
      setDarkSquare(safeDark);
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => {
        homeState.setLightSquare(safeLight);
        homeState.setDarkSquare(safeDark);
      }, PERSIST_DEBOUNCE_MS);
    },
    [homeState]
  );

  const handlePieceSelect = useCallback(
    (id: string) => {
      homeState.setPieceStyle(id);
      setBoardPieceSet(id);
    },
    [homeState, setBoardPieceSet]
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: live board preview + display options ─────────────────────── */}
      <div className="hidden md:flex flex-col h-full w-[40%] shrink-0 p-4 lg:p-5 gap-4">
        <div className="flex items-start justify-center">
          <div className="w-full max-w-sm lg:max-w-md">
            <BoardPreviewCanvas
              fen={homeState.fen}
              lightSquare={lightSquare}
              darkSquare={darkSquare}
              pieceImages={pieceImages}
              piecesLoading={isLoading}
              showCoords={homeState.showCoords}
              showCoordinateBorder={homeState.showCoordinateBorder}
              flipped={homeState.flipped}
            />
          </div>
        </div>
        <div className="border-t border-border pt-3 shrink-0">
          <DisplayOptions
            showCoords={homeState.showCoords}
            setShowCoords={homeState.setShowCoords}
            showCoordinateBorder={homeState.showCoordinateBorder}
            setShowCoordinateBorder={homeState.setShowCoordinateBorder}
            hideLabel={true}
          />
        </div>
      </div>

      {/* ── Right: theme + piece set ───────────────────────────────────────── */}
      <div className="flex flex-1 w-full flex-col h-full gap-3 overflow-hidden p-3 pb-6 sm:p-4 sm:pb-8 lg:p-5 lg:pb-8">
        <div className="flex-1 min-h-0">
          <BoardThemePickerShared
            lightSquare={lightSquare}
            darkSquare={darkSquare}
            onApply={applyPreset}
            maxRows={3}
          />
        </div>

        <div className="shrink-0 border-t border-border/40 pt-3">
          <div className="mb-2 flex items-end justify-between gap-3">
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
            pieceStyle={homeState.pieceStyle}
            onSelect={handlePieceSelect}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
