import React from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { BaseViewProps, SlackChannel } from '../types';

interface ChannelsViewProps extends BaseViewProps {
  channels: SlackChannel[];
  selectedChannelId?: string | null;
}

/**
 * Left panel view for Channels
 */
const ChannelsView: React.FC<ChannelsViewProps> = ({
  channels,
  selectedChannelId,
  onItemClick,
}) => {
  const handleChannelClick = (channel: SlackChannel) => {
    onItemClick('channel', { channelId: channel.id, channel });
  };

  if (channels.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No channels
        </Typography>
      </Box>
    );
  }

  return (
    <List dense sx={{ px: 1 }}>
      {channels.map((channel) => {
        const displayName = channel.name || channel.id;
        const prefix = channel.is_private ? '🔒' : '#';
        const isSelected = channel.id === selectedChannelId;

        return (
          <ListItemButton
            key={channel.id}
            onClick={() => handleChannelClick(channel)}
            selected={isSelected}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'action.selected',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Typography
              sx={{
                width: 32,
                height: 32,
                mr: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              {prefix}
            </Typography>
            <ListItemText
              primary={displayName}
              secondary={channel.is_member ? null : 'Not a member'}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: isSelected ? 600 : 500,
              }}
              secondaryTypographyProps={{
                variant: 'caption',
              }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
};

export default ChannelsView;
