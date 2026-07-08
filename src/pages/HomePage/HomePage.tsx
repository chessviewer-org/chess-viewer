import React from 'react';

import { useLocation } from 'wouter';

import { ExportProgress, FenToolbar } from '@/components/features';
import { ChessEditor } from '@/components/interactions';
import {
  getRouteSeo,
  HOME_FAQ_SCHEMA,
  SOFTWARE_APP_SCHEMA,
  WEBSITE_SCHEMA
} from '@constants';

import { NotificationContainer, Seo } from '@shared/ui';
import { useHome } from './hooks/useHome';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const HomePage: React.FC = () => {
  const home = useHome();
  const [, setLocation] = useLocation();

  const handleDownloadClick = () => {
    sessionStorage.setItem(
      'cv_export_config',
      JSON.stringify({
        fen: home.fen,
        pieceStyle: home.pieceStyle,
        showCoords: home.showCoords,
        showCoordinateBorder: home.showCoordinateBorder,
        showThinFrame: home.showThinFrame,
        lightSquare: home.lightSquare,
        darkSquare: home.darkSquare,
        exportQuality: home.exportQuality,
        boardSize: home.boardSize,
        flipped: home.flipped,
        fileName: home.fileName
      })
    );
    setLocation('/export');
  };

  const isCustomFen = home.fen && home.fen !== STARTING_FEN;
  const dynamicParams = isCustomFen
    ? `?fen=${encodeURIComponent(home.fen)}`
    : undefined;

  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') ||
    'https://placeholder.supabase.co';
  const dynamicOgImage = isCustomFen
    ? `${supabaseUrl}/functions/v1/og-image${dynamicParams}`
    : undefined;

  return (
    <>
      <Seo
        {...getRouteSeo('/')}
        dynamicParams={dynamicParams}
        image={dynamicOgImage ?? getRouteSeo('/').image}
        schema={[WEBSITE_SCHEMA, SOFTWARE_APP_SCHEMA, HOME_FAQ_SCHEMA]}
      />
      <h1 className="sr-only">
        Free Chess Diagram Generator — FEN to PNG, JPEG &amp; SVG
      </h1>
      <div className="page-container w-full bg-bg py-2 overflow-x-hidden min-h-full lg:h-full lg:overflow-hidden flex flex-col lg:justify-center">
        <div className="flex flex-col gap-fluid-xs lg:gap-3 pt-1.5 lg:pt-0">
          <div className="min-w-0">
            <FenToolbar
              fen={home.fen}
              setFen={home.setFen}
              addToFavoritesRef={home.addToFavoritesRef}
              onFavoriteStatusChange={home.setIsFavorite}
              saveManualFen={home.saveManualFen}
              saveExportFen={home.saveExportFen}
              addCurrentToFavorites={home.addCurrentToFavorites}
              onNotification={home.handleNotification}
            />
          </div>
          <div className="w-full">
            <div className="workspace-container bg-surface border border-border/40 rounded-xl p-fluid-xs sm:p-fluid-sm overflow-x-hidden lg:overflow-hidden">
              <ChessEditor
                fen={home.fen}
                onFenChange={home.handleEditorFenChange}
                pieceStyle={home.pieceStyle}
                showCoords={home.showCoords}
                setShowCoords={home.setShowCoords}
                showThinFrame={home.showThinFrame}
                setShowThinFrame={home.setShowThinFrame}
                exportQuality={home.exportQuality}
                showCoordinateBorder={home.showCoordinateBorder}
                lightSquare={home.lightSquare}
                darkSquare={home.darkSquare}
                flipped={home.flipped}
                onFlip={home.handleFlip}
                onNotify={home.handleNotification}
                onDownload={handleDownloadClick}
                onPieceImagesChange={home.handlePieceImagesChange}
              />
            </div>
          </div>
        </div>

        <NotificationContainer
          notifications={home.notifications}
          onRemove={home.removeNotification}
        />

        {home.exportState.showProgress && (
          <ExportProgress
            isExporting={home.exportState.isExporting}
            progress={home.exportState.exportProgress}
            currentFormat={home.exportState.currentFormat || ''}
            config={home.getExportConfig()}
            isPaused={home.exportState.isPaused}
            onClose={home.toggleProgress}
            onPause={home.handlePause}
            onResume={home.handleResume}
            onCancel={home.handleCancelExport}
          />
        )}
      </div>
    </>
  );
};

export default HomePage;
