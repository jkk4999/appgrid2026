import React from 'react';

import { Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

import CloseIcon from '@mui/icons-material/Close';

interface AppColumnsDialogProps {
  open: boolean;
  onClose: () => void;
  api: any | null;
  getGridApi?: () => any | null;
  onExitedFocus?: () => void;
  themeStyle?: React.CSSProperties;
}

const AppColumnsDialog: React.FC<AppColumnsDialogProps> = ({ open, onClose, api, getGridApi, onExitedFocus, themeStyle }) => {
  // theme
  const theme = useTheme();

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mountedRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) return;
    const gridApi = (typeof getGridApi === 'function' ? getGridApi() : api) as any;
    if (!gridApi) return;

    const attach = () => {

      let inst = gridApi.getToolPanelInstance?.('columns');
      if (!inst) {
        gridApi.openToolPanel?.('columns');
        inst = gridApi.getToolPanelInstance?.('columns');
      }
      const gui: HTMLElement | null = inst?.getGui?.() || null;
      if (gui && containerRef.current && !mountedRef.current) {
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(gui);
        // scope popups to dialog paper

        const paper = containerRef.current.closest('[role="dialog"]') as HTMLElement | null;
        if (paper) gridApi.setGridOption?.('popupParent', paper);

        mountedRef.current = true;
        setTimeout(() => gridApi.closeToolPanel?.(), 0);
      }
    };

    const t = setTimeout(attach, 0);
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
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
      slotProps={{
        paper: {
          sx: { height: '65vh', width: '40vw', maxWidth: 980 }
        },
        transition: {
          onExited: () => {
            onExitedFocus?.()
          }
        }
      }}
    >
      <DialogTitle
        sx={{ pr: 5 }}>
        Column Manager
        <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Apply AG Grid theme class and variables so the tool panel renders with full styling + drag handles */}
        <Box
          ref={containerRef}
          className="ag-theme-quartz"
          sx={{
            height: '100%',
            display: 'flex',
            overflow: 'auto',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}
          style={themeStyle}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AppColumnsDialog;
