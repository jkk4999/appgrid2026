import { useMemo } from 'react';
import useStore from '../zustandStore';
import { useShallow } from 'zustand/react/shallow';
import { normalizeLocale } from '../utilities/locale';

// Map BCP47 to Day.js locale code (subset + common special cases)
const mapToDayjsLocale = (bcp47: string): string => {
  const lower = String(bcp47 || 'en-US').toLowerCase();
  const specials: Record<string, string> = {
    'zh-cn': 'zh-cn',
    'zh-tw': 'zh-tw',
    'pt-br': 'pt-br',
  };
  return specials[lower] || lower.split('-')[0] || 'en';
};

export function useAppLocale() {
  const userInfo = useStore(useShallow((s) => s.userInfo));

  const browserLocale = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().locale; } catch { return 'en-US'; }
  }, []);

  const appLocale = useMemo(
    () => normalizeLocale((userInfo as any)?.userLocale || (userInfo as any)?.locale || browserLocale, 'en-US'),
    [userInfo, browserLocale]
  );

  const dayjsLocaleCode = useMemo(() => mapToDayjsLocale(appLocale), [appLocale]);

  return { appLocale, dayjsLocaleCode } as const;
}

export default useAppLocale;

