import React, { useImperativeHandle, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { prettyPrint } from '../../utilities/prettyPrint';
import { Box, Paper, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/CheckOutlined';
import SaveAsOutlinedIcon from '@mui/icons-material/SaveAsOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import OpenInFullOutlinedIcon from '@mui/icons-material/OpenInFullOutlined';

export interface ChartDialogRef {
   getContainer: () => HTMLDivElement | null;
   getPaper: () => HTMLDivElement | null;
}

interface ChartDialogProps {
   open: boolean;
   onClose: () => void;
   onSave?: () => void;
   onSaveAs?: () => void;
   onDelete?: () => void;
   // Optional portal container to avoid aria-hidden on ancestors
   container?: HTMLElement | null;
   onSettings?: () => void;
   onOpenEmbedded?: () => void;
}

// React 19: accept `ref` directly as a prop (no forwardRef)
type ChartDialogPropsWithRef = ChartDialogProps & { ref?: React.Ref<ChartDialogRef> };

const ChartDialog: React.FC<ChartDialogPropsWithRef> = ({
   ref,
   open,
   onClose,
   onSave,
   onSaveAs,
   onDelete,
   container,
   onSettings,
   onOpenEmbedded,
}) => {
   const chartContainerRef = useRef<HTMLDivElement>(null);
   const paperRef = useRef<HTMLDivElement>(null);

   useImperativeHandle(ref, () => ({
      getContainer: () => chartContainerRef.current,
      getPaper: () => paperRef.current,
   }));

   // As a last resort for environments that aria-hide ancestors (e.g., Salesforce Aura),
   // move AG popups for chart tool panels into the dialog paper and lift their z-index.
   useEffect(() => {
      if (!open) return;
      const paper = paperRef.current;
      if (!paper) return;

      const selectors = [
         '.ag-select-list',
         '.ag-rich-select-list',
         '.ag-popup-child',
         '.ag-picker-popup',
         '.ag-virtual-list-viewport',
      ];

      const isTarget = (el: Element) => selectors.some(sel => (el as HTMLElement).matches?.(sel));

      // Track aria-hidden changes to restore on cleanup
      const changed = new Map<HTMLElement, string | null>();

      // Debug counters
      let matchedCount = 0;
      let movedCount = 0;
      let unhiddenCount = 0;

      try {
         prettyPrint('[ChartDialog][MO] start', { selectors }, 'teal');
      } catch (e) {
         prettyPrint('[ChartDialog][MO] start error', e, 'red');
      }

      const unhideAncestors = (el: HTMLElement) => {
         try {
            let cur: HTMLElement | null = el.parentElement;
            while (cur && cur !== document.body) {
               const v = cur.getAttribute('aria-hidden');
               if (v === 'true' && !changed.has(cur)) {
                  changed.set(cur, v);
                  cur.setAttribute('aria-hidden', 'false');
                  unhiddenCount++;
               }
               cur = cur.parentElement;
            }
         } catch (e) {
            prettyPrint('[ChartDialog] unhideAncestors error', e, 'red');
         }
      };

      const handleNode = (node: Node) => {
         if (!(node instanceof HTMLElement)) return;
         if (isTarget(node)) {
            try {
               matchedCount++;
               const before = window.getComputedStyle(node).zIndex;
               node.style.zIndex = '2000';
               paper.appendChild(node);
               movedCount++;
               unhideAncestors(node);
               try {
                  prettyPrint('[ChartDialog][MO] moved popup', {
                     tag: node.tagName,
                     class: node.className,
                     beforeZ: before,
                     afterZ: node.style.zIndex,
                     parent: paper.className || 'paper',
                  }, 'teal');
               } catch (e) {
                  prettyPrint('[ChartDialog][MO] moved popup log error', e, 'red');
               }
            } catch (e) {
               prettyPrint('[ChartDialog][MO] handleNode error', e, 'red');
            }
         }
         // check descendants as well
         if (node.hasChildNodes()) {
            node.childNodes.forEach(handleNode);
         }
      };

      const mo = new MutationObserver((mutations) => {
         for (const m of mutations) {
            if (m.addedNodes) {
               m.addedNodes.forEach(handleNode);
            }
         }
      });

      mo.observe(document.body, { childList: true, subtree: true });
      return () => {
         mo.disconnect();
         // restore aria-hidden on ancestors we modified
         changed.forEach((v, el) => {
            try {
               if (v === null) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', v);
            } catch (e) {
               prettyPrint('[ChartDialog][MO] restore aria-hidden error', e, 'red');
            }
         });
         changed.clear();
         try {
            prettyPrint('[ChartDialog][MO] stop', { matchedCount, movedCount, unhiddenCount }, 'teal');
         } catch (e) {
            prettyPrint('[ChartDialog][MO] stop log error', e, 'red');
         }
      };
   }, [open]);

   if (!open) return null;

   const portalTarget = (container ?? document.body) as HTMLElement;
   const overlay = (
      <Box sx={{ position: 'fixed', inset: 0, zIndex: 1400 }}>
         {/* Backdrop (non-modal, does not toggle aria-hidden) */}
         <Box onClick={onClose} sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.35)' }} />
         {/* Paper/content */}
         <Paper ref={paperRef} elevation={8} sx={{ position: 'relative', m: '5vh auto', maxWidth: 960, minHeight: 400, overflow: 'visible' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, pb: 0 }}>
               <Typography variant="h6" sx={{ flex: 1 }}>Chart</Typography>
               <Tooltip title="Open Advanced Editor (Embedded)" placement="top">
                  <span>
                     <IconButton aria-label="Advanced" onClick={onOpenEmbedded} disabled={!onOpenEmbedded}>
                        <OpenInFullOutlinedIcon sx={{ fontSize: 22 }} />
                     </IconButton>
                  </span>
               </Tooltip>
            </Box>
            <Toolbar variant="dense" sx={{ gap: 1, justifyContent: 'flex-end' }}>
               <Tooltip title="Settings" placement="top">
                  <span>
                     <IconButton aria-label="Settings" onClick={onSettings} disabled={!onSettings}>
                        <TuneOutlinedIcon sx={{ fontSize: 22 }} />
                     </IconButton>
                  </span>
               </Tooltip>
               <Tooltip title="Save" placement="top">
                  <span>
                     <IconButton aria-label="Save" onClick={onSave} disabled={!onSave}>
                        <SaveIcon sx={{ fontSize: 22 }} />
                     </IconButton>
                  </span>
               </Tooltip>
               <Tooltip title="Save As" placement="top">
                  <span>
                     <IconButton aria-label="SaveAs" onClick={onSaveAs} disabled={!onSaveAs}>
                        <SaveAsOutlinedIcon sx={{ fontSize: 22 }} />
                     </IconButton>
                  </span>
               </Tooltip>
               <Tooltip title="Delete" placement="top">
                  <span>
                     <IconButton aria-label="Delete" onClick={onDelete} disabled={!onDelete}>
                        <DeleteOutlinedIcon sx={{ fontSize: 22 }} />
                     </IconButton>
                  </span>
               </Tooltip>
               <Tooltip title="Close" placement="top">
                  <IconButton aria-label="close" onClick={onClose}>
                     <CloseIcon />
                  </IconButton>
               </Tooltip>
            </Toolbar>
            <Box sx={{ p: 2, overflow: 'visible' }}>
               <div ref={chartContainerRef} style={{ width: '100%', height: '350px' }} />
            </Box>
         </Paper>
      </Box>
   );
   return ReactDOM.createPortal(overlay, portalTarget);
};

ChartDialog.displayName = 'ChartDialog';

export default ChartDialog;
