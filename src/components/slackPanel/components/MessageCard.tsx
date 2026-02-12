import React, { useState } from 'react';
import { Box, Avatar, Typography } from '@mui/material';
import HoverActions from './HoverActions';

export interface MessageCardProps {
  message: {
    user?: string;
    text?: string;
    ts: string;
    bot_id?: string;
  };
  userName?: string;
  userInitial?: string;
  showSummary?: boolean;
  maxSummaryLines?: number;
  onClick?: () => void;
  onAction?: (action: string) => void;
}

/**
 * Reusable message card component
 * Displays a message with avatar, sender name, timestamp, and content
 * Shows hover actions menu when user hovers over the message
 */
const MessageCard: React.FC<MessageCardProps> = ({
  message,
  userName = 'User',
  userInitial = 'U',
  showSummary = false,
  maxSummaryLines = 3,
  onClick,
  onAction
}) => {
  const [isHovered, setIsHovered] = useState(false);

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

  const getMessageText = () => {
    if (!message.text) return '';

    if (showSummary) {
      // Split by newlines and take first N lines
      const lines = message.text.split('\n').slice(0, maxSummaryLines);
      const truncated = lines.join('\n');

      // If there are more lines, add ellipsis
      const totalLines = message.text.split('\n').length;
      if (totalLines > maxSummaryLines) {
        return truncated + '...';
      }
      return truncated;
    }

    return message.text;
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleActionClick = (action: string) => {
    setIsHovered(false);
    if (onAction) {
      onAction(action);
    }
  };

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      sx={{
        display: 'flex',
        gap: 1.5,
        p: 1.5,
        borderRadius: 1,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
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
        <Typography
          variant="body2"
          sx={{
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            ...(showSummary && {
              display: '-webkit-box',
              WebkitLineClamp: maxSummaryLines,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }),
          }}
        >
          {getMessageText()}
        </Typography>
      </Box>

      {/* Hover Actions */}
      {isHovered && onAction && (
        <HoverActions
          onAction={handleActionClick}
        />
      )}
    </Box>
  );
};

export default MessageCard;
