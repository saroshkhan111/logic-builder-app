import { useEffect, useState } from 'react';

/**
 * Debounces a value by the specified delay.
 * Useful for preventing excessive API calls while the user is typing.
 *
 * @param value - The value to debounce
 * @param delayMs - Delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
