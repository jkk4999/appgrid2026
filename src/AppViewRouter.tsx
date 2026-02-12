// react
import React, { useRef } from 'react';

// zustand
import useStore from './zustandStore';
import { useShallow } from 'zustand/react/shallow';

// api
import type { SfdcClient } from './brideDesignPattern/sfdcClient';

// components
import TimeSeriesGrid from './components/timeSeriesGrid/timeSeriesGrid';

import { AppGrid } from './components/appGridAuraComponent/AppGrid';

import type { AppProps } from './components/appGridAuraComponent/AppWrapper';

// import { prettyPrint } from './utilities/prettyPrint';

// types
import type { SObjectFieldPermission, SObjectMetadata } from './sObjectMetadataTypes';

type Size = { width: number; height: number };

function AppViewRouter(props: AppProps & { size: Size; apiClient: SfdcClient }) {
   const { size, apiClient, initialData } = props;

   const safeInitialData = initialData ?? {};

   // GLOBAL STATE
   const { selectedGridType } = useStore(
      useShallow((s) => ({
         selectedGridType: s.selectedGridType,
      }))
   );

   const objFieldPermissionsMap = useRef(new Map<string, SObjectFieldPermission>());

   const objMetadataMap = useRef(new Map<string, SObjectMetadata>());

   const type = (selectedGridType?.name || '').toLowerCase().replace(/\s+/g, '');
   // Debug: log grid type routing info

   if (type === 'timeseriesview' || type === 'timeseriesgrid' || type === 'timeseries') {
      return (
         <TimeSeriesGrid
            apiClient={apiClient}
            isSubgrid={false}
            objFieldPermissionsMap={objFieldPermissionsMap}
            objMetadataMap={objMetadataMap}
            size={size}
         />
      );
   }

   // Default: render main grid (App)
   return <AppGrid size={size} apiClient={apiClient} initialData={safeInitialData} />;
}

export default AppViewRouter;
