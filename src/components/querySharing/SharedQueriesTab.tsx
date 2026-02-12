/**
 * SharedQueriesTab Component
 *
 * Tab content showing queries shared with the current user.
 * Features:
 * - Autocomplete filter by sharing user
 * - AG Grid with columns: Query Name, Shared By, Date, Status
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
import type { SharedQueryDTO } from '../../sObjectMetadataTypes';

// API
import { APIClient } from '../../brideDesignPattern/apiInterface';

// Utils
import { prettyPrint } from '../../utilities/prettyPrint';

interface SharedQueriesTabProps {
  apiClient: APIClient;
  sObjectName: string;
  onImportQuery: (sharedQuery: SharedQueryDTO) => void;
  onUpdateQuery: (sharedQuery: SharedQueryDTO) => void;
}

// Status cell renderer
const StatusCellRenderer: React.FC<ICellRendererParams<SharedQueryDTO>> = (params) => {
  const { data, context } = params;
  if (!data) return null;

  const { onImportQuery, onUpdateQuery } = context as {
    onImportQuery: (query: SharedQueryDTO) => void;
    onUpdateQuery: (query: SharedQueryDTO) => void;
  };

  // Not imported yet
  if (!data.importedQueryId) {
    return (
      <Button
        size="small"
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => onImportQuery(data)}
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
        onClick={() => onUpdateQuery(data)}
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

const SharedQueriesTab: React.FC<SharedQueriesTabProps> = ({
  apiClient,
  sObjectName,
  onImportQuery,
  onUpdateQuery,
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
    sharedWithMeQueries,
    sharedWithMeQueriesLoading,
    sharedByUserQueryFilter,
    setSharedWithMeQueries,
    setSharedWithMeQueriesLoading,
    setSharedByUserQueryFilter,
  } = useStore(
    useShallow((state) => ({
      sharedWithMeQueries: state.sharedWithMeQueries,
      sharedWithMeQueriesLoading: state.sharedWithMeQueriesLoading,
      sharedByUserQueryFilter: state.sharedByUserQueryFilter,
      setSharedWithMeQueries: state.setSharedWithMeQueries,
      setSharedWithMeQueriesLoading: state.setSharedWithMeQueriesLoading,
      setSharedByUserQueryFilter: state.setSharedByUserQueryFilter,
    }))
  );

  // Local state
  const [error, setError] = useState<string | null>(null);

  // Get unique sharing users for filter dropdown
  const uniqueSharingUsers = useMemo(() => {
    const usersMap = new Map<string, string>();
    sharedWithMeQueries.forEach((query) => {
      if (query.sharedById && query.sharedByName) {
        usersMap.set(query.sharedById, query.sharedByName);
      }
    });
    return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name }));
  }, [sharedWithMeQueries]);

  // Filtered queries based on user filter
  const filteredQueries = useMemo(() => {
    if (!sharedByUserQueryFilter) {
      return sharedWithMeQueries;
    }
    return sharedWithMeQueries.filter(
      (query) => query.sharedById === sharedByUserQueryFilter
    );
  }, [sharedWithMeQueries, sharedByUserQueryFilter]);

  // AG Grid column definitions
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: 'Query Name',
        field: 'sourceQueryName',
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
        cellRenderer: (params: ICellRendererParams<SharedQueryDTO>) => {
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
          onImportQuery,
          onUpdateQuery,
        },
      },
    ],
    [onImportQuery, onUpdateQuery]
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

  // Load shared queries
  useEffect(() => {
    const loadSharedQueries = async () => {
      try {
        setSharedWithMeQueriesLoading(true);
        setError(null);

        const response = await apiClient.getSharedQueries({
          sObjectName,
        });

        if (response && Array.isArray(response)) {
          setSharedWithMeQueries(response);
        } else {
          setSharedWithMeQueries([]);
        }
      } catch (err) {
        prettyPrint('SharedQueriesTab loadSharedQueries error', err);
        setError('Failed to load shared queries');
      } finally {
        setSharedWithMeQueriesLoading(false);
      }
    };
    if (sObjectName) {
      loadSharedQueries();
    }
  }, [apiClient, sObjectName, setSharedWithMeQueries, setSharedWithMeQueriesLoading]);



  // Handle grid ready
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  // Grid context for cell renderers
  const gridContext = useMemo(
    () => ({
      onImportQuery,
      onUpdateQuery,
    }),
    [onImportQuery, onUpdateQuery]
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
          value={uniqueSharingUsers.find((u) => u.id === sharedByUserQueryFilter) || null}
          onChange={(_, newValue) => setSharedByUserQueryFilter(newValue?.id || null)}
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
          {filteredQueries.length} quer{filteredQueries.length !== 1 ? 'ies' : 'y'} shared
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
        {sharedWithMeQueriesLoading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <CircularProgress />
          </Box>
        ) : filteredQueries.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            flexDirection="column"
            gap={1}
          >
            <Typography variant="body1" color="text.secondary">
              No queries have been shared with you yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              When someone shares a query, it will appear here
            </Typography>
          </Box>
        ) : (
          <AgGridReact
            ref={gridRef}
            rowData={filteredQueries}
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

export default SharedQueriesTab;
