/**
 * ShareToSlackPanel2 - Simplified version using new API layer
 * Handles sending messages and creating channel links
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { prettyPrint } from '../../utilities/prettyPrint';
import { htmlToSlackMrkdwn } from '../../utilities/slackFormatConverter';

import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';

import ContentEditableEditor from './ContentEditableEditor';

import { APIClient } from '../../brideDesignPattern/apiInterface';
import { useStore } from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

import { postMessage } from '../../slack/api/messageApi';
import { createChannelLink, openDMConversation } from '../../slack/api/channelApi';
import { listUsers } from '../../slack/api/userApi';

interface ShareToSlackPanel2Props {
  onClose: () => void;
  apiClient: APIClient;
  selectedRows: any[];
  objectName: string;
  allChannels?: any[];
  onSuccess?: () => void; // Callback to refresh parent
}

interface SlackChannel {
  label: string;
  id: string;
  name?: string;
  is_private?: boolean;
  is_member?: boolean;
  is_im?: boolean;
  isUser?: boolean;
  user_profile?: {
    real_name?: string;
    display_name?: string;
  };
}

const ShareToSlackPanel2: React.FC<ShareToSlackPanel2Props> = ({
  onClose,
  apiClient,
  selectedRows,
  objectName,
  allChannels = [],
  onSuccess,
}) => {
  const theme = useTheme();
  const [channels] = useState<SlackChannel[]>(allChannels);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<SlackChannel | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get record context from store - derive from selectedSlackRow
  const { selectedSlackRow, selectedObject } = useStore(
    useShallow((state) => ({
      selectedSlackRow: state.selectedSlackRow,
      selectedObject: state.selectedObject,
    }))
  );

  // Derive record info from selectedSlackRow
  const recordInfo = React.useMemo(() => {
    const row = selectedRows.length > 0 ? selectedRows[0] : selectedSlackRow;
    if (!row) return null;

    return {
      recordId: row.Id || '',
      objectType: (selectedObject as any)?.qualifiedApiName || (selectedObject as any)?.QualifiedApiName || (selectedObject as any)?.apiName || '',
      recordName: row.Name || '',
    };
  }, [selectedRows, selectedSlackRow, selectedObject]);

  // Load users when input starts with @
  useEffect(() => {
    const loadUsers = async () => {
      if (inputValue.startsWith('@') && allUsers.length === 0) {
        try {
          setFetchingUsers(true);
          prettyPrint('[ShareToSlackPanel2] Loading users', null, 'blue');

          const users = await listUsers(apiClient);
          setAllUsers(users);
        } catch (err: any) {
          prettyPrint('[ShareToSlackPanel2] Failed to load users:', err, 'red');
        } finally {
          setFetchingUsers(false);
        }
      }
    };

    loadUsers();
  }, [inputValue, allUsers.length, apiClient]);

  // Handle send
  const handleSend = async () => {
    if (!selectedChannel || !message.trim()) {
      setError('Please select a channel or user and enter a message');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let channelId = selectedChannel.id;
      let channelName = selectedChannel.name || 'Unknown';

      // If it's a user (DM), open the conversation first
      if ((selectedChannel as any).isUser) {
        prettyPrint('[ShareToSlackPanel2] Opening DM with user:', selectedChannel.id, 'blue');

        channelId = await openDMConversation(apiClient, selectedChannel.id);

        // Get channel name from user profile
        const userProfile = selectedChannel.user_profile;
        channelName = userProfile?.display_name || userProfile?.real_name || selectedChannel.name || 'Unknown User';

        prettyPrint('[ShareToSlackPanel2] DM channel ID:', channelId, 'blue');
      }

      // Convert HTML to Slack markdown
      const slackMrkdwn = htmlToSlackMrkdwn(message);

      // Append record URL
      let finalMessage = slackMrkdwn;
      if (selectedRows.length === 1) {
        const recordId = selectedRows[0].Id;
        if (recordId) {
          const recordUrl = `${window.location.origin}/lightning/r/${objectName}/${recordId}/view`;
          finalMessage = `${slackMrkdwn}\n\n🔗 View in Salesforce: ${recordUrl}`;
        }
      } else if (selectedRows.length > 1) {
        finalMessage += '\n\n';
        selectedRows.slice(0, 10).forEach((row, index) => {
          const recordId = row.Id;
          if (recordId) {
            const recordUrl = `${window.location.origin}/lightning/r/${objectName}/${recordId}/view`;
            finalMessage += `🔗 ${index + 1}. ${recordUrl}\n`;
          }
        });
      }

      // Send the message
      prettyPrint('[ShareToSlackPanel2] Sending message to:', channelId, 'blue');
      await postMessage(apiClient, channelId, finalMessage);

      // Create channel link if we have record context
      if (recordInfo?.recordId && recordInfo?.objectType && recordInfo?.recordName) {
        try {
          prettyPrint('[ShareToSlackPanel2] Creating channel link', null, 'blue');

          await createChannelLink(apiClient, {
            recordId: recordInfo.recordId,
            objectType: recordInfo.objectType,
            recordName: recordInfo.recordName,
            channelId: channelId,
            channelName: channelName,
            isPrimary: false,
            linkType: 'Auto-Created',
          });
        } catch (linkError: any) {
          prettyPrint('[ShareToSlackPanel2] Failed to create link:', linkError, 'red');
          // Don't fail the whole operation
        }
      }

      setSuccess(true);

      // Trigger parent refresh if callback provided
      if (onSuccess) {
        prettyPrint('[ShareToSlackPanel2] Triggering parent refresh', null, 'blue');
        onSuccess();
      }

      // Close after delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      prettyPrint('[ShareToSlackPanel2] Failed to send message:', err, 'red');
      setError(`Failed to send message: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Prepare autocomplete options
  const autocompleteOptions = [
    ...channels.map(ch => ({
      ...ch,
      label: ch.name ? `# ${ch.name}` : 'Unknown Channel',
    })),
    ...allUsers.map(user => ({
      id: user.id,
      name: user.profile.display_name || user.profile.real_name || user.name,
      label: `@ ${user.profile.display_name || user.profile.real_name || user.name}`,
      isUser: true,
      user_profile: user.profile,
    })),
  ];

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
    }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid rgba(0,0,0,0.12)',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Typography variant="h6">Share to Slack</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{
        flex: 1,
        p: 2,
        overflow: 'auto',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}>
        {success ? (
          <Alert severity="success">Message sent successfully!</Alert>
        ) : (
          <>
            {/* Channel/User selector */}
            <Autocomplete
              options={autocompleteOptions}
              value={selectedChannel}
              onChange={(_, newValue) => setSelectedChannel(newValue)}
              inputValue={inputValue}
              onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
              loading={fetchingUsers}
              getOptionLabel={(option) => option.label || ''}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Channel or Person"
                  placeholder="Search channels or type @ for people"
                  fullWidth
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                  }}
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
              PaperComponent={(props) => (
                <Paper {...props} elevation={8} />
              )}
              sx={{ mb: 2 }}
            />

            {/* Message editor */}
            <ContentEditableEditor
              value={message}
              onChange={setMessage}
              placeholder="Write a message..."
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </Box>

      {/* Footer */}
      {!success && (
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid rgba(0,0,0,0.12)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}
        >
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSend}
            disabled={loading || !selectedChannel || !message.trim()}
          >
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ShareToSlackPanel2;
