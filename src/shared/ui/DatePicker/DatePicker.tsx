import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from 'react';

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
interface DatePickerProps {
  value: Date | string | number | null | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  label?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) =>
  new Date(year, month, 1).getDay();

const DatePicker = memo(function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  label
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value);
    return new Date();
  });
  // The day that holds keyboard focus inside the grid (roving tabindex).
  const [focusedDay, setFocusedDay] = useState<number>(() => {
    if (value) return new Date(value).getDate();
    return new Date().getDate();
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const dialogLabelId = `${baseId}-dialog-label`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // When the calendar opens, seed focus on the selected/today day and move DOM
  // focus into the grid so arrow keys work immediately.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const seed = value
      ? new Date(value)
      : new Date(year, month, Math.min(focusedDay, daysInMonth));
    const seedDay =
      value &&
      new Date(value).getFullYear() === year &&
      new Date(value).getMonth() === month
        ? seed.getDate()
        : Math.min(focusedDay, daysInMonth);
    setFocusedDay(seedDay);
    const node = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-day="${seedDay}"]`
    );
    node?.focus();
    // Only run when the popup opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Keep DOM focus on the focused day as it moves within the grid.
  useEffect(() => {
    if (!isOpen) return;
    const node = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-day="${focusedDay}"]`
    );
    if (node && document.activeElement !== node) {
      node.focus();
    }
  }, [focusedDay, isOpen, month, year]);

  const formatDate = (timestamp: Date | string | number) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${m}/${date.getFullYear()}`;
  };

  const formatLongDate = (y: number, m: number, d: number) =>
    new Date(y, m, d).toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  const handleDateSelect = useCallback(
    (day: number) => {
      onChange(new Date(year, month, day).getTime());
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [month, onChange, year]
  );
  const handlePreviousMonth = useCallback(() => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);
  const handleNextMonth = useCallback(() => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);
  const handleClear = useCallback(() => {
    onChange(undefined);
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [onChange]);

  // Move the focused day by `delta`, rolling into adjacent months as needed.
  const moveFocus = useCallback(
    (delta: number) => {
      const target = new Date(year, month, focusedDay + delta);
      if (target.getFullYear() !== year || target.getMonth() !== month) {
        setViewDate(new Date(target.getFullYear(), target.getMonth(), 1));
      }
      setFocusedDay(target.getDate());
    },
    [focusedDay, month, year]
  );

  const handleGridKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          moveFocus(-1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          moveFocus(1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          moveFocus(-7);
          break;
        case 'ArrowDown':
          event.preventDefault();
          moveFocus(7);
          break;
        case 'Home':
          event.preventDefault();
          setFocusedDay((d) => d - ((d - 1 + firstDay) % 7));
          break;
        case 'End':
          event.preventDefault();
          setFocusedDay((d) =>
            Math.min(daysInMonth, d + (6 - ((d - 1 + firstDay) % 7)))
          );
          break;
        case 'PageUp':
          event.preventDefault();
          handlePreviousMonth();
          setFocusedDay((d) => Math.min(d, getDaysInMonth(year, month - 1)));
          break;
        case 'PageDown':
          event.preventDefault();
          handleNextMonth();
          setFocusedDay((d) => Math.min(d, getDaysInMonth(year, month + 1)));
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          handleDateSelect(focusedDay);
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        default:
      }
    },
    [
      daysInMonth,
      firstDay,
      focusedDay,
      handleDateSelect,
      handleNextMonth,
      handlePreviousMonth,
      month,
      moveFocus,
      year
    ]
  );

  const selectedDate = value ? new Date(value) : null;
  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };
  const isSelected = (day: number) =>
    !!selectedDate &&
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year;

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label
          id={`${baseId}-label`}
          className="block text-xs font-semibold text-text-secondary mb-1.5"
        >
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        {...(label ? { 'aria-labelledby': `${baseId}-label` } : {})}
        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 flex items-center justify-between gap-2 hover:bg-surface-hover transition-colors"
      >
        <span className={value ? 'text-text-primary' : 'text-text-muted'}>
          {value ? formatDate(value) : placeholder}
        </span>
        <Calendar aria-hidden="true" className="w-4 h-4 text-accent" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby={dialogLabelId}
          className="absolute z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-surface-elevated border border-border rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="bg-linear-to-r from-accent/10 to-accent/5 px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePreviousMonth}
                aria-label="Previous month"
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-accent/10 transition-colors"
              >
                <ChevronLeft aria-hidden="true" className="w-5 h-5" />
              </button>

              <div
                id={dialogLabelId}
                aria-live="polite"
                className="text-sm font-bold text-text-primary"
              >
                {MONTH_NAMES[month]} {year}
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-accent/10 transition-colors"
              >
                <ChevronRight aria-hidden="true" className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 mb-2" aria-hidden="true">
              {WEEK_DAYS.map((day) => (
                <div
                  key={day}
                  className="h-8 flex items-center justify-center text-xs font-semibold text-text-muted"
                >
                  {day}
                </div>
              ))}
            </div>

            <div
              ref={gridRef}
              role="grid"
              aria-labelledby={dialogLabelId}
              onKeyDown={handleGridKeyDown}
              className="grid grid-cols-7 gap-1"
            >
              {Array.from(
                { length: firstDay },
                (_, index) => `empty-${year}-${month}-${index}`
              ).map((key) => (
                <div key={key} role="presentation" className="h-8" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const selected = isSelected(day);
                const today = isToday(day);
                const isFocusTarget = day === focusedDay;
                return (
                  <button
                    key={day}
                    data-day={day}
                    type="button"
                    role="gridcell"
                    aria-selected={selected}
                    aria-label={formatLongDate(year, month, day)}
                    tabIndex={isFocusTarget ? 0 : -1}
                    onClick={() => handleDateSelect(day)}
                    className={`
                      h-8 flex items-center justify-center text-sm rounded-lg font-medium transition-all focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
                      ${selected ? 'bg-accent text-bg shadow-md scale-105' : today ? 'bg-accent/20 text-accent font-bold' : 'text-text-primary hover:bg-surface-hover'}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-3 py-2 border-t border-border bg-surface flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-text-muted hover:text-error transition-colors px-3 py-1.5 rounded focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(Date.now());
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              className="text-xs font-semibold text-accent hover:text-text-primary-hover transition-colors px-3 py-1.5 rounded focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
DatePicker.displayName = 'DatePicker';
export default DatePicker;
