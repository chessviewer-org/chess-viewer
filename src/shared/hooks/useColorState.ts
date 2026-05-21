import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@utils/logger';

export interface ColorState {
  hexInput: string;
  setHexInput: React.Dispatch<React.SetStateAction<string>>;
  tempColor: string;
  setTempColor: React.Dispatch<React.SetStateAction<string>>;
  copiedText: string;
  activePalette: string;
  setActivePalette: React.Dispatch<React.SetStateAction<string>>;
  isOpen: boolean;
  handleColorSelect: (color: string) => void;
  handleRandom: () => void;
  handleReset: (originalValue: string) => void;
  handleCopy: (text: string) => Promise<void>;
  toggleOpen: () => void;
  closeModal: () => void;
}

/**
 * Manages hex color input state with validation and clipboard integration.
 *
 * @param initialValue - Initial hex color (e.g. '#ffffff')
 * @returns State and handlers for color selection UI
 */
export function useColorState(initialValue: string): ColorState {
  const [hexInput, setHexInput] = useState<string>(initialValue);
  const [tempColor, setTempColor] = useState<string>(initialValue);
  const [copiedText, setCopiedText] = useState<string>('');
  const [activePalette, setActivePalette] = useState<string>('basic');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /** 
   * Updates the temporary and main hex input when a color is picked. 
   * 
   * @param color - Hex color string
   */
  const handleColorSelect = useCallback((color: string): void => {
    setTempColor(color);
    setHexInput(color);
  }, []);

  /** 
   * Generates a random hex color and updates state. 
   */
  const handleRandom = useCallback((): void => {
    const randomColor =
      '#' +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0');
    setTempColor(randomColor);
    setHexInput(randomColor);
  }, []);

  /** 
   * Resets the color state to a provided original value. 
   * 
   * @param originalValue - Hex color string to reset to
   */
  const handleReset = useCallback((originalValue: string): void => {
    setTempColor(originalValue);
    setHexInput(originalValue);
  }, []);

  /** 
   * Copies text to the system clipboard and shows a brief confirmation. 
   * 
   * @param text - String to copy
   */
  const handleCopy = useCallback(async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopiedText(''), 2000);
    } catch (err) {
      logger.error('Failed to copy:', err);
    }
  }, []);

  /** 
   * Toggles the open/closed state of the color picker. 
   */
  const toggleOpen = useCallback((): void => {
    setIsOpen((prev) => !prev);
  }, []);

  /** 
   * Forces the color picker to close. 
   */
  const closeModal = useCallback((): void => {
    setIsOpen(false);
  }, []);

  return {
    hexInput,
    setHexInput,
    tempColor,
    setTempColor,
    copiedText,
    activePalette,
    setActivePalette,
    isOpen,
    handleColorSelect,
    handleRandom,
    handleReset,
    handleCopy,
    toggleOpen,
    closeModal
  };
}
