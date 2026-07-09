import { useState } from 'react';
import { useMfa } from '../useMfa';
import { logger } from '@utils';
import {
  BackupCodesCard,
  EnabledCard,
  LoadingCard,
  ScanQrCard,
  SetupStartCard
} from './TwoFactorSteps';

export function TwoFactor() {
  const {
    status,
    isMfaUnavailable,
    startEnrollment,
    verifyAndEnable,
    disableMfa
  } = useMfa();

  // State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [totpData, setTotpData] = useState<{
    uri: string;
    secret: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers
  const handleSetupStart = async () => {
    if (isSubmitting || isMfaUnavailable) return;
    setError('');
    setIsSubmitting(true);

    try {
      const data = await startEnrollment();
      setTotpData(data);
      setStep(2);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isMfaUnavailable) return;

    setError('');
    setIsSubmitting(true);

    try {
      const codes = await verifyAndEnable(verifyCode);
      setBackupCodes(codes);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);

    try {
      await disableMfa();
      setStep(1);
      setTotpData(null);
      setVerifyCode('');
      setBackupCodes([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    setStep(1);
    setTotpData(null);
    setVerifyCode('');
    setBackupCodes([]);
  };

  const downloadBackupCodes = () => {
    const text = `ChessViewer 2FA Backup Codes\nGenerated on: ${new Date().toLocaleDateString()}\n\nKeep these codes safe! Each code can only be used once.\n\n${backupCodes.join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chessviewer-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyBackupCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      logger.error('Failed to copy backup code:', err);
    }
  };

  if (status === 'loading') return <LoadingCard />;

  if (status === 'enabled' && step !== 3) {
    return <EnabledCard isDisabling={isSubmitting} onDisable={handleDisable} />;
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      {error && (
        <div className="rounded-lg bg-error/10 border border-error/20 p-4 text-sm text-error font-medium">
          {error}
        </div>
      )}

      {step === 1 && (
        <SetupStartCard
          isSubmitting={isSubmitting}
          isMfaUnavailable={isMfaUnavailable}
          onStart={handleSetupStart}
        />
      )}

      {step === 2 && totpData && (
        <ScanQrCard
          totpUri={totpData.uri}
          secret={totpData.secret}
          verifyCode={verifyCode}
          isSubmitting={isSubmitting}
          onCodeChange={setVerifyCode}
          onVerify={handleVerify}
        />
      )}

      {step === 3 && (
        <BackupCodesCard
          backupCodes={backupCodes}
          copiedCode={copiedCode}
          onCopy={copyBackupCode}
          onDownload={downloadBackupCodes}
          onDone={handleDone}
        />
      )}
    </div>
  );
}
