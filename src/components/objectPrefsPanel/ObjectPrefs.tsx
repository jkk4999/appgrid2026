import React, { useCallback, useRef, useEffect } from 'react'

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// Lodash
import * as _ from 'lodash-es'

import { prettyPrint } from '../../utilities/prettyPrint';

// notifications
import { useSnackbar } from 'notistack'
import type { SnackbarKey } from 'notistack'

// MUI
import { AppBar, Button, Box, Checkbox, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, Tab, Tabs, Toolbar, Typography } from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

// MUI icons
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'

// INTERFACES
interface TabPanelProps {
   children?: React.ReactNode;
   index: number;
   value: number;
}

function a11yProps(index: number) {
   return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
   };
}

import { OrgObject } from '../../sObjectMetadataTypes'

import { ObjectPreference, RelationPreference } from '../../appInterfaces/grid/gridInterfaces'

const ObjectPrefsPanel = (props: any) => {
   const theme = useTheme();

   const apiClient = props.apiClient;

   // NOTIFICATIONS
   const { enqueueSnackbar, closeSnackbar } = useSnackbar()

   // add action to an individual snackbar
   const action = useCallback(
      (snackbarId: SnackbarKey | undefined) => (
         <>
            <button
               onClick={() => {
                  closeSnackbar(snackbarId)
               }}
            >
               Dismiss
            </button>
         </>
      ),
      [closeSnackbar],
   )

   // GLOBAL STATE
   const {
      objectOptions,
      objectPreferences,
      objectPreferenceRecId,
      orgObjects,
      relationPreferences,
      relationPreferenceRecId,
      selectedAccentColor,
      selectedObject,
      selectedObjMetadata,
      // Setters (actions)
      setObjectOptions,
      setObjectPreferences,
      setObjectPreferenceRecId,
      setRelationPreferenceRecId,
      setRelationPreferences,
      setShowObjectPrefsPanel, // Renamed from setShowObjectPanel based on your use below
   } = useStore(
      useShallow((state) => ({
         objectOptions: state.objectOptions,
         objectPreferences: state.objectPreferences,
         objectPreferenceRecId: state.objectPreferenceRecId,
         objPreferences: state.objPreferences,
         orgObjects: state.orgObjects,
         relationPreferences: state.relationPreferences,
         relationPreferenceRecId: state.relationPreferenceRecId,
         selectedAccentColor: state.selectedAccentColor,
         selectedObject: state.selectedObject,
         selectedObjMetadata: state.selectedObjMetadata,
         // Setters (actions) - these are functions, so they are stable references
         setObjectOptions: state.setObjectOptions,
         setObjectPreferenceRecId: state.setObjectPreferenceRecId,
         setObjectPreferences: state.setObjectPreferences,
         setObjPreferences: state.setObjPreferences,
         setRelationPreferenceRecId: state.setRelationPreferenceRecId,
         setRelationPreferences: state.setRelationPreferences,
         setShowObjectPrefsPanel: state.setShowObjectPrefsPanel,
      }))
   );

   // LOCAL STATE


   const objPrefsLoaded = useRef<boolean>(false);
   const prevRelationPrefs = useRef([]);

   const [value, setValue] = React.useState(0);

   useEffect(() => {
      objPrefsLoaded.current = false;
   }, [selectedObject?.qualifiedApiName, selectedObjMetadata?.sobjectType]);

   // FUNCTIONS
   const handleChange = (event: React.SyntheticEvent, newValue: number) => {
      setValue(newValue);
   };

   const handleObjectPreferencesSelectAll = () => {

      const newPreferences = objectPreferences.map((item: ObjectPreference) => ({
         name: item.name,
         label: item.label,
         checked: true, // Set checked to true
      }));

      setObjectPreferences(newPreferences);

      saveObjectPreferences(newPreferences);

   }

   const handleObjectPreferencesClearAll = () => {
      const newPreferences = objectPreferences.map((item: ObjectPreference) => ({
         name: item.name,
         label: item.label,
         checked: false, // Set checked to true
      }));

      setObjectPreferences(newPreferences);

      saveObjectPreferences(newPreferences);
   }

   const handleRelationPreferencesSelectAll = () => {

      const newPreferences = relationPreferences.map((item: RelationPreference) => ({
         ...item,
         checked: true, // Set checked to true
      }));

      setRelationPreferences(newPreferences);

      saveRelationPreferences(newPreferences);

   }

   const handleRelationPreferencesClearAll = () => {

      const newPreferences = relationPreferences.map((item: RelationPreference) => ({
         ...item,
         checked: false, // Set checked to true
      }));

      setRelationPreferences(newPreferences);

      saveRelationPreferences(newPreferences);

   }

   const saveObjectPreferences = async (prefs: ObjectPreference[]) => {
      try {

         // prettyPrint('[saveObjectPreferences] - prefs to upsert are', prefs, 'blue');

         // Only save checked preferences
         const checkedPrefs = prefs.filter(p => p.checked);

         const upsertRec: any = {
            AppGridAg__Preferences__c: JSON.stringify(checkedPrefs)
         }

         if (objectPreferenceRecId) {
            prettyPrint(`ObjectPrefs saveObjectPreferences() - adding Id to upsert: `, objectPreferenceRecId, 'blue');
            upsertRec['Id'] = objectPreferenceRecId;
         } else {
            prettyPrint(`ObjectPrefs saveObjectPreferences() - creating new preferences record: `, null, 'blue');
         }

         const upsertRecs = [upsertRec];

         const params = {
            sObjectName: 'AppGridAg__AG_User_Object_Prefs__c',
            jsonRecs: JSON.stringify(upsertRecs)
         }

         // prettyPrint('saveObjectPreferences - params are', params, 'blue');

         const result = await apiClient.upsertRecs(params);

         prettyPrint('[saveObjectPreferences] - api response is', result, 'blue');

         if (result.status !== 'success') {
            enqueueSnackbar(result.errorMessage || 'Error saving user object preferences', {
               action: action,
               variant: 'error',
            });
            return;
         }

         if (result.results.length > 1) {
            enqueueSnackbar('Error - More than 1 state record returned.  Please contact your administrator.', {
               action: action,
               variant: 'error',
            });
            return;
         }

         const updatedIds: string[] = [];

         for (let i = 0; i < result.results.length; i++) {
            if (!result.results[i].isSuccess) {
               enqueueSnackbar('Error saving user object preferences', {
                  action: action,
                  variant: 'error',
               })
               console.log('ObjectPreferencesPanel - Error saving user object preferences')
               break;
            }

            const recId = result.results[i].recordId;
            if (recId) updatedIds.push(recId)
         }

         if (updatedIds[0] && objectPreferenceRecId !== updatedIds[0]) {
            // prettyPrint('ObjectPreferencesPanel - updating objectPreferenceRecId to:', updatedIds[0], 'blue')
            setObjectPreferenceRecId(updatedIds[0])
         }

         // Get the names of the checked preferences (use checkedPrefs since we already filtered)
         const checkedObjNames = new Set(checkedPrefs.map(op => op.name));

         // Set the filtered org objects to the object preferences
         const filteredOrgObjects = orgObjects.filter(orgObj =>
            checkedObjNames.has(orgObj.qualifiedApiName)
         );

         // Set the object options and selectedObject
         if (filteredOrgObjects.length > 0) {
            setObjectOptions(filteredOrgObjects);
            // prettyPrint('setting object options to', filteredOrgObjects);
         } else {
            setObjectOptions([]);
         }

         // enqueueSnackbar('Object preferences saved', {
         //    autoHideDuration: 3000,
         //    variant: 'success',
         // });
      } catch (error: unknown) {
         // Type guard to check if error is an instance of Error
         if (error instanceof Error) {
            console.log(error.message);
            enqueueSnackbar('Error saving user object preferences', {
               action: action,
               variant: 'error',
            })
         } else {
            // Handle unexpected errors
            prettyPrint('An unexpected error occurred:', error, 'red');
            enqueueSnackbar('Error saving user object preferences', {
               action: action,
               variant: 'error',
            })
         }
      }
   }

   const saveRelationPreferences = async (prefs: any) => {
      try {
         if (_.isEqual(prefs, prevRelationPrefs.current)) {
            return;
         }

         prevRelationPrefs.current = prefs;

         const upsertRec: any = {
            AppGridAg__Preferences__c: JSON.stringify(prefs),
            AppGridAg__SObjectApiName__c: selectedObject!.qualifiedApiName
         }

         if (relationPreferenceRecId) {
            prettyPrint(`[saveRelationPreferences] - adding Id: `, relationPreferenceRecId, 'blue');
            upsertRec['Id'] = relationPreferenceRecId;
         }

         const upsertRecs = [upsertRec];

         const params = {
            sObjectName: 'AppGridAg__AG_User_Relation_Prefs__c',
            jsonRecs: JSON.stringify(upsertRecs)
         }

         const result = await apiClient.upsertRecs(params);

         prettyPrint('[saveRelationPreferences] - api response is', result, 'blue');

         if (result.status !== 'success') {
            enqueueSnackbar(result.errorMessage || 'Error saving user relation preferences', {
               action: action,
               variant: 'error',
            });
            return;
         }

         if (result.results.length > 1) {
            enqueueSnackbar('Unexpected error - More than 1 state record returned.', {
               action: action,
               variant: 'error',
            });
            return;
         }

         const updatedIds: string[] = [];

         for (let i = 0; i < result.results.length; i++) {
            if (!result.results[i].isSuccess) {
               enqueueSnackbar(' Error saving user relation preferences', {
                  action: action,
                  variant: 'error',
               })
               break;
            }

            const id = result.results[i].recordId;
            updatedIds.push(id)
         }

         if (relationPreferenceRecId !== updatedIds[0]) {
            setRelationPreferenceRecId(updatedIds[0])
         }

         enqueueSnackbar('Relation preferences saved', {
            autoHideDuration: 3000,
            variant: 'success',
         });
      } catch (error: unknown) {
         // Type guard to check if error is an instance of Error
         if (error instanceof Error) {
            console.log(error.message);
            enqueueSnackbar('Error saving user relaton preferences', {
               action: action,
               variant: 'error',
            })
         } else {
            // Handle unexpected errors
            console.log('An unexpected error occurred:', error);
            enqueueSnackbar('Error saving user relation preferences', {
               action: action,
               variant: 'error',
            })
         }
      }
   }

   const updatePreference = (pref: ObjectPreference) => {
      const currentPreferences = objectPreferences; // Assuming this is a getter function for the current state
      const updatedPreferences = currentPreferences.map(obj =>
         obj.name === pref.name
            ? { ...obj, checked: !obj.checked } // Toggle the checked property
            : obj
      );
      setObjectPreferences(updatedPreferences);

      // Save the updated relation preferences
      saveObjectPreferences(updatedPreferences);
   };

   const updateRelationPreference = (pref: RelationPreference) => {
      const currentPreferences = relationPreferences; // Assuming this is a getter function for the current state
      const updatedPreferences = currentPreferences.map(obj =>
         obj.name === pref.name
            ? { ...obj, checked: !obj.checked } // Toggle the checked property
            : obj
      );
      setRelationPreferences(updatedPreferences);

      // Save the updated relation preferences
      saveRelationPreferences(updatedPreferences);
   };

   // build object and relation preferences list
   useEffect(() => {
      const buildObjectPreferences = async () => {
         try {
            // Create a map for quick lookup of existing object preferences
            const existingPrefsMap = new Map<string, boolean>();
            if (objectPreferences && objectPreferences.length > 0) {
               objectPreferences.forEach((pref: ObjectPreference) => {
                  existingPrefsMap.set(pref.name, pref.checked);
               });
            }

            // Filter to only objects with read permissions
            const readableObjects = orgObjects.filter(o => o.permissionsRead === true);

            const newObjectPreferences: ObjectPreference[] = readableObjects.map((o: OrgObject) => {
               const isChecked = existingPrefsMap.get(o.qualifiedApiName);

               const checked = isChecked !== undefined ? isChecked : false; // Default to false if no preference is found

               return {
                  name: o.qualifiedApiName,
                  label: o.label,
                  checked: checked,
               };
            });

            // Sort the preferences by label (or name, depending on your preference)
            newObjectPreferences.sort((a, b) => a.label.localeCompare(b.label));

            setObjectPreferences(newObjectPreferences); // Update the global state
            // prettyPrint('ObjectPrefs - setting objectPreferences to', newObjectPreferences, 'blue');
         } catch (error: any) {
            enqueueSnackbar('Error retrieving object preferences', {
               action: action,
               variant: 'error',
            })
            console.log(error.message)
         }
      }

      const buildRelationPrefs = async () => {
         if (!selectedObject) {
            return;
         }

         try {
            let options: RelationPreference[] = [];

            if (!selectedObjMetadata) {
               return;
            }

            options = [...relationPreferences]

            // sort the options by label
            options.sort((a, b) => a.name.localeCompare(b.name))

            // save the preferences
            setRelationPreferences(options)

         } catch (error: any) {
            enqueueSnackbar('Error retrieving relation preferences', {
               action: action,
               variant: 'error',
            })
            console.log(error.message)
         }
      }

      const buildPreferences = async () => {
         // prettyPrint('ObjectPrefs - buildPreferences props are', {
         //    selectedObject: selectedObject,
         //    selectedObjMetadata: selectedObjMetadata
         // }, 'blue');

         if (!selectedObjMetadata || !selectedObject || selectedObjMetadata.sobjectType !== selectedObject.qualifiedApiName || objPrefsLoaded.current) {
            return;
         }

         objPrefsLoaded.current = true;

         await buildObjectPreferences();
         await buildRelationPrefs();
      }

      buildPreferences()

   }, [action, apiClient, enqueueSnackbar, objectOptions, objectPreferences, orgObjects, relationPreferences, selectedObjMetadata, selectedObject, setObjectPreferences, setRelationPreferences])

   function CustomTabPanel(props: TabPanelProps) {
      const { children, value, index, ...other } = props;

      return (
         <Box
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
         >
            {value === index && (
               <Box sx={{ p: 3 }}>
                  <Typography component="div">{children}</Typography>
               </Box>
            )}
         </Box>
      );
   }

   return (
      <Box
         sx={{
            typography: 'body1',
            border: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            boxSizing: 'border-box',  // Ensure padding and borders are included in height calculations
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            width: 350
         }}>
         <AppBar
            position='sticky'
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               flexShrink: 0
            }}>
            <Toolbar variant="dense">
               <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  sx={{ ml: -1 }}
                  onClick={() => setShowObjectPrefsPanel(false)}
               >
                  <ChevronLeftIcon />
               </IconButton>
               <Typography variant="button" color="inherit" component="div">
                  Object Preferences
               </Typography>
            </Toolbar>
         </AppBar>

         <Tabs value={value} onChange={handleChange} sx={{
            '& .Mui-selected': {
               color: selectedAccentColor, // color of the selected tab
            },
            '& .MuiTab-root': {
               color: theme.palette.text.primary, // color of the unselected tab
            },
         }}>
            <Tab label="Objects" {...a11yProps(0)} />
            <Tab label="Relationships" {...a11yProps(1)} />
         </Tabs>

         <Box
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               flexGrow: 1,
               overflow: 'auto'
            }}>
            <CustomTabPanel value={value} index={0}>
               <Box
                  sx={{
                     backgroundColor: theme.palette.background.paper,
                     color: theme.palette.text.primary,
                     overflow: 'auto',
                     height: '100%',
                  }}>
                  <Stack
                     direction='row'
                     spacing={2}>
                     <Button
                        variant="contained"
                        size='small'
                        onClick={handleObjectPreferencesSelectAll}
                     >Select All
                     </Button>
                     <Button
                        variant="contained"
                        size='small'
                        onClick={handleObjectPreferencesClearAll}>
                        Clear All
                     </Button>
                  </Stack>
                  <Box
                     sx={{
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        marginTop: 2,
                        flexGrow: 1, // This makes the List expand to take up available space
                        overflow: 'auto', // Adds scrollbars when content overflows
                     }}>
                     <List sx={{
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        width: '100%'
                     }}>
                        {objectPreferences.map((item: ObjectPreference) => (
                           <ListItem key={item.name} disablePadding sx={{ borderBottom: 'none' }}>
                              <ListItemButton
                                 role={undefined}
                                 onClick={() => updatePreference(item)}
                                 dense
                                 sx={{ borderBottom: 'none' }}>
                                 <ListItemIcon>
                                    <Checkbox
                                       edge="start"
                                       checked={objectPreferences.find((pref) => pref.name === item.name)?.checked}
                                       tabIndex={-1}
                                       disableRipple
                                       sx={{
                                          color: theme.palette.text.primary,
                                          '&.Mui-checked': {
                                             color: selectedAccentColor,
                                          },
                                       }}
                                    />
                                 </ListItemIcon>
                                 <ListItemText primary={item.label} />
                              </ListItemButton>
                           </ListItem>
                        ))}
                     </List>
                  </Box>
               </Box>
            </CustomTabPanel>
            <CustomTabPanel
               value={value}
               index={1}>
               <Box
                  sx={{
                     backgroundColor: theme.palette.background.paper,
                     color: theme.palette.text.primary,
                     overflow: 'auto',
                     height: '100%'
                  }}>
                  <Stack
                     direction='row'
                     spacing={2}>
                     <Button
                        variant="contained"
                        size='small'
                        onClick={handleRelationPreferencesSelectAll}
                     >Select All
                     </Button>
                     <Button
                        variant="contained"
                        size='small'
                        onClick={handleRelationPreferencesClearAll}>
                        Clear All
                     </Button>
                  </Stack>

                  <Box
                     sx={{
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        marginTop: 2,
                        flexGrow: 1, // This makes the List expand to take up available space
                        overflow: 'auto', // Adds scrollbars when content overflows
                     }}>
                     <List sx={{ width: '100%' }}>
                        {relationPreferences.map((item: RelationPreference) => {
                           return (
                              <ListItem key={item.name} disablePadding sx={{ borderBottom: 'none' }}>
                                 <ListItemButton
                                    role={undefined}
                                    onClick={() => updateRelationPreference(item)}
                                    dense
                                    sx={{ borderBottom: 'none' }}>
                                    <ListItemIcon>
                                       <Checkbox
                                          edge="start"
                                          checked={relationPreferences.find((pref) => pref.name === item.name)?.checked}
                                          tabIndex={-1}
                                          disableRipple
                                          sx={{
                                             color: theme.palette.text.primary,
                                             '&.Mui-checked': {
                                                color: selectedAccentColor,
                                             },
                                          }}
                                       />
                                    </ListItemIcon>
                                    <ListItemText primary={item.label} />
                                 </ListItemButton>
                              </ListItem>
                           );
                        })}
                     </List>
                  </Box>
               </Box>
            </CustomTabPanel>
         </Box>
      </Box>
   );
}

export default ObjectPrefsPanel
