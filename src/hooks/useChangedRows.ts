import { useCallback, useState } from 'react';

/**
 * Tracks a Set of changed row IDs and provides helpers.
 * Returns a tuple: [changedRows, add, remove, clear]
 */
export function useChangedRows() {
  const [changedRows, setChangedRows] = useState<Set<string>>(new Set());

  const add = useCallback((rowId: string) => {
    if (!rowId) return;
    setChangedRows(prev => {
      const next = new Set(prev);
      next.add(rowId);
      return next;
    });
  }, []);

  const remove = useCallback((rowId: string) => {
    if (!rowId) return;
    setChangedRows(prev => {
      const next = new Set(prev);
      next.delete(rowId);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setChangedRows(new Set());
  }, []);

  return [changedRows, add, remove, clear] as const;
}

