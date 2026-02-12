import React from 'react'

// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// MUI
import { Box, IconButton, Stack } from '@mui/material';

// MUI icons

import CircleIcon from '@mui/icons-material/Circle';

const colorOptions = [
   "#07c",
   "#fb923c",
   "#a3e635",
   "#22d3ee",
   "#fb7185",
   "#6366f1",
];

export function AppGridColorPicker() {

   // global state
   const setSelectedAccentColor = useStore(useShallow((state) => state.setSelectedAccentColor));

   const handleClick = (color: string) => {
      setSelectedAccentColor(color);
   };

   return (
      <Box borderRadius={16} overflow="hidden" sx={{
         backgroundColor: "#1f2836"
      }}>
         <Stack direction={'row'} sx={{
         }}>
            {
               colorOptions.map((item: string, index: number) => {
                  return (
                     <IconButton
                        key={item}
                        onClick={() => handleClick(item)}
                     >
                        <CircleIcon sx={{ fontSize: 20, color: colorOptions[index] }} />
                     </IconButton>
                  )
               })
            }
         </Stack>
      </Box>
   )
}
