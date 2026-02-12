import React from 'react';
import { Box, Popover, IconButton, Typography } from '@mui/material';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  anchorEl?: HTMLElement | null;
  onClose?: () => void;
}

// Common Slack emoji reactions
const COMMON_EMOJIS = [
  { name: 'thumbsup', display: '👍' },
  { name: 'thumbsdown', display: '👎' },
  { name: 'heart', display: '❤️' },
  { name: 'tada', display: '🎉' },
  { name: 'fire', display: '🔥' },
  { name: 'eyes', display: '👀' },
  { name: 'raised_hands', display: '🙌' },
  { name: 'clap', display: '👏' },
  { name: 'laughing', display: '😆' },
  { name: 'smile', display: '😊' },
  { name: 'thinking_face', display: '🤔' },
  { name: 'slightly_smiling_face', display: '🙂' },
  { name: 'ok_hand', display: '👌' },
  { name: 'rocket', display: '🚀' },
  { name: 'star', display: '⭐' },
  { name: 'sparkles', display: '✨' },
  { name: 'white_check_mark', display: '✅' },
  { name: 'x', display: '❌' },
];

/**
 * Emoji picker popover for selecting reactions
 */
const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, anchorEl, onClose }) => {
  const handleEmojiSelect = (emojiName: string) => {
    onSelect(emojiName);
    if (onClose) {
      onClose();
    }
  };

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      <Box sx={{ p: 2, width: 280 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Choose a reaction
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {COMMON_EMOJIS.map((emoji) => (
            <IconButton
              key={emoji.name}
              size="small"
              onClick={() => handleEmojiSelect(emoji.name)}
              sx={{
                fontSize: '1.5rem',
                width: 40,
                height: 40,
                '&:hover': {
                  backgroundColor: 'action.hover',
                  transform: 'scale(1.2)',
                },
                transition: 'transform 0.1s',
              }}
              title={emoji.name}
            >
              {emoji.display}
            </IconButton>
          ))}
        </Box>
      </Box>
    </Popover>
  );
};

export default EmojiPicker;
