import React, { useCallback, useEffect, useMemo, useState } from 'react';

// Zustand
import useStore from '../../../zustandStore'
import { useShallow } from 'zustand/react/shallow';


// notifications
import { useSnackbar } from 'notistack';
import type { SnackbarKey } from 'notistack';

// Mui
import { Box, IconButton, Menu, MenuItem, Stack, Tooltip, ListItemIcon, ListItemText } from "@mui/material";

// Theme
import { useTheme } from '@mui/material/styles';

import { prettyPrint } from '../../../utilities/prettyPrint';

// Icons
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';

import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';

import PivotTableChartOutlinedIcon from '@mui/icons-material/PivotTableChartOutlined';

const GridTypeSelector = () => {
  const theme = useTheme();

  // Remaining global state
  const {
    enableGridView,
    disableGridView,
    gridPermissions,
    gridViewTypes,
    selectedGridType,
    selectedObject,
    setInitialDataLoaded,
    setSelectedGridType,
    pivotMode,
  } = useStore(
    useShallow((state) => ({
      enableGridView: state.enableGridView,
      disableGridView: state.disableGridView,
      gridPermissions: state.gridPermissions,
      gridViewTypes: state.gridViewTypes,
      selectedGridType: state.selectedGridType,
      selectedObject: state.selectedObject,
      setInitialDataLoaded: state.setInitialDataLoaded,
      setSelectedGridType: state.setSelectedGridType,
      pivotMode: state.pivotMode,
    }))
  );

  // local state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const iconForType = useMemo(() => {
    const name = selectedGridType?.name;
    switch (name) {
      case 'treeGrid':
        return <AccountTreeOutlinedIcon sx={{ fontSize: 29 }} />;
      case 'timeSeriesView':
        return <PivotTableChartOutlinedIcon sx={{ fontSize: 29 }} />;
      case 'gridView':
      default:
        return <ViewListOutlinedIcon sx={{ fontSize: 32 }} />;
    }
  }, [selectedGridType?.name]);

  const renderMenuIcon = (name: string) => {
    switch (name) {
      case 'treeGrid':
        return <AccountTreeOutlinedIcon fontSize="small" sx={{ color: 'green' }} />;
      case 'timeSeriesView':
        return <PivotTableChartOutlinedIcon fontSize="small" sx={{ color: 'green' }} />;
      case 'gridView':
      default:
        return <ViewListOutlinedIcon fontSize="small" sx={{ color: 'green' }} />;
    }
  };


  // notifications
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // add action to an individual snackbar
  const action = useCallback(
    (snackbarId: SnackbarKey | undefined) => (
      <>
        <button
          onClick={() => {
            closeSnackbar(snackbarId);
          }}
        >
          Dismiss
        </button>
      </>
    ),
    [closeSnackbar]
  );

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (value: any) => {
    prettyPrint('>>> gridTypeChanged value is', value, 'blue');

    if (value && selectedGridType.name === 'ganttView' && !selectedObject) {
      enqueueSnackbar(
        'Please select a project first!',
        {
          action: action,
          variant: 'info'
        }
      );
      return;
    }

    if (value) {
      setInitialDataLoaded(false);
      // Note: viewOptions, queryOptions, and filterOptions are object-specific, not grid-type-specific, so don't clear them
      setSelectedGridType(value);
      handleClose();
    }
  };

  // toggle grid view type visibility based on permissions and pivot mode
  useEffect(() => {
    const treeGridPref = gridPermissions.enableTreeGrid;

    // TreeGrid is incompatible with pivot views - hide it when pivotMode is active
    if (treeGridPref && !pivotMode) {
      enableGridView('treeGrid')
    } else {
      disableGridView('treeGrid')
    }

    const timeSeriesGridPref = gridPermissions.enableTimeSeriesGrid;

    if (timeSeriesGridPref) {
      enableGridView('timeSeriesView')
    } else {
      disableGridView('timeSeriesView')
    }
  }, [disableGridView, enableGridView, gridPermissions, pivotMode])

  return (
    <Box>
      <Stack
        direction='row'
        alignItems={'center'}
        spacing={1}
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}>
        <Tooltip title="Grid Type">
          <IconButton
            color="success"
            onClick={handleOpen}
            sx={{ color: 'green' }}
            aria-label="Select Grid Type"
          >
            {iconForType}
          </IconButton>
        </Tooltip>
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          {(gridViewTypes || []).map((opt) => (
            <MenuItem key={opt.name} onClick={() => handleSelect(opt)}>
              <ListItemIcon sx={{ color: 'green' }}>
                {renderMenuIcon(opt.name)}
              </ListItemIcon>
              <ListItemText>{opt.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Stack>
    </Box>
  );
};

export default GridTypeSelector;
