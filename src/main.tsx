import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Zustand
import useStore from './zustandStore';
import { useShallow } from 'zustand/react/shallow';

// React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Notifications
import { SnackbarProvider } from 'notistack';

// MUI
import {
   LocalizationProvider,
} from '@mui/x-date-pickers/LocalizationProvider';

import {
   StyledEngineProvider,
   createTheme,
   ThemeProvider,
} from '@mui/material/styles';

import * as locales from '@mui/material/locale';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { IntlProvider } from 'react-intl';

// Day.js
import dayjs from 'dayjs';
import useAppLocale from './hooks/useAppLocale';

// Syncfusion license
import { registerLicense } from '@syncfusion/ej2-base';
registerLicense('Ngo9BigBOggjGyl/Vkd+XU9FcVRDX3xKf0x/TGpQb19xflBPallYVBYiSV9jS3tTf0VrWH1bcnRUQ2RYUk91Xg==');

// App wrapper (provides apiClient and size to AppViewRouter/AppGrid)
import AppWrapper from './components/appGridAuraComponent/AppWrapper';

// Setup QueryClient
const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         staleTime: 480 * 60 * 1000, // 8 hours
      },
   },
});

// Map browser locale to Day.js-compatible locale
const getDayjsLocale = (locale: string): string => {
   const lower = locale.toLowerCase();
   const specialCases: { [key: string]: string } = {
      'zh-cn': 'zh-cn',
      'zh-tw': 'zh-tw',
      'pt-br': 'pt-br',
   };
   return specialCases[lower] || lower.split('-')[0];
};

// Dynamically import Day.js locale
const loadDayjsLocale = async (locale: string) => {
   const normalized = getDayjsLocale(locale);
   if (normalized === 'en') {
      dayjs.locale('en');
      return 'en';
   }

   try {
      await import(/* @vite-ignore */ `dayjs/locale/${normalized}.js`);
      dayjs.locale(normalized);
      return normalized;
   } catch {
      console.warn(`Dayjs locale '${normalized}' not found, falling back to 'en'`);
      dayjs.locale('en');
      return 'en';
   }
};

// Themed wrapper component
const ThemedAppGrid: React.FC = () => {
   const selectedAccentColor = useStore(useShallow((state) => state.selectedAccentColor));
   const { appLocale } = useAppLocale();
   const [dayjsLocale, setDayjsLocale] = useState<string>('en');

   const muiLocaleCode = appLocale.replace('-', '');
   const materialUILocale = muiLocaleCode in locales ? locales[muiLocaleCode as keyof typeof locales] : locales.enUS;

   useEffect(() => {
      loadDayjsLocale(appLocale).then(setDayjsLocale);
   }, [appLocale]);

   const theme = createTheme(
      {
         components: {
            MuiFormLabel: {
               styleOverrides: {
                  root: {
                     '&.Mui-disabled': {
                        color: `${selectedAccentColor}80 !important`,
                     },
                  },
               },
            },
            MuiTextField: {
               styleOverrides: {
                  root: {
                     '& .MuiFormLabel-root.Mui-disabled': {
                        color: `${selectedAccentColor}80 !important`,
                     },
                  },
               },
            },
            MuiInputLabel: {
               styleOverrides: {
                  root: {
                     '&.Mui-disabled': {
                        color: `${selectedAccentColor}80 !important`,
                     },
                  },
               },
            },
         },
      },
      materialUILocale
   );

   return (
      <StyledEngineProvider injectFirst>
         <ThemeProvider theme={theme}>
            <IntlProvider locale={appLocale}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={dayjsLocale}>
                  <SnackbarProvider autoHideDuration={null} maxSnack={1}>
                     <QueryClientProvider client={queryClient}>
                        <AppWrapper />
                     </QueryClientProvider>
                  </SnackbarProvider>
               </LocalizationProvider>
            </IntlProvider>
         </ThemeProvider>
      </StyledEngineProvider>
   );
};

// Mount React root
const container = document.getElementById('root');
if (container) {
   createRoot(container).render(<ThemedAppGrid />);
}
