/*==========================================
** IMPORTS
==========================================*/

import React, { useState, useRef, useEffect } from 'react';
import jsep from 'jsep';

// Shared logic from expressionEvaluator.ts
import {
   evaluateExpression,
   mapApexTypeToJsType,
} from './expressionEvaluator';

// Zustand
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore';

// MUI components
import {
   Alert,
   Box,
   Button,
   IconButton,
   List,
   ListItem,
   Popover,
   Stack,
   TextField,
   Tooltip,
   Typography,
} from '@mui/material';
import { useTheme } from '@mui/material';

// MUI icons
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

// Types
import { AgCalculatedColumn } from '../../appInterfaces/grid/gridInterfaces';
import { SObject, SObjectMetadata } from '../../sObjectMetadataTypes';
import { APIClient } from '../../brideDesignPattern/apiInterface';

/*==========================================
** TYPES & INTERFACES
==========================================*/

interface ExpressionBuilderProps {
   apiClient: APIClient;
   calculatedColumnCopy: AgCalculatedColumn;
   rowData: SObject[];
   selectedCalculatedColumn: AgCalculatedColumn;
   selectedObjMetadata: SObjectMetadata;
   updateCalculatedColumnProperty: <K extends keyof AgCalculatedColumn>(
      key: K,
      value: AgCalculatedColumn[K]
   ) => void;
}

type FieldType = 'string' | 'boolean' | 'numeric' | 'date';

interface Field {
   name: string;
   type: FieldType;
   isDateTime: boolean;
}

interface Operator {
   symbol?: string;
   label: string;
   value: string;
}

/*==========================================
** CONSTANTS
==========================================*/

const operators = {
   common: [
      { symbol: '+', label: 'Add', value: 'Add' },
      { symbol: '-', label: 'Subtract', value: 'Subtract' },
      { symbol: '*', label: 'Multiply', value: 'Multiply' },
      { symbol: '/', label: 'Divide', value: 'Divide' },
      { symbol: '=', label: 'Equals (=)', value: 'Equals' },
      { symbol: '!=', label: 'Not Equals (!=)', value: 'NotEquals' },
      { symbol: '>', label: 'Greater Than', value: 'GreaterThan' },
      { symbol: '>=', label: 'Greater Than or Equal', value: 'GreaterThanOrEqual' },
      { symbol: '<', label: 'Less Than', value: 'LessThan' },
      { symbol: '<=', label: 'Less Than or Equal', value: 'LessThanOrEqual' },
      { symbol: '||', label: 'OR', value: 'OR' },
      { symbol: '&&', label: 'AND', value: 'AND' },
      { symbol: '()', label: '()', value: '()' },
   ],
};

/*==========================================
** COMPONENT
==========================================*/

const ExpressionBuilderGroc = ({
   calculatedColumnCopy,
   rowData,
   selectedObjMetadata,
   updateCalculatedColumnProperty,
}: ExpressionBuilderProps) => {
   /*==========================================
   ** CONTEXT
   ==========================================*/
   const theme = useTheme();

   /*==========================================
   ** GLOBAL STATE (Zustand)
   ==========================================*/
   const {
      selectedAccentColor
   } = useStore(useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor
   })));

   /*==========================================
   ** LOCAL STATE
   ==========================================*/
   const [fields, setFields] = useState<Field[]>([]);
   const [fieldMap, setFieldMap] = useState<Record<string, FieldType>>({});

   // Get user's locale from the browser
   const userLocale = navigator.language || 'en-US'; // Fallback to 'en-US' if unavailable

   const sampleRow = rowData.length > 0 ? rowData[0] as SObject : null;

   const [cursorPosition, setCursorPosition] = useState<number | null>(null);
   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
   const [validationMessage, setValidationMessage] = useState<string>('');

   /*==========================================
   ** REFS
   ==========================================*/
   const textareaRef = useRef<HTMLTextAreaElement>(null);
   const dragImageRef = useRef<HTMLDivElement>(null);

   /*==========================================
   ** DERIVED STATE / MEMOIZED VALUES
   ==========================================*/
   const open = Boolean(anchorEl);
   const id = open ? 'mouse-over-popover' : undefined;

   /*==========================================
   ** CALLBACKS
   ==========================================*/
   const insertTextAtCursor = (textToInsert: string): void => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const currentValue = calculatedColumnCopy.rule;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = currentValue?.slice(0, start) + textToInsert + currentValue?.slice(end);
      const newCursorPos = start + textToInsert.length;

      updateCalculatedColumnProperty('rule', newValue);
      setCursorPosition(newCursorPos);
   };

   // Updated addOperator function to insert operator at cursor position
   const addOperator = (operator: Operator): void => {
      if (!operator.symbol) return;
      const textToInsert = ` ${operator.symbol} `;
      insertTextAtCursor(textToInsert);
   };

   // Handle inserting a field name at the cursor position
   const handleFieldInsert = (fieldName: string): void => {
      const textToInsert = `{${fieldName}}`;
      insertTextAtCursor(textToInsert);
   };

   // Drag and drop event handlers
   const handleDragStart = (e: React.DragEvent<HTMLLIElement>, fieldName: string): void => {
      e.dataTransfer.setData('text/plain', fieldName);
      if (dragImageRef.current) {
         e.dataTransfer.setDragImage(dragImageRef.current, 5, 5);
      }
   };

   const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      const fieldName = e.dataTransfer.getData('text/plain');
      handleFieldInsert(fieldName);
   };

   const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
   };

   const formatSampleValue = (field: Field, value: any): string => {
      if (value === undefined || value === null) {
         return 'N/A';
      }
      switch (field.type) {
         case 'string':
            return value;
         case 'boolean':
            return value ? 'Yes' : 'No';
         case 'numeric':
            return value.toString();
         case 'date': {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
               return field.isDateTime ? date.toLocaleString() : date.toLocaleDateString();
            }
            return 'Invalid Date';
         }
         default:
            return value.toString();
      }
   };

   // Preprocess expression for validation (specific to component)
   const preprocessExpression = (expression: string, sampleData: SObject) => {
      return expression.replace(/\{(\w+)\}/g, (match, fieldName) => {
         const value = sampleData[fieldName];
         if (value === undefined) {
            throw new Error(`Field ${fieldName} not found in sample data`);
         }
         if (typeof value === 'string') {
            return `'${value.replace(/'/g, "\\'")}'`;
         } else if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
         } else if (value instanceof Date) {
            return value.getTime().toString();
         } else {
            return 'null';
         }
      });
   };

   // Validate the expression with number and currency formatting using user's locale
   const validateExpression = () => {
      const trimmed = calculatedColumnCopy.rule?.trim();
      if (!trimmed) {
         setValidationMessage('Expression is empty');
         return;
      }
      try {
         const sampleData = rowData[0] as SObject;
         const processedExpression = preprocessExpression(calculatedColumnCopy.rule!, sampleData);
         const ast = jsep(processedExpression);
         const { value, type } = evaluateExpression(ast, sampleData, fieldMap);
         let formattedResult;

         console.log('validateExpresssion');
         console.dir({
            type: type,
            value: value
         })

         if (type === 'date' && typeof value === 'number') {
            formattedResult = new Date(value).toLocaleString(userLocale); // Use user's locale
         } else if (type === 'number' && typeof value === 'number') {
            formattedResult = new Intl.NumberFormat(userLocale, {
               maximumFractionDigits: 2, // Adjust precision as needed
            }).format(value);
         } else {
            formattedResult = String(value);
         }
         setValidationMessage(`Expression is valid. Result is ${formattedResult}`);
      } catch (error: any) {
         setValidationMessage(`Invalid expression: ${error.message}`);
      }
   };

   /*==========================================
   ** EFFECTS
   ==========================================*/
   // Create fields list and fieldMap from selectedObjMetadata
   useEffect(() => {
      if (selectedObjMetadata && selectedObjMetadata.fields) {
         const fieldsData = selectedObjMetadata.fields
            .map((field) => {
               const jsType = mapApexTypeToJsType(field.type);
               if (jsType) {
                  return {
                     name: field.name,
                     type: jsType,
                     isDateTime: field.type === 'DATETIME',
                  };
               }
               return null;
            })
            .filter((field): field is Field => field !== null);

         const fieldMapData = fieldsData.reduce((acc, field) => {
            acc[field.name] = field.type;
            return acc;
         }, {} as Record<string, FieldType>);

         setFields(fieldsData);
         setFieldMap(fieldMapData);
      }
   }, [selectedObjMetadata]);

   useEffect(() => {
      if (cursorPosition !== null && textareaRef.current) {
         const textarea = textareaRef.current;
         textarea.setSelectionRange(cursorPosition, cursorPosition);
         textarea.focus();
         setCursorPosition(null);
      }
   }, [cursorPosition]);

   /*==========================================
   ** RENDER
   ==========================================*/
   return (
      <Box
         sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            display: 'flex',
            flexDirection: 'column',
            p: 2
         }}>
         {/* Toolbar */}
         <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               mb: 2
            }}>
            {/* Function dropdown & toolbar */}
            <Box
               sx={{
                  position: 'relative',
                  display: 'inline-block'
               }}
               onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
               onMouseLeave={() => setAnchorEl(null)}
            >
               <Stack direction={'row'} alignItems={'center'}>
                  <Typography variant="h6" sx={{ cursor: 'pointer' }}>
                     <span>Ʃ</span>
                     <ArrowDropDownIcon sx={{ fontSize: 20, verticalAlign: 'middle', ml: 1 }} />
                  </Typography>
               </Stack>

               {/* Popover content */}
               <Popover
                  id={id}
                  open={open}
                  anchorEl={anchorEl}
                  anchorOrigin={{
                     vertical: 'bottom',
                     horizontal: 'left',
                  }}
                  transformOrigin={{
                     vertical: 'top',
                     horizontal: 'left',
                  }}
                  sx={{
                     zIndex: 5000,
                     pointerEvents: 'none',
                     overflow: 'visible',
                  }}
               >
                  <Box sx={{ p: 2 }}>
                     <Typography variant="subtitle1">Functions</Typography>
                     {/* Placeholder for popover content */}
                  </Box>
               </Popover>
            </Box>

            {/* Numeric Operators */}
            {operators.common.map((op) => (
               <Tooltip title={op.label} key={op.symbol}>
                  <IconButton
                     onClick={() => addOperator(op)}
                     sx={{ fontSize: 24, color: theme.palette.text.primary, padding: 1 }}
                  >
                     <span style={{ fontSize: '24px' }}>{op.symbol}</span>
                  </IconButton>
               </Tooltip>
            ))}
         </Stack>

         {/* Expression canvas */}
         <Stack direction="row">
            <Stack
               direction="column"
               sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
               }}>
               <Typography variant="h6" sx={{ mb: 1, color: selectedAccentColor }}>
                  Expression
               </Typography>

               <TextField
                  multiline
                  rows={8}
                  value={calculatedColumnCopy.rule}
                  onChange={(e) => updateCalculatedColumnProperty('rule', e.target.value)}
                  placeholder="Build your expression here..."
                  variant="outlined"
                  inputRef={textareaRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  sx={{
                     minWidth: 500,
                     mb: 2,
                     '& .MuiOutlinedInput-root': {
                        '& .MuiInputBase-input': {
                           color: theme.palette.text.primary,
                           fontFamily: 'monospace',
                        },
                     },
                     '& fieldset': {
                        borderColor: theme.palette.text.primary,
                     },
                     '&:hover fieldset': {
                        borderColor: 'blue',
                     },
                     '&.Mui-focused fieldset': {
                        borderColor: selectedAccentColor,
                     },
                  }}
               />

               <Button variant="contained" onClick={validateExpression} size="small" sx={{ mt: 1 }}>
                  Validate
               </Button>

               {validationMessage && (
                  <Alert
                     severity={validationMessage.startsWith('Expression is valid') ? 'success' : 'error'}
                     sx={{ mt: 2 }}
                  >
                     {validationMessage}
                  </Alert>
               )}
            </Stack>

            {/* Fields list */}
            <Box
               sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  p: 1,
                  ml: 3
               }}>
               <Typography variant="h6" sx={{ mb: 1, color: selectedAccentColor }}>
                  Fields
               </Typography>

               <Box
                  sx={{
                     backgroundColor: theme.palette.background.paper,
                     color: theme.palette.text.primary,
                     mt: 1,
                     width: 'fit-content',
                     height: '300px',
                     overflowY: 'auto',
                     border: '1px solid #ccc'
                  }}>
                  <List>
                     {fields.map((field) => (
                        <ListItem
                           key={field.name}
                           draggable
                           onDragStart={(e) => handleDragStart(e, field.name)}
                           onDoubleClick={() => handleFieldInsert(field.name)}
                           sx={{ cursor: 'move', '&:hover': { backgroundColor: 'action.hover' } }}
                        >
                           <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <DragIndicatorIcon sx={{ marginRight: '8px' }} />
                              <Typography sx={{ flexGrow: 1 }}>{field.name}</Typography>
                              {sampleRow?.[field.name] !== undefined && (
                                 <Box
                                    sx={{
                                       backgroundColor: '#f0f0f0',
                                       color: 'black',
                                       padding: '2px 4px',
                                       borderRadius: '4px',
                                       marginLeft: '8px',
                                       width: '200px',
                                       overflow: 'hidden',
                                       textOverflow: 'ellipsis',
                                       whiteSpace: 'nowrap',
                                    }}
                                 >
                                    {formatSampleValue(field, sampleRow[field.name])}
                                 </Box>
                              )}
                           </Box>
                        </ListItem>
                     ))}
                  </List>
               </Box>
            </Box>
         </Stack>

         {/* Hidden drag image */}
         <div
            ref={dragImageRef}
            style={{
               position: 'absolute',
               top: '-9999px',
               width: '10px',
               height: '10px',
               backgroundColor: 'black',
               borderRadius: '50%',
            }}
         />
      </Box>
   );
};

export { ExpressionBuilderGroc };