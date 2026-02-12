/*==========================================
** IMPORTS
==========================================*/
// React
import React, { useState, useEffect, useCallback, useRef } from 'react';

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow'

// Custom Hooks
import { useGridStyleState, type GridContext } from '../../hooks/selectors';
import { useThemeState } from '../../hooks/selectors/useUIState';
import useGridAssets from '../../hooks/grid/useGridAssets';

// Utilities
import { prettyPrint } from '../../utilities/prettyPrint';

// PubSubJS
import PubSub from 'pubsub-js';

// Components
import { ColumnStyleNameTab } from './columnStyleNameTab';
import { ColumnStyleSettings } from './columnStyleSettings'
import { ScopeTab } from './columnScopeTab'
import { ColumnStyleTab } from './columnStyleTab';
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
import { AgColumnStyle } from '../../appInterfaces/grid/gridInterfaces';

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

const defaultColumnStyle: AgColumnStyle = {
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
   targetColumns: [],
   targetDataType: 'STRING',
   active: false
};

/*==========================================
** COMPONENT
==========================================*/
const FormatColumnWizard = () => {
   /*
      this component has to work for the grid and subgrid, so we pass the various
      state into the component based on who is calling it
   */

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
      saveAgGridState,
      objMetadata,
   } = customStylePanelProps || {};

   // Convert isSubgrid to GridContext for unified hooks
   const context: GridContext = isSubgrid ? 'subgrid' : 'main';

   // Use unified context-based hooks
   const {
      columnStyles: objColumnStyles,
      selectedColumnStyle,
      setShowFormatColumnDialog,
      showFormatColumnDialog,
   } = useGridStyleState(context);

   // Also get subgrid visibility state for dialog open check
   const { showFormatColumnDialog: showSubgridFormatColumnDialog } = useGridStyleState('subgrid');

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
   const ignoreFirstChange = React.useRef(true);
   const qbRef = useRef<QueryBuilderComponent>(null);

   /*==========================================
   ** LOCAL STATE
   ==========================================*/
   const [columnStyleCopy, setColumnStyleCopy] = useState<AgColumnStyle>(selectedColumnStyle ?? defaultColumnStyle)
   const [exprReady, setExprReady] = React.useState(false);
   const [isRuleValid, setIsRuleValid] = useState(false);
   const [qbColumns, setQbColumns] = React.useState<any[]>([]);
   const [qbMounted, setQbMounted] = React.useState(false);
   const [selectedTab, setSelectedTab] = React.useState<string>('0');

   /*==========================================
   ** CALLBACKS
   ==========================================*/
   const updateColumnStyleProperty = <K extends keyof AgColumnStyle>(key: K, value: AgColumnStyle[K]) => {
      setColumnStyleCopy(prev => ({
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
      if (selectedColumnStyle) {
         setColumnStyleCopy(selectedColumnStyle);
      }
   }, [selectedColumnStyle]);

   // Global error tap to see if opening the dialog triggers runtime errors
   useEffect(() => {
      const onError = (e: any) => {
         console.warn('[FormatColumnWizard] window.onerror', e?.message, e?.error);
      };
      window.addEventListener('error', onError);
      return () => window.removeEventListener('error', onError);
   }, []);

   // Handle qbMounted state
   useEffect(() => {
      if (selectedTab === '2' && exprReady && !qbMounted) {
         setQbMounted(true);
      }
   }, [selectedTab, exprReady, qbMounted]);

   // Defer mounting of ExpressionBuilder after tab selected to avoid Aura timing issues
   useEffect(() => {
      if (selectedTab === '2' && !exprReady) {
         setExprReady(false);
         const id = setTimeout(() => setExprReady(true), 0);
         return () => clearTimeout(id);
      }
      // Do not reset exprReady when leaving tab 2 to keep mounted
   }, [selectedTab, exprReady]);

   // Validate rule whenever it changes (always call QueryBuilder.getRules())
   useEffect(() => {
      if (!qbRef.current || !columnStyleCopy) {
         return;
      }

      const currentRule = qbRef.current.getRules();
      prettyPrint('currentRule is', currentRule, 'blue')

      const valid = validateRule(currentRule);
      console.log(`is current rule valid: ${valid}`)
      setIsRuleValid(valid);
      // setIsRuleValid(prev => (prev !== valid ? valid : prev));
   }, [columnStyleCopy, validateRule]);

   // Listen for picklist template broadcasts to sync rule and set save-enabled state
   useEffect(() => {
      const token = PubSub.subscribe('QB_RULE_CHANGED', () => {
         const qb = qbRef.current;
         if (!qb || typeof qb.getRules !== 'function') return;
         const currentRule = qb.getRules();
         setColumnStyleCopy(prev => ({ ...prev, rule: currentRule }));
         const valid = validateRule(currentRule);
         setIsRuleValid(valid);
      });
      return () => {
         PubSub.unsubscribe(token);
      }
   }, [validateRule]);

   // Build QB columns from metadata (allow picklist template, sanitize others)
   useEffect(() => {
      try {
         if (!objMetadata || !apiClient) {
            setQbColumns([]);
            return;
         }

         const cols = createQueryBuilderColumns(objMetadata, qbRef, apiClient);
         prettyPrint('queryBuilderCols are', cols, 'blue')

         setQbColumns(cols);
      } catch (e) {
         console.warn('[FormatColumnWizard] createQueryBuilderColumns threw; using fallback', e);
         setQbColumns([]);
      }
   }, [apiClient, objMetadata]);

   const saveColumnStyles = () => {
      const saveStyles = async () => {
         // create a conditional styles object
         const styleToSave: AgColumnStyle = {
            name: columnStyleCopy.name,
            rule: columnStyleCopy.rule
         }

         if (columnStyleCopy.backgroundColorChecked) {
            styleToSave['backgroundColorChecked'] = columnStyleCopy.backgroundColorChecked;
            styleToSave['backgroundColor'] = columnStyleCopy.backgroundColor;
            styleToSave['backgroundColorOpacity'] = columnStyleCopy.backgroundColorOpacity
         }

         if (columnStyleCopy.borderColorChecked) {
            styleToSave['borderColorChecked'] = columnStyleCopy.borderColorChecked;
            styleToSave['borderColor'] = columnStyleCopy.borderColor;
            styleToSave['borderColorOpacity'] = columnStyleCopy.borderColorOpacity
         }

         if (columnStyleCopy.colorChecked) {
            styleToSave['colorChecked'] = columnStyleCopy.colorChecked;
            styleToSave['color'] = columnStyleCopy.color;
            styleToSave['colorOpacity'] = columnStyleCopy.colorOpacity
         }

         if (columnStyleCopy.fontSizeChecked) {
            styleToSave['fontSizeChecked'] = columnStyleCopy.fontSizeChecked;
            styleToSave['fontSize'] = columnStyleCopy.fontSize;
         }

         if (columnStyleCopy.fontStyleChecked) {
            styleToSave['fontStyleChecked'] = columnStyleCopy.fontStyleChecked;
            styleToSave['fontStyle'] = columnStyleCopy.fontStyle;
         }

         if (columnStyleCopy.cellAlignmentChecked) {
            styleToSave['cellAlignmentChecked'] = columnStyleCopy.cellAlignmentChecked;
            styleToSave['cellAlignment'] = columnStyleCopy.cellAlignment;
         }

         if (columnStyleCopy.targetColumns && columnStyleCopy.targetColumns.length > 0) {
            styleToSave['targetColumns'] = columnStyleCopy.targetColumns
         }

         if (columnStyleCopy.targetDataType) {
            styleToSave['targetDataType'] = columnStyleCopy.targetDataType
         }

         styleToSave['excludeGroupRows'] = columnStyleCopy.excludeGroupRows;
         styleToSave['excludeRowSummaries'] = columnStyleCopy.excludeRowSummaries
         styleToSave['description'] = columnStyleCopy.description;
         styleToSave['active'] = columnStyleCopy.active

         const currentStyles = [...(objColumnStyles || [])]; // Assuming objColumnStyles is the current Zustand state

         // Find existing style by name only (names should be unique)
         const existingIndex = currentStyles.findIndex(
            (style) => style.name === styleToSave.name
         );

         let updatedStyles;
         if (existingIndex !== -1) {
            // Update existing style
            updatedStyles = currentStyles.map((style, index) =>
               index === existingIndex ? styleToSave : style
            );
            console.log('[saveColumnStyles] Updating existing style:', styleToSave.name);
         } else {
            // Add new style
            updatedStyles = [...currentStyles, styleToSave];
            console.log('[saveColumnStyles] Adding new style:', styleToSave.name);
         }

         // Centralized setter for styles pipeline (bound)
         setStyles({ columns: updatedStyles });
         saveAgGridState?.()

         setShowFormatColumnDialog(false);
      }
      saveStyles();
   }

   /*==========================================
   ** RENDER
   ==========================================*/
   return (
      <Dialog
         fullWidth
         maxWidth={false}
         slotProps={{
            paper: {
               sx: {
                  width: '70vw',
                  maxWidth: '70vw',
                  height: '60vh'
               }
            }
         }}
         sx={{
            alignItems: 'center',
            color: theme.palette.text.primary,
            display: 'flex',
            justifyContent: 'center',
            margin: 0,
            overflow: 'auto',
            zIndex: 1300,
            '& .MuiDialog-paper': {
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            },
            '& .MuiBackdrop-root': {
               backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
         }}
         open={showFormatColumnDialog || showSubgridFormatColumnDialog}
         onClose={(event, reason) => {
            if (reason !== 'backdropClick') {
               setShowFormatColumnDialog(false);
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
                  Format Column
               </Typography>
            </Toolbar>
         </AppBar>
         <DialogContent
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               width: '100%',
               height: '100%'
            }}>
            {!customStylePanelProps ? (
               <LoadingIndicator isLoading={true} />
            ) : (
               <Box
                  sx={{
                     width: '100%',
                     flexGrow: 1,
                     color: theme.palette.text.primary,
                     bgcolor: theme.palette.background.paper,
                     display: 'flex'
                  }}
               >
                  <TabContext value={selectedTab}>
                     <TabList
                        orientation="vertical"
                        onChange={handleChange}
                        aria-label="Vertical tabs example"
                        sx={{
                           borderRight: 1,
                           borderColor: 'silver',
                           '&.MuiTabs-vertical': {
                              borderRightWidth: '2px',
                              borderColor: 'silver',
                              marginRight: '8px',
                           },
                           alignItems: 'flex-start',
                           '& .MuiTab-root': {
                              justifyContent: 'flex-start',
                              textAlign: 'left',
                           },
                           '& .MuiTabs-flexContainer': {
                              alignItems: 'flex-start',
                           },
                           '& .MuiTabs-indicator': {
                              left: 0,
                           }
                        }}
                     >
                        <Tab value={'0'} label="Name"
                           sx={{
                              alignItems: 'flex-start', color: theme.palette.text.primary, '&.Mui-selected': {
                                 color: selectedAccentColor
                              }
                           }}
                           {...a11yProps('0')} />
                        <Tab value={'1'} label="Scope"
                           sx={{
                              alignItems: 'flex-start', color: theme.palette.text.primary,
                              '&.Mui-selected': {
                                 color: selectedAccentColor
                              }
                           }}
                           {...a11yProps('1')} />
                        <Tab value={'2'} label="Condition"
                           sx={{ alignItems: 'flex-start', color: theme.palette.text.primary, '&.Mui-selected': { color: selectedAccentColor } }}
                           {...a11yProps('2')} />
                        <Tab value={'3'} label="Style"
                           sx={{ alignItems: 'flex-start', color: theme.palette.text.primary, '&.Mui-selected': { color: selectedAccentColor } }}
                           {...a11yProps('3')} />
                        <Tab value={'4'} label="Settings"
                           sx={{ alignItems: 'flex-start', color: theme.palette.text.primary, '&.Mui-selected': { color: selectedAccentColor } }}
                           {...a11yProps('4')} />
                     </TabList>

                     <TabPanel value={'0'} keepMounted sx={{ flexGrow: 1, p: 0 }}>
                        <ColumnStyleNameTab columnStyleCopy={columnStyleCopy} updateColumnStyleProperty={updateColumnStyleProperty} />
                     </TabPanel>

                     <TabPanel value={'1'} keepMounted sx={{ flexGrow: 1, p: 0 }}>
                        <ScopeTab
                           apiClient={apiClient as any}
                           columnStyleCopy={columnStyleCopy}
                           selectedColumnStyle={selectedColumnStyle!}
                           selectedObjMetadata={objMetadata!}
                           sObjectApiName={sObjectApiName || ''}
                           updateColumnStyleProperty={updateColumnStyleProperty}
                        />
                     </TabPanel>

                     <TabPanel value={'2'} keepMounted sx={{ flex: 1, flexGrow: 1, minWidth: 0, p: 0 }}>
                        <ErrorBoundary>
                           {qbMounted && exprReady ? (
                              <QueryBuilderComponent
                                 id="format-qb"
                                 ref={qbRef}
                                 columns={qbColumns as any}
                                 displayMode="Horizontal"
                                 enableNotCondition={true}
                                 created={() => {
                                    setTimeout(() => {
                                       if (columnStyleCopy?.rule && qbRef.current?.setRules) {
                                          qbRef.current.setRules(columnStyleCopy.rule);
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
                                    const nextStr = JSON.stringify(rule ?? {});
                                    // Only update stored rule after initial setup, and only if changed
                                    if (!ignoreFirstChange.current) {
                                       const prevStr = JSON.stringify(columnStyleCopy?.rule ?? {});
                                       if (prevStr !== nextStr) {
                                          setColumnStyleCopy(prev => ({ ...prev, rule }));
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

                     <TabPanel value={'3'} keepMounted sx={{ flexGrow: 1, p: 0 }}>
                        <ColumnStyleTab columnStyleCopy={columnStyleCopy} updateColumnStyleProperty={updateColumnStyleProperty} />
                     </TabPanel>

                     <TabPanel value={'4'} keepMounted sx={{ flexGrow: 1, p: 0 }}>
                        <ColumnStyleSettings columnStyleCopy={columnStyleCopy} updateColumnStyleProperty={updateColumnStyleProperty} />
                     </TabPanel>
                  </TabContext>

               </Box>
            )}
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
                  saveColumnStyles()
               }}>
               Save
            </Button>
            {/* cancel button */}
            <Button
               sx={{
                  color: theme.palette.text.primary,
               }}
               onClick={() => {
                  setShowFormatColumnDialog(false);
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
export { FormatColumnWizard };
