// react
import React, { useState } from 'react';

// Zustand
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore';

// NEW: Domain-specific selector hooks
import { useThemeState } from '../../hooks/selectors/useUIState';

// PubSubJS
import PubSub from "pubsub-js";
import { emitDeleteRecords, emitSaveRecords, emitOpenColumnPanel } from '../../events/topics';

// components
import FilterSelector from './FilterSelector';

// MUI
import { Box, IconButton, Tooltip, Stack, Typography, Menu, MenuItem, ListItemIcon, ListItemText, useTheme } from '@mui/material';

// MUI icons
import AddOutlinedIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined'
import FunctionsOutlinedIcon from '@mui/icons-material/FunctionsOutlined';
import FormatColorFillOutlinedIcon from '@mui/icons-material/FormatColorFillOutlined';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import SaveIcon from '@mui/icons-material/CheckOutlined'
import AirOutlinedIcon from '@mui/icons-material/AirOutlined';
import { SubgridGridTypeSelector } from './subgridGridTypeSelector';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';
import ChatIcon from '@mui/icons-material/Chat';
import SlackIconComponent from './SlackIconComponent';

// hide/show menu icons based on permissions
const SubgridMenu = (props: any) => {
   const theme = useTheme();
   const apiClient = props.apiClient;
   const gridId = props.gridId;
   const moveFilters: boolean = !!props.moveFilters;
   const relationName = props.relationName;

   // Theme state from domain hook
   const { selectedAccentColor } = useThemeState();

   // Remaining global state
   const {
      isPivotMode,
      gridPermissions,
      selectedSubgridType,
      showSubgridAdvancedFilter,
      showSlackPanel,
      setShowSubgridAdvancedFilter,
      setExclusivePanel,
      setShowSlackPanel,
      setSlackPanelRecord,
      selectedSlackRow,
      selectedObject,
      setFlowEventSource,
      setActiveRelationName,
   } = useStore(useShallow((state) => ({
      isPivotMode: state.pivotMode,
      gridPermissions: state.gridPermissions,
      selectedSubgridType: state.selectedSubgridType,
      showSubgridAdvancedFilter: state.showSubgridAdvancedFilter,
      showSlackPanel: state.showSlackPanel,
      setShowSubgridAdvancedFilter: state.setShowSubgridAdvancedFilter,
      setExclusivePanel: state.setExclusivePanel,
      setShowSlackPanel: state.setShowSlackPanel,
      setSlackPanelRecord: state.setSlackPanelRecord,
      selectedSlackRow: state.selectedSlackRow,
      selectedObject: state.selectedObject,
      setFlowEventSource: state.setFlowEventSource,
      setActiveRelationName: state.setActiveRelationName,
   })));

   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

   const isMoreMenuOpen = Boolean(anchorEl);

   const handleMoreMenuClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
   };

   const handleMoreMenuClose = () => {
      setAnchorEl(null);
   };


   return (
      <Box>
         {!isPivotMode && (
            <Stack spacing={1} direction='row' sx={{
               mt: 0,
               width: '100%',  // Fixed width for the Stack
               flexShrink: 0,   // Prevents the Stack from shrinking or resizing
               overflowY: 'auto',
               overflowX: 'hidden',
               alignItems: 'center', // align vertically
               justifyContent: 'flex-start',  // align horizontally
               boxSizing: 'border-box', // Ensure padding and border don't cause overflow
            }}>
               <Typography sx={{ color: selectedAccentColor }}>Actions:</Typography>
               {/* add */}
               <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                     alignItems: 'center',
                     boxSizing: 'border-box', // Include borders in width calculation
                     flexShrink: 1,
                  }}
               >
                  <Tooltip title="Add" placement="top" sx={{
                     color: theme.palette.text.primary,
                     '&:hover': {
                        color: theme.palette.text.primary,
                     },
                  }}>
                     <IconButton
                        aria-label="Add"
                        onClick={() => {
                           PubSub.publish('AddSubgridRow')
                        }}
                     >
                        <AddOutlinedIcon sx={{ fontSize: 25 }} />
                     </IconButton>
                  </Tooltip>
               </Box>
               {/* save */}
               <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                     boxSizing: 'border-box', // Include borders in width calculation
                     flexShrink: 1,
                     alignItems: 'center',
                  }}
               >
                  <Tooltip title="Save" placement="top" sx={{
                     color: theme.palette.text.primary,
                     '&:hover': {
                        color: theme.palette.text.primary,
                     },
                  }}>
                     <IconButton
                        aria-label="Save"
                        onClick={() => emitSaveRecords({ context: 'subgrid', gridId })}
                     >
                        <SaveIcon sx={{ fontSize: 25 }} />
                     </IconButton>
                  </Tooltip>
               </Box>
               {/* delete */}
               <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                     boxSizing: 'border-box', // Include borders in width calculation
                     flexShrink: 1,
                     alignItems: 'center',
                  }}
               >
                  <Tooltip title="Delete" placement="top" sx={{
                     color: theme.palette.text.primary,
                     '&:hover': {
                        color: theme.palette.text.primary,
                     },
                  }}>
                     <IconButton
                        aria-label="Delete"
                        onClick={() => emitDeleteRecords({ context: 'subgrid', gridId })}
                     >
                        <DeleteOutlinedIcon sx={{ fontSize: 25 }} />
                     </IconButton>
                  </Tooltip>
               </Box>
               {/* refresh data */}
               <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                     boxSizing: 'border-box', // Include borders in width calculation
                     flexShrink: 1,
                     alignItems: 'center',
                  }}
               >
                  <Tooltip title="Refresh" placement="top" sx={{
                     color: theme.palette.text.primary,
                     '&:hover': {
                        color: theme.palette.text.primary,
                     },
                  }}>
                     <IconButton
                        aria-label="Relationships"
                        onClick={() => {
                           // we don't care about the payload
                           // at any given time, only 1 gridView (MainGrid or TranspositionGrid) will be
                           // mounted and receive the event

                           PubSub.publish('RefreshSubgridQuery', true)
                        }}
                     >
                        <ReplayOutlinedIcon sx={{ fontSize: 25 }} />
                     </IconButton>
                  </Tooltip>
               </Box>
               {/* moved Grid Type selector to be just before More menu */}
               {/* select all */}
               <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                     boxSizing: 'border-box', // Include borders in width calculation
                     flexShrink: 1,
                     alignItems: 'center',
                  }}
               >
                  <Tooltip title="Select/Deselect all rows" placement="top" sx={{
                     color: theme.palette.text.primary,
                     '&:hover': {
                        color: theme.palette.text.primary,
                     },
                  }}>
                     <IconButton
                        aria-label="Select All"
                        onClick={() => {
                           // we don't care about the payload
                           PubSub.publish('SelectAllSubgridRecords', true)
                        }}
                     >
                        <PlaylistAddCheckOutlinedIcon sx={{ fontSize: 30 }} />
                     </IconButton>
                  </Tooltip>
               </Box>

               {/* Grid Type selector (now before More menu) */}
               {gridPermissions?.enableGridTypeSelector && (
                  <Box display="flex" justifyContent="center" alignItems="center">
                     <SubgridGridTypeSelector apiClient={apiClient} relationName={relationName} />
                  </Box>
               )}

               {/* Column Manager (after Grid Type) */}
               <Box display="flex" justifyContent="center" alignItems="center">
                  <Tooltip title="Column Manager" placement="top" sx={{ color: theme.palette.text.primary, '&:hover': { color: theme.palette.text.primary } }}>
                     <IconButton
                        aria-label="Column Manager"
                        onClick={() => {
                           (document.activeElement as HTMLElement | null)?.blur();
                           // Match parent toolbar behavior: publish OpenColumnsPanel with context+gridId
                           emitOpenColumnPanel({ context: 'subgrid', gridId });
                        }}
                     >
                        <ViewColumnOutlinedIcon sx={{ fontSize: 25 }} />
                     </IconButton>
                  </Tooltip>
               </Box>

               {/* Slack Panel */}
               <Box display="flex" justifyContent="center" alignItems="center">
                  <Tooltip title={showSlackPanel ? "Hide Slack Panel" : "Show Slack Panel"} placement="top" sx={{ color: theme.palette.text.primary, '&:hover': { color: theme.palette.text.primary } }}>
                     <IconButton
                        aria-label="Slack Panel"
                        onClick={() => {
                           if (showSlackPanel) {
                              setShowSlackPanel(false);
                              return;
                           }

                           if (selectedSlackRow) {
                              // Get record info from selected slack row
                              const row = selectedSlackRow as Record<string, any>;
                              const recordId = row.Id || '';
                              const objectType = (selectedObject as any)?.qualifiedApiName || (selectedObject as any)?.QualifiedApiName || (selectedObject as any)?.apiName || '';
                              const recordName = row.Name || '';
                              setSlackPanelRecord(recordId, objectType, recordName);
                           }
                           setExclusivePanel('showSlackPanel');
                        }}
                     >
                        <SlackIconComponent width={25} height={25} />
                     </IconButton>
                  </Tooltip>
               </Box>

               {/* TreeGrid config panel (only in subgrid treeGrid view) */}
               <Box
                  justifyContent="center"
                  alignItems="center"
                  display={selectedSubgridType?.name === 'treeGrid' && gridPermissions?.enableTreeGrid ? 'inline' : 'none'}
                  sx={{
                     boxSizing: 'border-box',
                     flexShrink: 1,
                     alignItems: 'center',
                  }}
               >
                  <Tooltip title="TreeGrid Config Wizard" placement="top" sx={{ color: theme.palette.text.primary, '&:hover': { color: theme.palette.text.primary } }}>
                     <IconButton
                        aria-label="TreeGrid Config Panel"
                        onClick={() => {
                           if (relationName && setActiveRelationName) {
                              setActiveRelationName(relationName);
                              PubSub.publish('RequestSubgridTreePrefs', { relationName });
                           }
                           setExclusivePanel('showTreegridConfigPanel');
                        }}
                     >
                        <LockOpenIcon sx={{ fontSize: 25 }} />
                     </IconButton>
                  </Tooltip>
               </Box>

               {/* More menu (after Grid Type selector) */}
               <Box display="flex" justifyContent="center" alignItems="center">
                  <Tooltip title="More Actions">
                     <IconButton onClick={handleMoreMenuClick}>
                        <MoreVertIcon sx={{ color: theme.palette.text.primary }} />
                     </IconButton>
                  </Tooltip>
                  <Menu anchorEl={anchorEl} open={isMoreMenuOpen} onClose={handleMoreMenuClose}>
                     <Box sx={{ padding: '6px 16px', backgroundColor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                           More Actions
                        </Typography>
                     </Box>

                     {/* Move Filters into menu when compact */}
                     {moveFilters && (
                        <>
                           <MenuItem onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography sx={{ width: 125, color: theme.palette.text.primary }}>Filter:</Typography>
                              <FilterSelector />
                           </MenuItem>
                           <MenuItem onClick={() => { setShowSubgridAdvancedFilter(!showSubgridAdvancedFilter); }}>
                              <ListItemIcon>
                                 <FilterAltOutlinedIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={showSubgridAdvancedFilter ? 'Disable Advanced Filter' : 'Enable Advanced Filter'} />
                           </MenuItem>
                           <MenuItem onClick={() => { PubSub.publish('Save Subgrid Filter', null); handleMoreMenuClose(); }}>
                              <ListItemIcon>
                                 <FavoriteBorderOutlinedIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary="Save Filter" />
                           </MenuItem>
                           <MenuItem onClick={() => { PubSub.publish('Clear Subgrid Filters', null); handleMoreMenuClose(); }}>
                              <ListItemIcon>
                                 <FilterAltOffOutlinedIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary="Clear Filters" />
                           </MenuItem>
                           <MenuItem onClick={() => { PubSub.publish('Delete Subgrid Filter', null); handleMoreMenuClose(); }}>
                              <ListItemIcon>
                                 <DeleteOutlinedIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary="Delete Filter" />
                           </MenuItem>
                        </>
                     )}

                     {/* Flow Wizard */}
                     {gridPermissions?.enableFlowWizardAction && (
                        <MenuItem onClick={() => {
                           setFlowEventSource('subGrid');
                           setExclusivePanel('showFlowConfigPanel');
                           handleMoreMenuClose();
                        }}>
                           <ListItemIcon>
                              <AirOutlinedIcon fontSize="small" />
                           </ListItemIcon>
                           <ListItemText primary="Flow Wizard" />
                        </MenuItem>
                     )}

                     {/* Format Wizard */}
                     {gridPermissions?.enableStylesWizard && (
                        <MenuItem onClick={() => {
                           setExclusivePanel('showSubgridColumnStylePanel');
                           PubSub.publish('ShowSubgridColumnStylePanel');
                           handleMoreMenuClose();
                        }}>
                           <ListItemIcon>
                              <FormatColorFillOutlinedIcon fontSize="small" />
                           </ListItemIcon>
                           <ListItemText primary="Format Wizard" />
                        </MenuItem>
                     )}

                     {/* Calculated Column Wizard */}
                     {gridPermissions?.enableCalculatedColumnWizard && (
                        <MenuItem onClick={() => {
                           setExclusivePanel('showSubgridCalculatedColumnPanel');
                           PubSub.publish('ShowCalculatedSubgridColumnPanel');
                           handleMoreMenuClose();
                        }}>
                           <ListItemIcon>
                              <FunctionsOutlinedIcon fontSize="small" />
                           </ListItemIcon>
                           <ListItemText primary="Calculated Column Wizard" />
                        </MenuItem>
                     )}

                     {/* Slack */}
                     <MenuItem onClick={() => {
                        if (showSlackPanel) {
                           setShowSlackPanel(false);
                           handleMoreMenuClose();
                           return;
                        }

                        if (selectedSlackRow) {
                           // Get record info from selected slack row
                           const row = selectedSlackRow as Record<string, any>;
                           const recordId = row.Id || '';
                           const objectType = (selectedObject as any)?.qualifiedApiName || (selectedObject as any)?.QualifiedApiName || (selectedObject as any)?.apiName || '';
                           const recordName = row.Name || '';
                           setSlackPanelRecord(recordId, objectType, recordName);
                        }
                        setExclusivePanel('showSlackPanel');
                        handleMoreMenuClose();
                     }}>
                        <ListItemIcon>
                           <ChatIcon fontSize="small" sx={{ color: showSlackPanel ? 'primary.main' : 'inherit' }} />
                        </ListItemIcon>
                        <ListItemText primary={showSlackPanel ? 'Hide Slack' : 'Show Slack'} />
                     </MenuItem>

                     {/* Column Manager removed from More menu as requested */}
                  </Menu>
               </Box>
            </Stack >
         )}
      </Box>
   )
}


export default SubgridMenu
