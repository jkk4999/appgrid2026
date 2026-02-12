// react
import React from 'react';

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// PubSubJS
import PubSub from "pubsub-js";

// MUI
import { Button, Stack } from '@mui/material';

import { useTheme } from '@mui/material/styles';

// MUI icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'

import SaveIcon from '@mui/icons-material/CheckOutlined'

import SaveAsOutlinedIcon from '@mui/icons-material/SaveAsOutlined';

// hide/show menu icons based on permissions
const ExpressionBuilderMenu = () => {
   const theme = useTheme();

   // Remaining global state
   const {
      selectedQuery,
   } = useStore(useShallow((state) => ({
      selectedQuery: state.selectedQuery
   })))

   // local state


   return (
      <Stack direction='row' spacing={1} alignItems="flex-start" >

         {/* save */}
         {selectedQuery && (<Button variant="text"
            startIcon={<SaveIcon />}
            sx={{
               color: theme.palette.text.primary,
               '&:hover': {
                  color: theme.palette.text.primary, // Hover color when using a CSS variable
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
            sx={{
               color: theme.palette.text.primary,
               '&:hover': {
                  color: theme.palette.text.primary, // Hover color when using a CSS variable
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
            sx={{
               color: theme.palette.text.primary,
               '&:hover': {
                  color: theme.palette.text.primary, // Hover color when using a CSS variable
               },
            }}
            onClick={() => {
               PubSub.publish('DeleteQuery')
            }}>
            Delete
         </Button>
      </Stack >
   )
}

export { ExpressionBuilderMenu }