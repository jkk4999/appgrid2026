/*==========================================
** IMPORTS
==========================================*/
// React
import React, { useState, useEffect, useCallback, useRef } from 'react';

// Zustand
import useStore from '../../zustandStore'

import { useShallow } from 'zustand/react/shallow';

// Custom Hooks
import { useGridStyleState, type GridContext } from '../../hooks/selectors';

import { useThemeState } from '../../hooks/selectors/useUIState';

import useGridAssets from '../../hooks/grid/useGridAssets';

// Utilities
import { prettyPrint } from '../../utilities/prettyPrint';

// PubSubJS
import PubSub from 'pubsub-js';

// Components
import { RowStyleNameTab } from './rowStyleNameTab';

import { RowStyleSettings } from './rowStyleSettings'

import { RowStyleTab } from './rowStyleTab';

import ErrorBoundary from '../errorBoundry/ErrorBoundary';

import LoadingIndicator from '../loadingIndicator/LoadingIndicator';

// MUI
import { AppBar, Box, Button, Dialog, DialogActions, DialogContent, Tab, Toolbar, Typography } from '@mui/material';

import { TabContext, TabList, TabPanel } from '@mui/lab';

import { useTheme } from '@mui/material/styles';

// Syncfusion
import { QueryBuilderComponent } from '@syncfusion/ej2-react-querybuilder';

import { createQueryBuilderColumns } from '../../gridMethods/createQueryBuilderColumns';

// Types
import { AgRowStyle } from '../../appInterfaces/grid/gridInterfaces';

/*==========================================
** HELPER FUNCTIONS
==========================================*/
function a11yProps(index: number | string) {
   return {
      id: `vertical-tab-${index}`,
      'aria-controls': `vertical-tabpanel-${index}`,
   };
}

/*==========================================
** CONSTANTS
==========================================*/
const brightBlueHeaderColor = '#1976d2';

const defaultRowStyle: AgRowStyle = {
   name: '',
   description: '',
   rule: {
      condition: 'and',
      rules: [],
      not: false
   },
   backgroundColorOpacity: 1,
   colorOpacity: 1,
   borderColorOpacity: 1,
   active: false
};

/*==========================================
** COMPONENT
==========================================*/
const FormatRowWizard = () => {

   /*==========================================
   ** CONTEXT
   ==========================================*/
   const theme = useTheme();

   /*==========================================
   ** GLOBAL STATE (Zustand)
   ==========================================*/
   // Get customStylePanelProps from store (shared config passed from parent)
   const { customStylePanelProps } = useStore(
      useShallow((state) => ({ customStylePanelProps: state.customStylePanelProps }))
   );

   // Extract props from customStylePanelProps
   const {
      apiClient,
      isSubgrid = false,
      sObjectApiName,
      objMetadata,
      rowData,
      saveAgGridState,
   } = customStylePanelProps || {};

   // Convert isSubgrid to GridContext for unified hooks
   const context: GridContext = isSubgrid ? 'subgrid' : 'main';

   // Use unified context-based hooks
   const {
      rowStyles: objRowStyles,
      selectedRowStyle,
      setShowFormatRowDialog,
      showFormatRowDialog,
   } = useGridStyleState(context);

   // Also get subgrid visibility state for dialog open check
   const { showFormatRowDialog: showSubgridFormatRowDialog } = useGridStyleState('subgrid');

   // Theme state
   const { selectedAccentColor } = useThemeState();

   /*==========================================
   ** CUSTOM HOOKS
   ==========================================*/
   // Bind assets to current grid context
   const { setStyles } = useGridAssets({ isSubgrid });

   /*==========================================
   ** REFS
   ==========================================*/
   const qbRef = useRef<QueryBuilderComponent>(null);
   const ignoreFirstChange = useRef(true);

   /*==========================================
   ** LOCAL STATE
   ==========================================*/
   const [isRuleValid, setIsRuleValid] = useState(true);
   const [selectedTab, setSelectedTab] = React.useState<string>('0');
   const [rowStyleCopy, setRowStyleCopy] = React.useState<AgRowStyle>(selectedRowStyle ?? defaultRowStyle)
   const [qbColumns, setQbColumns] = useState<any[]>([]);
   const [exprReady, setExprReady] = useState(false);
   const [qbMounted, setQbMounted] = useState(false);

   prettyPrint('[FormatRowWizard] props', {
      isSubgrid,
      objRowStyles,
      objMetadata,
      rowData,
      selectedRowStyle,
      sObjectApiName,
   }, 'blue');

   /*==========================================
   ** CALLBACKS
   ==========================================*/
   const updateRowStyleProperty = <K extends keyof AgRowStyle>(key: K, value: AgRowStyle[K]) => {
      setRowStyleCopy(prev => ({
         ...prev,
         [key]: value
      }));
   };

   // Simple validator (minimal): non-empty rules and each rule has field/operator/value
   const validateRule = useCallback((rule: any): boolean => {
      const requiresArrayWithItems = (op: string) => op === 'in' || op === 'notin';
      const requiresTwoValues = (op: string) => op === 'between' || op === 'notbetween';

      const hasValidValue = (op: string, val: any) => {
         if (requiresArrayWithItems(op)) return Array.isArray(val) && val.length > 0;
         if (requiresTwoValues(op)) return Array.isArray(val) && val.length === 2 && val.every((v: any) => v !== undefined && v !== null && v !== '');
         // for all other ops, allow boolean false and numeric 0; only reject undefined/null/empty string
         return !(val === undefined || val === null || val === '');
      };

      const walk = (node: any): boolean => {
         if (!node || !Array.isArray(node.rules) || node.rules.length === 0) return false;
         return node.rules.every((r: any) => {
            // group: recurse
            if (r && Array.isArray(r.rules)) return walk(r);
            const fieldOk = !!r?.field;
            const op = String(r?.operator ?? '');
            const opOk = op.length > 0;
            const valOk = hasValidValue(op, r?.value);
            return fieldOk && opOk && valOk;
         });
      };

      return Boolean(walk(rule));
   }, []);

   const saveRowStyles = () => {
      const saveStyles = async () => {
         // create a conditional styles object
         const styleToSave: AgRowStyle = {
            name: rowStyleCopy.name,
            rule: rowStyleCopy.rule
         }

         if (rowStyleCopy.backgroundColorChecked) {
            styleToSave['backgroundColorChecked'] = rowStyleCopy.backgroundColorChecked;
            styleToSave['backgroundColor'] = rowStyleCopy.backgroundColor;
            styleToSave['backgroundColorOpacity'] = rowStyleCopy.backgroundColorOpacity
         }

         if (rowStyleCopy.borderColorChecked) {
            styleToSave['borderColorChecked'] = rowStyleCopy.borderColorChecked;
            styleToSave['borderColor'] = rowStyleCopy.borderColor;
            styleToSave['borderColorOpacity'] = rowStyleCopy.borderColorOpacity
         }

         if (rowStyleCopy.colorChecked) {
            styleToSave['colorChecked'] = rowStyleCopy.colorChecked;
            styleToSave['color'] = rowStyleCopy.color;
            styleToSave['colorOpacity'] = rowStyleCopy.colorOpacity
         }

         if (rowStyleCopy.fontSizeChecked) {
            styleToSave['fontSizeChecked'] = rowStyleCopy.fontSizeChecked;
            styleToSave['fontSize'] = rowStyleCopy.fontSize;
         }

         if (rowStyleCopy.fontStyleChecked) {
            styleToSave['fontStyleChecked'] = rowStyleCopy.fontStyleChecked;
            styleToSave['fontStyle'] = rowStyleCopy.fontStyle;
         }

         if (rowStyleCopy.cellAlignmentChecked) {
            styleToSave['cellAlignmentChecked'] = rowStyleCopy.cellAlignmentChecked;
            styleToSave['cellAlignment'] = rowStyleCopy.cellAlignment;
         }

         styleToSave['excludeGroupRows'] = rowStyleCopy.excludeGroupRows;
         styleToSave['excludeRowSummaries'] = rowStyleCopy.excludeRowSummaries
         styleToSave['description'] = rowStyleCopy.description;
         styleToSave['active'] = rowStyleCopy.active

         const currentStyles = [...(objRowStyles || [])];

         const existingIndex = currentStyles.findIndex(
            (style) => style.name === styleToSave.name
         );

         let updatedStyles;
         if (existingIndex !== -1) {
            // Update existing style
            updatedStyles = currentStyles.map((style, index) =>
               index === existingIndex ? styleToSave : style
            );
         } else {
            // Add new style
            updatedStyles = [...currentStyles, styleToSave];
         }

         // Centralized setter for styles pipeline (bound)
         setStyles({ rows: updatedStyles });
         saveAgGridState?.()

         setShowFormatRowDialog(false);
      }

      saveStyles();
   }

   /*==========================================
   ** EVENT HANDLERS
   ==========================================*/
   const handleChange = (event: React.SyntheticEvent, newValue: string) => {
      setSelectedTab(newValue);
   };

   /*==========================================
   ** EFFECTS
   ==========================================*/
   // Sync local copy when the selected style arrives later
   useEffect(() => {
      if (selectedRowStyle) {
         setRowStyleCopy(selectedRowStyle);
      }
   }, [selectedRowStyle]);

   // Defer mount of QueryBuilder on Condition tab for stability
   useEffect(() => {
      if (selectedTab === '1' && !exprReady) {
         setExprReady(false);
         const id = setTimeout(() => setExprReady(true), 0);
         return () => clearTimeout(id);
      }
   }, [selectedTab, exprReady]);

   // Mark mounted once ready
   useEffect(() => {
      if (selectedTab === '1' && exprReady && !qbMounted) {
         setQbMounted(true);
      }
   }, [selectedTab, exprReady, qbMounted]);

   // Build QueryBuilder columns from metadata
   useEffect(() => {
      try {
         if (!objMetadata || !apiClient) {
            setQbColumns([]);
            return;
         }
         const cols = createQueryBuilderColumns(objMetadata as any, qbRef as any, apiClient as any) || [];
         setQbColumns(cols);
      } catch (e) {
         console.warn('[FormatRowWizard] createQueryBuilderColumns threw; using fallback', e);
         setQbColumns([]);
      }
   }, [apiClient, objMetadata]);

   // Validate rule whenever it changes (always call QueryBuilder.getRules())
   useEffect(() => {
      if (!qbRef.current || !rowStyleCopy) {
         return;
      }

      const currentRule = qbRef.current.getRules();
      prettyPrint('[FormatRowWizard] currentRule is', currentRule, 'blue');

      const valid = validateRule(currentRule);
      prettyPrint(`[FormatRowWizard] is current rule valid: ${valid}`, null, 'blue');
      setIsRuleValid(valid);

   }, [rowStyleCopy, validateRule]);

   // Sync from template broadcasts (e.g., picklist) and update validity
   useEffect(() => {
      const token = PubSub.subscribe('QB_RULE_CHANGED', () => {
         const qb = qbRef.current;
         if (!qb || typeof qb.getRules !== 'function') return;
         const currentRule = qb.getRules();
         setRowStyleCopy(prev => ({ ...prev, rule: currentRule }));
         setIsRuleValid(validateRule(currentRule));
      });
      return () => {
         PubSub.unsubscribe(token);
      }
   }, [validateRule]);

   /*==========================================
   ** RENDER
   ==========================================*/
   return (
      <Dialog
         fullWidth
         maxWidth={false}
         slotProps={{ paper: { sx: { width: '70vw', maxWidth: '70vw' } } }}
         sx={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.palette.text.primary,
            zIndex: 1300,
            '& .MuiDialog-paper': {
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            },
            '& .MuiBackdrop-root': {
               backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
         }}
         open={showFormatRowDialog || showSubgridFormatRowDialog}
         onClose={(event, reason) => {
            if (reason !== 'backdropClick') {
               setShowFormatRowDialog(false);
            }
         }}
      >
         <AppBar
            position="static"
            sx={{
               backgroundColor: brightBlueHeaderColor,
               color: theme.palette.text.primary, borderColor:
                  selectedAccentColor,
               borderWidth: 1
            }}>
            <Toolbar variant='dense'>
               <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Format Row
               </Typography>
            </Toolbar>
         </AppBar>
         <DialogContent
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               width: '100%',
               height: '600px'
            }}>
            <Box sx={{
               width: '100%',
               flexGrow: 1,
               color: theme.palette.text.primary,
               bgcolor: theme.palette.background.paper,
               display: 'flex'
            }}>
               <TabContext value={selectedTab}>
                  <TabList
                     orientation="vertical"
                     onChange={handleChange}
                     aria-label="Vertical tabs"
                     sx={{
                        borderRight: 1,
                        borderColor: 'silver',
                        '&.MuiTabs-vertical': { borderRightWidth: '2px', borderColor: 'silver', marginRight: '8px' },
                        alignItems: 'flex-start',
                        '& .MuiTab-root': { justifyContent: 'flex-start', textAlign: 'left' },
                        '& .MuiTabs-flexContainer': { alignItems: 'flex-start' },
                        '& .MuiTabs-indicator': { left: 0 }
                     }}
                  >
                     <Tab value={'0'} label="Name" sx={{ alignItems: 'flex-start', color: theme.palette.text.primary, '&.Mui-selected': { color: selectedAccentColor } }} {...a11yProps('0')} />
                     <Tab value={'1'} label="Condition" sx={{ alignItems: 'flex-start', color: theme.palette.text.primary, '&.Mui-selected': { color: selectedAccentColor } }} {...a11yProps('1')} />
                     <Tab value={'2'} label="Style" sx={{ alignItems: 'flex-start', color: theme.palette.text.primary, '&.Mui-selected': { color: selectedAccentColor } }} {...a11yProps('2')} />
                     <Tab value={'3'} label="Settings" sx={{ alignItems: 'flex-start', color: theme.palette.text.primary, '&.Mui-selected': { color: selectedAccentColor } }} {...a11yProps('3')} />
                  </TabList>

                  <TabPanel value={'0'} keepMounted sx={{ flexGrow: 1, p: 0 }}>
                     <RowStyleNameTab rowStyleCopy={rowStyleCopy} updateRowStyleProperty={updateRowStyleProperty} />
                  </TabPanel>

                  <TabPanel value={'1'} keepMounted sx={{ flex: 1, flexGrow: 1, minWidth: 0, p: 0 }}>
                     <ErrorBoundary>
                        {qbMounted && exprReady ? (
                           <QueryBuilderComponent
                              id="format-row-qb"
                              ref={qbRef}
                              columns={qbColumns as any}
                              displayMode="Horizontal"
                              enableNotCondition={true}
                              created={() => {
                                 setTimeout(() => {
                                    if (rowStyleCopy?.rule && qbRef.current?.setRules) {
                                       qbRef.current.setRules(rowStyleCopy.rule as any);
                                    }
                                    // Initialize validity from current QB rules
                                    if (qbRef.current?.getRules) {
                                       const initial = qbRef.current.getRules();
                                       const valid = validateRule(initial);
                                       setIsRuleValid(valid);
                                    }
                                 }, 50);
                                 setTimeout(() => { ignoreFirstChange.current = false; }, 100);
                              }}
                              change={() => {
                                 const rule = qbRef.current?.getRules?.();
                                 // Always validate current rule
                                 const valid = validateRule(rule);
                                 if (valid !== isRuleValid) {
                                    setIsRuleValid(valid);
                                 }
                                 const nextStr = JSON.stringify(rule ?? {});
                                 if (!ignoreFirstChange.current) {
                                    const prevStr = JSON.stringify(rowStyleCopy?.rule ?? {});
                                    if (prevStr !== nextStr) {
                                       setRowStyleCopy(prev => ({ ...prev, rule }));
                                    }
                                 }
                              }}
                              showButtons={{ ruleDelete: true, groupInsert: true, groupDelete: true } as any}
                              sortDirection="Ascending"
                              width="100%"
                           />
                        ) : (
                           <LoadingIndicator isLoading={true} />
                        )}
                     </ErrorBoundary>
                  </TabPanel>

                  <TabPanel value={'2'} keepMounted sx={{ flexGrow: 1, p: 0 }}>
                     <RowStyleTab rowStyleCopy={rowStyleCopy} updateRowStyleProperty={updateRowStyleProperty} />
                  </TabPanel>

                  <TabPanel value={'3'} keepMounted sx={{ flexGrow: 1, p: 0 }}>
                     <RowStyleSettings rowStyleCopy={rowStyleCopy} updateRowStyleProperty={updateRowStyleProperty} />
                  </TabPanel>
               </TabContext>
            </Box>
         </DialogContent>
         <DialogActions>
            {/* External Save Button */}
            <Button
               disabled={!isRuleValid}
               sx={{
                  color: selectedAccentColor,
                  '&:hover': {
                     color: selectedAccentColor, // Hover color when using a CSS variable
                  },
                  '&.Mui-disabled': {
                     color: 'gray', // Disabled color
                  },
               }}
               onClick={() => {
                  saveRowStyles()
               }}>
               Save
            </Button>

            <Button
               sx={{
                  color: theme.palette.text.primary,
               }}
               onClick={() => {
                  setShowFormatRowDialog(false);
               }}
            >
               Cancel
            </Button>
         </DialogActions>
      </Dialog>
   )
}

/*==========================================
** EXPORT
==========================================*/
export { FormatRowWizard };
