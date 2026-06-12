import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Keyboard interaction model for an ARIA single-select listbox / combobox
 * (WCAG Authoring Practices "Select-Only Combobox" + "Listbox" patterns).
 *
 * Owns the *active* (highlighted) option index — distinct from the *selected*
 * value — plus type-ahead, and produces a single `onKeyDown` handler the
 * trigger/listbox can spread. The consumer keeps ownership of open state and
 * the selected value; this hook only computes the active index and emits
 * `onSelect`/`onOpen`/`onClose` intents so it stays presentation-agnostic and
 * reusable across `CustomSelect`, `SearchableSelect`, and similar menus.
 *
 * It does not render anything and holds no DOM refs for the options, so it adds
 * no per-option React state churn.
 */
export interface UseListboxKeyboardParams {
  /** Whether the popup is currently open. */
  isOpen: boolean;
  /** Number of selectable options currently rendered. */
  optionCount: number;
  /** Index of the currently selected option, or -1 when none. */
  selectedIndex: number;
  /** Open the popup (optionally seeding the active index). */
  onOpen: () => void;
  /** Close the popup. */
  onClose: () => void;
  /** Commit the option at `index` as the new selection. */
  onSelect: (index: number) => void;
  /**
   * Resolve a printable label for `index`, used for type-ahead matching.
   * Omit to disable type-ahead (e.g. when a text search input already filters).
   */
  getOptionLabel?: (index: number) => string;
}

export interface UseListboxKeyboard {
  /** Index of the visually highlighted option, or -1 when none. */
  activeIndex: number;
  /** Imperatively set the active index (e.g. on pointer hover). */
  setActiveIndex: (index: number) => void;
  /** Spread onto the focusable trigger (or the search input). */
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

  // Reset / seed the active option whenever the popup opens or closes.
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    } else {
      setActiveIndex(-1);
    }
    // selectedIndex intentionally read only at open time, not a live dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Keep the active index in range when the option list shrinks (e.g. filter).
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
      // Search from the option after the active one, wrapping around.
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
          // Space only commits when not typing in a search field; the caller
          // omits getOptionLabel for searchable variants, so guard on that.
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
