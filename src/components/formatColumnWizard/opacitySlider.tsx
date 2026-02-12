import React, { useState } from 'react';

// MUI
import { Box, Slider, Stack, Typography } from '@mui/material';

import { AgColumnStyle } from '../../appInterfaces/grid/gridInterfaces';

interface OpacitySliderProps {
   styleColor: keyof AgColumnStyle;
   styleProperty: keyof AgColumnStyle;
   columnStyleCopy: AgColumnStyle;
   updateColumnStyleProperty: <K extends keyof AgColumnStyle>(
      key: K,
      value: AgColumnStyle[K]
   ) => void;
}

const OpacitySlider = ({ styleProperty, styleColor, columnStyleCopy, updateColumnStyleProperty }: OpacitySliderProps) => {

   // local state - default opacity value for display fallback
   const [opacity] = useState(1);

   const handleOpacityChange = (event: Event, newValue: any) => {
      updateColumnStyleProperty(styleProperty, newValue)
   };

   return (
      <Stack direction='row' spacing={2} sx={{ width: 400, padding: 2 }}>
         <Typography gutterBottom>
            Opacity: {Math.round((columnStyleCopy[styleProperty] as number ?? opacity) * 100)}%
         </Typography>
         <Slider
            value={columnStyleCopy[styleProperty] as number || opacity}
            onChange={handleOpacityChange}
            min={0}
            max={1}
            step={0.01}
            valueLabelDisplay="auto"
            sx={{
               color: columnStyleCopy[styleColor] as string ?? 'gray',
            }}
         />
         <Box
            sx={{
               width: '100%',
               height: 30,
               backgroundColor: (columnStyleCopy[styleColor] as string) ?? 'gray',
               opacity: columnStyleCopy[styleProperty] as number || opacity, // Local state takes precedence over stored value
               transition: 'opacity 0.3s ease',
               borderRadius: 2,
               boxShadow: 2
            }}
         />

      </Stack>
   );
};

export { OpacitySlider }
