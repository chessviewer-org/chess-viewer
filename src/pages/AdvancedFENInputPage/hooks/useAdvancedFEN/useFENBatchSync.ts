import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { ADVANCED_FEN_CONFIG } from '@constants';
import { useFENBatch } from '@/contexts/useFENBatch';
import { getFENValidationError, logger, validateFEN } from '@utils';
import { MAX_FEN_LENGTH, safeJSONParse } from '@utils/validation';

const { MAX_FENS, STORAGE_KEYS } = ADVANCED_FEN_CONFIG;

export function useFENBatchSync() {
  const location = useLocation();
  const { batchList, removeFromBatch, updateBatchItem, addToBatch } = useFENBatch();

  const duplicateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pastedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addedFenRef = useRef(false);

  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return safeJSONParse(saved, {} as Record<string, boolean>);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [pastedIndex, setPastedIndex] = useState<number | null>(null);
  const [fenErrors, setFenErrors] = useState<Record<number, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<number | null>(null);

  const fens = useMemo(() => {
    const arr = batchList.map((fen) =>
      typeof fen === 'string' ? fen.slice(0, MAX_FEN_LENGTH) : ''
    );
    while (arr.length < 3) arr.push('');
    if (arr.every((f) => f.trim().length > 0) && arr.length < MAX_FENS) {
      arr.push('');
    }
    return arr;
  }, [batchList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const errors: Record<number, string> = {};
    fens.forEach((fen, index) => {
      const trimmed = fen.trim();
      if (trimmed) {
        const error = getFENValidationError(trimmed);
        if (error) errors[index] = error;
      }
    });
    setFenErrors(errors);
    const validCount = fens.filter((f) => f.trim() && validateFEN(f)).length;
    if (currentIndex >= validCount && validCount > 0) setCurrentIndex(0);
  }, [fens, currentIndex]);

  useEffect(() => {
    return () => {
      if (duplicateTimeoutRef.current) clearTimeout(duplicateTimeoutRef.current);
      if (pastedTimeoutRef.current) clearTimeout(pastedTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const state = location.state as Record<string, unknown> | null;
    if (state?.['addFen'] && !addedFenRef.current) {
      const rawFenToAdd = state['addFen'] as string;
      const fenToAdd =
        typeof rawFenToAdd === 'string'
          ? rawFenToAdd.slice(0, MAX_FEN_LENGTH)
          : '';
      if (!fens.some((f) => f.trim() === fenToAdd)) {
        const emptyIndex = fens.findIndex((f) => !f.trim());
        if (emptyIndex !== -1 && emptyIndex < batchList.length) {
          updateBatchItem(emptyIndex, fenToAdd);
          setPastedIndex(emptyIndex);
        } else if (batchList.length < MAX_FENS) {
          addToBatch(fenToAdd);
          setPastedIndex(batchList.length);
        }
        if (pastedTimeoutRef.current) clearTimeout(pastedTimeoutRef.current);
        pastedTimeoutRef.current = setTimeout(() => setPastedIndex(null), 2000);
      }
      addedFenRef.current = true;
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fens, batchList.length, updateBatchItem, addToBatch, batchList]);

  const removeFenInput = useCallback(
    (index: number) => {
      if (index < batchList.length) {
        removeFromBatch(index);
        if (currentIndex >= batchList.length - 1) {
          setCurrentIndex(Math.max(0, batchList.length - 2));
        }
        const fenToRemove = batchList[index];
        if (fenToRemove) {
          setFavorites((prev) => {
            const newFavorites = { ...prev };
            delete newFavorites[fenToRemove];
            return newFavorites;
          });
        }
      }
    },
    [batchList, removeFromBatch, currentIndex]
  );

  const updateFen = useCallback(
    (index: number, value: string) => {
      const clampedValue =
        typeof value === 'string'
          ? value.slice(0, MAX_FEN_LENGTH)
          : String(value ?? '').slice(0, MAX_FEN_LENGTH);
      const trimmedValue = clampedValue.trim();
      if (
        trimmedValue &&
        batchList.some((f, i) => i !== index && f === trimmedValue)
      ) {
        setDuplicateWarning(index);
        if (duplicateTimeoutRef.current)
          clearTimeout(duplicateTimeoutRef.current);
        duplicateTimeoutRef.current = setTimeout(
          () => setDuplicateWarning(null),
          3000
        );
        return;
      }
      if (index < batchList.length) {
        updateBatchItem(index, clampedValue);
      } else if (trimmedValue && batchList.length < MAX_FENS) {
        addToBatch(trimmedValue);
      }
    },
    [batchList, updateBatchItem, addToBatch]
  );

  const handlePasteFEN = useCallback(
    async (index: number) => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          updateFen(index, text.trim());
          setPastedIndex(index);
          if (pastedTimeoutRef.current) clearTimeout(pastedTimeoutRef.current);
          pastedTimeoutRef.current = setTimeout(() => setPastedIndex(null), 2000);
        }
      } catch (err) {
        logger.error('Failed to paste:', err);
      }
    },
    [updateFen]
  );

  const toggleFavorite = useCallback((fen: string) => {
    if (!fen || !validateFEN(fen)) return;
    setFavorites((prev) => ({
      ...prev,
      [fen]: !prev[fen]
    }));
  }, []);

  return {
    fens,
    favorites,
    setFavorites,
    currentIndex,
    setCurrentIndex,
    pastedIndex,
    fenErrors,
    duplicateWarning,
    batchList,
    removeFenInput,
    updateFen,
    handlePasteFEN,
    toggleFavorite
  };
}
