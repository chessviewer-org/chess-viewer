import { useCallback, useRef } from 'react';

import { hsvToRgb, rgbToHex } from '@utils';

export function SaturationField({
  hue,
  s,
  v,
  onChange,
  className
}: {
  hue: number;
  s: number;
  v: number;
  onChange: (s: number, v: number) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const pick = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ns = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const nv =
        1 - Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      onChange(ns, nv);
    },
    [onChange]
  );

  const hueRgb = hsvToRgb(hue, 1, 1);
  const hueHex = rgbToHex(hueRgb.r, hueRgb.g, hueRgb.b);

  return (
    <div
      ref={ref}
      role="slider"
      aria-label="Saturation and brightness"
      aria-valuetext={`Saturation ${Math.round(s * 100)}%, brightness ${Math.round(v * 100)}%`}
      tabIndex={0}
      className={`relative ${className ?? 'h-28 w-full cursor-crosshair touch-none overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgba(128,128,128,0.25)]'}`}
      style={{
        backgroundColor: hueHex,
        backgroundImage:
          'linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0))'
      }}
      onPointerDown={(e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        pick(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) pick(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        draggingRef.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onKeyDown={(e) => {
        const step = 0.04;
        if (e.key === 'ArrowLeft') onChange(Math.max(0, s - step), v);
        else if (e.key === 'ArrowRight') onChange(Math.min(1, s + step), v);
        else if (e.key === 'ArrowUp') onChange(s, Math.min(1, v + step));
        else if (e.key === 'ArrowDown') onChange(s, Math.max(0, v - step));
        else return;
        e.preventDefault();
      }}
    >
      <span
        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
        style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }}
      />
    </div>
  );
}
