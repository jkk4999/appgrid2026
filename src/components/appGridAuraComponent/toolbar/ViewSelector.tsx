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
import { SObjectView } from '../../../sObjectMetadataTypes';

interface ViewSelectorProps {
  onViewChange?: (view: SObjectView) => void;
}

const ViewSelector: React.FC<ViewSelectorProps> = ({ onViewChange }) => {

  const theme = useTheme();

  // Theme state from domain hook
  const { selectedAccentColor } = useThemeState();

  // Remaining global state
  const {
    selectedView,
    setSelectedView,
    viewOptions,
    setTreeGridPreferences,
    setTreeGridState,
  } = useStore(useShallow((state) => ({
    selectedView: state.selectedView,
    setSelectedView: state.setSelectedView,
    viewOptions: state.viewOptions,
    setTreeGridPreferences: state.setTreeGridPreferences,
    setTreeGridState: state.setTreeGridState,
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
        <Typography>
          View:
        </Typography>
        <Autocomplete<SObjectView>
          id="viewSelector"
          getOptionLabel={(option) => option?.name || ''}
          isOptionEqualToValue={(option, value) => option?.name === value?.name}
          options={viewOptions || []}
          value={selectedView || null}
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
              setSelectedView(value);
              setTreeGridPreferences(null);
              setTreeGridState(null);
              // Notify parent of view change so it can persist the preference
              onViewChange?.(value);
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

export default ViewSelector;
