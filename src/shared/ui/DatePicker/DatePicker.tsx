import { memo, useEffect, useRef, useState } from 'react';

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
export interface DatePickerProps {
  value: Date | string | number | null | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  label?: string;
}

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
  const containerRef = useRef<HTMLDivElement>(null);
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
  const formatDate = (timestamp: Date | string | number) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  const handleDateSelect = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(selected.getTime());
    setIsOpen(false);
  };
  const handlePreviousMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const handleClear = () => {
    onChange(undefined);
    setIsOpen(false);
  };
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = [
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
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const selectedDate = value ? new Date(value) : null;
  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };
  const isSelected = (day: number) => {
    return (
      selectedDate &&
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };
  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-text-secondary mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent flex items-center justify-between gap-2 hover:bg-surface-hover transition-colors"
      >
        <span className={value ? 'text-text-primary' : 'text-text-muted'}>
          {value ? formatDate(value) : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-accent" />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-surface-elevated border border-border rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-linear-to-r from-accent/10 to-accent/5 px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePreviousMonth}
                className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-sm font-bold text-text-primary">
                {monthNames[month]} {year}
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="h-8 flex items-center justify-center text-xs font-semibold text-text-muted"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from(
                {
                  length: firstDay
                },
                (_, index) => `empty-${year}-${month}-${index}`
              ).map((key) => (
                <div key={key} className="h-8" />
              ))}

              {Array.from({
                length: daysInMonth
              }).map((_, index) => {
                const day = index + 1;
                const selected = isSelected(day);
                const today = isToday(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={`
                      h-8 flex items-center justify-center text-sm rounded-lg font-medium transition-all
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
              className="text-xs font-semibold text-text-muted hover:text-error transition-colors px-3 py-1.5"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(Date.now());
                setIsOpen(false);
              }}
              className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors px-3 py-1.5"
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
