import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from 'react';

import { Calendar, ChevronLeft, ChevronRight } from '@/assets/icons';
import { useOutsideClick } from '@hooks';
import styles from '../styles/ui.module.scss';

interface DatePickerProps {
  value: Date | string | number | null | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  label?: string;
  align?: 'left' | 'right';
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
  label,
  align = 'left'
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value);
    return new Date();
  });
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
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setOpenUpward(spaceBelow < 360);
  }, [isOpen]);

  useOutsideClick(containerRef, () => setIsOpen(false), isOpen);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs only when the popup opens
  }, [isOpen]);

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
        <label id={`${baseId}-label`} className={styles['dpLabel']}>
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
        className={styles['dpTrigger']}
      >
        <span className={value ? 'text-text-primary' : 'text-text-muted'}>
          {value ? formatDate(value) : placeholder}
        </span>
        <Calendar aria-hidden="true" className={styles['dpTriggerIcon']} />
      </button>

      <div
        role="dialog"
        aria-modal="false"
        aria-hidden={!isOpen}
        aria-labelledby={dialogLabelId}
        data-state={isOpen ? 'open' : 'closed'}
        className={`${styles['dpDropdown']} ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'} ${align === 'right' ? 'right-0' : 'left-0'}`}
      >
        <div className={styles['dpHeader']}>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePreviousMonth}
              aria-label="Previous month"
              className={styles['dpHeaderBtn']}
            >
              <ChevronLeft
                aria-hidden="true"
                className={styles['dpHeaderIcon']}
              />
            </button>

            <div
              id={dialogLabelId}
              aria-live="polite"
              className={styles['dpMonthTitle']}
            >
              {MONTH_NAMES[month]} {year}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className={styles['dpHeaderBtn']}
            >
              <ChevronRight
                aria-hidden="true"
                className={styles['dpHeaderIcon']}
              />
            </button>
          </div>
        </div>

        <div className="p-3">
          <div className={styles['dpGrid']} aria-hidden="true">
            {WEEK_DAYS.map((day) => (
              <div key={day} className={styles['dpWeekDay']}>
                {day}
              </div>
            ))}
          </div>

          <div
            ref={gridRef}
            role="grid"
            aria-labelledby={dialogLabelId}
            onKeyDown={handleGridKeyDown}
            className={styles['dpGrid']}
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
                  className={`${styles['dpDayCell']} ${
                    selected
                      ? styles['dpDaySelected']
                      : today
                        ? styles['dpDayToday']
                        : styles['dpDayNormal']
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles['dpFooter']}>
          <button
            type="button"
            onClick={handleClear}
            className={styles['dpFooterClear']}
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
            className={styles['dpFooterToday']}
          >
            Today
          </button>
        </div>
      </div>
    </div>
  );
});
DatePicker.displayName = 'DatePicker';
export { DatePicker };
