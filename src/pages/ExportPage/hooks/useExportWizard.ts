import { useCallback, useMemo, useState } from 'react';

export type ExportFormat = 'jpeg' | 'png' | 'svg';
export type ExportResolution = 1 | 2 | 3 | 4;
export type BoardSizePreset = 4 | 6 | 8 | 'custom';

const DEFAULT_FILE_NAME = 'chessboard';
const FORMAT_ORDER: ExportFormat[] = ['jpeg', 'png', 'svg'];
const BOARD_SIZE_MIN = 4;
const BOARD_SIZE_MAX = 8;

function clampBoardSize(value: number): number {
  return Math.min(Math.max(value, BOARD_SIZE_MIN), BOARD_SIZE_MAX);
}

function parseNames(value: string): string[] {
  return value.trim()
    ? value
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
    : [];
}

function getBoardSizeError(input: string): string | null {
  if (!input.trim()) return null;
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return 'Board size must be a valid number.';
  if (parsed < BOARD_SIZE_MIN || parsed > BOARD_SIZE_MAX) {
    return `Board size must be between ${BOARD_SIZE_MIN}cm and ${BOARD_SIZE_MAX}cm.`;
  }
  return null;
}

export function useExportWizard() {
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>([
    'jpeg',
    'png'
  ]);
  const [resolution, setResolutionValue] = useState<ExportResolution>(2);
  const [boardSizePreset, selectBoardSizePreset] = useState<BoardSizePreset>(8);
  const [customBoardSizeInput, setCustomBoardSizeInput] = useState('8');
  const [customBoardSizeValue, setCustomBoardSizeValue] = useState(8);
  const [fileNamesInput, setFileNamesInput] = useState('');
  const [fileNameError, setFileNameError] = useState<string | null>(null);

  const activeBoardSize =
    boardSizePreset === 'custom' ? customBoardSizeValue : boardSizePreset;

  const resolvedFileNames = useMemo<Record<ExportFormat, string>>(() => {
    const names = parseNames(fileNamesInput);
    const mapped: Record<ExportFormat, string> = {
      jpeg: DEFAULT_FILE_NAME,
      png: DEFAULT_FILE_NAME,
      svg: DEFAULT_FILE_NAME
    };
    selectedFormats.forEach((format, index) => {
      mapped[format] = names[index] || DEFAULT_FILE_NAME;
    });
    return mapped;
  }, [selectedFormats, fileNamesInput]);

  const customBoardSizeError = useMemo(
    () => getBoardSizeError(customBoardSizeInput),
    [customBoardSizeInput]
  );

  const toggleFormat = useCallback((format: ExportFormat) => {
    setSelectedFormats((prev) => {
      if (prev.includes(format) && prev.length === 1) return prev;
      const next = prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format];
      const ordered = FORMAT_ORDER.filter((f) => next.includes(f));

      setFileNamesInput((curr) => {
        const names = parseNames(curr);
        return names.length <= ordered.length
          ? curr
          : names.slice(0, ordered.length).join(', ');
      });
      setFileNameError(null);
      return ordered;
    });
  }, []);

  const updateCustomBoardSize = useCallback((value: string) => {
    const nextValue = value.trim();
    if (nextValue === '') {
      setCustomBoardSizeInput('');
      return;
    }
    if (!/^\d*\.?\d*$/.test(nextValue)) return;
    const parsed = Number(nextValue);
    if (!Number.isFinite(parsed)) return;
    setCustomBoardSizeInput(value);
    setCustomBoardSizeValue(clampBoardSize(parsed));
  }, []);

  const updateFileNames = useCallback(
    (value: string) => {
      const parsedNames = parseNames(value);
      if (parsedNames.length > selectedFormats.length) {
        setFileNameError(
          'Too many names for selected formats. Remove extra names or select more formats.'
        );
      } else {
        setFileNameError(null);
      }
      setFileNamesInput(value);
    },
    [selectedFormats.length]
  );

  return {
    selectedFormats,
    resolution,
    boardSizePreset,
    customBoardSizeInput,
    activeBoardSize,
    fileNamesInput,
    fileNameError,
    customBoardSizeError,
    resolvedFileNames,
    toggleFormat,
    setResolutionValue,
    selectBoardSizePreset,
    updateCustomBoardSize,
    updateFileNames
  };
}
