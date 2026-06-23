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
import styles from './board-style-step.module.scss';
import BoardPreviewCanvas from './BoardPreviewCanvas';

interface BoardStyleStepProps {
  homeState: HomeStateForExport;
}

/**
 * ExportStudio step 1: board style editor.
 *
 * Layout reacts to the CONTENT container width (the `@container` wrapper in
 * ExportPage), NOT the viewport — the sidebar steals ~208–236px so a viewport
 * breakpoint would switch at the wrong moment.
 *
 *   container < 768px (`@3xl`) : single column — board → display options →
 *                                theme picker, so the user sees themes directly
 *                                below the board they apply them to.
 *   container ≥ 768px (`@3xl`) : board (40%, sticky) on the left, theme picker
 *                                (60%) on the right.
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
    <div className={styles.root}>
      {/* ── Left Side (Board + Display Options when side-by-side) ───────── */}
      <div className={styles.boardCol}>
        <div className={styles.boardWrap}>
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

        {/* Display options ride with the board only when side-by-side; in the
            single column they move below the board (order-2) so the theme
            picker can sit directly under the board (order-3). */}
        <div className={styles.displayBeside}>
          <DisplayOptions
            showCoords={homeState.showCoords}
            setShowCoords={homeState.setShowCoords}
            showThinFrame={homeState.showThinFrame}
            setShowThinFrame={homeState.setShowThinFrame}
            hideLabel={true}
          />
        </div>
      </div>

      {/* ── Single-column Display Options (directly under the board) ────── */}
      <div className={styles.displayStacked}>
        <DisplayOptions
          showCoords={homeState.showCoords}
          setShowCoords={homeState.setShowCoords}
          showThinFrame={homeState.showThinFrame}
          setShowThinFrame={homeState.setShowThinFrame}
          hideLabel={true}
        />
      </div>

      <div className={styles.divider} />

      {/* ── Right Side (Theme Picker + Piece Grid) ──────────────────────── */}
      {/* In the single column this sits right below the board + display
          controls, so themes are seen relative to the board. */}
      <div className={styles.themeCol}>
        <BoardStylePanel
          lightSquare={lightSquare}
          darkSquare={darkSquare}
          pieceStyle={homeState.pieceStyle}
          onApplyTheme={applyPreset}
          onSelectPiece={handlePieceSelect}
        />
      </div>
    </div>
  );
}
