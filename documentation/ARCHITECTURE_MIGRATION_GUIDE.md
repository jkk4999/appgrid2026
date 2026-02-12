# Architecture Guide

This guide explains the new domain-specific hooks architecture.

## Overview

The architecture provides:

1. **GridContext** - Provides grid identity (main vs subgrid) to all child components
2. **Domain-specific selector hooks** - Focused hooks that subscribe to specific state slices
3. **GridStateAccessor** - Unified pattern for accessing main/subgrid state
4. **usePanelManager** - Centralized panel visibility management
5. **useGridFacade** - Composite hook for common grid operations
6. **useGridAssets** - Pre-bound asset accessors (styles, calculated columns)

## Migration Strategy

### Phase 1: Use New Hooks in New Components

For any new components, use the new hooks instead of the old pattern:

```tsx
// OLD PATTERN - Don't use this anymore
const {
  selectedView,
  setSelectedView,
  objColumnStyles,
  setObjColumnStyles
  // ... 50 more properties
} = useStore(
  useShallow((state) => ({
    selectedView: state.selectedView,
    setSelectedView: state.setSelectedView,
    objColumnStyles: state.objColumnStyles,
    setObjColumnStyles: state.setObjColumnStyles
    // ... 50 more properties
  }))
);

// NEW PATTERN - Use this instead
import { useViewState, useStyleState } from '../hooks/selectors';

const { selectedView, setSelectedView } = useViewState(isSubgrid);
const { columnStyles, setColumnStyles } = useStyleState(isSubgrid);
```

### Phase 2: Migrate Existing Components Incrementally

1. Identify components that use the massive `useShallow` selector
2. Replace groups of related properties with the appropriate domain hook
3. Test after each migration step

### Phase 3: Wrap Grid Components in GridProvider

Once hooks are migrated, wrap AppGrid and SubgridCore in GridProvider:

```tsx
import { GridProvider } from '../context/GridContext';

function AppGrid({ ... }) {
  const gridApiRef = useRef<GridApi | null>(null);

  return (
    <GridProvider
      isSubgrid={false}
      gridId="main-grid"
      getGridApi={() => gridApiRef.current}
    >
      {/* Grid content */}
    </GridProvider>
  );
}
```

## Hook Reference

### Domain-Specific Selector Hooks

All hooks accept an `isSubgrid` parameter to automatically select the correct state:

| Hook                                  | Purpose             | Properties                          |
| ------------------------------------- | ------------------- | ----------------------------------- |
| `useViewState(isSubgrid)`             | View selection      | selectedView, viewOptions, etc.     |
| `useFilterState(isSubgrid)`           | Filter management   | filterOptions, selectedFilter, etc. |
| `usePivotState(isSubgrid)`            | Pivot mode          | pivotMode, setPivotMode             |
| `useStyleState(isSubgrid)`            | Column/row styles   | columnStyles, rowStyles, etc.       |
| `useCalculatedColumnState(isSubgrid)` | Calculated columns  | calculatedColumns, etc.             |
| `useMetadataState(isSubgrid)`         | Object metadata     | objMetadata, selectedObject         |
| `useChartState(isSubgrid)`            | Charts              | charts, selectedChart, etc.         |
| `useFlowState(isSubgrid)`             | Flows               | flows, selectedFlow                 |
| `useGridErrors(isSubgrid)`            | Error management    | errors, setError, clearErrors       |
| `useDialogState(isSubgrid)`           | Dialog visibility   | showDeleteRecordDialog, etc.        |
| `useGridTypeState(isSubgrid)`         | Grid type selection | selectedGridType, etc.              |

### Shared State Hooks (No isSubgrid parameter)

| Hook                       | Purpose             |
| -------------------------- | ------------------- |
| `useUIState()`             | Loading state       |
| `useThemeState()`          | Theme selection     |
| `useOrgMetadata()`         | Org-level metadata  |
| `useRecordTypeState()`     | Record types        |
| `useQueryState()`          | Query builder state |
| `useGridPermissions()`     | Grid permissions    |
| `useGridPreferenceState()` | Grid preferences    |
| `useChartDisplay()`        | Chart visibility    |
| `useFlowConfig()`          | Flow configuration  |
| `useDebugState()`          | Debug settings      |

### Panel Manager

```tsx
import { usePanelManager, PanelName } from '../hooks/usePanelManager';

function MyComponent() {
  const panels = usePanelManager();

  // Check if panel is open
  if (panels.isOpen('charts')) { ... }

  // Open/close/toggle panels
  panels.open('queryPanel');
  panels.close('slackPanel');
  panels.toggle('calculatedColumnPanel');

  // Close all panels
  panels.closeAll();

  // Open one panel and close all others
  panels.openExclusive('charts');
}
```

### Grid Assets

```tsx
import useGridAssets from '../hooks/grid/useGridAssets';

function MyComponent({ isSubgrid }) {
  const assets = useGridAssets({ isSubgrid });

  // Get current styles
  const { columns, rows } = assets.getStyles();

  // Update calculated columns
  assets.setCalculatedColumns([...newColumns]);

  // Get filter options
  const filters = assets.getFilterOptions();
}
```

### Grid Facade (Composite Hook)

For components that need many different state types:

```tsx
import { useGridFacade } from '../hooks/useGridFacade';

function MyComponent({ isSubgrid }) {
  const grid = useGridFacade({
    isSubgrid,
    getGridApi: () => gridApiRef.current
  });

  // Access all grid state through the facade
  const { selectedView, columnStyles, calculatedColumns } = grid;

  // Use setters
  grid.setSelectedView(newView);
  grid.setColumnStyles(newStyles);

  // Pre-bound asset functions
  const currentStyles = grid.assets.getStyles();
}
```

### Simplified Grid Persistence

```tsx
import { useSimplifiedGridPersistence } from '../hooks/useSimplifiedGridPersistence';

function MyGridComponent({ isSubgrid }) {
  const {
    saveAgGridState,
    debouncedSaveAgGridState,
    handleGridStateChange,
    suspend,
    resume
  } = useSimplifiedGridPersistence({
    isSubgrid,
    getGridApi: () => gridApiRef.current,
    canSaveNow: () => !!selectedView,
    buildUpsertPayload: (gridState, colState, extras) => ({ ... }),
    doUpsert: async (payload) => apiClient.upsertView(payload),
  });
}
```

## File Locations

| File                                        | Description                    |
| ------------------------------------------- | ------------------------------ |
| `src/context/GridContext.tsx`               | Grid context provider          |
| `src/hooks/selectors/index.ts`              | Domain-specific selector hooks |
| `src/hooks/usePanelManager.ts`              | Panel visibility management    |
| `src/hooks/useGridFacade.ts`                | Composite grid hook            |
| `src/hooks/useSimplifiedGridPersistence.ts` | Simplified persistence hook    |
| `src/hooks/grid/useGridAssets.ts`           | Asset accessors (enhanced)     |
| `src/store/gridStateAccessor.ts`            | Main/subgrid state accessor    |

## Backup Files

All modified files have backups with `_backup` suffix:

- `zustandStore_backup.ts`
- `useGridStatePersistence_backup.ts`
- `useApplyViewState_backup.ts`
- `useGridEvents_backup.ts`
- `useGridAssets_backup.ts`
- `stylesService_backup.ts`
- `calculatedColumnsService_backup.ts`
- `applyViewState_backup.ts`
- `useViewUpserts_backup.ts`
- `types_backup.ts`
- `AppGrid_backup.tsx`
- `SubgridCore_backup.tsx`

To rollback, simply restore from the backup files.
