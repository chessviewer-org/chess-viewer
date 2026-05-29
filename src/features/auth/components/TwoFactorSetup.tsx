import { TwoFactorBackupCodes } from './twoFactor/TwoFactorBackupCodes';
import { TwoFactorStart } from './twoFactor/TwoFactorStart';
import { TwoFactorVerify } from './twoFactor/TwoFactorVerify';
import { useTwoFactorSetup } from './twoFactor/useTwoFactorSetup';

export function TwoFactorSetup() {
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
    handleSetupStart,
    handleVerify
  } = useTwoFactorSetup();

  return (
    <div className="flex flex-col gap-4 w-full p-2">
      {error && (
        <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 text-sm rounded-lg">
          {error}
        </div>
      )}
      {isMfaUnavailable && (
        <div className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-sm rounded-lg">
          Supabase MFA is not enabled in this project. Repeated requests are
          paused.
        </div>
      )}

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
    </div>
  );
}
