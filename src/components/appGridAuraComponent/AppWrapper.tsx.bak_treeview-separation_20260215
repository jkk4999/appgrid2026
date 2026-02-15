// react
import React, {
   useMemo,
   useState,
   useImperativeHandle,
   useCallback,
   forwardRef,
   useEffect,
   useRef
} from 'react';

import '../../app.css';

// Import Syncfusion Material 3 CSS - supports dark mode via e-dark-mode class on body
// Material 3 includes both light and dark modes in single CSS files with CSS variables
import '@syncfusion/ej2-base/styles/material3.css';
import '@syncfusion/ej2-buttons/styles/material3.css';
import '@syncfusion/ej2-calendars/styles/material3.css';
import '@syncfusion/ej2-dropdowns/styles/material3.css';
import '@syncfusion/ej2-inputs/styles/material3.css';
import '@syncfusion/ej2-navigations/styles/material3.css';
import '@syncfusion/ej2-popups/styles/material3.css';
import '@syncfusion/ej2-splitbuttons/styles/material3.css';
import '@syncfusion/ej2-lists/styles/material3.css';
import '@syncfusion/ej2-grids/styles/material3.css';
import '@syncfusion/ej2-querybuilder/styles/material3.css';
/* Note: e-icons font is included in ej2-base/styles/material3.css */
/* Removed duplicate import of ej2-icons/styles/material.css to avoid font conflicts */

// Custom overrides for Syncfusion components (includes dark mode overrides scoped to .theme-dark)
// import '../../syncfusionStyles.css'

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

import ErrorBoundary from '../errorBoundry/ErrorBoundary'

// SfdcClient
import { SfdcClient } from '../../brideDesignPattern/sfdcClient';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { IntlProvider } from 'react-intl';

// components
import AppViewRouter from '../../AppViewRouter';

// import { GridWithChartsTest } from '../appGridChartTest/appGridChartTest'

import PubSub from 'pubsub-js';


// MUI
import {
   LocalizationProvider,
} from '@mui/x-date-pickers/LocalizationProvider';

import { ThemeProvider } from '@mui/material';

import { getTheme } from './theme';

import { useThemeStore } from './themeStore';

// notifications
import { enqueueSnackbar, SnackbarProvider } from 'notistack';

import dayjs from 'dayjs';

import useAppLocale from '../../hooks/useAppLocale';

import { prettyPrint } from '../../utilities/prettyPrint';

import LoadingIndicator from '../loadingIndicator/LoadingIndicator';

// LMS Actions
import { LMS_ACTIONS, LmsResponse } from '../../lms/lmsActions';
import { TOPICS } from '../../events/topics';

const HOST_SIZE_TYPE = 'appgrid:host-size';

interface Size {
   width: number;
   height: number;
}

import { UserInfo, UserProfile, OrgObject, SObjectGridPermission, SObjectObjPreference } from '../../sObjectMetadataTypes'

export interface InitialDataResponse {
   userInfo: UserInfo;
   userProfile: UserProfile;
   orgObjects: OrgObject[];
   gridPermissions: SObjectGridPermission[];
   objPreferences: SObjectObjPreference[];
   metadata: Record<string, unknown>;
}


export interface AppProps {
   initialData?: InitialDataResponse;
   headerOffset?: number;
}

export interface AppHandle {
   apiClient: SfdcClient;
   handleLmsAction: (action: string, payload?: Record<string, unknown>) => Promise<LmsResponse>;
}

export const AppWrapper = forwardRef<AppHandle, AppProps>((props, ref) => {

   // theme
   const mode = useThemeStore(s => s.mode);

   const setMode = useThemeStore((state) => state.setMode);

   const { initialData: initialDataProp } = props;

   // In iframe/Cloudflare mode, initialData is not passed as a prop — fetch it via the bridge
   const [fetchedInitialData, setFetchedInitialData] = useState<InitialDataResponse | undefined>(undefined);

   const initialData = initialDataProp ?? fetchedInitialData;

   /*---- GLOBAL STATE ----*/
   const {
      selectedGridColorTheme,
      orgObjects,
      setSelectedView,
      setSlackConfigConfigured,
   } = useStore(useShallow((state) => ({
      selectedGridColorTheme: state.selectedGridColorTheme,
      orgObjects: state.orgObjects,
      setSelectedView: state.setSelectedView,
      setSlackConfigConfigured: state.setSlackConfigConfigured,
   })));

   const containerRef = useRef<HTMLDivElement>(null);

   const [dayjsLocale, setDayjsLocale] = useState<string>('en');

   const [size, setSize] = useState<Size>({ width: 0, height: 0 });
   const [hostSize, setHostSize] = useState<Size | null>(null);

   const { appLocale, dayjsLocaleCode } = useAppLocale();

   // ✅ Memoized MUI theme based on current mode
   const theme = useMemo(() => getTheme(mode), [mode]);

   // ✅ Memoized API client
   const apiClient = useMemo(() => new SfdcClient(), []);

   // ✅ In iframe/Cloudflare mode: listen for prefetched initialData pushed from LWC host,
   //    then signal ready so the LWC knows to send it
   useEffect(() => {
      if (initialDataProp) return; // already provided by LWC host as prop

      const handler = (event: MessageEvent) => {
         const data = event.data;
         if (!data) return;

         if (data.type === 'appgrid:initial-data') {
            console.log('[AppWrapper] Received prefetched initialData from LWC host');
            setFetchedInitialData(data.data);
            return;
         }

         if (data.type === HOST_SIZE_TYPE && data.data) {
            const width = Number(data.data.width);
            const height = Number(data.data.height);
            if (width > 1 && height > 1) {
               setHostSize({ width, height });
            }
         }
      };

      window.addEventListener('message', handler);

      // Signal to LWC parent that we're ready to receive initialData
      window.parent.postMessage({ type: 'appgrid:ready' }, '*');

      return () => window.removeEventListener('message', handler);
   }, [initialDataProp]);

   // DEBUG: Commented out slackGetConfigStatus to test if it's causing slow load times
   // useEffect(() => {
   //    let isMounted = true;

   //    const loadSlackConfigStatus = async () => {
   //       try {
   //          const status = await apiClient.slackGetConfigStatus();

   //          const configured = status?.configured === true;

   //          if (isMounted) {
   //             setSlackConfigConfigured(configured);
   //          }
   //       } catch (error) {
   //          const errorDetails = {
   //             message: (error as any)?.message,
   //             bodyMessage: (error as any)?.body?.message,
   //             body: (error as any)?.body,
   //          };

   //          enqueueSnackbar(`Unexpected error loading slack - ${errorDetails}`, {
   //             variant: 'error',
   //             autoHideDuration: 0,
   //          })

   //          if (isMounted) {
   //             setSlackConfigConfigured(false);
   //          }
   //       }
   //    };

   //    // Delay slack config check to avoid competing with critical app initialization calls
   //    // This prevents Salesforce connection pooling issues on first load
   //    const timeoutId = setTimeout(() => {
   //       loadSlackConfigStatus();
   //    }, 5000);

   //    return () => {
   //       isMounted = false;
   //       clearTimeout(timeoutId);
   //    };
   // }, [apiClient, setSlackConfigConfigured]);

   // ✅ Observe container size using ResizeObserver
   useEffect(() => {
      const containerNode = containerRef.current;
      if (!containerNode) {
         return;
      }

      const observer = new ResizeObserver(entries => {
         for (const entry of entries) {
            const { width, height } = entry.contentRect;

            // Only set size if it's a meaningful value, not the initial 0x0.
            if (width > 1 && height > 1) {
               setSize({ width, height });
            }
         }
      });

      // Delay observation to give Aura time to remove the spinner.
      const timeoutId = setTimeout(() => {
         observer.observe(containerNode);
      }, 300); // A 300ms delay should be safe.

      return () => {
         clearTimeout(timeoutId);
         observer.disconnect();
      };
   }, []);

   const effectiveSize = hostSize ?? size;
   const isSizeReady = effectiveSize.width > 1 && effectiveSize.height > 1;

   // Debug log only when size actually becomes ready (not on every size change)
   const sizeReadyLoggedRef = useRef(false);
   useEffect(() => {
      if (isSizeReady && !sizeReadyLoggedRef.current) {
         sizeReadyLoggedRef.current = true;
         // prettyPrint('[AppWrapper] Container ready with size', effectiveSize, 'green');
      }
   }, [isSizeReady, effectiveSize]);

   // ✅ Load Day.js locale dynamically with fallback (based on appLocale)
   useEffect(() => {
      const loadLocale = async () => {
         const localeToLoad = dayjsLocaleCode || 'en';
         if (localeToLoad === 'en') {
            setDayjsLocale('en');
            return;
         }
         try {
            await import(`dayjs/locale/${localeToLoad}`);

            dayjs.locale(localeToLoad);

            setDayjsLocale(localeToLoad);
         } catch {
            setDayjsLocale('en');
         }
      };
      loadLocale();
   }, [dayjsLocaleCode]);

   // ✅ LMS action handler — shared by imperative ref and postMessage listener
   const handleLmsAction = useCallback(async (action: string, payload?: Record<string, unknown>): Promise<LmsResponse> => {
      const actionToTopic: Record<string, string> = {
         'getCapabilities': TOPICS.LMS_GET_CAPABILITIES,
         'selectObject': TOPICS.LMS_SELECT_OBJECT,
         'selectView': TOPICS.LMS_SELECT_VIEW,
         'selectQuery': TOPICS.LMS_SELECT_QUERY,
         'executeQuery': TOPICS.LMS_EXECUTE_QUERY,
         'getViews': TOPICS.LMS_GET_VIEWS,
         'getQueries': TOPICS.LMS_GET_QUERIES,
         'getOrgObjects': TOPICS.LMS_GET_ORG_OBJECTS,
         'getFilters': TOPICS.LMS_GET_FILTERS,
         'setAdvancedFilter': TOPICS.LMS_SET_ADVANCED_FILTER,
         'clearFilters': TOPICS.LMS_CLEAR_FILTERS,
         'getColumnStyles': TOPICS.LMS_GET_COLUMN_STYLES,
         'setColumnStyle': TOPICS.LMS_SET_COLUMN_STYLE,
         'clearColumnStyles': TOPICS.LMS_CLEAR_COLUMN_STYLES,
         'getRowStyles': TOPICS.LMS_GET_ROW_STYLES,
         'setRowStyle': TOPICS.LMS_SET_ROW_STYLE,
         'clearRowStyles': TOPICS.LMS_CLEAR_ROW_STYLES,
      };

      const topic = actionToTopic[action];
      if (!topic) {
         return { success: false, error: `Unknown action: ${action}` };
      }

      return new Promise((resolve) => {
         PubSub.publish(topic, { payload, resolve });
      });
   }, []);

   // ✅ Expose API client and LMS handler via ref
   useImperativeHandle(ref, () => {
      return {
         apiClient,
         handleLmsAction
      };
   }, [apiClient, handleLmsAction]);

   // ✅ Listen for LMS actions forwarded from LWC host via postMessage (iframe bridge)
   useEffect(() => {
      const handler = async (event: MessageEvent) => {
         const data = event.data;
         if (!data || data.type !== 'appgrid:lms:action') return;

         const { lmsRequestId, action, payload } = data;

         try {
            const result = await handleLmsAction(action, payload);
            window.parent.postMessage(
               { type: 'appgrid:lms:response', lmsRequestId, result },
               '*'
            );
         } catch (error) {
            window.parent.postMessage(
               { type: 'appgrid:lms:response', lmsRequestId, result: { success: false, error: String(error) } },
               '*'
            );
         }
      };

      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
   }, [handleLmsAction]);

   // ✅ LMS Action Handlers - all use PubSub for consistency
   // Handler for LMS_GET_CAPABILITIES
   useEffect(() => {
      const handler = (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {
         data.resolve({
            success: true,
            data: { capabilities: LMS_ACTIONS }
         });
      };
      const token = PubSub.subscribe(TOPICS.LMS_GET_CAPABILITIES, handler);
      return () => { PubSub.unsubscribe(token); };
   }, []);

   // Handler for LMS_SELECT_OBJECT
   useEffect(() => {
      const handler = (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {
         if (!data.payload?.apiName) {
            return;
         }

         const targetObject = orgObjects?.find(
            (obj) => obj.qualifiedApiName === data.payload?.apiName
         );

         if (!targetObject) {
            data.resolve({
               success: false,
               error: `Object "${data.payload.apiName}" not found in available objects`
            });
            return;
         }

         // Trigger object selection via existing PubSub topic
         PubSub.publish('ObjectSelectionChanged', targetObject);
         data.resolve({ success: true, data: { selectedObject: targetObject } });
      };
      const token = PubSub.subscribe(TOPICS.LMS_SELECT_OBJECT, handler);
      return () => { PubSub.unsubscribe(token); };
   }, [orgObjects]);

   // Handler for LMS_SELECT_VIEW
   useEffect(() => {
      const handler = async (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {
         if (!data.payload?.viewId && !data.payload?.viewName) {
            return;
         }

         const requestedObjectName = data.payload?.sObjectName as string | undefined;
         // Get fresh state from store to avoid stale closure
         const currentState = useStore.getState();
         const currentObjectName = currentState.selectedObject?.qualifiedApiName;

         // Check if we need to switch objects first
         if (requestedObjectName && requestedObjectName !== currentObjectName) {
            // Find the target object
            const targetObject = orgObjects?.find((obj) => obj.qualifiedApiName === requestedObjectName);
            if (!targetObject) {
               data.resolve({ success: false, error: `Object "${requestedObjectName}" not found` });
               return;
            }

            // Switch to the new object via PubSub
            PubSub.publish('ObjectSelectionChanged', targetObject);

            // Wait for object switch to propagate
            await new Promise(resolve => setTimeout(resolve, 1000));
         }

         // Fetch views fresh from API for the requested object (or use current viewOptions)
         const freshState = useStore.getState();
         let searchViews = freshState.viewOptions;
         if (requestedObjectName) {
            try {
               const freshViews = await apiClient.getObjViews({
                  sObjectName: requestedObjectName,
                  isSubgridView: false
               });
               searchViews = freshViews;
            } catch {
               data.resolve({ success: false, error: 'Failed to fetch views for object' });
               return;
            }
         }

         const targetView = searchViews?.find((view: { id?: string; name?: string }) =>
            (data.payload?.viewId && view.id === data.payload.viewId) ||
            (data.payload?.viewName && view.name === data.payload.viewName)
         );

         if (!targetView) {
            data.resolve({
               success: false,
               error: `View not found: ${data.payload?.viewId || data.payload?.viewName}`
            });
            return;
         }

         setSelectedView(targetView);
         data.resolve({ success: true, data: { selectedView: targetView } });
      };
      const token = PubSub.subscribe(TOPICS.LMS_SELECT_VIEW, handler);
      return () => { PubSub.unsubscribe(token); };
   }, [setSelectedView, apiClient, orgObjects]);

   // Handler for LMS_EXECUTE_QUERY
   useEffect(() => {
      const handler = (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {
         // Trigger query execution via existing PubSub topic
         PubSub.publish(TOPICS.RUN_QUERY);
         data.resolve({ success: true });
      };
      const token = PubSub.subscribe(TOPICS.LMS_EXECUTE_QUERY, handler);
      return () => { PubSub.unsubscribe(token); };
   }, []);

   // Handler for LMS_GET_VIEWS
   useEffect(() => {
      const handler = async (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {
         if (!data.payload?.sObjectName) {
            data.resolve({ success: false, error: 'sObjectName parameter is required' });
            return;
         }

         try {
            const views = await apiClient.getObjViews({
               sObjectName: data.payload.sObjectName as string,
               isSubgridView: (data.payload.isSubgridView as boolean) ?? false
            });
            data.resolve({ success: true, data: { views } });
         } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve views';
            prettyPrint('[LMS] getViews error', error, 'red');
            data.resolve({ success: false, error: errorMessage });
         }
      };
      const token = PubSub.subscribe(TOPICS.LMS_GET_VIEWS, handler);
      return () => { PubSub.unsubscribe(token); };
   }, [apiClient]);

   // Handler for LMS_GET_QUERIES
   useEffect(() => {
      const handler = async (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {

         if (!data.payload?.sObjectName) {
            data.resolve({ success: false, error: 'sObjectName parameter is required' });
            return;
         }

         try {
            const queries = await apiClient.getObjQueries({
               sObjectName: data.payload.sObjectName as string
            });
            data.resolve({ success: true, data: { queries } });
         } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve queries';
            prettyPrint('[LMS] getQueries error', error, 'red');
            data.resolve({ success: false, error: errorMessage });
         }
      };
      const token = PubSub.subscribe(TOPICS.LMS_GET_QUERIES, handler);
      return () => { PubSub.unsubscribe(token); };
   }, [apiClient]);

   // Handler for LMS_GET_ORG_OBJECTS
   useEffect(() => {
      const handler = (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {
         // Return orgObjects from Zustand store
         if (!orgObjects || orgObjects.length === 0) {
            data.resolve({
               success: false,
               error: 'Org objects not yet loaded'
            });
            return;
         }

         data.resolve({
            success: true,
            data: { orgObjects }
         });
      };
      const token = PubSub.subscribe(TOPICS.LMS_GET_ORG_OBJECTS, handler);
      return () => { PubSub.unsubscribe(token); };
   }, [orgObjects]);

   // Handler for LMS_SELECT_QUERY
   const { setSelectedQuery: setSelectedQueryFromStore } = useStore(useShallow((state) => ({
      setSelectedQuery: state.setSelectedQuery,
   })));

   useEffect(() => {
      const handler = async (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {
         if (!data.payload?.queryId && !data.payload?.queryName) {
            data.resolve({ success: false, error: 'queryId or queryName parameter is required' });
            return;
         }

         const requestedObjectName = data.payload?.sObjectName as string | undefined;
         // Get fresh state from store to avoid stale closure
         const currentState = useStore.getState();
         const currentObjectName = currentState.selectedObject?.qualifiedApiName;

         // Check if we need to switch objects first
         if (requestedObjectName && requestedObjectName !== currentObjectName) {
            // Find the target object
            const targetObject = orgObjects?.find((obj) => obj.qualifiedApiName === requestedObjectName);
            if (!targetObject) {
               data.resolve({ success: false, error: `Object "${requestedObjectName}" not found` });
               return;
            }

            // Switch to the new object via PubSub
            PubSub.publish('ObjectSelectionChanged', targetObject);

            // Wait for object switch to propagate
            await new Promise(resolve => setTimeout(resolve, 1000));
         }

         // Fetch queries fresh from API for the requested object (or use current queryOptions)
         const freshState = useStore.getState();
         let searchQueries = freshState.queryOptions;
         if (requestedObjectName) {
            try {
               const freshQueries = await apiClient.getObjQueries({
                  sObjectName: requestedObjectName
               });
               searchQueries = freshQueries;
            } catch (error) {
               prettyPrint('[LMS] selectQuery - error fetching queries', error, 'red');
               data.resolve({ success: false, error: 'Failed to fetch queries for object' });
               return;
            }
         }

         const targetQuery = searchQueries?.find((query: any) =>
            (data.payload?.queryId && (query.id === data.payload.queryId || query.Id === data.payload.queryId)) ||
            (data.payload?.queryName && (query.name === data.payload.queryName || query.Name === data.payload.queryName))
         );

         if (!targetQuery) {
            data.resolve({
               success: false,
               error: `Query not found: ${data.payload?.queryId || data.payload?.queryName}`
            });
            return;
         }

         setSelectedQueryFromStore(targetQuery as any);
         data.resolve({ success: true, data: { selectedQuery: targetQuery } });
      };
      const token = PubSub.subscribe(TOPICS.LMS_SELECT_QUERY, handler);
      return () => { PubSub.unsubscribe(token); };
   }, [setSelectedQueryFromStore, apiClient, orgObjects]);

   // Handler for LMS_GET_FILTERS
   const { setSelectedFilter } = useStore(useShallow((state) => ({
      setSelectedFilter: state.setSelectedFilter,
   })));

   useEffect(() => {
      const handler = async (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {
         if (!data.payload?.sObjectName) {
            data.resolve({ success: false, error: 'sObjectName parameter is required' });
            return;
         }

         const requestedObjectName = data.payload?.sObjectName as string;
         // Get fresh state from store to avoid stale closure
         const currentState = useStore.getState();
         const currentObjectName = currentState.selectedObject?.qualifiedApiName;

         // Check if we need to switch objects first
         if (requestedObjectName !== currentObjectName) {
            // Find the target object
            const targetObject = orgObjects?.find((obj) => obj.qualifiedApiName === requestedObjectName);
            if (!targetObject) {
               data.resolve({ success: false, error: `Object "${requestedObjectName}" not found` });
               return;
            }

            // Switch to the new object via PubSub
            PubSub.publish('ObjectSelectionChanged', targetObject);

            // Wait for the object selection to propagate and view to load
            await new Promise(resolve => setTimeout(resolve, 2000));
         }

         // Get fresh filter options from store after potential object switch
         const freshState = useStore.getState();

         data.resolve({
            success: true,
            data: { filters: freshState.filterOptions || [] }
         });
      };
      const token = PubSub.subscribe(TOPICS.LMS_GET_FILTERS, handler);
      return () => { PubSub.unsubscribe(token); };
   }, [orgObjects]);

   // Handler for LMS_SET_ADVANCED_FILTER
   useEffect(() => {
      const handler = async (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {
         if (!data.payload?.filterName) {
            data.resolve({ success: false, error: 'filterName parameter is required' });
            return;
         }

         const requestedObjectName = data.payload?.sObjectName as string | undefined;
         // Get fresh state from store to avoid stale closure
         const currentState = useStore.getState();
         const currentObjectName = currentState.selectedObject?.qualifiedApiName;

         // Check if we need to switch objects first
         if (requestedObjectName && requestedObjectName !== currentObjectName) {
            // Find the target object
            const targetObject = orgObjects?.find((obj) => obj.qualifiedApiName === requestedObjectName);
            if (!targetObject) {
               data.resolve({ success: false, error: `Object "${requestedObjectName}" not found` });
               return;
            }

            // Switch to the new object via PubSub
            PubSub.publish('ObjectSelectionChanged', targetObject);

            // Wait for the object selection to propagate and view to load
            await new Promise(resolve => setTimeout(resolve, 2000));
         }

         // Get fresh filter options from store after potential object switch
         const freshState = useStore.getState();
         const filterName = data.payload.filterName as string;
         const targetFilter = freshState.filterOptions?.find((filter) => filter.name === filterName);

         if (!targetFilter) {
            data.resolve({
               success: false,
               error: `Filter "${filterName}" not found. Available filters: ${freshState.filterOptions?.map(f => f.name).join(', ') || 'none'}`
            });
            return;
         }

         // Set the selected filter - this triggers the filter application in AppGrid
         setSelectedFilter(targetFilter);
         data.resolve({ success: true, data: { selectedFilter: targetFilter } });
      };
      const token = PubSub.subscribe(TOPICS.LMS_SET_ADVANCED_FILTER, handler);
      return () => { PubSub.unsubscribe(token); };
   }, [setSelectedFilter, orgObjects]);

   // Handler for LMS_CLEAR_FILTERS
   useEffect(() => {
      const handler = async (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {
         if (!data.payload?.sObjectName) {
            data.resolve({ success: false, error: 'sObjectName parameter is required' });
            return;
         }

         const requestedObjectName = data.payload?.sObjectName as string;
         // Get fresh state from store to avoid stale closure
         const currentState = useStore.getState();
         const currentObjectName = currentState.selectedObject?.qualifiedApiName;

         // Check if we need to switch objects first
         if (requestedObjectName !== currentObjectName) {
            // Find the target object
            const targetObject = orgObjects?.find((obj) => obj.qualifiedApiName === requestedObjectName);
            if (!targetObject) {
               data.resolve({ success: false, error: `Object "${requestedObjectName}" not found` });
               return;
            }

            // Switch to the new object via PubSub
            PubSub.publish('ObjectSelectionChanged', targetObject);

            // Wait for the object selection to propagate and view to load
            await new Promise(resolve => setTimeout(resolve, 2000));
         }

         // Clear all filters using the existing ClearFilters topic
         PubSub.publish(TOPICS.CLEAR_FILTERS, 'ClearFilters');
         data.resolve({ success: true, data: { message: 'Filters cleared' } });
      };
      const token = PubSub.subscribe(TOPICS.LMS_CLEAR_FILTERS, handler);
      return () => { PubSub.unsubscribe(token); };
   }, [orgObjects]);

   // Handler for LMS_GET_COLUMN_STYLES
   const { setObjColumnStyles, setSelectedColumnStyle } = useStore(useShallow((state) => ({
      setObjColumnStyles: state.setObjColumnStyles,
      setSelectedColumnStyle: state.setSelectedColumnStyle,
   })));

   useEffect(() => {
      const handler = async (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {
         if (!data.payload?.sObjectName) {
            data.resolve({ success: false, error: 'sObjectName parameter is required' });
            return;
         }

         const requestedObjectName = data.payload?.sObjectName as string;
         // Get fresh state from store to avoid stale closure
         const currentState = useStore.getState();
         const currentObjectName = currentState.selectedObject?.qualifiedApiName;

         // Check if we need to switch objects first
         if (requestedObjectName !== currentObjectName) {
            const targetObject = orgObjects?.find((obj) => obj.qualifiedApiName === requestedObjectName);
            if (!targetObject) {
               data.resolve({ success: false, error: `Object "${requestedObjectName}" not found` });
               return;
            }

            PubSub.publish('ObjectSelectionChanged', targetObject);
            // Wait for object switch and view to load with styles
            await new Promise(resolve => setTimeout(resolve, 2000));
         } else {
            // Same object - wait for view to be processed if not yet ready
            if (!currentState.selectedViewProcessed) {
               // Poll for selectedViewProcessed to become true (max 5 seconds)
               const maxWaitTime = 5000;
               const pollInterval = 100;
               let waitedTime = 0;
               while (waitedTime < maxWaitTime) {
                  const checkState = useStore.getState();
                  if (checkState.selectedViewProcessed) {
                     break;
                  }
                  await new Promise(resolve => setTimeout(resolve, pollInterval));
                  waitedTime += pollInterval;
               }
            }
         }

         // Get fresh column styles from store after potential object switch or wait
         const freshState = useStore.getState();

         data.resolve({
            success: true,
            data: { columnStyles: freshState.objColumnStyles || [] }
         });
      };
      const token = PubSub.subscribe(TOPICS.LMS_GET_COLUMN_STYLES, handler);
      return () => { PubSub.unsubscribe(token); };
   }, [orgObjects]);

   // Handler for LMS_SET_COLUMN_STYLE
   useEffect(() => {
      const handler = async (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {
         if (!data.payload?.styleName) {
            data.resolve({ success: false, error: 'styleName parameter is required' });
            return;
         }

         const requestedObjectName = data.payload?.sObjectName as string | undefined;
         // Get fresh state from store to avoid stale closure
         const currentState = useStore.getState();
         const currentObjectName = currentState.selectedObject?.qualifiedApiName;

         if (requestedObjectName && requestedObjectName !== currentObjectName) {
            const targetObject = orgObjects?.find((obj) => obj.qualifiedApiName === requestedObjectName);
            if (!targetObject) {
               data.resolve({ success: false, error: `Object "${requestedObjectName}" not found` });
               return;
            }

            PubSub.publish('ObjectSelectionChanged', targetObject);
            // Wait for object switch and view to load with styles
            await new Promise(resolve => setTimeout(resolve, 2000));
         } else {
            // Same object - wait for view to be processed if not yet ready
            if (!currentState.selectedViewProcessed) {
               const maxWaitTime = 5000;
               const pollInterval = 100;
               let waitedTime = 0;
               while (waitedTime < maxWaitTime) {
                  const checkState = useStore.getState();
                  if (checkState.selectedViewProcessed) {
                     break;
                  }
                  await new Promise(resolve => setTimeout(resolve, pollInterval));
                  waitedTime += pollInterval;
               }
            }
         }

         // Get fresh column styles from store after potential object switch or wait
         const freshState = useStore.getState();
         const styleName = data.payload.styleName as string;
         const targetStyleIndex = freshState.objColumnStyles?.findIndex((style) => style.name === styleName);

         if (targetStyleIndex === undefined || targetStyleIndex === -1) {
            data.resolve({
               success: false,
               error: `Column style "${styleName}" not found. Available styles: ${freshState.objColumnStyles?.map(s => s.name).join(', ') || 'none'}`
            });
            return;
         }

         // Activate the style by setting active: true (like clicking the checkbox)
         const currentStyles = [...(freshState.objColumnStyles || [])];
         const updatedStyles = currentStyles.map((style, index) => {
            if (index === targetStyleIndex) {
               return { ...style, active: true };
            }
            return style;
         });

         // Update the styles array with the activated style
         setObjColumnStyles(updatedStyles);

         // Also set the selected column style for the UI
         const activatedStyle = updatedStyles[targetStyleIndex];
         setSelectedColumnStyle(activatedStyle);

         data.resolve({ success: true, data: { selectedColumnStyle: activatedStyle } });
      };
      const token = PubSub.subscribe(TOPICS.LMS_SET_COLUMN_STYLE, handler);
      return () => { PubSub.unsubscribe(token); };
   }, [setSelectedColumnStyle, setObjColumnStyles, orgObjects]);

   // Handler for LMS_CLEAR_COLUMN_STYLES
   useEffect(() => {
      const handler = async (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {
         if (!data.payload?.sObjectName) {
            data.resolve({ success: false, error: 'sObjectName parameter is required' });
            return;
         }

         const requestedObjectName = data.payload?.sObjectName as string;
         // Get fresh state from store to avoid stale closure
         const currentState = useStore.getState();
         const currentObjectName = currentState.selectedObject?.qualifiedApiName;

         if (requestedObjectName !== currentObjectName) {
            const targetObject = orgObjects?.find((obj) => obj.qualifiedApiName === requestedObjectName);
            if (!targetObject) {
               data.resolve({ success: false, error: `Object "${requestedObjectName}" not found` });
               return;
            }

            PubSub.publish('ObjectSelectionChanged', targetObject);
            await new Promise(resolve => setTimeout(resolve, 2000));
         }

         // Deactivate all column styles (set active: false) - don't delete them
         const freshState = useStore.getState();
         const currentStyles = [...(freshState.objColumnStyles || [])];
         const deactivatedStyles = currentStyles.map((style) => ({
            ...style,
            active: false
         }));

         setObjColumnStyles(deactivatedStyles);
         setSelectedColumnStyle(null);

         data.resolve({ success: true, data: { message: 'Column styles cleared' } });
      };
      const token = PubSub.subscribe(TOPICS.LMS_CLEAR_COLUMN_STYLES, handler);
      return () => { PubSub.unsubscribe(token); };
   }, [setObjColumnStyles, setSelectedColumnStyle, orgObjects]);

   // Handler for LMS_GET_ROW_STYLES
   const { setObjRowStyles, setSelectedRowStyle } = useStore(useShallow((state) => ({
      setObjRowStyles: state.setObjRowStyles,
      setSelectedRowStyle: state.setSelectedRowStyle,
   })));

   useEffect(() => {
      const handler = async (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {

         if (!data.payload?.sObjectName) {
            data.resolve({ success: false, error: 'sObjectName parameter is required' });
            return;
         }

         const requestedObjectName = data.payload?.sObjectName as string;
         // Get fresh state from store to avoid stale closure
         const currentState = useStore.getState();
         const currentObjectName = currentState.selectedObject?.qualifiedApiName;

         if (requestedObjectName !== currentObjectName) {
            const targetObject = orgObjects?.find((obj) => obj.qualifiedApiName === requestedObjectName);
            if (!targetObject) {
               data.resolve({ success: false, error: `Object "${requestedObjectName}" not found` });
               return;
            }

            PubSub.publish('ObjectSelectionChanged', targetObject);
            // Wait for object switch and view to load with styles
            await new Promise(resolve => setTimeout(resolve, 2000));
         } else {
            // Same object - wait for view to be processed if not yet ready
            if (!currentState.selectedViewProcessed) {
               // Poll for selectedViewProcessed to become true (max 5 seconds)
               const maxWaitTime = 5000;
               const pollInterval = 100;
               let waitedTime = 0;
               while (waitedTime < maxWaitTime) {
                  const checkState = useStore.getState();
                  if (checkState.selectedViewProcessed) {
                     break;
                  }
                  await new Promise(resolve => setTimeout(resolve, pollInterval));
                  waitedTime += pollInterval;
               }
            }
         }

         // Get fresh row styles from store after potential object switch or wait
         const freshState = useStore.getState();

         data.resolve({
            success: true,
            data: { rowStyles: freshState.objRowStyles || [] }
         });
      };
      const token = PubSub.subscribe(TOPICS.LMS_GET_ROW_STYLES, handler);
      return () => { PubSub.unsubscribe(token); };
   }, [orgObjects]);

   // Handler for LMS_SET_ROW_STYLE
   useEffect(() => {
      const handler = async (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {
         if (!data.payload?.styleName) {
            data.resolve({ success: false, error: 'styleName parameter is required' });
            return;
         }

         const requestedObjectName = data.payload?.sObjectName as string | undefined;
         // Get fresh state from store to avoid stale closure
         const currentState = useStore.getState();
         const currentObjectName = currentState.selectedObject?.qualifiedApiName;

         if (requestedObjectName && requestedObjectName !== currentObjectName) {
            const targetObject = orgObjects?.find((obj) => obj.qualifiedApiName === requestedObjectName);
            if (!targetObject) {
               data.resolve({ success: false, error: `Object "${requestedObjectName}" not found` });
               return;
            }

            PubSub.publish('ObjectSelectionChanged', targetObject);
            // Wait for object switch and view to load with styles
            await new Promise(resolve => setTimeout(resolve, 2000));
         } else {
            // Same object - wait for view to be processed if not yet ready
            if (!currentState.selectedViewProcessed) {
               const maxWaitTime = 5000;
               const pollInterval = 100;
               let waitedTime = 0;
               while (waitedTime < maxWaitTime) {
                  const checkState = useStore.getState();
                  if (checkState.selectedViewProcessed) {
                     break;
                  }
                  await new Promise(resolve => setTimeout(resolve, pollInterval));
                  waitedTime += pollInterval;
               }
            }
         }

         // Get fresh row styles from store after potential object switch or wait
         const freshState = useStore.getState();
         const styleName = data.payload.styleName as string;
         const targetStyleIndex = freshState.objRowStyles?.findIndex((style) => style.name === styleName);

         if (targetStyleIndex === undefined || targetStyleIndex === -1) {
            data.resolve({
               success: false,
               error: `Row style "${styleName}" not found. Available styles: ${freshState.objRowStyles?.map(s => s.name).join(', ') || 'none'}`
            });
            return;
         }

         // Activate the style by setting active: true (like clicking the checkbox)
         const currentStyles = [...(freshState.objRowStyles || [])];
         const updatedStyles = currentStyles.map((style, index) => {
            if (index === targetStyleIndex) {
               return { ...style, active: true };
            }
            return style;
         });

         // Update the styles array with the activated style
         setObjRowStyles(updatedStyles);

         // Also set the selected row style for the UI
         const activatedStyle = updatedStyles[targetStyleIndex];
         setSelectedRowStyle(activatedStyle);

         data.resolve({ success: true, data: { selectedRowStyle: activatedStyle } });
      };
      const token = PubSub.subscribe(TOPICS.LMS_SET_ROW_STYLE, handler);
      return () => { PubSub.unsubscribe(token); };
   }, [setSelectedRowStyle, setObjRowStyles, orgObjects]);

   // Handler for LMS_CLEAR_ROW_STYLES
   useEffect(() => {
      const handler = async (_msg: string, data: { payload?: Record<string, unknown>; resolve: (response: LmsResponse) => void }) => {
         if (!data.payload?.sObjectName) {
            data.resolve({ success: false, error: 'sObjectName parameter is required' });
            return;
         }

         const requestedObjectName = data.payload?.sObjectName as string;
         // Get fresh state from store to avoid stale closure
         const currentState = useStore.getState();
         const currentObjectName = currentState.selectedObject?.qualifiedApiName;

         if (requestedObjectName !== currentObjectName) {
            const targetObject = orgObjects?.find((obj) => obj.qualifiedApiName === requestedObjectName);
            if (!targetObject) {
               data.resolve({ success: false, error: `Object "${requestedObjectName}" not found` });
               return;
            }

            PubSub.publish('ObjectSelectionChanged', targetObject);
            await new Promise(resolve => setTimeout(resolve, 2000));
         }

         // Deactivate all row styles (set active: false) - don't delete them
         const freshState = useStore.getState();
         const currentStyles = [...(freshState.objRowStyles || [])];
         const deactivatedStyles = currentStyles.map((style) => ({
            ...style,
            active: false
         }));

         setObjRowStyles(deactivatedStyles);
         setSelectedRowStyle(null);

         data.resolve({ success: true, data: { message: 'Row styles cleared' } });
      };
      const token = PubSub.subscribe(TOPICS.LMS_CLEAR_ROW_STYLES, handler);
      return () => { PubSub.unsubscribe(token); };
   }, [setObjRowStyles, setSelectedRowStyle, orgObjects]);

   // ✅ Global ObjectSelectionChanged handler so it runs regardless of which view is mounted
   const {
      setLoading,
      setSelectedObject,
      setSelectedGridType,
      setViewOptions,
      setObjViewsRetrieved,
      setSelectedTimeSeriesFilter,
      setFilterOptions,
      setQueryOptions,
      setSelectedSubgridType,
      setTreeGridPreferences,
      setTreeGridState,
      setShowCharts,
      setShowChartSettings,
      setShowDeploymentPanel,
      setShowFlowConfigPanel,
      setShowObjectPrefsPanel,
      setShowPermissionsPanel,
      setShowQueryPanel,
      setShowSlackPanel,
      setShowTreegridConfigPanel,
      setSelectedQuery,
   } = useStore(useShallow((s) => ({
      setLoading: s.setLoading,
      setSelectedObject: s.setSelectedObject,
      setSelectedGridType: s.setSelectedGridType,
      setViewOptions: s.setViewOptions,
      setObjViewsRetrieved: s.setObjViewsRetrieved,
      setSelectedTimeSeriesFilter: s.setSelectedTimeSeriesFilter,
      setFilterOptions: s.setFilterOptions,
      setQueryOptions: s.setQueryOptions,
      setSelectedSubgridType: s.setSelectedSubgridType,
      setTreeGridPreferences: s.setTreeGridPreferences,
      setTreeGridState: s.setTreeGridState,
      setShowCharts: s.setShowCharts,
      setShowChartSettings: s.setShowChartSettings,
      setShowDeploymentPanel: s.setShowDeploymentPanel,
      setShowFlowConfigPanel: s.setShowFlowConfigPanel,
      setShowObjectPrefsPanel: s.setShowObjectPrefsPanel,
      setShowPermissionsPanel: s.setShowPermissionsPanel,
      setShowQueryPanel: s.setShowQueryPanel,
      setShowSlackPanel: s.setShowSlackPanel,
      setShowTreegridConfigPanel: s.setShowTreegridConfigPanel,
      setSelectedQuery: s.setSelectedQuery,
   })));

   // Handler for LMS_SELECT_OBJECT
   useEffect(() => {
      const handler = async (_msg: any, data: any) => {
         try {
            setLoading(true);

            setSelectedObject(data);

            // Route to main grid view
            setSelectedGridType({ name: 'gridView', label: 'Grid' });

            // Reset view/query options so AppGrid can repopulate for new object
            setViewOptions([]);

            setObjViewsRetrieved(false);

            setSelectedTimeSeriesFilter(null);

            setFilterOptions([]);

            setQueryOptions([]);

            setSelectedQuery(null);

            setSelectedSubgridType({ name: 'gridView', label: 'Grid' });

            setTreeGridPreferences(null);

            setTreeGridState(null);

            // Hide any open panels
            setShowSlackPanel(false);

            setShowCharts(false);

            setShowChartSettings(false);

            setShowDeploymentPanel(false);

            setShowFlowConfigPanel(false);

            setShowObjectPrefsPanel(false);

            setShowPermissionsPanel(false);

            setShowQueryPanel(false);

            setShowTreegridConfigPanel(false);
         } finally {
            setLoading(false);
         }
      };
      const token = PubSub.subscribe('ObjectSelectionChanged', handler);
      return () => {
         PubSub.unsubscribe(token);
      }
   }, [setFilterOptions, setLoading, setObjViewsRetrieved, setQueryOptions, setSelectedGridType, setSelectedObject, setSelectedQuery, setSelectedSubgridType, setSelectedTimeSeriesFilter, setShowChartSettings, setShowCharts, setShowDeploymentPanel, setShowFlowConfigPanel, setShowObjectPrefsPanel, setShowPermissionsPanel, setShowQueryPanel, setShowSlackPanel, setShowTreegridConfigPanel, setTreeGridPreferences, setTreeGridState, setViewOptions]);

   // set dark mode - sync grid theme with MUI theme
   useEffect(() => {
      if (selectedGridColorTheme.id === 'colorSchemeDark') {
         setMode('dark');

         // Add Syncfusion's dark mode class to body for Syncfusion components
         document.body.classList.add('e-dark-mode');

         apiClient.setDarkMode({
            isDarkMode: true
         })
      } else {
         setMode('light');

         // Remove Syncfusion's dark mode class from body
         document.body.classList.remove('e-dark-mode');

         apiClient.setDarkMode({
            isDarkMode: false
         })
      }
   }, [apiClient, selectedGridColorTheme, setMode])

   return (
      <div
         ref={containerRef}
         className={mode === 'dark' ? 'theme-dark' : 'theme-light'}
         style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
         }}
      >
         <ThemeProvider theme={theme}>
            <IntlProvider locale={appLocale}>
               <LocalizationProvider
                  dateAdapter={AdapterDayjs}
                  adapterLocale={dayjsLocale}
               >
                  <SnackbarProvider maxSnack={10}>
                     <ErrorBoundary>
                        {/* Only mount the app once we have a real size to avoid double init. */}
                        {isSizeReady ? (
                           <AppViewRouter size={effectiveSize} apiClient={apiClient} initialData={initialData} />
                        ) : (
                           <LoadingIndicator isLoading />
                        )}
                        {/* <GridWithChartsTest /> */}
                     </ErrorBoundary>
                  </SnackbarProvider>
               </LocalizationProvider>
            </IntlProvider>
         </ThemeProvider>
      </div>
   );
});



AppWrapper.displayName = 'AppWrapper';
export default AppWrapper;
