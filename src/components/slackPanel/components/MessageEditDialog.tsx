import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { prettyPrint } from '../../../utilities/prettyPrint';

interface MessageEditDialogProps {
  open: boolean;
  initialText: string;
  onClose: () => void;
  onSave: (text: string, html: string) => Promise<void>;
}

/**
 * Dialog for editing an existing message
 * Uses Quill editor for rich text formatting
 */
const MessageEditDialog: React.FC<MessageEditDialogProps> = ({
  open,
  initialText,
  onClose,
  onSave,
}) => {
  const theme = useTheme();
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Quill when dialog opens and DOM is ready
  useEffect(() => {
    prettyPrint('[MessageEditDialog] useEffect triggered', {
      open,
      editorRefCurrent: editorRef.current,
      quillRefCurrent: quillRef.current,
    }, 'blue');

    if (!open) {
      prettyPrint('[MessageEditDialog] Dialog not open, skipping initialization', null, 'blue');
      return;
    }

    // MUI Dialog renders content when opening, so we need to wait a tick for the DOM
    const timeoutId = setTimeout(() => {
      prettyPrint('[MessageEditDialog] After timeout - checking editorRef', {
        editorRefCurrent: editorRef.current,
        quillRefCurrent: quillRef.current,
      }, 'blue');

      if (!editorRef.current) {
        prettyPrint('[MessageEditDialog] ❌ editorRef.current is STILL null after timeout!', null, 'red');
        return;
      }

      // Only initialize once
      if (quillRef.current) {
        prettyPrint('[MessageEditDialog] Quill already initialized, updating content', null, 'blue');
        // Set the content (plain text, not HTML)
        if (initialText) {
          quillRef.current.setText(initialText);
        } else {
          quillRef.current.setText('');
        }
        quillRef.current.focus();
        return;
      }

      // Check if Quill was already initialized on this element
      if (editorRef.current.classList.contains('ql-container')) {
        prettyPrint('[MessageEditDialog] Element already has ql-container class, skipping', null, 'blue');
        return;
      }

      prettyPrint('[MessageEditDialog] ***** INITIALIZING QUILL EDITOR *****', null, 'blue');

      // Initialize Quill
      try {
        const quill = new Quill(editorRef.current, {
          theme: 'snow',
          placeholder: 'Edit your message...',
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['blockquote', 'code-block'],
              ['link'],
              ['clean'],
            ],
          },
        });

        quillRef.current = quill;
        prettyPrint('[MessageEditDialog] ✅ Quill initialized successfully!', quill, 'green');

        // Set initial content
        if (initialText) {
          quill.setText(initialText);
        }
        quill.focus();
      } catch (error) {
        prettyPrint('[MessageEditDialog] ❌ Failed to initialize Quill:', error, 'red');
      }
    }, 0); // 0ms timeout to wait for next tick after Dialog renders

    return () => clearTimeout(timeoutId);
  }, [open, initialText]);

  const handleSave = async () => {
    if (!quillRef.current) return;

    try {
      setSaving(true);
      setError(null);

      const text = quillRef.current.getText().trim();
      const html = quillRef.current.root.innerHTML;

      if (!text) {
        setError('Message cannot be empty');
        setSaving(false);
        return;
      }

      await onSave(text, html);
      onClose();
    } catch (err: any) {
      prettyPrint('Failed to save message:', err, 'red');
      setError(err.message || 'Failed to save message');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      aria-labelledby="edit-message-dialog-title"
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'transparent',
        },
      }}
    >
      <DialogTitle
        id="edit-message-dialog-title"
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        Edit Message
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Box
          ref={editorRef}
          sx={{
            minHeight: 150,
            backgroundColor: theme.palette.background.paper,
            '& .ql-container': {
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            },
            '& .ql-editor': {
              minHeight: 150,
              fontSize: '0.875rem',
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            },
            '& .ql-toolbar': {
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
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Edited messages will show &quot;(edited)&quot; indicator
        </Typography>
      </DialogContent>
      <DialogActions
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Button onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageEditDialog;
