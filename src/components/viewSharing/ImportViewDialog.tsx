/**
 * ImportViewDialog Component
 *
 * Dialog for importing a shared view.
 * Features:
 * - View name text field (editable)
 * - Radio selection: "Keep in sync" vs "Snapshot"
 * - Import/Cancel buttons
 * - Shows preview of view settings
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
import type { SObjectView } from '../../sObjectMetadataTypes';

// API
import { APIClient } from '../../brideDesignPattern/apiInterface';

// Utils
import { prettyPrint } from '../../utilities/prettyPrint';
import { useThemeState } from '../../hooks/selectors';

interface ImportViewDialogProps {
  apiClient: APIClient;
  onImportSuccess: (importedView: SObjectView) => void;
  onRefreshSharedViews?: () => Promise<void>;
}

const ImportViewDialog: React.FC<ImportViewDialogProps> = ({
  apiClient,
  onImportSuccess,
  onRefreshSharedViews,
}) => {
  const theme = useTheme();

  // Theme state from domain hook
  const { selectedAccentColor } = useThemeState();

  // Zustand state
  const {
    showImportViewDialog,
    importDialogSharedView,
    closeImportViewDialog,
  } = useStore(
    useShallow((state) => ({
      showImportViewDialog: state.showImportViewDialog,
      importDialogSharedView: state.importDialogSharedView,
      closeImportViewDialog: state.closeImportViewDialog,
    }))
  );

  // Local state
  const [viewName, setViewName] = useState('');
  const [syncMode, setSyncMode] = useState<'Sync' | 'Snapshot'>('Sync');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form when dialog opens
  useEffect(() => {
    if (showImportViewDialog && importDialogSharedView) {
      // Default name is the source view name
      setViewName(importDialogSharedView.sourceViewName || 'Imported View');
      setSyncMode('Sync');
      setError(null);
      setSuccess(false);
    }
  }, [showImportViewDialog, importDialogSharedView]);

  // Handle import
  const handleImport = async () => {
    if (!importDialogSharedView || !viewName.trim()) return;

    try {
      setImporting(true);
      setError(null);

      const response = await apiClient.importSharedView({
        sharedViewId: importDialogSharedView.id,
        viewName: viewName.trim(),
        syncMode,
      });

      if (response?.status === 'success' && response.view) {
        setSuccess(true);

        prettyPrint('ImportViewDialog - import response', response, 'green');

        const importedView = response.view;

        // Notify parent of successful import
        onImportSuccess(importedView);

        // Refresh shared views list to update status
        if (onRefreshSharedViews) {
          prettyPrint('ImportViewDialog - refreshing shared views', null, 'blue');
          await onRefreshSharedViews();
        }

        // Close dialog after brief delay
        setTimeout(() => {
          closeImportViewDialog();
        }, 1500);
      } else {
        const message = response?.errorMessage || 'Failed to import view. Please try again.';
        setError(message);
      }
    } catch (err) {
      prettyPrint('ImportViewDialog handleImport error', err);
      setError('Failed to import view. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!importing) {
      closeImportViewDialog();
    }
  };

  // Count included settings
  const getIncludedSettings = () => {
    if (!importDialogSharedView) return [];
    const settings: string[] = [];

    if (importDialogSharedView.columnState) settings.push('Column Layout');
    if (importDialogSharedView.gridState) settings.push('Grid Settings');
    if (importDialogSharedView.calculatedColumns) settings.push('Calculated Columns');
    if (importDialogSharedView.columnStyles) settings.push('Column Styles');
    if (importDialogSharedView.rowStyles) settings.push('Row Styles');
    if (importDialogSharedView.filterOptions) settings.push('Filters');
    if (importDialogSharedView.pivotMode) settings.push('Pivot Mode');

    return settings;
  };

  const includedSettings = getIncludedSettings();

  return (
    <Dialog
      open={showImportViewDialog}
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
          <Typography variant="h6">Import Shared View</Typography>
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
        {/* Source View Info */}
        {importDialogSharedView && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: theme.palette.action.hover,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Source View
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {importDialogSharedView.sourceViewName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Shared by {importDialogSharedView.sharedByName} • Version{' '}
              {importDialogSharedView.version}
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

        {/* View Name */}
        <TextField
          label="View Name"
          value={viewName}
          onChange={(e) => setViewName(e.target.value)}
          fullWidth
          required
          disabled={importing || success}
          helperText="Enter a name for your imported view"
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
                      Receive notifications when the source view is updated.
                      You can pull updates to keep your view current.
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
                      One-time copy. Future changes to the source view will not
                      affect your imported view.
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
            View imported successfully! The view has been selected.
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
          disabled={importing || success || !viewName.trim()}
          startIcon={
            importing ? <CircularProgress size={20} /> : <DownloadIcon />
          }
        >
          {importing ? 'Importing...' : 'Import View'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportViewDialog;
