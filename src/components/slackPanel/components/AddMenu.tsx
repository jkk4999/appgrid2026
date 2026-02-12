import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import TagIcon from '@mui/icons-material/Tag';
import HeadsetIcon from '@mui/icons-material/Headset';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FolderIcon from '@mui/icons-material/Folder';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

interface AddMenuProps {
  anchorEl: null | HTMLElement;
  open: boolean;
  onClose: () => void;
  onMenuItemClick: (action: string) => void;
}

/**
 * Popup menu for the Add button in the sidebar
 * Emulates native Slack's "Create" menu
 */
const AddMenu: React.FC<AddMenuProps> = ({ anchorEl, open, onClose, onMenuItemClick }) => {
  const handleItemClick = (action: string) => {
    onMenuItemClick(action);
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      PaperProps={{
        sx: {
          minWidth: 280,
          maxWidth: 320,
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          px: 2,
          py: 1,
          display: 'block',
          color: 'text.secondary',
          fontWeight: 600,
        }}
      >
        Create
      </Typography>

      <MenuItem onClick={() => handleItemClick('message')}>
        <ListItemIcon>
          <MessageIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Message"
          secondary="Start a conversation in a DM or channel"
          primaryTypographyProps={{ variant: 'body2' }}
          secondaryTypographyProps={{ variant: 'caption' }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          ⌘N
        </Typography>
      </MenuItem>

      <MenuItem onClick={() => handleItemClick('channel')}>
        <ListItemIcon>
          <TagIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Channel"
          secondary="Start a group conversation by topic"
          primaryTypographyProps={{ variant: 'body2' }}
          secondaryTypographyProps={{ variant: 'caption' }}
        />
      </MenuItem>

      <MenuItem onClick={() => handleItemClick('huddle')}>
        <ListItemIcon>
          <HeadsetIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Huddle"
          secondary="Start a video or audio chat"
          primaryTypographyProps={{ variant: 'body2' }}
          secondaryTypographyProps={{ variant: 'caption' }}
        />
      </MenuItem>

      <Divider sx={{ my: 1 }} />

      <MenuItem onClick={() => handleItemClick('canvas')} disabled>
        <ListItemIcon>
          <FolderIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Canvas"
          secondary="Create and share content"
          primaryTypographyProps={{ variant: 'body2' }}
          secondaryTypographyProps={{ variant: 'caption' }}
        />
        <Typography
          variant="caption"
          sx={{
            ml: 2,
            px: 0.75,
            py: 0.25,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 0.5,
            fontSize: '0.65rem',
            fontWeight: 600,
          }}
        >
          PRO
        </Typography>
      </MenuItem>

      <MenuItem onClick={() => handleItemClick('list')} disabled>
        <ListItemIcon>
          <FormatListBulletedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="List"
          secondary="Track and manage projects"
          primaryTypographyProps={{ variant: 'body2' }}
          secondaryTypographyProps={{ variant: 'caption' }}
        />
        <Typography
          variant="caption"
          sx={{
            ml: 2,
            px: 0.75,
            py: 0.25,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 0.5,
            fontSize: '0.65rem',
            fontWeight: 600,
          }}
        >
          PRO
        </Typography>
      </MenuItem>

      <Divider sx={{ my: 1 }} />

      <MenuItem onClick={() => handleItemClick('invite')}>
        <ListItemIcon>
          <PersonAddIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Invite people"
          primaryTypographyProps={{ variant: 'body2' }}
        />
      </MenuItem>
    </Menu>
  );
};

export default AddMenu;
