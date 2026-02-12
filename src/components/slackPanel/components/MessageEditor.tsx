import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, CircularProgress, Chip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { prettyPrint } from '../../../utilities/prettyPrint';

interface MessageEditorProps {
  placeholder?: string;
  onSend: (text: string, html: string, files?: File[]) => Promise<void>;
  initialContent?: string;
  disabled?: boolean;
}

/**
 * Reusable Quill message editor component
 * Features rich text editing with toolbar and send button
 */
const MessageEditor: React.FC<MessageEditorProps> = ({
  placeholder = 'Type a message',
  onSend,
  initialContent = '',
  disabled = false
}) => {
  const theme = useTheme();
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Initialize Quill editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Guard against double initialization
    if (quillRef.current) return;

    // Additional guard: check if Quill was already initialized on this element
    if (editorRef.current.classList.contains('ql-container')) return;

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder: placeholder,
      modules: {
        toolbar: {
          container: [
            [{ header: [1, 2, 3, false] }],
            [{ size: ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
            ['clean'],
            ['attach-file'], // Custom button for file upload
          ],
          handlers: {
            'attach-file': () => {
              // Trigger file input click
              fileInputRef.current?.click();
            },
          },
        },
      },
    });

    // Add custom button icon and tooltips to toolbar after Quill initialization
    const toolbar = quill.getModule('toolbar') as { container: HTMLElement } | null;

    // Add custom attach file button icon
    const attachButton = toolbar?.container.querySelector('.ql-attach-file');
    if (attachButton) {
      // Paperclip icon for file attachment
      attachButton.innerHTML = '<svg viewBox="0 0 18 18"><path class="ql-stroke" d="M14,9c0,3-2.5,5.5-5.5,5.5S3,12,3,9c0-3,2.5-5.5,5.5-5.5S14,6,14,9z M8.5,14.5c3,0,5.5-2.5,5.5-5.5s-2.5-5.5-5.5-5.5S3,6,3,9s2.5,5.5,5.5,5.5z M12,4.5c0.5,0.5,0.5,1.5,0,2L6.5,12c-0.5,0.5-1.5,0.5-2,0c-0.5-0.5-0.5-1.5,0-2L10,4.5C10.5,4,11.5,4,12,4.5z"></path></svg>';
      attachButton.setAttribute('title', 'Attach file');
    }

    // Add tooltips to all toolbar buttons
    const tooltips: { [key: string]: string } = {
      '.ql-bold': 'Bold',
      '.ql-italic': 'Italic',
      '.ql-underline': 'Underline',
      '.ql-strike': 'Strikethrough',
      '.ql-header[value="1"]': 'Heading 1',
      '.ql-header[value="2"]': 'Heading 2',
      '.ql-header[value="3"]': 'Heading 3',
      '.ql-size[value="small"]': 'Small',
      '.ql-size[value="large"]': 'Large',
      '.ql-size[value="huge"]': 'Huge',
      '.ql-list[value="ordered"]': 'Numbered list',
      '.ql-list[value="bullet"]': 'Bulleted list',
      '.ql-indent[value="-1"]': 'Decrease indent',
      '.ql-indent[value="+1"]': 'Increase indent',
      '.ql-color': 'Text color',
      '.ql-background': 'Background color',
      '.ql-align': 'Text align',
      '.ql-clean': 'Remove formatting',
    };

    Object.entries(tooltips).forEach(([selector, title]) => {
      const button = toolbar?.container.querySelector(selector);
      if (button) {
        button.setAttribute('title', title);
      }
    });

    quillRef.current = quill;

    // Set initial content if provided
    if (initialContent) {
      quill.clipboard.dangerouslyPasteHTML(initialContent);
    }

    // Handle Enter key to send (Shift+Enter for newline)
    quill.keyboard.addBinding({
      key: 'Enter',
      handler: () => {
        const text = quill.getText().trim();
        if (text) {
          handleSendMessage();
        }
        return false; // Prevent default newline
      },
    });

    // Handle Shift+Enter for newline
    quill.keyboard.addBinding({
      key: 'Enter',
      shiftKey: true,
      handler: () => {
        quill.insertText(quill.getSelection()?.index || 0, '\n');
        return false;
      },
    });

    return () => {
      // Clean up Quill instance
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove dependencies to only initialize once

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
      prettyPrint(`[MessageEditor] Added ${newFiles.length} file(s)`, newFiles.map(f => f.name), 'blue');
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSendMessage = async () => {
    if (!quillRef.current || sending || disabled) return;

    const text = quillRef.current.getText().trim();
    const html = quillRef.current.root.innerHTML;

    // Allow sending if there's text OR files
    if (!text && attachedFiles.length === 0) return;

    try {
      setSending(true);
      await onSend(text, html, attachedFiles.length > 0 ? attachedFiles : undefined);

      // Clear the editor and files after successful send
      quillRef.current.setText('');
      setAttachedFiles([]);
      setSending(false);
    } catch (err) {
      prettyPrint('Failed to send message:', err, 'red');
      setSending(false);
    }
  };

  return (
    <Box>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
          backgroundColor: theme.palette.background.paper,
          '& .ql-container': {
            border: 'none',
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
          '& .ql-editor': {
            minHeight: '80px',
            maxHeight: '200px',
            overflowY: 'auto',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
          '& .ql-toolbar': {
            border: 'none',
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: theme.palette.background.paper,
          },
          // Style toolbar buttons for dark mode
          '& .ql-toolbar .ql-stroke': {
            stroke: theme.palette.text.primary,
          },
          '& .ql-toolbar .ql-fill': {
            fill: theme.palette.text.primary,
          },
          '& .ql-toolbar .ql-picker-label': {
            color: theme.palette.text.primary,
          },
          '& .ql-toolbar .ql-picker-options': {
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          },
          '& .ql-toolbar .ql-picker-item': {
            color: theme.palette.text.primary,
          },
          '& .ql-toolbar button:hover .ql-stroke': {
            stroke: theme.palette.primary.main,
          },
          '& .ql-toolbar button:hover .ql-fill': {
            fill: theme.palette.primary.main,
          },
          '& .ql-toolbar button.ql-active .ql-stroke': {
            stroke: theme.palette.primary.main,
          },
          '& .ql-toolbar button.ql-active .ql-fill': {
            fill: theme.palette.primary.main,
          },
          // Placeholder text color
          '& .ql-editor.ql-blank::before': {
            color: theme.palette.text.secondary,
          },
        }}
      >
        <Box ref={editorRef} sx={{ width: '100%' }} />
      </Box>

      {/* File attachments display */}
      {attachedFiles.length > 0 && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {attachedFiles.map((file, index) => (
            <Chip
              key={`${file.name}-${index}`}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ maxWidth: 150 }} noWrap>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({formatFileSize(file.size)})
                  </Typography>
                </Box>
              }
              size="small"
              onDelete={() => handleRemoveFile(index)}
              deleteIcon={<CloseIcon />}
              sx={{
                maxWidth: 250,
                '& .MuiChip-label': {
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            />
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
        {/* Send button */}
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={sending || disabled}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&:disabled': {
              bgcolor: 'action.disabledBackground',
            },
          }}
        >
          {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default MessageEditor;
