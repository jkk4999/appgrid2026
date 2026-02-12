import React from 'react';
import { Box, Typography } from '@mui/material';
import { BaseViewProps } from '../types';

/**
 * Left panel view for Drafts & Sent
 */
const DraftsView: React.FC<BaseViewProps> = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">
        No drafts
      </Typography>
    </Box>
  );
};

export default DraftsView;
