import React from 'react';

// Zustand
import useStore from '../../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// NEW: Domain-specific selector hooks
import { useThemeState } from '../../../hooks/selectors/useUIState';

// Mui
import { alpha, Autocomplete, Box, Stack, TextField, Typography } from "@mui/material";

// Theme
import { useTheme } from '@mui/material/styles';

// types
import { SObjectQuery } from '../../../sObjectMetadataTypes';
import { decode } from 'he';

interface QuerySelectorProps {
  onQueryChange?: (query: SObjectQuery) => void;
}

const QuerySelector: React.FC<QuerySelectorProps> = ({ onQueryChange }) => {

  const theme = useTheme();

  // Theme state from domain hook
  const { selectedAccentColor } = useThemeState();

  // Remaining global state
  const {
    selectedQuery,
    setSelectedQuery,
    setQueryRuleModified,
    queryOptions
  } = useStore(useShallow((state) => ({
    selectedQuery: state.selectedQuery,
    setSelectedQuery: state.setSelectedQuery,
    setQueryRuleModified: state.setQueryRuleModified,
    queryOptions: state.queryOptions,
  })));

  // local state
  const disabledLabel = alpha(selectedAccentColor || '#000000', 0.8);

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
        <Typography>Query:</Typography>
        <Autocomplete
          id="querySelector"
          getOptionLabel={(option: SObjectQuery) => (option?.name ? decode(option.name) : '')}
          isOptionEqualToValue={(option, value) => option?.name === value?.name}
          options={queryOptions || []}
          value={selectedQuery || null}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              sx={{
                '& .MuiInputBase-input': {
                  color: theme.palette.text.primary,
                },
                '& .MuiFormLabel-root': {
                  color: theme.palette.text.primary,
                  '&&': {
                    color: theme.palette.text.primary,
                  },
                },
                '& .MuiInputBase-input.Mui-disabled': {
                  color: '#888888',
                  WebkitTextFillColor: '#888888',
                },
                '& .MuiFormLabel-root.Mui-disabled': {
                  color: disabledLabel,
                },
              }} />
          )}
          onChange={(_event, value) => {
            if (value) {
              setSelectedQuery(value);
              // Clear any dynamic query override so selectedQuery drives runQuery
              setQueryRuleModified({});
              // Notify parent of query change so it can persist the preference
              onQueryChange?.(value);
            }
          }}
          sx={{
            width: 275,
            '& .MuiAutocomplete-popupIndicator': {
              color: theme.palette.text.primary,
            },
          }}
        />
      </Stack>
    </Box>
  );
};

export default QuerySelector;
