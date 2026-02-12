// react
import React, { useCallback } from 'react';

// Zustand
import useStore from '../../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// NEW: Domain-specific selector hooks
import { useThemeState } from '../../../hooks/selectors/useUIState';

import PubSub from 'pubsub-js';

// PubSub emit helpers
import { emitDeleteRecords, emitSaveRecords } from '../../../events/topics';

import { TransposedColumnSelector } from './TransposedColumnSelector'

// MUI
import { Box, IconButton, Tooltip, Stack, Typography, TextField } from '@mui/material';

import { useTheme } from '@mui/material';


// MUI icons
import AddOutlinedIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'

import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';

import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';

import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'

import SaveIcon from '@mui/icons-material/CheckOutlined'

import AirOutlinedIcon from '@mui/icons-material/AirOutlined';

import GridTypeSelector from '../../appGridAuraComponent/toolbar/GridTypeSelector';

import { SubgridGridTypeSelector } from '../../subGrid/subgridGridTypeSelector';

import { isGridGroupedOrPivoted } from '../../../hooks/grid/gridUtils';

// hide/show menu icons based on permissions
const TimeSeriesGridMenu = (props: any) => {
   const theme = useTheme();

   const apiClient = props.apiClient;
   const gridApi = props.gridApi;
   const gridId = props.gridId;
   const relationName = props.relationName;

   const onOpenImport = props.onOpenImport as (() => void) | undefined;

   const context = props.context; // 'main' | 'subgrid'

   // Theme state from domain hook
   const { selectedAccentColor } = useThemeState();

   // Remaining global state
   const {
      setExclusivePanel,
      gridPermissions,
      setShowQueryPanel,
   } = useStore(
      useShallow((state) => ({
         setExclusivePanel: state.setExclusivePanel,
         gridPermissions: state.gridPermissions,
         isPivotMode: state.pivotMode,
         setShowQueryPanel: state.setShowQueryPanel,
         setShowFilterBuilder: state.setShowFilterBuilder,
      }))
   );

   // local state
   // console.log('GridMenu rendering - gridPermissions are');
   // console.dir(gridPermissions);

   const onFilterTextBoxChanged = useCallback(() => {
      gridApi.setGridOption(
         "quickFilterText",
         (document.getElementById("filter-text-box") as HTMLInputElement)?.value || ''
      );
   }, [gridApi]);



   return (
      <Stack
         data-name="TimeSeriesGridMenu"
         direction='row'
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
         <Typography sx={{ color: selectedAccentColor }}>Actions:</Typography>
         {/* add */}
         <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
               alignItems: 'center',
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               boxSizing: 'border-box', // Include borders in width calculation
               flexShrink: 1,
            }}
         >
            <Tooltip title="Add" placement="top" sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               '&:hover': {
                  color: theme.palette.text.primary,
               },
            }}>
               <IconButton
                  aria-label="Add"
                  onClick={() => {
                     PubSub.publish('AddTimeSeriesRecord')
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
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
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
                  onClick={() => {
                     emitSaveRecords({ context, gridId });
                  }}
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
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               boxSizing: 'border-box', // Include borders in width calculation
               flexShrink: 1,
               alignItems: 'center',
            }}
         >
            <Tooltip title="Delete" placement="top" sx={{
               color: theme.palette.text.primary,
               '&:hover': {
                  color: theme.palette.text.primary, // Hover color when using a CSS variable
               },
            }}>
               <IconButton
                  aria-label="Delete"
                  onClick={() => {
                     emitDeleteRecords({ context, gridId });
                  }}
               >
                  <DeleteOutlinedIcon sx={{ fontSize: 25 }} />
               </IconButton>
            </Tooltip>
         </Box>
         {/* queryBuilder */}
         <Box
            justifyContent="center"
            alignItems="center"
            display={gridPermissions?.enableQueryBuilderAction ? 'inline' : 'none'}

            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               boxSizing: 'border-box', // Include borders in width calculation
               flexShrink: 1,
               alignItems: 'center',
            }}
         >
            <Tooltip title="Search" placement="top" sx={{
               color: theme.palette.text.primary,
               '&:hover': {
                  color: theme.palette.text.primary, // Hover color when using a CSS variable
               },
            }}>
               <IconButton
                  aria-label="Search"
                  onClick={() => {
                     setShowQueryPanel(true)
                  }}
               >
                  <SearchOutlinedIcon sx={{ fontSize: 25 }} />
               </IconButton>
            </Tooltip>
         </Box>
         {/* grid type selector (placed after QueryBuilder) */}
         {gridPermissions?.enableGridTypeSelector && (
            <Box
               display="flex"
               justifyContent="center" alignItems="center"
               sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
               }}>
               {context === 'subgrid' ? (
                  <SubgridGridTypeSelector
                     disableTimeSeries={isGridGroupedOrPivoted(() => gridApi)}
                     apiClient={apiClient}
                     relationName={relationName}
                  />
               ) : (
                  <GridTypeSelector />
               )}
            </Box>
         )}
         {/* select all */}
         <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               boxSizing: 'border-box', // Include borders in width calculation
               flexShrink: 1,
               alignItems: 'center',
            }}
         >
            <Tooltip title="Select/Deselect all rows" placement="top" sx={{
               color: theme.palette.text.primary,
               '&:hover': {
                  color: theme.palette.text.primary, // Hover color when using a CSS variable
               },
            }}>
               <IconButton
                  aria-label="Select All"
                  onClick={() => {
                     // we don't care about the payload
                     PubSub.publish('SelectAll', true)
                  }}
               >
                  <PlaylistAddCheckOutlinedIcon sx={{ fontSize: 30 }} />
               </IconButton>
            </Tooltip>
         </Box>
         {/* import (Sheet) */}
         <Box
            display="flex"
            justifyContent="center" alignItems="center"
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}>
            <Tooltip title="Import from Excel/CSV" placement="top" sx={{ color: theme.palette.text.primary, '&:hover': { color: theme.palette.text.primary } }}>
               <span>
                  <IconButton aria-label="Import" onClick={() => onOpenImport && onOpenImport()}>
                     <ContentPasteGoIcon sx={{ fontSize: 24 }} />
                  </IconButton>
               </span>
            </Tooltip>
         </Box>
         {/* flow panel */}
         <Box
            justifyContent="center"
            alignItems="center"
            display={gridPermissions?.enableFlowWizardAction ? 'inline' : 'none'}
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               boxSizing: 'border-box', // Include borders in width calculation
               flexShrink: 1,
               alignItems: 'center',
            }}
         >
            <Tooltip title="Flow Wizard" placement="top" sx={{
               color: theme.palette.text.primary,
               '&:hover': {
                  color: theme.palette.text.primary, // Hover color when using a CSS variable
               },
            }}>
               <IconButton
                  aria-label="Flow Wizard"
                  onClick={() => {
                     setExclusivePanel('showFlowConfigPanel')
                  }
                  }
               >
                  <AirOutlinedIcon sx={{ fontSize: 25 }} />
               </IconButton>
            </Tooltip>
         </Box>

         {/* TransposedColumnSelector */}
         <TransposedColumnSelector />

         {/* quick filter */}
         <Typography sx={{ color: selectedAccentColor }}>Find:</Typography>
         <TextField
            type="text"
            id='filter-text-box'
            variant="standard"
            onChange={() => {
               onFilterTextBoxChanged(); // Update the form state with the new value
            }}
            sx={{
               width: 150,
               color: theme.palette.text.primary,
               '& .MuiInputBase-input': {
                  color: theme.palette.text.primary, // Set input text color
               },
               '& .MuiFormLabel-root': {
                  color: selectedAccentColor, // Set label color
               },
               // Color the underline when not focused
               '& .MuiInput-underline:before': {
                  borderBottomColor: theme.palette.text.primary, // Color when not focused
               },
               // Color the underline when focused
               '& .MuiInput-underline:after': {
                  borderBottomColor: theme.palette.text.primary, // Color when focused
               },
               // Color the underline when hovered
               '&:hover .MuiInput-underline:before': {
                  borderBottomColor: theme.palette.text.primary, // Color when hovered
               },
            }}
         />
      </Stack >
   )
}


export default TimeSeriesGridMenu
