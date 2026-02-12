import React from 'react';
import {
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';

interface ChannelHoverActionsProps {
  onAction: (action: string) => void;
  isOwner: boolean;
}

/**
 * Hover actions component for channels in HomeView
 * Shows action buttons when user hovers over a channel
 * Displays Leave, Change to Private (owner only), and Delete (owner only)
 */
const ChannelHoverActions: React.FC<ChannelHoverActionsProps> = ({
  onAction,
  isOwner,
}) => {
  console.log('[ChannelHoverActions] Rendered with isOwner:', isOwner);

  const handleLeave = () => {
    onAction('leave');
  };

  const handleConvert = () => {
    onAction('convert');
  };

  const handleDelete = () => {
    onAction('delete');
  };

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'absolute',
        top: -8,
        right: 16,
        display: 'flex',
        gap: 0.5,
        p: 0.5,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        zIndex: 10,
      }}
    >
      <Tooltip title="Leave channel">
        <IconButton
          size="small"
          onClick={handleLeave}
          sx={{
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <ExitToAppIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Only show owner actions if user is owner */}
      {isOwner && (
        <>
          <Tooltip title="Change to private channel">
            <IconButton
              size="small"
              onClick={handleConvert}
              sx={{
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <LockIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete channel">
            <IconButton
              size="small"
              onClick={handleDelete}
              sx={{
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Paper>
  );
};

export default ChannelHoverActions;
