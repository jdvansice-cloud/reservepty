'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isIdle: boolean;
}

export interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  immediate?: boolean;
}

export interface UseAsyncReturn<T, Args extends unknown[]> extends AsyncState<T> {
  execute: (...args: Args) => Promise<T>;
  reset: () => void;
  setData: (data: T | null) => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

function getInitialState<T>(): AsyncState<T> {
  return {
    data: null,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    isIdle: true,
  };
}

// ============================================================================
// USE ASYNC HOOK
// ============================================================================

/**
 * Generic hook for handling async operations with loading and error states
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }) {
 *   const { data: user, isLoading, error, execute } = useAsync(
 *     (id: string) => fetchUser(id),
 *     { immediate: false }
 *   );
 *
 *   useEffect(() => {
 *     execute(userId);
 *   }, [userId, execute]);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   return <UserCard user={user} />;
 * }
 * ```
 */
export function useAsync<T, Args extends unknown[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, Args> {
  const { onSuccess, onError, immediate = false } = options;
  const [state, setState] = useState<AsyncState<T>>(getInitialState);

  // Track mounted state to avoid state updates after unmount
  const mountedRef = useRef(true);

  // Store the latest callbacks
  const callbacksRef = useRef({ onSuccess, onError });
  callbacksRef.current = { onSuccess, onError };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T> => {
      setState({
        data: null,
        error: null,
        isLoading: true,
        isError: false,
        isSuccess: false,
        isIdle: false,
      });

      try {
        const result = await asyncFunction(...args);

        if (mountedRef.current) {
          setState({
            data: result,
            error: null,
            isLoading: false,
            isError: false,
            isSuccess: true,
            isIdle: false,
          });
          callbacksRef.current.onSuccess?.(result);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        if (mountedRef.current) {
          setState({
            data: null,
            error,
            isLoading: false,
            isError: true,
            isSuccess: false,
            isIdle: false,
          });
          callbacksRef.current.onError?.(error);
        }

        throw error;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState(getInitialState());
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({
      ...prev,
      data,
      isSuccess: data !== null,
      isIdle: false,
    }));
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
  };
}

// ============================================================================
// USE ASYNC CALLBACK HOOK
// ============================================================================

/**
 * Similar to useAsync but returns a memoized callback
 * Useful when you want to trigger the async operation from event handlers
 *
 * @example
 * ```tsx
 * function DeleteButton({ itemId }) {
 *   const { execute: deleteItem, isLoading } = useAsyncCallback(
 *     async (id: string) => {
 *       await api.delete(`/items/${id}`);
 *     }
 *   );
 *
 *   return (
 *     <button onClick={() => deleteItem(itemId)} disabled={isLoading}>
 *       {isLoading ? 'Deleting...' : 'Delete'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useAsyncCallback<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, Args> {
  return useAsync(asyncFunction, { ...options, immediate: false });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useAsync;
