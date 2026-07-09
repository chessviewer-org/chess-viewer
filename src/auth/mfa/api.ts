import { supabase } from '../core/Supabase';
import { FACTOR_TYPE_TOTP, ISSUER_NAME } from './constants';
import { getMfaErrorMessage, isProjectMfaDisabledError } from './errors';

// Service
export const mfaApi = {
  async fetchFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors();
    return { data, error };
  },

  findFactorByStatus(
    factorsData: {
      all?: Array<{ id: string; status: string; factor_type: string }>;
    } | null,
    targetStatus: string
  ) {
    if (!factorsData || !factorsData.all) return null;
    for (const factor of factorsData.all) {
      if (factor.factor_type === 'totp' && factor.status === targetStatus)
        return factor;
    }
    return null;
  },

  async enroll(email: string | undefined) {
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const factorName = email
      ? `${email} (${uniqueId})`
      : `${ISSUER_NAME} Auth (${uniqueId})`;

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: FACTOR_TYPE_TOTP,
      issuer: ISSUER_NAME,
      friendlyName: factorName
    });

    if (error) {
      const msg = getMfaErrorMessage(error);
      const is422 = isProjectMfaDisabledError(error);
      if (is422 && !msg.toLowerCase().includes('email')) {
        throw new Error(
          `2FA setup failed (${msg}). Please ensure MFA/TOTP is enabled in your Supabase project settings.`
        );
      }
      throw new Error(msg);
    }

    if (!data) throw new Error('Failed to start setup.');
    if (data.type !== FACTOR_TYPE_TOTP)
      throw new Error('Only TOTP is supported.');

    return data.totp;
  },

  async unenroll(factorId: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw new Error(getMfaErrorMessage(error));
  },

  async challenge(factorId: string) {
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });
    if (error) throw new Error(getMfaErrorMessage(error));
    if (!data) throw new Error('Failed to create challenge.');
    return data;
  },

  async verify(factorId: string, challengeId: string, code: string) {
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code
    });
    if (error) throw new Error(getMfaErrorMessage(error));
  },

  async generateRecoveryCodes(): Promise<string[]> {
    const { data } = await supabase.rpc<string[]>('generate_recovery_codes');
    return data || [];
  }
};
