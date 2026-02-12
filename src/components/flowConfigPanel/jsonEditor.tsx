import React, { useCallback, useEffect, useRef, useState } from "react";

// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// react-hook-form
import { useForm, useFieldArray } from "react-hook-form";

// flows selector
import FlowPicker from "./flowPicker";

// notifications
import { useSnackbar } from 'notistack'
import type { SnackbarKey } from 'notistack'

// MUI
import { Autocomplete, Button, TextField, Box, Typography, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";

// MUI icons
import DeleteIcon from "@mui/icons-material/Delete";
import AddOutlinedIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { decode } from "he";
import { BatchDeleteResponse, SObjectDeleteResult, SObjectFlow, SObjectPermission } from "../../sObjectMetadataTypes";
import { APIClient, ObjFlowParams, UpsertServiceParams } from "../../brideDesignPattern/apiInterface";

const propertyTypes = ["string", "integer", "decimal", "boolean"] as const;

// Define a type for the fields
type PropertyType = (typeof propertyTypes)[number];

interface PropertyField {
   name: string;
   type: PropertyType;
}

// Define the form schema
interface FormSchema {
   fields: PropertyField[];
}

export default function JsonEditor(props: any) {

   const apiClient: APIClient = props.apiClient;
   const objectPermissions = props.objectPermissions;

   // notifications
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

   // global state
   const {
      muiColor,
      selectedAccentColor,
      selectedObjMetadata,
      selectedSubgridObjMetadata,
      selectedFlow,
      selectedSubgridFlow,
      setObjFlows,
      setSubgridObjFlows,
      setSelectedFlow,
      setSelectedSubgridFlow,
      selectedObject,
      selectedSubgridObject,
      flowEventSource
   } = useStore(
      useShallow((state) => ({
         muiColor: state.muiColor,
         selectedAccentColor: state.selectedAccentColor,
         selectedObjMetadata: state.selectedObjMetadata,
         selectedSubgridObjMetadata: state.selectedSubgridObjMetadata,
         selectedFlow: state.selectedFlow,
         selectedSubgridFlow: state.selectedSubgridFlow,
         setObjFlows: state.setObjFlows,
         setSubgridObjFlows: state.setSubgridObjFlows,
         setSelectedFlow: state.setSelectedFlow,
         setSelectedSubgridFlow: state.setSelectedSubgridFlow,
         selectedObject: state.selectedObject,
         selectedSubgridObject: state.selectedSubgridObject,
         flowEventSource: state.flowEventSource,
      }))
   );


   // local state
   const [createFlow, setCreateFlow] = useState<boolean>(false)
   const [flowName, setFlowName] = useState<string>('')
   const selectedFlowRecId = useRef<string>('');
   const [showErrors, setShowErrors] = useState(false);
   const [errorMessage, setErrorMessage] = useState<string>('');


   const { control, register, handleSubmit, getValues } = useForm<FormSchema>({
      defaultValues: { fields: [] }
   });

   const { fields, append, remove } = useFieldArray({
      control,
      name: "fields"
   });

   const [open, setOpen] = useState(false);

   const [newProperty, setNewProperty] = useState<PropertyField>({ name: "", type: "string" });

   const handleAddProperty = () => {
      if (newProperty.name.trim()) {
         append({ name: newProperty.name, type: newProperty.type });
         setNewProperty({ name: "", type: "string" }); // Reset with a valid type
         setOpen(false);
      }
   };

   const deleteRecords = useCallback(
      async (flowId: string, sObjectName: string): Promise<SObjectDeleteResult[]> => {
         console.log('deleteRecords executing');

         try {

            let deleteResultApiResponse: SObjectDeleteResult[] = [];

            if (flowEventSource === 'gridView') {
               // check for delete permission
               if (selectedObject!.qualifiedApiName === 'Task' || selectedObject!.qualifiedApiName === 'Event') {
                  // get the permission from the SObject metadata
                  const hasPerm = selectedObjMetadata?.isAccessible && selectedObjMetadata?.isDeletable;
                  if (!hasPerm) {
                     throw new Error(`Delete Permission assignment for ${selectedObject?.qualifiedApiName} was not found`);
                  }
               } else {
                  const perms = objectPermissions.find((f: SObjectPermission) => f.sObjectType === sObjectName);

                  if (!perms) {
                     throw new Error(`Permissions record not found for ${sObjectName}.`)
                  }

                  if (!perms?.canDelete) {
                     console.log('deleteRecords permissions check failed');
                     throw new Error(`Delete permission not found for ${sObjectName}`);
                  }
               }

               console.log('deleteRecords - rowIdsToDelete are');
               console.dir(selectedFlow?.id);
               const rowIdsToDelete = [selectedFlow!.id as string]

               const batchResponse: BatchDeleteResponse = await apiClient.deleteRecs({ recordIds: rowIdsToDelete, sObjectName: sObjectName });
               deleteResultApiResponse = batchResponse.results;

               console.log('deleteRecords - deleteResult is');
               console.dir(deleteResultApiResponse);
            }

            if (flowEventSource === 'subGrid') {
               // check for delete permission
               if (selectedSubgridObject!.qualifiedApiName === 'Task' || selectedSubgridObject!.qualifiedApiName === 'Event') {
                  // get the permission from the SObject metadata
                  const hasPerm = selectedSubgridObjMetadata!.isAccessible && selectedSubgridObjMetadata?.isDeletable;
                  if (!hasPerm) {
                     throw new Error(`Delete Permission assignment for ${selectedSubgridObject?.qualifiedApiName} was not found`);
                  }
               } else {
                  const perms = objectPermissions.find((f: SObjectPermission) => f.sObjectType === sObjectName);

                  if (!perms) {
                     throw new Error(`Permissions record not found for ${sObjectName}.`)
                  }

                  if (!perms?.canDelete) {
                     console.log('deleteRecords permissions check failed');
                     throw new Error(`Delete permission not found for ${sObjectName}`);
                  }
               }

               console.log('deleteRecords - rowIdsToDelete are');

               console.dir(selectedSubgridFlow?.id);

               const rowIdsToDelete = [selectedSubgridFlow!.id as string]

               const batchResponse: BatchDeleteResponse = await apiClient.deleteRecs({ recordIds: rowIdsToDelete, sObjectName: sObjectName });

               deleteResultApiResponse = batchResponse.results;

               console.log('deleteRecords - deleteResult is');

               console.dir(deleteResultApiResponse);

               return deleteResultApiResponse;
            }

            return deleteResultApiResponse;
         } catch (error: any) {
            enqueueSnackbar(error.message, {
               action: action,
               variant: 'error',
            });
            throw error; // Re-throw error for caller to handle if needed
         }
      },
      [action, apiClient, enqueueSnackbar, flowEventSource, objectPermissions, selectedFlow, selectedObjMetadata?.isAccessible, selectedObjMetadata?.isDeletable, selectedObject, selectedSubgridFlow, selectedSubgridObjMetadata, selectedSubgridObject]
   );

   const addFlow = () => {
      // show flow name
      setCreateFlow(true)

      remove();  // remove existing flow properties
   }

   const deleteFlow = () => {
      const delFlow = async () => {
         // delete selected flow
         if (flowEventSource === 'gridView' && !selectedFlow) {
            return;
         }

         if (flowEventSource === 'subGrid' && !selectedSubgridFlow) {
            return;
         }

         const deleteResult = await deleteRecords(flowEventSource === 'gridView' ? selectedFlow!.id as string : selectedSubgridFlow!.id as string, 'AppGridAg__AG_Flow__c')

         console.log('jsonEditor - deleteResult is');
         console.dir(deleteResult);

         let hasErrors = false;

         for (const res of deleteResult) {
            if (!res.isSuccess) {
               hasErrors = true;
               setErrorMessage(res.errors[0])

               break;
            }
         }

         if (hasErrors) {
            setShowErrors(true);
         }

         if (!hasErrors) {
            enqueueSnackbar('Flow deleted!', {
               autoHideDuration: 3000,
               variant: 'success',
            });

            if (flowEventSource === 'gridView') {
               setSelectedFlow(null);
               setFlowName('');
               setCreateFlow(false)
               remove();  // Removes all existing fields
            } else {
               setSelectedSubgridFlow(null);
               setFlowName('');
               setCreateFlow(false)
               remove();  // Removes all existing fields
            }

            // reload the flow options
            const [
               objFlowsResult,
            ] = await Promise.all([
               apiClient.getObjFlows({ sObjectName: flowEventSource === 'gridView' ? selectedObject!.qualifiedApiName : selectedSubgridObject!.qualifiedApiName } as ObjFlowParams),
            ]);

            // set objFlows
            if (flowEventSource === 'gridView') {
               setObjFlows(objFlowsResult)
            } else {
               setSubgridObjFlows(objFlowsResult)
            }
         }
      }

      delFlow();
   }

   // Helper function to get default values based on type
   const getDefaultValueByType = (type: PropertyType): any => {
      switch (type) {
         case "string":
            return "";
         case "integer":
            return 0;
         case "decimal":
            return 0.0;
         case "boolean":
            return false;
         default:
            return null; // Handle unexpected types
      }
   };

   const createDefaultValues = () => {
      // Convert fields array to an object with default values based on type
      const defaultFormValues = fields.reduce((acc, field) => {
         acc[field.name] = getDefaultValueByType(field.type);
         return acc;
      }, {} as Record<string, any>);

      // Convert schema object to JSON string for saving
      console.log('defaultFormValues are');
      console.dir(defaultFormValues);
      return defaultFormValues;
   };

   // functions
   const saveFlowConfig = async (schema: string, flowValues: string) => {
      const upsertRec: SObjectFlow = {
         name: createFlow ? flowName : flowEventSource === 'gridView' ? selectedFlow!.name : selectedSubgridFlow!.name,
         flowParameters: flowValues,
         flowProperties: schema,
         sObjectApiName: flowEventSource === 'gridView' ? selectedObject!.qualifiedApiName : selectedSubgridObject!.qualifiedApiName,
         isActive: true,
      }

      if (selectedFlowRecId.current) {
         // console.log(`GridPanel saveObjectPreferences - adding id `);
         upsertRec['id'] = selectedFlowRecId.current as string;
      }

      const upsertRecs = [];
      upsertRecs.push(upsertRec);

      console.log('GridPanel saveObjectPreferences - upsertRecs are ');
      console.dir(upsertRecs);

      // Stringify the records
      const param: UpsertServiceParams = {
         sObjectName: 'AppGridAg__AG_Flow__c',
         jsonRecs: JSON.stringify(upsertRecs),
      };

      const response = await apiClient.upsertRecs(param);
      const results = response.results;

      console.log('GridPanel saveObjectPreferences - api response is');
      console.dir(response);

      if (results.length > 1) {
         console.log('FlowConfig - more than 1 upsert record returned.')
         enqueueSnackbar('FlowConfig Error - more than 1 upsert record returned.  Please contact your administrator.', {
            action: action,
            variant: 'error',
         });
         return;
      }

      if (results.length === 1) {
         let hasErrors = false;

         for (let i = 0; i < results.length; i++) {
            const res = results[i];
            if (!res.isSuccess) {
               hasErrors = true;
               setErrorMessage(res.errors[0]);
               break; // Break out of the loop if there's an error
            }
         }

         if (hasErrors) {
            setShowErrors(true);
         }

         if (!hasErrors) {
            if (selectedFlowRecId.current !== results[0].recordId) {
               selectedFlowRecId.current = results[0].recordId;
            }

            // notify user of save success
            enqueueSnackbar('Changed saved!', {
               autoHideDuration: 3000,
               variant: 'success',
            })

            // reload the flow options
            const objFlowsResult = await apiClient.getObjFlows({ sObjectName: flowEventSource === 'gridView' ? selectedObject!.qualifiedApiName : selectedSubgridObject!.qualifiedApiName })

            // set objFlows
            if (flowEventSource === 'gridView') {
               setObjFlows(objFlowsResult)
            } else {
               setSubgridObjFlows(objFlowsResult)
            }

            // update selectedFlow if it exists
            if (flowEventSource === 'gridView') {
               const hasSelectedFlow = objFlowsResult.find((f: SObjectFlow) => f.name === selectedFlow?.name);
               if (hasSelectedFlow) {
                  setSelectedFlow(hasSelectedFlow)
               } else {
                  setSelectedFlow(null)
               }
            }

            if (flowEventSource === 'subGrid') {
               const hasSelectedFlow = objFlowsResult.find((f: SObjectFlow) => f.name === selectedSubgridFlow?.name);
               if (hasSelectedFlow) {
                  setSelectedSubgridFlow(hasSelectedFlow)
               } else {
                  setSelectedSubgridFlow(null)
               }
            }


            // hide error message
            setShowErrors(false);
            setErrorMessage('')
         }
      }
   }

   // form onSubmit
   const onSubmit = () => {
      const data = getValues();
      const schema = data.fields.reduce((acc, field) => {
         acc[field.name] = field.type;
         return acc;
      }, {} as Record<string, PropertyType>);

      const schemaStr = JSON.stringify(schema)
      const defaultValuesObj = createDefaultValues();
      const defaultValuesStr = JSON.stringify(defaultValuesObj)
      saveFlowConfig(schemaStr, defaultValuesStr)
   };

   // load selected flow properties
   useEffect(() => {
      if (flowEventSource === 'gridView' && !selectedFlow) {
         return;
      }

      if (flowEventSource === 'subGrid' && !selectedSubgridFlow) {
         return;
      }

      let flowProperties = '';
      if (flowEventSource === 'gridView') {
         selectedFlowRecId.current = selectedFlow?.id as string;
         flowProperties = selectedFlow?.flowProperties as string;
      } else {
         selectedFlowRecId.current = selectedSubgridFlow?.id as string;

         flowProperties = selectedSubgridFlow?.flowProperties as string;
      }

      if (flowProperties) {
         try {
            const flowObj = JSON.parse(decode(flowProperties));

            // Convert object to array format required by useFieldArray
            const formattedFields = Object.entries(flowObj).map(([name, type]) => ({
               name,
               type: type as PropertyType
            }));

            // Clear existing fields before adding new ones
            remove();  // Removes all existing fields

            // Append new fields
            append(formattedFields);  // Append the new array
         } catch (error) {
            console.error("Error parsing flow properties:", error);
         }
      }

   }, [append, flowEventSource, remove, selectedFlow, selectedSubgridFlow])

   return (
      <Box sx={{ mx: "auto" }}>
         {/* flow selector */}
         <Stack
            direction='row'
            alignItems={'center'}
            sx={{
               mb: 2
            }}>
            <Typography
               sx={{
                  color: selectedAccentColor,
                  width: 125,
                  mr: 2
               }}>
               Flow:
            </Typography>
            <Box
               display="flex"
               justifyContent="center"
               alignItems="center"
               sx={{
                  boxSizing: 'border-box', // Include borders in width calculation
                  flexShrink: 1,
                  alignItems: 'center',
               }}
            >
               <FlowPicker />
            </Box>
            <IconButton
               sx={{ color: muiColor, "&:hover": { color: "blue" } }}
               onClick={() => addFlow()}
            >
               <AddOutlinedIcon />
            </IconButton>
            <IconButton
               sx={{ color: muiColor, "&:hover": { color: "blue" } }}
               onClick={() => deleteFlow()}
            >
               <DeleteOutlinedIcon />
            </IconButton>
         </Stack>

         {/* flow name */}
         {createFlow && <Stack
            direction='row'
            alignItems={'center'}
            sx={{
               mb: 2
            }}>
            <Typography
               sx={{
                  color: selectedAccentColor,
                  width: 125,
                  mr: 2
               }}>
               Flow name:
            </Typography>
            <TextField
               variant="standard"
               value={flowName}
               onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setFlowName(event.target.value);
               }}
               sx={{
                  width: 200,
                  "& .MuiInputBase-input": { color: muiColor }, // Input text color
                  "& .MuiInputLabel-root": { color: muiColor }, // Label color
                  "& .MuiInputLabel-root.Mui-focused": { color: muiColor }, // Focused label color
                  "& .MuiInput-underline:before": { borderBottomColor: muiColor }, // Default underline color
                  "& .MuiInput-underline:hover:before": { borderBottomColor: muiColor }, // Hover underline color
                  "& .MuiInput-underline:after": { borderBottomColor: muiColor }, // Focus underline color
               }}
            />
         </Stack>}

         {/* flow properties */}
         <Typography
            sx={{
               color: selectedAccentColor,
               my: 2,
            }}>
            Flow Properties:
         </Typography>

         <form onSubmit={handleSubmit(onSubmit)}>
            {fields.map((field, index) => (
               <Box key={field.id} sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
                  <TextField
                     label="Property Name"
                     {...register(`fields.${index}.name` as const)}
                     defaultValue={field.name}
                     sx={{
                        flex: 1,
                        width: 150,
                        "& .MuiInputBase-input": { color: muiColor }, // Input text color
                        "& .MuiOutlinedInput-root": {
                           "& fieldset": { borderColor: muiColor }, // Default border color
                           "&:hover fieldset": { borderColor: muiColor }, // Hover border color
                           "&.Mui-focused fieldset": { borderColor: muiColor }, // Focus border color
                        },
                        "& .MuiInputLabel-root": { color: muiColor }, // Label color
                        "& .MuiInputLabel-root.Mui-focused": { color: muiColor }, // Focused label color
                     }}
                  />
                  <Autocomplete
                     sx={{
                        flex: 1,
                        width: 200,
                        "& .MuiInputBase-input": { color: muiColor }, // Input text color
                        "& .MuiOutlinedInput-root": {
                           "& fieldset": { borderColor: muiColor }, // Default border color
                           "&:hover fieldset": { borderColor: muiColor }, // Hover border color
                           "&.Mui-focused fieldset": { borderColor: muiColor }, // Focus border color
                        },
                        "& .MuiInputLabel-root": { color: muiColor }, // Label color
                        "& .MuiInputLabel-root.Mui-focused": { color: muiColor }, // Focused label color
                        "& .MuiIconButton-root": { color: muiColor }, // Clear button color
                        "& .MuiIconButton-root:hover": { color: "blue" }, // Hover color
                     }}
                     {...register(`fields.${index}.type` as const)}
                     defaultValue={field.type}
                     options={propertyTypes}
                     slotProps={{
                        popper: {
                           sx: {
                              zIndex: 3000,
                              // "& .MuiPaper-root": { backgroundColor: muiBackgroundColor }, // Dropdown background color
                              // "& .MuiAutocomplete-option": { color: muiColor }, // Text color
                              // "& .MuiAutocomplete-option:hover": { backgroundColor: "blue" }, // Hover color
                           },
                        },
                     }}
                     renderInput={(params) => <TextField {...params} label="Type" />} // Required prop
                  />
                  <IconButton
                     sx={{ color: muiColor, "&:hover": { color: "blue" } }}
                     onClick={() => remove(index)}><DeleteIcon /></IconButton>
               </Box>
            ))}
            {showErrors && <Box>
               <Typography
                  sx={{
                     color: selectedAccentColor,
                     my: 2,
                  }}>
                  {errorMessage}
               </Typography>
            </Box>}
            <Stack direction='row'>
               <Button variant="contained" onClick={() => setOpen(true)}>Add Property</Button>
               <Button type="submit" variant="contained" color="primary" sx={{ ml: 2 }}>Save</Button>
            </Stack>

         </form>

         {/* Dialog for adding a new property */}
         <Dialog
            open={open}
            onClose={() => setOpen(false)}
            fullWidth maxWidth="xs"
            sx={{
               zIndex: 3000
            }}>
            <DialogTitle>Add Property</DialogTitle>
            <DialogContent>
               <TextField
                  label="Property Name"
                  fullWidth
                  margin="normal"
                  value={newProperty.name}
                  onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
               />
               <Autocomplete
                  fullWidth
                  options={propertyTypes}
                  value={newProperty.type}
                  onChange={(e, value) => setNewProperty({ ...newProperty, type: value as PropertyType })}
                  slotProps={{
                     popper: {
                        sx: {
                           zIndex: 3000,  // Set this value higher than surrounding components
                        },
                     },
                  }}
                  renderInput={(params) => (
                     <TextField {...params} variant="standard" />
                  )}
               />


            </DialogContent>
            <DialogActions>
               <Button onClick={() => setOpen(false)}>Cancel</Button>
               <Button variant="contained" onClick={handleAddProperty}>Add</Button>
            </DialogActions>
         </Dialog>
      </Box>
   );
}
