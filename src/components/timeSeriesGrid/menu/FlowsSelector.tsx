import React from 'react';

// Zustand
import useStore from '../../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// NEW: Domain-specific selector hooks
import { useThemeState } from '../../../hooks/selectors/useUIState';

// Mui
import { Autocomplete, Box, Stack, TextField, Typography } from "@mui/material";

import { useTheme } from '@mui/material';

const FlowsSelector = () => {

  const theme = useTheme();

  // Theme state from domain hook
  const { selectedAccentColor } = useThemeState();

  // Remaining global state
  const {
    selectedFlow,
    setSelectedFlow, flowOptions } = useStore(
      useShallow((state) => ({
        showQueryPanel: state.showQueryPanel,
        selectedFlow: state.selectedFlow,
        setSelectedFlow: state.setSelectedFlow,
        flowOptions: state.objFlows,
      }))
    );



  return (
    <Box>
      <Stack direction='row' alignItems={'center'} spacing={2}
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}>
        <Typography sx={{ color: selectedAccentColor }}>Flows:</Typography>
        <Autocomplete
          id="subgridFlowsSelector"
          getOptionLabel={(option: any) => option ? option.Name : ''}
          isOptionEqualToValue={(option: any, value: any) => option.Name === value.Name}
          options={flowOptions}
          value={selectedFlow}
          renderInput={(params) => (
            <TextField {...params} variant="standard" />
          )}
          onChange={(_event, value) => {
            if (value) {
              setSelectedFlow(value);
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

export default FlowsSelector;
