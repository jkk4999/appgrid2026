import React from 'react';

// Zustand
import useStore from '../../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// NEW: Domain-specific selector hooks
import { useThemeState } from '../../../hooks/selectors/useUIState';

// PubSubJS
import PubSub from "pubsub-js";


// MUI
import { alpha, Autocomplete, Stack, TextField, Typography } from "@mui/material";

// Theme
import { useTheme } from '@mui/material/styles';

// types
import { OrgObject } from '../../../sObjectMetadataTypes';


const ObjectSelector = () => {

  const theme = useTheme();

  // Theme state from domain hook
  const { selectedAccentColor } = useThemeState();

  // Remaining global state
  const {
    objectOptions,
    selectedObject,
  } = useStore(
      useShallow((state) => ({
        objectOptions: state.objectOptions,
        selectedObject: state.selectedObject,
      }))
    );

  // local state
  const disabledLabel = alpha(selectedAccentColor || '#000000', 0.8);

  return (
    <Stack
      direction='row'
      alignItems={'center'}
      spacing={2}
      sx={{
        ml: 2,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      <Typography>Object:</Typography>
      <Autocomplete<OrgObject>
        id="objectSelector"
        autoComplete={true}
        includeInputInList={true}
        getOptionLabel={(option) => option?.label || ''}
        isOptionEqualToValue={(option, value) => option?.qualifiedApiName === value?.qualifiedApiName}
        options={objectOptions || []}
        value={selectedObject || null}
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
            PubSub.publish('ObjectSelectionChanged', value)
          }
        }}
        sx={{
          width: 200,
          '& .MuiAutocomplete-popupIndicator': {
            color: theme.palette.text.primary,
          },
        }}
      />
    </Stack>
  );
};

export default ObjectSelector