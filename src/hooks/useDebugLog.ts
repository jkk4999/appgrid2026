import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useStore from '../zustandStore';

// Simple gated debug logger.
// Logs only when Zustand `showDebugStatements` is true.
export function useDebugLog() {
  const show = useStore(useShallow((s) => s.showDebugStatements));

  const dlog = useCallback((label: string, data?: any, color: string = 'gray') => {
    try {
      if (!show) return;
      // Styled label + data if provided
      // Use console.log instead of prettyPrint to avoid extra gating
      console.log(`%c${label}`, `color:${color}; font-weight:600;`);
      if (typeof data !== 'undefined') {
        try {
          console.log(data);
        } catch {
          // no-op
        }
      }
    } catch {
      // swallow logging errors
    }
  }, [show]);

  return dlog;
}

export default useDebugLog;
