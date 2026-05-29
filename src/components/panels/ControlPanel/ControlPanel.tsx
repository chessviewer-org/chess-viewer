import {
  memo,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';

import { History, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { FENInputField } from '@/components/panels/Fen';
import type { NotificationType } from '@/components/panels/Fen/FENInputField/FENInputField';
import { useFENHistory } from '@hooks';

import { MAX_FEN_LENGTH } from '@utils/validation';

/** Props for the `ControlPanel` sidebar component. */
export interface ControlPanelProps {
  fen: string;
  setFen: (fen: string) => void;
  addToFavoritesRef?: Ref<() => void>;
  onFavoriteStatusChange?: (status: boolean) => void;
  onNotification?: (message: string, type: NotificationType) => void;
  saveManualFen?: (fen: string) => void;
  saveExportFen?: (fen: string) => void;
  addCurrentToFavorites?: (
    fen: string,
    notify?: (message: string, type: NotificationType) => void
  ) => void;
}

const ControlPanel = memo(function ControlPanel({
  fen,
  setFen,
  addToFavoritesRef,
  onFavoriteStatusChange,
  onNotification,
  saveManualFen: externalSaveManualFen,
  saveExportFen: externalSaveExportFen,
  addCurrentToFavorites: externalAddCurrentToFavorites
}: ControlPanelProps) {
  const navigate = useNavigate();
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const localHistory = useFENHistory(fen, onFavoriteStatusChange);
  const addCurrentToFavorites =
    externalAddCurrentToFavorites || localHistory.addCurrentToFavorites;

  const handleFenChange = useCallback(
    (nextValue: string) => {
      setFen(
        nextValue.length > MAX_FEN_LENGTH
          ? nextValue.slice(0, MAX_FEN_LENGTH)
          : nextValue
      );
    },
    [setFen]
  );

  const handleFenBlur = useCallback(() => {
    if (externalSaveManualFen && fen && fen.trim()) {
      externalSaveManualFen(fen.trim());
    }
  }, [fen, externalSaveManualFen]);

  const handleCopyFEN = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fen);
      if (externalSaveExportFen) {
        externalSaveExportFen(fen);
      }
      setCopySuccess(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopySuccess(false), 2000);
      onNotification?.('FEN copied to clipboard', 'success');
    } catch {
      onNotification?.('Failed to copy FEN', 'error');
    }
  }, [fen, externalSaveExportFen, onNotification]);

  const handlePasteFEN = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const rawFen = text.trim();
        const pastedFen =
          rawFen.length > MAX_FEN_LENGTH
            ? rawFen.slice(0, MAX_FEN_LENGTH)
            : rawFen;

        setFen(pastedFen);
        if (externalSaveManualFen) {
          externalSaveManualFen(pastedFen);
        }

        if (rawFen.length > MAX_FEN_LENGTH) {
          onNotification?.(
            `FEN too long — truncated to ${MAX_FEN_LENGTH} chars`,
            'warning'
          );
        } else {
          onNotification?.('FEN pasted successfully', 'success');
        }
      }
    } catch {
      onNotification?.('Failed to paste from clipboard', 'error');
    }
  }, [setFen, externalSaveManualFen, onNotification]);

  useImperativeHandle(
    addToFavoritesRef,
    () => () => addCurrentToFavorites(fen, onNotification)
  );

  return (
    <>
      <div className="bg-surface border border-border/40 rounded-xl p-4 sm:p-5 lg:p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-semibold text-text-primary">
              FEN Notation
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/fen-history')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-accent text-xs sm:text-sm font-medium transition-colors duration-150 border border-accent/20 bg-accent/5 hover:bg-accent/10"
              >
                <History className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-accent text-xs sm:text-sm font-medium transition-colors duration-150 border border-accent/20 bg-accent/5 hover:bg-accent/10"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          <FENInputField
            fen={fen}
            onChange={handleFenChange}
            onBlur={handleFenBlur}
            onCopy={handleCopyFEN}
            onPaste={handlePasteFEN}
            copySuccess={copySuccess}
            onAdvancedClick={() => navigate('/advanced-fen')}
            {...(onNotification && { onNotification })}
          />
        </div>
      </div>
    </>
  );
});

ControlPanel.displayName = 'ControlPanel';
export default ControlPanel;
