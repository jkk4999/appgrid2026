/*==========================================
** IMPORTS
==========================================*/

import React, { useEffect } from 'react';

// Zustand
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore'

// Domain-specific selector hooks
import { useThemeState } from '../../hooks/selectors/useUIState';

// components
import { CalculatedColumnNameTab } from './calculatedColumnNameTab';
import { CalculatedColumnSettings } from './calculatedColumnSettings'
import { ExpressionBuilderGroc } from './expressionBuilderGroc';

// MUI
import { AppBar, Box, Button, Dialog, DialogActions, DialogContent, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Types
import { SObject, SObjectMetadata } from '../../sObjectMetadataTypes';
import { AgCalculatedColumn } from '../../appInterfaces/grid/gridInterfaces';
import { APIClient } from '../../brideDesignPattern/apiInterface';
import { GridApi } from 'ag-grid-community';

// Hooks
import useGridAssets from '../../hooks/grid/useGridAssets';

// Utilities
import { prettyPrint } from '../../utilities/prettyPrint';

/*==========================================
** TYPES & INTERFACES
==========================================*/

interface CalculatedColumnWizardProps {
   apiClient: APIClient;
   gridApi: GridApi,
   rowData: SObject[],
   saveAgGridState: () => Promise<string | void>;
   selectedCalculatedColumn: AgCalculatedColumn,
   selectedObjMetadata: SObjectMetadata,
   setShowCalculatedColumnDialog: (val: boolean) => void;
}

/*==========================================
** HELPER FUNCTIONS
==========================================*/

function a11yProps(index: number) {
   return {
      id: `vertical-tab-${index}`,
      'aria-controls': `vertical-tabpanel-${index}`,
   };
}

/*==========================================
** CONSTANTS
==========================================*/

const defaultCalculatedColumn: AgCalculatedColumn = {
   active: false,
   aggregatable: false,
   filterable: true,
   groupable: true,
   description: '',
   name: '',
   pivotable: false,
   resizable: true,
   rule: '',
   sortable: true,
   suppressHeaderMenuButton: true
};

/*==========================================
** COMPONENT
==========================================*/

const CalculatedColumnWizard = (
   {
      apiClient,
      rowData,
      selectedCalculatedColumn,
      selectedObjMetadata,
      setShowCalculatedColumnDialog
   }: CalculatedColumnWizardProps) => {

   /*==========================================
   ** CONTEXT
   ==========================================*/
   const theme = useTheme();

   /*==========================================
   ** CUSTOM HOOKS
   ==========================================*/
   const { selectedAccentColor } = useThemeState();

   /*==========================================
   ** GLOBAL STATE (Zustand)
   ==========================================*/
   const { showCalculatedColumnDialog } = useStore(useShallow((state) => ({
      showCalculatedColumnDialog: state.showCalculatedColumnDialog
   })));

   // Wizard saves to main grid (not subgrid)
   const { getCalculatedColumns, setCalculatedColumns } = useGridAssets({ isSubgrid: false });

   /*==========================================
   ** LOCAL STATE
   ==========================================*/
   const [selectedTab, setSelectedTab] = React.useState(0);

   const [calculatedColumnCopy, setCalculatedColumnCopy] = React.useState<AgCalculatedColumn>(selectedCalculatedColumn ?? defaultCalculatedColumn)

   /*==========================================
   ** CALLBACKS
   ==========================================*/
   const updateCalculatedColumnProperty = <K extends keyof AgCalculatedColumn>(key: K, value: AgCalculatedColumn[K]) => {
      setCalculatedColumnCopy(prev => ({
         ...prev,
         [key]: value
      }));
   };

   // set tab
   const handleChange = (event: React.SyntheticEvent, newValue: number) => {
      setSelectedTab(newValue);
   };

   const saveCalculatedColumns = () => {
      const saveStyles = async () => {
         prettyPrint('[CalculatedColumnWizard] calculatedColumnCopy', calculatedColumnCopy, 'blue');

         // create a conditional styles object
         const colToSave: AgCalculatedColumn = {
            active: calculatedColumnCopy.active,
            aggregatable: calculatedColumnCopy.aggregatable,
            description: calculatedColumnCopy.description,
            filterable: calculatedColumnCopy.filterable,
            groupable: calculatedColumnCopy.groupable,
            name: calculatedColumnCopy.name,
            pivotable: calculatedColumnCopy.pivotable,
            resizable: calculatedColumnCopy.resizable,
            rule: calculatedColumnCopy.rule,
            sortable: calculatedColumnCopy.sortable,
            suppressHeaderMenuButton: calculatedColumnCopy.suppressHeaderMenuButton
         }

         prettyPrint('[CalculatedColumnWizard] column to save', colToSave, 'blue');

         // Get latest calculated columns from store (not stale prop)
         const currentCalculatedColumns = getCalculatedColumns();

         const existingIndex = currentCalculatedColumns.findIndex(
            (col: AgCalculatedColumn) => col.name === colToSave.name
         );

         let updatedColumns;
         if (existingIndex !== -1) {
            // Update existing column
            updatedColumns = currentCalculatedColumns.map((col: AgCalculatedColumn, index: number) =>
               index === existingIndex ? colToSave : col
            );
         } else {
            // Add new column
            updatedColumns = [...currentCalculatedColumns, colToSave];
         }

         prettyPrint('[CalculatedColumnWizard] setting objCalculatedColumns to', updatedColumns, 'green');

         // Centralized setter (bound to main grid)
         setCalculatedColumns(updatedColumns);

         setShowCalculatedColumnDialog(false);
      }

      saveStyles();
   }

   /*==========================================
   ** EFFECTS
   ==========================================*/
   // Sync local copy when the selected column arrives later
   useEffect(() => {
      if (selectedCalculatedColumn) {
         setCalculatedColumnCopy(selectedCalculatedColumn);
      }
   }, [selectedCalculatedColumn]);

   /*==========================================
   ** RENDER
   ==========================================*/
   return (
      <Dialog
         // fullWidth
         // maxWidth="md"
         open={showCalculatedColumnDialog}
         onClose={(event, reason) => {
            if (reason !== 'backdropClick') {
               setShowCalculatedColumnDialog(false);
            }
         }}
         sx={{
            borderColor: 'silver',
            borderWidth: 2,
            // Let MUI center the dialog (no transforms) and size the paper
            '& .MuiDialog-paper': {
               backgroundColor: theme.palette.background.paper,
               borderColor: 'silver',
               borderWidth: 1,
               color: theme.palette.text.primary,
               height: '70vh',
               minWidth: '40vw',
               maxWidth: '90vw',
               // width: '85vw',
            },
            '& .MuiBackdrop-root': {
               backgroundColor: 'transparent',
            },
         }}
      >
         <AppBar
            position="static"
            sx={{
               backgroundColor: selectedAccentColor,
               color: theme.palette.text.primary,
               borderWidth: 1
            }}>
            <Toolbar variant='dense'>
               <Typography variant="h6"
                  sx={{
                     flexGrow: 1
                  }}>
                  Calculated Column Wizard
               </Typography>
            </Toolbar>
         </AppBar>
         <DialogContent sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            flexGrow: 1,
            overflow: 'auto',
         }}>
            <Box
               sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  display: 'flex',
                  flexGrow: 1,
               }}
            >
               <Tabs
                  orientation="vertical"
                  variant="scrollable"
                  value={selectedTab}
                  onChange={handleChange}
                  aria-label="Vertical tabs example"
                  sx={{
                     width: '130px', // Fixed width for tabs
                     minWidth: '130px', // Prevent shrinking
                     maxWidth: '130px', // Prevent growing
                     borderRight: 1,
                     borderColor: 'silver',
                     '&.MuiTabs-vertical': {
                        borderRightWidth: '2px', // Adjusts the thickness of the line
                        borderColor: 'silver', // Custom color (lighter gray)
                        marginRight: '8px', // Optional: Adds space between the line and tab content
                     },
                     alignItems: 'flex-start', // Ensures tabs are aligned to the left
                     '& .MuiTab-root': {
                        justifyContent: 'flex-start', // Aligns text to the left within each tab
                        textAlign: 'left',
                     },
                     '& .MuiTabs-flexContainer': {
                        alignItems: 'flex-start', // Aligns the whole container to the left
                     },
                     '& .MuiTabs-indicator': {
                        left: 0, // Moves the indicator to the left
                     }
                  }}
               >
                  <Tab
                     label="Name"
                     sx={{
                        alignItems: 'flex-start',
                        color: theme.palette.text.primary,
                        flexGrow: 1,
                        '&.Mui-selected': {
                           color: selectedAccentColor, // Color for the selected tab
                        }
                     }}
                     {...a11yProps(0)}
                  />
                  <Tab
                     label="Condition"
                     sx={{
                        alignItems: 'flex-start',
                        color: theme.palette.text.primary,
                        flexGrow: 1,
                        '&.Mui-selected': {
                           color: selectedAccentColor, // Color for the selected tab
                        }
                     }}
                     {...a11yProps(1)} />
                  <Tab
                     label="Settings"
                     sx={{
                        alignItems: 'flex-start',
                        color: theme.palette.text.primary,
                        flexGrow: 1,
                        '&.Mui-selected': {
                           color: selectedAccentColor,
                        }
                     }}
                     {...a11yProps(2)} />

               </Tabs>
               {/* name, description and active */}
               <Box display={selectedTab === 0 ? 'block' : 'none'}
                  sx={{
                     flexGrow: 1
                  }}>
                  <CalculatedColumnNameTab calculatedColumnCopy={calculatedColumnCopy} updateCalculatedColumnProperty={updateCalculatedColumnProperty} />
               </Box>
               {/* rule */}
               <Box
                  display={selectedTab === 1 ? 'block' : 'none'}
                  sx={{
                     flexGrow: 1
                  }}>
                  <ExpressionBuilderGroc
                     apiClient={apiClient}
                     calculatedColumnCopy={calculatedColumnCopy} rowData={rowData}
                     selectedCalculatedColumn={selectedCalculatedColumn} selectedObjMetadata={selectedObjMetadata} updateCalculatedColumnProperty={updateCalculatedColumnProperty} />
               </Box>
               {/* settings tab */}
               <Box
                  display={selectedTab === 2 ? 'block' : 'none'}
                  sx={{
                     flexGrow: 1
                  }}>
                  <CalculatedColumnSettings calculatedColumnCopy={calculatedColumnCopy} updateCalculatedColumnProperty={updateCalculatedColumnProperty} />
               </Box>

            </Box>
         </DialogContent>
         <DialogActions>
            {/* External Save Button */}
            <Button
               onClick={() => {
                  prettyPrint('[CalculatedColumnWizard] Save clicked, current column', calculatedColumnCopy, 'blue');
                  saveCalculatedColumns()
               }}>
               Save
            </Button>

            <Button
               onClick={() => {
                  setShowCalculatedColumnDialog(false);
               }}
            >
               Cancel
            </Button>
         </DialogActions>
      </Dialog>
   )
}

export { CalculatedColumnWizard };
