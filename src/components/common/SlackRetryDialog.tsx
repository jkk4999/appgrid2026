/**
 * SlackRetryDialog Component
 * Displays retry status when Slack API calls are being retried due to rate limits
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { prettyPrint } from '../../utilities/prettyPrint';

export interface SlackRetryDialogProps {
  open: boolean;
  currentAttempt: number;
  maxAttempts: number;
  delayMs: number;
  errorMessage?: string;
  onCancel: () => void;
  onOk?: () => void;
}

export const SlackRetryDialog: React.FC<SlackRetryDialogProps> = ({
  open,
  currentAttempt,
  maxAttempts,
  delayMs,
  errorMessage,
  onCancel,
  onOk
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(Math.ceil(delayMs / 1000));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setRemainingSeconds(Math.ceil(delayMs / 1000));
      setProgress(0);
      return;
    }

    prettyPrint(
      `[SlackRetryDialog] Showing retry dialog - Attempt ${currentAttempt}/${maxAttempts}`,
      { delayMs, errorMessage },
      'yellow'
    );

    const totalSeconds = Math.ceil(delayMs / 1000);
    setRemainingSeconds(totalSeconds);
    setProgress(0);

    const startTime = Date.now();
    const endTime = startTime + delayMs;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

      setRemainingSeconds(remaining);
      setProgress((elapsed / delayMs) * 100);

      if (now >= endTime) {
        clearInterval(interval);
      }
    }, 100); // Update every 100ms for smooth progress

    return () => clearInterval(interval);
  }, [open, delayMs, currentAttempt, maxAttempts, errorMessage]);

  const handleCancel = () => {
    prettyPrint('[SlackRetryDialog] User cancelled retry', null, 'yellow');
    onCancel();
  };

  const handleOk = () => {
    prettyPrint('[SlackRetryDialog] User clicked OK (waiting for retry)', null, 'blue');
    if (onOk) {
      onOk();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={false}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={24} />
          <Typography variant="h6">Slack API Rate Limit</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            We are awaiting the Slack API to become available due to rate limits.
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Retry attempt <strong>{currentAttempt}</strong> of <strong>{maxAttempts}</strong>
          </Typography>

          {errorMessage && (
            <Typography
              variant="body2"
              color="error"
              sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
            >
              {errorMessage}
            </Typography>
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Retrying in {remainingSeconds} second{remainingSeconds !== 1 ? 's' : ''}...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          You can wait for the retry to complete automatically, or cancel this operation.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel} color="secondary" variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleOk} color="primary" variant="contained" autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};
