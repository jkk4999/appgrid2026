import { useCallback, useMemo, useRef } from 'react';

// Returns a stable key for a selected view and a signal if it changed.
// The consumer must call `acknowledge()` after successfully processing the change;
// until then, `changed` remains true so a retry can pick it up (e.g. when the
// grid API becomes available on a later render).
export function useStableViewRef<T extends Record<string, any> | null | undefined>(
  value: T,
  getKey?: (v: NonNullable<T>) => string | undefined
) {
  const key = useMemo(() => {
    if (!value) return undefined;
    if (getKey) return getKey(value as NonNullable<T>);
    const v: any = value;
    return v?.id || v?.Id || v?.name || v?.Name || undefined;
  }, [getKey, value]);

  const prevKeyRef = useRef<string | undefined>(undefined);
  const changed = key !== undefined && key !== prevKeyRef.current;

  const acknowledge = useCallback(() => {
    prevKeyRef.current = key;
  }, [key]);

  return { key, changed, acknowledge };
}
