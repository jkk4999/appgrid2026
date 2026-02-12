/**
 * ImportQueryDialog Component
 *
 * Dialog for importing a shared query.
 * Features:
 * - Query name text field (editable)
 * - Radio selection: "Keep in sync" vs "Snapshot"
 * - Import/Cancel buttons
 * - Shows preview of query settings
 */

import React, { useState, useEffect } from 'react';
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
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Divider,
  IconButton,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import SyncIcon from '@mui/icons-material/Sync';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

// Zustand
import useStore from '../../store';
import { useShallow } from 'zustand/react/shallow';

// Types
import type { SObjectQuery } from '../../sObjectMetadataTypes';

// API
import { APIClient } from '../../brideDesignPattern/apiInterface';

// Utils
import { prettyPrint } from '../../utilities/prettyPrint';
import { useThemeState } from '../../hooks/selectors';

interface ImportQueryDialogProps {
  apiClient: APIClient;
  onImportSuccess: (importedQuery: SObjectQuery) => void;
  onRefreshSharedQueries?: () => Promise<void>;
}

const ImportQueryDialog: React.FC<ImportQueryDialogProps> = ({
  apiClient,
  onImportSuccess,
  onRefreshSharedQueries,
}) => {
  const theme = useTheme();

  // Theme state from domain hook
  const { selectedAccentColor } = useThemeState();

  // Zustand state
  const {
    showImportQueryDialog,
    importDialogSharedQuery,
    closeImportQueryDialog,
  } = useStore(
    useShallow((state) => ({
      showImportQueryDialog: state.showImportQueryDialog,
      importDialogSharedQuery: state.importDialogSharedQuery,
      closeImportQueryDialog: state.closeImportQueryDialog,
    }))
  );

  // Local state
  const [queryName, setQueryName] = useState('');
  const [syncMode, setSyncMode] = useState<'Sync' | 'Snapshot'>('Sync');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form when dialog opens
  useEffect(() => {
    if (showImportQueryDialog && importDialogSharedQuery) {
      // Default name is the source query name
      setQueryName(importDialogSharedQuery.sourceQueryName || 'Imported Query');
      setSyncMode('Sync');
      setError(null);
      setSuccess(false);
    }
  }, [showImportQueryDialog, importDialogSharedQuery]);

  // Handle import
  const handleImport = async () => {
    if (!importDialogSharedQuery || !queryName.trim()) return;

    try {
      setImporting(true);
      setError(null);

      const response = await apiClient.importSharedQuery({
        sharedQueryId: importDialogSharedQuery.id,
        queryName: queryName.trim(),
        syncMode,
      });

      if (response?.status === 'success' && response.query) {
        setSuccess(true);

        prettyPrint('ImportQueryDialog - import response', response, 'green');

        const importedQuery = response.query;

        // Notify parent of successful import
        onImportSuccess(importedQuery);

        // Refresh shared queries list to update status
        if (onRefreshSharedQueries) {
          prettyPrint('ImportQueryDialog - refreshing shared queries', null, 'blue');
          await onRefreshSharedQueries();
        }

        // Close dialog after brief delay
        setTimeout(() => {
          closeImportQueryDialog();
        }, 1500);
      } else {
        const message = response?.errorMessage || 'Failed to import query. Please try again.';
        setError(message);
      }
    } catch (err) {
      prettyPrint('ImportQueryDialog handleImport error', err);
      setError('Failed to import query. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!importing) {
      closeImportQueryDialog();
    }
  };

  // Count included settings
  const getIncludedSettings = () => {
    if (!importDialogSharedQuery) return [];
    const settings: string[] = [];

    if (importDialogSharedQuery.queryRule) settings.push('Main Rule');
    if (importDialogSharedQuery.relationQueryRule) settings.push('Related Rule');
    if (importDialogSharedQuery.relationSObjectApiName) settings.push('Related Object');
    if (importDialogSharedQuery.isQueryActive) settings.push('Active');
    if (importDialogSharedQuery.isDefault) settings.push('Default');
    if (importDialogSharedQuery.isPublic) settings.push('Public');

    return settings;
  };

  const includedSettings = getIncludedSettings();

  return (
    <Dialog
      open={showImportQueryDialog}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: theme.palette.background.paper,
          borderColor: 'silver',
          borderWidth: 1,
          color: theme.palette.text.primary,
          height: '70vh',
          maxWidth: 960,
          width: '60vw',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'transparent',
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
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <DownloadIcon />
          <Typography variant="h6">Import Shared Query</Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={importing}
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
          gap: 3,
          pt: 3,
        }}
      >
        {/* Source Query Info */}
        {importDialogSharedQuery && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: theme.palette.action.hover,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Source Query
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {importDialogSharedQuery.sourceQueryName}
            </Typography>
            {importDialogSharedQuery.sObjectApiName && (
              <Typography variant="caption" color="text.secondary" display="block">
                Object: {importDialogSharedQuery.sObjectApiName}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Shared by {importDialogSharedQuery.sharedByName} • Version{' '}
              {importDialogSharedQuery.version}
            </Typography>

            {includedSettings.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Includes:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {includedSettings.map((setting) => (
                    <Chip
                      key={setting}
                      label={setting}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        )}

        {/* Query Name */}
        <TextField
          label="Query Name"
          value={queryName}
          onChange={(e) => setQueryName(e.target.value)}
          fullWidth
          required
          disabled={importing || success}
          helperText="Enter a name for your imported query"
        />

        <Divider />

        {/* Sync Mode Selection */}
        <FormControl component="fieldset" disabled={importing || success}>
          <FormLabel component="legend">
            <Typography variant="subtitle2">Sync Mode</Typography>
          </FormLabel>
          <RadioGroup
            value={syncMode}
            onChange={(e) => setSyncMode(e.target.value as 'Sync' | 'Snapshot')}
          >
            <FormControlLabel
              value="Sync"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SyncIcon fontSize="small" color="primary" />
                  <Box>
                    <Typography variant="body2">Keep in Sync</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive notifications when the source query is updated.
                      You can pull updates to keep your query current.
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ alignItems: 'flex-start', mb: 1 }}
            />
            <FormControlLabel
              value="Snapshot"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhotoCameraIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="body2">Snapshot</Typography>
                    <Typography variant="caption" color="text.secondary">
                      One-time copy. Future changes to the source query will not
                      affect your imported query.
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ alignItems: 'flex-start' }}
            />
          </RadioGroup>
        </FormControl>

        {/* Error Display */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Success Display */}
        {success && (
          <Alert severity="success">
            Query imported successfully! The query has been selected.
          </Alert>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          backgroundColor: theme.palette.background.paper,
          padding: '16px 24px',
        }}
      >
        <Button onClick={handleClose} disabled={importing}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={importing || success || !queryName.trim()}
          startIcon={
            importing ? <CircularProgress size={20} /> : <DownloadIcon />
          }
        >
          {importing ? 'Importing...' : 'Import Query'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportQueryDialog;
