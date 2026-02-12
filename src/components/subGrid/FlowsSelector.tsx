import React from 'react';

// Zustand
import { useShallow } from 'zustand/react/shallow';

import useStore from '../../zustandStore'

// Mui
import { Autocomplete, Box, Stack, TextField, Typography, useTheme } from "@mui/material";

// types
const SubgridFlowsSelector = () => {
  const theme = useTheme();

  // global state
  const {
    selectedSubgridFlow,
    selectedAccentColor,
    setSelectedSubgridFlow,
    subgridObjFlows,
  } = useStore(useShallow((state) => ({
    selectedSubgridFlow: state.selectedSubgridFlow,
    selectedAccentColor: state.selectedAccentColor,
    setSelectedSubgridFlow: state.setSelectedSubgridFlow,
    subgridObjFlows: state.subgridObjFlows,
  })));



  return (
    <Box>
      <Stack direction='row' alignItems={'center'} spacing={2}>
        <Typography sx={{ color: selectedAccentColor }}>Flows:</Typography>
        <Autocomplete
          id="subgridFlowsSelector"
          getOptionLabel={(option: any) => option ? option.Name : ''}
          isOptionEqualToValue={(option: any, value: any) => option.Name === value.Name}
          options={subgridObjFlows}
          value={selectedSubgridFlow}
          renderInput={(params) => (
            <TextField {...params} variant="standard" />
          )}
          onChange={(_event, value) => {
            if (value) {
              setSelectedSubgridFlow(value);
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

export default SubgridFlowsSelector;
