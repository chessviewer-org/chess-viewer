import { useCallback, useEffect, useState } from 'react';

import { BoardStylePanel, DisplayOptions } from '@/components/features';
import {
  useBoardPieceSet,
  useDebouncedCommit,
  usePieceImages
} from '@/shared/hooks';
import {
  DEFAULT_DARK_SQUARE,
  DEFAULT_LIGHT_SQUARE,
  PERSIST_DEBOUNCE_MS
} from '@constants';

import { sanitizeHexColor } from '@/shared/utils';
import type { HomeStateForExport } from '../utils/ExportPage.types';
import styles from '../styles/board-style-step.module.scss';
import BoardPreviewCanvas from './BoardPreviewCanvas';

interface BoardStyleStepProps {
  homeState: HomeStateForExport;
}

export default function BoardStyleStep({ homeState }: BoardStyleStepProps) {
  const [lightSquare, setLightSquare] = useState(homeState.lightSquare);
  const [darkSquare, setDarkSquare] = useState(homeState.darkSquare);

  useEffect(
    () => setLightSquare(homeState.lightSquare),
    [homeState.lightSquare]
  );
  useEffect(() => setDarkSquare(homeState.darkSquare), [homeState.darkSquare]);

  const debouncedCommit = useDebouncedCommit(PERSIST_DEBOUNCE_MS);

  const [, setBoardPieceSet] = useBoardPieceSet();
  const { pieceImages, isLoading } = usePieceImages(homeState.pieceStyle);

  const applyPreset = useCallback(
    (light: string, dark: string) => {
      const safeLight = sanitizeHexColor(light, DEFAULT_LIGHT_SQUARE);
      const safeDark = sanitizeHexColor(dark, DEFAULT_DARK_SQUARE);
      setLightSquare(safeLight);
      setDarkSquare(safeDark);
      debouncedCommit(() => {
        homeState.setLightSquare(safeLight);
        homeState.setDarkSquare(safeDark);
      });
    },
    [debouncedCommit, homeState]
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
