import React, { useState } from 'react';
import { Box, Avatar, Typography, Chip, Tooltip, Link, Card, CardMedia } from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import { slackMrkdwnToHtml } from '../../../utilities/slackFormatConverter';
import MessageActionsPopup from './MessageActionsPopup';

// Emoji name to display mapping for common reactions
const EMOJI_MAP: { [key: string]: string } = {
  '+1': '👍',
  thumbsup: '👍',
  '-1': '👎',
  thumbsdown: '👎',
  heart: '❤️',
  tada: '🎉',
  fire: '🔥',
  eyes: '👀',
  raised_hands: '🙌',
  clap: '👏',
  laughing: '😆',
  smile: '😊',
  thinking_face: '🤔',
  slightly_smiling_face: '🙂',
  ok_hand: '👌',
  rocket: '🚀',
  star: '⭐',
  sparkles: '✨',
  white_check_mark: '✅',
  x: '❌',
};

interface SlackReaction {
  name: string;
  users: string[];
  count: number;
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

interface MessageItemProps {
  message: {
    ts: string;
    user: string;
    text: string;
    reactions?: SlackReaction[];
    files?: SlackFile[];
    user_profile?: {
      display_name?: string;
      real_name?: string;
      image_48?: string;
    };
  };
  currentUserId?: string;
  onReact?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onForward?: () => void;
  onMore?: () => void;
  onReactionClick?: (emojiName: string, isAdding: boolean) => void;
  formatTimestamp: (ts: string) => string;
}

/**
 * Individual message item with hover actions
 * Displays avatar, username, timestamp, message text, and action buttons on hover
 */
const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserId,
  onReact,
  onEdit,
  onDelete,
  onForward,
  onMore,
  onReactionClick,
  formatTimestamp,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Check if current user owns this message
  const isOwnMessage = Boolean(currentUserId && message.user === currentUserId);

  // Handle reaction chip click
  const handleReactionClick = (reaction: SlackReaction) => {
    if (!onReactionClick) return;

    // Check if current user has already reacted with this emoji
    const hasReacted = reaction.users.includes(currentUserId || '');
    onReactionClick(reaction.name, !hasReacted);
  };

  // Get file icon based on file type
  const getFileIcon = (file: SlackFile) => {
    if (file.mimetype.startsWith('image/')) {
      return <ImageIcon fontSize="small" />;
    } else if (file.mimetype === 'application/pdf' || file.filetype === 'pdf') {
      return <PictureAsPdfIcon fontSize="small" />;
    } else if (file.mimetype.includes('document') || file.mimetype.includes('text')) {
      return <DescriptionIcon fontSize="small" />;
    }
    return <InsertDriveFileIcon fontSize="small" />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Check if file is an image
  const isImageFile = (file: SlackFile): boolean => {
    return file.mimetype.startsWith('image/');
  };

  return (
    <Box
      sx={{ mb: 2, position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {/* Avatar */}
        <Avatar
          src={message.user_profile?.image_48}
          alt={message.user_profile?.display_name || message.user}
          sx={{ width: 36, height: 36 }}
        >
          {(message.user_profile?.display_name || message.user)?.charAt(0).toUpperCase()}
        </Avatar>

        {/* Message Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
            <Typography variant="body2" fontWeight={600}>
              {message.user_profile?.display_name ||
                message.user_profile?.real_name ||
                message.user}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(message.ts)}
            </Typography>
          </Box>
          <Box
            sx={{
              '& strong': { fontWeight: 600 },
              '& em': { fontStyle: 'italic' },
              '& s': { textDecoration: 'line-through' },
              '& a': {
                color: 'primary.main',
                textDecoration: 'underline',
                '&:hover': { textDecoration: 'none' },
              },
              '& code': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                padding: '0.1em 0.3em',
                borderRadius: '3px',
                fontFamily: 'monospace',
                fontSize: '0.85em',
              },
              '& pre': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                padding: '0.5em',
                borderRadius: '4px',
                overflow: 'auto',
              },
              '& pre code': {
                backgroundColor: 'transparent',
                padding: 0,
              },
              '& ul, & ol': {
                margin: '0.5em 0',
                paddingLeft: '1.5em',
              },
              '& li': { marginBottom: '0.25em' },
              fontSize: '0.875rem',
              lineHeight: 1.5,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
            dangerouslySetInnerHTML={{ __html: slackMrkdwnToHtml(message.text) }}
          />

          {/* File attachments */}
          {message.files && message.files.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {message.files.map((file) => (
                <Box key={file.id}>
                  {isImageFile(file) && file.thumb_480 ? (
                    // Image file with thumbnail
                    <Card
                      sx={{
                        maxWidth: 360,
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.9 },
                      }}
                      onClick={() => window.open(file.url_private, '_blank')}
                    >
                      <CardMedia
                        component="img"
                        image={file.thumb_480}
                        alt={file.name}
                        sx={{ maxHeight: 360, objectFit: 'contain' }}
                      />
                    </Card>
                  ) : (
                    // Non-image file or image without thumbnail
                    <Link
                      href={file.url_private_download}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="none"
                      sx={{
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'none',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          maxWidth: 360,
                          bgcolor: 'background.paper',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        {getFileIcon(file)}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap sx={{ color: 'primary.main' }}>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(file.size)}
                          </Typography>
                        </Box>
                      </Box>
                    </Link>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {message.reactions.map((reaction) => {
                const hasReacted = reaction.users.includes(currentUserId || '');
                const emojiDisplay = EMOJI_MAP[reaction.name] || `:${reaction.name}:`;

                return (
                  <Tooltip
                    key={reaction.name}
                    title={`${reaction.count} ${reaction.count === 1 ? 'person' : 'people'} reacted`}
                  >
                    <Chip
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span>{emojiDisplay}</span>
                          <span style={{ fontSize: '0.75rem' }}>{reaction.count}</span>
                        </Box>
                      }
                      size="small"
                      onClick={() => handleReactionClick(reaction)}
                      variant={hasReacted ? 'filled' : 'outlined'}
                      color={hasReacted ? 'primary' : 'default'}
                      sx={{
                        height: 24,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: hasReacted ? 'primary.dark' : 'action.hover',
                        },
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      {/* Action Buttons - Show on hover */}
      {isHovered && (
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            right: 8,
            zIndex: 10,
          }}
        >
          <MessageActionsPopup
            onReact={onReact}
            onForward={onForward}
            onEdit={isOwnMessage ? onEdit : undefined}
            onDelete={isOwnMessage ? onDelete : undefined}
            onMore={onMore}
            showEdit={isOwnMessage}
            showDelete={isOwnMessage}
          />
        </Box>
      )}
    </Box>
  );
};

export default MessageItem;
