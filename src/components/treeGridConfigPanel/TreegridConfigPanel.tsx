import React, { useEffect, useRef, useState } from 'react'; // Import useState explicitly

// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// NEW: Domain-specific selector hooks
import { useThemeState } from '../../hooks/selectors/useUIState';

import { prettyPrint } from '../../utilities/prettyPrint';

// MUI
import { AppBar, Autocomplete, Box, IconButton, Stack, TextField, Toolbar, Typography, useTheme } from '@mui/material';

// MUI icons
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

// Interfaces
import { SObjectFieldMetadata, SObjectTreeGridPreference } from '../../sObjectMetadataTypes';

interface TreeGridConfigPanelProps {
   isSubgrid?: boolean; // if true, configure subgrid preferences; else main grid
}

const TreegridConfigPanel: React.FC<TreeGridConfigPanelProps> = ({ isSubgrid = false }) => {
   const theme = useTheme();

   // Theme state from domain hook
   const { selectedAccentColor } = useThemeState();

   // Remaining global state not in domain hooks
   const {
      selectedObjMetadata,
      selectedSubgridObjMetadata,
      activeRelationName,
      selectedObject,
      selectedSubgridObject,
      mainTreePrefs,
      subgridTreePrefs,
      setShowTreegridConfigPanel,
      setTreeGridPreferences,
      setSubgridTreeGridPreferences
   } = useStore(useShallow((state) => ({
      selectedObjMetadata: state.selectedObjMetadata,
      selectedSubgridObjMetadata: state.selectedSubgridObjMetadata,
      activeRelationName: state.activeRelationName || '',
      selectedObject: state.selectedObject,
      selectedSubgridObject: state.selectedSubgridObject,
      mainTreePrefs: state.treeGridPreferences as SObjectTreeGridPreference | null,
      subgridTreePrefs: (state.subgridTreeGridPrefsByRelation?.[state.activeRelationName || '']?.prefs ?? null) || state.subgridTreeGridPreferences as SObjectTreeGridPreference | null,
      setShowTreegridConfigPanel: state.setShowTreegridConfigPanel,
      setTreeGridPreferences: state.setTreeGridPreferences,
      setSubgridTreeGridPreferences: state.setSubgridTreeGridPreferences
   })));

   // local state
   const [parentFieldOptions, setParentFieldOptions] = useState<SObjectFieldMetadata[]>([]);
   const targetIsSubgrid = isSubgrid;
   const currentPrefs = targetIsSubgrid ? subgridTreePrefs : mainTreePrefs;
   const targetMetadata = targetIsSubgrid ? selectedSubgridObjMetadata : selectedObjMetadata;
   const targetApiName = targetMetadata?.apiName
      || (targetIsSubgrid ? selectedSubgridObject?.qualifiedApiName : selectedObject?.qualifiedApiName)
      || '';

   // Normalize preferences to DTO shape { parentLookupField, groupField }
   const effectivePrefs = React.useMemo(() => {
      const p: any = currentPrefs as any;
      if (!p) return null;
      if (p.parentLookupField || p.groupField) return p;
      const raw = p.AppGridAg__Preferences__c;
      if (typeof raw === 'string') {
         const parsed = JSON.parse(raw);
         if (parsed && (parsed.parentLookupField || parsed.groupField)) {
            prettyPrint('TreeGridConfigPanel: parsed prefs from AppGridAg__Preferences__c', parsed, 'cyan');
            return parsed;
         }
      }
      // Fallback to legacy fields if present
      if (p.AppGridAg__Parent_Lookup_Field__c || p.AppGridAg__Group_Field__c) {
         return {
            parentLookupField: p.AppGridAg__Parent_Lookup_Field__c,
            groupField: p.AppGridAg__Group_Field__c,
         };
      }
      return p;
   }, [currentPrefs]);
   const [selectedParentOption, setSelectedParentOption] = useState<SObjectFieldMetadata | null>(null);

   const nameFieldMetadata = React.useMemo(() => {
      if (!targetMetadata?.fields) return null;
      return (
         targetMetadata.fields.find((f: SObjectFieldMetadata) => (f as any)?.isNameField) ||
         targetMetadata.fields.find((f) => f.name === 'Name') ||
         targetMetadata.fields[0] ||
         null
      );
   }, [targetMetadata?.fields]);
   const resolvedGroupFieldName = nameFieldMetadata?.name || 'Name';


   const treeGridBoxRef = useRef<HTMLDivElement>(null);

   // load parent lookup options: Only allow self-reference fields (Tree Data requires same-object hierarchy)
   useEffect(() => {
      if (!targetMetadata) {
         setParentFieldOptions([]);
         return;
      }

      const objMetadataFields = targetMetadata.fields || [];
      const childApi = targetMetadata.apiName;
      const lookupFields = objMetadataFields.filter(
         (f: SObjectFieldMetadata) => f.type === 'REFERENCE' && Array.isArray((f as any).referenceTo) && (f as any).referenceTo.includes(childApi)
      );

      setParentFieldOptions(lookupFields);
      prettyPrint('TreeGridConfigPanel: loaded self-reference options', { isSubgrid: targetIsSubgrid, child: childApi, options: lookupFields.map(o => o.name) }, 'cyan');
   }, [targetMetadata, targetIsSubgrid]);


   // Ensure groupField in preferences always matches the object's name field
   useEffect(() => {
      if (!currentPrefs || !resolvedGroupFieldName) return;

      const effectiveGroupField = (effectivePrefs as any)?.groupField || '';
      if (effectiveGroupField === resolvedGroupFieldName) return;

      const updated: any = {
         ...(currentPrefs as any),
         groupField: resolvedGroupFieldName,
         AppGridAg__Group_Field__c: resolvedGroupFieldName,
      };

      if (targetIsSubgrid) {
         setSubgridTreeGridPreferences(updated, activeRelationName);
      } else {
         setTreeGridPreferences(updated);
      }
   }, [activeRelationName, currentPrefs, effectivePrefs, resolvedGroupFieldName, setSubgridTreeGridPreferences, setTreeGridPreferences, targetIsSubgrid]);

   // EFFECT TO SET AUTOCOMPLETE VALUES FROM ZUSTAND PREFERENCES
   useEffect(() => {
      const hasOptions = parentFieldOptions.length > 0 && !!targetMetadata?.fields?.length;
      const hasPreferences = !!effectivePrefs; // Convert to boolean

      if (hasOptions && hasPreferences) {
         // --- Handle Parent Option ---
         const parentLookupFieldName = String(((effectivePrefs as any)?.parentLookupField || '')).trim();

         const foundParentOption = parentFieldOptions.find(f => f.name?.trim?.() === parentLookupFieldName) || null;

         if (foundParentOption) {
            if (foundParentOption !== selectedParentOption) {
               setSelectedParentOption(foundParentOption);
            }
         } else {
            // If preference value exists but no matching option is found
            prettyPrint('TreeGridConfigPanel: parent field not found in options', { wanted: parentLookupFieldName, options: parentFieldOptions.map(o => o.name) }, 'yellow');
            if (selectedParentOption) { // Clear if current selected option is stale
               setSelectedParentOption(null);
            }
         }

         const groupFieldName = (effectivePrefs as any)?.groupField || resolvedGroupFieldName || '';
         prettyPrint('TreeGridConfigPanel: prefs applied', { isSubgrid: targetIsSubgrid, parentLookupFieldName, groupFieldName }, 'cyan');
      } else if (!hasPreferences && selectedParentOption) {
         // If preferences become null, clear the selected options
         setSelectedParentOption(null);
         prettyPrint('TreeGridConfigPanel: cleared selections (no prefs)', { isSubgrid: targetIsSubgrid }, 'yellow');
      }
   }, [parentFieldOptions, effectivePrefs, resolvedGroupFieldName, selectedParentOption, targetMetadata, targetIsSubgrid]);

   // Log incoming prefs once when panel mounts/updates
   useEffect(() => {
      prettyPrint('TreeGridConfigPanel: raw prefs', currentPrefs as any, 'cyan');
      prettyPrint('TreeGridConfigPanel: effective prefs', effectivePrefs as any, 'cyan');
   }, [currentPrefs, effectivePrefs]);

   return (
      <Box
         ref={treeGridBoxRef}
         data-name="TreeGridPrefsBox"
         sx={{
            typography: 'body1',
            border: 1,
            height: '100%',
            width: 350,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
            mt: 0,
            mb: 0,
            boxSizing: 'border-box',
         }}
      >
         <AppBar position="sticky" sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>
            <Toolbar variant="dense">
               <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  sx={{ ml: -1 }}
                  onClick={() => setShowTreegridConfigPanel(false)}
               >
                  <ChevronLeftIcon />
               </IconButton>
               <Typography variant="button" color="inherit" component="div">
                  TreeGrid Preferences
               </Typography>
            </Toolbar>
         </AppBar>

         {/* parentId selector */}
         <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 1, px: 2, width: '100%', overflowX: 'hidden' }}>
            <Typography sx={{ color: selectedAccentColor, width: 100 }}>
               ParentId:
            </Typography>
            <Autocomplete
               disablePortal
               getOptionLabel={(option: SObjectFieldMetadata) => option?.label || option?.name || ''}
               isOptionEqualToValue={(option, value) => option.name === value?.name}
               onChange={(_event, value) => {
                  const newParentFieldName = value?.name || '';
                  const newPrefs: any = {
                     parentLookupField: newParentFieldName,
                     AppGridAg__Parent_Lookup_Field__c: newParentFieldName,
                     groupField: resolvedGroupFieldName,
                     AppGridAg__Group_Field__c: resolvedGroupFieldName,
                     AppGridAg__SObjectApiName__c: targetApiName,
                     sObjectApiName: targetApiName,
                  };
                  if ((currentPrefs as any)?.Id) newPrefs.Id = (currentPrefs as any).Id;
                  if (targetIsSubgrid) {
                     setSubgridTreeGridPreferences(newPrefs as any, activeRelationName);
                  } else {
                     setTreeGridPreferences(newPrefs as any);
                  }
               }}
               options={parentFieldOptions}
               value={selectedParentOption} // Use local state here
               size="small"
               sx={{
                  flexGrow: 1,
                  minWidth: 0,
                  width: '100%',
                  input: { color: theme.palette.text.primary },
                  '& .MuiAutocomplete-clearIndicator, & .MuiAutocomplete-popupIndicator': {
                     color: theme.palette.text.primary,
                  },
               }}
               renderInput={(params) => (
                  <TextField
                     {...params}
                     variant="standard"
                     sx={{
                        width: '100%',
                        '& .MuiInputLabel-root': { color: theme.palette.text.primary },
                        '& .MuiInputLabel-root.Mui-focused': { color: theme.palette.text.primary },
                        '& .MuiInput-underline:before': { borderBottomColor: theme.palette.text.primary },
                        '& .MuiInput-underline:hover:before': { borderBottomColor: theme.palette.text.primary },
                        '& .MuiInput-underline:after': { borderBottomColor: theme.palette.text.primary },
                     }}
                  />
               )}
            />
         </Stack>

         {/* display-only hierarchy field */}
         <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 1, px: 2, width: '100%' }}>
            <Typography sx={{ color: selectedAccentColor, width: 100 }}>
               Hierarchy:
            </Typography>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
               <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                  {(nameFieldMetadata?.label || resolvedGroupFieldName) + ' (auto)'}
               </Typography>
            </Box>
         </Stack>
      </Box>
   );
};

export default TreegridConfigPanel;
