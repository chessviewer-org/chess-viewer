import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, Copy } from 'lucide-react';

/** Props for the `SelectedPreview` color confirmation panel. */
export interface SelectedPreviewProps {
  tempColor: string;
  getRgbValues: () => string;
  onCopy: () => void;
  onApply: () => void;
}

/** Displays the currently selected color with Copy and Apply actions. */
const SelectedPreview = memo(
  function SelectedPreview({ tempColor, getRgbValues, onCopy, onApply }: SelectedPreviewProps) {
    const [copied, setCopied] = useState(false);
    const [applied, setApplied] = useState(false);
    const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const applyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      return () => {
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        if (applyTimeoutRef.current) clearTimeout(applyTimeoutRef.current);
      };
    }, []);

    const handleCopy = useCallback(() => {
      onCopy();
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }, [onCopy]);

    const handleApply = useCallback(() => {
      onApply();
      setApplied(true);
      if (applyTimeoutRef.current) clearTimeout(applyTimeoutRef.current);
      applyTimeoutRef.current = setTimeout(() => setApplied(false), 1000);
    }, [onApply]);

    return (
      <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-surface shadow-2xl">
        <div
          className="absolute inset-0 opacity-10 blur-3xl transition-all duration-500"
          style={{
            background: `radial-gradient(circle at 30% 50%, ${tempColor}, transparent 70%)`
          }}
        />

        <div className="relative flex items-center gap-4 p-5">
          <div className="relative group">
            <div
              className="w-20 h-20 rounded-2xl border-2 border-border shadow-2xl transition-shadow duration-200 group-hover:shadow-md"
              style={{
                background: tempColor,
                boxShadow: `0 10px 40px ${tempColor}40, 0 0 0 1px ${tempColor}20`
              }}
            />
            <div
              className="absolute inset-0 rounded-2xl animate-pulse-ring"
              style={{
                boxShadow: `0 0 0 4px ${tempColor}20`,
                animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            />
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-linear-to-br from-accent to-accent/80 rounded-full border-2 border-bg flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Selected Color
            </div>
            <div className="text-lg font-bold font-mono text-text-primary mb-1 tracking-wide">
              {tempColor.toUpperCase()}
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent font-mono transition-all group outline-none"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-success" />
                  <span className="text-success font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5  transition-transform" />
                  <span>RGB: {getRgbValues()}</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleApply}
            disabled={applied}
            className="relative px-6 py-4 bg-linear-to-br from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 disabled:from-success/80 disabled:to-success text-bg font-bold rounded-xl transition-[background-color,box-shadow] duration-200 shadow-xl hover:shadow-2xl outline-none group overflow-hidden"
            style={{
              boxShadow: applied
                ? `0 10px 40px rgb(var(--color-success) / 0.4)`
                : `0 10px 40px rgb(var(--color-accent) / 0.3)`
            }}
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            <div className="relative flex items-center gap-2">
              {applied ? (
                <>
                  <CheckCheck className="w-5 h-5 animate-bounce" />
                  <span>Applied!</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5  transition-transform" />
                  <span>Apply</span>
                </>
              )}
            </div>
          </button>
        </div>

        <div
          className="h-1.5 w-full"
          style={{
            background: `linear-gradient(to right, ${tempColor}00, ${tempColor}, ${tempColor}00)`
          }}
        />

        <style>{`
          @keyframes pulse-ring {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.05); }
          }
        `}</style>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.tempColor === nextProps.tempColor &&
      prevProps.getRgbValues === nextProps.getRgbValues
    );
  }
);

SelectedPreview.displayName = 'SelectedPreview';
export default SelectedPreview;
