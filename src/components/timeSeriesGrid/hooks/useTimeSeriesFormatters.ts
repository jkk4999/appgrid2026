import { useMemo } from 'react';
import { useFormatter } from '../../../utilities/useFormatters';
import type { Formatters } from '../utils/formatUtils';

/**
 * Custom hook that memoizes all formatters to prevent unnecessary re-renders.
 * These formatters are expensive to recreate and should be stable.
 *
 * @returns Memoized formatter objects
 */
export function useTimeSeriesFormatters(): Formatters {
   const {
      dateFormatter,
      numberFormatter,
      currencyFormatter,
      percentageFormatter
   } = useFormatter();

   // Memoize the formatters object to prevent triggering re-renders
   // when passed as dependencies
   return useMemo(
      () => ({
         dateFormatter,
         numberFormatter,
         currencyFormatter,
         percentageFormatter
      }),
      [dateFormatter, numberFormatter, currencyFormatter, percentageFormatter]
   );
}
