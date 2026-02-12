import React, { useCallback } from 'react';

// Zustand
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore'

// notifications
import { useSnackbar } from 'notistack';
import type { SnackbarKey } from 'notistack';

// Mui
import { Autocomplete, Box, Stack, TextField, Typography } from "@mui/material";

// Theme
import { useTheme } from '@mui/material/styles';

const GridTypeSelector = () => {
  const theme = useTheme();

  // notifications
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // add action to an individual snackbar
  const action = useCallback(
    (snackbarId: SnackbarKey | undefined) => (
      <>
        <button
          onClick={() => {
            closeSnackbar(snackbarId);
          }}
        >
          Dismiss
        </button>
      </>
    ),
    [closeSnackbar]
  );

  // global state
  const {
    gridViewTypes,
    selectedGridType,
    setFilterOptions,
    setInitialDataLoaded,
    setObjViewsRetrieved,
    setQueryOptions,
    setSelectedGridType,
    setViewOptions
  } = useStore(useShallow((state) => ({
    gridViewTypes: state.gridViewTypes,
    selectedGridType: state.selectedGridType,
    setFilterOptions: state.setFilterOptions,
    setInitialDataLoaded: state.setInitialDataLoaded,
    setObjViewsRetrieved: state.setObjViewsRetrieved,
    setQueryOptions: state.setQueryOptions,
    setSelectedGridType: state.setSelectedGridType,
    setViewOptions: state.setViewOptions
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
        <Typography>Grid Type:</Typography>
        <Autocomplete
          id="gridTypeSelector"
          getOptionLabel={(option) => option ? option.label : ''}
          isOptionEqualToValue={(option, value) => option.name === value.name}
          options={gridViewTypes}
          value={selectedGridType}
          renderInput={(params) => (
            <TextField {...params} variant="standard" />
          )}
          onChange={(_event, value) => {
            console.log('>>> gridTypeChanged value is');
            console.dir(value);

            if (value && selectedGridType.name === 'ganttView') {
              enqueueSnackbar(
                'Please select a project first!',
                {
                  action: action,
                  variant: 'info'
                }
              );
              return;
            }

            if (value) {
              setViewOptions([])
              setObjViewsRetrieved(false);
              setInitialDataLoaded(false);
              setFilterOptions([])
              setQueryOptions([])
              setSelectedGridType(value);
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

export default GridTypeSelector;
