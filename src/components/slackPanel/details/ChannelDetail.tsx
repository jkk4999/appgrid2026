import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { prettyPrint } from '../../../utilities/prettyPrint';
import { slackCache, CACHE_TTL } from '../../../utilities/slackCache';
import MessageEditor from '../components/MessageEditor';
import MessageItem from '../components/MessageItem';
import MessageEditDialog from '../components/MessageEditDialog';
import MessageForwardDialog from '../components/MessageForwardDialog';
import EmojiPicker from '../components/EmojiPicker';
import { htmlToSlackMrkdwn } from '../../../utilities/slackFormatConverter';
import { useStore } from '../../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

interface ChannelDetailProps {
  channelId: string;
  channel: any;
  apiClient: any;
  onClose?: () => void;
  recordId?: any;
  recordName?: any;
  objectType?: any;
  currentUserId?: string;
}

interface SlackFile {
  id: string;
  name: string;
  mimetype: string;
  filetype: string;
  size: number;
  url_private: string;
  url_private_download: string;
  thumb_360?: string;
  thumb_480?: string;
  thumb_800?: string;
  permalink: string;
}

interface SlackMessage {
  ts: string;
  user: string;
  text: string;
  blocks?: any[];
  attachments?: any[];
  files?: SlackFile[];
  user_profile?: {
    display_name?: string;
    real_name?: string;
    image_48?: string;
  };
}

/**
 * Channel detail view for center panel
 * Shows message history and message editor
 */
const ChannelDetail: React.FC<ChannelDetailProps> = ({ channelId, channel, apiClient }) => {
  const theme = useTheme();
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { enqueueSnackbar } = useSnackbar();

  // Cache all users with their profiles (loaded once on mount)
  const userProfilesCache = useRef<{ [key: string]: any }>({});
  const [usersLoaded, setUsersLoaded] = useState(false);

  // Current Slack user ID
  const [currentSlackUserId, setCurrentSlackUserId] = useState<string | null>(null);

  // Get theme colors and DM refresh trigger from Zustand
  const { selectedAccentColor, triggerSlackDirectMessagesRefresh } = useStore(
    useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor,
      triggerSlackDirectMessagesRefresh: state.triggerSlackDirectMessagesRefresh,
    }))
  );

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  // Edit message dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [messageToEdit, setMessageToEdit] = useState<{ ts: string; text: string } | null>(null);

  // Forward message dialog state
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState<string | null>(null);

  // Emoji picker state
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<HTMLElement | null>(null);
  const [messageToReact, setMessageToReact] = useState<string | null>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get current Slack user ID once on mount (with caching)
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        prettyPrint('[ChannelDetail] Getting current Slack user ID...', null, 'blue');

        const cacheKey = 'slack:auth-test';
        let data = slackCache.get<any>(cacheKey);

        if (!data) {
          prettyPrint('[ChannelDetail] Cache miss: Fetching auth test from Slack API', null, 'blue');
          const response = await apiClient.slackAuthTest();
          data = typeof response === 'string' ? JSON.parse(response) : response;

          if (data.ok) {
            slackCache.set(cacheKey, data, CACHE_TTL.AUTH_TEST);
            prettyPrint('[ChannelDetail] Cached auth test for 30 minutes', null, 'green');
          }
        } else {
          prettyPrint('[ChannelDetail] Cache hit: Using cached auth test', null, 'green');
        }

        if (data.ok && data.user_id) {
          setCurrentSlackUserId(data.user_id);
          prettyPrint('[ChannelDetail] Current Slack user ID:', data.user_id, 'green');
        }
      } catch (err) {
        prettyPrint('Failed to get current user ID:', err, 'red');
      }
    };

    getCurrentUserId();
  }, [apiClient]);

  // Load all users once on component mount (with caching to avoid rate limits)
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        prettyPrint('[ChannelDetail] Loading all users...', null, 'blue');

        const usersCacheKey = 'slack:users-list';
        let data = slackCache.get<any>(usersCacheKey);

        if (!data) {
          prettyPrint('[ChannelDetail] Cache miss: Fetching users from Slack API', null, 'blue');
          const response = await apiClient.slackListUsers();
          data = typeof response === 'string' ? JSON.parse(response) : response;

          if (data.ok) {
            slackCache.set(usersCacheKey, data, CACHE_TTL.USERS_LIST);
            prettyPrint('[ChannelDetail] Cached users list for 10 minutes', null, 'green');
          }
        } else {
          prettyPrint('[ChannelDetail] Cache hit: Using cached users list', null, 'green');
        }

        if (data.ok && data.members) {
          // Build a map of user ID to profile
          const profilesMap: { [key: string]: any } = {};
          data.members.forEach((user: any) => {
            profilesMap[user.id] = {
              display_name: user.profile?.display_name,
              real_name: user.profile?.real_name || user.real_name,
              image_48: user.profile?.image_48,
            };
          });

          userProfilesCache.current = profilesMap;
          prettyPrint('[ChannelDetail] Cached user profiles:', Object.keys(profilesMap).length, 'green');
          setUsersLoaded(true);
        }
      } catch (err) {
        prettyPrint('Failed to load users:', err, 'red');
        // Continue anyway - messages will just show user IDs
        setUsersLoaded(true);
      }
    };

    loadAllUsers();
  }, [apiClient]);

  // Load messages when channel changes AND users are loaded
  useEffect(() => {
    if (channelId && usersLoaded) {
      loadMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, usersLoaded]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get conversation history
      const response = await apiClient.slackGetConversationHistory({
        channel: channelId,
        limit: 100,
      });

      const data = typeof response === 'string' ? JSON.parse(response) : response;

      prettyPrint('[ChannelDetail] Messages loaded:', data, 'blue');

      if (data.ok && data.messages) {
        // Enrich messages with user profile data from cache
        const enrichedMessages = data.messages.map((msg: any) => ({
          ...msg,
          user_profile: msg.user ? userProfilesCache.current[msg.user] : null,
        }));

        prettyPrint('[ChannelDetail] Enriched messages with cached user profiles:', enrichedMessages, 'blue');

        // Reverse messages so newest are at bottom
        setMessages(enrichedMessages.reverse());
      } else {
        throw new Error(data.error || 'Failed to load messages');
      }

      setLoading(false);
    } catch (err: any) {
      prettyPrint('Failed to load messages:', err, 'red');
      setError(err.message || 'Failed to load messages');
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string, html: string, files?: File[]) => {
    try {
      setError(null);

      // Convert HTML to Slack mrkdwn format
      const mrkdwn = htmlToSlackMrkdwn(html);

      prettyPrint('[ChannelDetail] Converted HTML to mrkdwn:', { html, mrkdwn }, 'blue');

      // If files are attached, use the file upload API
      if (files && files.length > 0) {
        prettyPrint('[ChannelDetail] Sending message with files:', files.length, 'blue');

        // Import the postMessageWithFiles function
        const { postMessageWithFiles } = await import('../../../slack/api/messageApi');
        const uploadedFiles = await postMessageWithFiles(apiClient, channelId, mrkdwn, files);

        prettyPrint('[ChannelDetail] Message with files sent successfully', uploadedFiles, 'green');

        // Optimistically add the message to the UI immediately
        // Use the current timestamp as the message timestamp
        const newMessage: SlackMessage = {
          ts: String(Date.now() / 1000), // Convert to Slack timestamp format
          user: currentSlackUserId || 'unknown',
          text: mrkdwn,
          files: uploadedFiles,
          user_profile: currentSlackUserId ? userProfilesCache.current[currentSlackUserId] : undefined,
        };

        // Add the new message to the messages list immediately
        setMessages((prevMessages) => [...prevMessages, newMessage]);

        prettyPrint('[ChannelDetail] Optimistically added message to UI', newMessage, 'cyan');
      } else {
        // Regular text message
        const response = await apiClient.slackPostMessage({
          channel: channelId,
          text: mrkdwn,
        });

        const data = typeof response === 'string' ? JSON.parse(response) : response;

        prettyPrint('[ChannelDetail] Message sent:', data, 'green');

        if (!data.ok) {
          throw new Error(data.error || 'Failed to send message');
        }

        // Optimistically add the message to the UI immediately for text messages too
        const newMessage: SlackMessage = {
          ts: data.ts || String(Date.now() / 1000),
          user: currentSlackUserId || 'unknown',
          text: mrkdwn,
          user_profile: currentSlackUserId ? userProfilesCache.current[currentSlackUserId] : undefined,
        };

        setMessages((prevMessages) => [...prevMessages, newMessage]);

        prettyPrint('[ChannelDetail] Optimistically added message to UI', newMessage, 'cyan');
      }

      // Invalidate cache for this channel so next load will fetch fresh data
      slackCache.invalidateChannel(channelId);

      // Trigger DM list refresh if this is a DM channel
      if (channel.type === 'dm' || channel.type === 'group-dm' || channel.is_im || channel.is_mpim) {
        prettyPrint('[ChannelDetail] Triggering DM refresh after message sent', null, 'cyan');
        triggerSlackDirectMessagesRefresh();
      }
    } catch (err: any) {
      prettyPrint('Failed to send message:', err, 'red');

      // Extract error message from various error formats
      let errorMessage = 'Failed to send message';
      if (err?.body?.message) {
        errorMessage = err.body.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      // Display persistent error notification
      enqueueSnackbar(errorMessage, {
        variant: 'error',
        persist: true,
        action: () => (
          <Button
            size="small"
            sx={{ color: 'white' }}
          >
            Dismiss
          </Button>
        ),
      });

      setError(errorMessage);
      throw err; // Re-throw so MessageEditor can handle the error state
    }
  };

  const handleDeleteClick = (ts: string) => {
    setMessageToDelete(ts);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!messageToDelete) return;

    try {
      setError(null);
      setDeleteDialogOpen(false);

      const response = await apiClient.slackDeleteMessage({
        channel: channelId,
        ts: messageToDelete,
      });

      const data = typeof response === 'string' ? JSON.parse(response) : response;

      prettyPrint('[ChannelDetail] Message deleted:', data, 'green');

      if (!data.ok) {
        throw new Error(data.error || 'Failed to delete message');
      }

      // Invalidate cache for this channel
      slackCache.invalidateChannel(channelId);

      // Reload messages to reflect the deletion
      await loadMessages();

      // Trigger DM list refresh if this is a DM channel
      if (channel.type === 'dm' || channel.type === 'group-dm' || channel.is_im || channel.is_mpim) {
        prettyPrint('[ChannelDetail] Triggering DM refresh after message deletion', null, 'cyan');
        triggerSlackDirectMessagesRefresh();
      }
    } catch (err: any) {
      prettyPrint('Failed to delete message:', err, 'red');
      setError(err.message || 'Failed to delete message');
    } finally {
      setMessageToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  const handleReactClick = (event: React.MouseEvent<HTMLElement>, ts: string) => {
    setEmojiPickerAnchor(event.currentTarget);
    setMessageToReact(ts);
  };

  const handleEmojiSelect = async (emojiName: string) => {
    if (!messageToReact) return;

    try {
      setError(null);

      const response = await apiClient.slackAddReaction({
        channel: channelId,
        timestamp: messageToReact,
        name: emojiName,
      });

      const data = typeof response === 'string' ? JSON.parse(response) : response;

      prettyPrint('[ChannelDetail] Reaction added:', data, 'green');

      if (!data.ok) {
        throw new Error(data.error || 'Failed to add reaction');
      }

      // Reload messages to show the new reaction
      await loadMessages();
    } catch (err: any) {
      prettyPrint('Failed to add reaction:', err, 'red');
      setError(err.message || 'Failed to add reaction');
    } finally {
      setEmojiPickerAnchor(null);
      setMessageToReact(null);
    }
  };

  const handleReactionClick = async (ts: string, emojiName: string, isAdding: boolean) => {
    try {
      setError(null);

      const apiMethod = isAdding ? 'slackAddReaction' : 'slackRemoveReaction';
      const response = await apiClient[apiMethod]({
        channel: channelId,
        timestamp: ts,
        name: emojiName,
      });

      const data = typeof response === 'string' ? JSON.parse(response) : response;

      prettyPrint(`[ChannelDetail] Reaction ${isAdding ? 'added' : 'removed'}:`, data, 'green');

      if (!data.ok) {
        throw new Error(data.error || `Failed to ${isAdding ? 'add' : 'remove'} reaction`);
      }

      // Reload messages to update reactions
      await loadMessages();
    } catch (err: any) {
      prettyPrint(`Failed to ${isAdding ? 'add' : 'remove'} reaction:`, err, 'red');
      setError(err.message || `Failed to ${isAdding ? 'add' : 'remove'} reaction`);
    }
  };

  const handleEditClick = (ts: string, text: string) => {
    setMessageToEdit({ ts, text });
    setEditDialogOpen(true);
  };

  const handleEditSave = async (text: string, html: string) => {
    if (!messageToEdit) return;

    try {
      setError(null);

      // Convert HTML to Slack mrkdwn format
      const mrkdwn = htmlToSlackMrkdwn(html);

      prettyPrint('[ChannelDetail] Updating message:', { html, mrkdwn }, 'blue');

      const response = await apiClient.slackUpdateMessage({
        channel: channelId,
        ts: messageToEdit.ts,
        text: mrkdwn,
        blocks: [], // Empty blocks for text-only messages
      });

      const data = typeof response === 'string' ? JSON.parse(response) : response;

      prettyPrint('[ChannelDetail] Message updated:', data, 'green');

      if (!data.ok) {
        throw new Error(data.error || 'Failed to update message');
      }

      // Reload messages to show the updated message
      await loadMessages();
      setEditDialogOpen(false);
      setMessageToEdit(null);
    } catch (err: any) {
      prettyPrint('Failed to update message:', err, 'red');
      throw err; // Re-throw so MessageEditDialog can handle the error state
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setMessageToEdit(null);
  };

  const handleForwardClick = (text: string) => {
    setMessageToForward(text);
    setForwardDialogOpen(true);
  };

  const handleForwardMessage = async (channelIds: string[], additionalMessage: string) => {
    if (!messageToForward) return;

    try {
      setError(null);

      prettyPrint('[ChannelDetail] Forwarding message to channels:', channelIds, 'blue');

      // Send the message to each selected channel
      const forwardPromises = channelIds.map(async (targetChannelId) => {
        // Build the message text
        let messageText = messageToForward;
        if (additionalMessage) {
          messageText = `${additionalMessage}\n\n${messageToForward}`;
        }

        const response = await apiClient.slackPostMessage({
          channel: targetChannelId,
          text: messageText,
        });

        const data = typeof response === 'string' ? JSON.parse(response) : response;

        if (!data.ok) {
          throw new Error(`Failed to forward to channel ${targetChannelId}: ${data.error}`);
        }

        return data;
      });

      await Promise.all(forwardPromises);

      prettyPrint('[ChannelDetail] Message forwarded successfully', null, 'green');
    } catch (err: any) {
      prettyPrint('Failed to forward message:', err, 'red');
      setError(err.message || 'Failed to forward message');
      throw err; // Re-throw so dialog can handle the error
    }
  };

  const handleForwardCancel = () => {
    setForwardDialogOpen(false);
    setMessageToForward(null);
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(parseFloat(ts) * 1000);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      {/* Channel Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          {channel?.name ? `# ${channel.name}` : 'Channel'}
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Messages List */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        {loading ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            p: 4,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}>
            <CircularProgress size={30} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{
            textAlign: 'center',
            p: 4,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet. Be the first to send a message!
            </Typography>
          </Box>
        ) : (
          <Box>
            {messages.map((message, index) => (
              <React.Fragment key={message.ts}>
                <MessageItem
                  message={message}
                  currentUserId={currentSlackUserId || undefined}
                  formatTimestamp={formatTimestamp}
                  onReact={(event) => handleReactClick(event, message.ts)}
                  onForward={() => handleForwardClick(message.text)}
                  onEdit={() => handleEditClick(message.ts, message.text)}
                  onDelete={() => handleDeleteClick(message.ts)}
                  onReactionClick={(emojiName, isAdding) =>
                    handleReactionClick(message.ts, emojiName, isAdding)
                  }
                  onMore={() => prettyPrint('More actions:', message.ts, 'blue')}
                />
                {index < messages.length - 1 && (
                  <Box
                    sx={{
                      height: '1px',
                      backgroundColor: selectedAccentColor,
                      opacity: 0.2,
                      my: 1,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Message Editor */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <MessageEditor
          placeholder={`Message # ${channel?.name || 'channel'}`}
          onSend={handleSendMessage}
          disabled={loading}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Press Enter to send, Shift+Enter for new line
        </Typography>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <DialogTitle id="delete-dialog-title">Delete Message?</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this message? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Message Dialog */}
      <MessageEditDialog
        open={editDialogOpen}
        initialText={messageToEdit?.text || ''}
        onClose={handleEditCancel}
        onSave={handleEditSave}
      />

      {/* Forward Message Dialog */}
      <MessageForwardDialog
        open={forwardDialogOpen}
        messageText={messageToForward || ''}
        onClose={handleForwardCancel}
        onForward={handleForwardMessage}
        apiClient={apiClient}
        userProfilesCache={userProfilesCache.current}
      />

      {/* Emoji Picker */}
      <EmojiPicker
        anchorEl={emojiPickerAnchor}
        onSelect={handleEmojiSelect}
        onClose={() => {
          setEmojiPickerAnchor(null);
          setMessageToReact(null);
        }}
      />
    </Box>
  );
};

export default ChannelDetail;
