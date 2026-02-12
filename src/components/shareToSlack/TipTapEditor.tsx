import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Box, Paper, IconButton, Divider, Tooltip, ButtonGroup } from '@mui/material';
import 'shadow-root-get-selection-polyfill';

// Icons
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import CodeIcon from '@mui/icons-material/Code';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minHeight?: number;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Enter your message here...',
  minHeight = 300,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    element: editorRef.current || undefined,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== value) {
        onChange(html);
      }
    },
  });

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  // Update editable state when disabled prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  const addLink = () => {
    if (!editor) return;
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    if (!editor) return;
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <Box>
      {/* Toolbar */}
      <Paper
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          p: 1,
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        {/* Text formatting */}
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Bold">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={disabled}
              sx={{
                backgroundColor: editor.isActive('bold') ? 'action.selected' : 'transparent',
              }}
            >
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Italic">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={disabled}
              sx={{
                backgroundColor: editor.isActive('italic') ? 'action.selected' : 'transparent',
              }}
            >
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Strikethrough">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={disabled}
              sx={{
                backgroundColor: editor.isActive('strike') ? 'action.selected' : 'transparent',
              }}
            >
              <StrikethroughSIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Code">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={disabled}
              sx={{
                backgroundColor: editor.isActive('code') ? 'action.selected' : 'transparent',
              }}
            >
              <CodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Lists and quotes */}
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Bullet List">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              disabled={disabled}
              sx={{
                backgroundColor: editor.isActive('bulletList') ? 'action.selected' : 'transparent',
              }}
            >
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Numbered List">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              disabled={disabled}
              sx={{
                backgroundColor: editor.isActive('orderedList') ? 'action.selected' : 'transparent',
              }}
            >
              <FormatListNumberedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Blockquote">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              disabled={disabled}
              sx={{
                backgroundColor: editor.isActive('blockquote') ? 'action.selected' : 'transparent',
              }}
            >
              <FormatQuoteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Link and Image */}
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Add Link">
            <IconButton
              size="small"
              onClick={addLink}
              disabled={disabled}
              sx={{
                backgroundColor: editor.isActive('link') ? 'action.selected' : 'transparent',
              }}
            >
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Add Image">
            <IconButton
              size="small"
              onClick={addImage}
              disabled={disabled}
            >
              <ImageIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Undo/Redo */}
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Undo">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={disabled || !editor.can().undo()}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Redo">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={disabled || !editor.can().redo()}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Paper>

      {/* Editor Content */}
      <Box
        ref={editorRef}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderTop: 0,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          minHeight,
          '& .ProseMirror': {
            padding: 2,
            minHeight: minHeight - 16,
            outline: 'none',
            '& p.is-editor-empty:first-of-type::before': {
              content: `"${placeholder}"`,
              float: 'left',
              color: 'text.secondary',
              pointerEvents: 'none',
              height: 0,
            },
          },
        }}
      >
        {editor && <EditorContent editor={editor} />}
      </Box>
    </Box>
  );
};

export default TipTapEditor;
