import { useCallback, useState } from 'react';

import { cancelExport, pauseExport, resumeExport } from '@utils';

import type { ExportState } from './useAdvancedFEN.types';

export function useExportProgress() {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    currentFormat: '',
    status: ''
  });
  const [isPaused, setIsPaused] = useState(false);

  const handleExportStart = useCallback((format: string) => {
    setIsPaused(false);
    setExportState({
      isExporting: true,
      progress: 0,
      currentFormat: format,
      status: 'Preparing'
    });
  }, []);

  const handleExportProgress = useCallback(
    (progress: number, format: string, status?: string) => {
      setExportState({
        isExporting: true,
        progress,
        currentFormat: format,
        status: status || ''
      });
    },
    []
  );

  const handleExportFinish = useCallback(() => {
    setExportState((prev) => ({
      ...prev,
      isExporting: false,
      progress: 100
    }));
  }, []);

  const handlePauseExport = useCallback(() => {
    pauseExport();
    setIsPaused(true);
  }, []);

  const handleResumeExport = useCallback(() => {
    resumeExport();
    setIsPaused(false);
  }, []);

  const handleCancelExportProgress = useCallback(() => {
    cancelExport();
    setExportState((prev) => ({
      ...prev,
      isExporting: false
    }));
  }, []);

  return {
    exportState,
    isPaused,
    handleExportStart,
    handleExportProgress,
    handleExportFinish,
    handlePauseExport,
    handleResumeExport,
    handleCancelExportProgress
  };
}
