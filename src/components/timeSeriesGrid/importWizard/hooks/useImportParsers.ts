import { useMemo } from 'react';
import type { DateParser, NumberParser, DateParseResult, NumberParseResult } from '../types/importTypes';
import { IMPORT_CONSTANTS } from '../types/importTypes';

/**
 * Custom hook that provides locale-aware parsing functions for dates and numbers.
 * Consolidates all parsing logic in one place to ensure consistency between preview and commit.
 */
export function useImportParsers(locale: string) {
   const dateParser: DateParser = useMemo(() => {
      // Determine date component order via formatToParts
      const probe = new Date(2006, 1, 3); // Feb 3, 2006
      const parts = new Intl.DateTimeFormat(locale, {
         year: 'numeric',
         month: 'numeric',
         day: 'numeric'
      }).formatToParts(probe);

      const order = parts
         .filter(p => p.type === 'month' || p.type === 'day' || p.type === 'year')
         .map(p => p.type);

      return (raw: any): DateParseResult => {
         // Handle null/undefined/empty
         if (raw == null || raw === '') {
            return { value: null };
         }

         // Handle Excel serial numbers
         if (typeof raw === 'number') {
            const { EXCEL_SERIAL_DATE_MIN, EXCEL_SERIAL_DATE_MAX } = IMPORT_CONSTANTS;

            // Validate reasonable date range
            if (raw < EXCEL_SERIAL_DATE_MIN || raw > EXCEL_SERIAL_DATE_MAX) {
               return { error: `Number ${raw} outside valid Excel date range` };
            }

            try {
               // Excel epoch: Dec 30, 1899
               const epoch = new Date(Date.UTC(1899, 11, 30));
               const ms = raw * 86400000; // days to milliseconds
               const d = new Date(epoch.getTime() + ms);

               if (isNaN(d.getTime())) {
                  return { error: `Invalid date from Excel serial: ${raw}` };
               }

               return {
                  value: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
               };
            } catch (e: any) {
               return { error: `Failed to parse Excel date: ${e.message}` };
            }
         }

         const s = String(raw).trim();

         // Try native Date parsing first
         const d1 = new Date(s);
         if (!isNaN(d1.getTime())) {
            return {
               value: new Date(Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate()))
            };
         }

         // Fallback: Parse locale-aware format (e.g., "12/31/2025", "31.12.2025")
         const nums = s.split(/\D+/).filter(Boolean).map(t => parseInt(t, 10));

         if (nums.length >= 3 && order.length === 3) {
            const map: Record<string, number> = { month: 0, day: 0, year: 0 };
            order.forEach((k, i) => {
               map[k] = nums[i];
            });

            let { year, month, day } = map as { year: number; month: number; day: number };

            // Handle 2-digit years
            if (year < 100) {
               year = year < 50 ? 2000 + year : 1900 + year;
            }

            // Validate ranges
            const mm = Math.max(1, Math.min(12, month)) - 1; // 0-indexed
            const dd = Math.max(1, Math.min(31, day));

            // Validate day for month
            const testDate = new Date(Date.UTC(year, mm, dd));
            if (testDate.getUTCDate() !== dd || testDate.getUTCMonth() !== mm) {
               return { error: `Invalid date: ${month}/${day}/${year} (day doesn't exist in month)` };
            }

            return { value: testDate };
         }

         return { error: `Could not parse date: "${s}"` };
      };
   }, [locale]);

   const numberParser: NumberParser = useMemo(() => {
      const fmt = new Intl.NumberFormat(locale);
      const parts = fmt.formatToParts(12345.6);

      const group = parts.find(p => p.type === 'group')?.value || ',';
      const decimal = parts.find(p => p.type === 'decimal')?.value || '.';
      const percentSign = new Intl.NumberFormat(locale, { style: 'percent' })
         .formatToParts(1)
         .find(p => p.type === 'percentSign')?.value || '%';

      const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const groupRe = new RegExp(escapeRegex(group), 'g');
      const decRe = decimal !== '.' ? new RegExp(escapeRegex(decimal), 'g') : null;
      const pctRe = new RegExp(escapeRegex(percentSign) + '$');

      return (raw: any): NumberParseResult => {
         // Already a number
         if (typeof raw === 'number') {
            if (isNaN(raw) || !isFinite(raw)) {
               return { error: `Invalid number: ${raw}` };
            }
            return { value: raw };
         }

         // Handle null/undefined/empty
         let s = String(raw ?? '').trim();
         if (!s) {
            return { value: null };
         }

         // Remove currency symbols and non-breaking spaces
         s = s.replace(/[$€£¥₩₹\u00A0]/g, '');

         // Handle negative numbers in parentheses: (123) = -123
         let isNegative = false;
         if (/^\(.*\)$/.test(s)) {
            isNegative = true;
            s = s.slice(1, -1).trim();
         }

         // Handle percentage
         let isPercentage = false;
         if (pctRe.test(s)) {
            isPercentage = true;
            s = s.replace(pctRe, '').trim();
         }

         // Remove grouping separators
         s = s.replace(groupRe, '');

         // Replace decimal separator with '.'
         if (decRe) {
            s = s.replace(decRe, '.');
         }

         // Handle negative sign
         if (s.startsWith('-') || s.startsWith('+')) {
            if (s.startsWith('-')) isNegative = !isNegative;
            s = s.slice(1);
         }

         // Final parse
         const num = parseFloat(s);

         if (isNaN(num)) {
            return { error: `Not a valid number: "${raw}"` };
         }

         let result = num;
         if (isNegative) result = -result;
         if (isPercentage) result = result / 100;

         return { value: result };
      };
   }, [locale]);

   return {
      parseDate: dateParser,
      parseNumber: numberParser
   };
}
