// react
import React, { useState, useEffect, useCallback } from 'react';

// Zustand
import useStore from '../../zustandStore'

// notifications
import { useSnackbar } from 'notistack';
import type { SnackbarKey } from 'notistack'



// PubSubJS
import PubSub from "pubsub-js";

// MUI
import { Button, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// MUI icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import SaveIcon from '@mui/icons-material/CheckOutlined'
import SaveAsOutlinedIcon from '@mui/icons-material/SaveAsOutlined';
import { SObjectPermission } from '../../sObjectMetadataTypes';
import { useShallow } from 'zustand/react/shallow';

interface QueryBuilderMenuProps {
   isRuleValid: boolean; // Prop to control button state
   objPermissionsMap: React.RefObject<Map<string, SObjectPermission>>
}



// hide/show menu icons based on permissions
const QueryBuilderMenu: React.FC<QueryBuilderMenuProps> = ({ objPermissionsMap }) => {

   const theme = useTheme();

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

   // GLOBAL STATE
   const {
      isRuleValid,
      selectedQuery,
   } = useStore(useShallow((state) => ({
      isRuleValid: state.isRuleValid,
      selectedQuery: state.selectedQuery,
   })))

   // local state
   const [enableQuerySave, setEnableQuerySave] = useState(false)
   const [enableQuerySaveAs, setEnableQuerySaveAs] = useState(false)
   const [enableQueryDelete, setEnableQueryDelete] = useState(false)

   console.log('queryBuilderMenu props are');
   console.dir({
      isRuleValid: isRuleValid
   })


   // update menu permissions
   useEffect(() => {
      try {
         const queryPerms = objPermissionsMap.current.get('AppGridAg__AG_Query__c');
         if (!queryPerms) {
            throw new Error('Unexpected error - did not find AppGridAg__AG_Query__c permission');
         }
         console.log('QueryBuilderMenu - queryPerms are');
         console.dir(queryPerms);

         // delete permission
         if (queryPerms.permissionsDelete) {
            setEnableQueryDelete(true)
         } else {
            setEnableQueryDelete(false)
         }
         // save permission
         if (queryPerms.permissionsCreate) {
            setEnableQuerySave(true)
            setEnableQuerySaveAs(true)
         } else {
            setEnableQuerySave(false)
            setEnableQuerySaveAs(false)
         }
      } catch (error: any) {
         enqueueSnackbar(error.message, { action: action, variant: 'error' })
      }

   }, [action, enqueueSnackbar, objPermissionsMap])

   return (
      <Stack direction='row' spacing={1} alignItems="flex-start" >
         {/* run query */}
         <Button
            variant="text"
            startIcon={<DirectionsRunOutlinedIcon />}
            disabled={!isRuleValid}
            sx={{
               color: theme.palette.text.primary,
               '&:hover': {
                  color: theme.palette.text.primary, // Hover color when using a CSS variable
               },
               '&.Mui-disabled': {
                  color: 'gray', // Disabled color
               },
            }}
            onClick={() => {
               console.log('publishing RunQuery event')
               PubSub.publish('RunQueryBuilderQuery')
            }}
         >
            Run Query
         </Button>
         {/* save */}
         {selectedQuery && (<Button variant="text"
            startIcon={<SaveIcon />}
            disabled={!isRuleValid || !enableQuerySave}
            sx={{
               color: theme.palette.text.primary,
               '&:hover': {
                  color: theme.palette.text.primary, // Hover color when using a CSS variable
               },
               '&.Mui-disabled': {
                  color: 'gray', // Disabled color
               },
            }}
            onClick={() => {
               PubSub.publish('SaveQuery')
            }}>
            Save
         </Button>)}
         {/* save as */}
         <Button variant="text"
            startIcon={<SaveAsOutlinedIcon />}
            disabled={!isRuleValid || !enableQuerySaveAs}
            sx={{
               color: theme.palette.text.primary,
               '&:hover': {
                  color: theme.palette.text.primary, // Hover color when using a CSS variable
               },
               '&.Mui-disabled': {
                  color: 'gray', // Disabled color
               },
            }}
            onClick={() => {
               PubSub.publish('SaveAsQuery')
            }}>
            SaveAs
         </Button>
         {/* delete */}
         <Button variant="text"
            startIcon={<DeleteOutlinedIcon />}
            disabled={!isRuleValid || !enableQueryDelete}
            sx={{
               color: theme.palette.text.primary,
               '&:hover': {
                  color: theme.palette.text.primary, // Hover color when using a CSS variable
               },
               '&.Mui-disabled': {
                  color: 'gray', // Disabled color
               },
            }}
            onClick={() => {
               PubSub.publish('DeleteQuery')
            }}>
            Delete
         </Button>
         {/* add subQuery */}
         {/* <Button variant="text"
            startIcon={<PlaylistAddCircleOutlinedIcon />}
            sx={{
               color: adaptableTextColor,
               '&:hover': {
                  color: adaptableButtonVariantColorDefault, // Hover color when using a CSS variable
               },
            }}>
            Add Subquery
         </Button> */}
      </Stack >
   )
}

export default QueryBuilderMenu