import React, { useState, useEffect, useRef } from 'react';
import { TextField, useTheme } from '@mui/material';
import { SObjectFieldMetadata } from '../../sObjectMetadataTypes';

interface MuiTextEditorProps {
   field: SObjectFieldMetadata;
   rule?: any; // Syncfusion rule object
   ruleID: string;
   qryBldrRef: React.RefObject<any>;
}

export default function MuiTextEditor({ field, rule, ruleID, qryBldrRef }: MuiTextEditorProps) {
   const theme = useTheme();

   // Controlled value state
   const [value, setValue] = useState(rule?.value || '');
   const [isEditing, setIsEditing] = useState(false);

   // Refs for focus and cursor position
   const inputRef = useRef<HTMLInputElement>(null);
   const cursorPositionRef = useRef<number | null>(null);

   // Local state for errors
   const [localErrors, setLocalErrors] = useState<string[]>([]);

   // Handle input change
   const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      // Store cursor position before update
      const selectionStart = inputRef.current?.selectionStart ?? null;
      setValue(newValue);
      cursorPositionRef.current = selectionStart; // Update cursor position
   };

   // Handle blur to notify QueryBuilder
   const handleBlur = () => {
      if (value === '' && !field.isNillable) {
         setLocalErrors([`${field.label || field.name} is required`]);
      } else {
         setLocalErrors([]);
         const elem = document.getElementById(ruleID)?.querySelector('.e-rule-value');
         if (elem && qryBldrRef.current) {
            qryBldrRef.current.notifyChange(value || null, elem, 'value');
         }
      }
      setIsEditing(false); // Exit edit mode
   };

   // Handle click to enter edit mode
   const handleClick = () => {
      if (!isEditing && inputRef.current) {
         setIsEditing(true);
         setTimeout(() => {
            inputRef.current?.focus();
            // Set initial cursor position to where clicked
            const cursorPos = inputRef.current?.selectionStart ?? value.length;
            if (inputRef.current && cursorPos !== null) {
               inputRef.current.setSelectionRange(cursorPos, cursorPos);
            }
         }, 0);
      }
   };

   // Sync with rule.value changes from QueryBuilder
   useEffect(() => {
      setValue(rule?.value || '');
      setLocalErrors([]);
   }, [rule?.value]);

   // Restore cursor position after value update during editing
   useEffect(() => {
      if (isEditing && inputRef.current && document.activeElement === inputRef.current) {
         const cursorPos = cursorPositionRef.current;
         if (cursorPos !== null && cursorPos >= 0 && cursorPos <= value.length) {
            inputRef.current.setSelectionRange(cursorPos, cursorPos);
         }
         cursorPositionRef.current = null; // Reset after applying
      }
   }, [value, isEditing]);

   return (
      <TextField
         inputRef={inputRef}
         type="text"
         variant="standard"
         value={value}
         onChange={handleChange}
         onBlur={handleBlur}
         onClick={handleClick}
         sx={{
            mt: -1,
            '& .MuiInputBase-input': { color: theme.palette.text.primary },
            width: '250px', // Increased by 50px for better visibility
         }}
         error={localErrors.length > 0}
         helperText={localErrors.length > 0 ? localErrors.join(', ') : null}
      />
   );
}
