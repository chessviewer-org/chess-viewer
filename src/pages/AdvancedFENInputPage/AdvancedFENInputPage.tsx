import React, { memo, useRef } from 'react';

import { Eye, Globe, List, Sliders } from '@/assets/icons';

import { ExportProgress } from '@/components/features';
import {
  type PageTabGroup,
  PageSidebarLayout,
  PageTabs
} from '@/components/layout';
import {
  ADVANCED_FEN_BREADCRUMB_SCHEMA,
  ADVANCED_FEN_CONFIG,
  getRouteSeo,
  SOFTWARE_APP_SCHEMA
} from '@constants';

import { Seo } from '@ui';
import styles from './styles/advanced-fen-layout.module.scss';
import InteractiveBoardColumn from './components/InteractiveBoardColumn';
import NoValidPositions from './components/NoValidPositions';
import PositionsTab from './components/PositionsTab';
import WizardExportSettings from './components/WizardExportSettings';
import WizardVisualSetup from './components/WizardVisualSetup';
import {
  AdvancedFENInitialProps,
  useAdvancedFEN
} from './hooks/useAdvancedFEN';

const { TABS } = ADVANCED_FEN_CONFIG;

function PreviewExportLayout({
  left,
  right
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className={styles.previewLayout}>
      <div className={styles.previewLeft}>{left}</div>
      <div className={styles.previewRight}>{right}</div>
    </div>
  );
}

const AdvancedFENInputPage = memo(function AdvancedFENInputPage(
  props: AdvancedFENInitialProps
): React.JSX.Element {
  const { state, handlers } = useAdvancedFEN(props);
  const contentRef = useRef<HTMLDivElement>(null);

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

  const interactiveBoard = (
    <InteractiveBoardColumn state={state} handlers={handlers} />
  );

  return (
    <div
      data-page-scroll
      className="bg-bg min-h-full lg:h-screen lg:max-h-screen lg:overflow-hidden"
    >
      <Seo
        {...getRouteSeo('/advanced-fen')}
        schema={[SOFTWARE_APP_SCHEMA, ADVANCED_FEN_BREADCRUMB_SCHEMA]}
      />
      <h1 className="sr-only">Batch FEN Export — Chess Diagram Studio</h1>

      <PageSidebarLayout
        contentRef={contentRef}
        contentLabel="Editor content"
        sidebar={
          <PageTabs
            groups={groups}
            activeId={state.activeTab}
            onSelect={handlers.setActiveTab}
            ariaLabel="Advanced FEN sections"
          />
        }
      >
        <div className="@container flex flex-col h-full">
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
                  left={interactiveBoard}
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
                  left={interactiveBoard}
                  right={
                    <WizardExportSettings state={state} handlers={handlers} />
                  }
                />
              )}
            </div>
          )}
        </div>
      </PageSidebarLayout>

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
