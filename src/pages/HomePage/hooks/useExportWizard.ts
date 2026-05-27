import { useCallback, useMemo, useReducer } from 'react';

/** Supported output file formats for the export wizard. */
export type ExportFormat = 'jpeg' | 'png' | 'svg';
/** Available render density multipliers (8x – 32x). */
export type ExportResolution = 8 | 16 | 24 | 32;
/** Three-step wizard progression: theme → piece display → export settings. */
export type WizardStep = 1 | 2 | 3;
/** Preset board size options in centimetres, or 'custom' for free-form input. */
export type BoardSizePreset = 4 | 8 | 12 | 'custom';

const DEFAULT_FILE_NAME = 'chessboard';
const FORMAT_ORDER: ExportFormat[] = ['jpeg', 'png', 'svg'];
const BOARD_SIZE_MIN = 4;
const BOARD_SIZE_MAX = 16;

/** Internal reducer state for the three-step export wizard. */
interface ExportWizardState {
  currentStep: WizardStep;
  selectedFormats: ExportFormat[];
  resolution: ExportResolution;
  boardSizePreset: BoardSizePreset;
  customBoardSizeInput: string;
  customBoardSizeValue: number;
  fileNamesInput: string;
  fileNameError: string | null;
}

type ExportWizardAction =
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'TOGGLE_FORMAT'; format: ExportFormat }
  | { type: 'SET_RESOLUTION'; resolution: ExportResolution }
  | { type: 'SET_BOARD_SIZE_PRESET'; preset: BoardSizePreset }
  | { type: 'SET_CUSTOM_BOARD_SIZE_INPUT'; value: string }
  | { type: 'SET_FILE_NAMES_INPUT'; value: string };

function clampBoardSize(value: number): number {
  return Math.min(Math.max(value, BOARD_SIZE_MIN), BOARD_SIZE_MAX);
}

function parseNames(value: string): string[] {
  if (!value.trim()) return [];
  return value
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
}

function sortFormats(formats: ExportFormat[]): ExportFormat[] {
  return FORMAT_ORDER.filter((format) => formats.includes(format));
}

function trimNamesToSelectedFormats(
  value: string,
  selectedFormats: ExportFormat[]
): string {
  const names = parseNames(value);
  if (names.length <= selectedFormats.length) {
    return value;
  }
  return names.slice(0, selectedFormats.length).join(', ');
}

const initialState: ExportWizardState = {
  currentStep: 1,
  selectedFormats: ['jpeg', 'png'],
  resolution: 16,
  boardSizePreset: 8,
  customBoardSizeInput: '8',
  customBoardSizeValue: 8,
  fileNamesInput: '',
  fileNameError: null
};

function exportWizardReducer(
  state: ExportWizardState,
  action: ExportWizardAction
): ExportWizardState {
  switch (action.type) {
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, 3) as WizardStep
      };
    case 'PREVIOUS_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 1) as WizardStep
      };
    case 'TOGGLE_FORMAT': {
      const isSelected = state.selectedFormats.includes(action.format);
      let nextFormats: ExportFormat[];

      if (isSelected) {
        if (state.selectedFormats.length === 1) {
          return state;
        }
        nextFormats = state.selectedFormats.filter(
          (format) => format !== action.format
        );
      } else {
        nextFormats = [...state.selectedFormats, action.format];
      }

      const orderedFormats = sortFormats(nextFormats);
      const trimmedNames = trimNamesToSelectedFormats(
        state.fileNamesInput,
        orderedFormats
      );

      return {
        ...state,
        selectedFormats: orderedFormats,
        fileNamesInput: trimmedNames,
        fileNameError: null
      };
    }
    case 'SET_RESOLUTION':
      return { ...state, resolution: action.resolution };
    case 'SET_BOARD_SIZE_PRESET':
      return { ...state, boardSizePreset: action.preset };
    case 'SET_CUSTOM_BOARD_SIZE_INPUT': {
      const nextValue = action.value.trim();
      if (nextValue === '') {
        return {
          ...state,
          customBoardSizeInput: ''
        };
      }

      if (!/^\d*\.?\d*$/.test(nextValue)) {
        return state;
      }

      const parsed = Number(nextValue);
      if (!Number.isFinite(parsed)) {
        return state;
      }

      return {
        ...state,
        customBoardSizeInput: action.value,
        customBoardSizeValue: clampBoardSize(parsed)
      };
    }
    case 'SET_FILE_NAMES_INPUT': {
      const parsedNames = parseNames(action.value);
      if (parsedNames.length > state.selectedFormats.length) {
        return {
          ...state,
          fileNameError:
            'Too many names for selected formats. Remove extra names or select more formats.'
        };
      }

      return {
        ...state,
        fileNamesInput: action.value,
        fileNameError: null
      };
    }
    default:
      return state;
  }
}

function getBoardSizeError(input: string): string | null {
  if (!input.trim()) return null;
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return 'Board size must be a valid number.';
  if (parsed < BOARD_SIZE_MIN || parsed > BOARD_SIZE_MAX) {
    return `Board size must be between ${BOARD_SIZE_MIN}sm and ${BOARD_SIZE_MAX}sm.`;
  }
  return null;
}

/** Drives the three-step export wizard: format selection, resolution, board size, and file naming. */
export function useExportWizard() {
  const [state, dispatch] = useReducer(exportWizardReducer, initialState);

  const activeBoardSize = useMemo(() => {
    if (state.boardSizePreset === 'custom') {
      return state.customBoardSizeValue;
    }
    return state.boardSizePreset;
  }, [state.boardSizePreset, state.customBoardSizeValue]);

  const orderedSelectedFormats = state.selectedFormats;

  const resolvedFileNames = useMemo<Record<ExportFormat, string>>(() => {
    const names = parseNames(state.fileNamesInput);
    const mapped: Record<ExportFormat, string> = {
      jpeg: DEFAULT_FILE_NAME,
      png: DEFAULT_FILE_NAME,
      svg: DEFAULT_FILE_NAME
    };

    orderedSelectedFormats.forEach((format, index) => {
      mapped[format] = names[index] || DEFAULT_FILE_NAME;
    });

    return mapped;
  }, [orderedSelectedFormats, state.fileNamesInput]);

  const customBoardSizeError = useMemo(
    () => getBoardSizeError(state.customBoardSizeInput),
    [state.customBoardSizeInput]
  );

  const handleNext = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const handleBack = useCallback(() => {
    dispatch({ type: 'PREVIOUS_STEP' });
  }, []);

  const toggleFormat = useCallback((format: ExportFormat) => {
    dispatch({ type: 'TOGGLE_FORMAT', format });
  }, []);

  const setResolutionValue = useCallback((resolution: ExportResolution) => {
    dispatch({ type: 'SET_RESOLUTION', resolution });
  }, []);

  const selectBoardSizePreset = useCallback((preset: BoardSizePreset) => {
    dispatch({ type: 'SET_BOARD_SIZE_PRESET', preset });
  }, []);

  const updateCustomBoardSize = useCallback((value: string) => {
    dispatch({ type: 'SET_CUSTOM_BOARD_SIZE_INPUT', value });
  }, []);

  const updateFileNames = useCallback((value: string) => {
    dispatch({ type: 'SET_FILE_NAMES_INPUT', value });
  }, []);

  return {
    currentStep: state.currentStep,
    selectedFormats: orderedSelectedFormats,
    resolution: state.resolution,
    boardSizePreset: state.boardSizePreset,
    customBoardSizeInput: state.customBoardSizeInput,
    activeBoardSize,
    fileNamesInput: state.fileNamesInput,
    fileNameError: state.fileNameError,
    customBoardSizeError,
    resolvedFileNames,
    handleNext,
    handleBack,
    toggleFormat,
    setResolutionValue,
    selectBoardSizePreset,
    updateCustomBoardSize,
    updateFileNames
  };
}
