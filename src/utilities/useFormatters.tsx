// React
import { useMemo } from 'react';

// Zustand
import useStore from '../zustandStore'
import { useShallow } from 'zustand/react/shallow';
import { normalizeLocale } from './locale';

export const useFormatter = () => {
   // Global state
   const userInfo = useStore(useShallow((state) => state.userInfo));

   // Default values for when userInfo is not available
   const defaultLocale = 'en-US'; // Fallback locale
   const defaultCurrency = 'USD'; // Fallback currency

   // Prefer Salesforce's explicit userLocale; fallback to generic locale; both may be underscore-delimited
   const sfLocale = (userInfo?.userLocale || userInfo?.locale || defaultLocale) as string;
   const userCurrency = userInfo?.userCurrency || defaultCurrency;

   // Normalize to BCP 47 for Intl APIs
   const jsLocale = normalizeLocale(sfLocale, defaultLocale);

   // Formatters
   const dateFormatter = useMemo(
      () =>
         new Intl.DateTimeFormat(jsLocale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
         }),
      [jsLocale]
   );

   const percentageFormatter = useMemo(
      () =>
         new Intl.NumberFormat(jsLocale, {
            style: 'percent',
            maximumFractionDigits: 2,
         }),
      [jsLocale]
   );

   const numberFormatter = useMemo(
      () =>
         new Intl.NumberFormat(jsLocale, {
            style: 'decimal',
            maximumFractionDigits: 2,
         }),
      [jsLocale]
   );

   const currencyFormatter = useMemo(
      () =>
         new Intl.NumberFormat(jsLocale, {
            style: 'currency',
            currency: userCurrency,
         }),
      [jsLocale, userCurrency]
   );

   return { dateFormatter, numberFormatter, currencyFormatter, percentageFormatter };
};
