import React, { useState } from 'react';

// MUI
import { Box, Slider, Stack, Typography } from '@mui/material';
import { AgRowStyle } from '../../appInterfaces/grid/gridInterfaces';

interface OpacitySliderProps {
   styleColor: keyof AgRowStyle;
   styleProperty: keyof AgRowStyle;
   rowStyleCopy: AgRowStyle;
   updateRowStyleProperty: <K extends keyof AgRowStyle>(
      key: K,
      value: AgRowStyle[K]
   ) => void;
}

const OpacitySlider = ({ styleProperty, styleColor, rowStyleCopy, updateRowStyleProperty }: OpacitySliderProps) => {



   // local state
   const [opacity] = useState(1);

   const handleOpacityChange = (event: Event, newValue: any) => {
      updateRowStyleProperty(styleProperty, newValue)
   };

   return (
      <Stack direction='row' spacing={2} sx={{ width: 400, padding: 2 }}>
         <Typography gutterBottom>
            Opacity: {Math.round((rowStyleCopy[styleProperty] as number ?? opacity) * 100)}%
         </Typography>
         <Slider
            value={rowStyleCopy[styleProperty] as number || opacity}
            onChange={handleOpacityChange}
            min={0}
            max={1}
            step={0.01}
            valueLabelDisplay="auto"
            sx={{
               color: rowStyleCopy[styleColor] as string ?? 'gray',
            }}
         />
         <Box
            sx={{
               width: '100%',
               height: 30,
               backgroundColor: (rowStyleCopy[styleColor] as string) ?? 'gray',
               opacity: rowStyleCopy[styleProperty] as number || opacity, // Local state takes precedence over stored value
               transition: 'opacity 0.3s ease',
               borderRadius: 2,
               boxShadow: 2
            }}
         />

      </Stack>
   );
};

export { OpacitySlider }
