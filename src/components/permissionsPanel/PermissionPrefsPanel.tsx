import React, { useEffect, useCallback, useRef } from 'react';

// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// MUI
import { AppBar, Box, Button, Checkbox, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, Toolbar, Typography } from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

// MUI icons
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

// Notifications
import { useSnackbar } from 'notistack';
import type { SnackbarKey } from 'notistack';

import { prettyPrint } from '../../utilities/prettyPrint';

// Lodash
import * as _ from 'lodash-es';

// Interfaces
import { GridPermission, GridPermissionItem } from '../../appInterfaces/grid/gridInterfaces';

import { APIClient, UpsertServiceParams } from '../../brideDesignPattern/apiInterface';

interface GridPermissionsProps {
   apiClient: APIClient;
}

// Transform the data into the required format
const getPermissions = (gridPermissions: GridPermission): GridPermissionItem[] =>
   Object.entries(gridPermissions).map(([key, value]) => ({
      name: key,
      label: key
         .replace(/enable/, '')
         .replace(/([A-Z])/g, ' $1')
         .trim()
         .replace(/^./, str => str.toUpperCase()), // Convert camelCase to Title Case
      checked: value,
   }));

const GridPermissionsPanel = ({ apiClient }: GridPermissionsProps) => {
   const theme = useTheme();

   // NOTIFICATIONS
   const { enqueueSnackbar, closeSnackbar } = useSnackbar();

   const action = useCallback(
      (snackbarId: SnackbarKey | undefined) => (
         <>
            <button
               onClick={() => {
                  closeSnackbar(snackbarId);
               }}
            >
               Dismiss
            </button>
         </>
      ),
      [closeSnackbar],
   );

   // Global state from Zustand
   const {
      gridPermissions,
      gridPermissionsRecId,
      updateGridPermissions,
      setGridPermissions,
      setGridPermissionsRecId,
      setShowPermissionsPanel
   } = useStore(useShallow((state) => ({
      gridPermissions: state.gridPermissions as GridPermission,
      gridPermissionsRecId: state.gridPermissionsRecId,
      updateGridPermissions: state.updateGridPermissions,
      setGridPermissions: state.setGridPermissions,
      setGridPermissionsRecId: state.setGridPermissionsRecId,
      setShowPermissionsPanel: state.setShowPermissionsPanel
   })));

   prettyPrint('PermissionsPanel - gridPermissions are', gridPermissions);

   // local state
   const permissions = getPermissions(gridPermissions);
   const prevGridPermissions = useRef<GridPermission>(gridPermissions);


   const handleObjectPreferencesSelectAll = () => {
      // Create a new permissions object with all values set to true
      const newPermissions: GridPermission = {
         enableAccentColorPicker: true,
         enableCalculatedColumnWizard: true,
         enableDeploymentWizardAction: true,
         enableFlowWizardAction: true,
         enableGridTypeSelector: true,
         enableObjectPreferencesAction: true,
         enablePermissionsAction: true,
         enablePivoting: true,
         enableSlack: true,
         enableStylesWizard: true,
         enableQueryBuilderAction: true,
         enableTeamSharing: true,
         enableThemeSelector: true,
         enableTimeSeriesGrid: true,
         enableTreeGrid: true,
      };

      // Update the gridPermissions in Zustand
      setGridPermissions(newPermissions);
   };

   const handleObjectPreferencesClearAll = () => {
      // Create a new permissions object with all values set to false
      const newPermissions: GridPermission = {
         enableAccentColorPicker: false,
         enableCalculatedColumnWizard: false,
         enableDeploymentWizardAction: false,
         enableFlowWizardAction: false,
         enableGridTypeSelector: false,
         enableObjectPreferencesAction: false,
         enablePermissionsAction: false,
         enablePivoting: false,
         enableSlack: false,
         enableStylesWizard: false,
         enableQueryBuilderAction: false,
         enableTeamSharing: false,
         enableThemeSelector: false,
         enableTimeSeriesGrid: false,
         enableTreeGrid: false,
      };

      // Update the gridPermissions in Zustand (useEffect will auto-save on change)
      setGridPermissions(newPermissions);
   };

   // Save permissions when gridPermissions changes
   useEffect(() => {
      const saveGridPermissions = async (prefs: GridPermission) => {
         try {
            prettyPrint('saveGridPermissions - prefs to upsert are', prefs);

            const upsertRec: any = {
               AppGridAg__Grid_Permissions__c: JSON.stringify({ ...prefs }),
            }

            if (gridPermissionsRecId !== '') {
               console.log(`GridPermissions savePermissionPreferences() - adding Id`);
               upsertRec['Id'] = gridPermissionsRecId;
            }

            const upsertRecs = [upsertRec];

            const params: UpsertServiceParams = {
               sObjectName: 'AppGridAg__AG_Grid_Permissions__c',
               jsonRecs: JSON.stringify(upsertRecs)
            };

            const upsertApiResult = await apiClient.upsertRecs(params);

            prettyPrint('GridPermissionsPanel saveGridPermissions - api response is', upsertApiResult);

            if (upsertApiResult.status !== 'success') {
               throw new Error(upsertApiResult.errorMessage || 'Failed to save grid permissions');
            }

            if (upsertApiResult.results.length > 1) {
               throw new Error('Unexpected error - More than 1 permissions record returned.');
            }

            // Check the upsert result
            const upsertResult = upsertApiResult.results[0];

            if (!upsertResult.isSuccess) {
               throw new Error(
                  'Failed to save grid permissions: ' +
                  (upsertResult.errorMessages?.join(', ') || upsertResult.errors?.join(', ') || 'Unknown error'),
               );
            }

            const recId = upsertResult.recordId;

            if (gridPermissionsRecId !== recId) {
               console.log(`Setting gridPermissionsRecId to ${recId}`);
               setGridPermissionsRecId(recId as string);
            }
            prevGridPermissions.current = gridPermissions;

            enqueueSnackbar('Grid permissions saved', {
               autoHideDuration: 3000,
               variant: 'success',
            });
         } catch (error: unknown) {
            // Type guard to check if error is an instance of Error
            if (error instanceof Error) {
               console.log(error.message);
               enqueueSnackbar('Unexpected error saving grid permissions', {
                  action: action,
                  variant: 'error',
               });
            } else {
               // Handle unexpected errors
               console.log('An unexpected error occurred:', error);
               enqueueSnackbar('Error saving grid permissions', {
                  action: action,
                  variant: 'error',
               });
            }
         }
      };

      if (!_.isEqual(prevGridPermissions.current, gridPermissions)) {
         saveGridPermissions(gridPermissions);
      }
   }, [gridPermissions, gridPermissionsRecId, apiClient, setGridPermissionsRecId, enqueueSnackbar, action]);

   return (
      <Box
         sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            typography: 'body1',
            border: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            boxSizing: 'border-box',
            width: 350,
         }}
      >
         <AppBar
            position="sticky"
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}>
            <Toolbar variant="dense">
               <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  sx={{ ml: -1 }}
                  onClick={() => setShowPermissionsPanel(false)}
               >
                  <ChevronLeftIcon />
               </IconButton>
               <Typography variant="button" color="inherit" component="div">
                  Grid Permissions
               </Typography>
            </Toolbar>
         </AppBar>
         <Box
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               display: 'flex',
               flexDirection: 'column',
               overflow: 'hidden',
               flexGrow: 1,
               padding: 3,
            }}
         >
            <Stack direction="row" spacing={2}>
               <Button variant="contained" size="small" onClick={handleObjectPreferencesSelectAll}>
                  Select All
               </Button>
               <Button variant="contained" size="small" onClick={handleObjectPreferencesClearAll}>
                  Clear All
               </Button>
            </Stack>
            <Box
               sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  marginTop: 2,
                  flexGrow: 1,
                  overflow: 'auto',
               }}
            >
               <List
                  sx={{
                     width: '100%',
                     backgroundColor: theme.palette.background.paper,
                     color: theme.palette.text.primary,
                  }}
               >
                  {permissions.map((item: GridPermissionItem) => (
                     <ListItem key={item.name} disablePadding sx={{ borderBottom: 'none' }}>
                        <ListItemButton
                           role={undefined}
                           onClick={() => updateGridPermissions(item.name, !item.checked)}
                           dense
                           sx={{ borderBottom: 'none' }}
                        >
                           <ListItemIcon>
                              <Checkbox
                                 edge="start"
                                 checked={item.checked}
                                 tabIndex={-1}
                                 disableRipple
                              // sx={{
                              //    color: muiColor,
                              //    '&.Mui-checked': {
                              //       color: muiColor,
                              //    },
                              // }}
                              />
                           </ListItemIcon>
                           <ListItemText primary={item.label} />
                        </ListItemButton>
                     </ListItem>
                  ))}
               </List>
            </Box>
         </Box>
      </Box>
   );
};

export default GridPermissionsPanel;