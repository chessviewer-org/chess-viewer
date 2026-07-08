export type MfaStatus = 'loading' | 'enabled' | 'disabled';

export interface VerifiedFactor {
  id: string;
  friendlyName: string | null;
  createdAt: string | null;
}
