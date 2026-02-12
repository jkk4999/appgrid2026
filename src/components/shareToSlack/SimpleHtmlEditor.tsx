import React, { useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Stack,
  Divider,
  Typography,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';
import CodeIcon from '@mui/icons-material/Code';

interface SimpleHtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minHeight?: number;
}

/**
 * A simple HTML editor that works in Salesforce Lightning by avoiding
 * complex DOM selection APIs. Inserts HTML tags directly into the text.
 */
const SimpleHtmlEditor: React.FC<SimpleHtmlEditorProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Enter your message here...',
  minHeight = 400,
}) => {
  const textFieldRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Insert HTML tags around selected text
   */
  const wrapSelection = (openTag: string, closeTag: string) => {
    const textarea = textFieldRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    const newValue = beforeText + openTag + selectedText + closeTag + afterText;
    onChange(newValue);

    // Set cursor position after the closing tag
    setTimeout(() => {
      const newCursorPos = start + openTag.length + selectedText.length + closeTag.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  /**
   * Insert text at cursor position
   */
  const insertAtCursor = (textToInsert: string) => {
    const textarea = textFieldRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    const newValue = beforeText + textToInsert + afterText;
    onChange(newValue);

    // Set cursor position after the inserted text
    setTimeout(() => {
      const newCursorPos = start + textToInsert.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBold = () => wrapSelection('<strong>', '</strong>');
  const handleItalic = () => wrapSelection('<em>', '</em>');
  const handleUnderline = () => wrapSelection('<u>', '</u>');
  const handleStrikethrough = () => wrapSelection('<s>', '</s>');
  const handleCode = () => wrapSelection('<code>', '</code>');

  const handleBulletList = () => {
    const textarea = textFieldRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      // Wrap selected lines in list
      const lines = selectedText.split('\n').filter(line => line.trim());
      const listItems = lines.map(line => `  <li>${line.trim()}</li>`).join('\n');
      const list = `<ul>\n${listItems}\n</ul>`;

      const beforeText = value.substring(0, start);
      const afterText = value.substring(end);
      onChange(beforeText + list + afterText);
    } else {
      // Insert empty list
      insertAtCursor('<ul>\n  <li></li>\n</ul>');
    }
  };

  const handleNumberedList = () => {
    const textarea = textFieldRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      // Wrap selected lines in list
      const lines = selectedText.split('\n').filter(line => line.trim());
      const listItems = lines.map(line => `  <li>${line.trim()}</li>`).join('\n');
      const list = `<ol>\n${listItems}\n</ol>`;

      const beforeText = value.substring(0, start);
      const afterText = value.substring(end);
      onChange(beforeText + list + afterText);
    } else {
      // Insert empty list
      insertAtCursor('<ol>\n  <li></li>\n</ol>');
    }
  };

  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      wrapSelection(`<a href="${url}">`, '</a>');
    }
  };

  return (
    <Box>
      {/* Formatting Toolbar */}
      <Paper
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          p: 1,
          display: 'flex',
          gap: 0.5,
          flexWrap: 'wrap',
        }}
      >
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Bold (<strong>)">
            <IconButton
              size="small"
              onClick={handleBold}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Italic (<em>)">
            <IconButton
              size="small"
              onClick={handleItalic}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Underline (<u>)">
            <IconButton
              size="small"
              onClick={handleUnderline}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Strikethrough (<s>)">
            <IconButton
              size="small"
              onClick={handleStrikethrough}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <StrikethroughSIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Code (<code>)">
            <IconButton
              size="small"
              onClick={handleCode}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <CodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Divider orientation="vertical" flexItem />

        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Bullet List (<ul>)">
            <IconButton
              size="small"
              onClick={handleBulletList}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Numbered List (<ol>)">
            <IconButton
              size="small"
              onClick={handleNumberedList}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <FormatListNumberedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Divider orientation="vertical" flexItem />

        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Link (<a>)">
            <IconButton
              size="small"
              onClick={handleLink}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Text Field */}
      <TextField
        inputRef={textFieldRef}
        multiline
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            minHeight: minHeight,
          },
          '& textarea': {
            minHeight: minHeight - 32,
          },
        }}
      />

      {/* Preview */}
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderTop: 0,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          p: 2,
          minHeight: 100,
          maxHeight: 200,
          overflowY: 'auto',
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Preview:
        </Typography>
        <Box
          dangerouslySetInnerHTML={{ __html: value || '<em>Nothing to preview</em>' }}
          sx={{
            '& ul, & ol': {
              paddingLeft: 2,
            },
            '& a': {
              color: 'primary.main',
              textDecoration: 'underline',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default SimpleHtmlEditor;
