/*
   this editor is designed for use with ReactHookForm and Zod
*/

import React, { useCallback, useEffect, useMemo, useState, useId } from 'react';

// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// MUI
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, CircularProgress, IconButton, Menu, MenuItem, useTheme } from '@mui/material';
import Portal from '@mui/material/Portal';
// Using default MUI Popper; custom Popper removed

// MUI Icons
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Notifications
import { useSnackbar } from 'notistack';

import { prettyPrint } from '../../utilities/prettyPrint';

// Interfaces
interface Option {
   id: string | null;
   label: string;
}

interface WhoIdOption {
   name: string;
   label: string;
}

interface WhatIdOption {
   name: string;
   label: string;
}

interface Relation {
   Id: string;
   Name: string;
}

import { OrgObject } from '../../sObjectMetadataTypes';

// RHF props from gridEditDialog
import { EditorProps } from './gridEditDialog';

import { QueryServiceParams } from '../../brideDesignPattern/apiInterface';

import { debounce } from 'lodash-es';

export default function MuiAutocompleteEditor({
   apiClient,
   field,
   fieldProps,
   objMetadataMap,
   selectedRow,
   isReadOnly,
}: EditorProps<string | null>) {
   // prettyPrint('>>> rendering MuiAutocompleteEditor', null, 'blue');

   // Notifications
   const { enqueueSnackbar } = useSnackbar();

   const theme = useTheme();

   // Global state
   const [loading, setLoading] = useState(false);
   const { selectedAccentColor, whatIdOptionsState } = useStore(useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor || 'black',
      whatIdOptionsState: state.objectOptions,
   })));

   // Local state
   const [options, setOptions] = useState<Option[]>([]);
   const [value, setValue] = useState<Option | null>(null);
   const [inputValue, setInputValue] = useState<string>('');
   const [parentObjName, setParentObjName] = useState<string>('');
   const [selectedWhatObjectType, setSelectedWhatObjectType] = useState<string>('');
   const [selectedWhoObjectType, setSelectedWhoObjectType] = useState<string>('');

   const disabledLabel = alpha(selectedAccentColor, 0.8);
   const [popupOpen, setPopupOpen] = useState<boolean>(false);
   const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

   const whatIdOptions: WhatIdOption[] = useMemo(
      () => whatIdOptionsState.map((item: OrgObject) => ({ name: item.qualifiedApiName, label: item.label })),
      [whatIdOptionsState]
   );

   const whoIdOptions: WhoIdOption[] = [
      { name: 'Lead', label: 'Lead' },
      { name: 'Contact', label: 'Person' },
   ];

   // Menu anchors
   const [whoAnchorEl, setWhoAnchorEl] = useState<null | HTMLElement>(null);
   const [whatAnchorEl, setWhatAnchorEl] = useState<null | HTMLElement>(null);

   // Menu handlers
   const handleWhoMenuClose = () => setWhoAnchorEl(null);
   const handleWhatMenuClose = () => setWhatAnchorEl(null);
   const handleWhoMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => setWhoAnchorEl(event.currentTarget);
   const handleWhatMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => setWhatAnchorEl(event.currentTarget);

   const handleWhatSelectChange = (option: WhatIdOption) => {
      setSelectedWhatObjectType(option.name);
      setValue(null);
      fieldProps.onChange(null);
      handleWhatMenuClose();
   };

   const handleWhoSelectChange = (option: WhoIdOption) => {
      setSelectedWhoObjectType(option.name);
      setValue(null);
      fieldProps.onChange(null);
      handleWhoMenuClose();
   };

   // Fetch parent metadata (stable identity to avoid effect loops)
   const getReferenceMetadata = useCallback(async (parentObjName: string) => {

      if (!objMetadataMap?.current?.has(parentObjName)) {
         prettyPrint('[MuiAutocompleteEditor] getReferenceMetadata()', null, 'blue');
         const metadata = await apiClient?.getMetadata({ sObjectName: parentObjName });
         // prettyPrint('[MuiAutocompleteEditor] metadata result is', metadata, 'blue');
         if (metadata) {
            objMetadataMap?.current?.set(parentObjName, metadata);
         }
         return metadata;
      }

      prettyPrint('[MuiAutocompleteEditor] returning objMetadataMap metadata', null, 'blue');
      return objMetadataMap?.current?.get(parentObjName);
   }, [apiClient, objMetadataMap]);

   // Fetch autocomplete data


   // Debounced function to fetch options


   // Initialize value once per record/field to avoid restoring after user clears
   const didInitRef = React.useRef(false);
   useEffect(() => {
      const initializeValue = async () => {
         if (didInitRef.current) {
            return;
         }

         if (!selectedRow || !field.relationshipName) {
            setValue(null);
            // fieldProps.onChange(null);
            setOptions([]);
            return;
         }

         didInitRef.current = true;

         prettyPrint('[MuiAutocompleteEditor] executing initializeValue for field', field.name, 'blue');

         const relationshipName = field.relationshipName;

         const relationObj = (selectedRow as any)[relationshipName] as Relation | null;

         prettyPrint('[MuiAutocompleteEditor] relation name is', relationshipName, 'blue');

         prettyPrint('[MuiAutocompleteEditor] selectedRow is', selectedRow, 'blue');

         prettyPrint('[MuiAutocompleteEditor] relationObj is', relationObj, 'blue');

         if (!relationObj || !relationObj.Id || !relationObj.Name) {
            prettyPrint('[MuiAutocompleteEditor] initializeValue missing relation info', {
               relationObj,
               field: field.name,
               rawValue: (selectedRow as any)[field.relationshipName || ''],
            }, 'purple');

            setValue(null);

            setInputValue('');

            setOptions([]);
         } else {
            const initialOption: Option = { id: relationObj.Id, label: relationObj.Name };

            setValue(initialOption);

            setInputValue(initialOption.label);

            setOptions([initialOption]);

            if (!fieldProps.value) {
               prettyPrint('[MuiAutocompleteEditor] initializeValue applying default to form state', initialOption, 'purple');

               fieldProps.onChange(initialOption.id);
            }
         }

         prettyPrint('[MuiAutocompleteEditor] initializeValue completed', null, 'blue');
      };

      initializeValue();
   }, [field, fieldProps, selectedRow]);

   // Handle polymorphic fields
   useEffect(() => {
      const getParentObjName = async () => {
         if (!fieldProps.value) {
            return null;
         }

         try {
            prettyPrint('[MuiAutocompleteEditor] getParentObjName()', null, 'blue')
            const result = await apiClient?.getSObjectName({ recordId: fieldProps.value });
            prettyPrint('[MuiAutocompleteEditor] getParentObjName() result', result, 'blue')

            return result?.sObjectName
         } catch (error: any) {
            console.error(`getParentObjName - Error: ${error.message}`);
            return null;
         }
      };

      const updateParentObjName = async () => {
         console.log(`handle polymorphic fields - getting parentObjName for field ${field.name}`)

         if (fieldProps?.value && field.referenceTo?.length > 1) {
            const parentObjName = await getParentObjName();
            if (parentObjName) {
               setParentObjName(parentObjName);

               if (field.name === 'WhoId') {
                  setSelectedWhoObjectType(parentObjName);
               } else if (field.name === 'WhatId') {
                  setSelectedWhatObjectType(parentObjName);
               }
            }
         }
      };

      if (field.name === 'WhatId' || field.name === 'WhoId') {
         updateParentObjName();
      }
   }, [apiClient, field, fieldProps]);

   // Build options based on input (stable and guarded to avoid render loops)
   const fetchOptions = React.useCallback(async (query: string) => {
      prettyPrint('getData() input value is', query, 'blue');
      if (!query) return setOptions([]);

      setLoading(true);
      let referenceTo: string | undefined;
      if (field.name === 'WhoId' && selectedWhoObjectType) {
         referenceTo = selectedWhoObjectType;
      } else if (field.name === 'WhatId' && selectedWhatObjectType) {
         referenceTo = selectedWhatObjectType;
      } else if (field.referenceTo?.length > 1) {
         if (!parentObjName) { setLoading(false); return; }
         referenceTo = parentObjName;
      } else {
         referenceTo = field.referenceTo?.[0];
      }
      if (!referenceTo) { setLoading(false); return; }

      try {
         const parentMetadata = await getReferenceMetadata(referenceTo);
         const parentNameField = parentMetadata?.fields.find((f: any) => f.isNameField)?.name;
         if (!parentNameField) throw new Error('Name field not found');

         const queryRule = { condition: 'AND', rules: [{ field: parentNameField, operator: 'startswith', type: 'string', value: query }] };

         const paramsObj: QueryServiceParams = { sObjectName: referenceTo, queryRule: JSON.stringify(queryRule), subQueryRule: null, subQueryRelation: null };

         prettyPrint('getData() paramsObj is', paramsObj, 'blue');

         const apiResult = await apiClient!.executeDynamicSOQL(paramsObj);

         prettyPrint('getData() apiResult is', apiResult, 'green');

         if (apiResult.status === 'error') throw new Error(apiResult.errorMessage);

         const suggestData: Option[] = apiResult.records!.map((rec: any) => ({ id: String(rec.Id), label: String(rec[parentNameField]) }));

         prettyPrint('getData() setting options to', suggestData, 'green');

         setOptions(suggestData);
      } catch (error: any) {
         console.error('Error fetching options:', error);
         enqueueSnackbar(`Error fetching options: ${error.message}`, { variant: 'error' });
         setOptions([]);
      } finally {
         setLoading(false);
      }
   }, [apiClient, enqueueSnackbar, field.name, field.referenceTo, getReferenceMetadata, parentObjName, selectedWhatObjectType, selectedWhoObjectType]);

   const debouncedFetch = React.useMemo(
      () => debounce((q: string) => { void fetchOptions(q); }, 300),
      [fetchOptions]
   );

   // Avoid duplicate queries by tracking the last issued query string
   const lastQueryRef = React.useRef<string>('');

   useEffect(() => {
      const selectedLabel = (value?.label ?? '').trim();
      const input = (inputValue ?? '').trim();
      const isTypingDifferent = input.length > 0 && input !== selectedLabel;

      if (isInputFocused && isTypingDifferent && input.length > 2) {
         if (lastQueryRef.current !== input) {
            lastQueryRef.current = input;
            debouncedFetch(input);
         } else {
            prettyPrint('Skipping duplicate query', input, 'orange');
         }
      } else if (options.length && input.length <= 2) {
         // Only clear when needed; avoid re-render loop
         setOptions([]);
      }
      return () => { debouncedFetch.cancel(); };
      // Only react to typing intent, not to options length changes
   }, [debouncedFetch, isInputFocused, inputValue, value, options.length]);

   // Control popup visibility deterministically (Aura/LWS-friendly)
   useEffect(() => {
      const selectedLabel = (value?.label ?? '').trim();
      const input = (inputValue ?? '').trim();
      const isTypingDifferent = input.length > 0 && input !== selectedLabel;
      const shouldOpen = isInputFocused && input.length > 2 && options.length > 0 && !loading && isTypingDifferent;
      if (popupOpen !== shouldOpen) setPopupOpen(shouldOpen);
   }, [isInputFocused, inputValue, value, options.length, loading, popupOpen]);


   // Bridge native input events to controlled state (works inside Aura/LWS)
   const inputRef = React.useRef<HTMLInputElement | null>(null);
   // Attach native input listener once; aura-safe bridge to update inputValue
   useEffect(() => {
      const el = inputRef.current;
      if (!el) return;
      const handleInput = (e: Event) => {
         const txt = (e.target as HTMLInputElement)?.value ?? '';
         prettyPrint('handling input event', txt, 'red')
         setInputValue(txt);
      };
      const onFocus = () => setIsInputFocused(true);
      const onBlur = () => setIsInputFocused(false);
      prettyPrint('attaching input event listener to input ref', null, 'blue')
      el.addEventListener('input', handleInput, true);
      el.addEventListener('focus', onFocus, true);
      el.addEventListener('blur', onBlur, true);
      return () => {
         el.removeEventListener('input', handleInput, true);
         el.removeEventListener('focus', onFocus, true);
         el.removeEventListener('blur', onBlur, true);
      };
   }, []);

   // Detect if Popper fails to render (Aura/LWS). If so, show an inline fallback dropdown.
   const [showFallback, setShowFallback] = useState(false);
   const listboxMarker = useId();
   useEffect(() => {
      if (!popupOpen || !isInputFocused) { setShowFallback(false); return; }
      const t = setTimeout(() => {
         try {
            const listbox = document.querySelector(`ul[data-editor-listbox='${listboxMarker}']`) as HTMLElement | null;
            const popper = listbox ? (listbox.closest('.MuiAutocomplete-popper') as HTMLElement | null) : null;
            const isVisible = (node: HTMLElement | null) => !!node && getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden' && node.getClientRects().length > 0;
            const visible = isVisible(popper) && isVisible(listbox);
            const next = !visible;
            if (next !== showFallback) {
               prettyPrint('[MuiAutocompleteEditor] Fallback ' + (next ? 'ENABLED' : 'DISABLED'), {
                  inputValue,
                  optionsLen: options.length,
                  loading,
               }, next ? 'red' : 'green');
            }
            setShowFallback(next);
         } catch { setShowFallback(true); }
      }, 100);
      return () => clearTimeout(t);
   }, [popupOpen, isInputFocused, options.length, inputValue, loading, showFallback, listboxMarker]);

   // Using default MUI Popper; custom Popper removed

   // Keyboard support for fallback list
   useEffect(() => {
      const el = inputRef.current;
      if (!el) return;
      const handleKeyDown = (e: KeyboardEvent) => {
         if (!showFallback || !options.length) return;
         if (e.key === 'ArrowDown' || e.key === 'Down') {
            e.preventDefault();
            // No highlight tracking; hover handles visual selection; ensure list stays open
            setPopupOpen(true);
         } else if (e.key === 'Escape') {
            e.preventDefault();
            setShowFallback(false);
            setPopupOpen(false);
         }
      };
      el.addEventListener('keydown', handleKeyDown, true);
      return () => el.removeEventListener('keydown', handleKeyDown, true);
   }, [showFallback, options.length]);

   // Anchors for positioning the inline fallback like MUI Popper (bottom-start of Autocomplete root)
   const wrapperRef = React.useRef<HTMLDivElement | null>(null);
   const autoRootRef = React.useRef<HTMLDivElement | null>(null);
   const [fallbackPos, setFallbackPos] = useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: 0 });

   const updateFallbackPosition = React.useCallback(() => {
      const root = autoRootRef.current;
      if (!root) return;
      const rootRect = root.getBoundingClientRect();
      const left = Math.max(0, Math.round(rootRect.left));
      const top = Math.max(0, Math.round(rootRect.bottom + 8)); // +8px offset like Popper
      const width = Math.round(rootRect.width);
      setFallbackPos({ left, top, width });
   }, []);

   useEffect(() => {
      if (!(popupOpen && showFallback)) return;
      updateFallbackPosition();
      const onResize = () => updateFallbackPosition();
      const onScroll = () => updateFallbackPosition();
      window.addEventListener('resize', onResize, true);
      document.addEventListener('scroll', onScroll, true);
      return () => {
         window.removeEventListener('resize', onResize, true);
         document.removeEventListener('scroll', onScroll, true);
      };
   }, [popupOpen, showFallback, updateFallbackPosition]);

   return (
      <div ref={wrapperRef} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
         {field.name === 'WhoId' && (
            <>
               <IconButton onClick={handleWhoMenuOpen} sx={{ color: theme.palette.text.primary }}>
                  <FileDownloadIcon />
               </IconButton>
               <Menu
                  anchorEl={whoAnchorEl}
                  open={Boolean(whoAnchorEl)}
                  onClose={handleWhoMenuClose}
                  sx={{ zIndex: 2147483647 }}
               >
                  {whoIdOptions.map((option, index: number) => (
                     <MenuItem
                        key={index}
                        onClick={() => handleWhoSelectChange(option)}
                        selected={selectedWhoObjectType === option?.name}
                        sx={{
                           '&.Mui-selected': {
                              backgroundColor: 'rgba(0, 0, 0, 0.1)',
                              color: 'red',
                           },
                           '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.2)',
                           },
                        }}
                     >
                        {option.label}
                     </MenuItem>
                  ))}
               </Menu>
            </>
         )}
         {field.name === 'WhatId' && (
            <>
               <IconButton onClick={handleWhatMenuOpen} sx={{ color: theme.palette.text.primary }}>
                  <FileDownloadIcon />
               </IconButton>
               <Menu
                  anchorEl={whatAnchorEl}
                  open={Boolean(whatAnchorEl)}
                  onClose={handleWhatMenuClose}
                  sx={{ zIndex: 2147483647 }}
               >
                  {whatIdOptions.map((option, index: number) => (
                     <MenuItem
                        key={index}
                        onClick={() => handleWhatSelectChange(option)}
                        selected={selectedWhatObjectType === option.name}
                        sx={{
                           '&.Mui-selected': {
                              backgroundColor: 'rgba(0, 0, 0, 0.1)',
                              color: 'red',
                           },
                           '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.2)',
                           },
                        }}
                     >
                        {option.label}
                     </MenuItem>
                  ))}
               </Menu>
            </>
         )}
         <Autocomplete
            disabled={isReadOnly}
            // Keep portal (defaults to body) to avoid clipping by overflow containers
            options={options}
            value={value}
            inputValue={inputValue}
            open={popupOpen}
            ref={autoRootRef as any}
            onOpen={() => setPopupOpen(true)}
            onClose={() => setPopupOpen(false)}
            onChange={(_, newValue) => {
               console.log(`updating form value to ${newValue}`)
               setValue(newValue);
               // Keep input text in sync with selection for controlled inputValue
               setInputValue(newValue?.label ?? '');
               fieldProps.onChange(newValue?.id || null);
            }}
            onInputChange={(_, newInputValue, reason) => {
               // Use native input listener for 'input' to be Aura-safe; only handle explicit clear here
               if (reason === 'clear') {
                  prettyPrint('onInputChange(clear) -> empty input', newInputValue, 'red');
                  setInputValue('');
                  lastQueryRef.current = '';
               }
            }}
            // Use server-side results as-is
            filterOptions={(x) => x}
            slotProps={{
               popper: {
                  placement: 'bottom-start',
                  popperOptions: { strategy: 'fixed' },
                  modifiers: [
                     { name: 'computeStyles', enabled: true, options: { gpuAcceleration: false } },
                  ],
                  style: { zIndex: 2147483647 },
               },
               paper: { sx: { zIndex: 2147483647 } },
               listbox: { 'data-editor-listbox': listboxMarker } as any,
            }}
            clearOnBlur={false}
            blurOnSelect={false}
            // Native input bridge also updates inputValue in Aura/LWS
            isOptionEqualToValue={(option, val) => option.id === val?.id}
            getOptionLabel={(option) => option.label}
            loading={loading}
            renderInput={(params) => (
               <TextField
                  {...params}
                  inputRef={inputRef}
                  label={field.label}
                  placeholder={undefined}
                  required={!field.isNillable}
                  slotProps={{
                     input: {
                        endAdornment: (
                           <>
                              {loading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                           </>
                        ),
                     },
                     inputLabel: { shrink: true },
                  }}
               />
            )}
            // renderOption={(props, option) => (
            //    <li {...props} key={option.id}>
            //       {option.label}
            //    </li>
            // )}
            sx={{
               '& .MuiInputBase-input': {
                  color: theme.palette.text.primary,
               },
               '& .MuiFormLabel-root': {
                  color: selectedAccentColor,
                  '&&': {
                     color: selectedAccentColor,
                  },
               },
               '& .MuiInputBase-input.Mui-disabled': {
                  color: '#888888',
                  WebkitTextFillColor: '#888888',
               },
               '& .MuiFormLabel-root.Mui-disabled': {
                  color: disabledLabel,
               },
            }}
         />
         {popupOpen && showFallback && options.length > 0 && (
            <Portal>
               <div
                  data-name="AutocompleteFallback"
                  role="listbox"
                  style={{
                     position: 'fixed',
                     top: fallbackPos.top,
                     left: fallbackPos.left,
                     width: fallbackPos.width,
                     background: theme.palette.background.paper,
                     border: `1px solid ${theme.palette.divider}`,
                     borderRadius: 4,
                     boxShadow: '0px 4px 20px rgba(0,0,0,0.2)',
                     zIndex: 2147483647,
                     maxHeight: 280,
                     overflowY: 'auto',
                     padding: '4px 0',
                  }}
               >
                  {options.map((opt, idx) => (
                     <div
                        key={opt.id ?? opt.label}
                        onMouseDown={(e) => e.preventDefault()} // avoid input blur
                        onClick={() => {
                           setValue(opt);
                           setInputValue(opt.label);
                           fieldProps.onChange(opt.id || null);
                           setPopupOpen(false);
                           setShowFallback(false);
                        }}
                        role="option"
                        aria-selected={false}
                        style={{
                           padding: '6px 16px',
                           cursor: 'pointer',
                           color: theme.palette.text.primary,
                           lineHeight: 1.5,
                           backgroundColor: idx === 0 ? 'transparent' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                           e.currentTarget.style.backgroundColor = alpha(selectedAccentColor, 0.12);
                        }}
                        onMouseLeave={(e) => {
                           e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                     >
                        {opt.label}
                     </div>
                  ))}
               </div>
            </Portal>
         )}
      </div>
   );
}
