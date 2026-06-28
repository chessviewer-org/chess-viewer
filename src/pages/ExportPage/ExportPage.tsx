import { useCallback, useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Download, LayoutGrid } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import { type PageTabGroup, PageTabs } from '@/components/layout';
import { useHomeExport, useNotifications, usePieceImages } from '@hooks';

import { safeJSONParse } from '@utils';
import {
  EXPORT_BREADCRUMB_SCHEMA,
  EXPORT_HOWTO_SCHEMA,
  getRouteSeo
} from '@constants';
import { Seo } from '@shared/ui';
import BoardStyleStep from './components/BoardStyleStep';
import ExportSettingsStep from './components/ExportSettingsStep';
import {
  type BatchExportOverrides,
  type HomeStateForExport
} from './ExportPage.types';
import { useExportWizard } from './hooks/useExportWizard';

const TABS: PageTabGroup[] = [
  {
    items: [
      { id: 'board-style', label: 'Board Style', icon: LayoutGrid },
      { id: 'export-settings', label: 'Export Settings', icon: Download }
    ]
  }
];

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
  const location = useLocation();
  const routerState = location.state as ExportPageConfig | null;

  // Persist to sessionStorage so a hard refresh keeps the config.
  // Runs in an effect (not during render) to comply with React's render-purity rule.
  useEffect(() => {
    if (!routerState) return;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(routerState));
    } catch {
      // sessionStorage unavailable — no-op
    }
  }, [routerState]);

  const initialState: ExportPageConfig | null =
    routerState ??
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
            to="/"
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

  // Local state for the export page, initialized from the config passed via router state.
  const [fen] = useState(config.fen); // FEN is read-only here
  const [flipped] = useState(config.flipped); // Flipped is read-only here
  const [pieceStyle, setPieceStyle] = useState(config.pieceStyle);
  const [showCoords, setShowCoords] = useState(config.showCoords);
  const [showCoordinateBorder, setShowCoordinateBorder] = useState(
    config.showCoordinateBorder
  );
  const [showThinFrame, setShowThinFrame] = useState(config.showThinFrame);
  const [lightSquare, setLightSquare] = useState(config.lightSquare);
  const [darkSquare, setDarkSquare] = useState(config.darkSquare);
  const [exportQuality, setExportQuality] = useState(config.exportQuality);
  const [boardSize, setBoardSize] = useState(config.boardSize);

  // Initialize the export API
  const exportApi = useHomeExport({
    fen,
    fileName: config.fileName,
    boardSize,
    exportQuality,
    showCoords,
    showCoordinateBorder,
    showThinFrame,
    lightSquare,
    darkSquare,
    flipped,
    saveExportFen: () => {},
    notify: { success, error, info }
  });

  const { pieceImages, isLoading } = usePieceImages(pieceStyle);

  useEffect(() => {
    if (!isLoading && pieceImages) {
      exportApi.handlePieceImagesChange(pieceImages);
    }
  }, [pieceImages, isLoading, exportApi]);

  const homeState: HomeStateForExport = {
    fen,
    flipped,
    pieceStyle,
    setPieceStyle,
    showCoords,
    setShowCoords,
    showCoordinateBorder,
    setShowCoordinateBorder,
    showThinFrame,
    setShowThinFrame,
    lightSquare,
    setLightSquare,
    darkSquare,
    setDarkSquare,
    exportQuality,
    setExportQuality,
    boardSize,
    setBoardSize,
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
    setBoardSize(wizard.activeBoardSize);
    setExportQuality(wizard.resolution);
    void exportApi.handleBatchExport(selectedFormats, names, overrides);
  }, [exportApi, wizard]);

  return (
    <div className="flex flex-col bg-bg min-h-full lg:h-full lg:overflow-hidden">
      <div className="page-container flex flex-col gap-6 py-6 sm:py-10 md:flex-row md:gap-8 lg:gap-10 h-full">
        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div className="shrink-0 mb-6 md:mb-0 md:border-r md:border-border md:pr-8 md:w-52 lg:w-56">
          <div className="md:sticky md:top-10 flex flex-col gap-6">
            <PageTabs
              groups={TABS}
              activeId={activeTab}
              onSelect={(id) =>
                setActiveTab(id as 'board-style' | 'export-settings')
              }
              ariaLabel="Export Studio sections"
            />
          </div>
        </div>

        {/* ── Content area ──────────────────────────────────────────────────── */}
        {/* `@container` makes the steps below react to THIS wrapper's width, not
            the viewport. The sidebar eats ~208–236px, so a viewport `lg:` would
            fire while the content is still narrow. Container queries inside the
            steps (`@3xl:` ≈ 768px content width) switch board↔panel at the point
            the content can actually hold both side by side. */}
        <div className="@container min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'board-style' && (
              <motion.div
                key="board-style"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="h-full"
              >
                <BoardStyleStep homeState={homeState} />
              </motion.div>
            )}

            {activeTab === 'export-settings' && (
              <motion.div
                key="export-settings"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="h-full"
              >
                <ExportSettingsStep wizard={wizard} onExport={handleFinish} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
