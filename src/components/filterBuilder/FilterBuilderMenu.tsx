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

import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';

import SaveIcon from '@mui/icons-material/CheckOutlined'

import SaveAsOutlinedIcon from '@mui/icons-material/SaveAsOutlined';

// hide/show menu icons based on permissions
const FilterBuilderMenu = () => {

   const theme = useTheme();

   // Remaining global state
   const { selectedTimeSeriesFilter } = useStore(useShallow((state) => ({
      gridPermissions: state.gridPermissions,
      userInfo: state.userInfo,
      selectedTimeSeriesFilter: state.selectedTimeSeriesFilter
   })))

   // local state

   return (
      <Stack direction='row' spacing={1} alignItems="flex-start" >
         {/* run filter */}
         <Button
            variant="text"
            startIcon={<DirectionsRunOutlinedIcon />}
            sx={{
               color: theme.palette.text.primary,
               '&:hover': {
                  color: theme.palette.text.primary, // Hover color when using a CSS variable
               },
            }}
            onClick={() => {
               PubSub.publish('FilterBulderRunFilter')
            }}
         >
            Run Filter
         </Button>
         {/* save */}
         {selectedTimeSeriesFilter && (<Button variant="text"
            startIcon={<SaveIcon />}
            sx={{
               color: theme.palette.text.primary,
               '&:hover': {
                  color: theme.palette.text.primary, // Hover color when using a CSS variable
               },
            }}
            onClick={() => {
               PubSub.publish('FilterBuilderSave')
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
               PubSub.publish('FilterBuilderSaveAs')
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
               PubSub.publish('DeleteTimeSeriesFilter')
            }}>
            Delete
         </Button>
      </Stack >
   )
}

export { FilterBuilderMenu }