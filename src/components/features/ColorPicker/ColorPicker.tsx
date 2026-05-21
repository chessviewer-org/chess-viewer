import React, { useEffect, useRef } from 'react';
import { Palette } from 'lucide-react';

import { ColorInput } from '@/components/features/ColorPicker/parts';
import { useColorState } from '@hooks';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsv,
  hsvToRgb
} from '@utils/colorConversions';

import PickerModal from './PickerModal';

export interface ColorPickerProps {
  label?: string;
  value?: string;
  onChange: (color: string) => void;
  className?: string;
}

/**
 * @param {ColorPickerProps} props
 * @returns {JSX.Element}
 */
function ColorPicker({
  label,
  value = '#3B82F6',
  onChange,
  className = ''
}: ColorPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
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
  } = useColorState(value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        closeModal();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeModal]);

  useEffect(() => {
    setHexInput(value);
    setTempColor(value);
  }, [setHexInput, setTempColor, value]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const rgb = hexToRgb(tempColor);
      if (!rgb) return;

      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      const hueRgb = hsvToRgb(hsv.h, 100, 100);

      const gradientH = ctx.createLinearGradient(0, 0, width, 0);
      gradientH.addColorStop(0, 'white');
      gradientH.addColorStop(1, `rgb(${hueRgb.r}, ${hueRgb.g}, ${hueRgb.b})`);
      ctx.fillStyle = gradientH;
      ctx.fillRect(0, 0, width, height);

      const gradientV = ctx.createLinearGradient(0, 0, 0, height);
      gradientV.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradientV.addColorStop(1, 'rgba(0, 0, 0, 1)');
      ctx.fillStyle = gradientV;
      ctx.fillRect(0, 0, width, height);
    }
  }, [isOpen, tempColor]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(x, y, 1, 1).data;
    if (imageData[0] !== undefined && imageData[1] !== undefined && imageData[2] !== undefined) {
      const hex = rgbToHex(imageData[0], imageData[1], imageData[2]);
      handleColorSelect(hex);
    }
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hue = parseFloat(e.target.value);
    const rgb = hsvToRgb(hue, 100, 100);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    handleColorSelect(hex);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let hex = e.target.value.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    setHexInput(hex);
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setTempColor(hex);
    }
  };

  const handleApply = () => {
    onChange(tempColor);
    closeModal();
  };

  const getCurrentHue = () => {
    const rgb = hexToRgb(tempColor);
    if (!rgb) return 0;
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    return hsv.h;
  };

  const getRgbValues = () => {
    const rgb = hexToRgb(tempColor);
    return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '0, 0, 0';
  };

  return (
    <div className={`space-y-2 ${className}`} ref={pickerRef}>
      {label && (
        <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
          <Palette className="w-4 h-4 text-accent" />
          {label}
        </label>
      )}
      <div className="relative">
        <ColorInput
          value={value}
          hexInput={hexInput}
          onHexChange={handleHexChange}
          onToggle={toggleOpen}
          getRgbValues={getRgbValues}
        />
        <PickerModal
          isOpen={isOpen}
          tempColor={tempColor}
          canvasRef={canvasRef}
          activePalette={activePalette}
          setActivePalette={setActivePalette}
          copiedText={copiedText}
          onClose={closeModal}
          onCanvasClick={handleCanvasClick}
          onHueChange={handleHueChange}
          onColorSelect={handleColorSelect}
          onRandom={handleRandom}
          onReset={() => handleReset(value)}
          onCopy={() => handleCopy(tempColor)}
          onApply={handleApply}
          getCurrentHue={getCurrentHue}
          getRgbValues={getRgbValues}
        />
      </div>
    </div>
  );
}

export default ColorPicker;
