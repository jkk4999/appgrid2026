/*
   this component allows a user to select a pre-defined flow to execute
   it presents a from with the flow properties which the user enters
   the desired values
*/


import React, { useCallback, useEffect, useRef, useState } from "react";

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// react-hook-form
import { useForm, useFieldArray } from "react-hook-form";

// flows selector
import FlowPicker from "./flowPicker";

// PubSubJS
import PubSub from "pubsub-js";

// notifications
import { useSnackbar } from 'notistack'
import type { SnackbarKey } from 'notistack'

// MUI
import { Button, TextField, Box, Typography, Stack } from "@mui/material";

// Theme
import { useTheme } from '@mui/material/styles';

// MUI icons
import { decode } from "he";
import { SObjectFlow } from "../../sObjectMetadataTypes";
import { APIClient, UpsertServiceParams } from "../../brideDesignPattern/apiInterface";

// Define a type for the fields
type PropertyType = "string" | "integer" | "decimal" | "boolean";

interface PropertyField {
   name: string;
   value: any;
}

// Define the form schema
interface FormSchema {
   fields: PropertyField[];
}

export default function FlowSelector(props: any) {
   const theme = useTheme();

   const apiClient: APIClient = props.apiClient;

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
      objFlows,
      subgridObjFlows,
      flowEventSource,
      selectedAccentColor,
      selectedFlow,
      selectedSubgridFlow,
      setObjFlows,
      setSubgridObjFlows,
      setSelectedFlow,
      setSelectedSubgridFlow,
      selectedObject,
      selectedSubgridObject
   } = useStore(useShallow((state) => ({
      objFlows: state.objFlows,
      subgridObjFlows: state.subgridObjFlows,
      flowEventSource: state.flowEventSource,
      selectedAccentColor: state.selectedAccentColor,
      selectedFlow: state.selectedFlow,
      selectedSubgridFlow: state.selectedSubgridFlow,
      setObjFlows: state.setObjFlows,
      setSubgridObjFlows: state.setSubgridObjFlows,
      setSelectedFlow: state.setSelectedFlow,
      setSelectedSubgridFlow: state.setSelectedSubgridFlow,
      selectedObject: state.selectedObject,
      selectedSubgridObject: state.selectedSubgridObject
   })));


   // local state
   const [createFlow] = useState<boolean>(false)

   const [flowName] = useState<string>('')

   const selectedFlowRecId = useRef<string>('');

   const [showErrors, setShowErrors] = useState(false);

   const [, setErrorMessage] = useState<string>('');

   console.log('flowSelector props are');

   console.dir({
      flowEventSource: flowEventSource,
      objFlows: objFlows,
      subgridObjFlows: subgridObjFlows,
      selectedObject: selectedObject,
      selectedSubgridObject: selectedSubgridObject
   })

   const { control, register, handleSubmit, getValues } = useForm<FormSchema>({
      defaultValues: { fields: [] }
   });

   const { fields, append, remove, update } = useFieldArray({
      control,
      name: "fields"
   });

   // functions
   const hasSelectedFlowRec = useCallback((idString: string) => {
      return (idString ?? '').trim() !== '';
   }, []);

   const saveFlowConfig = async (flowValues: string) => {
      const upsertRec: SObjectFlow = {
         name: createFlow ? flowName : flowEventSource === 'gridView' ? selectedFlow!.name : selectedSubgridFlow?.name,
         flowParameters: flowValues,
         sObjectApiName: flowEventSource === 'gridView' ? selectedObject!.qualifiedApiName : selectedSubgridObject!.qualifiedApiName,
         isActive: true,
      }

      if (hasSelectedFlowRec(selectedFlowRecId.current)) {
         // console.log(`GridPanel saveObjectPreferences - adding Id `);
         upsertRec['id'] = selectedFlowRecId.current as string;
      }

      const upsertRecs = [];
      upsertRecs.push(upsertRec);

      console.log('FlowSelector - upsertRecs are ');
      console.dir(upsertRecs);

      // Stringify the records
      const param: UpsertServiceParams = {
         sObjectName: 'AppGridAg__AG_Flow__c',
         jsonRecs: JSON.stringify(upsertRecs),
      };

      const result = await apiClient.upsertRecs(param);

      console.log('FlowSelector - api response is');
      console.dir(result);

      if (result.status !== 'success') {
         console.log('FlowSelector - upsert failed.')
         enqueueSnackbar(result.errorMessage || 'FlowSelector Error - upsert failed.', {
            action: action,
            variant: 'error',
         });
         return;
      }

      if (result.results.length > 1) {
         console.log('FlowSelector - more than 1 upsert record returned.')
         enqueueSnackbar('FlowSelector Error - more than 1 upsert record returned.  Please contact your administrator.', {
            action: action,
            variant: 'error',
         });
         return;
      }

      if (result.results.length === 1) {
         let hasErrors = false;

         for (let i = 0; i < result.results.length; i++) {
            const res = result.results[i];
            if (!res.isSuccess) {
               hasErrors = true;
               setErrorMessage(res.errorMessages?.[0] || res.errors?.[0]);
               break; // Break out of the loop if there's an error
            }
         }

         if (hasErrors) {
            setShowErrors(true);
         }

         if (!hasErrors) {
            if (selectedFlowRecId.current !== result.results[0].recordId) {
               selectedFlowRecId.current = result.results[0].recordId;
            }

            // notify user of save success
            enqueueSnackbar('Changed saved!', {
               autoHideDuration: 3000,
               variant: 'success',
            })

            const paramObj = {
               sObjectName: flowEventSource === 'gridView' ? selectedObject!.qualifiedApiName : selectedSubgridObject!.qualifiedApiName
            }

            // reload the flow options
            const [
               objFlowsResult,
            ] = await Promise.all([
               apiClient.getObjFlows(paramObj)
            ]);

            // set objFlows
            if (flowEventSource === 'gridView') {
               setObjFlows(objFlowsResult)
            } else {
               setSubgridObjFlows(objFlowsResult)
            }


            // update selectedFlow if it exists
            if (flowEventSource === 'gridView' && selectedFlow) {
               const hasSelectedFlow = objFlowsResult.find((f: SObjectFlow) => f.id === selectedFlow?.id);

               if (hasSelectedFlow) {
                  setSelectedFlow(hasSelectedFlow)
               } else {
                  setSelectedFlow(null)
               }
            }

            if (flowEventSource === 'subGrid' && selectedSubgridFlow) {
               const hasSelectedFlow = objFlowsResult.find((f: SObjectFlow) => f.id === selectedSubgridFlow?.id);

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

   const executeFlow = async () => {
      console.log('calling RunFlow - selectedFlow is');

      if (flowEventSource === 'gridView') {
         PubSub.publish('RunFlow', selectedFlow);
      } else {
         PubSub.publish('RunSubgridFlow', selectedSubgridFlow);
      }
   }

   // form onSubmit
   const onSubmit = () => {
      const data = getValues();

      const formValuesObj = data.fields.reduce((acc, field) => {
         acc[field.name] = field.value;
         return acc;
      }, {} as Record<string, PropertyType>);

      const formValuesStr = JSON.stringify(formValuesObj)
      saveFlowConfig(formValuesStr)
   };

   // load selected flow properties and values
   useEffect(() => {
      if (flowEventSource === 'gridView' && !selectedFlow) {
         return;
      }

      if (flowEventSource === 'subGrid' && !selectedSubgridFlow) {
         return;
      }

      selectedFlowRecId.current = flowEventSource === 'gridView' ? selectedFlow?.id as string : selectedSubgridFlow?.id as string;

      // load selected flow
      const flowParameters = flowEventSource === 'gridView' ? selectedFlow?.flowParameters : selectedSubgridFlow?.flowParameters;

      if (flowParameters) {
         try {
            const flowObj = JSON.parse(decode(flowParameters));

            console.log('flowSelector - flowParameters are', flowObj);

            // Convert object to array format required by useFieldArray
            const formattedFields = Object.entries(flowObj).map(([name, value]) => ({
               name,
               value
            }));

            console.log('flowSelector - formattedFields are', formattedFields);

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
      <Box
         sx={{
            mx: "auto"
         }}>
         {/* flow selector */}
         <Stack
            direction='row'
            alignItems={'center'}
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
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
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  boxSizing: 'border-box', // Include borders in width calculation
                  flexShrink: 1,
                  alignItems: 'center',
               }}
            >
               <FlowPicker />
            </Box>
         </Stack>

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
               <Box key={index} sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
                  <TextField
                     label="Property Name"
                     {...register(`fields.${index}.name` as const)}
                     defaultValue={field.name}
                     sx={{
                        flex: 1,
                        width: 150,
                        "& .MuiInputBase-input": { color: theme.palette.text.primary }, // Input text color
                        "& .MuiOutlinedInput-root": {
                           "& fieldset": { borderColor: theme.palette.text.primary }, // Default border color
                           "&:hover fieldset": { borderColor: theme.palette.text.primary }, // Hover border color
                           "&.Mui-focused fieldset": { borderColor: theme.palette.text.primary }, // Focus border color
                        },
                        "& .MuiInputLabel-root": { color: theme.palette.text.primary }, // Label color
                        "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.text.primary }, // Focused label color
                     }}
                  />
                  <TextField
                     placeholder="Enter value" // Placeholder instead of label
                     {...register(`fields.${index}.value` as const)}
                     value={field.value || ''}  // Fully control the value
                     onChange={(e) => update(index, { ...field, value: e.target.value })}
                     sx={{
                        flex: 1,
                        width: 150,
                        "& .MuiInputBase-input": { color: theme.palette.text.primary }, // Input text color
                        "& .MuiOutlinedInput-root": {
                           "& fieldset": { borderColor: theme.palette.text.primary }, // Default border color
                           "&:hover fieldset": { borderColor: theme.palette.text.primary }, // Hover border color
                           "&.Mui-focused fieldset": { borderColor: theme.palette.text.primary }, // Focus border color
                        },
                        "& .MuiInputLabel-root": { color: theme.palette.text.primary }, // Label color
                        "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.text.primary }, // Focused label color
                     }}
                  />
               </Box>
            ))}
            {showErrors && <Box>
               <Typography
                  sx={{
                     color: selectedAccentColor,
                     my: 2,
                  }}>
                  errorMessage
               </Typography>
            </Box>}
            <Stack direction='row'>
               <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ ml: 2 }}>
                  Save
               </Button>
               <Button
                  variant="contained"
                  color="primary"
                  sx={{ ml: 2 }}
                  onClick={() => executeFlow()}>
                  Execute
               </Button>
            </Stack>
         </form>
      </Box>
   );
}
