import React, { useState, useEffect } from 'react';

// Zustand - only for customStylePanelProps (shared config)
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// Unified context-based hooks
import { useGridStyleState, type GridContext } from '../../hooks/selectors';
import { useThemeState } from '../../hooks/selectors/useUIState';
import useGridAssets from '../../hooks/grid/useGridAssets';
import { prettyPrint } from '../../utilities/prettyPrint';

// notifications

// MUI
import { AppBar, Box, Button, Checkbox, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, Tab, Toolbar, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';

// MUI icons
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

// styles
const listStyle = {
   margin: 0, // Remove margin
   padding: 0 // remove padding
};

import { AgColumnStyle, AgRowStyle } from '../../appInterfaces/grid/gridInterfaces';

const ColumnStylePanel = () => {
   const theme = useTheme();

   const [selectedTab, setSelectedTab] = useState('1');

   console.log('Column style panel loading');

   // notifications


   // Get isSubgrid from custom props (shared config passed from parent)
   const { customStylePanelProps } = useStore(
      useShallow((state) => ({ customStylePanelProps: state.customStylePanelProps }))
   );

   // Extract isSubgrid and saveAgGridState from custom props
   const { isSubgrid, saveAgGridState } = customStylePanelProps || { isSubgrid: false, saveAgGridState: async () => { } };

   // Convert isSubgrid to GridContext for unified hooks
   const context: GridContext = isSubgrid ? 'subgrid' : 'main';

   // Use unified context-based hooks
   const {
      columnStyles: objColumnStyles,
      rowStyles: objRowStyles,
      setSelectedColumnStyle,
      setSelectedRowStyle,
      setShowColumnStylePanel,
      setShowFormatColumnDialog,
      setShowFormatRowDialog,
   } = useGridStyleState(context);

   // Get accent color from theme state
   const { selectedAccentColor } = useThemeState();

   // Bind assets to current grid context (pre-bound setters)
   const { setStyles } = useGridAssets({ isSubgrid });

   // local state
   const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
      setSelectedTab(newValue);
   };

   const handleColumnStyleSelectAll = () => {
      const updatePref = async () => {
         const currentPreferences = [...(objColumnStyles || [])];
         const updatedPreferences = currentPreferences.map(obj => ({
            ...obj,
            active: true, // Set active to true for all
            checked: true, // Also ensure it's checked
         }));

         setStyles({ columns: updatedPreferences });
      }

      updatePref();
   }

   const handleRowStyleSelectAll = () => {
      const updatePref = async () => {
         const currentPreferences = [...(objRowStyles || [])]

         const updatedPreferences = currentPreferences.map(obj => ({
            ...obj,
            active: true, // Set active to true for all
            checked: true, // Also ensure it's checked
         }));

         setStyles({ rows: updatedPreferences });
      }
      updatePref();
   }

   const handleColumnStyleClearAll = () => {
      const updatePref = async () => {
         const currentPreferences = [...(objColumnStyles || [])];
         // Ensure all styles are not active
         const updatedPreferences = currentPreferences.map(obj => ({
            ...obj,
            active: false,
            checked: false,
         }));

         setStyles({ columns: updatedPreferences });
      }
      updatePref();
   }

   const handleRowStyleClearAll = () => {
      const updatePref = async () => {
         const currentPreferences = [...(objRowStyles || [])]

         const updatedPreferences = currentPreferences.map(obj => ({
            ...obj,
            active: false,
            checked: false,
         }));

         setStyles({ rows: updatedPreferences });
      }
      updatePref();
   }

   const handleAddColumnStyle = () => {
      setShowFormatColumnDialog(true)
   }

   const handleAddRowStyle = () => {
      setShowFormatRowDialog(true)
   }

   // update column style preference
   const updatePreference = (pref: AgColumnStyle) => {
      const updatePref = async () => {
         // Assuming objColumnStyles is an array and not undefined here based on your use of '!'
         // If objColumnStyles can also be undefined, you need to guard it too.
         const currentPreferences = [...(objColumnStyles || [])]; // Safer: handle if objColumnStyles is null/undefined

         const updatedPreferences = currentPreferences.map(obj =>
            obj.name === pref.name
               ? { ...obj, active: !obj.active }
               : obj
         );

         console.log('setting columnStyles to');
         console.dir(updatedPreferences);

         setStyles({ columns: updatedPreferences || [] });
      };

      updatePref();
   };

   // update row style preference
   const updateRowPreference = (pref: AgRowStyle) => {
      const updatePref = async () => {
         const currentPreferences = [...(objRowStyles || [])]

         console.log('pref:', pref);
         console.log('currentPreferences before:', currentPreferences);

         const updatedPreferences = currentPreferences.map(obj => {
            if (obj.name === pref.name) {
               const newPref = { ...obj, active: !obj.active };
               console.log('Updating preference to:');
               console.dir(newPref)
               return newPref
            }
            return obj;
         });

         setStyles({ rows: [...(updatedPreferences || [])] });
      }

      updatePref();
   };

   const onStyleDelete = (item: AgColumnStyle) => {
      const deleteStyle = async (item: AgColumnStyle) => {
         prettyPrint('[onStyleDelete] Starting delete for:', item.name, 'cyan');
         prettyPrint('[onStyleDelete] Item to delete:', item, 'cyan');

         const currentPreferences = [...(objColumnStyles || [])];
         prettyPrint('[onStyleDelete] Current preferences before delete:', {
            count: currentPreferences.length,
            names: currentPreferences.map(p => p.name)
         }, 'cyan');

         // Filter out the item to delete from the array based on name
         const updatedPreferences = currentPreferences.filter(obj => obj.name !== item.name);

         prettyPrint('[onStyleDelete] Updated preferences after delete:', {
            count: updatedPreferences.length,
            names: updatedPreferences.map(p => p.name)
         }, 'green');

         prettyPrint('[onStyleDelete] Calling setStyles with updatedPreferences', '', 'cyan');

         setStyles({ columns: updatedPreferences || [] });

         prettyPrint('[onStyleDelete] setStyles completed, calling saveAgGridState', '', 'cyan');

         // Save the grid state after deleting the style
         saveAgGridState();

         prettyPrint('[onStyleDelete] Delete operation completed', '', 'green');
      }

      deleteStyle(item);
   }

   const onRowStyleDelete = (item: AgRowStyle) => {
      const deleteStyle = async (item: AgRowStyle) => {

         const currentPreferences = [...(objRowStyles || [])]; // Assuming this is a getter function for the 

         // Filter out the item to delete from the array based on name
         const updatedPreferences = currentPreferences.filter(obj => obj.name !== item.name);

         setStyles({ rows: updatedPreferences });
      }
      deleteStyle(item);
   }

   useEffect(() => {
      console.log('objRowStyles updated:', objRowStyles);
   }, [objRowStyles]);

   return (
      <Box
         sx={{
            typography: 'body1',
            border: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
         }}>
         <AppBar
            position='sticky'
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}>
            <Toolbar variant="dense">
               <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  sx={{ ml: -1 }}
                  onClick={() => setShowColumnStylePanel(false)}
               >
                  <ChevronLeftIcon />
               </IconButton>
               <Typography variant="button" color="inherit" component="div">
                  Column & Row Styles
               </Typography>
            </Toolbar>
         </AppBar>

         <TabContext value={selectedTab}>
            {/* tabs */}
            <Box
               sx={{
                  borderBottom: 1,
                  borderColor: 'divider'
               }}>
               <TabList
                  onChange={handleTabChange}
                  sx={{
                     '& .MuiTabs-indicator': {
                        backgroundColor: theme.palette.text.primary, // Sets the indicator color
                     },
                     '& .MuiTab-root': {
                        color: theme.palette.text.primary, // Default text color
                     },
                     '& .Mui-selected': {
                        color: selectedAccentColor, // Selected tab text color
                     },
                  }}>
                  <Tab label="Column Styles" value="1" />
                  <Tab label="Row Styles" value="2" />
               </TabList>
            </Box>
            {/* column styles tab */}
            <TabPanel value="1">
               <Stack
                  direction='row'
                  spacing={2}
                  sx={{ mx: 2 }}>
                  {/* add column style */}
                  <Button
                     variant="contained"
                     size='small'
                     onClick={handleAddColumnStyle}
                  >Add
                  </Button>
                  {/* select all column styles */}
                  <Button
                     variant="contained"
                     size='small'
                     onClick={handleColumnStyleSelectAll}
                  >Select All
                  </Button>
                  {/* un-select all column styles */}
                  <Button
                     variant="contained"
                     size='small'
                     onClick={handleColumnStyleClearAll}>
                     Clear All
                  </Button>
               </Stack>
               {/* column styles list */}
               <Box sx={{
                  marginTop: 2,
                  flexGrow: 1, // This makes the List expand to take up available space
                  overflow: 'auto', // Adds scrollbars when content overflows
               }}>
                  <List
                     style={listStyle}
                     sx={{
                        width: '100%',
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary
                     }}>
                     {objColumnStyles!.map((item: AgColumnStyle) => (
                        <ListItem
                           key={item.name}
                           disablePadding
                           sx={{
                              borderBottom: 'none'
                           }}>
                           <ListItemButton
                              role={undefined}
                              onClick={() => updatePreference(item)}
                              dense
                              sx={{
                                 borderBottom: 'none'
                              }}>
                              <ListItemIcon>
                                 <Checkbox
                                    edge="start"
                                    checked={item.active}
                                    tabIndex={-1}
                                    disableRipple
                                    sx={{
                                       color: theme.palette.text.primary,
                                       '&.Mui-checked': {
                                          color: selectedAccentColor,
                                       },
                                    }}
                                 />
                              </ListItemIcon>
                              <ListItemText primary={item.name} />
                           </ListItemButton>
                           {/* edit button */}
                           <IconButton
                              edge="end"
                              onClick={() => {
                                 console.log('setting selectedColumnStyle to');
                                 console.dir(item)
                                 if (setSelectedColumnStyle) {
                                    setSelectedColumnStyle(item)
                                 }

                                 // open the style wizard
                                 setShowFormatColumnDialog(true)
                              }}
                              sx={{
                                 color: theme.palette.text.primary,
                              }}
                           >
                              <EditOutlinedIcon />
                           </IconButton>
                           {/* delete button */}
                           <IconButton
                              edge="end"
                              onClick={() => {
                                 console.log('Item to delete is')
                                 console.dir(item)
                                 onStyleDelete(item);
                              }
                              }
                              sx={{
                                 color: theme.palette.text.primary,
                                 mr: 2
                              }}
                           >
                              <DeleteForeverOutlinedIcon />
                           </IconButton>
                        </ListItem>
                     ))}
                  </List>
               </Box>
            </TabPanel>
            {/* row styles tab */}
            <TabPanel value="2">
               <Stack
                  direction='row'
                  spacing={2}
                  sx={{
                     mx: 2
                  }}>
                  {/* add row style */}
                  <Button
                     variant="contained"
                     size='small'
                     onClick={handleAddRowStyle}
                  >Add
                  </Button>
                  {/* select all row styles */}
                  <Button
                     variant="contained"
                     size='small'
                     onClick={handleRowStyleSelectAll}
                  >Select All
                  </Button>
                  {/* un-select all row styles */}
                  <Button
                     variant="contained"
                     size='small'
                     onClick={handleRowStyleClearAll}>
                     Clear All
                  </Button>
               </Stack>
               {/* row styles list */}
               <Box sx={{
                  marginTop: 2,
                  flexGrow: 1, // This makes the List expand to take up available space
                  overflow: 'auto', // Adds scrollbars when content overflows
               }}>
                  <List
                     style={listStyle}
                     sx={{
                        width: '100%',
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary
                     }}>
                     {objRowStyles!.map((item: AgRowStyle) => (
                        <ListItem key={item.name} disablePadding sx={{ borderBottom: 'none' }}>
                           <ListItemButton
                              role={undefined}
                              onClick={() => updateRowPreference(item)}
                              dense
                              sx={{
                                 borderBottom: 'none'
                              }}>
                              <ListItemIcon>
                                 <Checkbox
                                    edge="start"
                                    checked={item.active}
                                    tabIndex={-1}
                                    disableRipple
                                    sx={{
                                       color: theme.palette.text.primary,
                                       '&.Mui-checked': {
                                          color: selectedAccentColor,
                                       },
                                    }}
                                 />
                              </ListItemIcon>
                              <ListItemText primary={item.name} />
                           </ListItemButton>
                           {/* edit button */}
                           <IconButton
                              edge="end"
                              onClick={() => {
                                 console.log(`Clicked icon for ${item.name}`)
                                 if (setSelectedRowStyle) {
                                    setSelectedRowStyle(item)
                                 }

                                 // open the style wizard
                                 setShowFormatRowDialog(true)
                              }
                              }
                              sx={{
                                 color: theme.palette.text.primary,
                              }}
                           >
                              <EditOutlinedIcon />
                           </IconButton>
                           {/* delete button */}
                           <IconButton
                              edge="end"
                              onClick={() => {
                                 console.log(`Clicked icon for ${item.name}`)
                                 onRowStyleDelete(item);
                              }
                              }
                              sx={{
                                 color: theme.palette.text.primary,
                                 mr: 2
                              }}
                           >
                              <DeleteForeverOutlinedIcon />
                           </IconButton>
                        </ListItem>
                     ))}
                  </List>
               </Box>
            </TabPanel>
         </TabContext>
      </Box>
   )
}

export { ColumnStylePanel }
