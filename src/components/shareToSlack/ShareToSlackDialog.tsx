import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SlackIconComponent from '../appGridAuraComponent/SlackIconComponent';
import { APIClient } from '../../brideDesignPattern/apiInterface';

interface ShareToSlackDialogProps {
  open: boolean;
  onClose: () => void;
  apiClient: APIClient;
  selectedRows: any[];
  objectName: string;
}

interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_member: boolean;
  num_members?: number;
}

const ShareToSlackDialog: React.FC<ShareToSlackDialogProps> = ({
  open,
  onClose,
  apiClient,
  selectedRows,
  objectName,
}) => {
  const theme = useTheme();
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<SlackChannel | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadChannels = useCallback(async () => {
    try {
      setChannelsLoading(true);
      setError(null);

      // Fetch conversations (channels) from Slack
      const response = await apiClient.slackListConversations({
        types: 'public_channel,private_channel',
        exclude_archived: true,
        limit: 200,
      });

      const data = typeof response === 'string' ? JSON.parse(response) : response;

      if (!data.ok) {
        throw new Error(data.error || 'Failed to load channels');
      }

      setChannels(data.channels || []);
    } catch (err: any) {
      console.error('Failed to load Slack channels:', err);
      setError(`Failed to load channels: ${err.message || 'Unknown error'}`);
    } finally {
      setChannelsLoading(false);
    }
  }, [apiClient]);

  const generateDefaultMessage = useCallback(() => {
    if (selectedRows.length === 0) {
      setMessage('');
      return;
    }

    if (selectedRows.length === 1) {
      const row = selectedRows[0];
      const recordName = row.Name || row.Id || 'Record';
      const recordId = row.Id || '';

      // Generate a simple message with key fields
      let msg = `📋 *${objectName}*: ${recordName}\n`;

      // Add a few key fields (limit to avoid overwhelming)
      const fieldsToShow = Object.keys(row)
        .filter(key =>
          !key.startsWith('_') &&
          key !== 'Id' &&
          key !== 'Name' &&
          row[key] !== null &&
          row[key] !== undefined &&
          typeof row[key] !== 'object'
        )
        .slice(0, 5);

      if (fieldsToShow.length > 0) {
        msg += '\n';
        fieldsToShow.forEach(field => {
          msg += `• ${field}: ${row[field]}\n`;
        });
      }

      if (recordId) {
        // Use proper Salesforce Lightning URL format: /lightning/r/ObjectName/RecordId/view
        msg += `\n🔗 View in Salesforce: ${window.location.origin}/lightning/r/${objectName}/${recordId}/view`;
      }

      setMessage(msg);
    } else {
      // Multiple records
      let msg = `📋 *${selectedRows.length} ${objectName} Records*\n\n`;

      selectedRows.slice(0, 10).forEach((row, index) => {
        const recordName = row.Name || row.Id || `Record ${index + 1}`;
        const recordId = row.Id || '';
        if (recordId) {
          // Use proper Salesforce Lightning URL format: /lightning/r/ObjectName/RecordId/view
          msg += `${index + 1}. ${recordName}\n   🔗 ${window.location.origin}/lightning/r/${objectName}/${recordId}/view\n`;
        } else {
          msg += `${index + 1}. ${recordName}\n`;
        }
      });

      if (selectedRows.length > 10) {
        msg += `\n... and ${selectedRows.length - 10} more`;
      }

      setMessage(msg);
    }
  }, [selectedRows, objectName]);

  // Load channels when dialog opens
  useEffect(() => {
    if (open) {
      loadChannels();
      generateDefaultMessage();
      setSuccess(false);
      setError(null);
    }
  }, [open, loadChannels, generateDefaultMessage]);

  const handleSend = async () => {
    if (!selectedChannel || !message.trim()) {
      setError('Please select a channel and enter a message');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Send message to Slack
      const response = await apiClient.slackPostMessage({
        channel: selectedChannel.id,
        text: message,
      });

      const data = typeof response === 'string' ? JSON.parse(response) : response;

      if (!data.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);

      // Close dialog after a brief delay
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to send message to Slack:', err);
      setError(`Failed to send message: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedChannel(null);
    setMessage('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'transparent',
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Box display="flex" alignItems="center" gap={1} sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}>
          <SlackIconComponent width={32} height={32} />
          <Typography variant="h6">Share to Slack</Typography>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>
          {/* Selected Records Summary */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Sharing {selectedRows.length} {objectName} {selectedRows.length === 1 ? 'record' : 'records'}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>
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

          {/* Channel Selection */}
          <Autocomplete
            options={channels}
            getOptionLabel={(option) =>
              `${option.is_private ? '🔒' : '#'} ${option.name}${!option.is_member ? ' (not a member)' : ''}`
            }
            value={selectedChannel}
            onChange={(_, newValue) => setSelectedChannel(newValue)}
            loading={channelsLoading}
            disabled={loading || success}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Channel"
                placeholder="Choose a Slack channel"
                required
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {channelsLoading ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                }}>
                  <Typography variant="body2">
                    {option.is_private ? '🔒 ' : '# '}
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.num_members ? `${option.num_members} members` : ''}
                    {!option.is_member && ' • Not a member'}
                  </Typography>
                </Box>
              </li>
            )}
          />

          {/* Message Input */}
          <TextField
            label="Message"
            multiline
            rows={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message..."
            required
            disabled={loading || success}
            helperText="Tip: Use Slack markdown formatting (*bold*, _italic_, `code`)"
            sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}
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
              Message sent successfully to #{selectedChannel?.name}!
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={!selectedChannel || !message.trim() || loading || success}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Sending...' : 'Send to Slack'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareToSlackDialog;
