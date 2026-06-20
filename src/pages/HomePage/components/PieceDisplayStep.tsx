import DisplayOptions from '@/components/panels/DisplayOptions/DisplayOptions';
import PieceSelector from '@/components/panels/Fen/PieceSelector/PieceSelector';

import type { HomeStateForExport } from './ExportStudio.types';

/** Props for wizard step 2 — piece set and display option configuration. */
export interface PieceDisplayStepProps {
  homeState: HomeStateForExport;
  /**
   * Strip the section title and the per-control field labels for compact
   * embeddings (e.g. the editor preview settings panel). Defaults to false so
   * the HomePage wizard keeps its full headings.
   */
  hideHeaders?: boolean;
  /**
   * Render only the piece-set selector, dropping the DisplayOptions toggles.
   * The ChessEditor settings panel owns its own Display Options block, so this
   * keeps that panel to the piece-style choice alone. Defaults to false.
   */
  pieceOnly?: boolean;
}

/** Wizard step 2: piece style selector and display option toggles (coords, frame, etc.). */
export default function PieceDisplayStep({
  homeState,
  hideHeaders = false,
  pieceOnly = false
}: PieceDisplayStepProps) {
  return (
    <div className="h-full overflow-y-auto p-3 sm:p-5 lg:p-8 space-y-5 sm:space-y-6">
      {!hideHeaders && (
        <div className="space-y-1">
          <h2 className="text-h2 font-bold text-text-primary">
            Piece Style & Display
          </h2>
          <p className="text-fluid-sm text-text-secondary">
            Configure piece set and display options.
          </p>
        </div>
      )}

      <PieceSelector
        pieceStyle={homeState.pieceStyle}
        setPieceStyle={homeState.setPieceStyle}
        hideLabel={hideHeaders}
      />

      {!pieceOnly && (
        <DisplayOptions
          showCoords={homeState.showCoords}
          setShowCoords={homeState.setShowCoords}
          showCoordinateBorder={homeState.showCoordinateBorder}
          setShowCoordinateBorder={homeState.setShowCoordinateBorder}
          hideLabel={hideHeaders}
        />
      )}
    </div>
  );
}
