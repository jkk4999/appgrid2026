import React from 'react';

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// Mui
import { Autocomplete, Box, Stack, TextField } from "@mui/material";

// Theme
import { useTheme } from '@mui/material/styles';

const FlowPicker = () => {
  const theme = useTheme();

  // global state
  const {
    selectedFlow,
    selectedSubgridFlow,
    setSelectedFlow,
    setSelectedSubgridFlow,
    objFlows,
    subgridObjFlows,
    flowEventSource
  } = useStore(useShallow((state) => ({
    selectedFlow: state.selectedFlow,
    selectedSubgridFlow: state.selectedSubgridFlow,
    setSelectedFlow: state.setSelectedFlow,
    setSelectedSubgridFlow: state.setSelectedSubgridFlow,
    objFlows: state.objFlows,
    subgridObjFlows: state.subgridObjFlows,
    flowEventSource: state.flowEventSource
  })));

  return (
    <Box>
      <Stack
        direction='row'
        alignItems={'center'}
        spacing={2}
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}>
        <Autocomplete
          getOptionLabel={(option: any) => option ? option.Name : ''}
          isOptionEqualToValue={(option: any, value: any) => option.Name === value.Name}
          options={flowEventSource === 'gridView' ? objFlows : subgridObjFlows}
          value={flowEventSource === 'gridView' ? selectedFlow : selectedSubgridFlow}
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
          onChange={(_event, value) => {
            if (value) {
              console.log('setting selectedFlow to');
              console.dir(value);

              if (flowEventSource === 'gridView') {
                setSelectedFlow(value)
              } else {
                setSelectedSubgridFlow(value)
              }
            }
          }}
          sx={{
            width: 225,
            '& .MuiAutocomplete-input': {
              color: theme.palette.text.primary, // Text color
            },
            '& .MuiInput-underline:before': {
              borderBottomColor: theme.palette.text.primary, // Underline color
            },
            '& .MuiAutocomplete-popupIndicator': {
              color: theme.palette.text.primary, // Arrow icon color
            },
            '& .MuiAutocomplete-clearIndicator': {
              color: theme.palette.text.primary, // Change clear button color
            },
          }}
        />
      </Stack>
    </Box>
  );
};

export default FlowPicker;
