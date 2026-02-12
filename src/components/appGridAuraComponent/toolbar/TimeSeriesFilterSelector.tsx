import React, { useMemo } from 'react';

// Zustand
import useStore from '../../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// PubSubJS
import PubSub from 'pubsub-js';

// MUI
import { Autocomplete, Box, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

// Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';

const TimeSeriesFilterSelector = () => {
  const theme = useTheme();

  // Remaining global state (no theme state used from this component)
  const {
    selectedTimeSeriesFilter,
    timeSeriesFilterOptions,
    setSelectedTimeSeriesFilter,
    isMainTimeSeriesFilterActive,
    showFilterBuilder,
    setShowFilterBuilder,
  } = useStore(
    useShallow((state) => ({
      selectedTimeSeriesFilter: state.selectedTimeSeriesFilter,
      timeSeriesFilterOptions: state.timeSeriesFilterOptions,
      setSelectedTimeSeriesFilter: state.setSelectedTimeSeriesFilter,
      isMainTimeSeriesFilterActive: state.isMainTimeSeriesFilterActive,
      showFilterBuilder: state.showFilterBuilder,
      setShowFilterBuilder: state.setShowFilterBuilder,
    })),
  );

  const tooltipSx = useMemo(
    () => ({
      color: theme.palette.text.primary,
      '&:hover': {
        color: theme.palette.text.primary,
      },
    }),
    [theme.palette.text.primary],
  );

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}>
        <Typography>Time Series Filter:</Typography>
        <Autocomplete
          id="timeSeriesFilterSelector"
          getOptionLabel={(option) => option?.name || ''}
          isOptionEqualToValue={(option, value) => option?.name === value?.name}
          options={timeSeriesFilterOptions || []}
          value={selectedTimeSeriesFilter || null}
          renderInput={(params) => <TextField {...params} variant="standard" />}
          onChange={(_event, value) => {
            setSelectedTimeSeriesFilter(value || null);
          }}
          sx={{
            width: 225,
            '& .MuiAutocomplete-input': {
              color: theme.palette.text.primary,
            },
            '& .MuiInput-underline:before': {
              borderBottomColor: theme.palette.text.primary,
            },
            '& .MuiAutocomplete-popupIndicator': {
              color: theme.palette.text.primary,
            },
            '& .MuiAutocomplete-clearIndicator': {
              color: theme.palette.text.primary,
            },
          }}
        />
        <Stack
          direction="row"
          spacing={1}
          sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}>
            <Tooltip title="Open filter builder" placement="top" sx={tooltipSx}>
              <IconButton aria-label="Show filter builder" onClick={() => setShowFilterBuilder(!showFilterBuilder)}>
                <FilterAltOutlinedIcon sx={{ fontSize: 25, color: showFilterBuilder ? '#2e7d32' : theme.palette.text.primary }} />
              </IconButton>
            </Tooltip>
          </Box>
          <Box
            display={isMainTimeSeriesFilterActive ? 'inline' : 'none'}
            justifyContent="center"
            alignItems="center"
            sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}>
            <Tooltip title="Filters active" placement="top">
              <IconButton aria-label="Filters active" sx={{ color: '#2e7d32' }}>
                <FilterListIcon sx={{ fontSize: 25 }} />
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
            <Tooltip title="Save filter" placement="top" sx={tooltipSx}>
              <IconButton aria-label="Save filter" onClick={() => PubSub.publish('SaveTimeSeriesFilter', null)}>
                <FavoriteBorderOutlinedIcon sx={{ fontSize: 25 }} />
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
            <Tooltip title="Clear filters" placement="top" sx={tooltipSx}>
              <IconButton
                aria-label="Clear filters"
                onClick={() => PubSub.publish('ClearTimeSeriesFilters', null)}
                sx={{ color: isMainTimeSeriesFilterActive ? '#2e7d32' : theme.palette.text.primary }}
              >
                <FilterAltOffOutlinedIcon sx={{ fontSize: 25 }} />
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
            <Tooltip title="Delete filter" placement="top" sx={tooltipSx}>
              <IconButton aria-label="Delete filter" onClick={() => PubSub.publish('DeleteTimeSeriesFilter', null)}>
                <DeleteOutlinedIcon sx={{ fontSize: 25 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

export { TimeSeriesFilterSelector };
