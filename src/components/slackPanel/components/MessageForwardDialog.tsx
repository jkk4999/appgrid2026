import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Autocomplete,
  Avatar,
  CircularProgress,
} from '@mui/material';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { prettyPrint } from '../../../utilities/prettyPrint';

interface MessageForwardDialogProps {
  open: boolean;
  messageText: string;
  onClose: () => void;
  onForward: (channelIds: string[], additionalMessage: string) => Promise<void>;
  apiClient: any;
  userProfilesCache?: { [key: string]: any };
}

interface ForwardTarget {
  id: string;
  name: string;
  type: 'channel' | 'user';
  is_member?: boolean;
}


/**
 * Dialog for forwarding a message to other channels or DMs
 * Based on Slack's native forward message UI
 */
const MessageForwardDialog: React.FC<MessageForwardDialogProps> = ({
  open,
  messageText,
  onClose,
  onForward,
  apiClient,
  userProfilesCache = {},
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<ForwardTarget[]>([]);
  const [availableTargets, setAvailableTargets] = useState<ForwardTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Quill when dialog opens and DOM is ready
  useEffect(() => {
    prettyPrint('[MessageForwardDialog] useEffect triggered', {
      open,
      editorRefCurrent: editorRef.current,
      quillRefCurrent: quillRef.current,
    }, 'blue');

    if (!open) {
      prettyPrint('[MessageForwardDialog] Dialog not open, skipping initialization', null, 'blue');
      return;
    }

    // MUI Dialog renders content when opening, so we need to wait a tick for the DOM
    const timeoutId = setTimeout(() => {
      prettyPrint('[MessageForwardDialog] After timeout - checking editorRef', {
        editorRefCurrent: editorRef.current,
        quillRefCurrent: quillRef.current,
      }, 'blue');

      if (!editorRef.current) {
        prettyPrint('[MessageForwardDialog] ❌ editorRef.current is STILL null after timeout!', null, 'red');
        return;
      }

      // Only initialize once
      if (quillRef.current) {
        prettyPrint('[MessageForwardDialog] Quill already initialized, clearing and focusing', null, 'blue');
        quillRef.current.setText('');
        quillRef.current.focus();
        return;
      }

      // Check if Quill was already initialized on this element
      if (editorRef.current.classList.contains('ql-container')) {
        prettyPrint('[MessageForwardDialog] Element already has ql-container class, skipping', null, 'blue');
        return;
      }

      prettyPrint('[MessageForwardDialog] ***** INITIALIZING QUILL EDITOR *****', null, 'blue');

      // Initialize Quill
      try {
        const quill = new Quill(editorRef.current, {
          theme: 'snow',
          placeholder: 'Add a message, if you\'d like.',
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline', 'strike'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['blockquote', 'code-block'],
              ['link'],
            ],
          },
        });

        quillRef.current = quill;
        prettyPrint('[MessageForwardDialog] ✅ Quill initialized successfully!', quill, 'green');
        quill.focus();
      } catch (error) {
        prettyPrint('[MessageForwardDialog] ❌ Failed to initialize Quill:', error, 'red');
      }
    }, 0); // 0ms timeout to wait for next tick after Dialog renders

    return () => clearTimeout(timeoutId);
  }, [open]);

  // Load channels and users when dialog opens
  useEffect(() => {
    if (open) {
      loadTargets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadTargets = async () => {
    try {
      setLoading(true);
      setError(null);

      const targets: ForwardTarget[] = [];

      // Load channels
      const conversationsResponse = await apiClient.slackListConversations({
        types: 'public_channel,private_channel',
        exclude_archived: true,
      });
      const conversationsData = typeof conversationsResponse === 'string'
        ? JSON.parse(conversationsResponse)
        : conversationsResponse;

      prettyPrint('[MessageForwardDialog] Channels loaded:', conversationsData, 'blue');

      if (conversationsData.ok && conversationsData.channels) {
        conversationsData.channels.forEach((channel: any) => {
          targets.push({
            id: channel.id,
            name: channel.name,
            type: 'channel',
            is_member: channel.is_member,
          });
        });
      }

      // Load ALL workspace users instead of only cached ones
      prettyPrint('[MessageForwardDialog] Loading all workspace users...', null, 'blue');

      try {
        const usersResponse = await apiClient.slackListUsers();
        const usersData = typeof usersResponse === 'string' ? JSON.parse(usersResponse) : usersResponse;

        prettyPrint('[MessageForwardDialog] Users loaded:', usersData, 'blue');

        if (usersData.ok && usersData.members) {
          prettyPrint(`[MessageForwardDialog] Processing ${usersData.members.length} users`, null, 'blue');

          usersData.members.forEach((user: any) => {
            // Skip bots and deleted users
            if (!user.is_bot && !user.deleted) {
              const displayName = user.profile?.display_name || user.profile?.real_name || user.name || user.id;

              prettyPrint(`[MessageForwardDialog] Adding user: ${displayName} (${user.id})`, user, 'blue');

              targets.push({
                id: user.id,
                name: displayName,
                type: 'user',
              });
            }
          });

          prettyPrint(`[MessageForwardDialog] Total users added: ${targets.filter(t => t.type === 'user').length}`, null, 'green');
        } else {
          prettyPrint('[MessageForwardDialog] Users API response not OK or no members:', usersData, 'red');
        }
      } catch (userErr: any) {
        prettyPrint('[MessageForwardDialog] Failed to load all users, falling back to cached:', userErr, 'orange');

        // Fallback to cached users if API call fails
        Object.entries(userProfilesCache).forEach(([userId, profile]: [string, any]) => {
          const displayName = profile?.display_name || profile?.real_name || userId;

          targets.push({
            id: userId,
            name: displayName,
            type: 'user',
          });
        });
      }

      prettyPrint(`[MessageForwardDialog] Setting ${targets.length} available targets`, targets, 'green');
      setAvailableTargets(targets);
      setLoading(false);
    } catch (err: any) {
      prettyPrint('Failed to load targets:', err, 'red');
      setError(`Failed to load channels: ${err.message}`);
      setLoading(false);
    }
  };

  const handleForward = async () => {
    if (selectedTargets.length === 0) {
      setError('Please select at least one channel or person to forward to');
      return;
    }

    try {
      setForwarding(true);
      setError(null);

      const additionalMessage = quillRef.current
        ? quillRef.current.getText().trim()
        : '';

      // For users, we need to open/get a DM channel first
      const channelIds: string[] = [];

      for (const target of selectedTargets) {
        if (target.type === 'channel') {
          // Direct channel ID
          channelIds.push(target.id);
        } else {
          // User - need to open a DM conversation
          try {
            const dmResponse = await apiClient.slackOpenConversation({
              users: target.id,
            });
            const dmData = typeof dmResponse === 'string' ? JSON.parse(dmResponse) : dmResponse;

            if (dmData.ok && dmData.channel?.id) {
              channelIds.push(dmData.channel.id);
            } else {
              throw new Error(`Failed to open DM with ${target.name}`);
            }
          } catch (dmErr: any) {
            prettyPrint('Failed to open DM:', dmErr, 'red');
            throw new Error(`Failed to open DM with ${target.name}: ${dmErr.message}`);
          }
        }
      }

      await onForward(channelIds, additionalMessage);

      // Reset and close
      setSelectedTargets([]);
      if (quillRef.current) {
        quillRef.current.setText('');
      }
      onClose();
    } catch (err: any) {
      prettyPrint('Failed to forward message:', err, 'red');
      setError(err.message || 'Failed to forward message');
    } finally {
      setForwarding(false);
    }
  };

  const handleCancel = () => {
    setSelectedTargets([]);
    if (quillRef.current) {
      quillRef.current.setText('');
    }
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      aria-labelledby="forward-message-dialog-title"
    >
      <DialogTitle id="forward-message-dialog-title">
        Forward this message
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          {/* Channel/Person Selector */}
          <Autocomplete
            multiple
            options={availableTargets}
            getOptionLabel={(option) =>
              option.type === 'channel'
                ? `${option.name}${!option.is_member ? ' (not a member)' : ''}`
                : option.name
            }
            filterOptions={(options, state) => {
              const inputValue = state.inputValue.toLowerCase().replace(/^@/, ''); // Remove leading @ if present

              prettyPrint(`[MessageForwardDialog] Filtering with input: "${inputValue}"`, {
                totalOptions: options.length,
                inputValue,
                originalInput: state.inputValue
              }, 'blue');

              if (!inputValue) {
                prettyPrint('[MessageForwardDialog] No input, returning all options', null, 'blue');
                return options;
              }

              const filtered = options.filter(option => {
                const matches = option.name.toLowerCase().includes(inputValue);
                if (matches) {
                  prettyPrint(`[MessageForwardDialog] Match found: ${option.name}`, option, 'green');
                }
                return matches;
              });

              prettyPrint(`[MessageForwardDialog] Filter results: ${filtered.length} matches`, filtered, 'blue');
              return filtered;
            }}
            value={selectedTargets}
            onChange={(event, newValue) => setSelectedTargets(newValue)}
            loading={loading}
            disabled={forwarding}
            sx={{ mt: 2 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add by name or channel"
                placeholder="Search for channels or people..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                  {option.type === 'channel' ? '#' : option.name.charAt(0)}
                </Avatar>
                <Typography variant="body2">
                  {option.type === 'channel' ? `# ${option.name}` : option.name}
                </Typography>
              </Box>
            )}
          />

          {/* Additional Message Editor */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Add a message, if you&apos;d like
            </Typography>
            <Box
              ref={editorRef}
              sx={{
                minHeight: 120,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                backgroundColor: 'background.paper',
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
          </Box>

          {/* Original Message Preview */}
          <Box
            sx={{
              p: 2,
              backgroundColor: 'action.hover',
              borderLeft: 3,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Original message:
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {messageText}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel} disabled={forwarding}>
          Cancel
        </Button>
        <Button
          onClick={handleForward}
          variant="contained"
          color="primary"
          disabled={forwarding || selectedTargets.length === 0}
        >
          {forwarding ? 'Forwarding...' : 'Forward'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageForwardDialog;
