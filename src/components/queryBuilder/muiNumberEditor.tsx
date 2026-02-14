import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { TextField } from '@mui/material';
import { SObjectFieldMetadata } from '../../sObjectMetadataTypes';
// import useStore from '../../zustandStore'; // Not directly used in the component's logic for focus

interface MuiNumericEditorProps {
   field: SObjectFieldMetadata;
   rule?: any; // Syncfusion RuleModel
   ruleID: string;
   qryBldrRef: React.RefObject<any>;
}

export default function MuiNumberEditor({ field, rule, ruleID, qryBldrRef }: MuiNumericEditorProps) {
   const locale = useMemo(() => navigator.language || 'en-US', []);
   const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

   const isBetweenOperator = rule?.operator === 'between' || rule?.operator === 'notbetween';

   // Raw values are what the user types directly.
   const [singleRawValue, setSingleRawValue] = useState('');
   const [betweenRawValues, setBetweenRawValues] = useState<[string, string]>(['', '']);

   // Formatted values are for display when not editing.
   const [singleFormattedValue, setSingleFormattedValue] = useState('');
   const [betweenFormattedValues, setBetweenFormattedValues] = useState<[string, string]>(['', '']);

   const [isEditing, setIsEditing] = useState(false);
   const [activeInputIndex, setActiveInputIndex] = useState<0 | 1 | null>(null); // For 'between'
   const [localErrors, setLocalErrors] = useState<string[]>([]);

   const singleInputRef = useRef<HTMLInputElement>(null);
   const minInputRef = useRef<HTMLInputElement>(null);
   const maxInputRef = useRef<HTMLInputElement>(null);

   const parseFormattedValue = useCallback((formatted: string): number | null => {
      if (formatted === '') return null;
      const cleaned = formatted.replace(/[^0-9.-]/g, '').replace(/(\..*)\./g, '$1');
      const parsed = Number(cleaned);
      return isNaN(parsed) ? null : parsed;
   }, []);

   // Initialize/Sync state when rule changes (from external QueryBuilder)
   useEffect(() => {
      // Only update if not currently editing, to avoid disrupting user input
      if (isEditing) return;

      if (isBetweenOperator) {
         if (Array.isArray(rule?.value) && rule.value.length === 2) {
            const [min, max] = rule.value;
            const newRawMin = min !== null && !isNaN(min) ? min.toString() : '';
            const newRawMax = max !== null && !isNaN(max) ? max.toString() : '';
            const newFormattedMin = min !== null && !isNaN(min) ? numberFormatter.format(min) : '';
            const newFormattedMax = max !== null && !isNaN(max) ? numberFormatter.format(max) : '';

            setBetweenRawValues([newRawMin, newRawMax]);
            setBetweenFormattedValues([newFormattedMin, newFormattedMax]);
         } else {
            // Rule changed away from a valid 'between' structure
            setBetweenRawValues(['', '']);
            setBetweenFormattedValues(['', '']);
         }
      } else {
         const val = rule?.value;
         if (val !== null && val !== undefined && !isNaN(val)) {
            setSingleRawValue(val.toString());
            setSingleFormattedValue(numberFormatter.format(val));
         } else {
            setSingleRawValue('');
            setSingleFormattedValue('');
         }
      }
      setLocalErrors([]); // Clear errors when rule changes externally
   }, [rule?.value, rule?.operator, isBetweenOperator, numberFormatter, isEditing, field.isNillable]); // Added isEditing

   // Handle single input change - ONLY update raw value
   const handleSingleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const regex = /^[-\d]*\.?\d*$/; // Allows empty, negative, decimal
      if (regex.test(value)) {
         setSingleRawValue(value);
      }
   }, []);

   const notify = useCallback((payload: any) => {
      const elem = document.getElementById(ruleID)?.querySelector('.e-rule-value');
      if (elem && qryBldrRef.current) {
         qryBldrRef.current.notifyChange(payload, elem, 'value');
      }
   }, [qryBldrRef, ruleID]);

   const scheduleRangeCommit = useCallback((min: number | null, max: number | null) => {
      const hasMin = typeof min === 'number' && !isNaN(min);
      const hasMax = typeof max === 'number' && !isNaN(max);

      if (hasMin && hasMax) {
         const minVal = min!;
         const maxVal = max!;
         setTimeout(() => notify([minVal, maxVal]), 30);
         return;
      }

      if (!hasMin && !hasMax) {
         setTimeout(() => notify([]), 30);
      }
      // Ignore partial input (one side empty) to prevent rule deletion.
   }, [notify]);

   // Handle between input change - ONLY update raw value (commit handled on blur)
   const handleBetweenInputChange = useCallback((index: 0 | 1) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const regex = /^[-\d]*\.?\d*$/;
      if (regex.test(value)) {
         setBetweenRawValues(prev => {
            const newValues = [...prev] as [string, string];
            newValues[index] = value;
            return newValues;
         });
      }
   }, []);

   const applyFormatAndNotify = useCallback((rawValue: string, isNillable: boolean, forBetweenIndex?: 0 | 1) => {
      const parsed = parseFormattedValue(rawValue);
      let currentErrors: string[] = [];

      if (parsed === null && !isNillable) {
         currentErrors.push(`${field.label || field.name} is required`);
      }

      setLocalErrors(currentErrors);

      if (currentErrors.length === 0) {
         const formatted = parsed !== null ? numberFormatter.format(parsed) : '';
         if (forBetweenIndex !== undefined) {
            // This part is tricky because blur on one 'between' input shouldn't notify
            // until both are valid. This logic needs to be in a combined blur handler.
            // For now, just update the individual formatted value for 'between'
            setBetweenFormattedValues(prev => {
               const newFormatted = [...prev] as [string, string];
               newFormatted[forBetweenIndex] = formatted;
               return newFormatted;
            });
            // Delay notification for 'between' until the combined blur.
         } else {
            setSingleFormattedValue(formatted);
            const valueToNotify = parsed;
            notify(valueToNotify);
         }
      }
      return parsed; // Return parsed value for combined 'between' blur logic
   }, [parseFormattedValue, field, numberFormatter, notify]);


   const handleSingleBlur = useCallback(() => {
      setIsEditing(false);
      applyFormatAndNotify(singleRawValue, field.isNillable);
   }, [singleRawValue, field.isNillable, applyFormatAndNotify]);

   const handleBetweenBlur = useCallback(() => {
      const parsedMin = parseFormattedValue(betweenRawValues[0]);
      const parsedMax = parseFormattedValue(betweenRawValues[1]);
      let currentErrors: string[] = [];

      if ((parsedMin === null || parsedMax === null) && !field.isNillable) {
         currentErrors.push(`${field.label || field.name} requires both min and max values`);
      } else if (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax) {
         currentErrors.push('Min value must be less than or equal to Max value');
      }

      setLocalErrors(currentErrors);

      if (currentErrors.length === 0) {
         setBetweenFormattedValues([
            parsedMin !== null ? numberFormatter.format(parsedMin) : '',
            parsedMax !== null ? numberFormatter.format(parsedMax) : '',
         ]);
         scheduleRangeCommit(parsedMin, parsedMax);
      }

      // Delay toggling edit mode until focus leaves both inputs.
      setTimeout(() => {
         const activeEl = document.activeElement;
         if (
            activeEl === minInputRef.current ||
            activeEl === maxInputRef.current
         ) {
            return;
         }
         setIsEditing(false);
      }, 0);
   }, [betweenRawValues, parseFormattedValue, numberFormatter, scheduleRangeCommit, field]);

   const handleFocus = useCallback((inputType: 'single' | 'between', index?: 0 | 1) => {
      if (!isEditing) {
         setIsEditing(true);
         // When focusing, the input's value will switch to the raw value
         // because the `value` prop depends on `isEditing`.
         // We just need to ensure the correct input gets DOM focus.
         setTimeout(() => {
            if (inputType === 'single' && singleInputRef.current) {
               singleInputRef.current.focus();
               singleInputRef.current.select(); // Select all text on focus
            } else if (inputType === 'between' && index !== undefined) {
               setActiveInputIndex(index); // Keep track of which 'between' input is active
               const ref = index === 0 ? minInputRef : maxInputRef;
               if (ref.current) {
                  ref.current.focus();
                  ref.current.select(); // Select all text on focus
               }
            }
         }, 0);
      }
   }, [isEditing]); // Dependency on isEditing


   // Determine current value for display based on isEditing
   const displaySingleValue = isEditing ? singleRawValue : singleFormattedValue;
   const displayBetweenMin = isEditing ? betweenRawValues[0] : betweenFormattedValues[0];
   const displayBetweenMax = isEditing ? betweenRawValues[1] : betweenFormattedValues[1];

   const sharedInputSx = {
      mt: 0,
      width: '100%',
      '& .MuiInputBase-root': {
         minHeight: 32,
         display: 'flex',
         alignItems: 'center',
         paddingBottom: 0,
         paddingRight: 0,
         paddingLeft: 0,
         transform: 'translateY(-10px)',
      },
      '& .MuiInputBase-input': {
         padding: '4px 0 0 !important',
         lineHeight: '24px',
      },
   };

   const sharedSlotProps = {
      inputLabel: {
         shrink: true,
         sx: {
            transform: 'translate(0, -8px) scale(0.75)',
            transformOrigin: 'top left',
         },
      },
   } as const;

   const containerStyle = { width: 250, flexShrink: 0, transform: 'translateY(6px)' };

   return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
         {isBetweenOperator ? (
            <>
               <div style={containerStyle}>
                  <TextField
                     inputRef={minInputRef}
                     type="text"
                     variant="standard"
                     label="Min"
                     value={displayBetweenMin}
                     onChange={handleBetweenInputChange(0)}
                     onFocus={() => handleFocus('between', 0)}
                     onBlur={handleBetweenBlur}
                     sx={sharedInputSx}
                     error={localErrors.length > 0}
                     helperText={localErrors.length > 0 && activeInputIndex === 0 ? localErrors.join(', ') : null}
                     slotProps={{
                        htmlInput: { inputMode: 'decimal' },
                        inputLabel: sharedSlotProps.inputLabel,
                     }}
                  />
               </div>
               <div style={containerStyle}>
                  <TextField
                     inputRef={maxInputRef}
                     type="text"
                     variant="standard"
                     label="Max"
                     value={displayBetweenMax}
                     onChange={handleBetweenInputChange(1)}
                     onFocus={() => handleFocus('between', 1)}
                     onBlur={handleBetweenBlur}
                     sx={sharedInputSx}
                     error={localErrors.length > 0}
                     helperText={localErrors.length > 0 && activeInputIndex === 1 ? localErrors.join(', ') : null}
                     slotProps={{
                        htmlInput: { inputMode: 'decimal' },
                        inputLabel: sharedSlotProps.inputLabel,
                     }}
                  />
               </div>
            </>
         ) : (
            <div style={containerStyle}>
               <TextField
                  inputRef={singleInputRef}
                  type="text"
                  variant="standard"
                  value={displaySingleValue}
                  onChange={handleSingleInputChange}
                  onFocus={() => handleFocus('single')}
                  onBlur={handleSingleBlur}
                  sx={sharedInputSx}
                  error={localErrors.length > 0}
                  helperText={localErrors.length > 0 ? localErrors.join(', ') : null}
                  slotProps={{
                     htmlInput: { inputMode: 'decimal' },
                     inputLabel: sharedSlotProps.inputLabel,
                  }}
               />
            </div>
         )}
      </div>
   );
}
