import React, { useState, useMemo, useEffect } from 'react';

// Zustand
import useStore from '../../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// NEW: Domain-specific selector hooks
import { useQueryState } from '../../../hooks/selectors/useUIState';

// MUI
import { Box, IconButton, Stack, Tooltip, Menu, MenuItem, Typography } from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

// MUI icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

import PostAddOutlinedIcon from '@mui/icons-material/PostAddOutlined';

import MoreVertIcon from '@mui/icons-material/MoreVert';

import SpeedIcon from '@mui/icons-material/Speed';


import { AppGridColorPicker } from '../../accentColorPicker/AppGridColorPicker';

import ExportSelector from './ExportSelector';

import ChartSelector from './ChartSelector';

import ObjectSelector from './ObjectSelector';

import QuerySelector from './QuerySelector';

import ViewSelector from './ViewSelector';

import PubSub from 'pubsub-js';

import { useSleep } from '../../../gridMethods/sleep';

interface LwcToolbarResponsiveProps {
   containerSize: { width: number; height: number } | null;
   onViewChange?: (view: any) => void;
   onQueryChange?: (query: any) => void;
}

export const AppToolbarResponsive = ({ containerSize, onViewChange, onQueryChange }: LwcToolbarResponsiveProps) => {
   const theme = useTheme();

   const sleep = useSleep();

   // Query state from domain hook
   const { showQueryMetricsPanel, setShowQueryMetricsPanel } = useQueryState();

   // Remaining global state
   const {
      gridPermissions,
      selectedGridType,
      setShowChartDialog,
      setShowCharts,
      chartInfo,
      setExclusivePanel,
   } = useStore(
      useShallow((state) => ({
         gridPermissions: state.gridPermissions,
         selectedGridType: state.selectedGridType,
         setShowChartDialog: state.setShowChartDialog,
         setShowCharts: state.setShowCharts,
         chartInfo: state.chartInfo,
         setExclusivePanel: state.setExclusivePanel,
      }))
   );

   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

   const isMoreMenuOpen = Boolean(anchorEl);

   const handleMoreMenuClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
   };

   const tooltipSx = useMemo(
      () => ({
         color: theme.palette.text.primary,
         '&:hover': {
            color: theme.palette.text.primary,
         },
      }),
      [theme.palette.text.primary]
   );

   const handleMoreMenuClose = () => {
      setAnchorEl(null);
   };

   const [moveQuery, setMoveQuery] = useState(false);

   const [moveView, setMoveView] = useState(false);

   useEffect(() => {
      let isDebouncing = false;

      const handleResize = async () => {
         if (isDebouncing) return;
         isDebouncing = true;

         try {
            await sleep(100);
            const plainSize = containerSize && typeof containerSize.width === 'number' && typeof containerSize.height === 'number'
               ? containerSize
               : { width: window.innerWidth, height: 0 };
            const width = Number(plainSize.width);

            if (width === 0) {
               setMoveQuery(true);
               setMoveView(true);
               return;
            }
            if (width < 700) {
               setMoveQuery(true);
               setMoveView(true);
            } else if (width < 1000) {
               setMoveQuery(true);
               setMoveView(false);
            } else {
               setMoveQuery(false);
               setMoveView(false);
            }
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
   }, [containerSize, sleep, moveQuery, moveView]);

   // Charts always embedded now
   useEffect(() => {
      const hasChart = !!chartInfo?.chartRef;
      setShowChartDialog(false);
      setShowCharts(hasChart);
   }, [chartInfo, setShowChartDialog, setShowCharts]);

   return (
      <Stack
         data-name="GridToolbar"
         direction="row"
         alignItems="center"
         spacing={2}
         sx={{
            mt: 0,
            padding: '4px 12px',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px'
         }}
      >
         <ObjectSelector />

         {/* {showViewSelector && ( */}
         <Stack direction="row"
            sx={{
               alignItems: 'center',
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}>
            {!moveView && <ViewSelector onViewChange={onViewChange} />}
            <Box
               display="flex"
               justifyContent="center"
               alignItems="center"
               sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
               }}>
               <Tooltip
                  title="Create Template"
                  placement="top"
                  sx={tooltipSx}>
                  <IconButton aria-label="CreateTemplate"
                     onClick={() => PubSub.publish('CreateTemplate')}>
                     <PostAddOutlinedIcon sx={{ fontSize: 25 }} />
                  </IconButton>
               </Tooltip>
            </Box>
            <Box
               display="flex"
               justifyContent="center"
               alignItems="center"
               sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
               }}>
               <Tooltip
                  title="Delete Template"
                  placement="top" sx={tooltipSx}>
                  <IconButton aria-label="DeleteTemplate"
                     onClick={() => PubSub.publish('DeleteTemplate')}>
                     <DeleteOutlinedIcon sx={{ fontSize: 25 }} />
                  </IconButton>
               </Tooltip>
            </Box>
         </Stack>
         {/* )} */}

         {!moveQuery && <QuerySelector onQueryChange={onQueryChange} />}

         {/* More Actions */}
         <Box
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}>
            <Tooltip title="More Actions">
               <IconButton
                  onClick={handleMoreMenuClick}>
                  <MoreVertIcon
                     sx={{
                        color: theme.palette.text.primary
                     }} />
               </IconButton>
            </Tooltip>
            <Menu
               anchorEl={anchorEl}
               open={isMoreMenuOpen}
               onClose={handleMoreMenuClose}
               slotProps={{
                  paper: {
                     sx: {
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                     }
                  }
               }}>
               <Box
                  sx={{
                     padding: '6px 16px',
                     backgroundColor: theme.palette.action.hover,
                     borderBottom: 1,
                     borderColor: theme.palette.divider
                  }}>
                  <Typography
                     variant="subtitle1"
                     sx={{
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: theme.palette.text.primary
                     }}>
                     More Actions
                  </Typography>
               </Box>
               {moveView && selectedGridType?.name === 'gridView' && (
                  <MenuItem
                     onClick={(e) => e.stopPropagation()} sx={{
                        display: 'flex',
                        alignItems: 'center'
                     }}>
                     <ViewSelector onViewChange={onViewChange} />
                  </MenuItem>
               )}
               {moveQuery && (
                  <MenuItem
                     onClick={(e) => e.stopPropagation()} sx={{
                        display: 'flex',
                        alignItems: 'center'
                     }}>
                     <QuerySelector onQueryChange={onQueryChange} />
                  </MenuItem>
               )}
               <MenuItem
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                     display: 'flex',
                     alignItems: 'center'
                  }}>
                  <Typography
                     sx={{ width: 125 }}>
                     Chart:
                  </Typography>
                  <ChartSelector />
               </MenuItem>
               {/* queryMetricsPanel */}
               <MenuItem
                  onClick={() => {
                     if (showQueryMetricsPanel) {
                        setShowQueryMetricsPanel(false);
                     } else {
                        setExclusivePanel('showQueryMetricsPanel');
                     }
                     handleMoreMenuClose();
                  }}
                  sx={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: 1
                  }}
               >
                  <SpeedIcon
                     sx={{ color: showQueryMetricsPanel ? 'primary.main' : theme.palette.text.primary }} />
                  <Typography>
                     {showQueryMetricsPanel ? 'Hide' : 'Show'} Query Metrics
                  </Typography>
               </MenuItem>
               {/* export */}
               <MenuItem
                  onClick={(e) => e.stopPropagation()} sx={{
                     display: 'flex',
                     alignItems: 'center'
                  }}>
                  <ExportSelector />
               </MenuItem>
               {/* accentColorPicker */}
               {gridPermissions?.enableAccentColorPicker && (
                  <MenuItem
                     onClick={(e) => e.stopPropagation()} sx={{
                        display: 'flex',
                        alignItems: 'center'
                     }}>
                     <Typography
                        sx={{ width: 125 }}>
                        Accent Color:
                     </Typography>
                     <AppGridColorPicker />
                  </MenuItem>
               )}
            </Menu>
         </Box>
      </Stack>
   );
};
