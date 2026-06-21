import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  BoardThemePicker,
  PieceGridShared,
  type PieceSort,
  sortPieceSets
} from '@/components/features/ColorPicker';
import DisplayOptions from '@/components/features/DisplayOptions/DisplayOptions';
import { useBoardPieceSet } from '@/pages/settings/useBoardPieceSet';
import { useLocalStorage, usePieceImages } from '@hooks';

import { sanitizeHexColor } from '@utils';
import { CustomSelect } from '@shared/ui';
import type { HomeStateForExport } from '../ExportPage.types';
import BoardPreviewCanvas from './BoardPreviewCanvas';

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
    <div className="flex h-full flex-col lg:flex-row overflow-y-auto p-4 lg:p-5 gap-6">
      {/* ── Left Side (Board + Display Options on Desktop) ──────────────── */}
      <div className="flex flex-col items-center lg:w-2/5 lg:sticky lg:top-0 gap-6 order-1">
        <div className="w-full max-w-[500px] lg:max-w-[600px]">
          <BoardPreviewCanvas
            fen={homeState.fen}
            lightSquare={lightSquare}
            darkSquare={darkSquare}
            pieceImages={pieceImages}
            piecesLoading={isLoading}
            showCoords={homeState.showCoords}
            showThinFrame={homeState.showThinFrame}
            flipped={homeState.flipped}
          />
        </div>

        <div className="hidden lg:block w-full max-w-[500px] lg:max-w-[600px]">
          <DisplayOptions
            showCoords={homeState.showCoords}
            setShowCoords={homeState.setShowCoords}
            showThinFrame={homeState.showThinFrame}
            setShowThinFrame={homeState.setShowThinFrame}
            hideLabel={true}
          />
        </div>
      </div>

      <div className="border-t border-border lg:hidden order-2" />

      {/* ── Right Side (Theme Picker + Piece Grid) ──────────────────────── */}
      <div className="flex flex-col gap-6 lg:w-3/5 order-3">
        <div>
          <BoardThemePicker
            lightSquare={lightSquare}
            darkSquare={darkSquare}
            onApply={applyPreset}
            maxRows={3}
          />
        </div>

        <div className="border-t border-border lg:hidden" />

        <div>
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

      <div className="border-t border-border lg:hidden order-4" />

      {/* ── Mobile Display Options (Bottom) ─────────────────────────────── */}
      <div className="lg:hidden order-5">
        <DisplayOptions
          showCoords={homeState.showCoords}
          setShowCoords={homeState.setShowCoords}
          showThinFrame={homeState.showThinFrame}
          setShowThinFrame={homeState.setShowThinFrame}
          hideLabel={true}
        />
      </div>
    </div>
  );
}
