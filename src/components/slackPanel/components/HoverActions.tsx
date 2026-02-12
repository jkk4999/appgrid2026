import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Paper,
} from '@mui/material';
import AddReactionOutlinedIcon from '@mui/icons-material/AddReactionOutlined';
import SendIcon from '@mui/icons-material/Send';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ReplyIcon from '@mui/icons-material/Reply';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';

interface HoverActionsProps {
  onAction: (action: string) => void;
}

/**
 * Hover actions menu component for messages
 * Shows React, Deploy, and More actions when user hovers over a message
 */
const HoverActions: React.FC<HoverActionsProps> = ({
  onAction
}) => {
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<HTMLElement | null>(null);

  const handleReact = () => {
    onAction('react');
  };

  const handleDeploy = () => {
    onAction('deploy');
  };

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleMoreClose = () => {
    setMoreMenuAnchor(null);
  };

  const handleMoreAction = (action: string) => {
    handleMoreClose();
    onAction(action);
  };

  return (
    <>
      {/* Main action buttons */}
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
        <Tooltip title="Add reaction">
          <IconButton
            size="small"
            onClick={handleReact}
            sx={{
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <AddReactionOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Deploy to Salesforce">
          <IconButton
            size="small"
            onClick={handleDeploy}
            sx={{
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="More actions">
          <IconButton
            size="small"
            onClick={handleMoreClick}
            sx={{
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* More actions menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={handleMoreClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 220,
          },
        }}
      >
        <MenuItem onClick={() => handleMoreAction('reply')}>
          <ListItemIcon>
            <ReplyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Reply in thread" />
        </MenuItem>

        <MenuItem onClick={() => handleMoreAction('pin')}>
          <ListItemIcon>
            <PushPinOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Pin message" />
        </MenuItem>

        <MenuItem onClick={() => handleMoreAction('bookmark')}>
          <ListItemIcon>
            <BookmarkBorderIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Bookmark" />
        </MenuItem>

        <MenuItem onClick={() => handleMoreAction('copy')}>
          <ListItemIcon>
            <FileCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Copy text" />
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        <MenuItem onClick={() => handleMoreAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit message" />
        </MenuItem>

        <MenuItem onClick={() => handleMoreAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Delete message" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default HoverActions;
