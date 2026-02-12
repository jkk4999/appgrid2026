import React, { useCallback } from 'react';

// Zustand - only for customCalculatedColumnPanelProps (shared config)
import useStore from '../../zustandStore';

import { useShallow } from 'zustand/react/shallow';

// Unified context-based hooks
import { useGridCalculatedColumnState, type GridContext } from '../../hooks/selectors';

import { useThemeState } from '../../hooks/selectors/useUIState';

import useGridAssets from '../../hooks/grid/useGridAssets';

import { prettyPrint } from '../../utilities/prettyPrint';


// MUI
import {
  AppBar,
  Box,
  Button,
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography
} from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

// MUI icons
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import { AgCalculatedColumn } from '../../appInterfaces/grid/gridInterfaces';

// styles
const listStyle = {
  margin: 0,
  padding: 0
};

/**
 * Calculated Column Panel component.
 *
 * MIGRATION NOTE: This component demonstrates the new architecture pattern:
 * - Uses useCalculatedColumnState(isSubgrid) instead of extracting many properties from store
 * - Uses useGridAssets for pre-bound setters
 * - Uses useThemeState for accent color (or could use GridContext in future)
 */
const CalculatedColumnPanel = () => {
  const theme = useTheme();


  // Get isSubgrid from custom props (this is a shared config)
  const { isSubgrid } = useStore(
    useShallow((state) => state.customCalculatedColumnPanelProps!)
  );

  // Convert isSubgrid to GridContext for unified hooks
  const context: GridContext = isSubgrid ? 'subgrid' : 'main';

  // Use unified context-based hooks
  const {
    calculatedColumns,
    setSelectedCalculatedColumn,
    setShowCalculatedColumnPanel,
    setShowCalculatedColumnDialog
  } = useGridCalculatedColumnState(context);

  // Get accent color from theme state
  const { selectedAccentColor } = useThemeState();

  // Bound setter using useGridAssets (ensures correct isSubgrid binding)
  const assets = useGridAssets({ isSubgrid });

  const handleColumnSelectAll = useCallback(() => {
    const updatedColumns = calculatedColumns.map((col: AgCalculatedColumn) => ({
      ...col,
      active: true
    }));

    prettyPrint('[CalculatedColumnPanel] selectAll', updatedColumns, 'blue');

    assets.setCalculatedColumns(updatedColumns);
  }, [calculatedColumns, assets]);

  const handleColumnClearAll = useCallback(() => {
    const updatedColumns = calculatedColumns.map((col: AgCalculatedColumn) => ({
      ...col,
      active: false
    }));

    prettyPrint('[CalculatedColumnPanel] clearAll', updatedColumns, 'blue');

    assets.setCalculatedColumns(updatedColumns);
  }, [calculatedColumns, assets]);

  const updatePreference = useCallback(
    (pref: AgCalculatedColumn) => {
      const updatedColumns = calculatedColumns.map((col: AgCalculatedColumn) =>
        col.name === pref.name ? { ...col, active: !col.active } : col
      );

      prettyPrint('[CalculatedColumnPanel] toggle', pref.name, 'blue');

      assets.setCalculatedColumns(updatedColumns);
    },
    [calculatedColumns, assets]
  );

  const onColumnDelete = useCallback(
    (item: AgCalculatedColumn) => {
      const updatedColumns = calculatedColumns.filter(
        (col: AgCalculatedColumn) => col.name !== item.name
      );

      prettyPrint('[CalculatedColumnPanel] delete', item.name, 'blue');

      assets.setCalculatedColumns(updatedColumns);
    },
    [calculatedColumns, assets]
  );

  const onColumnEdit = useCallback(
    (item: AgCalculatedColumn) => {
      prettyPrint('[CalculatedColumnPanel] edit', item.name, 'blue');

      setSelectedCalculatedColumn(item);

      setShowCalculatedColumnDialog(true);
    },
    [setSelectedCalculatedColumn, setShowCalculatedColumnDialog]
  );

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
        color: theme.palette.text.primary
      }}
    >
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary
        }}
      >
        <Toolbar variant="dense">
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ ml: -1 }}
            onClick={() => setShowCalculatedColumnPanel(false)}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography
            variant="button"
            color="inherit"
            component="div">
            Calculated Columns
          </Typography>
        </Toolbar>
      </AppBar>

      <Stack
        direction="row"
        spacing={2}
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          mt: 2,
          mx: 2
        }}
      >
        <Button
          variant="contained"
          size="small"
          onClick={() => setShowCalculatedColumnDialog(true)}
        >
          Add
        </Button>
        <Button variant="contained" size="small" onClick={handleColumnSelectAll}>
          Select All
        </Button>
        <Button variant="contained" size="small" onClick={handleColumnClearAll}>
          Clear All
        </Button>
      </Stack>

      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          marginTop: 2,
          flexGrow: 1,
          overflow: 'auto'
        }}
      >
        <List
          style={listStyle}
          sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            width: '100%'
          }}
        >
          {calculatedColumns.map((item: AgCalculatedColumn) => (
            <ListItem key={item.name} disablePadding sx={{ borderBottom: 'none' }}>
              <ListItemButton
                role={undefined}
                onClick={() => updatePreference(item)}
                dense
                sx={{ borderBottom: 'none' }}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={item.active}
                    tabIndex={-1}
                    disableRipple
                    sx={{
                      color: theme.palette.text.primary,
                      '&.Mui-checked': {
                        color: selectedAccentColor
                      }
                    }}
                  />
                </ListItemIcon>
                <ListItemText primary={item.name} />
              </ListItemButton>
              {/* edit button */}
              <IconButton
                edge="end"
                onClick={() => onColumnEdit(item)}
                sx={{
                  color: theme.palette.text.primary
                }}
              >
                <EditOutlinedIcon />
              </IconButton>
              {/* delete button */}
              <IconButton
                edge="end"
                onClick={() => onColumnDelete(item)}
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
    </Box>
  );
};

export { CalculatedColumnPanel };
