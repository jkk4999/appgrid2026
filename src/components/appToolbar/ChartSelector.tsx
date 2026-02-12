import React from 'react';

// Zustand
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore'

// PubSubJS
import PubSub from "pubsub-js";

// Mui
import { Autocomplete, Box, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";

// Theme
import { useTheme } from '@mui/material/styles';

// Mui icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';

const ChartSelector = () => {
   const theme = useTheme();

   // global state
   const {
      objCharts,
      selectedChart,
      showGridViewTypes,
   } = useStore(useShallow((state) => ({
      objCharts: state.objCharts,
      selectedChart: state.selectedChart,
      showGridViewTypes: state.showGridViewTypes,
   })));


   return (
      <Box
         sx={{
            display: showGridViewTypes ? 'block' : 'none'
         }}>
         <Stack
            direction='row'
            alignItems={'center'}
            spacing={1}
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}>
            <Typography>Chart:</Typography>
            <Autocomplete
               id="chartSelector"
               getOptionLabel={(option) => {
                  return typeof option.Name === 'string' ? option.Name : '';
               }}
               isOptionEqualToValue={(option, value) => option.Name === value.Name}
               options={objCharts ? objCharts : []}
               value={selectedChart}
               renderInput={(params) => (
                  <TextField
                     {...params}
                     variant="standard"
                     sx={{
                        '& .MuiInputBase-input': {
                           color: theme.palette.text.primary,
                        },
                        '& .MuiInput-underline:before': {
                           borderBottomColor: theme.palette.text.primary,
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                           borderBottomColor: theme.palette.text.primary,
                        },
                     }}
                  />
               )}
               onChange={(_event, value) => {
                  if (value) {
                     PubSub.publish('ChartSelectionChanged', value)
                  }
               }}
               sx={{
                  width: 200,
                  '& .MuiAutocomplete-popupIndicator': {
                     color: theme.palette.text.primary,
                  },
                  '& .MuiAutocomplete-clearIndicator': {
                     color: theme.palette.text.primary,
                  },
               }}
            />
            {/* deleteChart */}
            <Box
               display="flex"
               justifyContent="center"
               alignItems="center"
               sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
               }}
            >
               <Tooltip title="Delete Chart" placement="top" sx={{
                  color: theme.palette.text.primary,
                  '&:hover': {
                     color: theme.palette.text.primary, // Hover color when using a CSS variable
                  },
               }}>
                  <IconButton
                     aria-label="DeleteChart"
                     onClick={() => {
                        PubSub.publish('DeleteChart')
                     }}
                  >
                     <DeleteOutlinedIcon sx={{ fontSize: 25 }} />
                  </IconButton>
               </Tooltip>
            </Box>

            {/* select all grid data */}
            <Box
               display="flex"
               justifyContent="center"
               alignItems="center"
               sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
               }}
            >
               <Tooltip title="Select all grid data" placement="top" sx={{
                  color: theme.palette.text.primary,
                  '&:hover': {
                     color: theme.palette.text.primary, // Hover color when using a CSS variable
                  },
               }}>
                  <IconButton
                     aria-label="SelectAllGridData"
                     onClick={() => {
                        PubSub.publish('SelectAllGridData')
                     }}
                  >
                     <PlaylistAddCheckOutlinedIcon sx={{ fontSize: 25 }} />
                  </IconButton>
               </Tooltip>
            </Box>

            {/* refreshChartData */}
            <Box
               display="flex"
               justifyContent="center"
               alignItems="center"
               sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
               }}
            >
               <Tooltip title="Refresh Chart Data" placement="top" sx={{
                  color: theme.palette.text.primary,
                  '&:hover': {
                     color: theme.palette.text.primary, // Hover color when using a CSS variable
                  },
               }}>
                  <IconButton
                     aria-label="RefreshChartData"
                     onClick={() => {
                        PubSub.publish('RefreshChartData')
                     }}
                  >
                     <ReplayOutlinedIcon sx={{ fontSize: 25 }} />
                  </IconButton>
               </Tooltip>
            </Box>
         </Stack>
      </Box>
   );
};

export default ChartSelector;
