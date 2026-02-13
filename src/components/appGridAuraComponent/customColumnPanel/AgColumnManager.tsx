/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AgColumnManager
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 * The LWC runtime swallows up the drop event necessitating
 * the need for a custom column manager implementation
 * 
 * Column management dialog for configuring AG Grid columns, row groups,
 * values, and pivot columns via drag-and-drop. Also provides parent fields
 * management for including related object fields in grid views.
 *
 * ARCHITECTURE:
 * - Parent: Rendered by AppGrid, SubgridCore, or TimeSeriesGrid
 * - State: Local state for column lists, Zustand for metadata access
 * - API: Uses gridApi to read/apply column state, apiClient for metadata
 * - Grid: Multiple mini AG Grid instances for drag-and-drop lists
 *
 * KEY DEPENDENCIES:
 * - AG Grid Enterprise for drag-and-drop column management
 * - MUI Dialog, Tabs, and form controls for UI
 * - Zustand store for selectedObjMetadata access
 *
 * USAGE:
 * <AgColumnManager
 *   open={showColumnManager}
 *   onClose={() => setShowColumnManager(false)}
 *   gridApi={gridApiRef.current}
 *   setPivot={handleSetPivot}
 *   metadata={metadata}
 *   apiClient={apiClient}
 * />
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/*==========================================
** IMPORTS
==========================================*/

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Zustand
import useStore from '../../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// MUI
import { Dialog, DialogTitle, DialogContent, Box, Stack, Typography, IconButton, Switch, FormControlLabel, TextField, InputAdornment, Tabs, Tab, MenuItem, Select, FormControl, InputLabel, Button, Chip } from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';
import { useThemeState } from '../../../hooks/selectors';

// Ag-Grid themes
import {
  themeQuartz
} from 'ag-grid-community';

// MUI icons
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import LockIcon from '@mui/icons-material/Lock';
import Tooltip from '@mui/material/Tooltip';

import { AgGridReact } from 'ag-grid-react';

import './AgColumnManager.css';

import type { GridApi, ColDef, GridReadyEvent, RowDragEndEvent } from 'ag-grid-community';



import type { SObjectMetadata, SObjectView, SharedViewDTO } from '../../../sObjectMetadataTypes';

import type { APIClient } from '../../../brideDesignPattern/apiInterface';

import { emitRefreshQuery } from '../../../events/topics';

// import { prettyPrint } from '../../../utilities/prettyPrint';

// View Sharing Components
import { SharedWithMeTab, ShareViewDialog, ImportViewDialog } from '../../viewSharing';

// Grid Permission type
import type { GridPermission } from '../../../appInterfaces/grid/gridInterfaces';


/*==========================================
** TYPES & INTERFACES
==========================================*/

type Item = { id: string; label: string };
type ManagerLists = {
  available: Item[];
  pinnedCols: Item[];
  rowGroups: Item[];
  values: Item[];
  pivots: Item[];
  pivotMode: boolean;
};

export interface AgColumnManagerProps {
  open: boolean;
  onClose: () => void;
  gridApi: GridApi | null | undefined;
  setPivot?: (enable: boolean, pivotColIds: string[]) => void;
  metadata?: SObjectMetadata | null; // optional: explicit metadata (subgrid or override)
  apiClient?: APIClient;
  saveAgGridState?: () => Promise<any>;
  selectedView?: SObjectView | null;
  onParentFieldsChange?: (parentFieldsJson: string) => void;
  setSelectedView?: (view: SObjectView | null) => void;
  // View Sharing props
  gridPermission?: GridPermission | null;
  isSystemAdmin?: boolean;
  sObjectName?: string;
  onViewImported?: (view: SObjectView) => void;
  onRefreshSharedViews?: () => Promise<void>;
}

/*==========================================
** HELPER FUNCTIONS
==========================================*/

function useColumnInfo(api: GridApi | null | undefined, meta: SObjectMetadata | null | undefined) {
  return useMemo(() => {
    if (!api) return { idToLabel: new Map<string, string>(), allIds: [] as string[] };
    const columnApi: any = (api as any).getColumnApi?.() || (api as any);
    let allIds: string[] = [];

    const state: any[] = columnApi.getColumnState?.() || [];
    allIds = (state.map((s) => s.colId).filter(Boolean) as string[]);

    if (!allIds.length) {

      const cols = columnApi.getAllGridColumns?.() || [];
      allIds = cols.map((c: any) => c.getColId?.() || c.colId).filter(Boolean);

    }
    if (!allIds.length) {

      const defs = (api as any).getColumnDefs?.() || [];
      allIds = (defs || [])
        .map((d: any) => d?.colId || d?.field)
        .filter((x: any) => !!x);

    }
    const idToLabel = new Map<string, string>();

    const humanize = (s: string) => {
      try {
        // Prefer underscores to spaces, strip Salesforce suffixes if present
        let t = String(s || '').replace(/__/g, ' ').replace(/_/g, ' ');

        // Basic camelCase to words
        t = t.replace(/([a-z0-9])([A-Z])/g, '$1 $2');

        // Trim and Title Case
        t = t.trim().replace(/\s+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

        return t || s;
      } catch {
        return s;
      }
    };

    const applyDefsLabels = (defs: any[]) => {
      const visit = (d: any) => {
        if (!d) return;

        if (Array.isArray(d.children) && d.children.length) {
          d.children.forEach(visit);
          return;
        }

        const id = d?.colId || d?.field;

        if (!id) return;

        const header = d.headerName || d.header || humanize(id);

        idToLabel.set(String(id), String(header));
      };
      defs?.forEach(visit);
    };
    try {
      const cols = columnApi.getAllGridColumns?.() || [];

      cols.forEach((c: any) => {
        const id = c.getColId?.() || c.colId;

        const def = c.getColDef?.() || {};

        const header = def.headerName || def.header || def.field || humanize(id);

        if (id) idToLabel.set(String(id), String(header));
      });
      // ensure labels for any remaining ids
      for (const id of allIds) if (!idToLabel.has(id)) idToLabel.set(id, id);
    } catch {
      for (const id of allIds) idToLabel.set(id, id);
    }

    // Also pull labels from primary columnDefs (covers hidden/available fields)

    const defs = (api as any).getColumnDefs?.() || [];
    applyDefsLabels(defs as any[]);


    // Finally, if object metadata is available, prefer Salesforce field labels

    const fields = meta?.fields || [];
    fields.forEach((f: any) => {
      const apiName = f?.name;
      const label = f?.label || f?.name;
      if (apiName) idToLabel.set(String(apiName), String(label));
    });

    return { idToLabel, allIds };
  }, [api, meta]);
}

function buildItems(ids: string[], idToLabel: Map<string, string>) {
  return ids.map((id) => ({ id, label: idToLabel.get(id) || id }));
}

const baseThemes = [
  { id: "themeQuartz", value: themeQuartz },
];

/*==========================================
** COMPONENT
==========================================*/

export default function AgColumnManager({ open, onClose, gridApi, setPivot, metadata, apiClient, saveAgGridState, selectedView, onParentFieldsChange, setSelectedView, gridPermission, isSystemAdmin, sObjectName, onViewImported, onRefreshSharedViews }: AgColumnManagerProps) {
  /*==========================================
  ** CONTEXT
  ==========================================*/
  const theme = useTheme();

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

  /*==========================================
  ** GLOBAL STATE (Zustand)
  ==========================================*/
  const selectedObjMetadata = useStore(useShallow((state) => state.selectedObjMetadata));

  const metaToUse = metadata ?? selectedObjMetadata;

  // View Sharing Zustand state
  const {
    openShareViewDialog,
    openImportViewDialog,
  } = useStore(useShallow((state) => ({
    openShareViewDialog: state.openShareViewDialog,
    openImportViewDialog: state.openImportViewDialog,
  })));

  // Determine if team sharing is enabled (permission or System Admin override)
  const isTeamSharingEnabled = useMemo(() => {
    return isSystemAdmin === true || gridPermission?.enableTeamSharing === true;
  }, [isSystemAdmin, gridPermission]);

  /*==========================================
  ** MEMOIZED VALUES
  ==========================================*/
  const metadataFieldSet = useMemo(() => {
    try {
      return new Set((metaToUse?.fields || []).map((f: any) => f?.name).filter(Boolean));
    } catch {
      return new Set<string>();
    }
  }, [metaToUse]);

  /*==========================================
  ** REFS
  ==========================================*/
  const availableApi = useRef<GridApi | null>(null);

  const groupApi = useRef<GridApi | null>(null);

  const valuesApi = useRef<GridApi | null>(null);

  const pivotApi = useRef<GridApi | null>(null);

  const pinnedApi = useRef<GridApi | null>(null);

  /*==========================================
  ** LOCAL STATE
  ==========================================*/
  const [pivotMode, setPivotMode] = useState(false);

  /*==========================================
  ** CUSTOM HOOKS
  ==========================================*/
  const { idToLabel } = useColumnInfo(gridApi || null, metaToUse || null);

  /*==========================================
  ** CALLBACKS
  ==========================================*/
  const isFixed = useCallback((id: string) => {
    // Ignore selection/error/auto and any generated secondary pivot result columns
    return id === 'ag-Grid-SelectionColumn' || id === 'error' || id.includes('AutoColumn') || id.startsWith('pivot_');
  }, []);

  const [pinnedCols, setPinnedCols] = useState<Item[]>([]);

  const [available, setAvailable] = useState<Item[]>([]);

  const [rowGroups, setRowGroups] = useState<Item[]>([]);

  const [values, setValues] = useState<Item[]>([]);

  const [pivots, setPivots] = useState<Item[]>([]);

  const [availableFilter, setAvailableFilter] = useState<string>('');

  const [currentTab, setCurrentTab] = useState(0);

  const [selectedParentObject, setSelectedParentObject] = useState<string>('');

  const [parentMetadata, setParentMetadata] = useState<SObjectMetadata | null>(null);

  const [loadingParentMetadata, setLoadingParentMetadata] = useState(false);

  const [selectionSummary, setSelectionSummary] = useState<Record<string, { relationshipName: string; fields: string[] }>>({});

  const relationFieldsApi = useRef<GridApi | null>(null);

  const savedParentFieldsConfigRef = useRef<Record<string, { relationshipName: string; fields: string[] }>>({});

  const allowId = useCallback((rawId: string | null | undefined) => {
    const id = String(rawId ?? '').trim();

    if (!id) {
      return false;
    }

    const def = (gridApi as any)?.getColumnDef?.(id);

    if (def) {
      return true;
    }

    if (!metadataFieldSet || metadataFieldSet.size === 0) {
      return true;
    }

    if (metadataFieldSet.has(id)) {
      return true;
    }

    if (id.includes('.')) {
      for (const part of id.split('.')) {
        if (metadataFieldSet.has(part)) return true;
      }
    }
    return false;
  }, [gridApi, metadataFieldSet]);

  const refreshListsFromGrid = useCallback(() => {

    if (!gridApi) return;

    const columnApi: any = (gridApi as any).getColumnApi?.() || (gridApi as any);

    const isPivot = !!columnApi.isPivotMode?.();

    const seen = new Set<string>();

    const pushIfValid = (rawId: any, target: string[]) => {
      const id = rawId != null ? String(rawId) : '';
      if (!id || seen.has(id) || isFixed(id) || !allowId(id)) return;

      seen.add(id);

      target.push(id);
    };

    const orderedIds: string[] = [];

    const columnState: any[] = columnApi.getColumnState?.() || [];

    columnState.forEach((s: any) => pushIfValid(s?.colId, orderedIds));

    const addFrom = (items: any[], getter: (item: any) => any) => {
      if (!Array.isArray(items)) return;

      items.forEach((item: any) => pushIfValid(getter(item), orderedIds));
    };

    addFrom(gridApi.getAllDisplayedColumns?.() || [], (c: any) => c?.getColId?.() || c?.colId);

    addFrom(gridApi.getAllGridColumns?.() || [], (c: any) => c?.getColId?.() || c?.colId);

    addFrom(((gridApi as any).getColumnDefs?.() || []) as any[], (d: any) => d?.colId || d?.field);

    if (isPivot) {
      const defs = ((gridApi as any).getColumnDefs?.() || []) as any[];

      defs
        .filter((d: any) => d && d.enablePivot !== false)
        .forEach((d: any) => pushIfValid(d?.colId || d?.field, orderedIds));
    }

    const ids = orderedIds;

    console.debug('[AgColumnManager] discovered ids:', ids.slice(0, 20));

    // Get row groups, values, and pivot columns
    // IMPORTANT: In pivot mode, getRowGroupColumns() and getPivotColumns() may return empty
    // even when row groups/pivot columns are configured (because the grid shows pivot result columns).
    // Use getState() as the source of truth, with API methods as fallback.
    const gridState = (gridApi as any).getState?.() || {};

    // Row groups: prefer gridState.rowGroup.groupColIds, fallback to API
    let g = gridState?.rowGroup?.groupColIds || [];
    if (!g.length) {
      g = (gridApi.getRowGroupColumns?.() || []).map((c: any) => c.getColId?.() || c.colId).filter(Boolean);
    }
    // If still empty, check columnState for rowGroup:true columns
    if (!g.length) {
      g = columnState?.filter((c: any) => c.rowGroup === true || (c.rowGroupIndex !== null && c.rowGroupIndex !== undefined && c.rowGroupIndex >= 0))
        .sort((a: any, b: any) => (a.rowGroupIndex ?? 999) - (b.rowGroupIndex ?? 999))
        .map((c: any) => c.colId)
        .filter(Boolean) || [];
    }

    // Values/aggregations: use API (these work correctly)
    const v = (gridApi.getValueColumns?.() || []).map((c: any) => c.getColId?.() || c.colId).filter(Boolean);

    // Pivot columns: prefer gridState.pivot.pivotColIds, fallback to API
    let p = gridState?.pivot?.pivotColIds || [];
    if (!p.length) {
      p = (gridApi.getPivotColumns?.() || []).map((c: any) => c.getColId?.() || c.colId).filter(Boolean);
    }
    // If still empty, check columnState for pivot:true columns
    if (!p.length) {
      p = columnState?.filter((c: any) => c.pivot === true || (c.pivotIndex !== null && c.pivotIndex !== undefined && c.pivotIndex >= 0))
        .sort((a: any, b: any) => (a.pivotIndex ?? 999) - (b.pivotIndex ?? 999))
        .map((c: any) => c.colId)
        .filter(Boolean) || [];
    }

    // Pinned columns: columns with pinned === 'left' (excluding fixed cols like error)
    // editAction is always pinned and should always appear first in the pinned list
    const pinnedIds: string[] = [];
    columnState.forEach((s: any) => {
      const id = s?.colId;
      if (!id || isFixed(id)) return;
      if (s.pinned === 'left') {
        pinnedIds.push(id);
      }
    });
    // Ensure editAction is always first
    if (!pinnedIds.includes('editAction')) {
      pinnedIds.unshift('editAction');
    } else {
      const idx = pinnedIds.indexOf('editAction');
      if (idx > 0) {
        pinnedIds.splice(idx, 1);
        pinnedIds.unshift('editAction');
      }
    }

    const pinnedSet = new Set(pinnedIds);

    // Keep all columns in Available list - don't filter out grouped/value/pivot columns
    // But exclude pinned columns from available
    let avail = ids.filter((id) => !pinnedSet.has(id));

    if (isPivot) {
      const defs = ((gridApi as any).getColumnDefs?.() || []) as any[];

      const isPivotEnabled = (d: any) => d?.enablePivot !== false; // default is true

      const pivotEnabledIds = new Set(
        defs
          .filter(isPivotEnabled)
          .map((d: any) => d?.colId || d?.field)
          .filter((x: any) => !!x && !isFixed(String(x)))
      );

      avail = avail.filter((id) => pivotEnabledIds.has(id));
    }

    setPinnedCols(buildItems(pinnedIds, idToLabel));

    setRowGroups(buildItems(g, idToLabel));

    setValues(buildItems(v, idToLabel));

    setPivots(buildItems(p, idToLabel));

    setAvailable(buildItems(avail, idToLabel));

    setPivotMode(isPivot);

  }, [allowId, gridApi, idToLabel, isFixed]);

  /*==========================================
  ** EFFECTS
  ==========================================*/
  // Refresh whenever dialog opens or api/columns info change
  useEffect(() => {
    if (open) {
      refreshListsFromGrid();
    }
  }, [open, refreshListsFromGrid]);

  // Retry a couple times after open if lists are empty (in case api settles late)
  useEffect(() => {
    if (!open) {
      return;
    }

    const t1 = setTimeout(refreshListsFromGrid, 50);

    const t2 = setTimeout(refreshListsFromGrid, 150);

    const t3 = setTimeout(refreshListsFromGrid, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [open, refreshListsFromGrid]);

  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    rowDrag: false,
    sortable: false,
    resizable: false,
    suppressHeaderMenuButton: true,
  }), []);

  // Base label column used in mini-grids
  const baseLabelCol = useMemo<ColDef>(() => ({
    headerName: 'Column',
    colId: 'label',
    field: 'label',
    valueGetter: (p: any) => p?.data?.label ?? p?.data?.id,
    rowDrag: true,
    sortable: false,
    resizable: false,
    suppressHeaderMenuButton: true,
    flex: 1,
  }), []);

  // Small action cell used to remove item from a target list
  const ActionCellRenderer = useCallback((params: any) => {
    const onRemove = params?.context?.onRemove as ((id: string) => void) | undefined;

    const id = params?.data?.id as string | undefined;

    if (!onRemove || !id) {
      return null;
    }

    return (
      <IconButton
        size="small"
        aria-label="Remove"
        onClick={() => onRemove(id)}>
        <DeleteOutlinedIcon
          fontSize="small" />
      </IconButton>
    );
  }, []);

  // Column defs for each mini-grid
  const getColDefsFor = useCallback((which: 'available' | 'groups' | 'values' | 'pivots' | 'pinned'): ColDef[] => {
    if (which === 'available') {
      // Only the label column; AG Grid renders selection checkbox via rowSelection.mode
      return [{ ...baseLabelCol, sortable: true }];
    }
    if (which === 'pinned') {
      return [
        {
          ...baseLabelCol,
          // editAction row is not draggable; others are
          rowDrag: (params: any) => params?.data?.id !== 'editAction',
          cellRenderer: (params: any) => {
            const id = params?.data?.id;
            const label = params?.data?.label ?? id;
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {id === 'editAction' && <LockIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />}
                <span>{label}</span>
              </Box>
            );
          },
        },
        {
          headerName: '', colId: 'actions', width: 56, minWidth: 48, maxWidth: 72, resizable: false, sortable: false, suppressHeaderMenuButton: true,
          // editAction cannot be removed; others can
          cellRenderer: (params: any) => {
            const id = params?.data?.id;
            if (id === 'editAction') return null;
            const onRemove = params?.context?.onRemove as ((id: string) => void) | undefined;
            if (!onRemove || !id) return null;
            return (
              <IconButton size="small" aria-label="Remove" onClick={() => onRemove(id)}>
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            );
          },
        },
      ];
    }
    return [
      baseLabelCol,
      { headerName: '', colId: 'actions', width: 56, minWidth: 48, maxWidth: 72, resizable: false, sortable: false, suppressHeaderMenuButton: true, cellRenderer: ActionCellRenderer as any },
    ];
  }, [ActionCellRenderer, baseLabelCol]);

  // Apply lists to main grid
  const applyToMainGrid = useCallback((next?: Partial<ManagerLists>) => {
    if (!gridApi) {
      return;
    }

    const effectiveAvailable = next?.available ?? available;
    const effectivePinnedCols = next?.pinnedCols ?? pinnedCols;
    const effectiveRowGroups = next?.rowGroups ?? rowGroups;
    const effectiveValues = next?.values ?? values;
    const effectivePivots = next?.pivots ?? pivots;
    const effectivePivotMode = next?.pivotMode ?? pivotMode;

    const ca: any = (gridApi as any).getColumnApi?.() || (gridApi as any);

    gridApi.setRowGroupColumns?.(effectiveRowGroups.map((x) => x.id));

    const pivotIds = effectivePivots.map((x) => x.id);

    if (typeof setPivot === 'function') {
      setPivot(effectivePivotMode || pivotIds.length > 0, pivotIds);
    } else {
      ca.setPivotMode?.(effectivePivotMode || pivotIds.length > 0);
      (gridApi as any).setPivotColumns?.(pivotIds);
    }

    // Clear value columns if no row groups are defined (aggregations require grouping)
    if (effectiveRowGroups.length === 0 && effectiveValues.length > 0) {
      if (!next?.values) {
        setValues([]);
      }
      gridApi.applyColumnState?.({ defaultState: { aggFunc: undefined }, applyOrder: false });

      return;
    }

    // Values: apply via applyColumnState to set aggFunc if needed later
    const vIds = effectiveValues.map((x) => x.id);

    const state = vIds.map((colId) => ({ colId, aggFunc: 'sum' }));

    gridApi.applyColumnState?.({ state, defaultState: { aggFunc: undefined }, applyOrder: false });

    if (!effectivePivotMode) {
      const destIds = effectiveAvailable.map((x) => x.id);

      const allDisplayed = ca.getAllGridColumns?.() || [];

      const idOf = (c: any) => c.getColId?.() || c.colId;

      const displayedIds: string[] = allDisplayed.map(idOf);

      const present = destIds.filter((id) => displayedIds.includes(id));

      if (present.length) {
        // Find the earliest current index among the present columns, and insert the ordered block there
        const positions = present.map((id) => displayedIds.indexOf(id)).filter((i) => i >= 0);

        const toIndex = Math.min(...positions);

        ca.moveColumns?.(present, toIndex);
      }

      // Position value/aggregation columns after the auto-generated group column
      // Only when: row groups exist AND value columns exist AND not in pivot mode
      if (effectiveRowGroups.length > 0 && vIds.length > 0) {
        setTimeout(() => {
          const allCols = ca.getAllGridColumns?.() || [];
          const colIdList = allCols.map((c: any) => c.getColId?.() || c.colId);
          const valueCols = vIds.filter((id: string) => colIdList.includes(id));

          if (valueCols.length > 0) {
            // Find the auto-generated group column index
            const autoGroupIndex = colIdList.findIndex((id: string) =>
              id && (id.includes('AutoColumn') || id.startsWith('ag-Grid-AutoColumn'))
            );
            // Position value columns right after the auto-generated group column
            // If no auto column found, default to index 1
            const targetIndex = autoGroupIndex >= 0 ? autoGroupIndex + 1 : 1;
            ca.moveColumns?.(valueCols, targetIndex);
          }
        }, 50);
      }
    }

    // Apply pinning: pin columns in the pinned list, unpin columns removed from pinned list
    const pinnedIds = effectivePinnedCols.map((x) => x.id);
    const pinnedState = pinnedIds.map((colId) => ({ colId, pinned: 'left' as const }));
    // Unpin columns that are in Available (not pinned) — only if they were previously pinned
    const unpinState = effectiveAvailable
      .filter((x) => !pinnedIds.includes(x.id))
      .map((x) => ({ colId: x.id, pinned: null as any }));
    if (pinnedState.length || unpinState.length) {
      ca.applyColumnState?.({ state: [...pinnedState, ...unpinState], applyOrder: false });
    }

    if (!(gridApi as any)?.isDestroyed?.()) {
      (gridApi as any).refreshHeader?.();
    }
  }, [available, gridApi, pinnedCols, pivotMode, pivots, rowGroups, setPivot, values]);

  // NOTE: Removed effect that called applyToMainGrid() on open
  // This was causing grid state to be saved every time the column manager opened,
  // even without user changes. applyToMainGrid is already called after user actions:
  // - drag-and-drop operations (onDragStop)
  // - internal reorder operations (reorderWithin)
  // - pivot mode toggle
  // - removing items from lists

  // Sync 'Available' checkbox selection to reflect main grid visibility
  const syncAvailableSelectionFromGrid = useCallback(() => {
    const api = gridApi;

    const avail = availableApi.current;

    if (!api || !avail) {
      return;
    }

    const colState: any[] = api.getColumnState?.() || [];

    const visible = new Set<string>((colState || []).filter((s) => s && s.colId && s.hide !== true).map((s) => String(s.colId)));

    // Update selection in Available list based on visibility
    avail.deselectAll?.();

    avail.forEachNode?.((n: any) => {
      const id = n?.data?.id;
      const shouldSelect = !!id && visible.has(String(id));
      n.setSelected?.(shouldSelect);
    });
  }, [gridApi]);

  // After opening and after list refresh, mirror selection from grid
  useEffect(() => {
    if (open) {
      syncAvailableSelectionFromGrid();
    }
  }, [open, syncAvailableSelectionFromGrid]);

  const lastZonesRef = useRef<Map<GridApi, any[]>>(new Map());

  // Build drop zones between lists
  const registerDropZones = useCallback(() => {
    const srcApis = [availableApi.current, pinnedApi.current, groupApi.current, valuesApi.current, pivotApi.current].filter(Boolean) as GridApi[];

    const all = {
      available: availableApi.current,
      pinned: pinnedApi.current,
      groups: groupApi.current,
      values: valuesApi.current,
      pivots: pivotApi.current,
    };

    type ListName = keyof typeof all;

    const makeDropZone = (name: ListName) => {
      const dest = all[name];

      if (!dest) {
        return null;
      }

      const params = (dest as any).getRowDropZoneParams?.({
        onDragStop: (e: any) => {
          const movedIds: string[] = (e.nodes || []).map((n: any) => n.data?.id).filter(Boolean);

          if (!movedIds.length) {
            return;
          }

          // Identify origin by checking which grid contains the first node
          const origin = ['available', 'pinned', 'groups', 'values', 'pivots'].find((k) => {
            const g = (all as any)[k] as GridApi;

            const rows = [] as any[];

            g?.forEachNode?.((r: any) => rows.push(r.data?.id));

            return rows.includes(movedIds[0]);
          }) as ListName | undefined;

          // Intra-list reorder: AG Grid's rowDragManaged has already reordered visually.
          // We need to sync the React state from the grid and apply to main grid.
          if ((origin || 'available') === name) {
            // Get the current order from the mini-grid after the drag
            const items: Item[] = [];
            dest.forEachNodeAfterFilterAndSort((n: any) => {
              if (n.data) items.push(n.data as Item);
            });

            // For pinned list, ensure editAction stays first
            if (name === 'pinned') {
              const eaIdx = items.findIndex((x) => x.id === 'editAction');
              if (eaIdx > 0) {
                const [ea] = items.splice(eaIdx, 1);
                items.unshift(ea);
              }
              setPinnedCols(items);
              applyToMainGrid({ pinnedCols: items });
            } else if (name === 'available') {
              setAvailable(items);
              applyToMainGrid({ available: items });
            } else if (name === 'groups') {
              setRowGroups(items);
              applyToMainGrid({ rowGroups: items });
            } else if (name === 'values') {
              setValues(items);
              applyToMainGrid({ values: items });
            } else if (name === 'pivots') {
              setPivots(items);
              applyToMainGrid({ pivots: items });
            }
            return;
          }

          // Get the drop index - use overIndex if valid, otherwise append to end
          const overIndex: number = typeof e.overIndex === 'number' && e.overIndex >= 0 ? e.overIndex : -1;
          const originName = (origin || 'available') as ListName;

          const nextAvailable = [...available];
          const nextPinned = [...pinnedCols];
          const nextGroups = [...rowGroups];
          const nextValues = [...values];
          const nextPivots = [...pivots];

          const listMap: Record<ListName, Item[]> = {
            available: nextAvailable,
            pinned: nextPinned,
            groups: nextGroups,
            values: nextValues,
            pivots: nextPivots,
          };

          const originList = listMap[originName];
          if (originName === 'pinned') {
            listMap[originName] = originList.filter((x) => x.id === 'editAction' || !movedIds.includes(x.id));
          } else {
            listMap[originName] = originList.filter((x) => !movedIds.includes(x.id));
          }

          const targetList = listMap[name].slice();
          const itemsToAdd = movedIds.map((id) => ({ id, label: idToLabel.get(id) || id }));
          const dedupToAdd = itemsToAdd.filter((item) => !targetList.some((x) => x.id === item.id));
          if (dedupToAdd.length > 0) {
            if (overIndex >= 0 && overIndex <= targetList.length) {
              targetList.splice(overIndex, 0, ...dedupToAdd);
            } else {
              targetList.push(...dedupToAdd);
            }
          }

          if (name === 'pinned') {
            const eaIdx = targetList.findIndex((x) => x.id === 'editAction');
            if (eaIdx > 0) {
              const [ea] = targetList.splice(eaIdx, 1);
              targetList.unshift(ea);
            }
          }

          listMap[name] = targetList;

          setAvailable(listMap.available);
          setPinnedCols(listMap.pinned);
          setRowGroups(listMap.groups);
          setValues(listMap.values);
          setPivots(listMap.pivots);

          applyToMainGrid({
            available: listMap.available,
            pinnedCols: listMap.pinned,
            rowGroups: listMap.groups,
            values: listMap.values,
            pivots: listMap.pivots,
          });
        }
      });
      return params;
    };

    const zones = {
      available: makeDropZone('available'),
      pinned: makeDropZone('pinned'),
      groups: makeDropZone('groups'),
      values: makeDropZone('values'),
      pivots: makeDropZone('pivots'),
    };

    // Remove previous drop zones to avoid duplicates (#56 warning)
    srcApis.forEach((api) => {
      const prev = lastZonesRef.current.get(api) || [];

      prev.forEach((p: any) => { (api as any).removeRowDropZone?.(p); });

      lastZonesRef.current.set(api, []);
    });

    srcApis.forEach((api) => {
      const added: any[] = [];

      Object.values(zones).forEach((z) => {
        if (z) {
          (api as any).addRowDropZone?.(z); added.push(z);
        }
      });

      lastZonesRef.current.set(api, added);
    });
  }, [applyToMainGrid, idToLabel, available, pinnedCols, rowGroups, values, pivots]);

  const onGridReadyList = useCallback((which: 'available' | 'pinned' | 'groups' | 'values' | 'pivots') => (e: GridReadyEvent) => {
    if (which === 'available') {
      availableApi.current = e.api;
    }

    if (which === 'pinned') {
      pinnedApi.current = e.api;
    }

    if (which === 'groups') {
      groupApi.current = e.api;
    }

    if (which === 'values') {
      valuesApi.current = e.api;
    }

    if (which === 'pivots') {
      pivotApi.current = e.api;
    }

    setTimeout(() => registerDropZones(), 0);

    if (which === 'available') {
      setTimeout(() => syncAvailableSelectionFromGrid(), 0);
    }
  }, [registerDropZones, syncAvailableSelectionFromGrid]);

  // No-op for now; kept for API shape used by JSX
  const onAvailableSelectionChanged = useCallback(() => {
    if (!gridApi || !availableApi.current) {
      return;
    }

    const ca: any = (gridApi as any).getColumnApi?.() || (gridApi as any);

    const selectedIds: string[] = [];

    const allIds: string[] = [];

    availableApi.current.forEachNode?.((n: any) => {
      const id = n?.data?.id;

      if (!id) {
        return;
      }

      allIds.push(String(id));
      if (n.isSelected?.()) {
        selectedIds.push(String(id));
      }
    });

    // Compare with current visibility to avoid redundant updates
    const colState: any[] = gridApi.getColumnState?.() || [];

    const currentVisible = new Set<string>((colState || []).filter((s) => s && s.colId && s.hide !== true).map((s) => String(s.colId)));

    const equal = allIds.every((id) => currentVisible.has(id) === selectedIds.includes(id));

    if (equal) {
      return;
    }

    // Build column state updates: visible if selected, hidden if not
    const state = allIds.map((colId) => ({ colId, hide: !selectedIds.includes(colId) }));

    ca.applyColumnState?.({ state, applyOrder: false });
  }, [gridApi]);

  const reorderWithin = (which: 'available' | 'pinned' | 'groups' | 'values' | 'pivots') => (e: RowDragEndEvent) => {
    const api = e.api;

    const items: Item[] = [];

    api.forEachNodeAfterFilterAndSort((n) => { if (n.data) items.push(n.data as Item); });

    if (which === 'pinned') {
      // Ensure editAction stays first
      const eaIdx = items.findIndex((x) => x.id === 'editAction');
      if (eaIdx > 0) {
        const [ea] = items.splice(eaIdx, 1);
        items.unshift(ea);
      }
      setPinnedCols(items);
      applyToMainGrid({ pinnedCols: items });
    }

    if (which === 'available') {
      setAvailable(items);
      applyToMainGrid({ available: items });
    }

    if (which === 'groups') {
      setRowGroups(items);
      applyToMainGrid({ rowGroups: items });
    }

    if (which === 'values') {
      setValues(items);
      applyToMainGrid({ values: items });
    }

    if (which === 'pivots') {
      setPivots(items);
      applyToMainGrid({ pivots: items });
    }
  };

  // Remove item from a target list and return to Available
  const removeItemFrom = useCallback((which: 'pinned' | 'groups' | 'values' | 'pivots', id: string) => {
    const addBack = (arr: Item[], itemId: string): Item[] => {
      if (arr.some((x) => x.id === itemId)) {
        return arr;
      }
      const item = { id: itemId, label: idToLabel.get(itemId) || itemId };
      return [item, ...arr];
    };

    if (which === 'pinned') {
      // Never remove editAction
      if (id === 'editAction') return;
      const nextPinned = pinnedCols.filter((x) => x.id !== id);
      const nextAvailable = addBack(available, id);
      setPinnedCols(nextPinned);
      setAvailable(nextAvailable);
      applyToMainGrid({ pinnedCols: nextPinned, available: nextAvailable });
    }

    if (which === 'groups') {
      const nextGroups = rowGroups.filter((x) => x.id !== id);
      const nextAvailable = addBack(available, id);
      setRowGroups(nextGroups);
      setAvailable(nextAvailable);
      applyToMainGrid({ rowGroups: nextGroups, available: nextAvailable });
    }

    if (which === 'values') {
      const nextValues = values.filter((x) => x.id !== id);
      const nextAvailable = addBack(available, id);
      setValues(nextValues);
      setAvailable(nextAvailable);
      // For values, we need to clear the aggFunc directly on the grid
      // instead of calling applyToMainGrid which would re-apply aggFunc from stale state
      if (gridApi) {
        // Clear aggFunc for this column - use null to remove aggregation
        gridApi.applyColumnState?.({
          state: [{ colId: id, aggFunc: null }],
          applyOrder: false
        });
        // Refresh to recalculate aggregations
        gridApi.refreshClientSideRowModel?.('aggregate');
      }
      return; // Don't call applyToMainGrid - we handled it directly
    }

    if (which === 'pivots') {
      const nextPivots = pivots.filter((x) => x.id !== id);
      const nextAvailable = addBack(available, id);
      setPivots(nextPivots);
      setAvailable(nextAvailable);
      applyToMainGrid({ pivots: nextPivots, available: nextAvailable });
    }
  }, [applyToMainGrid, gridApi, idToLabel, pinnedCols, available, rowGroups, values, pivots]);

  // Recalculate grid layouts when dialog opens or pivot section visibility changes
  useEffect(() => {
    if (!open) {
      return;
    }

    const safeLayout = (api: GridApi | null) => {
      if (!api || (api as any).isDestroyed?.()) return;
      api.sizeColumnsToFit?.();
      (api as any).refreshHeader?.();
    };

    const doLayoutAll = () => {
      safeLayout(pinnedApi.current);
      safeLayout(availableApi.current);
      safeLayout(groupApi.current);
      safeLayout(valuesApi.current);
      safeLayout(pivotApi.current);
    };

    const t = setTimeout(doLayoutAll, 0);

    const onResize = () => doLayoutAll();

    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t); window.removeEventListener('resize', onResize);
    };
  }, [open, pivotMode]);

  // Build unique parent objects map from metadata
  const parentObjectsMap = useMemo(() => {
    if (!metaToUse?.fields) return new Map<string, string[]>();

    const currentObjectName = metaToUse.sobjectType || metaToUse.apiName;
    const map = new Map<string, string[]>();

    metaToUse.fields.forEach((field: any) => {
      if (field.type?.toUpperCase() === 'REFERENCE' && field.relationshipName && field.referenceTo?.length) {
        const parentObjectName = field.referenceTo[0];

        // Skip self-references
        if (parentObjectName === currentObjectName) return;

        if (!map.has(parentObjectName)) {
          map.set(parentObjectName, []);
        }

        // Store all relationship names that point to this parent object
        map.get(parentObjectName)!.push(field.relationshipName);
      }
    });

    return map;
  }, [metaToUse]);

  // Get sorted list of unique parent object names for dropdown
  const parentObjectOptions = useMemo(() => {
    return Array.from(parentObjectsMap.keys()).sort();
  }, [parentObjectsMap]);

  // Fetch parent object metadata when selected
  useEffect(() => {
    if (!selectedParentObject || !apiClient) {
      setParentMetadata(null);
      return;
    }

    setLoadingParentMetadata(true);

    apiClient.getMetadata({ sObjectName: selectedParentObject })
      .then((meta: SObjectMetadata) => {
        setParentMetadata(meta);

        setLoadingParentMetadata(false);
      })
      .catch((error) => {
        console.error('Failed to fetch parent metadata:', error);

        setParentMetadata(null);

        setLoadingParentMetadata(false);
      });
  }, [selectedParentObject, apiClient]);

  // Extract parent fields for the grid
  const parentFieldsData = useMemo(() => {
    if (!parentMetadata?.fields) return [];

    return parentMetadata.fields.map((field: any) => ({
      name: field.name,
      label: field.label || field.name,
      type: field.type || 'unknown',
    }));
  }, [parentMetadata]);

  // Column definitions for parent fields grid
  const relationFieldsColDefs = useMemo<ColDef[]>(() => [
    {
      headerName: 'Field',
      field: 'label',
      flex: 2,
      sortable: true,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'API Name',
      field: 'name',
      flex: 2,
      sortable: true,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'Type',
      field: 'type',
      flex: 1,
      sortable: true,
      filter: 'agTextColumnFilter',
      valueFormatter: (params: any) => {
        const type = params.value || '';
        return type.charAt(0).toUpperCase() + type.slice(1);
      }
    }
  ], []);

  // Handle parent object selection change
  const handleParentObjectChange = useCallback((event: any) => {
    setSelectedParentObject(event.target.value);
  }, []);

  // Handle field selection in the parent fields grid
  const handleParentFieldsSelectionChanged = useCallback(() => {
    const api = relationFieldsApi.current;

    if (!api || !selectedParentObject) return;

    const selectedNodes = api.getSelectedNodes();

    const selectedFieldNames = selectedNodes.map((node: any) => node.data?.name).filter(Boolean);

    // Get the first relationship that points to this parent object
    const relationships = parentObjectsMap.get(selectedParentObject) || [];

    const firstRelationship = relationships[0];

    if (!firstRelationship) return;

    // Update the config: store parent object with its relationship and fields
    const config = { ...savedParentFieldsConfigRef.current };

    if (selectedFieldNames.length > 0) {
      config[selectedParentObject] = {
        relationshipName: firstRelationship,
        fields: selectedFieldNames
      };
    } else {
      delete config[selectedParentObject];
    }

    savedParentFieldsConfigRef.current = config;

    setSelectionSummary({ ...config });
  }, [selectedParentObject, parentObjectsMap]);

  // Load saved parent field selections
  useEffect(() => {
    if (!open || !selectedView?.parentFields) {
      savedParentFieldsConfigRef.current = {};

      setSelectionSummary({});

      setSelectedParentObject('');
      return;
    }

    try {
      const parentFieldsConfig = JSON.parse(selectedView.parentFields);

      savedParentFieldsConfigRef.current = parentFieldsConfig;

      setSelectionSummary({ ...parentFieldsConfig });

      // Auto-select first parent object if available
      const parentObjects = Object.keys(parentFieldsConfig);

      if (parentObjects.length > 0) {
        setSelectedParentObject(parentObjects[0]);
      }
    } catch (error) {
      console.error('[AgColumnManager] Failed to parse parent fields:', error);

      savedParentFieldsConfigRef.current = {};

      setSelectionSummary({});
    }
  }, [open, selectedView]);

  // Function to restore field selections in the parent fields grid
  const restoreParentFieldSelections = useCallback((api: any) => {
    if (!api || !selectedParentObject) return;

    const config = savedParentFieldsConfigRef.current[selectedParentObject];
    if (!config || !config.fields) return;

    api.forEachNode((node: any) => {
      const fieldName = node.data?.name;
      if (fieldName && config.fields.includes(fieldName)) {
        node.setSelected(true);
      }
    });
  }, [selectedParentObject]);

  // Restore selections when parent object changes
  useEffect(() => {
    const api = relationFieldsApi.current;
    if (!api || !selectedParentObject || parentFieldsData.length === 0) return;

    // Use setTimeout to ensure grid has rendered the new data
    setTimeout(() => {
      restoreParentFieldSelections(api);
    }, 100);
  }, [selectedParentObject, parentFieldsData, restoreParentFieldSelections]);

  // Save parent fields
  const handleSaveParentFields = useCallback(async () => {
    try {
      const configJson = JSON.stringify(savedParentFieldsConfigRef.current);
      const config = savedParentFieldsConfigRef.current;

      if (onParentFieldsChange) {
        onParentFieldsChange(configJson);
      }

      if (setSelectedView && selectedView) {
        const updatedView = { ...selectedView, parentFields: configJson };

        setSelectedView(updatedView);
      }

      // Dynamically add/remove parent field columns in the grid
      if (gridApi) {
        const currentColDefs = gridApi.getColumnDefs() || [];

        // Remove existing parent field columns (they have '.' in the field name and start with relationship name)
        const nonParentColDefs = currentColDefs.filter((col: any) => {
          const field = col.field || col.colId || '';
          // Parent field columns have format "RelationshipName.FieldName"
          return !field.includes('.') || field.startsWith('Owner.') || field.startsWith('CreatedBy.') || field.startsWith('LastModifiedBy.');
        });

        // Add new parent field columns based on config
        const parentFieldColDefs: any[] = [];
        for (const [parentObjectName, cfg] of Object.entries(config)) {
          if (!cfg || typeof cfg !== 'object') continue;
          const { relationshipName, fields } = cfg as { relationshipName: string; fields: string[] };
          if (!relationshipName || !Array.isArray(fields)) continue;

          for (const parentFieldName of fields) {
            const columnField = `${relationshipName}.${parentFieldName}`;
            const columnHeader = `[${parentObjectName}] ${parentFieldName}`;

            parentFieldColDefs.push({
              field: columnField,
              colId: columnField,
              headerName: columnHeader,
              editable: false,
              filter: 'agTextColumnFilter',
              filterParams: {
                buttons: ['apply', 'clear', 'cancel'],
                closeOnApply: true,
              },
              valueGetter: (params: any) => {
                const data = params.data;
                if (!data || !relationshipName) return null;
                const parentObj = data[relationshipName];
                return parentObj?.[parentFieldName] ?? null;
              },
              chartDataType: 'category',
              suppressFillHandle: true,
            });
          }
        }

        // Combine and set column definitions
        const newColDefs = [...nonParentColDefs, ...parentFieldColDefs];
        gridApi.setGridOption('columnDefs', newColDefs);
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      if (saveAgGridState) {
        await saveAgGridState();
      }

      emitRefreshQuery();

      // Close the dialog after saving
      onClose();
    } catch (error) {
      console.error('[AgColumnManager] Error saving parent fields:', error);
    }
  }, [gridApi, onParentFieldsChange, saveAgGridState, setSelectedView, selectedView, onClose]);

  // Close handler for Columns tab: snapshot + persist before closing
  const handleDialogClose = useCallback(async () => {
    try {
      if (currentTab === 0) {
        if (gridApi && setSelectedView && selectedView) {
          const gridState = (gridApi as any).getState?.() ?? {};
          const colState = gridApi.getColumnState?.() ?? [];
          const updatedView = {
            ...selectedView,
            gridState: JSON.stringify(gridState),
            columnState: JSON.stringify(colState),
          } as SObjectView;
          setSelectedView(updatedView);
        }

        if (saveAgGridState) {
          await saveAgGridState();
        }
      }
    } catch (error) {
      console.error('[AgColumnManager] Error while closing Column Manager:', error);
    } finally {
      onClose();
    }
  }, [currentTab, gridApi, onClose, saveAgGridState, selectedView, setSelectedView]);

  /*==========================================
  ** VIEW SHARING HANDLERS
  ==========================================*/

  // Handle Share button click - save grid state first to ensure row groups/pivot columns are captured
  const handleShareClick = useCallback(async () => {
    if (selectedView?.id && selectedView?.name) {
      // Save grid state first to ensure the latest row groups, pivot columns, etc. are persisted
      if (saveAgGridState) {
        await saveAgGridState();
      }
      openShareViewDialog(selectedView.id, selectedView.name);
    }
  }, [selectedView, openShareViewDialog, saveAgGridState]);

  // Handle Import View from SharedWithMeTab
  const handleImportView = useCallback((sharedView: SharedViewDTO) => {
    openImportViewDialog(sharedView);
  }, [openImportViewDialog]);

  // Handle Update View (pull latest from source)
  const handleUpdateView = useCallback(async (sharedView: SharedViewDTO) => {
    if (!apiClient || !sharedView.importedViewId) return;

    try {
      const updatedView = await apiClient.updateImportedView({
        viewId: sharedView.importedViewId,
      });

      if (updatedView && onViewImported) {
        onViewImported(updatedView);
      }
    } catch (error) {
      console.error('[AgColumnManager] Error updating view:', error);
    }
  }, [apiClient, onViewImported]);

  // Callback from ImportViewDialog - handle successful import
  const handleImportSuccess = useCallback((importedView: SObjectView) => {
    if (onViewImported) {
      onViewImported(importedView);
    }
    // Optionally close the dialog
  }, [onViewImported]);

  /*==========================================
  ** RENDER
  ==========================================*/
  return (
    <Dialog
      open={open}
      onClose={() => { void handleDialogClose(); }}
      // maxWidth="sm"
      fullWidth
      container={typeof window !== 'undefined' ? document.body : undefined}
      disableEnforceFocus
      disableRestoreFocus
      slotProps={{
        paper: { sx: { maxWidth: '85vw' } }
      }}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: 1,
          borderColor: 'divider',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'transparent',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 6 }}>
        Column Manager
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Share View Button - only shown when team sharing is enabled and a view is selected */}
          {isTeamSharingEnabled && selectedView?.id && (
            <Tooltip title="Share this view with other users">
              <Button
                variant="contained"
                size='small'
                onClick={handleShareClick}
                sx={{
                  // backgroundColor: theme.palette.background.paper,
                  backgroundColor: selectedAccentColor,
                  color: 'white',
                  // color: theme.palette.text.primary,
                }}>
                Share
              </Button>
            </Tooltip>
          )}
          {/* Close Button */}
          <IconButton
            onClick={() => { void handleDialogClose(); }}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8
            }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 2
          }}>
          <Tab label="Columns" />
          <Tab label="Parent Fields" />
          {isTeamSharingEnabled && <Tab label="Shared With Me" />}
        </Tabs>

        {/* Columns Tab */}
        <Box
          role="tabpanel"
          hidden={currentTab !== 0}>
          {currentTab === 0 && (
            <Box className="agcm">
              <Box sx={{ display: 'flex', gap: 3, height: '75vh' }}>
                {/* ── Left Column (60%): Pinned + Available ── */}
                <Box sx={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  {/* Pinned Columns */}
                  <Box
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      flex: '0 0 auto',
                      minHeight: '100px',
                      maxHeight: '20%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1,
                    }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>Pinned Columns</Typography>
                    <div className="ag-theme-quartz agcm-grid agcm-hide-header" style={{ flex: 1, minHeight: 0 }}>
                      <AgGridReact
                        rowData={pinnedCols}
                        columnDefs={getColDefsFor('pinned')}
                        defaultColDef={defaultColDef}
                        getRowId={(p) => p.data.id}
                        animateRows
                        rowDragManaged
                        suppressMoveWhenRowDragging
                        context={{ onRemove: (id: string) => removeItemFrom('pinned', id) }}
                        onGridReady={onGridReadyList('pinned')}
                        onRowDragEnd={reorderWithin('pinned')}
                        theme={agGridTheme}
                      />
                    </div>
                  </Box>
                  {/* Available Columns */}
                  <Box
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      flexGrow: 1,
                      minHeight: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1,
                    }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>Available</Typography>
                    <Box sx={{ mb: 0.5 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Filter columns..."
                        value={availableFilter}
                        onChange={(e) => setAvailableFilter(e.target.value)}
                        slotProps={{
                          input: {
                            'aria-label': 'Filter available columns',
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton size="small" aria-label="Clear filter" onClick={() => setAvailableFilter('')} disabled={!availableFilter}>
                                  <ClearIcon fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            )
                          }
                        }}
                      />
                    </Box>
                    <div className="ag-theme-quartz agcm-grid agcm-available" style={{ flex: 1, minHeight: 0 }}>
                      <AgGridReact
                        rowData={available}
                        columnDefs={getColDefsFor('available')}
                        defaultColDef={defaultColDef}
                        getRowId={(p) => p.data.id}
                        animateRows
                        rowDragManaged
                        suppressMoveWhenRowDragging
                        rowSelection={{ mode: 'multiRow', enableClickSelection: false }}
                        quickFilterText={availableFilter}
                        onGridReady={onGridReadyList('available')}
                        onSelectionChanged={onAvailableSelectionChanged}
                        onRowDragEnd={reorderWithin('available')}
                        theme={agGridTheme}
                      />
                    </div>
                  </Box>
                </Box>
                {/* ── Right Column (40%): Pivot Toggle + Row Groups + Values + Pivot Columns ── */}
                <Box sx={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  {/* Pivot Mode Toggle */}
                  <Stack direction="row" alignItems="center" justifyContent="flex-end">
                    <FormControlLabel control={<Switch checked={pivotMode} onChange={(_, c) => {
                      const currentPivotIds = pivots.map((x) => x.id);
                      const nextPivotMode = c;
                      setPivotMode(c);
                      if (!nextPivotMode) {
                        const nextPivots: Item[] = [];
                        const nextAvailable = (() => {
                          const map = new Map(available.map((x) => [x.id, x] as const));
                          currentPivotIds.forEach((id) => {
                            if (!map.has(id)) map.set(id, { id, label: idToLabel.get(id) || id });
                          });
                          return Array.from(map.values());
                        })();
                        setPivots(nextPivots);
                        setAvailable(nextAvailable);
                        applyToMainGrid({
                          pivotMode: false,
                          pivots: nextPivots,
                          available: nextAvailable,
                        });
                      } else {
                        applyToMainGrid({
                          pivotMode: true,
                          pivots,
                          available,
                        });
                      }
                    }} />} label="Pivot Mode" />
                  </Stack>
                  {/* Row Groups */}
                  <Box
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      flex: 1,
                      minHeight: '80px',
                      display: 'flex',
                      flexDirection: 'column',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1,
                    }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>Row Groups</Typography>
                    <div className="ag-theme-quartz agcm-grid agcm-hide-header" style={{ flex: 1, minHeight: 0 }}>
                      <AgGridReact
                        rowData={rowGroups}
                        columnDefs={getColDefsFor('groups')}
                        defaultColDef={defaultColDef}
                        getRowId={(p) => p.data.id}
                        animateRows
                        rowDragManaged
                        suppressMoveWhenRowDragging
                        context={{ onRemove: (id: string) => removeItemFrom('groups', id) }}
                        onGridReady={onGridReadyList('groups')}
                        onRowDragEnd={reorderWithin('groups')}
                        theme={agGridTheme}
                      />
                    </div>
                  </Box>
                  {/* Values */}
                  <Box
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      flex: 1,
                      minHeight: '80px',
                      display: 'flex',
                      flexDirection: 'column',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1,
                    }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>Values</Typography>
                    <div className="ag-theme-quartz agcm-grid agcm-hide-header" style={{ flex: 1, minHeight: 0 }}>
                      <AgGridReact
                        rowData={values}
                        columnDefs={getColDefsFor('values')}
                        defaultColDef={defaultColDef}
                        getRowId={(p) => p.data.id}
                        animateRows
                        rowDragManaged
                        suppressMoveWhenRowDragging
                        context={{ onRemove: (id: string) => removeItemFrom('values', id) }}
                        onGridReady={onGridReadyList('values')}
                        onRowDragEnd={reorderWithin('values')}
                        theme={agGridTheme}
                      />
                    </div>
                  </Box>
                  {/* Pivot Columns (conditional) */}
                  {pivotMode && (
                    <Box
                      sx={{
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        flex: 1,
                        minHeight: '80px',
                        display: 'flex',
                        flexDirection: 'column',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                      }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>Pivot Columns</Typography>
                      <div className="ag-theme-quartz agcm-grid agcm-hide-header" style={{ flex: 1, minHeight: 0 }}>
                        <AgGridReact
                          rowData={pivots}
                          columnDefs={getColDefsFor('pivots')}
                          defaultColDef={defaultColDef}
                          getRowId={(p) => p.data.id}
                          animateRows
                          rowDragManaged
                          suppressMoveWhenRowDragging
                          context={{ onRemove: (id: string) => removeItemFrom('pivots', id) }}
                          onGridReady={onGridReadyList('pivots')}
                          onRowDragEnd={reorderWithin('pivots')}
                          theme={agGridTheme}
                        />
                      </div>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Parent Fields Tab */}
        <Box
          role="tabpanel"
          hidden={currentTab !== 1}>
          {currentTab === 1 && (
            <Stack
              direction="column"
              spacing={2}
              sx={{
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                height: '75vh'
              }}>
              <Typography variant="body2" color="text.secondary">
                Select a parent object to view and add its fields to your grid.
              </Typography>

              {/* Summary chips */}
              {Object.keys(selectionSummary).length > 0 && (
                <Box
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    mb: 1
                  }}>
                  {Object.entries(selectionSummary).map(([parentObj, config]: [string, any]) => (
                    Array.isArray(config?.fields) && config.fields.length > 0 && (
                      <Chip
                        key={parentObj}
                        label={`[${parentObj}] ${config.fields.length} field${config.fields.length !== 1 ? 's' : ''}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )
                  ))}
                </Box>
              )}

              {/* Parent object dropdown */}
              <FormControl fullWidth size="small">
                <InputLabel>Parent Object</InputLabel>
                <Select
                  value={selectedParentObject}
                  onChange={handleParentObjectChange}
                  label="Parent Object"
                >
                  {parentObjectOptions.map((objName) => (
                    <MenuItem key={objName} value={objName}>
                      {objName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Parent fields grid */}
              {selectedParentObject && (
                <Box
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    flexGrow: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    {selectedParentObject} Fields
                  </Typography>
                  {loadingParentMetadata ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                      Loading fields...
                    </Typography>
                  ) : (
                    <>
                      <div className="ag-theme-quartz" style={{ flex: 1, minHeight: 0, height: '500px' }}>
                        <AgGridReact
                          rowData={parentFieldsData}
                          columnDefs={relationFieldsColDefs}
                          defaultColDef={{
                            flex: 1,
                            sortable: true,
                            resizable: true,
                          }}
                          getRowId={(p) => p.data.name}
                          rowSelection={{ mode: 'multiRow' }}
                          onGridReady={(e) => {
                            relationFieldsApi.current = e.api;
                            // Restore selections after grid is ready
                            setTimeout(() => restoreParentFieldSelections(e.api), 50);
                          }}
                          onSelectionChanged={handleParentFieldsSelectionChanged}
                          domLayout="normal"
                          theme={agGridTheme}
                        />
                      </div>
                      <Button
                        variant="contained"
                        onClick={handleSaveParentFields}
                        sx={{ mt: 2, alignSelf: 'flex-start' }}
                      >
                        Save Parent Fields
                      </Button>
                    </>
                  )}
                </Box>
              )}

              {!selectedParentObject && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                  Select a parent object to view and manage parent fields
                </Typography>
              )}
            </Stack>
          )}
        </Box>

        {/* Shared With Me Tab */}
        {isTeamSharingEnabled && (
          <Box
            role="tabpanel"
            hidden={currentTab !== 2}>
            {currentTab === 2 && apiClient && sObjectName && (
              <SharedWithMeTab
                apiClient={apiClient}
                sObjectName={sObjectName}
                onImportView={handleImportView}
                onUpdateView={handleUpdateView}
              />
            )}
          </Box>
        )}
      </DialogContent>

      {/* View Sharing Dialogs */}
      {
        isTeamSharingEnabled && apiClient && (
          <>
            <ShareViewDialog apiClient={apiClient} />
            <ImportViewDialog
              apiClient={apiClient}
              onImportSuccess={handleImportSuccess}
              onRefreshSharedViews={onRefreshSharedViews}
            />
          </>
        )
      }
    </Dialog >
  );
}
