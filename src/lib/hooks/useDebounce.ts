'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ============================================================================
// USE DEBOUNCED VALUE
// ============================================================================

/**
 * Debounce a value - delays updating the value until after the specified delay
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 300);
 *
 *   useEffect(() => {
 *     if (debouncedSearch) {
 *       performSearch(debouncedSearch);
 *     }
 *   }, [debouncedSearch]);
 *
 *   return <input value={search} onChange={e => setSearch(e.target.value)} />;
 * }
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// USE DEBOUNCED CALLBACK
// ============================================================================

/**
 * Debounce a callback function - delays execution until after the specified delay
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [results, setResults] = useState([]);
 *
 *   const debouncedSearch = useDebouncedCallback(
 *     async (query: string) => {
 *       const data = await fetchResults(query);
 *       setResults(data);
 *     },
 *     300
 *   );
 *
 *   return (
 *     <input onChange={e => debouncedSearch(e.target.value)} />
 *   );
 * }
 * ```
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

// ============================================================================
// USE DEBOUNCED STATE
// ============================================================================

interface UseDebouncedStateReturn<T> {
  value: T;
  debouncedValue: T;
  setValue: (value: T) => void;
  isPending: boolean;
}

/**
 * Combined hook for debounced state - provides both immediate and debounced values
 *
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const { value, debouncedValue, setValue, isPending } = useDebouncedState('', 300);
 *
 *   return (
 *     <>
 *       <input value={value} onChange={e => setValue(e.target.value)} />
 *       {isPending && <Spinner />}
 *       <SearchResults query={debouncedValue} />
 *     </>
 *   );
 * }
 * ```
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number
): UseDebouncedStateReturn<T> {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    // If values are different, we're pending
    setIsPending(value !== debouncedValue);

    const timer = setTimeout(() => {
      setDebouncedValue(value);
      setIsPending(false);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay, debouncedValue]);

  return useMemo(
    () => ({
      value,
      debouncedValue,
      setValue,
      isPending,
    }),
    [value, debouncedValue, isPending]
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useDebounce;
