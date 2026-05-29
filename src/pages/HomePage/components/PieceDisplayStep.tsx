import DisplayOptions from '@/components/features/DisplayOptions/DisplayOptions';
import PieceSelector from '@/components/features/Fen/PieceSelector/PieceSelector';

import type { HomeStateForExport } from './ExportStudio.types';

/** Props for wizard step 2 — piece set and display option configuration. */
export interface PieceDisplayStepProps {
  homeState: HomeStateForExport;
}

/** Wizard step 2: piece style selector and display option toggles (coords, frame, etc.). */
export default function PieceDisplayStep({ homeState }: PieceDisplayStepProps) {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
          Piece Style & Display
        </h2>
        <p className="text-sm text-text-secondary">
          Configure piece set and display options.
        </p>
      </div>

      <PieceSelector
        pieceStyle={homeState.pieceStyle}
        setPieceStyle={homeState.setPieceStyle}
      />

      <DisplayOptions
        showCoords={homeState.showCoords}
        setShowCoords={homeState.setShowCoords}
        showCoordinateBorder={homeState.showCoordinateBorder}
        setShowCoordinateBorder={homeState.setShowCoordinateBorder}
        showThinFrame={homeState.showThinFrame}
        setShowThinFrame={homeState.setShowThinFrame}
        exportQuality={homeState.exportQuality}
      />
    </div>
  );
}
