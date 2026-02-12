import React from 'react';

// Zustand - only for remaining state not in domain hooks
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// Unified context-based hooks
import { useGridCalculatedColumnState, useGridStyleState, useGridGridTypeState } from '../../hooks/selectors';
import { useThemeState, useQueryState, useFlowConfig } from '../../hooks/selectors/useUIState';

// components
import { CalculatedColumnPanel } from '../calculatedColumnPanel/calculatedColumnPanel';
import { ColumnStylePanel } from '../columnStylePanel/columnStylePanel';
import DeploymentPanel from '../deploymentPanel/DeploymentPanel';
import FlowConfigPanel from '../flowConfigPanel/FlowConfigPanel'
import ObjectPrefsPanel from '../objectPrefsPanel/ObjectPrefs';
import PermissionPrefsPanel from '../permissionsPanel/PermissionPrefsPanel';
import TreegridConfigPanel from '../treeGridConfigPanel/TreegridConfigPanel'
import QueryMetricsPanel from '../queryMetricsPanel/QueryMetricsPanel';
import SlackPanel2 from '../slackPanel/SlackPanel2';


// MUI
import { Box } from '@mui/material';

import { GridApi } from 'ag-grid-community';
import { SObjectPermission } from '../../sObjectMetadataTypes';


import { APIClient } from '../../brideDesignPattern/apiInterface';

interface PropertyPanelProps {
   gridApi: GridApi;
   objectPermissions: SObjectPermission[];
   saveAgGridState: () => Promise<string | void>;
   apiClient: APIClient;
   queryMetrics?: Map<string, number> | Record<string, any> | null;
}

const PropertyPanel = ({ gridApi, objectPermissions, apiClient, queryMetrics }: PropertyPanelProps) => {
   // Theme state (shared)
   const { muiBackgroundColor, muiColor } = useThemeState();

   // Calculated column panel visibility (main grid) - using unified hooks
   const { showCalculatedColumnPanel } = useGridCalculatedColumnState('main');

   // Style panel visibility (main grid) - using unified hooks
   const { showColumnStylePanel } = useGridStyleState('main');

   // Grid type state (main and subgrid) - using unified hooks
   const { selectedGridType } = useGridGridTypeState('main');
   const { selectedGridType: selectedSubgridType } = useGridGridTypeState('subgrid');

   // Flow config panel
   const { showFlowConfigPanel } = useFlowConfig();

   // Query metrics panel
   const { showQueryMetricsPanel } = useQueryState();

   // Remaining state not in domain hooks
   const {
      showDeploymentPanel,
      showObjectPrefsPanel,
      showPermissionsPanel,
      showSlackPanel,
      showTreegridConfigPanel,
      selectedSlackRow,
   } = useStore(useShallow((state) => ({
      showDeploymentPanel: state.showDeploymentPanel,
      showObjectPrefsPanel: state.showObjectPrefsPanel,
      showPermissionsPanel: state.showPermissionsPanel,
      showSlackPanel: state.showSlackPanel,
      showTreegridConfigPanel: state.showTreegridConfigPanel,
      selectedSlackRow: state.selectedSlackRow,
   })));

   return (
      <Box
         data-name="PropertyPanelBox"
         sx={{
            // width:  // Children set width
            borderLeft: 1,
            borderColor: 'divider',
            height: '100%', // Stretch to parent height
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto', // Allow vertical scrolling inside the panel
            overflowX: 'hidden',
            boxSizing: 'border-box', // Ensure padding and borders are included
            backgroundColor: muiBackgroundColor,
            color: muiColor
         }}>
         {(() => {
            if (showCalculatedColumnPanel) {
               return <CalculatedColumnPanel />
            }

            if (showColumnStylePanel) {
               return <ColumnStylePanel />;
            }

            if (showObjectPrefsPanel) {
               return <ObjectPrefsPanel apiClient={apiClient} />;
            }

            if (showPermissionsPanel) {
               return <PermissionPrefsPanel apiClient={apiClient} />;
            }

            if (showDeploymentPanel) {
               return <DeploymentPanel
                  apiClient={apiClient}
                  gridApi={gridApi}
                  objectPermissions={objectPermissions} />;
            }

            if (showFlowConfigPanel) {
               return <FlowConfigPanel
                  apiClient={apiClient}
                  gridApi={gridApi}
                  objectPermissions={objectPermissions} />;
            }

            if (showTreegridConfigPanel) {
               const isSubgridTarget = selectedSubgridType?.name === 'treeGrid' && selectedGridType?.name !== 'treeGrid';

               return <TreegridConfigPanel
                  isSubgrid={isSubgridTarget} />;
            }

            if (showQueryMetricsPanel) {
               return <QueryMetricsPanel
                  queryMetrics={queryMetrics || null} />;
            }

            if (showSlackPanel) {
               return <SlackPanel2
                  apiClient={apiClient}
                  selectedSlackRowProp={selectedSlackRow} />;
            }

            return null;
         })()}

      </Box>
   )
}

export default PropertyPanel
