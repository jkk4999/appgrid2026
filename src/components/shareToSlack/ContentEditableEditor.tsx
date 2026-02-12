import React, { useRef, useEffect } from 'react';

// MUI
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Divider,
} from '@mui/material';

// MUI icons
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';
import CodeIcon from '@mui/icons-material/Code';

interface ContentEditableEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minHeight?: number;
}

/**
 * A simple rich text editor using native contenteditable
 * Works in Salesforce Lightning by using browser-native APIs
 */
const ContentEditableEditor: React.FC<ContentEditableEditorProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Enter your message here...',
  minHeight = 300,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      const html = editorRef.current.innerHTML;
      onChange(html);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  const handleUnderline = () => execCommand('underline');
  const handleStrikethrough = () => execCommand('strikeThrough');
  const handleBulletList = () => execCommand('insertUnorderedList');
  const handleNumberedList = () => execCommand('insertOrderedList');
  const handleCode = () => execCommand('formatBlock', '<pre>');

  const handleLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
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
          <Tooltip title="Bold">
            <IconButton
              size="small"
              onClick={handleBold}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Italic">
            <IconButton
              size="small"
              onClick={handleItalic}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Underline">
            <IconButton
              size="small"
              onClick={handleUnderline}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Strikethrough">
            <IconButton
              size="small"
              onClick={handleStrikethrough}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <StrikethroughSIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Code">
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
          <Tooltip title="Bullet List">
            <IconButton
              size="small"
              onClick={handleBulletList}
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            >
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Numbered List">
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
          <Tooltip title="Link">
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

      {/* ContentEditable Area */}
      <Box
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        suppressContentEditableWarning
        sx={{
          border: 1,
          borderColor: 'divider',
          borderTop: 0,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          minHeight,
          p: 2,
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: '0.875rem',
          '&:empty::before': {
            content: `"${placeholder}"`,
            color: 'text.secondary',
            pointerEvents: 'none',
          },
          '& pre': {
            backgroundColor: 'action.hover',
            padding: 1,
            borderRadius: 1,
            fontFamily: 'monospace',
          },
        }}
      />
    </Box>
  );
};

export default ContentEditableEditor;
