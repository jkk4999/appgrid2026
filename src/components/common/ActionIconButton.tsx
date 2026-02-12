import React, { ReactNode } from 'react';
import { Box, IconButton, Tooltip, SxProps, Theme } from '@mui/material';

type ActionIconButtonProps = {
   title: string;
   'aria-label': string;
   onClick: () => void;
   sx?: SxProps<Theme>;
   display?: 'inline' | 'flex' | 'block' | 'none';
   children: ReactNode;
};

// A small, reusable wrapper component to reduce boilerplate for action buttons.
export const ActionIconButton = ({ title, 'aria-label': ariaLabel, onClick, sx = {}, children, display = 'inline' }: ActionIconButtonProps) => (
   <Box
      display={display}
      justifyContent="center"
      alignItems="center"
      sx={{
         alignItems: 'center',
         boxSizing: 'border-box',
         flexShrink: 1,
         ...sx,
      }}
   >
      <Tooltip title={title} placement="top" sx={sx}>
         <IconButton aria-label={ariaLabel} onClick={onClick}>
            {children}
         </IconButton>
      </Tooltip>
   </Box>
);