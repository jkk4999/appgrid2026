import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// Domain-specific selector hooks
import { useThemeState } from '../../hooks/selectors/useUIState';

// Ag-Grid
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component

// ReactHookForm
import { useForm } from 'react-hook-form'

import { capitalizeFirstChar } from '../../utilities/capitalizeFirstChar';


// notifications
import { useSnackbar } from 'notistack'

// MUI
import { AppBar, Autocomplete, Box, Button, CircularProgress, IconButton, Stack, Tab, Tabs, TextField, Toolbar, Tooltip, Typography } from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

import { ColDef, GridApi, GridReadyEvent, RowSelectionOptions } from 'ag-grid-community';

import { APIClient } from '../../brideDesignPattern/apiInterface';

import { SObjectGridTemplate, SObjectPermission, UserProfile } from '../../sObjectMetadataTypes';

// MUI icons
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';

function CustomTabPanel(props: any) {
   const { children, value, index, ...other } = props;

   return (
      <div
         role="tabpanel"
         hidden={value !== index}
         id={`simple-tabpanel-${index}`}
         aria-labelledby={`simple-tab-${index}`}
         {...other}
      >
         {value === index && (
            <Box sx={{ p: 3 }}>
               {children}
            </Box>
         )}
      </div>
   );
}

function a11yProps(index: number) {
   return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
   };
}

interface PersonToClone {
   id: string;
   name: string;
}

import {
   themeQuartz,
} from "ag-grid-community";

import { prettyPrint } from '../../utilities/prettyPrint';

interface DeploymentPanelProps {
   apiClient: APIClient;
   gridApi: GridApi;
   objectPermissions: SObjectPermission[];
}

const baseThemes = [
   { id: "themeQuartz", value: themeQuartz },
];

const DeploymentPanel = ({ apiClient }: DeploymentPanelProps) => {
   const theme = useTheme();

   const [baseTheme] = useState(baseThemes[0]);

   console.log('Deployment panel loading');

   // notifications
   const { enqueueSnackbar, closeSnackbar } = useSnackbar()

   // add action to an individual snackbar
   const action = useCallback((snackbarId: any) => (
      <>
         <button
            onClick={() => {
               closeSnackbar(snackbarId);
            }}
         >
            Dismiss
         </button>
      </>
   ), [closeSnackbar]);

   // Theme state
   const { selectedAccentColor, selectedGridColorTheme } = useThemeState();

   // Global state
   const {
      setLoading,
      setShowDeploymentPanel
   } = useStore(useShallow((state) => ({
      setLoading: state.setLoading,
      setShowDeploymentPanel: state.setShowDeploymentPanel
   })));

   const agGridTheme = useMemo(() => {
      let theme = baseTheme.value;
      if (selectedGridColorTheme.value) {
         theme = theme.withPart(selectedGridColorTheme.value);
      }
      return theme;
   }, [baseTheme, selectedGridColorTheme]);


   // local state
   const [appUsers, setAppUsers] = useState([]);

   const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

   const [gridApi2, setGridApi2] = useState<null | GridApi>(null); // State to hold gridApi

   const [personToCloneOptions, setPersonToCloneOptions] = useState<PersonToClone[]>([])

   const [personToClone, setPersonToClone] = useState<PersonToClone | undefined>(undefined);

   const [, setSourceInputText] = useState('')

   const [showTemplateSave, setShowTemplateSave] = useState(false);

   const [, setShowCloneErrors] = useState(false);

   const [, setCloneErrorMessage] = useState('');

   const [selectedProfile, setSelectedProfile] = useState<UserProfile>();

   const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);

   const [loadingUser, setLoadingUser] = useState(false);

   const [selectedTemplate, setSelectedTemplate] = useState<SObjectGridTemplate | null>(null);

   // for tabs
   const [value, setValue] = React.useState(0);

   const [templateOptions, setTemplateOptions] = useState<SObjectGridTemplate[]>([])

   const [, setTemplateValue] = useState<SObjectGridTemplate | null>(null)

   const rowSelection = useMemo<
      RowSelectionOptions | "single" | "multiple"
   >(() => {
      return {
         mode: "multiRow",
         groupSelects: "self",
         // checkboxLocation: 'autoGroupColumn',
      };
   }, []);

   // react hook form (for config template save)
   const form = useForm()

   const { register, handleSubmit, formState } = form
   const { errors } = formState

   const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      if (newValue === 0) {
         // clear user selection
         setPersonToClone(undefined)

         setShowTemplateSave(false);
      } else {
         setTemplateValue(null)
      }
      setValue(newValue);
   };

   const deleteTemplate = async () => {
      if (!selectedTemplate) {
         enqueueSnackbar('Select a template first!', {
            autoHideDuration: 3000,
            variant: 'warning',
         })
         return;
      }
      prettyPrint('deleteTemplate() - selectedTemplate is', selectedTemplate);

      const rowIdsToDelete = [selectedTemplate.id as string];

      const deleteResult = await apiClient.deleteRecs({
         recordIds: rowIdsToDelete,
         sObjectName: 'AppGridAg__AG_Grid_Template__c'
      });

      console.log('deleteTemplate() - deleteResult is');

      console.dir(deleteResult);

      if (deleteResult.status !== 'success') {
         setCloneErrorMessage(deleteResult.errorMessage || 'Delete operation failed');
         setShowCloneErrors(true);
         return;
      }

      const errorsMap = new Map<string, string>()

      for (const res of deleteResult.results) {
         const isSuccess = res.isSuccess;
         const recId = res.recordId || res.id

         if (!isSuccess) {
            // show first error
            const errorMessage = res.errorMessages?.[0] || res.errors?.[0];

            errorsMap.set(recId, errorMessage);

            setCloneErrorMessage(errorMessage);

            setShowCloneErrors(true);
         }

         // stop after first error
         break;
      }

      if (errorsMap.size === 0) {
         setCloneErrorMessage('');

         setShowCloneErrors(false);

         enqueueSnackbar('Template deleted!', {
            autoHideDuration: 3000,
            variant: 'info',
         })

         // refresh the template options
         const [gridTemplatesResult] = await Promise.all([
            apiClient.getGridTemplates()
         ]);

         prettyPrint('deleteTemplate() - gridTemplatesResult is', gridTemplatesResult);

         setTemplateOptions(gridTemplatesResult);

         setSelectedTemplate(null);
      }
   }

   const getData = async (value: string) => {
      try {

         setLoadingUser(true);

         console.log('getting autcomplete data')

         const fieldName = 'Name'

         const queryRule = {
            condition: 'and',
            rules: [
               {
                  label: fieldName,
                  field: fieldName,
                  type: 'string',
                  operator: 'startswith',
                  value: capitalizeFirstChar(value),
               },
            ],
         }

         const paramsObj = {
            sObjectName: 'User',
            queryRule: JSON.stringify(queryRule),
            subQueryRule: null,
            subQueryRelation: null
         }

         prettyPrint('executeDynamicSOQL params are', paramsObj);

         const apiResult = await apiClient.executeDynamicSOQL(paramsObj);

         prettyPrint('executeDynamicSOQL - apiResult is', apiResult);

         if (apiResult.status === 'error') {
            throw new Error(apiResult.errorMessage);
         }

         const suggestData: any = []

         if (apiResult.records) {
            apiResult.records.map((rec: any) => {
               suggestData.push({
                  id: String(rec.Id),
                  name: String(rec.Name),
               });
            })

            console.log('deploymentPanel - setting options to');

            console.dir(suggestData);

            setPersonToCloneOptions(suggestData)

            setLoadingUser(false)
         }
      } catch (error) {
         // log error and notify user
         console.log(error)

         setLoadingUser(false)

         // notify user of error
         enqueueSnackbar('Error retrieving user', {
            action: action,
            variant: 'error',
         })
      }
   }

   const createTemplate = async (templateName: string) => {

      if (templateName === '' || !personToClone) {
         return;
      }

      console.log('createTemplate - props are')

      console.dir({
         personToClone: personToClone.id,
         templateName: templateName
      });

      try {
         setLoading(true);

         const params = {
            userId: personToClone.id,
            templateName: templateName
         }

         const apiResult = await apiClient.createAppGridTemplate(params);

         prettyPrint('createTemplate - apiResult is', apiResult);

         setTemplateOptions(apiResult)

         // notify user of success
         enqueueSnackbar('Template created!', {
            autoHideDuration: 3000,
            variant: 'success',
         })

         setCloneErrorMessage('')

         setShowCloneErrors(false)

         setLoading(false);
      } catch (error: any) {
         console.error(error.message)

         // notify user of error
         enqueueSnackbar(error.message, {
            action: action,
            variant: 'error',
         })

         setCloneErrorMessage(error.message)

         setShowCloneErrors(true)

         setLoading(false);
      }
   }

   const onTemplateCreateAsSubmit = (data: any) => {
      // save selected user's config as a template
      prettyPrint('onTemplateCreateAsSubmit - data is', data);

      const templateName = data.templateName;

      createTemplate(templateName);
   }

   const handleAssignTemplate = () => {
      const assignTemplate = async () => {
         try {
            setLoading(true);

            const selectedRows = gridApi2?.getSelectedRows();

            if (!selectedRows || selectedRows.length === 0) {
               throw new Error('Please select one or more users to continue')
            }

            const selectedRowIds = selectedRows.map((item: any) => item.Id)

            if (!selectedTemplate) {
               throw new Error('Please select a template to continue')
            }

            const templateId = selectedTemplate.id;

            const params = {
               templateId: templateId!,
               userIdsToClone: selectedRowIds
            }

            prettyPrint('handleAssignTemplate - params are', params);

            const result = await apiClient.cloneAppGridTemplate(params)

            prettyPrint('handleAssignTemplate - result is', result);

            // Check for success (API may return different success indicators)
            if (result && (result.status === 'success' || result === 'success' || !result.error)) {
               enqueueSnackbar('Templates assigned!', {
                  autoHideDuration: 3000,
                  variant: 'success',
               })
            } else {
               throw new Error(result?.error || result?.message || 'Unknown error assigning templates')
            }
         } catch (error: any) {
            console.error(`Error assigning templates - ${error.message}`);

            enqueueSnackbar(`Error assigning templates - ${error.message}`, {
               action: action,
               variant: 'error',
            })
         } finally {
            setLoading(false);
         }
      }

      assignTemplate();
   }

   const onGridReady = useCallback((params: GridReadyEvent) => {
      setGridApi2(params.api); // Set GridApi
      // console.log('Grid API is ready.');
   }, []);

   // load initial data
   useEffect(() => {
      const createGridColumns = () => {
         let gridCols = [];

         const nameCol: ColDef = {
            field: 'Name',
            headerName: 'Name',
            editable: false,
            filter: true,
         }

         gridCols.push(nameCol);

         return gridCols;
      }

      const loadData = async () => {

         const gridCols = createGridColumns();
         setColumnDefs(gridCols);

         const [gridTemplatesResult, profilesResult] = await Promise.all([
            apiClient.getGridTemplates(),
            apiClient.getAllProfiles()
         ]);

         prettyPrint('deploymentPanel initial data is', {
            gridTemplatesResult: gridTemplatesResult,
            profilesResult: profilesResult
         });

         setTemplateOptions(gridTemplatesResult);

         // Sort profiles alphabetically by name
         const sortedProfiles = [...profilesResult].sort((a: UserProfile, b: UserProfile) =>
            a.name.localeCompare(b.name)
         );
         setUserProfiles(sortedProfiles)
      }

      loadData();
   }, [apiClient, enqueueSnackbar])

   // load users with selected profile
   useEffect(() => {
      const getUsersWithProfile = async () => {
         // create the query to return related records

         try {
            if (!selectedProfile) {
               return;
            }

            const profileUsers = await apiClient.getUsersWithProfile(
               { profileName: selectedProfile.name })

            prettyPrint('getUsersWithProfile profileUsers is', profileUsers);

            const userList = profileUsers.map((item: any) => {
               return {
                  Id: item.id,
                  Name: item.name
               }
            })

            prettyPrint('getUsersWithProfile userList is', userList);

            setAppUsers(userList);

         } catch (error: any) {
            console.error(`Error retrieving users - ${error.message}`);
            enqueueSnackbar(`Error retrieving users - ${error.message}`, {
               action: action,
               variant: 'error',
            })
         }
      }

      getUsersWithProfile();
   }, [action, apiClient, enqueueSnackbar, selectedProfile])

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
            boxSizing: 'border-box'
         }}>
         <AppBar
            position="static"
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
                  onClick={() => setShowDeploymentPanel(false)}
               >
                  <ChevronLeftIcon />
               </IconButton>
               <Typography variant="button" color="inherit" component="div" sx={{ align: 'left' }}>
                  Configuration Wizard
               </Typography>
            </Toolbar>
         </AppBar>

         {/* tab control */}
         <Tabs
            value={value}
            onChange={handleTabChange}
            aria-label="basic tabs example"
            sx={{
               // '& .MuiTabs-indicator': {
               //    backgroundColor: adaptableTextColor, // color of the indicator line
               // },
               '& .Mui-selected': {
                  color: selectedAccentColor, // color of the selected tab
               },
               '& .MuiTab-root': {
                  color: theme.palette.text.primary, // color of the unselected tab
               },
            }}
         >
            <Tab label="Template" {...a11yProps(0)} />
            <Tab label="User Config" {...a11yProps(1)} />
         </Tabs>

         <Box
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               flexGrow: 1,
               overflow: 'auto'
            }}>
            {/* Template Config tab*/}
            <CustomTabPanel value={value} index={0}>
               <Box
                  sx={{
                     overflow: 'auto',
                     backgroundColor: theme.palette.background.paper,
                     color: theme.palette.text.primary,
                     height: '100%'
                  }}>
                  {/* template selector */}
                  <Stack direction='row'
                     sx={{
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                     }}>
                     <Autocomplete
                        disablePortal
                        sx={{
                           input: {
                              color: theme.palette.text.primary
                           },
                           width: 250,
                           marginRight: 2,
                           marginTop: -3,
                        }}
                        slotProps={{
                           clearIndicator: {
                              style: {
                                 color: theme.palette.text.primary,
                              }
                           },
                           popupIndicator: {
                              style: {
                                 color: theme.palette.text.primary,
                              }
                           },
                        }}
                        options={templateOptions}
                        getOptionLabel={(option) => (option ? option.name : '')}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={selectedTemplate ? selectedTemplate : undefined}
                        onChange={(_event, value: any) => {
                           console.log('onChange - value is')
                           console.dir(value)
                           setSelectedTemplate(value)
                        }}
                        disableClearable
                        renderInput={(params) => (
                           <TextField
                              {...params}
                              label="Select template"
                              margin="normal"
                              variant="standard"
                              fullWidth
                              sx={{
                                 '& .MuiInputBase-input': {
                                    color: theme.palette.text.primary, // Set input text color
                                 },
                                 '& .MuiTextField-root': {
                                    color: theme.palette.text.primary
                                 },
                                 '& .MuiFormLabel-root': {
                                    color: selectedAccentColor, // Set label color
                                 },
                                 '& .MuiInput-underline:before': {
                                    borderBottomColor: theme.palette.text.primary, // Set the color of the underline
                                 },
                                 '& .MuiInput-underline:hover:before': {
                                    borderBottomColor: theme.palette.text.primary, // Set the color of the underline on hover
                                 },
                                 '& .MuiInput-underline:after': {
                                    borderBottomColor: theme.palette.text.primary, // Set the color of the underline after interaction
                                 },

                              }}
                           />
                        )}
                     />
                     <Tooltip title="Delete template" placement="top" sx={{
                        color: theme.palette.text.primary,
                        '&:hover': {
                           color: selectedAccentColor, // Hover color when using a CSS variable
                        },
                     }}>
                        <IconButton
                           aria-label="Delete template"
                           onClick={() => {
                              deleteTemplate()
                           }}
                        >
                           <DeleteOutlinedIcon sx={{ fontSize: 25 }} />
                        </IconButton>
                     </Tooltip>
                  </Stack>

                  {/* profile selector */}
                  <Box>
                     <Autocomplete
                        disablePortal
                        sx={{
                           input: { color: theme.palette.text.primary },
                           width: 250,
                           marginRight: 2,
                           marginTop: 0,
                        }}

                        slotProps={{
                           clearIndicator: {
                              style: {
                                 color: theme.palette.text.primary,
                              }
                           },
                           popupIndicator: {
                              style: {
                                 color: theme.palette.text.primary,
                              }
                           },
                        }}
                        options={userProfiles}
                        getOptionLabel={(option) => (option ? option.name : '')}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={selectedProfile ? selectedProfile : undefined}
                        onChange={(_event, value: UserProfile | null) => {
                           console.log('onChange - value is')
                           console.dir(value)
                           setSelectedProfile(value ?? undefined)
                        }}
                        disableClearable
                        renderInput={(params) => (
                           <TextField
                              {...params}
                              label="Select profile"
                              margin="normal"
                              variant="standard"
                              fullWidth
                              sx={{
                                 '& .MuiInputBase-input': {
                                    color: theme.palette.text.primary, // Set input text color
                                 },
                                 '& .MuiTextField-root': {
                                    color: theme.palette.text.primary
                                 },
                                 '& .MuiFormLabel-root': {
                                    color: selectedAccentColor, // Set label color
                                 },
                                 '& .MuiInput-underline:before': {
                                    borderBottomColor: theme.palette.text.primary, // Set the color of the underline
                                 },
                                 '& .MuiInput-underline:hover:before': {
                                    borderBottomColor: theme.palette.text.primary, // Set the color of the underline on hover
                                 },
                                 '& .MuiInput-underline:after': {
                                    borderBottomColor: theme.palette.text.primary, // Set the color of the underline after interaction
                                 },

                              }}
                           />
                        )}
                     />
                  </Box>

                  {/* user grid */}
                  <Box
                     sx={{
                        height: 250,
                        width: '100%',
                        mt: 2
                     }}>
                     <AgGridReact
                        columnDefs={columnDefs}
                        onGridReady={onGridReady}
                        rowData={appUsers}
                        rowSelection={rowSelection}
                        theme={agGridTheme}
                     />
                  </Box>

                  <Button
                     variant="contained"
                     size='small'
                     onClick={handleAssignTemplate}
                     sx={{
                        mt: 2
                     }}
                  >
                     Assign Template
                  </Button>
               </Box>

            </CustomTabPanel>

            {/* User Config tab*/}
            <CustomTabPanel value={value} index={1}>
               <Box
                  sx={{
                     overflow: 'auto',
                     backgroundColor: theme.palette.background.paper,
                     color: theme.palette.text.primary,
                     height: '100%'
                  }}>
                  <Stack
                     direction='row'
                     sx={{
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                     }}>
                     <Autocomplete
                        disablePortal
                        sx={{
                           input: { color: theme.palette.text.primary },
                           width: 350,
                        }}
                        loading={loadingUser}
                        slotProps={{
                           clearIndicator: {
                              style: {
                                 color: theme.palette.text.primary,
                              }
                           },
                           popupIndicator: {
                              style: {
                                 color: theme.palette.text.primary,
                              }
                           },
                        }}
                        autoComplete
                        options={personToCloneOptions}
                        getOptionLabel={(option) => (option ? option.name : '')}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={personToClone ? personToClone : undefined}
                        onChange={(_event, value: PersonToClone | null) => {
                           console.log('setting personToClone value to');
                           console.dir(value);
                           if (value) {
                              setPersonToClone(value);
                           }

                        }}
                        onInputChange={(_event, value, reason) => {
                           prettyPrint('onInputChange values are', {
                              newInputValue: value,
                              reason: reason
                           });

                           if (reason === 'input') {
                              if (value === undefined || value.length < 3) {
                                 setSourceInputText('');
                                 setPersonToCloneOptions([]);
                                 return;
                              } else {
                                 setSourceInputText(value);
                                 getData(value);
                              }
                           }
                        }}
                        disableClearable
                        renderInput={(params) => (
                           <TextField
                              {...params}
                              label="Search users"
                              margin="normal"
                              variant="standard"
                              fullWidth
                              InputProps={{
                                 ...params.InputProps,
                                 endAdornment: (
                                    <>
                                       {loadingUser ? <CircularProgress color="inherit" size={20} /> : null}
                                       {params.InputProps.endAdornment}
                                    </>
                                 ),
                              }}
                              sx={{
                                 '& .MuiInputBase-input': {
                                    color: theme.palette.text.primary,
                                 },
                                 '& .MuiTextField-root': {
                                    color: theme.palette.text.primary,
                                 },
                                 '& .MuiFormLabel-root': {
                                    color: selectedAccentColor,
                                 },
                                 '& .MuiInput-underline:before': {
                                    borderBottomColor: theme.palette.text.primary,
                                 },
                                 '& .MuiInput-underline:hover:before': {
                                    borderBottomColor: theme.palette.text.primary,
                                 },
                                 '& .MuiInput-underline:after': {
                                    borderBottomColor: theme.palette.text.primary,
                                 },
                                 '& .MuiCircularProgress-root': {
                                    color: theme.palette.text.primary, // Match spinner color to theme
                                 },
                              }}
                           />
                        )}
                     />
                     <Tooltip title="Save template" placement="top" sx={{
                        color: theme.palette.text.primary,
                        '&:hover': {
                           color: selectedAccentColor, // Hover color when using a CSS variable
                        },
                     }}>
                        <IconButton
                           aria-label="Save template"
                           onClick={() => {
                              setShowTemplateSave(true)
                           }}
                        >
                           <FavoriteBorderOutlinedIcon sx={{ fontSize: 25 }} />
                        </IconButton>
                     </Tooltip>
                  </Stack>
                  {/* saveAs name */}
                  <Stack
                     sx={{
                        display: showTemplateSave ? 'block' : 'none',
                        marginLeft: 2,
                        // marginBottom: 3,
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                     }}
                     direction={'row'}
                     justifyContent="end"
                  >
                     {/* "handleSubmit" will validate your inputs before invoking "onSubmit" */}

                     <form onSubmit={handleSubmit(onTemplateCreateAsSubmit)} noValidate>
                        <Stack
                           direction={'column'}
                           spacing={4}
                           marginRight={5}
                           sx={{
                              backgroundColor: theme.palette.background.paper,
                              color: theme.palette.text.primary, marginBottom: 2
                           }}>
                           <TextField
                              defaultValue={''}
                              label="Template name"
                              size="small"
                              variant="standard"
                              {...register('templateName', {
                                 required: 'Template name is required',
                              })}
                              error={!!errors.templateName}
                              // helperText={errors.ruleName?.message}
                              sx={{
                                 marginTop: 2,
                                 marginLeft: 2,
                                 // Set background color for the entire TextField
                                 backgroundColor: theme.palette.background.paper,
                                 color: theme.palette.text.primary,
                                 // Input text color
                                 '& .MuiInputBase-input': {
                                    color: theme.palette.text.primary,
                                 },
                                 // Label color
                                 '& .MuiFormLabel-root': {
                                    color: selectedAccentColor,
                                 },
                                 // Optional: Set colors for the underline
                                 '& .MuiInput-underline:before': {
                                    borderBottomColor: theme.palette.text.primary,
                                 },
                                 '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                                    borderBottomColor: theme.palette.text.primary,
                                 },
                                 '& .MuiInput-underline:after': {
                                    borderBottomColor: theme.palette.text.primary,
                                 },
                              }}
                           />
                           <Stack direction='row'>
                              <Button type="submit" color="primary" size="small" sx={{ paddingTop: 2 }}>
                                 Submit
                              </Button>
                              <Button color="primary" size="small" onClick={() => {
                                 setShowTemplateSave(false)
                              }} sx={{ paddingTop: 2, }}>
                                 Cancel
                              </Button>
                           </Stack>
                           {/* </Box> */}
                        </Stack>
                     </form>
                  </Stack>
               </Box>
            </CustomTabPanel>
         </Box>
      </Box>
   )
}

export default DeploymentPanel