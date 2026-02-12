import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import AddReactionOutlinedIcon from '@mui/icons-material/AddReactionOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ForwardIcon from '@mui/icons-material/Forward';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface MessageActionsPopupProps {
  onReact?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onForward?: () => void;
  onMore?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
}

/**
 * Popup with action buttons that appears on message hover
 * Styled to match Slack's design
 */
const MessageActionsPopup: React.FC<MessageActionsPopupProps> = ({
  onReact,
  onEdit,
  onDelete,
  onForward,
  onMore,
  showEdit = false,
  showDelete = false,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.5,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 0.5,
        boxShadow: 2,
      }}
    >
      {/* Add Reaction */}
      {onReact && (
        <Tooltip title="Add reaction">
          <IconButton
            size="small"
            onClick={(e) => onReact(e)}
            sx={{
              width: 28,
              height: 28,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <AddReactionOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* Forward Message */}
      {onForward && (
        <Tooltip title="Forward message">
          <IconButton
            size="small"
            onClick={onForward}
            sx={{
              width: 28,
              height: 28,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ForwardIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* Edit Message - Only show if user owns the message */}
      {showEdit && onEdit && (
        <Tooltip title="Edit message">
          <IconButton
            size="small"
            onClick={onEdit}
            sx={{
              width: 28,
              height: 28,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <EditOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* Delete Message - Only show if user owns the message */}
      {showDelete && onDelete && (
        <Tooltip title="Delete message">
          <IconButton
            size="small"
            onClick={onDelete}
            sx={{
              width: 28,
              height: 28,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* More Options */}
      {onMore && (
        <Tooltip title="More actions">
          <IconButton
            size="small"
            onClick={onMore}
            sx={{
              width: 28,
              height: 28,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <MoreVertIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default MessageActionsPopup;
