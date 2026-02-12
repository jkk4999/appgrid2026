import React from 'react';

// Zustand
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore'

// PubSubJS
import PubSub from "pubsub-js";


// MUI
import { Autocomplete, Stack, TextField, Typography } from "@mui/material";


const ObjectSelector = () => {

  // global state
  const {
    muiBackgroundColor,
    muiColor,
    objectOptions,
    selectedAccentColor,
    selectedObject
  } = useStore(useShallow((state) => ({
    muiBackgroundColor: state.muiBackgroundColor,
    muiColor: state.muiColor,
    objectOptions: state.objectOptions,
    selectedAccentColor: state.selectedAccentColor,
    selectedObject: state.selectedObject
  })));


  // local state

  return (
    <Stack
      direction='row'
      alignItems={'center'}
      spacing={2}
      sx={{
        backgroundColor: muiBackgroundColor,
        color: muiColor
      }}>
      <Typography sx={{
        color: selectedAccentColor,
      }}>Object:</Typography>
      <Autocomplete
        id="objectSelector"
        autoComplete
        includeInputInList
        getOptionLabel={(option: any) => (option ? option.label : '')}
        isOptionEqualToValue={(option, value) => option.qualifiedApiName === value.qualifiedApiName}
        options={objectOptions}
        renderInput={(params) => <TextField {...params} variant="standard" />}
        value={selectedObject}
        onChange={async (_event, value: any) => {
          if (value) {
            PubSub.publish('ObjectSelectionChanged', value)
          }
        }}
        sx={{
          width: 175,
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
  );
};

export default ObjectSelector