import { useEffect, useState } from 'react';
import { validateFENDetailed } from '@/shared/utils';

export function useFenValidation(
  localFen: string,
  onValidFen: (fen: string) => void
) {
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const trimmed = localFen.trim();

    if (!trimmed) {
      setError(null);
      setIsValid(false);
      return;
    }

    const timer = setTimeout(() => {
      const result = validateFENDetailed(trimmed);

      setIsValid(result.isValid);
      setError(result.isValid ? null : result.errorMessage);

      if (result.isValid) {
        onValidFen(trimmed);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localFen, onValidFen]);

  return { error, isValid };
}
