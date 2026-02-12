import React from "react";

// Zustand
import useStore from '../../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// mui
import { Autocomplete, Stack, TextField } from "@mui/material";

// Theme
import { useTheme } from '@mui/material/styles';

import { themeColorOptions } from '../../../zustandStore'

const GridThemeSelector = () => {
   const theme = useTheme();

   // global state
   const {
      selectedGridColorTheme,
      setSelectedGridColorTheme,
   } = useStore(useShallow((state) => ({
      selectedGridColorTheme: state.selectedGridColorTheme,
      setSelectedGridColorTheme: state.setSelectedGridColorTheme
   })));

   const handleThemeChange = (_event: any, newValue: any) => {
      if (newValue) {
         setSelectedGridColorTheme(newValue);
      }
   };

   return (
      <Stack
         direction='row'
         alignItems={'center'}
         spacing={1}
         sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
         }}
      >
         <Autocomplete
            value={selectedGridColorTheme}
            options={themeColorOptions}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            getOptionLabel={(option) => option.id}
            renderInput={(params) => (
               <TextField
                  {...params}
                  variant="standard"
                  sx={{
                     '& .MuiInputBase-input': {
                        color: theme.palette.text.primary,
                     },
                     '& .MuiInput-underline:before': {
                        borderBottomColor: theme.palette.text.primary,
                     },
                     '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottomColor: theme.palette.text.primary,
                     },
                  }} />
            )}
            onChange={handleThemeChange}
            sx={{
               width: 200,
               '& .MuiAutocomplete-popupIndicator': {
                  color: theme.palette.text.primary,
               },
               '& .MuiAutocomplete-clearIndicator': {
                  color: theme.palette.text.primary,
               },
            }}
         />
      </Stack>
   );
};

export default GridThemeSelector;
