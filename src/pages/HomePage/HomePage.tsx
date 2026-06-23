import React from 'react';

import { useNavigate } from 'react-router-dom';

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

/** Primary workspace combining the DnD board editor, control panel, and export studio trigger. */
const HomePage: React.FC = () => {
  const {
    fen,
    setFen,
    pieceStyle,
    showCoords,
    setShowCoords,
    showCoordinateBorder,
    showThinFrame,
    setShowThinFrame,
    lightSquare,
    darkSquare,
    boardSize,
    exportQuality,
    flipped,
    setIsFavorite,
    addToFavoritesRef,
    exportState,
    notifications,
    removeNotification,
    fileName,
    saveManualFen,
    saveExportFen,
    addCurrentToFavorites,

    handlePieceImagesChange,
    handleCancelExport,
    handlePause,
    handleResume,
    handleEditorFenChange,
    handleFlip,
    handleNotification,
    toggleProgress,
    getExportConfig
  } = useHome();

  const navigate = useNavigate();
  const handleDownloadClick = () => {
    navigate('/export', {
      state: {
        fen,
        pieceStyle,
        showCoords,
        showCoordinateBorder,
        showThinFrame,
        lightSquare,
        darkSquare,
        exportQuality,
        boardSize,
        flipped,
        fileName
      }
    });
  };

  const isCustomFen = fen && fen !== STARTING_FEN;
  // If user is viewing a custom FEN, append it to canonical URL and point to
  // the Supabase Edge Function for dynamic OG image generation.
  const dynamicParams = isCustomFen
    ? `?fen=${encodeURIComponent(fen)}`
    : undefined;

  // Use VITE_SUPABASE_URL to construct the absolute URL to the Edge Function.
  // We cannot use SITE_URL/api/og because Nginx does not proxy it by default.
  const supabaseUrl =
    import.meta.env['VITE_SUPABASE_URL']?.replace(/\/$/, '') ||
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
      <div className="w-full bg-bg py-2 overflow-x-hidden min-h-full lg:h-full lg:overflow-hidden flex flex-col lg:justify-center animate-pageEnter">
        <div className="flex flex-col gap-fluid-xs lg:gap-3 page-container pt-1.5 lg:pt-0">
          <div className="min-w-0">
            <FenToolbar
              fen={fen}
              setFen={setFen}
              addToFavoritesRef={addToFavoritesRef}
              onFavoriteStatusChange={setIsFavorite}
              saveManualFen={saveManualFen}
              saveExportFen={saveExportFen}
              addCurrentToFavorites={addCurrentToFavorites}
              onNotification={handleNotification}
            />
          </div>
          <div className="w-full">
            <div className="workspace-container bg-surface border border-border/40 rounded-xl p-fluid-xs sm:p-fluid-sm overflow-x-hidden lg:overflow-hidden">
              <ChessEditor
                fen={fen}
                onFenChange={handleEditorFenChange}
                pieceStyle={pieceStyle}
                showCoords={showCoords}
                setShowCoords={setShowCoords}
                showThinFrame={showThinFrame}
                setShowThinFrame={setShowThinFrame}
                exportQuality={exportQuality}
                showCoordinateBorder={showCoordinateBorder}
                lightSquare={lightSquare}
                darkSquare={darkSquare}
                flipped={flipped}
                onFlip={handleFlip}
                onNotify={handleNotification}
                onDownload={handleDownloadClick}
                onPieceImagesChange={handlePieceImagesChange}
              />
            </div>
          </div>
        </div>

        <NotificationContainer
          notifications={notifications}
          onRemove={removeNotification}
        />

        {exportState.showProgress && (
          <ExportProgress
            isExporting={exportState.isExporting}
            progress={exportState.exportProgress}
            currentFormat={exportState.currentFormat || ''}
            config={getExportConfig()}
            isPaused={exportState.isPaused}
            onClose={toggleProgress}
            onPause={handlePause}
            onResume={handleResume}
            onCancel={handleCancelExport}
          />
        )}
      </div>
    </>
  );
};

export default HomePage;
