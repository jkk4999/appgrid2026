import React, { useMemo } from 'react';

// Zustand
import useStore from '../../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// PubSubJS
import PubSub from "pubsub-js";


// Mui
import { Autocomplete, Box, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";

// Theme
import { useTheme } from '@mui/material/styles';

// Mui icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined'

const FilterSelector = () => {
  const theme = useTheme();

  // Remaining global state (no theme state used from this component)
  const {
    selectedFilter,
    setSelectedFilter,
    filterOptions,
    showAdvancedFilter,
    setShowAdvancedFilter,
    isFilterActive,
    setShowAdvancedFilterBuilder,
  } = useStore(useShallow((state) => ({
    selectedFilter: state.selectedFilter,
    setSelectedFilter: state.setSelectedFilter,
    filterOptions: state.filterOptions,
    showAdvancedFilter: state.showAdvancedFilter,
    setShowAdvancedFilter: state.setShowAdvancedFilter,
    isFilterActive: state.isFilterActive,
    setShowAdvancedFilterBuilder: state.setShowAdvancedFilterBuilder,
  })));

  // Define a reusable style object for the tooltips to avoid repetition.
  // This was missing, causing a ReferenceError during render.
  const tooltipSx = useMemo(() => ({
    color: theme.palette.text.primary,
    '&:hover': {
      color: theme.palette.text.primary,
    },
  }), [theme.palette.text.primary]);

  return (
    <Box>
      <Stack
        direction='row'
        alignItems={'center'}
        spacing={2}
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}>
        <Typography>Filter:</Typography>
        <Autocomplete
          id="filterSelector"
          getOptionLabel={(option) => option?.name || ''}
          isOptionEqualToValue={(option, value) => option?.name === value?.name}
          options={filterOptions || []}
          value={selectedFilter || null}
          renderInput={(params) => (
            <TextField {...params} variant="standard" />
          )}
          onChange={(_event, value) => {
            if (value) {
              setSelectedFilter(value);
            }
          }}
          sx={{
            width: 250,
            '& .MuiAutocomplete-input': {
              color: theme.palette.text.primary, // Text color
            },
            '& .MuiInput-underline:before': {
              borderBottomColor: theme.palette.text.primary, // Underline color
            },
            '& .MuiAutocomplete-popupIndicator': {
              color: theme.palette.text.primary, // Arrow icon color
            },
            '& .MuiAutocomplete-clearIndicator': {
              color: theme.palette.text.primary, // Change clear button color
            },
          }}
        />
        <Stack direction='row' spacing={1}>
          {/* advanced filter builder */}
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}
          >
            <Tooltip title="Open Advanced Filter Builder" placement="top" sx={tooltipSx}>
              <IconButton
                aria-label="Open Advanced Filter Builder"
                onClick={() => {
                  // Enable advanced filter mode if not already enabled
                  if (!showAdvancedFilter) {
                    setShowAdvancedFilter(true);
                  }
                  // Open the custom filter builder dialog
                  setShowAdvancedFilterBuilder(true);
                }}
              >
                <FilterAltOutlinedIcon
                  sx={{ fontSize: 25, color: showAdvancedFilter ? '#2e7d32' : theme.palette.text.primary }}
                />
              </IconButton>
            </Tooltip>
          </Box>

          {/* save filter */}
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}>
            <Tooltip title="Save filter" placement="top" sx={tooltipSx}>
              <IconButton
                aria-label="Save filter"
                onClick={() => PubSub.publish('Save Filter', null)}
              >
                <FavoriteBorderOutlinedIcon sx={{ fontSize: 25 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* clear filters */}
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}>
            <Tooltip title="Clear filters" placement="top" sx={tooltipSx}>
              <IconButton
                aria-label="Clear filters"
                onClick={() => PubSub.publish('ClearFilters', null)}
                sx={{
                  color: isFilterActive ? '#2e7d32' : theme.palette.text.primary,
                }}
              >
                <FilterAltOffOutlinedIcon sx={{ fontSize: 25 }} />
              </IconButton>
            </Tooltip>
          </Box>
          {/* delete filter */}
          <Box display="flex" justifyContent="center" alignItems="center">
            <Tooltip title="Delete filter" placement="top" sx={tooltipSx}>
              <IconButton
                aria-label="Delete filter"
                onClick={() => PubSub.publish('Delete Filter', null)}
              >
                <DeleteOutlinedIcon sx={{ fontSize: 25 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>

      </Stack>
    </Box>
  );
};

export default FilterSelector;
