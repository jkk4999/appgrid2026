/**
 * SlackPanel2 - Simplified architecture using hooks
 * Clean implementation without caching complexity
 *
 * This component provides a Slack integration panel that allows users to:
 * - Connect their personal Slack account via OAuth
 * - View and manage channel links associated with Salesforce records
 * - Send messages to channels and DMs
 * - Create new channels linked to records
 *
 * @requires AppGrid_Slack_Config__mdt - Custom metadata record must exist with:
 *   - DeveloperName = 'Default'
 *   - Named Credential Name configured
 *   - Client ID and Client Secret for OAuth
 *
 * Error Handling:
 * - Gracefully handles missing metadata configuration with user-friendly messages
 * - Detects specific configuration errors (missing metadata, credentials, etc.)
 * - Provides actionable guidance for administrators
 */

import React, { useState, useMemo, useEffect } from 'react';

import {
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  AppBar,
  Toolbar,
  Tooltip,
} from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

import AddIcon from '@mui/icons-material/Add';

import PersonIcon from '@mui/icons-material/Person';

import TagIcon from '@mui/icons-material/Tag';

import useStore from '../../zustandStore';

import { useShallow } from 'zustand/react/shallow';

// NEW: Domain-specific selector hooks
import { useThemeState } from '../../hooks/selectors/useUIState';

import { prettyPrint } from '../../utilities/prettyPrint';

import { APIClient } from '../../brideDesignPattern/apiInterface';

import { useSlackAuth } from '../../slack/hooks/useSlackAuth';

import HomeView2 from './views/HomeView2';

import ChannelDetail from './details/ChannelDetail';

import MessageDetail from './details/MessageDetail';

import ShareToSlackPanel2 from '../shareToSlack/ShareToSlackPanel2';

import CreateChannelDialog from './components/CreateChannelDialog';

import { useChannelLinks } from '../../slack/hooks/useChannelLinks';

/**
 * Props for the SlackPanel2 component
 * @interface SlackPanel2Props
 */
interface SlackPanel2Props {
  /** APIClient instance for making Apex calls to Salesforce */
  apiClient: APIClient;
  /** Optional: Pre-selected row data from the grid (overrides zustand state) */
  selectedSlackRowProp?: any;
}

/**
 * Configuration error types that can occur when Slack metadata is not properly set up
 */
type ConfigurationErrorType =
  | 'CONFIG_MISSING'
  | 'NAMED_CREDENTIAL_MISSING'
  | 'CLIENT_ID_MISSING'
  | 'CLIENT_SECRET_MISSING'
  | 'UNKNOWN_CONFIG_ERROR';

/**
 * Interface for parsed configuration error information
 */
interface ConfigurationError {
  type: ConfigurationErrorType;
  title: string;
  message: string;
  adminAction: string;
}

/**
 * Parses an error message to determine if it's a Slack configuration error
 * and extracts user-friendly information for display.
 *
 * @param errorMessage - The raw error message from the API
 * @returns ConfigurationError object if it's a config error, null otherwise
 */
const parseConfigurationError = (errorMessage: string): ConfigurationError | null => {
  if (!errorMessage) return null;

  // Check for specific configuration error patterns
  if (errorMessage.includes('ERROR_CONFIG_MISSING') || errorMessage.includes('Slack configuration not found')) {
    return {
      type: 'CONFIG_MISSING',
      title: 'Slack Integration Not Configured',
      message: 'The Slack integration has not been set up for this Salesforce org.',
      adminAction: 'Create an AppGrid Slack Config custom metadata record with DeveloperName = "Default".',
    };
  }

  if (errorMessage.includes('ERROR_NAMED_CREDENTIAL_MISSING') || errorMessage.includes('Named Credential is not configured')) {
    return {
      type: 'NAMED_CREDENTIAL_MISSING',
      title: 'Slack Named Credential Missing',
      message: 'The Slack Named Credential has not been configured.',
      adminAction: 'Set the Named Credential Name field in the AppGrid Slack Config metadata record.',
    };
  }

  if (errorMessage.includes('ERROR_CLIENT_ID_MISSING') || errorMessage.includes('Client ID is not configured')) {
    return {
      type: 'CLIENT_ID_MISSING',
      title: 'Slack Client ID Missing',
      message: 'The Slack OAuth Client ID has not been configured.',
      adminAction: 'Add the Slack App Client ID to the AppGrid Slack Config metadata record.',
    };
  }

  if (errorMessage.includes('ERROR_CLIENT_SECRET_MISSING') || errorMessage.includes('Client Secret is not configured')) {
    return {
      type: 'CLIENT_SECRET_MISSING',
      title: 'Slack Client Secret Missing',
      message: 'The Slack OAuth Client Secret has not been configured.',
      adminAction: 'Add the Slack App Client Secret to the AppGrid Slack Config metadata record.',
    };
  }

  // Check for generic configuration-related errors
  if (
    errorMessage.includes('Slack not configured') ||
    errorMessage.includes('credentials not configured') ||
    errorMessage.includes('SlackConfigurationException')
  ) {
    return {
      type: 'UNKNOWN_CONFIG_ERROR',
      title: 'Slack Configuration Error',
      message: 'There is a problem with the Slack integration configuration.',
      adminAction: 'Review the AppGrid Slack Config custom metadata and ensure all required fields are populated.',
    };
  }

  return null;
};

/**
 * Union type for center panel content states
 * Determines what is displayed in the main content area
 */
type CenterPanelContent =
  | { type: 'empty' }
  | { type: 'channel'; data: { channelId: string; channel: any } }
  | { type: 'message'; data: { message: any; channelId: string } }
  | { type: 'compose'; data: { mode: string } };

/**
 * SlackPanel2 Component
 *
 * Main Slack integration panel that provides:
 * - OAuth authentication flow for connecting user's Slack account
 * - Channel and DM management linked to Salesforce records
 * - Message viewing and composing functionality
 * - Channel creation with automatic record linking
 *
 * @param props - SlackPanel2Props containing apiClient and optional selectedSlackRowProp
 * @returns JSX.Element - The rendered Slack panel
 */
const SlackPanel2: React.FC<SlackPanel2Props> = ({ apiClient, selectedSlackRowProp }) => {
  const theme = useTheme();

  // Theme state from domain hook
  const { muiColor } = useThemeState();

  // Remaining global state not in domain hooks
  const {
    setShowSlackPanel,
    selectedSlackRow,
    selectedObject,
  } = useStore(
    useShallow((state) => ({
      setShowSlackPanel: state.setShowSlackPanel,
      selectedSlackRow: state.selectedSlackRow,
      selectedObject: state.selectedObject,
    }))
  );

  // Derive record info from selectedSlackRow and selectedObject
  const recordInfo = useMemo(() => {
    const row = selectedSlackRowProp || selectedSlackRow;

    if (!row) return null;

    return {
      recordId: row.Id || '',
      objectType: (selectedObject as any)?.qualifiedApiName || (selectedObject as any)?.QualifiedApiName || (selectedObject as any)?.apiName || '',
      recordName: row.Name || 'Unknown',
    };
  }, [selectedSlackRowProp, selectedSlackRow, selectedObject]);

  // Use authentication hook
  const { isAuthenticated, isChecking, currentUserId, error: authError, disconnect } = useSlackAuth(apiClient);

  // Use channel links hook - this is the single source of truth for channel links
  const { channelLinks, dmLinks, loading: channelLinksLoading, error: channelLinksError, refresh: refreshChannelLinks } = useChannelLinks(apiClient, recordInfo?.recordId || null, currentUserId, isAuthenticated);

  /**
   * Parsed configuration error state
   * Memoized to detect if authError is a configuration-related error
   * that requires admin intervention
   */
  const configError = useMemo((): ConfigurationError | null => {
    if (!authError) return null;
    return parseConfigurationError(authError);
  }, [authError]);

  // View state
  const [centerPanelContent, setCenterPanelContent] = useState<CenterPanelContent>({
    type: 'empty',
  });

  // Dialog state
  const [showCreateChannelDialog, setShowCreateChannelDialog] = useState(false);

  // Reset center panel when record changes
  useEffect(() => {
    prettyPrint('[SlackPanel2] Record changed, clearing center panel', recordInfo?.recordId, 'blue');

    setCenterPanelContent({ type: 'empty' });
  }, [recordInfo?.recordId]);

  /**
   * Closes the Slack panel by updating the global state.
   * Called when user clicks the back/close button in the header.
   */
  const handleClose = () => {
    setShowSlackPanel(false);
  };

  /**
   * Initiates the Slack OAuth flow to connect the user's Slack account.
   *
   * This function:
   * 1. Opens a popup window immediately (to avoid popup blockers)
   * 2. Requests an OAuth authorization URL from Salesforce/Apex
   * 3. Navigates the popup to Slack's OAuth consent page
   * 4. Listens for OAuth completion via postMessage
   * 5. Retries token verification up to 8 times to handle DB commit delays
   * 6. Reloads the page on successful authentication
   *
   * @async
   * @throws Logs errors to console via prettyPrint, does not throw
   */
  const handleConnectToSlack = async () => {
    try {
      prettyPrint('[SlackPanel2] Starting OAuth flow', null, 'blue');

      // CRITICAL: Open popup IMMEDIATELY (synchronously) to avoid popup blockers
      // We'll navigate it to the OAuth URL after we receive it
      const popup = window.open(
        'about:blank',
        'Slack OAuth',
        'width=600,height=800,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        prettyPrint('[SlackPanel2] Popup was blocked by browser', null, 'red');
        return;
      }

      // Now get the authorization URL (async)
      const authResponse = await apiClient.slackGetAuthorizationUrl();

      const authData = typeof authResponse === 'string' ? JSON.parse(authResponse) : authResponse;

      if (!authData.success || !authData.authUrl) {
        popup.close();
        prettyPrint('[SlackPanel2] Failed to get authorization URL', authData, 'red');
        return;
      }

      prettyPrint('[SlackPanel2] Navigating popup to Slack OAuth URL:', authData.authUrl, 'blue');

      // Navigate the already-open popup to the OAuth URL
      popup.location.href = authData.authUrl;

      // Track if we've already processed the OAuth message to prevent double-processing
      let hasProcessedOAuth = false;

      // Listen for postMessage from the OAuth callback popup
      const handleOAuthMessage = async (event: MessageEvent) => {
        // Verify the message is from our OAuth popup
        if (event.data && event.data.type === 'slack-oauth-complete') {
          // Prevent double-processing if message is received multiple times
          if (hasProcessedOAuth) {
            prettyPrint('[SlackPanel2] OAuth message already processed, ignoring duplicate', null, 'yellow');
            return;
          }

          hasProcessedOAuth = true;

          prettyPrint('[SlackPanel2] Received OAuth completion message from popup', event.data, 'green');

          // Remove the event listener immediately
          window.removeEventListener('message', handleOAuthMessage);

          // Close the popup if it's still open
          if (popup && !popup.closed) {
            popup.close();
          }

          // Wait for database commit to complete with retry logic
          prettyPrint('[SlackPanel2] Waiting for database commit (will retry up to 8 times)...', null, 'blue');

          let attempt = 0;

          const maxAttempts = 8;

          const checkToken = async (): Promise<void> => {
            attempt++;
            const delays = [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000];

            const delay = delays[attempt - 1] || 5000;

            prettyPrint(`[SlackPanel2] Attempt ${attempt}/${maxAttempts}: Waiting ${delay}ms before checking for token...`, null, 'blue');

            await new Promise(resolve => setTimeout(resolve, delay));

            try {
              const tokenResponse = await apiClient.slackGetUserToken();

              const tokenData = typeof tokenResponse === 'string' ? JSON.parse(tokenResponse) : tokenResponse;

              prettyPrint(`[SlackPanel2] Attempt ${attempt} token check result:`, tokenData, 'blue');

              if (tokenData.success && tokenData.hasToken) {
                prettyPrint('[SlackPanel2] User successfully authenticated! Reloading page...', null, 'green');
                // Reload the page to reinitialize the entire app with authenticated state
                window.location.reload();
              } else if (attempt < maxAttempts) {
                prettyPrint(`[SlackPanel2] Token not found yet, retrying (attempt ${attempt + 1}/${maxAttempts})...`, null, 'yellow');

                await checkToken(); // Recursive retry
              } else {
                prettyPrint('[SlackPanel2] Token not found after 8 attempts. Please check Apex logs.', null, 'red');
              }
            } catch (err: any) {
              prettyPrint(`[SlackPanel2] Error checking token (attempt ${attempt}):`, err, 'red');

              if (attempt < maxAttempts) {
                await checkToken(); // Retry on error
              }
            }
          };

          await checkToken();
        }
      };

      // Add the message listener
      window.addEventListener('message', handleOAuthMessage);

      // Fallback: Check if popup is closed without message (user cancelled)
      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed);

          window.removeEventListener('message', handleOAuthMessage);

          prettyPrint('[SlackPanel2] Popup closed - user may have cancelled', null, 'yellow');
        }
      }, 500);

    } catch (err: any) {
      prettyPrint('[SlackPanel2] OAuth failed:', err, 'red');
    }
  };

  /**
   * Disconnects the user's Slack account by revoking the stored OAuth token.
   * Clears the center panel content after disconnection.
   *
   * @async
   */
  const handleDisconnect = async () => {
    await disconnect();

    setCenterPanelContent({ type: 'empty' });
  };

  /**
   * Handles click on a channel in the sidebar.
   * Opens the channel detail view in the center panel.
   *
   * @param channelId - The Slack channel ID (e.g., 'C1234567890')
   * @param channelName - The display name of the channel
   */
  const handleChannelClick = (channelId: string, channelName: string) => {
    prettyPrint('[SlackPanel2] Opening channel:', { channelId, channelName }, 'blue');

    setCenterPanelContent({
      type: 'channel',
      data: {
        channelId,
        channel: { id: channelId, name: channelName },
      },
    });
  };

  /**
   * Handles click on a DM (direct message) in the sidebar.
   * Opens the DM conversation in the center panel.
   * Uses the same channel detail view as regular channels.
   *
   * @param channelId - The Slack DM channel ID (e.g., 'D1234567890')
   * @param channelName - The display name (usually the other user's name)
   */
  const handleDMClick = (channelId: string, channelName: string) => {
    prettyPrint('[SlackPanel2] Opening DM:', { channelId, channelName }, 'blue');

    setCenterPanelContent({
      type: 'channel',
      data: {
        channelId,
        channel: { id: channelId, name: channelName },
      },
    });
  };

  /**
   * Opens the compose message panel in the center area.
   * Allows user to compose a new message to share to Slack.
   */
  const handleComposeMessage = () => {
    prettyPrint('[SlackPanel2] Opening compose message', null, 'blue');

    setCenterPanelContent({
      type: 'compose',
      data: { mode: 'message' },
    });
  };

  /**
   * Opens the create channel dialog.
   * Allows user to create a new Slack channel linked to the current record.
   */
  const handleCreateChannel = () => {
    prettyPrint('[SlackPanel2] Opening create channel dialog', null, 'blue');

    setShowCreateChannelDialog(true);
  };

  /**
   * Callback handler when a new channel is successfully created.
   * Closes the dialog, refreshes channel links, and navigates to the new channel.
   *
   * @async
   * @param channelId - The Slack channel ID of the newly created channel
   * @param channelName - The name of the newly created channel
   */
  const handleChannelCreated = async (channelId: string, channelName: string) => {
    prettyPrint('[SlackPanel2] Channel created:', { channelId, channelName }, 'green');

    setShowCreateChannelDialog(false);

    // Refresh channel links to show new channel in sidebar
    prettyPrint('[SlackPanel2] Refreshing channel links after channel creation', null, 'blue');

    await refreshChannelLinks();

    prettyPrint('[SlackPanel2] Channel links refreshed - state updated', null, 'green');

    // Navigate to the new channel
    setCenterPanelContent({
      type: 'channel',
      data: {
        channelId,
        channel: { id: channelId, name: channelName },
      },
    });
  };

  /**
   * Closes the center panel and returns to the empty state.
   * Called when user closes a channel detail, message detail, or compose view.
   */
  const handleCloseCenterPanel = () => {
    setCenterPanelContent({ type: 'empty' });
  };

  // Render authentication check
  if (isChecking) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Render configuration error state (when Slack metadata is not set up)
  if (configError) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: 1,
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <AppBar position="sticky"
          sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            flexShrink: 0
          }}>
          <Toolbar variant="dense">
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="close"
              sx={{ ml: -1 }}
              onClick={handleClose}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Typography
              variant="button"
              component="div"
              sx={{ flexGrow: 1 }}>
              Slack
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Configuration Error Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              maxWidth: 500,
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary
            }}>
            <Alert
              severity="warning"
              sx={{
                mb: 3,
                textAlign: 'left',
                '& .MuiAlert-message': { width: '100%' }
              }}
            >
              <AlertTitle sx={{ fontWeight: 'bold' }}>{configError.title}</AlertTitle>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {configError.message}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                This Salesforce org does not have the required custom metadata records to use the Slack integration.
              </Typography>
              <Box sx={{
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                p: 1.5,
                borderRadius: 1,
                mt: 1
              }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                  Administrator Action Required:
                </Typography>
                <Typography variant="caption">
                  {configError.adminAction}
                </Typography>
              </Box>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Please contact your Salesforce administrator to configure the Slack integration.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // Render not authenticated state (config exists but user not connected)
  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: 1,
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <AppBar position="sticky"
          sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            flexShrink: 0
          }}>
          <Toolbar variant="dense">
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="close"
              sx={{ ml: -1 }}
              onClick={handleClose}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Typography
              variant="button"
              component="div"
              sx={{ flexGrow: 1 }}>
              Slack
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              maxWidth: 400,
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary
            }}>
            <Typography
              variant="h6"
              gutterBottom>
              Connect to Slack
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 3 }}>
              Connect your Slack account to view and send messages directly from Salesforce.
            </Typography>
            {authError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {authError}
              </Alert>
            )}
            <Button variant="contained" onClick={handleConnectToSlack}>
              Connect to Slack
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // Render authentication error
  if (authError) {
    return (
      <Box
        sx={{
          p: 2,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary
        }}>
        <Alert severity="error" onClose={handleClose}>
          {authError}
        </Alert>
      </Box>
    );
  }

  // Render no record selected state
  if (!selectedSlackRow) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: 1,
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <AppBar position="sticky"
          sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            flexShrink: 0
          }}>
          <Toolbar variant="dense">
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="close"
              sx={{ ml: -1 }}
              onClick={handleClose}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="button" color="inherit" component="div" sx={{ flexGrow: 1 }}>
              Slack
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
          }}
        >
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              textAlign: 'center',
              maxWidth: 500
            }}>
            <Typography variant="h6" color="text.secondary">
              No Record Selected
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Please select a grid record to view Slack messages
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // Render main authenticated UI
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: 1,
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          flexShrink: 0
        }}>
        <Toolbar variant="dense">
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="close"
            sx={{ ml: -1 }}
            onClick={handleClose}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography
            variant="button"
            color="inherit"
            component="div"
            sx={{ flexGrow: 1 }}>
            Slack - {recordInfo?.recordName || 'No record selected'}
          </Typography>
          <Tooltip title="Create channel">
            <IconButton size="small" color="inherit" onClick={handleCreateChannel}>
              <TagIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Compose message">
            <IconButton size="small" color="inherit" onClick={handleComposeMessage}>
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Disconnect">
            <IconButton size="small" color="inherit" onClick={handleDisconnect}>
              <PersonIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Main content area */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
        {/* Left sidebar */}
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            width: 280,
            borderRight: `1px solid ${muiColor}33`,
            overflow: 'auto',
          }}
        >
          <HomeView2
            apiClient={apiClient}
            currentUserId={currentUserId}
            recordId={recordInfo?.recordId || null}
            channelLinks={channelLinks}
            dmLinks={dmLinks}
            loading={channelLinksLoading}
            error={channelLinksError}
            onRefresh={refreshChannelLinks}
            onChannelClick={handleChannelClick}
            onDMClick={handleDMClick}
          />
        </Box>

        {/* Center panel */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto'
          }}>
          {centerPanelContent.type === 'empty' && (
            <Box
              sx={{
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body2" >
                Select a channel or DM to view messages
              </Typography>
            </Box>
          )}

          {centerPanelContent.type === 'channel' && (
            <ChannelDetail
              apiClient={apiClient}
              channelId={centerPanelContent.data.channelId}
              channel={centerPanelContent.data.channel}
              onClose={handleCloseCenterPanel}
              recordId={recordInfo?.recordId || ''}
              recordName={recordInfo?.recordName || ''}
              objectType={recordInfo?.objectType || ''}
              currentUserId={currentUserId || undefined}
            />
          )}

          {centerPanelContent.type === 'message' && (
            <MessageDetail
              apiClient={apiClient}
              message={centerPanelContent.data.message}
              channelId={centerPanelContent.data.channelId}
              onClose={handleCloseCenterPanel}
              recordId={recordInfo?.recordId || ''}
              currentUserId={currentUserId || undefined}
            />
          )}

          {centerPanelContent.type === 'compose' && (
            <ShareToSlackPanel2
              apiClient={apiClient}
              allChannels={[]}
              selectedRows={selectedSlackRow ? [selectedSlackRow] : []}
              objectName={recordInfo?.objectType || 'Record'}
              onClose={handleCloseCenterPanel}
              onSuccess={refreshChannelLinks}
            />
          )}
        </Box>
      </Box>

      {/* Create Channel Dialog */}
      <CreateChannelDialog
        open={showCreateChannelDialog}
        onClose={() => setShowCreateChannelDialog(false)}
        onChannelCreated={handleChannelCreated}
        apiClient={apiClient}
        recordId={recordInfo?.recordId || ''}
        recordName={recordInfo?.recordName || ''}
        objectType={recordInfo?.objectType || ''}
        currentUserId={currentUserId || undefined}
      />
    </Box>
  );
};

export default SlackPanel2;
