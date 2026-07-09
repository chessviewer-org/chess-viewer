import { memo } from 'react';

import { BoardStylePanel } from '@/components/features';

import type { useAdvancedFEN } from '../hooks/useAdvancedFEN';

// Types
type AdvancedFENReturn = ReturnType<typeof useAdvancedFEN>;

interface WizardVisualSetupProps {
  state: AdvancedFENReturn['state'];
  handlers: AdvancedFENReturn['handlers'];
}

const WizardVisualSetup = memo(function WizardVisualSetup({
  state,
  handlers
}: WizardVisualSetupProps) {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn h-full">
      <BoardStylePanel
        lightSquare={state.theme.lightSquare}
        darkSquare={state.theme.darkSquare}
        pieceStyle={state.pieceStyle}
        onApplyTheme={handlers.handleApplyPresetTheme}
        onSelectPiece={handlers.setPieceStyle}
      />
    </div>
  );
});

WizardVisualSetup.displayName = 'WizardVisualSetup';
export default WizardVisualSetup;
