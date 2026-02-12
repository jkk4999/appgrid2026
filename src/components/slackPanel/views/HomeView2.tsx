/**
 * HomeView2 - Simplified version using hooks
 * Shows channels and DMs linked to the current record
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TagIcon from '@mui/icons-material/Tag';
import PersonIcon from '@mui/icons-material/Person';

import { prettyPrint } from '../../../utilities/prettyPrint';
import { APIClient } from '../../../brideDesignPattern/apiInterface';
import { EnrichedChannelLink } from '../../../slack/hooks/useChannelLinks';
import { deleteChannelLink } from '../../../slack/api/channelApi';
import ChannelActionsPopup from '../components/ChannelActionsPopup';

interface HomeView2Props {
  apiClient: APIClient;
  currentUserId: string | null;
  recordId: string | null;
  channelLinks: EnrichedChannelLink[];
  dmLinks: EnrichedChannelLink[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onChannelClick: (channelId: string, channelName: string) => void;
  onDMClick: (channelId: string, channelName: string) => void;
}

const HomeView2: React.FC<HomeView2Props> = ({
  apiClient,
  recordId,
  channelLinks,
  dmLinks,
  loading,
  error,
  onRefresh,
  onChannelClick,
  onDMClick,
}) => {
  const theme = useTheme();
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [dmsExpanded, setDmsExpanded] = useState(true);
  const [hoveredChannelId, setHoveredChannelId] = useState<string | null>(null);
  const [hoveredDmId, setHoveredDmId] = useState<string | null>(null);

  // Handle delete channel link
  const handleDeleteChannel = async (channelId: string, channelName: string) => {
    if (!recordId) return;

    try {
      prettyPrint(`[HomeView2] Deleting channel link: ${channelName}`, null, 'blue');
      await deleteChannelLink(apiClient, recordId, channelId);
      prettyPrint(`[HomeView2] Channel link deleted: ${channelName}`, null, 'green');

      // Refresh the list
      await onRefresh();
    } catch (err: any) {
      prettyPrint(`[HomeView2] Failed to delete channel link:`, err, 'red');
    }
  };

  // Handle delete DM link
  const handleDeleteDM = async (channelId: string, channelName: string) => {
    if (!recordId) return;

    try {
      prettyPrint(`[HomeView2] Deleting DM link: ${channelName}`, null, 'blue');
      await deleteChannelLink(apiClient, recordId, channelId);
      prettyPrint(`[HomeView2] DM link deleted: ${channelName}`, null, 'green');

      // Refresh the list
      await onRefresh();
    } catch (err: any) {
      prettyPrint(`[HomeView2] Failed to delete DM link:`, err, 'red');
    }
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        p: 4,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{
        p: 2,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      width: '100%',
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
    }}>
      {/* Channels */}
      <Accordion
        expanded={channelsExpanded}
        onChange={() => setChannelsExpanded(!channelsExpanded)}
        disableGutters
        elevation={0}
        sx={{
          '&:before': { display: 'none' },
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}>
            <TagIcon fontSize="small" />
            <Typography variant="subtitle2">Channels ({channelLinks.length})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{
          p: 0,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}>
          {channelLinks.length === 0 ? (
            <Box sx={{
              p: 2,
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}>
              <Typography variant="body2" color="text.secondary">
                No channels linked to this record
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {channelLinks.map((link) => (
                <React.Fragment key={link.channelId}>
                  <Box
                    sx={{ position: 'relative' }}
                    onMouseEnter={() => setHoveredChannelId(link.channelId)}
                    onMouseLeave={() => setHoveredChannelId(null)}
                  >
                    <ListItemButton
                      onClick={() => {
                        prettyPrint('[HomeView2] Channel clicked:', link, 'blue');
                        onChannelClick(link.channelId, link.channelName);
                      }}
                    >
                      <ListItemText
                        primary={`# ${link.channelName}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItemButton>

                    {/* Action Buttons - Show on hover */}
                    {hoveredChannelId === link.channelId && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          right: 8,
                          transform: 'translateY(-50%)',
                          zIndex: 10,
                        }}
                      >
                        <ChannelActionsPopup
                          onDelete={() => handleDeleteChannel(link.channelId, link.channelName)}
                          showDelete={true}
                          showMakePrivate={false}
                        />
                      </Box>
                    )}
                  </Box>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Direct Messages */}
      <Accordion
        expanded={dmsExpanded}
        onChange={() => setDmsExpanded(!dmsExpanded)}
        disableGutters
        elevation={0}
        sx={{
          '&:before': { display: 'none' },
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}>
            <PersonIcon fontSize="small" />
            <Typography variant="subtitle2">Direct Messages ({dmLinks.length})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{
          p: 0,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}>
          {dmLinks.length === 0 ? (
            <Box sx={{
              p: 2,
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}>
              <Typography variant="body2" color="text.secondary">
                No direct messages linked to this record
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {dmLinks.map((link) => (
                <React.Fragment key={link.channelId}>
                  <Box
                    sx={{ position: 'relative' }}
                    onMouseEnter={() => setHoveredDmId(link.channelId)}
                    onMouseLeave={() => setHoveredDmId(null)}
                  >
                    <ListItemButton
                      onClick={() => {
                        prettyPrint('[HomeView2] DM clicked:', link, 'blue');
                        onDMClick(link.channelId, link.channelName);
                      }}
                    >
                      <ListItemText
                        primary={`@ ${link.channelName}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItemButton>

                    {/* Action Buttons - Show on hover */}
                    {hoveredDmId === link.channelId && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          right: 8,
                          transform: 'translateY(-50%)',
                          zIndex: 10,
                        }}
                      >
                        <ChannelActionsPopup
                          onDelete={() => handleDeleteDM(link.channelId, link.channelName)}
                          showDelete={true}
                          showMakePrivate={false}
                        />
                      </Box>
                    )}
                  </Box>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default HomeView2;
