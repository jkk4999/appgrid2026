import React, { useState, useEffect } from 'react';

// Zustand
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore'

// Mui
import { Autocomplete, Box, Paper, Popper, Stack, TextField, Typography } from "@mui/material";

// types
import { GridViewType } from '../../appInterfaces/grid/gridInterfaces';

const ViewSelector = (props: any) => {

  // global state
  const {
    muiBackgroundColor,
    muiColor,
    showQueryPanel,
    selectedView,
    selectedAccentColor,
    setSelectedView,
    viewOptions,
    setTreeGridPreferences,
    setTreeGridState
  } = useStore(useShallow((state) => ({
    muiBackgroundColor: state.muiBackgroundColor,
    muiColor: state.muiColor,
    showQueryPanel: state.showQueryPanel,
    selectedView: state.selectedView,
    selectedAccentColor: state.selectedAccentColor,
    setSelectedView: state.setSelectedView,
    viewOptions: state.viewOptions,
    setTreeGridPreferences: state.setTreeGridPreferences,
    setTreeGridState: state.setTreeGridState
  })));



  return (
    <Box>
      <Stack direction='row' alignItems={'center'} spacing={2}>
        <Typography sx={{ color: selectedAccentColor }}>View:</Typography>
        <Autocomplete
          id="viewSelector"
          getOptionLabel={(option: any) => option ? option.Name : ''}
          isOptionEqualToValue={(option: any, value: any) => option.Name === value.Name}
          options={viewOptions ? viewOptions : []}
          value={selectedView}
          renderInput={(params) => (
            <TextField {...params} variant="standard" />
          )}
          onChange={(_event, value) => {
            if (value) {
              setSelectedView(value);
              setTreeGridPreferences(null);
              setTreeGridState(null);
            }
          }}
          sx={{
            width: 225,
            '& .MuiAutocomplete-input': {
              color: muiColor, // Text color
            },
            '& .MuiInput-underline:before': {
              borderBottomColor: muiColor, // Underline color
            },
            '& .MuiAutocomplete-popupIndicator': {
              color: muiColor, // Arrow icon color
            },
            '& .MuiAutocomplete-clearIndicator': {
              color: muiColor, // Change clear button color
            },
          }}
        />
      </Stack>
    </Box>
  );
};

export default ViewSelector;
