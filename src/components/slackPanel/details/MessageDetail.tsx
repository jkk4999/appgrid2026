import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ForwardIcon from '@mui/icons-material/Forward';
import CloseIcon from '@mui/icons-material/Close';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { prettyPrint } from '../../../utilities/prettyPrint';
import { useStore } from '../../../zustandStore';
import { htmlToSlackMrkdwn, slackBlocksToHtml, slackMrkdwnToHtml } from '../../../utilities/slackFormatConverter';
import { slackCache } from '../../../utilities/slackCache';
import { useShallow } from 'zustand/react/shallow';
import MessageForwardDialog from '../components/MessageForwardDialog';

interface MessageDetailProps {
  channelId: string;
  channel?: any;
  message?: any;
  apiClient?: any;
  currentUserId?: string;
  recordId?: any;
  onClose?: () => void;
}

interface Message {
  type: string;
  user?: string;
  text?: string;
  blocks?: any[];
  ts: string;
  bot_id?: string;
  userName?: string;
  userInitial?: string;
}

/**
 * Message detail view for center panel
 * Shows DM conversation history with a user
 */
const MessageDetail: React.FC<MessageDetailProps> = ({ channelId, channel, apiClient, currentUserId, onClose }) => {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [userCache, setUserCache] = useState<Map<string, { name: string; initial: string }>>(new Map());
  const [hoveredMessageTs, setHoveredMessageTs] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const [editingMessageTs, setEditingMessageTs] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const inlineEditorRefs = useRef<Map<string, Quill>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Get record ID from store to include in messages
  const { slackPanelRecordId, triggerSlackChannelsRefresh } = useStore(
    useShallow((state) => ({
      slackPanelRecordId: state.slackPanelRecordId,
      triggerSlackChannelsRefresh: state.triggerSlackChannelsRefresh,
    }))
  );

  const displayName =
    channel?.user_profile?.display_name ||
    channel?.user_profile?.real_name ||
    channel?.user?.name ||
    channel?.name ||
    'User';

  // Initialize Quill editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Guard against double initialization
    if (quillRef.current) return;

    // Additional guard: check if Quill was already initialized on this element
    if (editorRef.current.classList.contains('ql-container')) return;

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder: `Message ${displayName}`,
      modules: {
        toolbar: {
          container: [
            [{ header: [1, 2, 3, false] }],
            [{ size: ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
            ['clean'],
            ['attach-file'], // Custom button for file upload
          ],
          handlers: {
            'attach-file': () => {
              // Trigger file input click
              fileInputRef.current?.click();
            },
          },
        },
      },
    });

    // Add custom button icon and tooltips to toolbar after Quill initialization
    const toolbar = quill.getModule('toolbar') as { container: HTMLElement } | null;

    // Add custom attach file button icon
    const attachButton = toolbar?.container.querySelector('.ql-attach-file');
    if (attachButton) {
      // Paperclip icon for file attachment
      attachButton.innerHTML = '<svg viewBox="0 0 18 18"><path class="ql-stroke" d="M14,9c0,3-2.5,5.5-5.5,5.5S3,12,3,9c0-3,2.5-5.5,5.5-5.5S14,6,14,9z M8.5,14.5c3,0,5.5-2.5,5.5-5.5s-2.5-5.5-5.5-5.5S3,6,3,9s2.5,5.5,5.5,5.5z M12,4.5c0.5,0.5,0.5,1.5,0,2L6.5,12c-0.5,0.5-1.5,0.5-2,0c-0.5-0.5-0.5-1.5,0-2L10,4.5C10.5,4,11.5,4,12,4.5z"></path></svg>';
      attachButton.setAttribute('title', 'Attach file');
    }

    // Add tooltips to all toolbar buttons
    const tooltips: { [key: string]: string } = {
      '.ql-bold': 'Bold',
      '.ql-italic': 'Italic',
      '.ql-underline': 'Underline',
      '.ql-strike': 'Strikethrough',
      '.ql-header[value="1"]': 'Heading 1',
      '.ql-header[value="2"]': 'Heading 2',
      '.ql-header[value="3"]': 'Heading 3',
      '.ql-size[value="small"]': 'Small',
      '.ql-size[value="large"]': 'Large',
      '.ql-size[value="huge"]': 'Huge',
      '.ql-list[value="ordered"]': 'Numbered list',
      '.ql-list[value="bullet"]': 'Bulleted list',
      '.ql-indent[value="-1"]': 'Decrease indent',
      '.ql-indent[value="+1"]': 'Increase indent',
      '.ql-color': 'Text color',
      '.ql-background': 'Background color',
      '.ql-align': 'Text align',
      '.ql-clean': 'Remove formatting',
    };

    Object.entries(tooltips).forEach(([selector, title]) => {
      const button = toolbar?.container.querySelector(selector);
      if (button) {
        button.setAttribute('title', title);
      }
    });

    quillRef.current = quill;

    // Handle Enter key to send
    quill.keyboard.addBinding({
      key: 'Enter',
      handler: () => {
        const text = quill.getText().trim();
        if (text) {
          handleSendMessage();
        }
        return false;
      },
    });

    return () => {
      // Properly cleanup Quill instance
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove displayName dependency to only initialize once

  // Load messages when component mounts or channelId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!apiClient || !channelId) {
        setError('Missing API client or channel ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Use cached conversation history (limit to 20 for better performance)
        const data = await slackCache.getConversationHistory(channelId, apiClient, 20);

        prettyPrint('[MessageDetail] Messages loaded:', data, 'blue');

        // DEBUG: Log the first message to see its structure
        if (data.messages && data.messages.length > 0) {
          prettyPrint('[MessageDetail] FIRST MESSAGE STRUCTURE:', data.messages[0], 'magenta');
          prettyPrint('[MessageDetail] First message text field:', data.messages[0].text, 'magenta');
          prettyPrint('[MessageDetail] First message blocks field:', data.messages[0].blocks, 'magenta');
        }

        if (!data.ok) {
          throw new Error(data.error || 'Failed to load messages');
        }

        // Reverse to show oldest first
        const messagesArray = data.messages || [];
        const reversedMessages = messagesArray.reverse();

        // Fetch user information for each message
        const uniqueUserIds: string[] = Array.from(new Set(reversedMessages.map((m: any) => m.user).filter(Boolean) as string[]));
        const newUserCache = new Map(userCache);

        for (const userId of uniqueUserIds) {
          if (!newUserCache.has(userId)) {
            try {
              const userResponse = await apiClient.slackGetUserProfile({ userId: userId });
              const userData = typeof userResponse === 'string' ? JSON.parse(userResponse) : userResponse;

              if (userData.ok && userData.user) {
                const userName = userData.user.profile?.display_name || userData.user.profile?.real_name || userData.user.name || userId;
                newUserCache.set(userId, {
                  name: userName,
                  initial: userName.charAt(0).toUpperCase(),
                });
              }
            } catch (err) {
              prettyPrint(`Failed to fetch user ${userId}:`, err, 'red');
              newUserCache.set(userId, {
                name: userId,
                initial: 'U',
              });
            }
          }
        }

        setUserCache(newUserCache);
        setMessages(reversedMessages);

        // Scroll to bottom
        setTimeout(() => {
          if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
          }
        }, 100);

        setLoading(false);
      } catch (err: any) {
        prettyPrint('Failed to load messages:', err, 'red');
        setError(`Failed to load messages: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiClient, channelId]);

  const handleSendMessage = async () => {
    if (!quillRef.current || !apiClient) return;

    const text = quillRef.current.getText().trim();
    // Allow sending if there's text OR files
    if (!text && attachedFiles.length === 0) return;

    try {
      setSending(true);

      // Get the HTML content from Quill editor and convert to Slack mrkdwn
      const htmlContent = quillRef.current.root.innerHTML;
      const slackText = htmlToSlackMrkdwn(htmlContent);

      // Include record ID SEPARATELY for search-based discovery
      // Append on new line so it won't interfere with formatting
      const textWithRecordId = slackPanelRecordId
        ? `${slackText}\n\n${slackPanelRecordId}`
        : slackText;

      prettyPrint('[MessageDetail] Sending message:', { html: htmlContent, mrkdwn: textWithRecordId }, 'blue');

      // If files are attached, use the file upload API
      if (attachedFiles.length > 0) {
        prettyPrint('[MessageDetail] Sending message with files:', attachedFiles.length, 'blue');

        // Import the postMessageWithFiles function
        const { postMessageWithFiles } = await import('../../../slack/api/messageApi');
        await postMessageWithFiles(apiClient, channelId, textWithRecordId, attachedFiles);

        prettyPrint('[MessageDetail] Message with files sent successfully', null, 'green');

        // Note: Message will appear on next load/refresh
        // We can't easily reload here as loadMessages is inside a useEffect
      } else {
        // Regular text message
        const response = await apiClient.slackPostMessage({
          channel: channelId,
          text: textWithRecordId,
        });

        const data = typeof response === 'string' ? JSON.parse(response) : response;

        prettyPrint('[MessageDetail] Message sent:', data, 'blue');

        if (!data.ok) {
          throw new Error(data.error || 'Failed to send message');
        }

        // Add the new message to the list
        // Use the message from Slack's response which will have blocks
        setMessages((prev) => [
          ...prev,
          {
            type: 'message',
            user: data.message.user,
            text: data.message.text || textWithRecordId,
            blocks: data.message.blocks,
            ts: data.message.ts,
          },
        ]);
      }

      // Clear the editor and files
      quillRef.current.setText('');
      setAttachedFiles([]);

      // Invalidate cache for this channel since we just posted a message
      slackCache.invalidateChannel(channelId);

      // Scroll to bottom
      setTimeout(() => {
        if (messageListRef.current) {
          messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
      }, 100);

      // Trigger refresh of the DM list in HomeView
      triggerSlackChannelsRefresh();

      setSending(false);
    } catch (err: any) {
      prettyPrint('Failed to send message:', err, 'red');
      setError(`Failed to send message: ${err.message || 'Unknown error'}`);
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
      prettyPrint(`[MessageDetail] Added ${newFiles.length} file(s)`, newFiles.map(f => f.name), 'blue');
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(parseFloat(ts) * 1000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
             ' ' +
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Hover action handlers
  const handleEditMessage = (message: Message) => {
    prettyPrint('[MessageDetail] Edit message clicked:', message.ts, 'blue');
    setEditingMessageTs(message.ts);
    setHoveredMessageTs(null); // Hide hover menu when editing
  };

  const handleSaveEdit = async (message: Message) => {
    const editor = inlineEditorRefs.current.get(message.ts);
    if (!editor || !apiClient) return;

    try {
      setSaving(true);
      setError(null);

      const editedText = editor.getText().trim();

      if (!editedText) {
        setError('Message cannot be empty');
        setSaving(false);
        return;
      }

      prettyPrint('[MessageDetail] Saving edited message:', {
        channelId,
        ts: message.ts,
        originalText: message.text,
        newText: editedText,
      }, 'blue');

      // Call Slack API to update the message
      const response = await apiClient.slackUpdateMessage({
        channel: channelId,
        ts: message.ts,
        text: editedText,
      });

      const data = typeof response === 'string' ? JSON.parse(response) : response;

      prettyPrint('[MessageDetail] Update response:', data, 'blue');

      if (!data.ok) {
        throw new Error(data.error || 'Failed to update message');
      }

      // Update the message in local state
      setMessages((prev) =>
        prev.map((m) => (m.ts === message.ts ? { ...m, text: editedText } : m))
      );

      // Invalidate cache for this channel
      slackCache.invalidateChannel(channelId);

      // Cleanup
      const editorInstance = inlineEditorRefs.current.get(message.ts);
      if (editorInstance) {
        inlineEditorRefs.current.delete(message.ts);
      }

      setEditingMessageTs(null);
      setSaving(false);
    } catch (err: any) {
      prettyPrint('Failed to update message:', err, 'red');
      setError(`Failed to update message: ${err.message || 'Unknown error'}`);
      setSaving(false);
    }
  };

  const handleCancelEdit = (messageTs: string) => {
    prettyPrint('[MessageDetail] Cancel edit for message:', messageTs, 'blue');

    // Cleanup Quill editor
    const editorInstance = inlineEditorRefs.current.get(messageTs);
    if (editorInstance) {
      inlineEditorRefs.current.delete(messageTs);
    }

    setEditingMessageTs(null);
    setError(null);
  };

  const handleDeleteMessage = (message: Message) => {
    prettyPrint('[MessageDetail] Delete message clicked:', message.ts, 'blue');
    setMessageToDelete(message);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!messageToDelete || !apiClient) return;

    try {
      setDeleting(true);
      setError(null);

      prettyPrint('[MessageDetail] Deleting message:', {
        channelId,
        ts: messageToDelete.ts,
      }, 'blue');

      // Call Slack API to delete the message
      const response = await apiClient.slackDeleteMessage({
        channel: channelId,
        ts: messageToDelete.ts,
      });

      const data = typeof response === 'string' ? JSON.parse(response) : response;

      prettyPrint('[MessageDetail] Delete response:', data, 'blue');

      if (!data.ok) {
        throw new Error(data.error || 'Failed to delete message');
      }

      // Remove the message from local state
      setMessages((prev) => prev.filter((m) => m.ts !== messageToDelete.ts));

      // Invalidate cache for this channel
      slackCache.invalidateChannel(channelId);

      // Check if there are any remaining messages
      const remainingMessages = messages.filter((m) => m.ts !== messageToDelete.ts);
      prettyPrint('[MessageDetail] Remaining messages after delete:', remainingMessages.length, 'blue');

      // If no more messages, trigger refresh of DM/Home views and close detail view
      if (remainingMessages.length === 0) {
        prettyPrint('[MessageDetail] No more messages in conversation, triggering refresh and closing', null, 'blue');
        triggerSlackChannelsRefresh();

        // Close the MessageDetail view after a short delay to allow state updates
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 100);
      }

      // Close dialog and reset
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
      setDeleting(false);
    } catch (err: any) {
      prettyPrint('Failed to delete message:', err, 'red');
      setError(`Failed to delete message: ${err.message || 'Unknown error'}`);
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  const handleForwardMessage = (message: Message) => {
    prettyPrint('[MessageDetail] Forward message clicked:', message.ts, 'blue');
    setMessageToForward(message);
    setForwardDialogOpen(true);
  };

  const handleForwardConfirm = async (channelIds: string[], additionalMessage: string) => {
    if (!messageToForward || !apiClient) return;

    try {
      prettyPrint('[MessageDetail] Forwarding message to channels:', {
        channelIds,
        originalMessage: messageToForward.text,
        additionalMessage,
      }, 'blue');

      // Forward message to each selected channel
      for (const targetChannelId of channelIds) {
        // Build the forwarded message text
        let forwardedText = messageToForward.text || '';

        // Add additional message if provided
        if (additionalMessage) {
          forwardedText = `${additionalMessage}\n\n${forwardedText}`;
        }

        // Include record ID if available
        const textWithRecordId = slackPanelRecordId
          ? `${forwardedText}\n\n${slackPanelRecordId}`
          : forwardedText;

        const response = await apiClient.slackPostMessage({
          channel: targetChannelId,
          text: textWithRecordId,
        });

        const data = typeof response === 'string' ? JSON.parse(response) : response;

        prettyPrint('[MessageDetail] Forward response:', data, 'blue');

        if (!data.ok) {
          throw new Error(data.error || 'Failed to forward message');
        }
      }

      // Invalidate cache for forwarded channels
      channelIds.forEach(channelId => slackCache.invalidateChannel(channelId));

      // Trigger refresh
      triggerSlackChannelsRefresh();

      prettyPrint('[MessageDetail] Message forwarded successfully', null, 'green');
    } catch (err: any) {
      prettyPrint('Failed to forward message:', err, 'red');
      throw err; // Let the dialog handle the error
    }
  };

  const handleForwardCancel = () => {
    setForwardDialogOpen(false);
    setMessageToForward(null);
  };

  if (!apiClient) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Alert severity="error">API client not available</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      {/* Header */}
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
          {displayName}
        </Typography>
      </Box>

      {/* Messages Area */}
      <Box
        ref={messageListRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        {loading && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            p: 4,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && messages.length === 0 && (
          <Box sx={{
            textAlign: 'center',
            p: 4,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        )}

        {!loading &&
          messages.map((message, index) => {
            // Determine if this message was sent by the current user or the other person
            const isCurrentUser = currentUserId && message.user === currentUserId;

            // Get user info from userCache for the message sender
            const userInfo = message.user ? userCache.get(message.user) : null;

            // Use appropriate name based on who sent the message
            let userName: string;
            let userInitial: string;

            if (isCurrentUser) {
              // Message from current user - use their name from userCache
              userName = userInfo?.name || 'You';
              userInitial = userInfo?.initial || 'Y';
            } else {
              // Message from the other person - use the channel's display name
              userName = displayName;
              userInitial = displayName.charAt(0).toUpperCase();
            }

            return (
              <Box
                key={message.ts || index}
                onMouseEnter={() => setHoveredMessageTs(message.ts)}
                onMouseLeave={() => setHoveredMessageTs(null)}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  position: 'relative',
                  borderRadius: 1,
                  p: 1,
                  ml: -1,
                  mr: -1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'primary.main',
                    fontSize: '0.875rem',
                    flexShrink: 0,
                  }}
                >
                  {userInitial}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTimestamp(message.ts)}
                    </Typography>
                  </Box>
                  {/* Conditionally render editor or message text */}
                  {editingMessageTs === message.ts ? (
                    <Box>
                      {/* Inline Quill Editor */}
                      <Box
                        ref={(el: HTMLDivElement | null) => {
                          if (el && !inlineEditorRefs.current.has(message.ts)) {
                            // Initialize Quill for this message
                            const editorElement = el;
                            setTimeout(() => {
                              if (editorElement && !inlineEditorRefs.current.has(message.ts)) {
                                try {
                                  const quill = new Quill(editorElement, {
                                    theme: 'snow',
                                    placeholder: 'Edit your message...',
                                    modules: {
                                      toolbar: [
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ list: 'ordered' }, { list: 'bullet' }],
                                        ['blockquote', 'code-block'],
                                        ['link'],
                                      ],
                                    },
                                  });

                                  // Set initial content
                                  quill.setText(message.text || '');
                                  quill.focus();

                                  inlineEditorRefs.current.set(message.ts, quill);
                                  prettyPrint('[MessageDetail] Initialized inline editor for message:', message.ts, 'green');
                                } catch (err) {
                                  prettyPrint('[MessageDetail] Failed to initialize inline editor:', err, 'red');
                                }
                              }
                            }, 0);
                          }
                        }}
                        sx={{
                          minHeight: 120,
                          border: '1px solid',
                          borderColor: 'primary.main',
                          borderRadius: 1,
                          backgroundColor: 'background.paper',
                          mb: 1,
                          '& .ql-editor': {
                            minHeight: 100,
                            fontSize: '0.875rem',
                          },
                          '& .ql-toolbar': {
                            borderTopLeftRadius: 4,
                            borderTopRightRadius: 4,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          },
                          '& .ql-container': {
                            borderBottomLeftRadius: 4,
                            borderBottomRightRadius: 4,
                            border: 'none',
                          },
                        }}
                      />

                      {/* Save/Cancel Buttons */}
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleSaveEdit(message)}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleCancelEdit(message.ts)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        wordBreak: 'break-word',
                        '& a': {
                          color: 'primary.main',
                          textDecoration: 'underline',
                        },
                        '& code': {
                          backgroundColor: 'rgba(0, 0, 0, 0.05)',
                          padding: '2px 4px',
                          borderRadius: '3px',
                          fontFamily: 'monospace',
                          fontSize: '0.85em',
                        },
                        '& pre': {
                          backgroundColor: 'rgba(0, 0, 0, 0.05)',
                          padding: '8px',
                          borderRadius: '4px',
                          overflow: 'auto',
                          '& code': {
                            padding: 0,
                            backgroundColor: 'transparent',
                          },
                        },
                        '& strong': {
                          fontWeight: 600,
                        },
                        '& blockquote': {
                          borderLeft: '3px solid',
                          borderColor: 'divider',
                          paddingLeft: 2,
                          marginLeft: 0,
                          fontStyle: 'italic',
                        },
                      }}
                      dangerouslySetInnerHTML={{
                        __html: message.blocks && message.blocks.length > 0
                          ? slackBlocksToHtml(message.blocks)
                          : slackMrkdwnToHtml(message.text || '')
                      }}
                    />
                  )}
                </Box>

                {/* Hover Actions Menu - Only show for current user's messages and not when editing */}
                {hoveredMessageTs === message.ts && isCurrentUser && editingMessageTs !== message.ts && (
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
                    <Tooltip title="Edit message">
                      <IconButton
                        size="small"
                        onClick={() => handleEditMessage(message)}
                        sx={{
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete message">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMessage(message)}
                        sx={{
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Forward message">
                      <IconButton
                        size="small"
                        onClick={() => handleForwardMessage(message)}
                        sx={{
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <ForwardIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                )}
              </Box>
            );
          })}
      </Box>

      {/* Message Input */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            '& .ql-container': {
              border: 'none',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
            },
            '& .ql-editor': {
              minHeight: '80px',
              maxHeight: '200px',
              overflowY: 'auto',
            },
            '& .ql-toolbar': {
              border: 'none',
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            },
          }}
        >
          <Box ref={editorRef} sx={{ width: '100%' }} />
        </Box>

        {/* File attachments display */}
        {attachedFiles.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {attachedFiles.map((file, index) => (
              <Chip
                key={`${file.name}-${index}`}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ maxWidth: 150 }} noWrap>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({formatFileSize(file.size)})
                    </Typography>
                  </Box>
                }
                size="small"
                onDelete={() => handleRemoveFile(index)}
                deleteIcon={<CloseIcon />}
                sx={{
                  maxWidth: 250,
                  '& .MuiChip-label': {
                    display: 'flex',
                    alignItems: 'center',
                  },
                }}
              />
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={sending}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&:disabled': {
                bgcolor: 'action.disabledBackground',
              },
            }}
          >
            {sending ? <CircularProgress size={20} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-message-dialog-title"
        aria-describedby="delete-message-dialog-description"
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <DialogTitle id="delete-message-dialog-title">
          Delete message?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-message-dialog-description">
            Are you sure you want to delete this message? This action cannot be undone.
          </DialogContentText>
          {messageToDelete && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: 'action.hover',
                borderLeft: 3,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {messageToDelete.text || '(No text content)'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Forward Message Dialog */}
      {messageToForward && (
        <MessageForwardDialog
          open={forwardDialogOpen}
          messageText={messageToForward.text || ''}
          onClose={handleForwardCancel}
          onForward={handleForwardConfirm}
          apiClient={apiClient}
          userProfilesCache={Object.fromEntries(userCache) as { [key: string]: any }}
        />
      )}
    </Box>
  );
};

export default MessageDetail;
