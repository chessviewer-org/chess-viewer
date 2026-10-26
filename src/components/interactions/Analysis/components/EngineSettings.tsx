import { useId, type ReactNode } from 'react';
import { Checkbox } from '@/shared/ui/Checkbox';
import styles from '../styles/analysis.module.scss';

interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  display?: string;
  valueText?: string;
  disabled?: boolean;
  title?: string | undefined;
  onChange: (value: number) => void;
}

export function RangeSetting({
  label,
  value,
  min,
  max,
  display = String(value),
  valueText,
  disabled = false,
  title,
  onChange
}: RangeProps) {
  const inputId = useId();
  return (
    <label className={styles.setting} htmlFor={inputId} title={title}>
      <span>{label}</span>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        value={value}
        aria-valuetext={valueText}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
      <output>{display}</output>
    </label>
  );
}

interface Props {
  searchTimes: readonly number[];
  memorySizes: readonly number[];
  seconds: number;
  memoryMb: number;
  onSecondsChange: (seconds: number) => void;
  onMemoryChange: (memoryMb: number) => void;
  rules: boolean;
  onRulesChange: (rules: boolean) => void;
  header?: ReactNode;
  children?: ReactNode;
}

export function EngineSettings({
  searchTimes,
  memorySizes,
  seconds,
  memoryMb,
  onSecondsChange,
  onMemoryChange,
  rules,
  onRulesChange,
  header,
  children
}: Props) {
  return (
    <div className={styles.settings} aria-label="Engine settings">
      {header}
      <RangeSetting
        label="Time"
        value={searchTimes.findIndex((n) => n === seconds)}
        min={0}
        max={searchTimes.length - 1}
        display={`${seconds} s`}
        valueText={`${seconds} seconds`}
        onChange={(index) => onSecondsChange(searchTimes[index]!)}
      />
      <RangeSetting
        label="Hash"
        value={memorySizes.findIndex((n) => n === memoryMb)}
        min={0}
        max={memorySizes.length - 1}
        display={`${memoryMb} MB`}
        valueText={`${memoryMb} megabytes`}
        onChange={(index) => onMemoryChange(memorySizes[index]!)}
      />
      {children}
      <div title="Check moves using the active engine's rules. Turn off to edit the diagram freely.">
        <Checkbox
          checked={rules}
          onChange={(event) => onRulesChange(event.currentTarget.checked)}
          label="Enforce chess rules"
        />
      </div>
    </div>
  );
}
