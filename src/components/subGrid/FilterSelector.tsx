import React from 'react';

// Zustand
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore'

// Mui
import { Autocomplete, Box, Stack, TextField, Typography, useTheme } from "@mui/material";

// types

const FilterSelector = () => {
  const theme = useTheme();

  // global state
  const {
    selectedAccentColor,
    selectedSubgridFilter,
    setSelectedSubgridFilter,
    subgridFilterOptions,
  } = useStore(useShallow((state) => ({
    selectedAccentColor: state.selectedAccentColor,
    selectedSubgridFilter: state.selectedSubgridFilter,
    setSelectedSubgridFilter: state.setSelectedSubgridFilter,
    subgridFilterOptions: state.subgridFilterOptions,
  })));

  return (
    <Box>
      <Stack direction='row' alignItems={'center'} spacing={2}>
        <Typography sx={{ color: selectedAccentColor }}>Filter:</Typography>
        <Autocomplete
          id="filterSelector"
          getOptionLabel={(option) => option ? option.name : ''}
          isOptionEqualToValue={(option, value) => option.name === value.name}
          options={subgridFilterOptions}
          value={selectedSubgridFilter}
          renderInput={(params) => (
            <TextField {...params} variant="standard" />
          )}
          onChange={(_event, value) => {
            if (value) {
              setSelectedSubgridFilter(value);
            }
          }}
          slotProps={{
            paper: {
              sx: {
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
              }
            }
          }}
          sx={{
            width: 200,
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

export default FilterSelector;
