import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { prettyPrint } from '../../../utilities/prettyPrint';
import { slackCache, CACHE_TTL } from '../../../utilities/slackCache';

interface CreateChannelDialogProps {
  open: boolean;
  onClose: () => void;
  onChannelCreated: (channelId: string, channelName: string) => void;
  recordId: string;
  recordName: string;
  objectType: string;
  apiClient: any;
  currentUserId?: string; // Current Slack user ID to filter from members list
}

interface SlackUser {
  id: string;
  name: string;
  realName?: string;
}

/**
 * Dialog for creating a new Slack channel
 * Automatically links the channel to the current Salesforce record
 */
const CreateChannelDialog: React.FC<CreateChannelDialogProps> = ({
  open,
  onClose,
  onChannelCreated,
  recordId,
  recordName,
  objectType,
  apiClient,
  currentUserId
}) => {
  const theme = useTheme();
  const [channelName, setChannelName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<SlackUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<SlackUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Helper function to sanitize channel name
  const sanitizeChannelName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-') // Replace invalid chars with hyphens
      .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
      .replace(/-+/g, '-')           // Collapse multiple hyphens
      .substring(0, 80);              // Max 80 characters
  };

  // Helper function to validate channel name
  const validateChannelName = (name: string): string | null => {
    if (!name || name.trim().length === 0) {
      return 'Channel name is required';
    }
    if (!/^[a-z0-9-_]+$/.test(name)) {
      return 'Channel name can only contain lowercase letters, numbers, hyphens, and underscores';
    }
    if (name.length > 80) {
      return 'Channel name must be 80 characters or less';
    }
    if (name.startsWith('-') || name.endsWith('-')) {
      return 'Channel name cannot start or end with a hyphen';
    }
    return null;
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);

      // Use caching to avoid rate limits
      const usersCacheKey = 'slack:users-list';
      let data = slackCache.get<any>(usersCacheKey);

      if (!data) {
        prettyPrint('[CreateChannelDialog] Cache miss: Fetching users from Slack API', null, 'blue');
        const response = await apiClient.slackListUsers();
        data = typeof response === 'string' ? JSON.parse(response) : response;

        if (data.ok) {
          slackCache.set(usersCacheKey, data, CACHE_TTL.USERS_LIST);
          prettyPrint('[CreateChannelDialog] Cached users list for 10 minutes', null, 'green');
        }
      } else {
        prettyPrint('[CreateChannelDialog] Cache hit: Using cached users list', null, 'green');
      }

      prettyPrint('[CreateChannelDialog] Users loaded:', data, 'blue');

      if (data.ok && data.members) {
        const users: SlackUser[] = data.members
          .filter((m: any) =>
            !m.is_bot &&
            !m.deleted &&
            m.id !== 'USLACKBOT' &&
            m.id !== currentUserId  // Filter out the current logged-in user
          )
          .map((m: any) => ({
            id: m.id,
            name: m.profile?.display_name || m.profile?.real_name || m.name,
            realName: m.profile?.real_name,
          }));

        setAvailableUsers(users);
      }
      setLoadingUsers(false);
    } catch (err: any) {
      prettyPrint('Failed to load users:', err, 'red');
      setError(`Failed to load users: ${err.message}`);
      setLoadingUsers(false);
    }
  };

  // Load available users when dialog opens
  useEffect(() => {
    if (open) {
      loadUsers();
      // Generate default channel name from record name
      const defaultName = sanitizeChannelName(recordName);
      setChannelName(defaultName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recordName]);

  const handleCreate = async () => {
    // Validate channel name
    const validationError = validateChannelName(channelName);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Sanitize the channel name one more time before sending
      const sanitizedName = sanitizeChannelName(channelName);

      // Check if channel already exists to avoid rate limiting from conversations.create
      try {
        prettyPrint('[CreateChannelDialog] Checking if channel exists:', sanitizedName, 'blue');
        const listResponse = await apiClient.slackListConversations({
          types: isPrivate ? 'private_channel' : 'public_channel',
          limit: 1000,
        });

        const listData = typeof listResponse === 'string' ? JSON.parse(listResponse) : listResponse;

        if (listData.ok && listData.channels) {
          const existingChannel = listData.channels.find((ch: any) => ch.name === sanitizedName);
          if (existingChannel) {
            prettyPrint('[CreateChannelDialog] Channel already exists:', existingChannel, 'orange');
            throw new Error(`A channel named "${sanitizedName}" already exists. Please choose a different name.`);
          }
        }
        prettyPrint('[CreateChannelDialog] Channel does not exist, proceeding with creation', '', 'green');
      } catch (checkErr: any) {
        // If it's our "already exists" error, re-throw it
        if (checkErr.message?.includes('already exists')) {
          throw checkErr;
        }
        // Otherwise, log the error but continue with creation
        // (the conversations.create call will handle the error properly)
        prettyPrint('Failed to check for existing channel:', checkErr, 'yellow');
        prettyPrint('[CreateChannelDialog] Warning: Could not check for existing channel', checkErr, 'yellow');
      }

      // Create the channel via Slack API
      const createResponse = await apiClient.slackCreateChannel({
        name: sanitizedName,
        isPrivate: isPrivate,
      });

      const createData = typeof createResponse === 'string' ? JSON.parse(createResponse) : createResponse;

      prettyPrint('[CreateChannelDialog] Channel created:', createData, 'green');

      if (!createData.ok || !createData.channel) {
        // Handle specific Slack errors
        if (createData.error === 'name_taken') {
          throw new Error(`A channel named "${sanitizedName}" already exists. Please choose a different name.`);
        } else if (createData.error === 'restricted_action') {
          throw new Error('You do not have permission to create channels in this workspace.');
        } else if (createData.error === 'invalid_name') {
          throw new Error('The channel name is invalid. Please use only lowercase letters, numbers, hyphens, and underscores.');
        } else if (createData.error === 'rate_limited' || createData.error?.includes('rate')) {
          throw new Error('Slack rate limit reached. Please wait 60 seconds before creating another channel.');
        }
        throw new Error(createData.error || 'Failed to create channel');
      }

      const channelId = createData.channel.id;

      // Invite members if any were selected
      if (selectedMembers.length > 0) {
        try {
          const memberIds = selectedMembers.map(m => m.id).join(',');
          const memberNames = selectedMembers.map(m => m.name).join(', ');
          prettyPrint('[CreateChannelDialog] Inviting members (batch):', { count: selectedMembers.length, names: memberNames }, 'blue');

          const inviteResponse = await apiClient.slackInviteToChannel({
            channel: channelId,
            users: memberIds,
          });

          const inviteData = typeof inviteResponse === 'string' ? JSON.parse(inviteResponse) : inviteResponse;

          if (inviteData.ok) {
            prettyPrint('[CreateChannelDialog] All members invited successfully', null, 'green');
          } else {
            // Handle specific Slack invite errors
            let errorMessage = 'Failed to invite members. ';
            if (inviteData.error === 'rate_limited') {
              errorMessage += 'Rate limit reached. Please wait a moment and try inviting members manually from Slack.';
            } else if (inviteData.error === 'users_not_found') {
              errorMessage += 'Some users were not found. Please verify the user IDs.';
            } else if (inviteData.error === 'cant_invite_self') {
              errorMessage += 'Cannot invite yourself to the channel.';
            } else if (inviteData.error === 'already_in_channel') {
              errorMessage += 'Some users are already in the channel.';
            } else {
              errorMessage += `Error: ${inviteData.error}`;
            }

            prettyPrint('[CreateChannelDialog] Invite error:', inviteData, 'orange');
            setWarning(`Channel created successfully, but ${errorMessage} You can invite them manually from Slack.`);
          }
        } catch (inviteErr: any) {
          // Don't fail the entire channel creation if member invitation fails
          prettyPrint('Failed to invite members, but channel was created:', inviteErr, 'yellow');
          prettyPrint('[CreateChannelDialog] Warning: Channel created but member invitation failed', inviteErr, 'yellow');

          // Parse error message for better user feedback
          let errorDetails = 'An error occurred';
          try {
            const errorData = typeof inviteErr === 'string' ? JSON.parse(inviteErr) : inviteErr;
            errorDetails = errorData.error || errorData.message || 'An error occurred';
          } catch {
            errorDetails = inviteErr.message || 'An error occurred';
          }

          setWarning(`Channel created successfully, but some members could not be added (${errorDetails}). You can invite them manually from Slack.`);
        }
      }

      // Create Salesforce link record
      const linkParams = {
        recordId: recordId,
        objectType: objectType,
        recordName: recordName,
        channelId: channelId,
        channelName: sanitizedName,  // Use the sanitized name that was sent to Slack
        isPrimary: false,
        linkType: 'Manually Linked',  // Valid picklist value
      };
      prettyPrint('[CreateChannelDialog] Creating channel link with params:', linkParams);
      await apiClient.slackCreateChannelLink(linkParams);

      prettyPrint('[CreateChannelDialog] Channel linked to record', null, 'green');

      // Notify parent
      onChannelCreated(channelId, sanitizedName);

      // Reset and close
      setChannelName('');
      setIsPrivate(false);
      setSelectedMembers([]);
      setLoading(false);
      onClose();
    } catch (err: any) {
      prettyPrint('Failed to create channel:', err, 'red');
      setError(`Failed to create channel: ${err.message}`);
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setChannelName('');
      setIsPrivate(false);
      setSelectedMembers([]);
      setError(null);
      setWarning(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'transparent',
        },
      }}
      PaperProps={{
        sx: {
          minHeight: 500,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        Create Channel
      </DialogTitle>

      <DialogContent
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          mt: 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {warning && (
            <Alert severity="warning" onClose={() => setWarning(null)}>
              {warning}
            </Alert>
          )}

          <TextField
            label="Channel Name"
            value={channelName}
            onChange={(e) => {
              // Auto-sanitize as user types
              const sanitized = sanitizeChannelName(e.target.value);
              setChannelName(sanitized);
              // Clear error when user starts typing
              if (error) setError(null);
            }}
            fullWidth
            required
            disabled={loading}
            helperText="Lowercase letters, numbers, hyphens, and underscores only (max 80 chars)"
            error={!!error && error.includes('Channel name')}
            sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}
            inputProps={{
              maxLength: 80,
              pattern: '[a-z0-9-_]+',
            }}
          />

          <FormControl component="fieldset">
            <FormLabel component="legend">Visibility</FormLabel>
            <RadioGroup
              value={isPrivate ? 'private' : 'public'}
              onChange={(e) => setIsPrivate(e.target.value === 'private')}
            >
              <FormControlLabel
                value="public"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Public</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Anyone in the workspace can find and join
                    </Typography>
                  </Box>
                }
                disabled={loading}
              />
              <FormControlLabel
                value="private"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Private</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Only invited members can access
                    </Typography>
                  </Box>
                }
                disabled={loading}
              />
            </RadioGroup>
          </FormControl>

          <Autocomplete
            multiple
            options={availableUsers}
            getOptionLabel={(option) => option.name}
            value={selectedMembers}
            onChange={(event, newValue) => setSelectedMembers(newValue)}
            loading={loadingUsers}
            disabled={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add Members (Optional)"
                placeholder="Search for people..."
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.name}
                  size="small"
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
          />

        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={loading || !channelName.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Creating...' : 'Create Channel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateChannelDialog;
