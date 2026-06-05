import { memo, useEffect, useState } from 'react';

import { CheckCircle2, ExternalLink, Eye, EyeOff, Trash2 } from 'lucide-react';

import {
  clearGeminiKey,
  loadGeminiKey,
  saveGeminiKey,
  verifyGeminiKey
} from '@utils';
import { Button } from '@shared/ui';

type Status =
  | { kind: 'idle' }
  | { kind: 'verifying' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string };

/**
 * Developer Options panel: lets each user paste their OWN Gemini Vision API key
 * so image-to-FEN scanning runs against their personal free-tier quota (1500/
 * day) instead of a shared site key. The key is verified, then stored encrypted
 * in this browser only — never sent to ChessVision servers. See
 * {@link @utils/geminiKeyStorage} and {@link @utils/geminiVision}.
 */
const DeveloperOptions = memo(function DeveloperOptions() {
  const [keyInput, setKeyInput] = useState('');
  const [reveal, setReveal] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  // Hydrate the field from the encrypted store on mount so an existing key is
  // editable rather than hidden behind an empty input.
  useEffect(() => {
    let active = true;
    void loadGeminiKey().then((key) => {
      if (!active) return;
      setKeyInput(key);
      setHasStoredKey(key.length > 0);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      setStatus({ kind: 'error', message: 'Enter a key first.' });
      return;
    }
    setStatus({ kind: 'verifying' });
    try {
      await verifyGeminiKey(trimmed);
      await saveGeminiKey(trimmed);
      setHasStoredKey(true);
      setStatus({ kind: 'saved' });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Verification failed.'
      });
    }
  }

  function handleClear() {
    clearGeminiKey();
    setKeyInput('');
    setHasStoredKey(false);
    setStatus({ kind: 'idle' });
  }

  const inputId = 'gemini-api-key';

  return (
    <div className="space-y-6">
      <div className="bg-surface-elevated border border-border rounded-2xl p-6 space-y-5">
        <div className="flex flex-col gap-1">
          <label
            htmlFor={inputId}
            className="text-xs font-bold text-text-secondary uppercase tracking-wider"
          >
            Gemini Vision API Key
          </label>
          <p className="text-sm text-text-secondary">
            Powers the &ldquo;scan board from image&rdquo; button in the editor.
            Your key is encrypted and stored only in this browser — it is never
            sent to our servers.
          </p>
        </div>

        <div className="relative">
          <input
            id={inputId}
            type={reveal ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            value={keyInput}
            onChange={(e) => {
              setKeyInput(e.target.value);
              if (status.kind !== 'idle') setStatus({ kind: 'idle' });
            }}
            placeholder="AIza…"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/50 outline-none transition-colors duration-200"
          />
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary hover:text-text-primary transition-colors"
            aria-label={reveal ? 'Hide key' : 'Show key'}
          >
            {reveal ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => void handleSave()}
            disabled={status.kind === 'verifying'}
          >
            {status.kind === 'verifying' ? 'Verifying…' : 'Save & Verify'}
          </Button>
          {hasStoredKey && (
            <Button
              size="sm"
              variant="outline"
              icon={Trash2}
              onClick={handleClear}
            >
              Remove Key
            </Button>
          )}
        </div>

        {status.kind === 'saved' && (
          <p className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Key verified and saved locally. Scanning is now enabled.
          </p>
        )}
        {status.kind === 'error' && (
          <p className="text-sm text-error">{status.message}</p>
        )}
        {status.kind === 'idle' && hasStoredKey && (
          <p className="flex items-center gap-2 text-sm text-text-secondary">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />A key is
            stored on this device.
          </p>
        )}
      </div>

      <div className="bg-surface-elevated border border-border rounded-2xl p-6 space-y-3">
        <h4 className="text-sm font-bold text-text-primary">
          How to get a free Gemini API key
        </h4>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-text-secondary">
          <li>Open Google AI Studio and sign in with a Google account.</li>
          <li>
            Click <span className="font-semibold">Create API key</span> (free
            tier — about 1500 image scans per day).
          </li>
          <li>Copy the key (it starts with “AIza…”).</li>
          <li>Paste it above and press Save &amp; Verify.</li>
        </ol>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
        >
          Open Google AI Studio
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <p className="text-xs text-text-muted pt-1">
          Images are sent directly from your browser to Google for recognition.
          ChessVision never receives your key or your images.
        </p>
      </div>
    </div>
  );
});

DeveloperOptions.displayName = 'DeveloperOptions';
export default DeveloperOptions;
