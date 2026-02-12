import React from "react";

// Zustand
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore'

// mui
import { Autocomplete, Stack, TextField, Typography } from "@mui/material";


const GridThemeSelector = () => {

   // global state
   const {
      selectedTheme,
      setSelectedTheme,
      setMuiColor,
      setMuiBackgroundColor
   } = useStore(useShallow((state) => ({
      selectedTheme: state.selectedTheme,
      setSelectedTheme: state.setSelectedTheme,
      setMuiColor: state.setMuiColor,
      setMuiBackgroundColor: state.setMuiBackgroundColor
   })));

   const agGridThemes = [
      { label: "Dark Blue", value: 'darkBlue' },
      { label: "Light", value: 'light' },
   ];

   const handleThemeChange = (event: any, newValue: any) => {
      if (newValue) {
         console.log('changing theme to');
         console.dir(newValue)
         setSelectedTheme(newValue);

         // adjust muiColor based on selected theme
         if (newValue.value === 'darkBlue') {
            setMuiColor('#FFFFFF');
            setMuiBackgroundColor('#1D2634')
         } else {
            setMuiColor('#000000')
            setMuiBackgroundColor('#FFFFFF')
         }
      }
   };

   return (
      <Stack
         direction='row'
         alignItems={'center'}
         spacing={2}
         sx={{
            // backgroundColor: muiBackgroundColor,
            color: '#FFFFFF'
         }}>
         <Typography sx={{
            color: '#FFFFFF',
         }}>Theme:</Typography>
         {/* Theme Selector */}
         <Autocomplete
            value={selectedTheme}
            options={agGridThemes}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => <TextField {...params} variant="standard" />}
            onChange={handleThemeChange}
            sx={{
               width: 140,
               marginBottom: 2,
               marginRight: 2,
               '& .MuiAutocomplete-input': {
                  color: '#FFFFFF', // Text color
               },
               '& .MuiInput-underline:before': {
                  borderBottomColor: '#FFFFFF', // Underline color
               },
               '& .MuiAutocomplete-popupIndicator': {
                  color: '#FFFFFF', // Arrow icon color
               },
               '& .MuiAutocomplete-clearIndicator': {
                  color: '#FFFFFF', // Change clear button color
               },
            }}
         />
      </Stack>
   );
};

export default GridThemeSelector;
