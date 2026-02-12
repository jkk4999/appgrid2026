import React from 'react';
import { IconButton, Paper, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';

interface ChannelActionsPopupProps {
  onDelete?: () => void;
  onMakePrivate?: () => void;
  showDelete?: boolean;
  showMakePrivate?: boolean;
}

/**
 * Action buttons popup for channel list items
 * Shows on hover with delete and make private options
 */
const ChannelActionsPopup: React.FC<ChannelActionsPopupProps> = ({
  onDelete,
  onMakePrivate,
  showDelete = true,
  showMakePrivate = true,
}) => {
  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        gap: 0.5,
        p: 0.5,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {showMakePrivate && onMakePrivate && (
        <Tooltip title="Make Private">
          <IconButton size="small" onClick={onMakePrivate}>
            <LockIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {showDelete && onDelete && (
        <Tooltip title="Delete Channel Link">
          <IconButton size="small" onClick={onDelete} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Paper>
  );
};

export default ChannelActionsPopup;
