// react
import React, { useState, useEffect, useRef } from 'react'

// Zustand
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore'

// Mui
import { Box, IconButton, Stack, Tooltip } from '@mui/material'

import { useTheme } from '@mui/material';

// Mui icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined'

// components
import FilterSelector from './FilterSelector'
import SubgridMenu from './SubgridMenu';

// PubSubJS
import PubSub from "pubsub-js";

const SubgridToolbar = (props: any) => {
   const theme = useTheme();
   const { relationName } = props;

   // global state
   const {
      isSubgridFilterActive,
      showSubgridAdvancedFilter,
      setShowSubgridAdvancedFilter,
      setShowSubgridAdvancedFilterBuilder,
   } = useStore(useShallow((state) => ({
      isSubgridFilterActive: state.isSubgridFilterActive,
      showSubgridAdvancedFilter: state.showSubgridAdvancedFilter,
      setShowSubgridAdvancedFilter: state.setShowSubgridAdvancedFilter,
      setShowSubgridAdvancedFilterBuilder: state.setShowSubgridAdvancedFilterBuilder,
   })));

   // responsive: move filters into More menu at smaller widths
   const [moveFilters, setMoveFilters] = useState(false);
   const containerRef = useRef<HTMLDivElement | null>(null);

   useEffect(() => {
      const BREAKPOINT = 900; // px
      let resizeObserver: ResizeObserver | null = null;
      const currentContainer = containerRef.current;

      const compute = () => {
         try {
            const el = containerRef.current;
            const w = el ? Math.floor(el.getBoundingClientRect().width) : window.innerWidth;
            if (!w || w <= 0) {
               setMoveFilters(true);
               return;
            }
            setMoveFilters(w < BREAKPOINT);
         } catch {
            setMoveFilters(window.innerWidth < BREAKPOINT);
         }
      };

      compute();
      const onResize = () => compute();
      window.addEventListener('resize', onResize);
      if ('ResizeObserver' in window) {
         resizeObserver = new ResizeObserver(onResize);
         if (currentContainer) resizeObserver.observe(currentContainer);
      }
      return () => {
         window.removeEventListener('resize', onResize);
         if (resizeObserver && currentContainer) resizeObserver.unobserve(currentContainer);
      };
   }, []);

   return (
      <Stack
         direction="column"
         spacing={1}
         sx={{
            width: '100%',
            flexWrap: 'nowrap',
         }}>
         {/* SubgridToolbar */}
         <Stack
            data-name="SubgridToolbar"
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
               marginTop: 0,
               padding: 0,
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               width: '100%',
               flexWrap: 'nowrap', // Ensure no wrapping of items
            }}
            ref={containerRef}
         >
            <SubgridMenu
               apiClient={props.apiClient}
               gridId={props.gridId}
               moveFilters={moveFilters}
               getGridApi={props.getGridApi}
               relationName={relationName}
            />

            {/* filter selector and buttons */}
            {!moveFilters && (
               <Stack direction="row" spacing={0}>
                  <Box display="flex" justifyContent="center" alignItems="center">
                     <FilterSelector />
                     {/* show advanced filter */}
                     <Tooltip title="Open Advanced Filter Builder" placement="top" sx={{
                        color: theme.palette.text.primary,
                        '&:hover': {
                           color: theme.palette.text.primary,
                        },
                     }}>
                        <IconButton
                           aria-label="Open Advanced Filter Builder"
                           onClick={() => {
                              // Enable advanced filter mode if not already enabled
                              if (!showSubgridAdvancedFilter) {
                                 setShowSubgridAdvancedFilter(true);
                              }
                              // Open the custom filter builder dialog
                              setShowSubgridAdvancedFilterBuilder(true);
                           }}
                           sx={{ color: showSubgridAdvancedFilter ? '#2e7d32' : theme.palette.text.primary }}
                        >
                           <FilterAltOutlinedIcon sx={{ fontSize: 25 }} />
                        </IconButton>
                     </Tooltip>
                  </Box>

                  {/* save filter */}
                  <Box justifyContent="center" alignItems="center">
                     <Tooltip title="Save filter" placement="top" sx={{
                        color: theme.palette.text.primary,
                        '&:hover': {
                           color: theme.palette.text.primary,
                        },
                     }}>
                        <IconButton aria-label="Save filter" onClick={() => PubSub.publish('Save Subgrid Filter', null)}>
                           <FavoriteBorderOutlinedIcon sx={{ fontSize: 25 }} />
                        </IconButton>
                     </Tooltip>
                  </Box>
                  {/* clear filters */}
                  <Box justifyContent="center" alignItems="center">
                     <Tooltip title="Clear filters" placement="top" sx={{
                        color: theme.palette.text.primary,
                        '&:hover': {
                           color: theme.palette.text.primary,
                        },
                     }}>
                        <IconButton
                           aria-label="Clear filters"
                           onClick={() => PubSub.publish('Clear Subgrid Filters', null)}
                           sx={{ color: isSubgridFilterActive ? '#2e7d32' : theme.palette.text.primary }}
                        >
                           <FilterAltOffOutlinedIcon sx={{ fontSize: 25 }} />
                        </IconButton>
                     </Tooltip>
                  </Box>
                  {/* delete filter */}
                  <Box justifyContent="center" alignItems="center">
                     <Tooltip title="Delete filter" placement="top" sx={{
                        color: theme.palette.text.primary,
                        '&:hover': {
                           color: theme.palette.text.primary,
                        },
                     }}>
                        <IconButton aria-label="Delete filter" onClick={() => PubSub.publish('Delete Subgrid Filter', null)}>
                           <DeleteOutlinedIcon sx={{ fontSize: 25 }} />
                        </IconButton>
                     </Tooltip>
                  </Box>
               </Stack>
            )}
         </Stack>
      </Stack>
   );

}

export default SubgridToolbar
