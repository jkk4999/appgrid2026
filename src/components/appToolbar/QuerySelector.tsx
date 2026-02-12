import React from 'react';

// Zustand
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore'

// Mui
import { Autocomplete, Box, Stack, TextField, Typography } from "@mui/material";

// Theme
import { useTheme } from '@mui/material/styles';

// types
import { SObjectQuery } from '../../sObjectMetadataTypes';
import { decode } from 'he';

const QuerySelector = () => {

  const theme = useTheme();

  // global state
  const {
    selectedAccentColor,
    selectedQuery,
    setSelectedQuery,
    setQueryRuleModified,
    queryOptions
  } = useStore(useShallow((state) => ({
    selectedAccentColor: state.selectedAccentColor,
    selectedQuery: state.selectedQuery,
    setSelectedQuery: state.setSelectedQuery,
    setQueryRuleModified: state.setQueryRuleModified,
    queryOptions: state.queryOptions
  })));



  return (
    <Box>
      <Stack direction='row' alignItems={'center'} spacing={2}>
        <Typography sx={{ color: selectedAccentColor }}>Query:</Typography>
        <Autocomplete
          id="querySelector"
          getOptionLabel={(option: SObjectQuery) => option ? decode(option.name) : ''}
          isOptionEqualToValue={(option: SObjectQuery, value: SObjectQuery) => option.name === value.name}
          options={queryOptions}
          value={selectedQuery}
          renderInput={(params) => (
            <TextField {...params} variant="standard" />
          )}
          onChange={(_event, value) => {
            if (value) {
              setSelectedQuery(value);
              setQueryRuleModified({});
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

export default QuerySelector;
