import React from 'react';

// Zustand
import useStore from '../../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// NEW: Domain-specific selector hooks
import { useThemeState } from '../../../hooks/selectors/useUIState';

// Mui
import { Autocomplete, Box, Stack, TextField, Typography } from "@mui/material";

import { useTheme } from '@mui/material';

// types
import { prettyPrint } from '../../../utilities/prettyPrint';



const TransposedColumnSelector = () => {
  const theme = useTheme();

  // Theme state from domain hook
  const { selectedAccentColor } = useThemeState();

  // Remaining global state
  const {
    selectedTransposedColumn,
    setSelectedTransposedColumn,
    transposedColumnOptions
  } = useStore(
    useShallow((state) => ({
      selectedTransposedColumn: state.selectedTransposedColumn,
      setSelectedTransposedColumn: state.setSelectedTransposedColumn,
      transposedColumnOptions: state.transposedColumnOptions
    })))

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
        <Typography sx={{ color: selectedAccentColor }}>Transpose Col:</Typography>
        <Autocomplete
          getOptionLabel={(option: any) => option ? option.label : ''}
          isOptionEqualToValue={(option: any, value: any) => option.name === value.name}
          options={transposedColumnOptions ? transposedColumnOptions : []}
          value={selectedTransposedColumn}
          renderInput={(params) => (
            <TextField {...params} variant="standard" />
          )}
          onChange={(_event, value) => {
            if (value) {
              prettyPrint('[TranposedColumnSelector] onChange', value, 'purple');
            }
            setSelectedTransposedColumn(value!);
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

export { TransposedColumnSelector };
