import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isTextEntryTarget,
  ownsArrowKeys,
  getPageViewportHeight,
  canPageScroll,
  pageScrollBy,
  pageScrollToY,
  getPageScrollMax
} from '@/shared/utils';

export function useEscapeKey(onEscape: () => void): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onEscape]);
}

export interface PageScrollKeysOptions {
  enabled?: boolean;
  scrollStep?: number;
}

export function usePageScrollKeys(options: PageScrollKeysOptions = {}): void {
  const { enabled = true, scrollStep = 80 } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.defaultPrevented) return;
      if (isTextEntryTarget(e.target) || ownsArrowKeys(e.target)) return;

      const viewport = getPageViewportHeight();
      switch (e.key) {
        case 'ArrowDown':
          if (!canPageScroll(1)) return;
          e.preventDefault();
          pageScrollBy(scrollStep);
          break;
        case 'ArrowUp':
          if (!canPageScroll(-1)) return;
          e.preventDefault();
          pageScrollBy(-scrollStep);
          break;
        case 'PageDown':
          if (!canPageScroll(1)) return;
          e.preventDefault();
          pageScrollBy(viewport * 0.9);
          break;
        case 'PageUp':
          if (!canPageScroll(-1)) return;
          e.preventDefault();
          pageScrollBy(-viewport * 0.9);
          break;
        case 'Home':
          if (!canPageScroll(-1)) return;
          e.preventDefault();
          pageScrollToY(0);
          break;
        case 'End':
          if (!canPageScroll(1)) return;
          e.preventDefault();
          pageScrollToY(getPageScrollMax());
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, scrollStep]);
}

export interface EditorKeyboardActions {
  onFlip?: (() => void) | undefined;
  onUndo?: (() => void) | undefined;
  onRedo?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  onEscape?: (() => void) | undefined;
}

export interface EditorKeyboardOptions {
  enabled?: boolean;
}

export function useEditorKeyboard(
  actions: EditorKeyboardActions,
  options: EditorKeyboardOptions = {}
): void {
  const { enabled = true } = options;

  const actionsRef = useRef(actions);
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTextEntryTarget(e.target)) return;

      const mod = e.ctrlKey || e.metaKey;
      const a = actionsRef.current;

      if (mod && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) a.onRedo?.();
        else a.onUndo?.();
        return;
      }
      if (mod && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        a.onRedo?.();
        return;
      }

      if (!mod && !e.altKey) {
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          a.onFlip?.();
          return;
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          a.onDelete?.();
          return;
        }
        if (e.key === 'Escape') {
          a.onEscape?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}

export interface UseListboxKeyboardParams {
  isOpen: boolean;
  optionCount: number;
  selectedIndex: number;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (index: number) => void;
  getOptionLabel?: (index: number) => string;
}

export interface UseListboxKeyboard {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

const TYPEAHEAD_RESET_MS = 500;

const clampIndex = (index: number, count: number): number => {
  if (count <= 0) return -1;
  if (index < 0) return 0;
  if (index >= count) return count - 1;
  return index;
};

export function useListboxKeyboard({
  isOpen,
  optionCount,
  selectedIndex,
  onOpen,
  onClose,
  onSelect,
  getOptionLabel
}: UseListboxKeyboardParams): UseListboxKeyboard {
  const [activeIndex, setActiveIndex] = useState(-1);
  const typeaheadRef = useRef<{ query: string; timer: number | null }>({
    query: '',
    timer: null
  });

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    } else {
      setActiveIndex(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex((current) =>
      current < 0 ? current : clampIndex(current, optionCount)
    );
  }, [optionCount]);

  useEffect(() => {
    const typeahead = typeaheadRef.current;
    return () => {
      if (typeahead.timer !== null) {
        window.clearTimeout(typeahead.timer);
      }
    };
  }, []);

  const runTypeahead = useCallback(
    (char: string) => {
      if (!getOptionLabel || optionCount === 0) return;
      const state = typeaheadRef.current;
      if (state.timer !== null) {
        window.clearTimeout(state.timer);
      }
      state.query += char.toLowerCase();
      state.timer = window.setTimeout(() => {
        state.query = '';
        state.timer = null;
      }, TYPEAHEAD_RESET_MS);

      const start = activeIndex < 0 ? 0 : activeIndex;
      for (let offset = 0; offset < optionCount; offset += 1) {
        const index =
          (start + (state.query.length > 1 ? 0 : 1) + offset) % optionCount;
        const label = getOptionLabel(index).toLowerCase();
        if (label.startsWith(state.query)) {
          setActiveIndex(index);
          return;
        }
      }
    },
    [activeIndex, getOptionLabel, optionCount]
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const { key } = event;

      if (!isOpen) {
        if (
          key === 'ArrowDown' ||
          key === 'ArrowUp' ||
          key === 'Enter' ||
          key === ' ' ||
          key === 'Spacebar'
        ) {
          event.preventDefault();
          onOpen();
        }
        return;
      }

      switch (key) {
        case 'ArrowDown':
          event.preventDefault();
          setActiveIndex((current) =>
            clampIndex((current < 0 ? -1 : current) + 1, optionCount)
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex((current) =>
            clampIndex((current < 0 ? optionCount : current) - 1, optionCount)
          );
          break;
        case 'Home':
          event.preventDefault();
          setActiveIndex(clampIndex(0, optionCount));
          break;
        case 'End':
          event.preventDefault();
          setActiveIndex(clampIndex(optionCount - 1, optionCount));
          break;
        case 'Enter':
        case ' ':
        case 'Spacebar':
          if (key !== 'Enter' && getOptionLabel === undefined) {
            return;
          }
          event.preventDefault();
          if (activeIndex >= 0 && activeIndex < optionCount) {
            onSelect(activeIndex);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'Tab':
          onClose();
          break;
        default:
          if (key.length === 1 && !event.ctrlKey && !event.metaKey) {
            runTypeahead(key);
          }
      }
    },
    [
      activeIndex,
      getOptionLabel,
      isOpen,
      onClose,
      onOpen,
      onSelect,
      optionCount,
      runTypeahead
    ]
  );

  return { activeIndex, setActiveIndex, onKeyDown };
}
