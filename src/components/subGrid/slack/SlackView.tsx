import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Stack,
  TextField,
  IconButton,
  Typography,
  List,
  ListItemText,
  ListItemButton,
  Avatar,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
} from '@mui/icons-material';
import SlackClient from '../../../backend_api/SlackClient';
import { SalesforceApi } from '../../../backend_api/SalesforceApi';
import {
  SlackConfig,
  SlackChannel,
  SlackMessage,
  SlackChannelLink,
  SLACK_OBJECTS,
} from './types';

interface SlackViewProps {
  recordId: string; // Salesforce record ID
  objectType: string; // Salesforce object API name
}

const SlackView: React.FC<SlackViewProps> = ({ recordId, objectType }) => {
  // Slack Client
  const [slackClient, setSlackClient] = useState<SlackClient | null>(null);

  // Channels
  const [linkedChannels, setLinkedChannels] = useState<SlackChannelLink[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [channelInfo, setChannelInfo] = useState<SlackChannel | null>(null);

  // Messages
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [messageText, setMessageText] = useState<string>('');

  // UI State
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const messageListRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadLinkedChannels = useCallback(async (configId: string) => {
    try {
      // Query rule for filtering linked channels
      const queryRule = JSON.stringify({
        combinator: 'and',
        rules: [
          { field: 'AppGridAg__Salesforce_Record_Id__c', operator: '=', value: recordId },
          { field: 'AppGridAg__Active__c', operator: '=', value: true },
          { field: 'AppGridAg__Ag_Slack_Config__c', operator: '=', value: configId }
        ]
      });

      const result = await SalesforceApi.query<SlackChannelLink>(
        SLACK_OBJECTS.CHANNEL_LINK,
        queryRule
      );

      if (result.records && result.records.length > 0) {
        setLinkedChannels(result.records);

        // Auto-select primary channel or first channel
        const primaryChannel = result.records.find(
          (ch) => ch.AppGridAg__Is_Primary__c === true
        );
        const channelToSelect = primaryChannel || result.records[0];
        setSelectedChannelId(channelToSelect.AppGridAg__Slack_Channel_Id__c || null);
      } else {
        // No linked channels - show message to create one
        setLinkedChannels([]);
      }
    } catch (err: any) {
      console.error('Failed to load linked channels:', err);
      setError(`Failed to load channels: ${err.message}`);
    }
  }, [recordId]);

  const initializeSlack = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load Slack configuration - query for active config
      const configQueryRule = JSON.stringify({
        combinator: 'and',
        rules: [
          { field: 'AppGridAg__Is_Active__c', operator: '=', value: true }
        ]
      });

      const configResult = await SalesforceApi.query<SlackConfig>(
        SLACK_OBJECTS.CONFIG,
        configQueryRule
      );

      if (!configResult.records || configResult.records.length === 0) {
        setError('Slack integration is not configured. Please contact your administrator.');
        setLoading(false);
        return;
      }

      const config = configResult.records[0];

      // Initialize Slack client
      const client = new SlackClient({
        botToken: config.AppGridAg__Bot_Token__c || '',
      });
      setSlackClient(client);

      // Test connection
      try {
        await client.testConnection();
      } catch (err: any) {
        setError(`Failed to connect to Slack: ${err.message}`);
        setLoading(false);
        return;
      }

      // Load linked channels for this record
      await loadLinkedChannels(config.Id!);

      setLoading(false);
    } catch (err: any) {
      console.error('Failed to initialize Slack:', err);
      setError(`Initialization failed: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  }, [loadLinkedChannels]);

  const loadMessages = useCallback(async (silent: boolean = false) => {
    if (!slackClient || !selectedChannelId) return;

    try {
      if (!silent) {
        setLoadingMessages(true);
      }

      // Get channel info
      const channelData = await slackClient.getChannelInfo(selectedChannelId);
      setChannelInfo(channelData);

      // Get messages
      const messagesResponse = await slackClient.getMessages(selectedChannelId, {
        limit: 100,
      });

      // Reverse to show oldest first
      const messagesArray = messagesResponse.messages || [];
      setMessages(messagesArray.reverse());

      // Scroll to bottom
      setTimeout(() => {
        if (messageListRef.current) {
          messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
      }, 100);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      if (!silent) {
        setError(`Failed to load messages: ${err.message}`);
      }
    } finally {
      setLoadingMessages(false);
    }
  }, [slackClient, selectedChannelId]);

  // Initialize Slack client and load data
  useEffect(() => {
    initializeSlack();

    return () => {
      // Cleanup polling on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [initializeSlack]);

  // Auto-refresh messages when channel is selected
  useEffect(() => {
    if (selectedChannelId) {
      loadMessages();

      // Poll for new messages every 10 seconds
      pollingIntervalRef.current = setInterval(() => {
        loadMessages(true); // Silent refresh
      }, 10000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [selectedChannelId, loadMessages]);

  const handleSendMessage = async () => {
    if (!slackClient || !selectedChannelId || !messageText.trim()) return;

    try {
      setSending(true);

      await slackClient.sendMessage(selectedChannelId, messageText);

      // Clear input
      setMessageText('');

      // Reload messages
      await loadMessages(true);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(`Failed to send message: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRefresh = () => {
    loadMessages();
  };

  const formatTimestamp = (ts?: string): string => {
    if (!ts) return '';
    const timestamp = parseFloat(ts) * 1000;
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error && !slackClient) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // No channels linked
  if (linkedChannels.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="info" sx={{ mb: 2 }}>
          No Slack channels are linked to this {objectType} record.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          To link a Slack channel:
        </Typography>
        <Typography variant="body2" color="text.secondary" component="ul" sx={{ mt: 1 }}>
          <li>Create a new channel in Slack</li>
          <li>Invite the AppGrid bot to the channel</li>
          <li>Use the channel link manager to associate it with this record</li>
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
      {/* Left Sidebar - Channel List */}
      <Paper
        sx={{
          width: 260,
          borderRadius: 0,
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" fontWeight={600}>
              Channels
            </Typography>
            <Tooltip title="Link New Channel">
              <IconButton size="small">
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
          {linkedChannels.map((channel) => (
            <ListItemButton
              key={channel.Id}
              selected={selectedChannelId === channel.AppGridAg__Slack_Channel_Id__c}
              onClick={() =>
                setSelectedChannelId(channel.AppGridAg__Slack_Channel_Id__c || null)
              }
            >
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={500}>
                    # {channel.AppGridAg__Slack_Channel_Name__c}
                  </Typography>
                }
                secondary={
                  channel.AppGridAg__Is_Primary__c && (
                    <Typography variant="caption" color="primary">
                      Primary
                    </Typography>
                  )
                }
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>

      {/* Right Side - Messages */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Channel Header */}
        <Paper
          sx={{
            p: 2,
            borderRadius: 0,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              # {channelInfo?.name || 'Loading...'}
            </Typography>
            {channelInfo?.topic?.value && (
              <Typography variant="caption" color="text.secondary">
                {channelInfo.topic.value}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh Messages">
              <IconButton size="small" onClick={handleRefresh} disabled={loadingMessages}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Channel Settings">
              <IconButton size="small">
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Paper>

        {/* Messages List */}
        <Box
          ref={messageListRef}
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            backgroundColor: 'background.default',
          }}
        >
          {loadingMessages && messages.length === 0 ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={24} />
            </Box>
          ) : messages.length === 0 ? (
            <Box display="flex" justifyContent="center" p={3}>
              <Typography variant="body2" color="text.secondary">
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {messages.map((msg, index) => (
                <Box key={msg.ts || index}>
                  <Stack direction="row" spacing={1.5}>
                    <Avatar sx={{ width: 36, height: 36 }}>
                      {msg.user ? msg.user[0].toUpperCase() : 'U'}
                    </Avatar>
                    <Box flex={1}>
                      <Stack direction="row" spacing={1} alignItems="baseline">
                        <Typography variant="subtitle2" fontWeight={600}>
                          {msg.user || 'Unknown User'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(msg.ts)}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {/* Message Input */}
        <Paper
          sx={{
            p: 2,
            borderRadius: 0,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message #${channelInfo?.name || 'channel'}`}
              disabled={sending}
              size="small"
            />
            <IconButton size="small" disabled>
              <AttachFileIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled>
              <EmojiIcon fontSize="small" />
            </IconButton>
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={sending || !messageText.trim()}
            >
              <SendIcon />
            </IconButton>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Press Enter to send, Shift+Enter for new line
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default SlackView;
