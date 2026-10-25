import { useLocation } from 'wouter';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useChessBoard } from '@/shared/hooks/useChessBoard';
import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { usePieceImages } from '@/shared/hooks/usePieceImages';
import {
  exportFailureReason,
  isExportCancelled,
  runExportJobs,
  summariseExport
} from '@/shared/utils/exportJobs';
import { loadExportPieces } from '@/shared/utils/pieceUtils';
import { requestedPieceMap } from '@/shared/utils/pieceRequest';
import { useSearchParams } from '@/shared/hooks/useSearchParams';
import { useTheme } from '@/shared/hooks/useTheme';
import { ADVANCED_FEN_CONFIG } from '@constants';
import {
  MAX_POSITION_LENGTH,
  getFENValidationError,
  validateFEN
} from '@/shared/utils/fenParser';
import {
  cancelExport,
  checkCancellation,
  pauseExport,
  resetExportState,
  resumeExport,
  waitWhilePaused
} from '@/shared/utils/exportState';
import {
  downloadJPEG,
  downloadPNG,
  getRasterBlob
} from '@/shared/utils/canvasExporter';
import { downloadSVG, getSVGBlob } from '@/shared/utils/svgExporter';
import { isTextEntryTarget } from '@/shared/utils/pageScroll';
import { logger } from '@/shared/utils/logger';
import { sanitizeFileName } from '@chessviewer-org/chess-viewer';
import { saveBlob } from '@/shared/utils/saveBlob';
import { withViewTransition } from '@/shared/utils/viewTransition';
import { type Zippable, zip } from 'fflate';
import { useFENBatch } from '@/shared/contexts/FENBatchContext';

import { parseSmartNaming } from '../utils/parseSmartNaming';

// Types
export type ExportFormat = 'png' | 'jpeg' | 'svg';
export type ExportResolution = 1 | 2 | 3 | 4;
export type BoardSizePreset = 4 | 6 | 8 | 'custom';

export interface ExportState {
  isExporting: boolean;
  progress: number;
  currentFormat: string;
  status: string;
}

export interface PositionSettings {
  [fen: string]: {
    pieceStyle?: string;
    boardSize?: number;
    fileName?: string;
    exportQuality?: number;
    showCoords?: boolean;
    showCoordinateBorder?: boolean;
    showThinFrame?: boolean;
    isFlipped?: boolean;
    showCoordinates?: boolean;
    lightSquare?: string;
    darkSquare?: string;
    selectedFormats?: ExportFormat[];
  };
}

export interface ExportConfigLike {
  fen: string;
  pieceStyle: string;
  boardSize: number;
  showCoords: boolean;
  showCoordinateBorder: boolean;
  showThinFrame: boolean;
  lightSquare: string;
  darkSquare: string;
  flipped: boolean;
  pieceImages: Record<string, HTMLImageElement>;
  exportQuality: number;
}

export interface AdvancedFENInitialProps {
  pieceStyle?: string;
  boardSize?: number;
  fileName?: string;
  exportQuality?: number;
  showCoords?: boolean;
  showCoordinateBorder?: boolean;
  showThinFrame?: boolean;
  lightSquare?: string;
  darkSquare?: string;
}

// Constants
const FORMAT_ORDER: ExportFormat[] = ['jpeg', 'png', 'svg'];
const { MAX_FENS, STORAGE_KEYS, DEFAULT_FENS, DEFAULT_INTERVAL, TABS } =
  ADVANCED_FEN_CONFIG;

// Helpers
function uniqueName(name: string, used: Set<string>): string {
  let candidate = name;
  for (let n = 2; used.has(candidate.toLowerCase()); n++) {
    candidate = `${name}-${n}`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function runFormat(
  format: ExportFormat,
  config: ExportConfigLike,
  name: string,
  onProg: (p: number) => void
) {
  if (format === 'png') return downloadPNG(config, name, onProg);
  if (format === 'jpeg') return downloadJPEG(config, name, onProg);
  return downloadSVG(config, name, onProg);
}

function buildFenConfig(
  fen: string,
  s: PositionSettings[string],
  init: AdvancedFENInitialProps,
  chained: {
    pieceStyle: string;
    boardSize: number;
    showCoordsLocal: boolean;
    showCoordinateBorder: boolean;
    showThinFrame: boolean;
    lightSquare: string;
    darkSquare: string;
    isFlipped: boolean;
    exportQuality: number;
  },
  pieceImages: Record<string, HTMLImageElement>,
  isChained: boolean
): ExportConfigLike {
  if (isChained) {
    return {
      fen,
      pieceStyle: chained.pieceStyle,
      boardSize: chained.boardSize,
      showCoords: chained.showCoordsLocal,
      showCoordinateBorder: chained.showCoordinateBorder,
      showThinFrame: chained.showThinFrame,
      lightSquare: chained.lightSquare,
      darkSquare: chained.darkSquare,
      flipped: chained.isFlipped,
      exportQuality: chained.exportQuality,
      pieceImages
    };
  }

  return {
    fen,
    pieceStyle: s.pieceStyle ?? init.pieceStyle ?? 'cburnett',
    boardSize: s.boardSize ?? init.boardSize ?? 8,
    showCoords: s.showCoords ?? init.showCoords ?? true,
    showCoordinateBorder:
      s.showCoordinateBorder ?? init.showCoordinateBorder ?? true,
    showThinFrame: s.showThinFrame ?? init.showThinFrame ?? false,
    lightSquare: s.lightSquare ?? init.lightSquare ?? '#f0d9b5',
    darkSquare: s.darkSquare ?? init.darkSquare ?? '#b58863',
    flipped: s.isFlipped ?? false,
    exportQuality: s.exportQuality ?? init.exportQuality ?? 2,
    pieceImages
  };
}

// Hook
export function useAdvancedFEN(props: AdvancedFENInitialProps = {}) {
  const [, navigate] = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { batchList, removeFromBatch, updateBatchItem, addToBatch } =
    useFENBatch();
  const notifier = useNotifications();

  const init = useRef(props);

  const [pieceStyle, setPieceStyle] = useState(props.pieceStyle ?? 'cburnett');
  const [boardSize, setBoardSize] = useState(props.boardSize ?? 8);
  const [boardSizePreset, setBoardSizePreset] = useState<BoardSizePreset>(
    ([4, 6, 8] as number[]).includes(props.boardSize ?? 8)
      ? ((props.boardSize ?? 8) as BoardSizePreset)
      : 'custom'
  );
  const [customBoardSizeInput, setCustomBoardSizeInput] = useState(
    String(props.boardSize ?? 8)
  );
  const [exportQuality, setExportQuality] = useState(props.exportQuality ?? 2);
  const [showCoordsLocal, setShowCoordsLocal] = useState(
    props.showCoords ?? true
  );
  const [showCoordinateBorder, setShowCoordinateBorder] = useState(
    props.showCoordinateBorder ?? true
  );
  const [showThinFrame, setShowThinFrame] = useState(
    props.showThinFrame ?? false
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>([
    'jpeg',
    'png'
  ]);
  const [fileNamesInput, setFileNamesInput] = useState(
    props.fileName === 'chess-board' ? '' : (props.fileName ?? '')
  );
  const [isChained, setIsChained] = useState(false);

  const [positionSettings, setPositionSettings] =
    useLocalStorage<PositionSettings>('advanced-fen-position-settings', {});

  const { lightSquare, darkSquare, setLightSquare, setDarkSquare } = useTheme({
    initialLight: props.lightSquare ?? '#f0d9b5',
    initialDark: props.darkSquare ?? '#b58863'
  });

  const fens = useMemo(() => {
    const arr = batchList.map((f) =>
      typeof f === 'string' ? f.slice(0, MAX_POSITION_LENGTH) : ''
    );
    while (arr.length < 3) arr.push('');
    if (arr.every((f) => f.trim()) && arr.length < MAX_FENS) arr.push('');
    return arr;
  }, [batchList]);

  const validFens = useMemo(
    () => fens.filter((f) => f.trim() && validateFEN(f)),
    [fens]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const safeCurrentIndex = Math.min(
    currentIndex,
    Math.max(0, validFens.length - 1)
  );
  const currentFen = validFens[safeCurrentIndex] ?? '';
  const renderFen = currentFen || DEFAULT_FENS[0] || '';

  const [favorites, setFavorites] = useLocalStorage<Record<string, boolean>>(
    STORAGE_KEYS.FAVORITES,
    {}
  );

  const [pastedIndex, setPastedIndex] = useState<number | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<number | null>(null);

  const fenErrors = useMemo(() => {
    const errs: Record<number, string> = {};
    fens.forEach((f, i) => {
      const e = f.trim() ? getFENValidationError(f.trim()) : null;
      if (e) errs[i] = e;
    });
    return errs;
  }, [fens]);

  const isSyncingRef = useRef(false);
  useLayoutEffect(() => {
    if (!currentFen || isChained) return;
    isSyncingRef.current = true;
    const s = positionSettings[currentFen] ?? {};
    const bs = s.boardSize ?? init.current.boardSize ?? 8;
    setPieceStyle(s.pieceStyle ?? init.current.pieceStyle ?? 'cburnett');
    setBoardSize(bs);
    setBoardSizePreset(
      ([4, 6, 8] as number[]).includes(bs) ? (bs as BoardSizePreset) : 'custom'
    );
    setCustomBoardSizeInput(String(bs));
    setExportQuality(s.exportQuality ?? init.current.exportQuality ?? 2);
    setShowCoordsLocal(s.showCoords ?? init.current.showCoords ?? true);
    setShowCoordinateBorder(
      s.showCoordinateBorder ?? init.current.showCoordinateBorder ?? true
    );
    setShowThinFrame(s.showThinFrame ?? init.current.showThinFrame ?? false);
    setIsFlipped(s.isFlipped ?? false);
    setShowCoordinates(s.showCoordinates ?? true);
    setFileNamesInput(s.fileName ?? init.current.fileName ?? '');
    if (s.lightSquare) setLightSquare(s.lightSquare);
    if (s.darkSquare) setDarkSquare(s.darkSquare);
    if (s.selectedFormats?.length) setSelectedFormats(s.selectedFormats);
    const id = requestAnimationFrame(() => (isSyncingRef.current = false));
    return () => cancelAnimationFrame(id);
  }, [currentFen, isChained, positionSettings, setLightSquare, setDarkSquare]);

  useEffect(() => {
    if (!currentFen || isSyncingRef.current) return;
    const snapshot = {
      pieceStyle,
      boardSize,
      fileName: fileNamesInput,
      exportQuality,
      showCoords: showCoordsLocal,
      showCoordinateBorder,
      showThinFrame,
      isFlipped,
      showCoordinates,
      lightSquare,
      darkSquare,
      selectedFormats
    };
    setPositionSettings((prev) => {
      if (isChained) {
        const next = { ...prev };
        validFens.forEach(
          (f) => (next[f] = { ...(next[f] ?? {}), ...snapshot })
        );
        return next;
      }
      return { ...prev, [currentFen]: snapshot };
    });
  }, [
    currentFen,
    isChained,
    validFens,
    pieceStyle,
    boardSize,
    fileNamesInput,
    exportQuality,
    showCoordsLocal,
    showCoordinateBorder,
    showThinFrame,
    isFlipped,
    showCoordinates,
    lightSquare,
    darkSquare,
    selectedFormats,
    setPositionSettings
  ]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalTime, setIntervalTime] = useState(DEFAULT_INTERVAL);
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    currentFormat: '',
    status: ''
  });
  const [isPaused, setIsPaused] = useState(false);

  const activeTab = searchParams.get('tab') || TABS.POSITIONS;
  function setActiveTab(val: React.SetStateAction<string>) {
    const v = typeof val === 'function' ? val(activeTab) : val;
    withViewTransition(() =>
      setSearchParams(
        (p) => {
          p.set('tab', v);
          return p;
        },
        { replace: true }
      )
    );
  }

  const customBoardSizeError = (() => {
    const n = Number(customBoardSizeInput.trim());
    if (!customBoardSizeInput.trim()) return null;
    if (!Number.isFinite(n)) return 'Board size must be a valid number.';
    if (n < 4 || n > 8) return 'Board size must be between 4cm and 8cm.';
    return null;
  })();

  const { board: boardState } = useChessBoard(renderFen);
  const { pieceImages, isLoading: imagesLoading } = usePieceImages(pieceStyle, {
    positions: fens
  });
  const isBoardReady =
    Array.isArray(boardState) &&
    boardState.length === 8 &&
    !imagesLoading &&
    !!pieceImages &&
    Object.keys(pieceImages).length > 0;

  function handleBack() {
    window.history.back();
  }
  function handleSettingsClick() {
    navigate('/settings', {
      state: { returnTo: '/advanced-fen', returnTab: activeTab }
    });
  }
  function unlink() {
    if (isChained) setIsChained(false);
  }

  function removeFenInput(i: number) {
    if (i >= batchList.length) return;
    removeFromBatch(i);
    if (currentIndex >= batchList.length - 1)
      setCurrentIndex(Math.max(0, batchList.length - 2));
    const f = batchList[i];
    if (f)
      setFavorites((p) => {
        const np = { ...p };
        delete np[f];
        return np;
      });
  }

  function updateFen(idx: number, val: string) {
    const v = String(val || '').slice(0, MAX_POSITION_LENGTH);
    const t = v.trim();
    if (t && batchList.some((f, i) => i !== idx && f.trim() === t)) {
      setDuplicateWarning(idx);
      setTimeout(() => setDuplicateWarning(null), 3000);
      return;
    }
    if (idx < batchList.length) updateBatchItem(idx, v);
    else if (t && batchList.length < MAX_FENS) addToBatch(t);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isTextEntryTarget(e.target)) return;
      if (e.key === 'Escape') window.history.back();
      else if (e.key === 'ArrowLeft' && validFens.length)
        setCurrentIndex((p) => (p - 1 + validFens.length) % validFens.length);
      else if (e.key === 'ArrowRight' && validFens.length)
        setCurrentIndex((p) => (p + 1) % validFens.length);
      else if (
        e.key === ' ' &&
        validFens.length &&
        !(e.target instanceof Element && e.target.closest('button, a'))
      ) {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [validFens.length]);

  useEffect(() => {
    if (!isPlaying || !validFens.length) return;
    const t = setInterval(
      () => setCurrentIndex((p) => (p + 1) % validFens.length),
      intervalTime * 1000
    );
    return () => clearInterval(t);
  }, [isPlaying, intervalTime, validFens.length]);

  const parsedNames = useMemo(
    () => parseSmartNaming(fileNamesInput, validFens.length),
    [fileNamesInput, validFens.length]
  );
  const activeFileName = useMemo(() => {
    const savedFileName = positionSettings[currentFen]?.fileName;
    const name =
      !isChained && savedFileName
        ? (parseSmartNaming(savedFileName, 1)[0] ?? '')
        : (parsedNames[safeCurrentIndex] ?? `Position-${safeCurrentIndex + 1}`);
    return sanitizeFileName(name);
  }, [isChained, positionSettings, currentFen, parsedNames, safeCurrentIndex]);

  const exportConfig = useMemo<ExportConfigLike>(
    () => ({
      fen: currentFen,
      pieceStyle,
      boardSize,
      showCoords: showCoordsLocal,
      showCoordinateBorder,
      showThinFrame,
      lightSquare,
      darkSquare,
      flipped: isFlipped,
      pieceImages: pieceImages ?? {},
      exportQuality
    }),
    [
      currentFen,
      pieceStyle,
      boardSize,
      showCoordsLocal,
      showCoordinateBorder,
      showThinFrame,
      lightSquare,
      darkSquare,
      isFlipped,
      pieceImages,
      exportQuality
    ]
  );

  const orderedFormats = FORMAT_ORDER.filter((f) =>
    selectedFormats.includes(f)
  );

  function startExport() {
    resetExportState();
    setIsPaused(false);
    setExportState({
      isExporting: true,
      progress: 0,
      currentFormat: orderedFormats[0]!,
      status: 'Preparing'
    });
  }

  function finishExport() {
    resetExportState();
    setExportState((p) => ({ ...p, isExporting: false, progress: 100 }));
  }

  function reportFailures(
    failed: readonly { label: string; reason: string }[]
  ) {
    for (const { label, reason } of failed)
      logger.error(`${label} export failed:`, reason);
  }

  function notifyExportError(error: unknown) {
    if (isExportCancelled(error)) notifier.info('Export cancelled');
    else {
      logger.error('Export failed', error);
      notifier.error(`Export failed: ${exportFailureReason(error)}`);
    }
  }

  async function handleExportActive() {
    if (!orderedFormats.length) return;
    startExport();
    try {
      const images = await loadExportPieces(
        pieceStyle,
        requestedPieceMap({ positions: fens })
      );
      const outcome = await runExportJobs(
        orderedFormats.map((format, i) => ({
          label: format.toUpperCase(),
          run: async () => {
            await waitWhilePaused();
            checkCancellation();
            await runFormat(
              format,
              { ...exportConfig, pieceImages: images },
              activeFileName,
              (p) =>
                setExportState({
                  isExporting: true,
                  currentFormat: format,
                  progress: ((i + p / 100) / orderedFormats.length) * 100,
                  status: `${i + 1}/${orderedFormats.length}`
                })
            );
          }
        }))
      );
      reportFailures(outcome.failed);
      const summary = summariseExport(outcome);
      notifier[summary.type](summary.message);
    } catch (e) {
      notifyExportError(e);
    } finally {
      finishExport();
    }
  }

  async function handleExportBatch() {
    if (!orderedFormats.length) return;
    startExport();
    try {
      const zipData: Zippable = {};
      const saved: string[] = [];
      const failed: { label: string; reason: string }[] = [];
      const usedNames = new Set<string>();
      const chainedSettings = {
        pieceStyle,
        boardSize,
        showCoordsLocal,
        showCoordinateBorder,
        showThinFrame,
        lightSquare,
        darkSquare,
        isFlipped,
        exportQuality
      };
      let done = 0;
      const total = validFens.reduce((acc, fen) => {
        const fmts = isChained
          ? orderedFormats
          : FORMAT_ORDER.filter((x) =>
              (
                positionSettings[fen]?.selectedFormats ?? orderedFormats
              ).includes(x)
            );
        return acc + fmts.length;
      }, 0);

      for (let i = 0; i < validFens.length; i++) {
        const fen = validFens[i]!;
        const s = positionSettings[fen] ?? {};
        const conf = buildFenConfig(
          fen,
          s,
          init.current,
          chainedSettings,
          pieceImages ?? {},
          isChained
        );
        conf.pieceImages = await loadExportPieces(
          conf.pieceStyle,
          requestedPieceMap({ positions: fens })
        );
        const rawName =
          !isChained && s.fileName
            ? (parseSmartNaming(s.fileName, 1)[0] ?? '')
            : (parsedNames[i] ?? '');
        const base = uniqueName(
          sanitizeFileName(rawName || `Position-${i + 1}`),
          usedNames
        );
        const fmts = isChained
          ? orderedFormats
          : FORMAT_ORDER.filter((x) =>
              (s.selectedFormats ?? orderedFormats).includes(x)
            );

        const outcome = await runExportJobs(
          fmts.map((fmt) => {
            const ext = fmt === 'jpeg' ? 'jpg' : fmt;
            return {
              label: `${base}.${ext}`,
              run: async () => {
                await waitWhilePaused();
                checkCancellation();
                const onProg = (p: number) =>
                  setExportState({
                    isExporting: true,
                    currentFormat: fmt,
                    progress: ((done + p / 100) / total) * 100,
                    status: `${i + 1}/${validFens.length}`
                  });
                const blob =
                  fmt === 'svg'
                    ? await getSVGBlob(conf, onProg)
                    : await getRasterBlob(conf, fmt, onProg);
                const bytes = new Uint8Array(await blob.arrayBuffer());
                zipData[`${base}/${base}.${ext}`] =
                  fmt === 'svg' ? bytes : [bytes, { level: 0 }];
                done++;
              }
            };
          })
        );
        saved.push(...outcome.done);
        failed.push(...outcome.failed);
      }

      reportFailures(failed);
      if (!saved.length) {
        notifier.error(summariseExport({ done: saved, failed }).message);
        return;
      }
      setExportState({
        isExporting: true,
        progress: 99,
        currentFormat: 'zip',
        status: 'Zipping...'
      });
      const zippedBlob = await new Promise<Blob>((resolve, reject) => {
        zip(zipData, (err, out) => {
          if (err) reject(err);
          else resolve(new Blob([out], { type: 'application/zip' }));
        });
      });
      saveBlob(zippedBlob, 'chess_batch_export', 'zip');
      const summary = summariseExport(
        {
          done: [
            failed.length
              ? `${saved.length} of ${saved.length + failed.length} files`
              : `${saved.length} files`
          ],
          failed
        },
        'saved to chess_batch_export.zip'
      );
      notifier[summary.type](summary.message);
    } catch (e) {
      notifyExportError(e);
    } finally {
      finishExport();
    }
  }

  return {
    state: {
      fens,
      favorites,
      currentIndex,
      isPlaying,
      intervalTime,
      showIntervalMenu,
      pastedIndex,
      fenErrors,
      duplicateWarning,
      activeTab,
      isFlipped,
      showCoordinates,
      pieceStyle,
      boardSize,
      exportQuality,
      showCoordsLocal,
      showCoordinateBorder,
      showThinFrame,
      exportState,
      isPaused,
      theme: { lightSquare, darkSquare, setLightSquare, setDarkSquare },
      validFens,
      hasValidFens: validFens.length > 0,
      displayFensCount: Math.max(batchList.length, 3),
      safeCurrentIndex,
      currentFen,
      boardState,
      pieceImages,
      isBoardReady,
      exportConfig,
      wizardStep,
      selectedFormats,
      boardSizePreset,
      customBoardSizeInput,
      customBoardSizeError,
      fileNamesInput,
      resolvedActiveFileNames: {
        jpeg: activeFileName,
        png: activeFileName,
        svg: activeFileName
      },
      isChained,
      parsedNames,
      activeFileName,
      notifications: notifier.notifications
    },
    handlers: {
      removeNotification: notifier.removeNotification,
      handleBack,
      removeFenInput,
      updateFen,
      handlePasteFEN: async (i: number) => {
        try {
          const t = await navigator.clipboard.readText();
          if (t?.trim()) {
            updateFen(i, t.trim());
            setPastedIndex(i);
            setTimeout(() => setPastedIndex(null), 2000);
          }
        } catch (e) {
          logger.error('Clipboard read failed', e);
        }
      },
      toggleFavorite: (f: string) => {
        if (validateFEN(f)) setFavorites((p) => ({ ...p, [f]: !p[f] }));
      },
      handlePrevious: () =>
        validFens.length &&
        setCurrentIndex((p) => (p - 1 + validFens.length) % validFens.length),
      handleNext: () =>
        validFens.length && setCurrentIndex((p) => (p + 1) % validFens.length),
      handleShowPositionsTab: () => setActiveTab(TABS.POSITIONS),
      handleTogglePlay: () => setIsPlaying((p) => !p),
      handleSetIntervalTime: (t: number) => {
        setIntervalTime(t);
        setShowIntervalMenu(false);
      },
      handleToggleIntervalMenu: () => setShowIntervalMenu((p) => !p),
      handleFlipBoard: () => setIsFlipped((p) => !p),
      handleSetFen: (nf: string) => {
        const i = batchList.indexOf(currentFen);
        if (i !== -1) updateFen(i, nf);
      },
      handleSettingsClick,
      handlePauseExport: () => {
        pauseExport();
        setIsPaused(true);
      },
      handleResumeExport: () => {
        resumeExport();
        setIsPaused(false);
      },
      handleCancelExportProgress: () => {
        cancelExport();
        setExportState((p) => ({ ...p, isExporting: false }));
      },
      setActiveTab,
      setExportQuality: (q: number) => {
        unlink();
        setExportQuality(q);
      },
      setPieceStyle: (s: string) => {
        unlink();
        setPieceStyle(s);
      },
      setShowCoordsLocal,
      setShowCoordinateBorder,
      setShowThinFrame,
      setWizardStep,
      toggleFormat: (f: ExportFormat) => {
        unlink();
        setSelectedFormats((p) => {
          if (!p.includes(f)) return [...p, f];
          if (p.length === 1) return p;
          return p.filter((x) => x !== f);
        });
      },
      selectBoardSizePreset: (p: BoardSizePreset) => {
        unlink();
        setBoardSizePreset(p);
        if (p !== 'custom') {
          setBoardSize(p);
          setCustomBoardSizeInput(String(p));
        }
      },
      updateCustomBoardSize: (v: string) => {
        if (v.trim() && !/^\d*\.?\d*$/.test(v.trim())) return;
        unlink();
        setBoardSizePreset('custom');
        setCustomBoardSizeInput(v);
        const n = Number(v.trim());
        if (Number.isFinite(n)) setBoardSize(Math.min(Math.max(n, 4), 8));
      },
      updateFileNames: (v: string) => {
        unlink();
        setFileNamesInput(v);
      },
      setIsChained,
      handleApplyPresetTheme: (l: string, d: string) => {
        unlink();
        setLightSquare(l);
        setDarkSquare(d);
      },
      handleApplyToAll: () => {
        setIsChained(true);
        const snapshot = {
          pieceStyle,
          boardSize,
          fileName: fileNamesInput,
          exportQuality,
          showCoords: showCoordsLocal,
          showCoordinateBorder,
          showThinFrame,
          isFlipped,
          showCoordinates,
          lightSquare,
          darkSquare,
          selectedFormats
        };
        setPositionSettings((p) => {
          const n = { ...p };
          validFens.forEach((f) => (n[f] = { ...(n[f] ?? {}), ...snapshot }));
          return n;
        });
      },
      handleExportActive,
      handleExportBatch
    }
  };
}
