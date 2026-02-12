import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Avatar,
  Typography,
  TextField,
} from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface PersonaMenuProps {
  anchorEl: null | HTMLElement;
  open: boolean;
  onClose: () => void;
  userName: string;
  userEmail?: string;
  onMenuItemClick: (action: string) => void;
}

/**
 * Popup menu for the Persona icon in the sidebar
 * Emulates native Slack's user profile menu
 */
const PersonaMenu: React.FC<PersonaMenuProps> = ({
  anchorEl,
  open,
  onClose,
  userName,
  onMenuItemClick,
}) => {
  const handleItemClick = (action: string) => {
    onMenuItemClick(action);
    if (action !== 'status') {
      onClose();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
        vertical: 'bottom',
        horizontal: 'left',
      }}
      PaperProps={{
        sx: {
          minWidth: 300,
          maxWidth: 320,
        },
      }}
    >
      {/* User Info Header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'primary.main',
              fontSize: '1.2rem',
              fontWeight: 600,
            }}
          >
            {getInitials(userName)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body1" fontWeight={600} noWrap>
              {userName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <CircleIcon sx={{ fontSize: 10, color: 'success.main' }} />
              <Typography variant="caption" color="text.secondary">
                Active
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Update Status */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <TextField
          fullWidth
          placeholder="Update your status"
          variant="outlined"
          size="small"
          onClick={() => handleItemClick('status')}
          InputProps={{
            startAdornment: (
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                😀
              </Box>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.875rem',
            },
          }}
        />
      </Box>

      {/* Set as Away */}
      <MenuItem onClick={() => handleItemClick('away')}>
        <ListItemText
          primary="Set yourself as away"
          primaryTypographyProps={{ variant: 'body2' }}
        />
      </MenuItem>

      {/* Pause Notifications */}
      <MenuItem onClick={() => handleItemClick('notifications')}>
        <ListItemText
          primary="Pause notifications"
          primaryTypographyProps={{ variant: 'body2' }}
        />
        <ChevronRightIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
      </MenuItem>

      <Divider sx={{ my: 1 }} />

      {/* Profile */}
      <MenuItem onClick={() => handleItemClick('profile')}>
        <ListItemText
          primary="Profile"
          primaryTypographyProps={{ variant: 'body2' }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          ⌘⇧K
        </Typography>
      </MenuItem>

      {/* Preferences */}
      <MenuItem onClick={() => handleItemClick('preferences')}>
        <ListItemText
          primary="Preferences"
          primaryTypographyProps={{ variant: 'body2' }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          ⌘,
        </Typography>
      </MenuItem>

      <Divider sx={{ my: 1 }} />

      {/* Downloads */}
      <MenuItem onClick={() => handleItemClick('downloads')}>
        <ListItemText
          primary="Downloads"
          primaryTypographyProps={{ variant: 'body2' }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          ⌘⇧J
        </Typography>
      </MenuItem>

      <Divider sx={{ my: 1 }} />

      {/* Disconnect from Slack */}
      <MenuItem onClick={() => handleItemClick('disconnect')}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Disconnect from Slack"
          secondary="Revoke access to your Slack account"
          primaryTypographyProps={{ variant: 'body2' }}
          secondaryTypographyProps={{ variant: 'caption' }}
        />
      </MenuItem>
    </Menu>
  );
};

export default PersonaMenu;
