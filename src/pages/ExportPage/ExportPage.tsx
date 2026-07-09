import { useCallback, useEffect, useRef, useState } from 'react';

import { ArrowLeft, Download, LayoutGrid } from '@/assets/icons';
import { Link } from 'wouter';

import {
  type PageTabGroup,
  PageSidebarLayout,
  PageTabs
} from '@/components/layout';
import {
  useHomeExport,
  useNotifications,
  usePieceImages,
  useSearchParams
} from '@hooks';

import { safeJSONParse } from '@utils';
import {
  EXPORT_BREADCRUMB_SCHEMA,
  EXPORT_HOWTO_SCHEMA,
  getRouteSeo
} from '@constants';
import { Seo } from '@ui';
import BoardStyleStep from './components/BoardStyleStep';
import ExportSettingsStep from './components/ExportSettingsStep';
import {
  type BatchExportOverrides,
  type HomeStateForExport
} from './utils/ExportPage.types';
import { useExportWizard } from './hooks/useExportWizard';

// Constants
const TABS: PageTabGroup[] = [
  {
    items: [
      { id: 'board-style', label: 'Board Style', icon: LayoutGrid },
      { id: 'export-settings', label: 'Export Settings', icon: Download }
    ]
  }
];

// Types
export interface ExportPageConfig {
  fen: string;
  pieceStyle: string;
  showCoords: boolean;
  showCoordinateBorder: boolean;
  showThinFrame: boolean;
  lightSquare: string;
  darkSquare: string;
  exportQuality: number;
  boardSize: number;
  flipped: boolean;
  fileName: string;
}

const SESSION_KEY = 'cv_export_config';

const ExportPage = () => {
  const initialState: ExportPageConfig | null =
    safeJSONParse<ExportPageConfig | null>(
      sessionStorage.getItem(SESSION_KEY),
      null
    );

  if (!initialState) {
    return (
      <>
        <Seo
          {...getRouteSeo('/export')}
          schema={[EXPORT_HOWTO_SCHEMA, EXPORT_BREADCRUMB_SCHEMA]}
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
          <div className="flex flex-col items-center gap-3">
            <Download
              className="w-12 h-12 text-text-secondary/40"
              strokeWidth={1.5}
            />
            <h1 className="sr-only">Export Chess Diagram</h1>
            <p className="text-xl font-semibold text-text-primary">
              No board loaded
            </p>
            <p className="text-text-secondary text-sm max-w-xs">
              Open a position from the editor to export it as a high-resolution
              image.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent text-bg hover:bg-accent-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Editor
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo
        {...getRouteSeo('/export')}
        schema={[EXPORT_HOWTO_SCHEMA, EXPORT_BREADCRUMB_SCHEMA]}
      />
      <ExportPageInner config={initialState} />
    </>
  );
};

const ExportPageInner = ({ config }: { config: ExportPageConfig }) => {
  const wizard = useExportWizard();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState<
    'board-style' | 'export-settings'
  >(
    (searchParams.get('tab') as 'board-style' | 'export-settings') ||
      'board-style'
  );

  const setActiveTab = useCallback(
    (tab: 'board-style' | 'export-settings') => {
      setActiveTabState(tab);
      setSearchParams(
        (prev) => {
          prev.set('tab', tab);
          return prev;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    const tab = searchParams.get('tab') as 'board-style' | 'export-settings';
    if (tab && tab !== activeTab) {
      setActiveTabState(tab);
    }
  }, [searchParams, activeTab]);

  const { success, error, info } = useNotifications();

  const [boardConfig, setBoardConfig] = useState(config);
  const updateConfig = <K extends keyof ExportPageConfig>(
    key: K,
    value: ExportPageConfig[K]
  ) => setBoardConfig((prev) => ({ ...prev, [key]: value }));

  const exportApi = useHomeExport({
    ...boardConfig,
    fileName: config.fileName,
    saveExportFen: () => {},
    notify: { success, error, info }
  });

  const { pieceImages, isLoading } = usePieceImages(boardConfig.pieceStyle);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && pieceImages) {
      exportApi.handlePieceImagesChange(pieceImages);
    }
  }, [pieceImages, isLoading, exportApi]);

  const homeState: HomeStateForExport = {
    ...boardConfig,
    setPieceStyle: (v) => updateConfig('pieceStyle', v),
    setShowCoords: (v) => updateConfig('showCoords', v),
    setShowCoordinateBorder: (v) => updateConfig('showCoordinateBorder', v),
    setShowThinFrame: (v) => updateConfig('showThinFrame', v),
    setLightSquare: (v) => updateConfig('lightSquare', v),
    setDarkSquare: (v) => updateConfig('darkSquare', v),
    setExportQuality: (v) => updateConfig('exportQuality', v),
    setBoardSize: (v) => updateConfig('boardSize', v),
    handleBatchExport: exportApi.handleBatchExport
  };

  const handleFinish = useCallback(() => {
    const selectedFormats = [...wizard.selectedFormats];
    const names = selectedFormats.map(
      (format) => wizard.resolvedFileNames[format]
    );
    const overrides: BatchExportOverrides = {
      boardSize: wizard.activeBoardSize,
      exportQuality: wizard.resolution
    };
    updateConfig('boardSize', wizard.activeBoardSize);
    updateConfig('exportQuality', wizard.resolution);
    void exportApi.handleBatchExport(selectedFormats, names, overrides);
  }, [exportApi, wizard]);

  return (
    <div className="flex flex-col bg-bg min-h-full lg:h-full lg:overflow-hidden">
      <PageSidebarLayout
        contentRef={contentRef}
        contentLabel="Export Studio"
        sidebar={
          <PageTabs
            groups={TABS}
            activeId={activeTab}
            onSelect={(id) =>
              setActiveTab(id as 'board-style' | 'export-settings')
            }
            ariaLabel="Export Studio sections"
          />
        }
      >
        {activeTab === 'board-style' && (
          <div className="workspace-container h-full animate-page-enter">
            <BoardStyleStep homeState={homeState} />
          </div>
        )}
        {activeTab === 'export-settings' && (
          <div className="h-full animate-page-enter">
            <ExportSettingsStep wizard={wizard} onExport={handleFinish} />
          </div>
        )}
      </PageSidebarLayout>
    </div>
  );
};

export default ExportPage;
