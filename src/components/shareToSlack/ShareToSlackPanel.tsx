import React, { useState, useEffect, useCallback } from 'react';

import {
  Box,
  TextField,
  Autocomplete,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  IconButton,
  Button,
} from '@mui/material';

import { prettyPrint } from '../../utilities/prettyPrint';
import { htmlToSlackMrkdwn } from '../../utilities/slackFormatConverter';
import { slackCache } from '../../utilities/slackCache';

import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SlackIconComponent from '../appGridAuraComponent/SlackIconComponent';

import ContentEditableEditor from './ContentEditableEditor';

import { APIClient } from '../../brideDesignPattern/apiInterface';
import { useStore } from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

interface ShareToSlackPanelProps {
  onClose: () => void;
  apiClient: APIClient;
  selectedRows: any[];
  objectName: string;
  allChannels?: any[]; // Pre-loaded channels and DMs from parent
}

interface SlackChannel {
  id: string;
  name?: string;
  is_private: boolean;
  is_member: boolean;
  num_members?: number;
  is_im?: boolean;
  user?: string;
  user_profile?: {
    real_name?: string;
    display_name?: string;
  };
}


const ShareToSlackPanel: React.FC<ShareToSlackPanelProps> = ({
  onClose,
  apiClient,
  selectedRows,
  objectName,
  allChannels = [],
}) => {
  const [channels, setChannels] = useState<SlackChannel[]>(allChannels);
  const [allUsers, setAllUsers] = useState<any[]>([]); // All users cached
  const [users, setUsers] = useState<any[]>([]); // Filtered users for display
  const [selectedChannel, setSelectedChannel] = useState<SlackChannel | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get refresh trigger and record context from store
  const { triggerSlackChannelsRefresh, slackPanelRecordId, slackPanelObjectType, slackPanelRecordName } = useStore(
    useShallow((state) => ({
      triggerSlackChannelsRefresh: state.triggerSlackChannelsRefresh,
      slackPanelRecordId: state.slackPanelRecordId,
      slackPanelObjectType: state.slackPanelObjectType,
      slackPanelRecordName: state.slackPanelRecordName,
    }))
  );

  const generateDefaultMessage = useCallback(() => {
    if (selectedRows.length === 0) {
      setMessage('');
      return;
    }

    if (selectedRows.length === 1) {
      // For single record, leave message empty so user can type their own message
      // The record URL will be appended automatically when sending
      setMessage('');
    } else {
      // For multiple records, create a list with record names only
      // URLs will be appended when sending
      let msg = `📋 ${selectedRows.length} ${objectName} Records\n\n`;

      selectedRows.slice(0, 10).forEach((row, index) => {
        const recordName = row.Name || row.Id || `Record ${index + 1}`;
        msg += `${index + 1}. ${recordName}\n`;
      });

      if (selectedRows.length > 10) {
        msg += `\n... and ${selectedRows.length - 10} more`;
      }

      setMessage(msg);
    }
  }, [objectName, selectedRows]);

  // Update channels when allChannels prop changes
  useEffect(() => {
    prettyPrint('[ShareToSlackPanel] Received channels from parent:', allChannels, 'blue');
    prettyPrint('[ShareToSlackPanel] Number of channels received:', allChannels?.length || 0, 'blue');
    prettyPrint('[ShareToSlackPanel] Sample channel structure:', allChannels?.[0], 'blue');
    setChannels(allChannels);
  }, [allChannels]);

  // Fetch all users once on mount to avoid rate limiting
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        setFetchingUsers(true);
        prettyPrint('[ShareToSlackPanel] Fetching all users (one-time)...', null, 'blue');

        const response = await apiClient.slackListUsers();
        const data = typeof response === 'string' ? JSON.parse(response) : response;

        if (data.ok && data.members) {
          // Filter out deleted users, bots, and Slackbot
          const validUsers = data.members.filter((user: any) =>
            !user.deleted && !user.is_bot && user.id !== 'USLACKBOT'
          );

          prettyPrint('[ShareToSlackPanel] Cached users:', validUsers.length, 'green');
          setAllUsers(validUsers);
        }
        setFetchingUsers(false);
      } catch (err: any) {
        console.error('Failed to fetch users:', err);
        setFetchingUsers(false);
      }
    };

    fetchAllUsers();
  }, [apiClient]);

  // Filter cached users based on input (client-side filtering to avoid rate limits)
  useEffect(() => {
    if (!inputValue.startsWith('@') || inputValue.length < 3) {
      setUsers([]);
      return;
    }

    const searchTerm = inputValue.substring(1).toLowerCase(); // Remove @ prefix
    const filteredUsers = allUsers.filter((user: any) => {
      const displayName = user.profile?.display_name || '';
      const realName = user.profile?.real_name || '';
      const email = user.profile?.email || '';

      return (
        displayName.toLowerCase().includes(searchTerm) ||
        realName.toLowerCase().includes(searchTerm) ||
        email.toLowerCase().includes(searchTerm)
      );
    });

    prettyPrint('[ShareToSlackPanel] Filtered users:', filteredUsers.length, 'cyan');
    setUsers(filteredUsers);
  }, [inputValue, allUsers]);

  // Generate default message on mount
  useEffect(() => {
    generateDefaultMessage();
  }, [generateDefaultMessage]);

  const handleSend = async () => {
    if (!selectedChannel || !message.trim()) {
      setError('Please select a channel or user and enter a message');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Determine the channel ID
      let channelId = selectedChannel.id;

      // If it's a user (from @ search), we need to open/get a DM channel first
      if ((selectedChannel as any).isUser) {
        prettyPrint('[ShareToSlackPanel] Opening DM with user:', selectedChannel.id, 'blue');

        const dmResponse = await apiClient.slackOpenConversation({
          users: selectedChannel.id,
        });

        const dmData = typeof dmResponse === 'string' ? JSON.parse(dmResponse) : dmResponse;

        if (!dmData.ok || !dmData.channel) {
          // Check for missing scope error
          if (dmData.error === 'missing_scope') {
            throw new Error(
              `Missing Slack permission: ${dmData.needed || 'im:write'}. Please disconnect and reconnect your Slack account to grant the required permissions.`
            );
          }
          throw new Error(dmData.error || 'Failed to open DM channel');
        }

        channelId = dmData.channel.id;
        prettyPrint('[ShareToSlackPanel] DM channel ID:', channelId, 'green');
      }

      // Convert HTML to Slack mrkdwn format
      prettyPrint('[ShareToSlackPanel] Original HTML message:', message, 'yellow');
      const slackMrkdwn = htmlToSlackMrkdwn(message);
      prettyPrint('[ShareToSlackPanel] Converted to Slack mrkdwn:', slackMrkdwn, 'cyan');

      // Append record URL(s) on separate lines so they don't interfere with formatting
      let finalMessage = slackMrkdwn;

      if (selectedRows.length === 1) {
        const recordId = selectedRows[0].Id;
        if (recordId) {
          const recordUrl = `${window.location.origin}/lightning/r/${objectName}/${recordId}/view`;
          finalMessage = `${slackMrkdwn}\n\n🔗 View in Salesforce: ${recordUrl}`;
        }
      } else if (selectedRows.length > 1) {
        // Append URLs for multiple records
        finalMessage += '\n\n';
        selectedRows.slice(0, 10).forEach((row, index) => {
          const recordId = row.Id;
          if (recordId) {
            const recordUrl = `${window.location.origin}/lightning/r/${objectName}/${recordId}/view`;
            finalMessage += `🔗 ${index + 1}. ${recordUrl}\n`;
          }
        });
      }

      prettyPrint('[ShareToSlackPanel] Final message with URLs:', finalMessage, 'green');

      // Send the message
      const response = await apiClient.slackPostMessage({
        channel: channelId,
        text: finalMessage,
      });

      const data = typeof response === 'string' ? JSON.parse(response) : response;

      prettyPrint('[shareToSlackPanel] - apiClient.slackPostMessage response:', data, 'blue')

      if (!data.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);

      // Create channel link record in Salesforce so this DM/channel appears in HomeView
      if (slackPanelRecordId && slackPanelObjectType && slackPanelRecordName) {
        try {
          // Determine channel name based on type
          let channelName = '';
          if ((selectedChannel as any).isUser) {
            // For DMs, use the user's display name or real name
            const userProfile = selectedChannel.user_profile;
            channelName = userProfile?.display_name || userProfile?.real_name || selectedChannel.name || 'Unknown User';
          } else {
            // For channels, use the channel name
            channelName = selectedChannel.name || 'Unknown Channel';
          }

          prettyPrint('[ShareToSlackPanel] Creating channel link:', {
            recordId: slackPanelRecordId,
            channelId,
            channelName,
          }, 'blue');

          await apiClient.slackCreateChannelLink({
            recordId: slackPanelRecordId,
            objectType: slackPanelObjectType,
            recordName: slackPanelRecordName,
            channelId: channelId,
            channelName: channelName,
            isPrimary: false,
            linkType: 'Auto-Created',
          });

          prettyPrint('[ShareToSlackPanel] Channel link created successfully', null, 'green');
        } catch (linkError: any) {
          prettyPrint('[ShareToSlackPanel] Failed to create channel link:', linkError, 'red');
          // Don't fail the whole operation if link creation fails
        }
      }

      // Invalidate the record's caches (channel links and search results)
      // This ensures the new DM/message shows up in HomeView
      if (slackPanelRecordId) {
        prettyPrint('[ShareToSlackPanel] Invalidating record caches for:', slackPanelRecordId, 'blue');
        slackCache.invalidateRecord(slackPanelRecordId);
      }

      // Trigger refresh of HomeView to show the new DM/message
      prettyPrint('[ShareToSlackPanel] Triggering Slack channels refresh', null, 'blue');
      triggerSlackChannelsRefresh();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to send message to Slack:', err);
      setError(`Failed to send message: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <SlackIconComponent width={32} height={32} />
          <Typography variant="h6">New Message</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Selected Records Summary */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Sharing {selectedRows.length} {objectName} {selectedRows.length === 1 ? 'record' : 'records'}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {selectedRows.slice(0, 5).map((row, index) => (
                <Chip
                  key={index}
                  label={row.Name || row.Id || `Record ${index + 1}`}
                  size="small"
                  variant="outlined"
                />
              ))}
              {selectedRows.length > 5 && (
                <Chip
                  label={`+${selectedRows.length - 5} more`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Paper>

          {/* Channel/User Selection with Type-ahead */}
          <Autocomplete
            freeSolo
            options={(() => {
              const opts = inputValue.startsWith('#') ? channels : inputValue.startsWith('@') ? users : [];
              prettyPrint('[ShareToSlackPanel] Autocomplete options:', { inputValue, optionsCount: opts.length, firstOption: opts[0] }, 'cyan');
              return opts;
            })()}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;

              // For users (from @ search)
              if ((option as any).isUser || option.profile) {
                const displayName = option.profile?.display_name || option.profile?.real_name || option.id;
                return `@ ${displayName}`;
              }

              // For DMs (existing conversations)
              if (option.is_im && option.user_profile) {
                const dmName = option.user_profile.display_name || option.user_profile.real_name || option.user || option.id;
                return `@ ${dmName}`;
              }

              // For channels
              const displayName = option.name || option.id;
              const prefix = option.is_private ? '🔒' : '#';
              const memberInfo = option.num_members ? ` (${option.num_members})` : '';
              return `${prefix} ${displayName}${memberInfo}`;
            }}
            inputValue={inputValue}
            onInputChange={(_event, newValue) => {
              setInputValue(newValue);
            }}
            onChange={(_event, newValue) => {
              if (typeof newValue === 'object' && newValue !== null) {
                // Mark user selections with isUser flag for handleSend
                if (newValue.profile) {
                  (newValue as any).isUser = true;
                }
                setSelectedChannel(newValue as SlackChannel);
              }
            }}
            disabled={loading || success}
            loading={fetchingUsers}
            filterOptions={(options, state) => {
              const input = state.inputValue.toLowerCase();
              prettyPrint('[ShareToSlackPanel] filterOptions called:', { input, optionsCount: options.length }, 'yellow');

              // For channels (# prefix)
              if (input.startsWith('#')) {
                const searchTerm = input.substring(1);
                if (!searchTerm) {
                  prettyPrint('[ShareToSlackPanel] Showing all channels (just #):', options.length, 'green');
                  return options; // Show all channels if just #
                }

                const filtered = options.filter(opt => {
                  const hasName = opt.name?.toLowerCase().includes(searchTerm);
                  prettyPrint('[ShareToSlackPanel] Filtering channel:', { name: opt.name, searchTerm, hasName }, 'magenta');
                  return hasName;
                }).slice(0, 50); // Limit to 50 results

                prettyPrint('[ShareToSlackPanel] Filtered channels:', filtered.length, 'green');
                return filtered;
              }

              // For users (@ prefix)
              if (input.startsWith('@')) {
                // Users already filtered by useEffect
                const limited = options.slice(0, 50);
                prettyPrint('[ShareToSlackPanel] Showing users:', limited.length, 'green');
                return limited;
              }

              // No prefix - show nothing
              prettyPrint('[ShareToSlackPanel] No prefix, showing nothing', null, 'red');
              return [];
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Channel or DM"
                placeholder="Type # for channels or @ for users"
                helperText={!inputValue ? "Type # for channels or @ for users" : null}
                required
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {fetchingUsers ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => {
              const isUser = (option as any).isUser || option.profile;
              const isChannel = !isUser && !option.is_im;
              const isDM = option.is_im;

              return (
                <li {...props}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2">
                      {isUser && '@ '}
                      {isDM && '@ '}
                      {isChannel && (option.is_private ? '🔒 ' : '# ')}
                      {isUser
                        ? (option.profile?.display_name || option.profile?.real_name || option.id)
                        : isDM && option.user_profile
                        ? (option.user_profile.display_name || option.user_profile.real_name || option.user || option.id)
                        : (option.name || option.id)
                      }
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isUser && `${option.profile?.email || 'User'}`}
                      {isDM && 'Direct Message'}
                      {isChannel && option.num_members ? `${option.num_members} members` : ''}
                      {isChannel && !option.is_member && ' • Not a member'}
                    </Typography>
                  </Box>
                </li>
              );
            }}
          />

          {/* Message Input - ContentEditable Editor */}
          <ContentEditableEditor
            value={message}
            onChange={setMessage}
            disabled={loading || success}
            placeholder="Enter your message here..."
            minHeight={300}
          />

          {/* Error Display */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Success Display */}
          {success && (
            <Alert severity="success">
              Message sent successfully to{' '}
              {selectedChannel?.is_im
                ? (selectedChannel?.user_profile?.display_name ||
                  selectedChannel?.user_profile?.real_name ||
                  'DM')
                : `#${selectedChannel?.name}`}!
            </Alert>
          )}
        </Box>
      </Box>

      {/* Footer Actions */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1,
        }}
      >
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={!selectedChannel || !message.trim() || loading || success}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {loading ? 'Sending...' : 'Send to Slack'}
        </Button>
      </Box>
    </Box>
  );
};

export default ShareToSlackPanel;
