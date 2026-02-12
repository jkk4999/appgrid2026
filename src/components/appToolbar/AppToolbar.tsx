// react
import React from 'react'

// Zustand
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore'

// Mui
import { Box, IconButton, Stack, Tooltip } from '@mui/material'

// Theme
import { useTheme } from '@mui/material/styles';

// Mui icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'

import PostAddOutlinedIcon from '@mui/icons-material/PostAddOutlined';

// components
import ChartSelector from './ChartSelector';
import ObjectSelector from './ObjectSelector'
import QuerySelector from './QuerySelector'
import { TimeSeriesFilterSelector } from '../appGridAuraComponent/toolbar/TimeSeriesFilterSelector'
import ViewSelector from './ViewSelector'

// PubSubJS
import PubSub from "pubsub-js";
import { emitDeleteTemplate } from '../../events/topics';

const AppToolbar = () => {
   const theme = useTheme();

   // global state
   const {
      selectedGridType,
   } = useStore(useShallow((state) => ({
      selectedGridType: state.selectedGridType,
   })));

   // local state


   return (
      <Stack
         data-name="GridToolbar"
         direction='row'
         alignItems="center"
         spacing={2}
         // className="ag-theme-quartz"
         sx={{
            marginTop: 1,
            ml: 2,
            // padding: 2,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            width: '100%',
            height: 'auto'
         }}>
         <ObjectSelector />

         {selectedGridType.name === 'gridView' &&
            <Stack
               direction='row'
               sx={{
                  alignItems: 'center',
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
               }}>
               <ViewSelector />
               {/* createTemplate */}
               <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                     backgroundColor: theme.palette.background.paper,
                     color: theme.palette.text.primary,
                  }}
               >
                  <Tooltip title="Create Template" placement="top" sx={{
                     color: theme.palette.text.primary,
                     '&:hover': {
                        color: theme.palette.text.primary, // Hover color when using a CSS variable
                     },
                  }}>
                     <IconButton
                        aria-label="CreateTemplate"
                        onClick={() => {
                           PubSub.publish('CreateTemplate');
                        }}
                     >
                        <PostAddOutlinedIcon sx={{ fontSize: 25 }} />
                     </IconButton>
                  </Tooltip>
               </Box>
               {/* deleteTemplate */}
               <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                     backgroundColor: theme.palette.background.paper,
                     color: theme.palette.text.primary,
                  }}
               >
                  <Tooltip title="Delete Template" placement="top" sx={{
                     color: theme.palette.text.primary,
                     '&:hover': {
                        color: theme.palette.text.primary, // Hover color when using a CSS variable
                     },
                  }}>
                     <IconButton
                        aria-label="DeleteTemplate"
                        onClick={() => {
                           emitDeleteTemplate();
                        }}
                     >
                        <DeleteOutlinedIcon sx={{ fontSize: 25 }} />
                     </IconButton>
                  </Tooltip>
               </Box>
            </Stack>}

         <QuerySelector />

         {/* <Filter selector and buttons /> */}
         {selectedGridType.name === 'timeSeriesView' && <TimeSeriesFilterSelector />}

         <ChartSelector />

      </Stack>

   )
}

export default AppToolbar
