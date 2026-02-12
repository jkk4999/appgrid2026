import React from 'react';

import { Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';

import { useTheme } from '@mui/material/styles';

import CloseIcon from '@mui/icons-material/Close';

// Native AG Grid Columns Tool Panel will be hosted in this dialog
interface SubgridColumnManagerDialogProps {
  open: boolean;
  onClose: () => void;
  // AG Grid API reference for the subgrid
  api: any | null;
  getGridApi?: () => any | null;
  setPivotMode: (checked: boolean) => void;
  handleGridStateChange: () => void;
  getColumnDefs?: () => any[];
  columnsVersion?: number;
  onExitedFocus?: () => void;
}

const SubgridColumnManagerDialog: React.FC<SubgridColumnManagerDialogProps> = ({
  open,
  onClose,
  api,
  getGridApi,
  onExitedFocus,
}) => {
  const theme = useTheme();

  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const panelAttachedRef = React.useRef<boolean>(false);

  // Attach native Columns Tool Panel GUI into the dialog
  React.useEffect(() => {
    if (!open) return;

    const apiInstance = (typeof getGridApi === 'function' ? getGridApi() : api) as any;

    if (!apiInstance) return;

    const mountPanel = () => {
      let inst = apiInstance.getToolPanelInstance?.('columns');

      // Some versions only create the instance when opened once
      if (!inst) {
        apiInstance.openToolPanel?.('columns');

        inst = apiInstance.getToolPanelInstance?.('columns');
      }
      const gui: HTMLElement | null = inst?.getGui?.() || null;

      if (gui && containerRef.current && !panelAttachedRef.current) {
        containerRef.current.innerHTML = '';

        containerRef.current.appendChild(gui);
        // Ensure drag ghost and menus are scoped to dialog
        const paper = containerRef.current.closest('[role="dialog"]') as HTMLElement | null;

        if (paper) apiInstance.setGridOption?.('popupParent', paper);
        panelAttachedRef.current = true;
        // Close the sideBar if it flashed open
        setTimeout(() => apiInstance.closeToolPanel?.(), 0);
      }
    };

    // Mount after paint to avoid flicker
    const t = setTimeout(mountPanel, 0);
    return () => clearTimeout(t);
  }, [open, api, getGridApi]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableRestoreFocus
      fullWidth
      maxWidth="sm"
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'transparent',
        },
      }}
      slotProps={{
        transition: {
          onExited: () => onExitedFocus?.()
        },
        paper: {
          sx: {
            height: '65vh',
            width: '25vw',
            maxWidth: 900,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }
        }
      }}
    >
      <DialogTitle
        sx={{
          pr: 5,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        Subgrid Column Manager
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Box ref={containerRef} sx={{
          height: '100%',
          display: 'flex',
          overflow: 'auto',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }} />
      </DialogContent>
    </Dialog>
  );
};

export default SubgridColumnManagerDialog;
