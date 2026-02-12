import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Empty state for center panel when no content is selected
 */
const EmptyState: React.FC = () => {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
        p: 4,
      }}
    >
      <Typography variant="h6" color="text.secondary">
        Select a conversation
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        Choose a direct message or channel from the sidebar to start messaging
      </Typography>
    </Box>
  );
};

export default EmptyState;
