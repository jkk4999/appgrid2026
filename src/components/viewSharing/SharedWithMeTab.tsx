/**
 * SharedWithMeTab Component
 *
 * Tab content showing views shared with the current user.
 * Features:
 * - Autocomplete filter by sharing user
 * - AG Grid with columns: View Name, Shared By, Date, Status
 * - Status renders: [Import], "Imported", or [Update Available]
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Autocomplete,
  TextField,
  Button,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import UpdateIcon from '@mui/icons-material/Update';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridReadyEvent, GridApi, ICellRendererParams } from 'ag-grid-community';

// AG Grid theme
import { themeQuartz } from 'ag-grid-community';

// Zustand
import useStore from '../../store';
import { useShallow } from 'zustand/react/shallow';

// Hooks
import { useThemeState } from '../../hooks/selectors';

// Types
import type { SharedViewDTO } from '../../sObjectMetadataTypes';

// API
import { APIClient } from '../../brideDesignPattern/apiInterface';

// Utils
import { prettyPrint } from '../../utilities/prettyPrint';

interface SharedWithMeTabProps {
  apiClient: APIClient;
  sObjectName: string;
  onImportView: (sharedView: SharedViewDTO) => void;
  onUpdateView: (sharedView: SharedViewDTO) => void;
}

// Status cell renderer
const StatusCellRenderer: React.FC<ICellRendererParams<SharedViewDTO>> = (params) => {
  const { data, context } = params;
  if (!data) return null;

  const { onImportView, onUpdateView } = context as {
    onImportView: (view: SharedViewDTO) => void;
    onUpdateView: (view: SharedViewDTO) => void;
  };

  // Not imported yet
  if (!data.importedViewId) {
    return (
      <Button
        size="small"
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => onImportView(data)}
        sx={{ textTransform: 'none' }}
      >
        Import
      </Button>
    );
  }

  // Imported with update available
  if (data.hasUpdate) {
    return (
      <Button
        size="small"
        variant="contained"
        color="warning"
        startIcon={<UpdateIcon />}
        onClick={() => onUpdateView(data)}
        sx={{ textTransform: 'none' }}
      >
        Update Available
      </Button>
    );
  }

  // Imported and up to date
  return (
    <Chip
      label="Imported"
      size="small"
      color="success"
      variant="outlined"
    />
  );
};

const SharedWithMeTab: React.FC<SharedWithMeTabProps> = ({
  apiClient,
  sObjectName,
  onImportView,
  onUpdateView,
}) => {
  const theme = useTheme();
  const gridRef = useRef<AgGridReact>(null);
  const [, setGridApi] = useState<GridApi | null>(null);

  // Theme state from domain hook
  const themeState = useThemeState();
  const { selectedGridColorTheme } = themeState;

  // AG Grid theme with color scheme support
  const agGridTheme = useMemo(() => {
    let gridTheme = themeQuartz;

    if (selectedGridColorTheme.value) {
      gridTheme = gridTheme
        .withPart(selectedGridColorTheme.value)
        .withParams({
          foregroundColor: theme.palette.text.primary,
          textColor: theme.palette.text.primary,
          cellTextColor: theme.palette.text.primary,
        });
    }

    return gridTheme;
  }, [selectedGridColorTheme, theme.palette.text.primary]);

  // Zustand state
  const {
    sharedWithMeViews,
    sharedWithMeLoading,
    sharedByUserFilter,
    setSharedWithMeViews,
    setSharedWithMeLoading,
    setSharedByUserFilter,
  } = useStore(
    useShallow((state) => ({
      sharedWithMeViews: state.sharedWithMeViews,
      sharedWithMeLoading: state.sharedWithMeLoading,
      sharedByUserFilter: state.sharedByUserFilter,
      setSharedWithMeViews: state.setSharedWithMeViews,
      setSharedWithMeLoading: state.setSharedWithMeLoading,
      setSharedByUserFilter: state.setSharedByUserFilter,
    }))
  );

  // Local state
  const [error, setError] = useState<string | null>(null);

  // Get unique sharing users for filter dropdown
  const uniqueSharingUsers = useMemo(() => {
    const usersMap = new Map<string, string>();
    sharedWithMeViews.forEach((view) => {
      if (view.sharedById && view.sharedByName) {
        usersMap.set(view.sharedById, view.sharedByName);
      }
    });
    return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name }));
  }, [sharedWithMeViews]);

  // Filtered views based on user filter
  const filteredViews = useMemo(() => {
    if (!sharedByUserFilter) {
      return sharedWithMeViews;
    }
    return sharedWithMeViews.filter(
      (view) => view.sharedById === sharedByUserFilter
    );
  }, [sharedWithMeViews, sharedByUserFilter]);

  // AG Grid column definitions
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: 'View Name',
        field: 'sourceViewName',
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: 'Shared By',
        field: 'sharedByName',
        width: 150,
      },
      {
        headerName: 'Shared Date',
        field: 'sharedDate',
        width: 140,
        valueFormatter: (params) => {
          if (!params.value) return '';
          const date = new Date(params.value);
          return date.toLocaleDateString();
        },
      },
      {
        headerName: 'Version',
        field: 'version',
        width: 90,
        cellRenderer: (params: ICellRendererParams<SharedViewDTO>) => {
          const data = params.data;
          if (!data) return null;
          if (data.importedVersion !== null && data.importedVersion !== undefined) {
            return `v${data.importedVersion} → v${data.version}`;
          }
          return `v${data.version}`;
        },
      },
      {
        headerName: 'Status',
        field: 'status',
        width: 160,
        cellRenderer: StatusCellRenderer,
        cellRendererParams: {
          onImportView,
          onUpdateView,
        },
      },
    ],
    [onImportView, onUpdateView]
  );

  // Default column definition
  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  // Load shared views
  useEffect(() => {
    const loadSharedViews = async () => {
      try {
        setSharedWithMeLoading(true);
        setError(null);

        const response = await apiClient.getSharedViews({
          sObjectName,
        });

        if (response && Array.isArray(response)) {
          setSharedWithMeViews(response);
        } else {
          setSharedWithMeViews([]);
        }
      } catch (err) {
        prettyPrint('SharedWithMeTab loadSharedViews error', err);
        setError('Failed to load shared views');
      } finally {
        setSharedWithMeLoading(false);
      }
    };
    if (sObjectName) {
      loadSharedViews();
    }
  }, [apiClient, sObjectName, setSharedWithMeLoading, setSharedWithMeViews]);

  // Handle grid ready
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  // Grid context for cell renderers
  const gridContext = useMemo(
    () => ({
      onImportView,
      onUpdateView,
    }),
    [onImportView, onUpdateView]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        gap: 2,
        p: 1,
      }}
    >
      {/* Filter Section */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Autocomplete
          options={uniqueSharingUsers}
          getOptionLabel={(option) => option.name}
          value={uniqueSharingUsers.find((u) => u.id === sharedByUserFilter) || null}
          onChange={(_, newValue) => setSharedByUserFilter(newValue?.id || null)}
          sx={{ minWidth: 250 }}
          size="small"
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Shared By"
              placeholder="All Users"
            />
          )}
        />

        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {filteredViews.length} view{filteredViews.length !== 1 ? 's' : ''} shared
          with you
        </Typography>
      </Box>

      {/* Grid Section */}
      <Box
        sx={{
          flex: 1,
          minHeight: 200,
          width: '100%',
        }}
        className={
          theme.palette.mode === 'dark'
            ? 'ag-theme-quartz-dark'
            : 'ag-theme-quartz'
        }
      >
        {sharedWithMeLoading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <CircularProgress />
          </Box>
        ) : filteredViews.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            flexDirection="column"
            gap={1}
          >
            <Typography variant="body1" color="text.secondary">
              No views have been shared with you yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              When someone shares a view, it will appear here
            </Typography>
          </Box>
        ) : (
          <AgGridReact
            ref={gridRef}
            rowData={filteredViews}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            context={gridContext}
            getRowId={(params) => params.data.id}
            animateRows={true}
            suppressCellFocus={true}
            domLayout="autoHeight"
            theme={agGridTheme}
          />
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default SharedWithMeTab;
