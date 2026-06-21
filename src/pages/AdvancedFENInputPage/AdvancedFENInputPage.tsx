import React, { memo } from 'react';

import { Eye, Globe, List, Sliders } from 'lucide-react';

import { ExportProgress } from '@/components/features';
import { type PageTabGroup, PageTabs } from '@/components/layout';
import {
  ADVANCED_FEN_CONFIG,
  getRouteSeo,
  SOFTWARE_APP_SCHEMA
} from '@constants';

import { Seo } from '@shared/ui';
import NoValidPositions from './components/NoValidPositions';
import PositionsTab from './components/PositionsTab';
import PreviewPlayerColumn from './components/PreviewPlayerColumn';
import WizardExportSettings from './components/WizardExportSettings';
import WizardVisualSetup from './components/WizardVisualSetup';
import {
  AdvancedFENInitialProps,
  useAdvancedFEN
} from './hooks/useAdvancedFEN';

const { TABS } = ADVANCED_FEN_CONFIG;

/** Shared two-column layout for preview/export tabs. */
function PreviewExportLayout({
  left,
  right
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-8 h-full">
      <div className="flex flex-col lg:w-2/5 w-full gap-6 order-1 lg:sticky lg:top-8">
        {left}
      </div>
      <div className="flex flex-col lg:w-3/5 w-full order-2 min-h-125">
        {right}
      </div>
    </div>
  );
}

/** Batch FEN studio page with positions list, visual setup wizard, and multi-format export. */
const AdvancedFENInputPage = memo(function AdvancedFENInputPage(
  props: AdvancedFENInitialProps
): React.JSX.Element {
  const { state, handlers } = useAdvancedFEN(props);

  const groups: PageTabGroup[] = [
    {
      items: [{ id: TABS.POSITIONS, icon: List, label: 'Positions' }]
    },
    {
      id: 'preview-export-group',
      label: 'Preview / Export',
      icon: Eye,
      isCollapsible: true,
      items: [
        { id: 'preview-style', icon: Sliders, label: 'Board Style & Preview' },
        { id: 'export-settings', icon: Globe, label: 'Export Settings' }
      ]
    }
  ];

  const previewColumn = (
    <PreviewPlayerColumn state={state} handlers={handlers} />
  );

  return (
    <div
      data-page-scroll
      className="min-h-full bg-bg md:h-full md:max-h-full md:overflow-y-auto"
    >
      <Seo {...getRouteSeo('/advanced-fen')} schema={SOFTWARE_APP_SCHEMA} />

      <div className="page-container flex flex-col gap-6 py-6 sm:py-8 md:flex-row md:gap-8 lg:gap-10">
        <div className="shrink-0 mb-6 md:mb-0 md:border-r md:border-border md:pr-8 md:w-52 lg:w-56">
          <div className="md:sticky md:top-8">
            <PageTabs
              groups={groups}
              activeId={state.activeTab}
              onSelect={handlers.setActiveTab}
              ariaLabel="Advanced FEN sections"
            />
          </div>
        </div>

        <div
          role="region"
          aria-label="Editor content"
          className="min-w-0 flex-1"
        >
          {state.activeTab === TABS.POSITIONS && (
            <PositionsTab
              fens={state.fens}
              displayFensCount={state.displayFensCount}
              fenErrors={state.fenErrors}
              duplicateWarning={state.duplicateWarning}
              favorites={state.favorites}
              pastedIndex={state.pastedIndex}
              onUpdateFen={handlers.updateFen}
              onRemoveFen={handlers.removeFenInput}
              onToggleFavorite={handlers.toggleFavorite}
              onPasteFEN={handlers.handlePasteFEN}
            />
          )}

          {state.activeTab === 'preview-style' && (
            <div className="tab-content w-full h-full">
              {!state.hasValidFens ? (
                <NoValidPositions
                  onGoToPositions={handlers.handleShowPositionsTab}
                />
              ) : (
                <PreviewExportLayout
                  left={previewColumn}
                  right={
                    <WizardVisualSetup state={state} handlers={handlers} />
                  }
                />
              )}
            </div>
          )}

          {state.activeTab === 'export-settings' && (
            <div className="tab-content w-full h-full">
              {!state.hasValidFens ? (
                <NoValidPositions
                  onGoToPositions={handlers.handleShowPositionsTab}
                />
              ) : (
                <PreviewExportLayout
                  left={previewColumn}
                  right={
                    <WizardExportSettings state={state} handlers={handlers} />
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>

      {state.exportState.isExporting && (
        <ExportProgress
          isExporting={state.exportState.isExporting}
          progress={state.exportState.progress}
          currentFormat={state.exportState.currentFormat}
          statusText={state.exportState.status}
          config={{ ...state.exportConfig, fen: state.exportConfig.fen || '' }}
          isPaused={state.isPaused}
          onPause={handlers.handlePauseExport}
          onResume={handlers.handleResumeExport}
          onCancel={handlers.handleCancelExportProgress}
        />
      )}
    </div>
  );
});

AdvancedFENInputPage.displayName = 'AdvancedFENInputPage';
export default AdvancedFENInputPage;
