import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw, ContentState, convertFromHTML } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

interface DraftJsEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minHeight?: number;
}

const DraftJsEditor: React.FC<DraftJsEditorProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Enter your message here...',
  minHeight = 400,
}) => {
  const [editorState, setEditorState] = useState(() => {
    if (value) {
      const blocksFromHTML = convertFromHTML(value);
      const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
      );
      return EditorState.createWithContent(contentState);
    }
    return EditorState.createEmpty();
  });

  // Update editor when value prop changes externally
  useEffect(() => {
    const currentContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    if (value !== currentContent) {
      if (value) {
        const blocksFromHTML = convertFromHTML(value);
        const contentState = ContentState.createFromBlockArray(
          blocksFromHTML.contentBlocks,
          blocksFromHTML.entityMap
        );
        setEditorState(EditorState.createWithContent(contentState));
      } else {
        setEditorState(EditorState.createEmpty());
      }
    }
  }, [editorState, value]);

  const handleEditorStateChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    const html = draftToHtml(convertToRaw(newEditorState.getCurrentContent()));
    if (html !== value) {
      onChange(html);
    }
  };

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        '& .rdw-editor-wrapper': {
          border: 'none',
        },
        '& .rdw-editor-toolbar': {
          borderBottom: 1,
          borderColor: 'divider',
          marginBottom: 0,
          padding: 1,
        },
        '& .rdw-editor-main': {
          minHeight,
          padding: 2,
        },
      }}
    >
      <Editor
        editorState={editorState}
        onEditorStateChange={handleEditorStateChange}
        placeholder={placeholder}
        readOnly={disabled}
        toolbar={{
          options: ['inline', 'blockType', 'list', 'textAlign', 'link', 'history'],
          inline: {
            options: ['bold', 'italic', 'underline', 'strikethrough', 'code'],
          },
          blockType: {
            inDropdown: true,
            options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote', 'Code'],
          },
          list: {
            options: ['unordered', 'ordered'],
          },
          textAlign: {
            options: ['left', 'center', 'right', 'justify'],
          },
          link: {
            options: ['link'],
          },
        }}
      />
    </Box>
  );
};

export default DraftJsEditor;
