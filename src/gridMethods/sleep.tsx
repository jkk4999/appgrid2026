import { useCallback } from 'react';

export const useSleep = () => {
   const sleep = useCallback(
      (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
      []
   );
   return sleep;
};