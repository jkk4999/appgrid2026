import React, { useState, useMemo } from 'react';
import {
  Box,
  List,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { BaseViewProps, SlackChannel } from '../types';
import { prettyPrint } from '../../../utilities/prettyPrint';
import MessageCard from '../components/MessageCard';
import { useStore } from '../../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

interface DirectMessagesViewProps extends BaseViewProps {
  selectedChannelId?: string | null;
}

/**
 * Left panel view for Direct Messages
 * Enhanced with unread filter, search, and MessageCard components
 * Now reads DMs from centralized Zustand store
 */
const DirectMessagesView: React.FC<DirectMessagesViewProps> = ({
  selectedChannelId,
  onItemClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Get DMs from centralized Zustand store
  const { slackDirectMessages } = useStore(
    useShallow((state) => ({
      slackDirectMessages: state.slackDirectMessages,
    }))
  );

  const channels = slackDirectMessages as SlackChannel[];

  // Debug logging
  prettyPrint('[DirectMessagesView] Received channels from Zustand:', channels, 'blue');
  prettyPrint('[DirectMessagesView] Channels length:', channels.length, 'blue');

  // Filter channels based on search and unread status
  const filteredChannels = useMemo(() => {
    let filtered = [...channels];

    // Filter by unread status if enabled
    if (showUnreadOnly) {
      filtered = filtered.filter(ch => ch.unread > 0);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ch => {
        const displayName = ch.name || ch.user?.name || ch.id;
        return displayName.toLowerCase().includes(query);
      });
    }

    // Sort by most recent message
    filtered.sort((a, b) => {
      const aTs = a.messages && a.messages.length > 0 ? parseFloat(a.messages[0].ts) : 0;
      const bTs = b.messages && b.messages.length > 0 ? parseFloat(b.messages[0].ts) : 0;
      return bTs - aTs; // Most recent first
    });

    return filtered;
  }, [channels, searchQuery, showUnreadOnly]);

  const handleDmClick = (dm: SlackChannel) => {
    onItemClick('message', { channelId: dm.id, channel: dm });
  };

  const handleNewMessage = () => {
    onItemClick('compose', { mode: 'message' });
  };

  const getDmChannelName = (dm: SlackChannel): string => {
    // Get the name of the person you're messaging with (the channel name)
    return dm.name || dm.user?.name || 'User';
  };

  const getDmChannelInitial = (dm: SlackChannel): string => {
    const name = getDmChannelName(dm);
    return name.charAt(0).toUpperCase();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 2 }}>
          <IconButton
            size="small"
            onClick={handleNewMessage}
            color="primary"
            sx={{
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Unread Filter */}
        <FormControlLabel
          control={
            <Checkbox
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="caption">
              Unread only
            </Typography>
          }
          sx={{ mb: 1 }}
        />

        {/* Search Box */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search direct messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.875rem',
            },
          }}
        />
      </Box>

      {/* Messages List */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {filteredChannels.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {showUnreadOnly
                ? 'No unread messages'
                : searchQuery
                ? 'No messages found'
                : 'No direct messages'}
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {filteredChannels.map((dm) => {
              const latestMessage = dm.messages && dm.messages.length > 0 ? dm.messages[0] : null;

              if (!latestMessage) {
                return null;
              }

              return (
                <Box
                  key={dm.id}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: dm.id === selectedChannelId ? 'action.selected' : 'transparent',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <MessageCard
                    message={latestMessage}
                    userName={getDmChannelName(dm)}
                    userInitial={getDmChannelInitial(dm)}
                    showSummary={true}
                    maxSummaryLines={3}
                    onClick={() => handleDmClick(dm)}
                  />
                  {dm.unread > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      {dm.unread}
                    </Box>
                  )}
                </Box>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default DirectMessagesView;
