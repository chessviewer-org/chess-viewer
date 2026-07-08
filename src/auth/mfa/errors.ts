import { ERR_GENERIC } from './constants';

export function getMfaErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const errorObj = error as { message?: string };
    if (errorObj.message) {
      return errorObj.message;
    }
  }

  return ERR_GENERIC;
}

export function isProjectMfaDisabledError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const errorObj = error as { status?: number };
    return errorObj.status === 422;
  }
  return false;
}
