import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Returns a stable, per-instance gridId to scope PubSub events
export function useGridId(): string {
  const idRef = useRef<string>(uuidv4());
  return idRef.current;
}

