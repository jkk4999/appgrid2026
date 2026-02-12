/**
 * ShareQueryDialog Component
 *
 * Dialog for sharing a query with other users.
 * Features:
 * - User search autocomplete with profile filter
 * - AG Grid showing users with checkbox selection
 * - "Share with all users" checkbox option
 * - Pre-checked for currently shared users
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// MUI
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Autocomplete,
  TextField,
  FormControlLabel,
  Checkbox,
  IconButton,
} from '@mui/material';

import { useTheme } from '@mui/material/styles';

// MUI icons
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';

import type { ColDef, GridReadyEvent, GridApi, SelectionChangedEvent, RowSelectionOptions } from 'ag-grid-community';

// Ag-Community
import {
  ModuleRegistry,
  AllCommunityModule,
} from 'ag-grid-community';

// Ag-Grid Enterprise
import {
  AllEnterpriseModule,
} from 'ag-grid-enterprise';

// Ag-Grid themes
import {
  themeQuartz
} from 'ag-grid-community';

import { AgGridReact } from 'ag-grid-react';

// Ag-Grid global module registration
ModuleRegistry.registerModules([
  AllCommunityModule,
  AllEnterpriseModule,
]);

// Zustand
import useStore from '../../store';
import { useShallow } from 'zustand/react/shallow';

// Types
import type { ShareableUser } from '../../store/slices/querySharingSlice';

import type { UserProfile, SharedQueryDTO } from '../../sObjectMetadataTypes';

// API
import { APIClient } from '../../brideDesignPattern/apiInterface';

// Utils
import { prettyPrint } from '../../utilities/prettyPrint';
import { useThemeState } from '../../hooks/selectors';

import { createDefaultColDef, createDefaultRowSelection } from '../../grid/config/gridConfig';

interface ShareQueryDialogProps {
  apiClient: APIClient;
}

const baseThemes = [
  { id: "themeQuartz", value: themeQuartz },
];

const ShareQueryDialog: React.FC<ShareQueryDialogProps> = ({ apiClient }) => {
  /*==========================================
    ** CONTEXT
    ==========================================*/
  const theme = useTheme();

  /*==========================================
   ** CUSTOM HOOKS
   ==========================================*/


  // Theme state from domain hook
  const themeState = useThemeState();
  const {
    selectedGridColorTheme,
    selectedAccentColor,
  } = themeState;

  const [baseTheme] = useState(baseThemes[0]);

  const agGridTheme = useMemo(() => {
    let theme2 = baseTheme.value;

    if (selectedGridColorTheme.value) {
      theme2 = theme2
        .withPart(selectedGridColorTheme.value)
        .withParams({
          foregroundColor: theme.palette.text.primary,
          // Ensure text color is applied to all data cells including row groups
          textColor: theme.palette.text.primary,
          // These parameters inherit from foregroundColor but explicitly set them for row groups
          cellTextColor: theme.palette.text.primary,
        });
    }

    // prettyPrint('[AppGrid] - selectedTheme is', selectedGridColorTheme, 'red')

    // Toggle Syncfusion Material 3 dark mode via e-dark-mode class on body
    // Material 3 theme supports CSS variable-based dark mode switching
    const body = document.body;
    if (selectedGridColorTheme.id === 'colorSchemeDark') {
      body.classList.add('e-dark-mode');
    } else {
      body.classList.remove('e-dark-mode');
    }
    return theme2;
  }, [baseTheme.value, selectedGridColorTheme, theme.palette.text.primary]);

  const gridRef = useRef<AgGridReact>(null);
  const [, setGridApi] = useState<GridApi | null>(null);

  // Zustand state
  const {
    showShareQueryDialog,
    shareQueryDialogQueryId,
    shareQueryDialogQueryName,
    shareQueryDialogUsers,
    shareQueryDialogUsersLoading,
    shareQueryDialogProfileFilter,
    closeShareQueryDialog,
    setShareQueryDialogUsers,
    setShareQueryDialogUsersLoading,
    setShareQueryDialogProfileFilter,
  } = useStore(
    useShallow((state) => ({
      showShareQueryDialog: state.showShareQueryDialog,
      shareQueryDialogQueryId: state.shareQueryDialogQueryId,
      shareQueryDialogQueryName: state.shareQueryDialogQueryName,
      shareQueryDialogUsers: state.shareQueryDialogUsers,
      shareQueryDialogUsersLoading: state.shareQueryDialogUsersLoading,
      shareQueryDialogProfileFilter: state.shareQueryDialogProfileFilter,
      closeShareQueryDialog: state.closeShareQueryDialog,
      setShareQueryDialogUsers: state.setShareQueryDialogUsers,
      setShareQueryDialogUsersLoading: state.setShareQueryDialogUsersLoading,
      setShareQueryDialogProfileFilter: state.setShareQueryDialogProfileFilter,
    }))
  );

  // Local state
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [shareWithAll, setShareWithAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [allUsers, setAllUsers] = useState<ShareableUser[]>([]);

  // AG Grid column definitions
  const columnDefs = useMemo<ColDef[]>(
    () => [
      // {
      //   headerName: '',
      //   field: 'isSelected',
      //   width: 50,
      //   suppressSizeToFit: true,
      // },
      {
        headerName: 'Name',
        field: 'name',
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: 'Profile',
        field: 'profileName',
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: 'Status',
        field: 'isCurrentlyShared',
        width: 120,
        cellRenderer: (params: { value: boolean }) =>
          params.value ? (
            <Typography variant="caption" color="success.main">
              Already Shared
            </Typography>
          ) : null,
      },
    ],
    []
  );

  const rowSelection = useMemo<
    RowSelectionOptions | 'single' | 'multiple'
  >(() => createDefaultRowSelection(), []);

  // Default column definition
  const defaultColDef = useMemo(() => createDefaultColDef({
    cellStyle: { color: theme.palette.text.primary },
    sortable: true,
    filter: true,
    resizable: true,
  }), [theme.palette.text.primary]);

  // Load profiles on dialog open
  useEffect(() => {
    // Load available profiles
    const loadProfiles = async () => {
      try {
        setProfilesLoading(true);
        const response = await apiClient.getAllProfiles();
        if (response && Array.isArray(response)) {
          setProfiles(response);
        }
      } catch (err) {
        prettyPrint('ShareQueryDialog loadProfiles error', err);
      } finally {
        setProfilesLoading(false);
      }
    };

    // Load users and current share recipients
    const loadUsers = async () => {
      if (!shareQueryDialogQueryId) return;

      try {
        setShareQueryDialogUsersLoading(true);

        // Load all active users
        const usersResponse = await apiClient.getActiveUsers({});
        const users: ShareableUser[] = (usersResponse || []).map((user: { Id: string; Name: string; ProfileId: string; Profile?: { Name: string } }) => ({
          id: user.Id,
          name: user.Name,
          profileId: user.ProfileId,
          profileName: user.Profile?.Name || '',
          isSelected: false,
          isCurrentlyShared: false,
        }));

        // Load current share recipients
        const recipientsResponse = await apiClient.getQueryShareRecipients({
          queryId: shareQueryDialogQueryId,
        });

        if (recipientsResponse && Array.isArray(recipientsResponse)) {
          const sharedUserIds = new Set(
            recipientsResponse.map((r: SharedQueryDTO) => r.sharedWithId).filter(Boolean)
          );

          // Check if shared with all
          const hasAllUsersShare = recipientsResponse.some(
            (r: SharedQueryDTO) => r.shareType === 'All Users'
          );
          setShareWithAll(hasAllUsersShare);

          // Mark currently shared users
          users.forEach((user) => {
            if (sharedUserIds.has(user.id)) {
              user.isCurrentlyShared = true;
              user.isSelected = true;
            }
          });
        }

        setAllUsers(users);
        setShareQueryDialogUsers(users);
      } catch (err) {
        prettyPrint('ShareQueryDialog loadUsers error', err);
        setError('Failed to load users');
      } finally {
        setShareQueryDialogUsersLoading(false);
      }
    };

    if (showShareQueryDialog) {
      loadProfiles();
      loadUsers();
      setShareWithAll(false);
      setError(null);
      setSuccess(false);
    }
  }, [apiClient, setShareQueryDialogUsers, setShareQueryDialogUsersLoading, shareQueryDialogQueryId, showShareQueryDialog]);

  // Filter users when profile filter changes
  useEffect(() => {
    if (shareQueryDialogProfileFilter) {
      const filtered = allUsers.filter(
        (user) => user.profileId === shareQueryDialogProfileFilter
      );
      setShareQueryDialogUsers(filtered);
    } else {
      setShareQueryDialogUsers(allUsers);
    }
  }, [shareQueryDialogProfileFilter, allUsers, setShareQueryDialogUsers]);

  // Handle grid ready
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    // Pre-select currently shared users
    params.api.forEachNode((node) => {
      if (node.data?.isCurrentlyShared) {
        node.setSelected(true);
      }
    });
  }, []);

  // Handle selection change
  const onSelectionChanged = useCallback(
    (event: SelectionChangedEvent) => {
      const selectedNodes = event.api.getSelectedNodes();
      const selectedIds = new Set(selectedNodes.map((node) => node.data?.id));

      const updatedUsers = shareQueryDialogUsers.map((user) => ({
        ...user,
        isSelected: selectedIds.has(user.id),
      }));

      // Update allUsers as well to persist selection across filters
      const updatedAllUsers = allUsers.map((user) => ({
        ...user,
        isSelected: selectedIds.has(user.id) || (shareQueryDialogProfileFilter && !updatedUsers.find(u => u.id === user.id) ? user.isSelected : selectedIds.has(user.id)),
      }));

      setAllUsers(updatedAllUsers);
    },
    [shareQueryDialogUsers, allUsers, shareQueryDialogProfileFilter]
  );

  // Handle share
  const handleShare = async () => {
    if (!shareQueryDialogQueryId) return;

    try {
      setSaving(true);
      setError(null);

      // Get selected user IDs
      const selectedUserIds = allUsers
        .filter((user) => user.isSelected && !user.isCurrentlyShared)
        .map((user) => user.id);

      // Get deselected user IDs (users who were shared but now unselected)
      const unsharedUserIds = allUsers
        .filter((user) => !user.isSelected && user.isCurrentlyShared)
        .map((user) => user.id);

      // Share with new users
      if (selectedUserIds.length > 0 || shareWithAll) {
        await apiClient.shareQuery({
          queryId: shareQueryDialogQueryId,
          userIds: selectedUserIds,
          shareWithAll,
        });
      }

      // Unshare from deselected users
      if (unsharedUserIds.length > 0) {
        await apiClient.unshareQuery({
          queryId: shareQueryDialogQueryId,
          userIds: unsharedUserIds,
        });
      }

      setSuccess(true);

      // Close dialog after brief delay
      setTimeout(() => {
        closeShareQueryDialog();
      }, 1500);
    } catch (err) {
      prettyPrint('ShareQueryDialog handleShare error', err);
      setError('Failed to share query. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!saving) {
      closeShareQueryDialog();
    }
  };

  // Get selected count
  const selectedCount = useMemo(() => {
    return allUsers.filter((user) => user.isSelected).length;
  }, [allUsers]);

  return (
    <Dialog
      open={showShareQueryDialog}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: theme.palette.background.paper,
          border: 1,
          borderColor: 'divider',
          color: theme.palette.text.primary,
          height: '80vh',
          maxHeight: 700,
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: selectedAccentColor,
          color: theme.palette.text.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <ShareIcon />
          <Typography variant="h6">Share Query: {shareQueryDialogQueryName}</Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={saving}
          size="small"
          sx={{ color: theme.palette.text.primary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          display: 'flex',
          flexDirection: 'column',
          mt: 2,
          gap: 2,
          pt: 2,
        }}
      >
        {/* Profile Filter */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Autocomplete
            options={profiles}
            getOptionLabel={(option) => option.name}
            value={profiles.find((p) => p.id === shareQueryDialogProfileFilter) || null}
            onChange={(_, newValue) =>
              setShareQueryDialogProfileFilter(newValue?.id || null)
            }
            loading={profilesLoading}
            disabled={saving || success}
            sx={{ flex: 1 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filter by Profile"
                placeholder="All Profiles"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {profilesLoading ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={shareWithAll}
                onChange={(e) => setShareWithAll(e.target.checked)}
                disabled={saving || success}
              />
            }
            label="Share with all users"
          />
        </Box>

        {/* Selection Summary */}
        <Typography variant="body2" color="text.secondary">
          {shareWithAll
            ? 'This query will be shared with all users in the organization'
            : `${selectedCount} user${selectedCount !== 1 ? 's' : ''} selected`}
        </Typography>

        {/* Users Grid */}
        <Box
          sx={{
            flex: 1,
            minHeight: 300,
          }}
          className={
            theme.palette.mode === 'dark'
              ? 'ag-theme-quartz-dark'
              : 'ag-theme-quartz'
          }
        >
          {shareQueryDialogUsersLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <CircularProgress />
            </Box>
          ) : (
            <AgGridReact
              ref={gridRef}
              rowData={shareQueryDialogUsers}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowSelection={rowSelection}
              onGridReady={onGridReady}
              onSelectionChanged={onSelectionChanged}
              getRowId={(params) => params.data.id}
              animateRows={true}
              suppressCellFocus={true}
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

        {/* Success Display */}
        {success && (
          <Alert severity="success">Query shared successfully!</Alert>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          backgroundColor: theme.palette.background.paper,
          padding: '16px 24px',
        }}
      >
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleShare}
          variant="contained"
          disabled={
            saving ||
            success ||
            (!shareWithAll && selectedCount === 0)
          }
          startIcon={saving ? <CircularProgress size={20} /> : <ShareIcon />}
        >
          {saving ? 'Sharing...' : 'Share Query'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareQueryDialog;
