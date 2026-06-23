import { useCallback, useEffect, useRef, useState } from 'react';

import { BoardStylePanel, DisplayOptions } from '@/components/features';
import { useBoardPieceSet, usePieceImages } from '@hooks';
import {
  DEFAULT_DARK_SQUARE,
  DEFAULT_LIGHT_SQUARE,
  PERSIST_DEBOUNCE_MS
} from '@constants';

import { sanitizeHexColor } from '@utils';
import type { HomeStateForExport } from '../ExportPage.types';
import BoardPreviewCanvas from './BoardPreviewCanvas';

interface BoardStyleStepProps {
  homeState: HomeStateForExport;
}

/**
 * ExportStudio step 1: board style editor.
 *
 * Left panel (40%): live board preview pinned to the top, with the compact
 * Display Options block beneath a separator. Right panel (60%): shared
 * BoardStylePanel (theme picker + piece-set grid).
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

  const applyPreset = useCallback(
    (light: string, dark: string) => {
      const safeLight = sanitizeHexColor(light, DEFAULT_LIGHT_SQUARE);
      const safeDark = sanitizeHexColor(dark, DEFAULT_DARK_SQUARE);
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
        <div className="w-full max-w-[440px] lg:max-w-[500px]">
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

        <div className="hidden lg:block w-full max-w-[440px] lg:max-w-[500px]">
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
        <BoardStylePanel
          lightSquare={lightSquare}
          darkSquare={darkSquare}
          pieceStyle={homeState.pieceStyle}
          onApplyTheme={applyPreset}
          onSelectPiece={handlePieceSelect}
        />
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
