import React, { useMemo } from 'react';

// Zustand
import useStore from '../../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// Mui
import { Autocomplete, Box, Stack, TextField } from "@mui/material";

// Theme
import { useTheme } from '@mui/material/styles';

// Mui icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';

// PubSubJS
import PubSub from "pubsub-js";

// components
import { ActionIconButton } from '../../common/ActionIconButton';

const ChartSelector = () => {
   const theme = useTheme();

   // global state
   const {
      objCharts,
      selectedChart,
      showGridViewTypes } = useStore(
         useShallow((state) => ({
            objCharts: state.objCharts,
            selectedChart: state.selectedChart,
            showGridViewTypes: state.showGridViewTypes,
         }))
      );

   // Define a reusable style object for the tooltips to avoid repetition.
   const tooltipSx = useMemo(() => ({
      color: theme.palette.text.primary,
      '&:hover': {
         color: theme.palette.text.primary,
      },
   }), [theme.palette.text.primary]);

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
            }}
         >
            <Autocomplete
               id="chartSelector"
               getOptionLabel={(option) => option?.name || ''}
               isOptionEqualToValue={(option, value) => option?.name === value?.name}
               options={objCharts || []}
               value={selectedChart || null}
               sx={{
                  width: 200,
                  '& .MuiAutocomplete-popupIndicator': {
                     color: theme.palette.text.primary,
                  },
                  '& .MuiAutocomplete-clearIndicator': {
                     color: theme.palette.text.primary,
                  },
               }}
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
                     }} />
               )}
               onChange={(_event, value) => {
                  if (value) {
                     PubSub.publish('ChartSelectionChanged', value)
                  }
               }}
            />
            <ActionIconButton title="Delete Chart" aria-label="DeleteChart" onClick={() => PubSub.publish('DeleteChart')} sx={tooltipSx}>
               <DeleteOutlinedIcon sx={{ fontSize: 25 }} />
            </ActionIconButton>

            <ActionIconButton title="Select all grid data" aria-label="SelectAllGridData" onClick={() => PubSub.publish('SelectAllGridData')} sx={tooltipSx}>
               <PlaylistAddCheckOutlinedIcon sx={{ fontSize: 25 }} />
            </ActionIconButton>

            <ActionIconButton title="Refresh Chart Data" aria-label="RefreshChartData" onClick={() => PubSub.publish('RefreshChartData')} sx={tooltipSx}>
               <ReplayOutlinedIcon sx={{ fontSize: 25 }} />
            </ActionIconButton>
         </Stack>
      </Box>
   );
};

export default ChartSelector;
