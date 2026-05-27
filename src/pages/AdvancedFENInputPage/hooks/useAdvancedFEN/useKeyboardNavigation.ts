import { useEffect } from 'react';

/** Arguments for the useKeyboardNavigation hook. */
interface UseKeyboardNavigationArgs {
  validFensLength: number;
  handleBack: () => void;
  handlePrevious: () => void;
  handleNext: () => void;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}

/** Registers global keyboard shortcuts: Escape → back, ArrowLeft/Right → navigate, Space → play/pause. */
export function useKeyboardNavigation({
  validFensLength,
  handleBack,
  handlePrevious,
  handleNext,
  setIsPlaying
}: UseKeyboardNavigationArgs) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleBack();
      else if (e.key === 'ArrowLeft' && validFensLength > 0) handlePrevious();
      else if (e.key === 'ArrowRight' && validFensLength > 0) handleNext();
      else if (e.key === ' ' && validFensLength > 0) {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBack, handleNext, handlePrevious, validFensLength, setIsPlaying]);
}
