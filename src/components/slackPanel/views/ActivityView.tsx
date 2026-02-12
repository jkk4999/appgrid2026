import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { BaseViewProps } from '../types';

/**
 * Left panel view for Activity/Notifications
 * Activities are a paid Slack feature - placeholder for future implementation
 */
const ActivityView: React.FC<BaseViewProps> = () => {
  return (
    <Box
      sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
        minHeight: 300
      }}
    >
      <NotificationsNoneOutlinedIcon
        sx={{
          fontSize: 64,
          color: 'text.secondary',
          opacity: 0.5
        }}
      />
      <Typography variant="h6" fontWeight={600} color="text.primary">
        Activity
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
        Track mentions, reactions, and updates across your Slack workspace.
      </Typography>
      <Chip
        label="Coming Soon"
        size="small"
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          fontWeight: 600
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
        This feature requires a Slack paid plan
      </Typography>
    </Box>
  );
};

export default ActivityView;
