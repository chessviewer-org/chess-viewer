import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../core/Supabase';
import { MfaStatus, VerifiedFactor } from './types';
import { mfaApi } from './api';
import { isProjectMfaDisabledError } from './errors';
import { logger } from '@/shared/utils';
import {
  STATUS_VERIFIED,
  STATUS_UNVERIFIED,
  STATUS_DISABLED,
  STATUS_ENABLED,
  ERR_SIGN_IN,
  ERR_NO_SETUP,
  ERR_6_DIGITS
} from './constants';

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------
export function useMfa() {
  // -----------------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------------
  const [status, setStatus] = useState<MfaStatus>('loading');
  const [verifiedFactors, setVerifiedFactors] = useState<VerifiedFactor[]>([]);
  const [isMfaUnavailable, setIsMfaUnavailable] = useState(false);

  // -----------------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------------
  const refreshStatus = useCallback(async (): Promise<VerifiedFactor[]> => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setStatus(STATUS_DISABLED);
        setVerifiedFactors([]);
        return [];
      }

      const { data: factors, error } = await mfaApi.fetchFactors();

      if (error) {
        if (isProjectMfaDisabledError(error)) setIsMfaUnavailable(true);
        setStatus(STATUS_DISABLED);
        setVerifiedFactors([]);
        return [];
      }

      if (!factors) {
        setStatus(STATUS_DISABLED);
        setVerifiedFactors([]);
        return [];
      }

      const verified = factors.totp
        .filter((f) => f.status === STATUS_VERIFIED)
        .map((f) => ({
          id: f.id,
          friendlyName: f.friendly_name ?? null,
          createdAt: f.created_at ?? null
        }));

      setVerifiedFactors(verified);
      setStatus(verified.length > 0 ? STATUS_ENABLED : STATUS_DISABLED);
      return verified;
    } catch (err) {
      logger.error('MFA status refresh failed:', err);
      setStatus(STATUS_DISABLED);
      return [];
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const startEnrollment = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) throw new Error(ERR_SIGN_IN);

    const { data: factors } = await mfaApi.fetchFactors();

    if (factors) {
      await Promise.all(
        factors.all
          .filter(
            (f) => f.factor_type === 'totp' && f.status === STATUS_UNVERIFIED
          )
          .map((f) => mfaApi.unenroll(f.id))
      );
    }

    return mfaApi.enroll(user.email);
  };

  const verifyAndEnable = async (code: string) => {
    if (!/^\d{6}$/.test(code)) throw new Error(ERR_6_DIGITS);

    const { data: factors } = await mfaApi.fetchFactors();
    const unverifiedFactor = mfaApi.findFactorByStatus(
      factors,
      STATUS_UNVERIFIED
    );

    if (!unverifiedFactor) throw new Error(ERR_NO_SETUP);

    const challenge = await mfaApi.challenge(unverifiedFactor.id);
    await mfaApi.verify(unverifiedFactor.id, challenge.id, code);

    let recoveryCodes: string[] = [];
    try {
      recoveryCodes = await mfaApi.generateRecoveryCodes();
    } catch (err) {
      logger.error('Could not generate backup codes:', err);
    }

    await refreshStatus();

    return recoveryCodes;
  };

  const disableMfa = async () => {
    const targets =
      verifiedFactors.length > 0 ? verifiedFactors : await refreshStatus();
    await Promise.all(targets.map((f) => mfaApi.unenroll(f.id)));
    await refreshStatus();
  };

  return {
    status,
    verifiedFactors,
    isMfaUnavailable,
    refreshStatus,
    startEnrollment,
    verifyAndEnable,
    disableMfa
  };
}
