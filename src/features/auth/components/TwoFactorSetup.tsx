import { Loader2 } from 'lucide-react';

import { useModal } from '@/contexts';

import { TwoFactorBackupCodes } from './twoFactor/TwoFactorBackupCodes';
import { TwoFactorEnabled } from './twoFactor/TwoFactorEnabled';
import { TwoFactorStart } from './twoFactor/TwoFactorStart';
import { TwoFactorVerify } from './twoFactor/TwoFactorVerify';
import { useTwoFactorSetup } from './twoFactor/useTwoFactorSetup';

export function TwoFactorSetup() {
  const { showConfirm } = useModal();
  const {
    totpUri,
    secret,
    verifyCode,
    setVerifyCode,
    backupCodes,
    error,
    step,
    isSubmitting,
    isMfaUnavailable,
    status,
    verifiedFactors,
    isDisabling,
    handleSetupStart,
    handleVerify,
    handleDisable
  } = useTwoFactorSetup();

  const onDisable = async () => {
    const confirmed = await showConfirm(
      'Disable two-factor authentication',
      'This removes the second factor from your account. You will be able to sign in with just your password until you re-enable it. Continue?',
      'danger'
    );
    if (!confirmed) return;
    await handleDisable();
  };

  return (
    <div className="flex w-full flex-col gap-4 p-2">
      {error && (
        <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error">
          {error}
        </div>
      )}
      {isMfaUnavailable && (
        <div className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm text-warning">
          Supabase MFA is not enabled in this project. Repeated requests are
          paused.
        </div>
      )}

      {status === 'loading' && (
        <div
          className="flex items-center justify-center gap-2 py-8 text-sm text-text-secondary"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Checking two-factor status…
        </div>
      )}

      {status === 'enabled' && (
        <TwoFactorEnabled
          factors={verifiedFactors}
          isDisabling={isDisabling}
          onDisable={onDisable}
        />
      )}

      {status === 'disabled' && (
        <>
          {step === 1 && (
            <TwoFactorStart
              isSubmitting={isSubmitting}
              isMfaUnavailable={isMfaUnavailable}
              onStart={handleSetupStart}
            />
          )}

          {step === 2 && totpUri && (
            <TwoFactorVerify
              totpUri={totpUri}
              secret={secret}
              verifyCode={verifyCode}
              setVerifyCode={setVerifyCode}
              isSubmitting={isSubmitting}
              onVerify={handleVerify}
            />
          )}

          {step === 3 && <TwoFactorBackupCodes backupCodes={backupCodes} />}
        </>
      )}
    </div>
  );
}
