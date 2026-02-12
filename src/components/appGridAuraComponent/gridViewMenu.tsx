import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

import PubSub from 'pubsub-js';

import { emitShowQueryBuilder, emitShowColumnStylePanel, emitShowCalculatedColumnPanel, emitDeleteRecords, emitSaveRecords, emitOpenColumnPanel } from '../../events/topics';

import { TimeSeriesFilterSelector } from './toolbar/TimeSeriesFilterSelector';

import GridTypeSelector from './toolbar/GridTypeSelector';

import FilterSelector from './toolbar/FilterSelector';

// MUI
import { Box, IconButton, Tooltip, Stack, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

// MUI icons
import AddOutlinedIcon from '@mui/icons-material/Add';

import Brightness4Icon from '@mui/icons-material/Brightness4';

import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

import FormatColorFillOutlinedIcon from '@mui/icons-material/FormatColorFillOutlined';

import FunctionsOutlinedIcon from '@mui/icons-material/FunctionsOutlined';

import LockOpenIcon from '@mui/icons-material/LockOpen';

import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';

import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';

import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';

import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import SaveIcon from '@mui/icons-material/CheckOutlined';

import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import AirOutlinedIcon from '@mui/icons-material/AirOutlined';

import MoreVertIcon from '@mui/icons-material/MoreVert';

import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';

import SlackIconComponent from './SlackIconComponent';
// import { prettyPrint } from '../../utilities/prettyPrint';

type PanelStateKey = 'showObjectPrefsPanel' | 'showPermissionsPanel' | 'showDeploymentPanel' | 'showFlowConfigPanel';

interface GridViewMenuProps {
   containerSize: { width: number; height: number } | null;
   gridId?: string | number | null;
}

// const SFDX_BLUE = '#0176D3'

const GridViewMenu = ({ containerSize, gridId }: GridViewMenuProps) => {
   // theme
   const theme = useTheme();

   // global state
   const {
      pivotMode,
      setExclusivePanel,
      gridPermissions,
      selectedGridType,
      selectedGridColorTheme,
      objColumnStyles,
      objRowStyles,
      showSlackPanel,
      slackConfigConfigured,
      selectedSlackRow,
      setShowSlackPanel,
      setSlackPanelRecord,
      toggleGridColorTheme,
   } = useStore(
      useShallow((state) => ({
         pivotMode: state.pivotMode,
         setExclusivePanel: state.setExclusivePanel,
         gridPermissions: state.gridPermissions,
         selectedGridType: state.selectedGridType,
         selectedGridColorTheme: state.selectedGridColorTheme,
         objColumnStyles: state.objColumnStyles,
         objRowStyles: state.objRowStyles,
         showSlackPanel: state.showSlackPanel,
         slackConfigConfigured: state.slackConfigConfigured,
         selectedSlackRow: state.selectedSlackRow,
         setShowSlackPanel: state.setShowSlackPanel,
         setSlackPanelRecord: state.setSlackPanelRecord,
         toggleGridColorTheme: state.toggleGridColorTheme,
      })),
   );

   const [hasStylesApplied, setHasStylesApplied] = useState(false);

   useEffect(() => {
      const isColumnStyleActive = objColumnStyles.some((style) => style.active === true);
      const isRowStyleActive = objRowStyles.some((style) => style.active === true);
      setHasStylesApplied(isColumnStyleActive || isRowStyleActive);
   }, [objColumnStyles, objRowStyles]);

   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

   const isMoreMenuOpen = Boolean(anchorEl);

   const handleMoreMenuClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
   };

   const createMenuClickHandler = useCallback(
      (panel: PanelStateKey) => () => {
         handleMoreMenuClose();
         setExclusivePanel(panel);
      },
      [setExclusivePanel],
   );

   const handleMoreMenuClose = () => {
      setAnchorEl(null);
   };

   const tooltipSx = useMemo(
      () => ({
         color: theme.palette.text.primary,
         '&:hover': {
            color: theme.palette.text.primary,
         },
      }),
      [theme.palette.text.primary],
   );

   const [moveFilter, setMoveFilter] = useState(false);


   useEffect(() => {
      let isDebouncing = false;

      const handleResize = async () => {
         if (isDebouncing) return;
         isDebouncing = true;

         try {
            const plainSize = containerSize && typeof containerSize.width === 'number' && typeof containerSize.height === 'number'
               ? containerSize
               : { width: window.innerWidth, height: 0 };
            const width = Number(plainSize.width);

            if (width === 0) {
               console.warn('GridViewMenu width is 0, using default layout');
               setMoveFilter(true);
               return;
            }
            setMoveFilter(width < 1000);
         } finally {
            isDebouncing = false;
         }
      };

      handleResize();

      const debouncedResize = () => {
         handleResize();
      };

      window.addEventListener('resize', debouncedResize);

      return () => {
         window.removeEventListener('resize', debouncedResize);
      };
   }, [containerSize]);

   return (
      <Stack
         data-name="GridMenu"
         direction="row"
         spacing={1}
         sx={{
            mb: 2,
            padding: '4px 12px',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            height: 'auto',
            alignItems: 'center',
            boxSizing: 'border-box',
            borderBottomLeftRadius: '6px',
            borderBottomRightRadius: '6px',
         }}
      >
         {/* --- add record --- */}
         <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
               backgroundColor: theme.palette.background.paper,
            }}>
            <Tooltip
               title={
                  pivotMode
                     ? 'Add is unavailable in Pivot Mode. Switch to Table view to add records.'
                     : 'Add'
               }
               placement="top"
               sx={tooltipSx}>
               <span>
                  <IconButton
                     aria-label="Add"
                     disabled={pivotMode}
                     onClick={() => PubSub.publish('AddGridRow')}>
                     <AddOutlinedIcon
                        sx={{
                           fontSize: 25,
                           color: theme.palette.text.primary,
                           '&.Mui-disabled': {
                              color: theme.palette.action.disabled,
                           },
                        }} />
                  </IconButton>
               </span>
            </Tooltip>
         </Box>

         {/* save records */}
         <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
               backgroundColor: theme.palette.background.paper,
            }}>
            <Tooltip
               title={
                  pivotMode
                     ? 'Save is unavailable in Pivot Mode. Switch to Table view to save records.'
                     : 'Save'
               }
               placement="top"
               sx={tooltipSx}>
               <span>
                  <IconButton
                     aria-label="Save"
                     disabled={pivotMode}
                     onClick={() => emitSaveRecords({ context: 'main', gridId })}>
                     <SaveIcon
                        sx={{
                           fontSize: 25,
                           color: theme.palette.text.primary,
                           '&.Mui-disabled': {
                              color: theme.palette.action.disabled,
                           },
                        }} />
                  </IconButton>
               </span>
            </Tooltip>
         </Box>

         {/* delete records */}
         <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
               backgroundColor: theme.palette.background.paper,
            }}>
            <Tooltip
               title={
                  pivotMode
                     ? 'Delete is unavailable in Pivot Mode. Switch to Table view to delete records.'
                     : 'Delete'
               }
               placement="top"
               sx={tooltipSx}>
               <span>
                  <IconButton
                     aria-label="Delete"
                     disabled={pivotMode}
                     onClick={() => emitDeleteRecords({ context: 'main', gridId })}>
                     <DeleteOutlinedIcon
                        sx={{
                           fontSize: 25,
                           color: theme.palette.text.primary,
                           '&.Mui-disabled': {
                              color: theme.palette.action.disabled,
                           },
                        }} />
                  </IconButton>
               </span>
            </Tooltip>
         </Box>

         {/* queryBuilder */}
         <Box
            justifyContent="center"
            alignItems="center"
            display={gridPermissions?.enableQueryBuilderAction ? 'inline' : 'none'}
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary
            }}
         >
            <Tooltip
               title="Search"
               placement="top"
               sx={{
                  color: theme.palette.text.primary,
                  '&:hover': {
                     color: theme.palette.text.primary, // Hover color when using a CSS variable
                  },
               }}>
               <IconButton
                  aria-label="Search"
                  onClick={() => {
                     emitShowQueryBuilder();
                  }}
               >
                  <SearchOutlinedIcon sx={{ fontSize: 25 }} />
               </IconButton>
            </Tooltip>
         </Box>

         {/* refresh data */}
         <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary
            }}>
            <Tooltip title="Refresh" placement="top" sx={tooltipSx}>
               <IconButton
                  aria-label="Refresh"
                  onClick={() => {
                     PubSub.publish('RefreshQuery');
                  }}
               >
                  <ReplayOutlinedIcon
                     sx={{ fontSize: 25 }} />
               </IconButton>
            </Tooltip>
         </Box>

         {/* select all */}
         <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary
            }}
         >
            <Tooltip
               title="Select/Deselect all rows" placement="top"
               sx={tooltipSx}>
               <IconButton
                  aria-label="Select All"
                  onClick={() => {
                     PubSub.publish('SelectAllRecords', true);
                  }}
               >
                  <PlaylistAddCheckOutlinedIcon sx={{ fontSize: 30 }} />
               </IconButton>
            </Tooltip>
         </Box>

         {/* Grid Type selector moved to be just before More menu */}
         {gridPermissions?.enableGridTypeSelector && (
            <Box
               display="flex"
               justifyContent="center" alignItems="center"
               sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary
               }}>
               <GridTypeSelector />
            </Box>
         )}

         {/* columns panel */}
         <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary
            }}
         >
            <Tooltip
               title="Open columns panel"
               placement="top"
               sx={tooltipSx}>
               <IconButton
                  aria-label="Open columns panel"
                  onClick={() => emitOpenColumnPanel({ context: 'main', gridId })}
               >
                  <ViewColumnOutlinedIcon sx={{ fontSize: 30 }} />
               </IconButton>
            </Tooltip>
         </Box>

         {/* Slack Panel */}
         {gridPermissions?.enableSlack && slackConfigConfigured === true && (<Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
               backgroundColor: theme.palette.background.paper,
            }}
         >
            <Tooltip
               title={
                  pivotMode
                     ? 'Slack is unavailable in Pivot Mode. Switch to Table view to view Slack.'
                     : 'Hide/show Slack'
               }
               placement="top"
               sx={tooltipSx}>
               <span>
                  <IconButton
                     aria-label="Slack Panel"
                     disabled={pivotMode}
                     onClick={() => {
                        if (showSlackPanel) {
                           setShowSlackPanel(false);
                           return;
                        }

                        // When opening the Slack panel, set the record context from the selected row
                        if (selectedSlackRow) {
                           const row = selectedSlackRow as Record<string, any>;
                           const recordId = row.Id;
                           const objectType = recordId ? recordId.substring(0, 3) : null;
                           const recordName = row.Name || 'Unknown';
                           setSlackPanelRecord(recordId, objectType, recordName);
                        }
                        setExclusivePanel('showSlackPanel');
                     }}
                  >
                     <SlackIconComponent
                        width={25}
                        height={25}
                     />
                  </IconButton>
               </span>
            </Tooltip>
         </Box>)}

         {/* Dark mode toggle */}
         <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary
            }}
         >
            <Tooltip
               title={selectedGridColorTheme?.id === 'colorSchemeDark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
               placement="top"
               sx={tooltipSx}>
               <IconButton
                  aria-label="Toggle dark mode"
                  onClick={() => toggleGridColorTheme()}
               >
                  <Brightness4Icon
                     sx={{
                        fontSize: 30,
                        color: selectedGridColorTheme?.id === 'colorSchemeDark' ? '#ffeb3b' : 'inherit'
                     }} />
               </IconButton>
            </Tooltip>
         </Box>



         {/* treeGrid config panel */}
         <Box
            justifyContent="center"
            alignItems="center"
            display={selectedGridType?.name === 'treeGrid' && gridPermissions?.enableTreeGrid ? 'inline' : 'none'}
            sx={{
               boxSizing: 'border-box',
               flexShrink: 1,
               alignItems: 'center',
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary
            }}
         >
            <Tooltip
               title="TreeGrid Config Wizard" placement="top"
               sx={tooltipSx}>
               <IconButton
                  aria-label="TreeGrid Config Panel"
                  onClick={() => {
                     setExclusivePanel('showTreegridConfigPanel');
                  }}
               >
                  <LockOpenIcon sx={{ fontSize: 25 }} />
               </IconButton>
            </Tooltip>
         </Box>


         {/* --- "More Actions" Menu --- */}
         {!pivotMode && <Box
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary
            }}>
            <Tooltip
               title="More Actions"
               placement="top"
               sx={tooltipSx}>
               <IconButton
                  aria-label="more actions"
                  id="more-actions-button"
                  aria-controls={isMoreMenuOpen ? 'more-actions-menu' : undefined}
                  aria-expanded={isMoreMenuOpen ? 'true' : undefined}
                  aria-haspopup="true"
                  onClick={handleMoreMenuClick}
               >
                  <MoreVertIcon sx={{ fontSize: 25 }} />
               </IconButton>
            </Tooltip>
            <Menu
               id="more-actions-menu"
               anchorEl={anchorEl}
               open={isMoreMenuOpen}
               onClose={handleMoreMenuClose}
               slotProps={{ list: { 'aria-labelledby': 'more-actions-button' } }} // Updated from MenuListProps
            >
               {moveFilter && (
                  <>
                     {selectedGridType?.name === 'timeSeriesView' ? (
                        <MenuItem
                           onClick={(e) => e.stopPropagation()}
                           sx={{ display: 'flex', alignItems: 'center' }}>
                           <TimeSeriesFilterSelector />
                        </MenuItem>
                     ) : (
                        <MenuItem onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', alignItems: 'center' }}>
                           <FilterSelector />
                        </MenuItem>
                     )}
                  </>
               )}

               {/* show object prefs panel */}
               {gridPermissions?.enableObjectPreferencesAction && (
                  <MenuItem onClick={createMenuClickHandler('showObjectPrefsPanel')}>
                     <ListItemIcon><SettingsOutlinedIcon fontSize="small" /></ListItemIcon>
                     <ListItemText>Objects</ListItemText>
                  </MenuItem>
               )}

               {/* show grid permissions panel */}
               {gridPermissions?.enablePermissionsAction && (
                  <MenuItem onClick={createMenuClickHandler('showPermissionsPanel')}>
                     <ListItemIcon><RuleOutlinedIcon fontSize="small" /></ListItemIcon>
                     <ListItemText>Permissions</ListItemText>
                  </MenuItem>
               )}

               {/* show deployment panel */}
               {gridPermissions?.enableDeploymentWizardAction && (
                  <MenuItem onClick={createMenuClickHandler('showDeploymentPanel')}>
                     <ListItemIcon><LockOpenIcon fontSize="small" /></ListItemIcon>
                     <ListItemText>Deployment Wizard</ListItemText>
                  </MenuItem>
               )}

               {/* show flow config panel */}
               {gridPermissions?.enableFlowWizardAction && (
                  <MenuItem onClick={createMenuClickHandler('showFlowConfigPanel')}>
                     <ListItemIcon><AirOutlinedIcon fontSize="small" /></ListItemIcon>
                     <ListItemText>Flow Wizard</ListItemText>
                  </MenuItem>
               )}

               {/* show column styles panel */}
               {gridPermissions?.enableStylesWizard && (
                  <MenuItem onClick={() => {
                     handleMoreMenuClose();
                     emitShowColumnStylePanel();
                  }}>
                     <ListItemIcon><FormatColorFillOutlinedIcon fontSize="small" sx={{ color: hasStylesApplied ? 'green' : 'inherit' }} /></ListItemIcon>
                     <ListItemText>Format Wizard</ListItemText>
                  </MenuItem>
               )}

               {/* show calculated columns panel */}
               {gridPermissions?.enableCalculatedColumnWizard && (
                  <MenuItem onClick={() => { handleMoreMenuClose(); emitShowCalculatedColumnPanel(); }}>
                     <ListItemIcon><FunctionsOutlinedIcon fontSize="small" /></ListItemIcon>
                     <ListItemText>Calculated Column</ListItemText>
                  </MenuItem>
               )}
            </Menu>
         </Box>
         }

         {/* --- Filter Selectors --- */}
         {!moveFilter && !pivotMode && (
            <>
               {selectedGridType?.name === 'timeSeriesView' ? (
                  <TimeSeriesFilterSelector />
               ) : (
                  <FilterSelector />
               )}
            </>
         )}
      </Stack>
   );
};

export default GridViewMenu;
