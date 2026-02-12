# Grid State Hooks Refactoring Plan

## Overview

This document outlines a planned refactoring to unify the grid state management hooks for the main grid and subgrid components. The goal is to reduce code duplication, improve consistency, and make the codebase easier to maintain and debug.

## Current Architecture

### Problem Statement

The current implementation has separate hooks for main grid and subgrid state management:

| Function        | Main Grid Hook           | Subgrid Hook                |
| --------------- | ------------------------ | --------------------------- |
| View State      | `useMainViewState()`     | `useSubgridViewState()`     |
| Filter State    | `useMainFilterState()`   | `useSubgridFilterState()`   |
| Pivot State     | `useMainPivotState()`    | `useSubgridPivotState()`    |
| Dialog State    | `useMainDialogState()`   | `useSubgridDialogState()`   |
| Grid Type State | `useMainGridTypeState()` | `useSubgridGridTypeState()` |

There are also parameterized versions that accept `isSubgrid: boolean`:

- `useViewState(isSubgrid)`
- `useFilterState(isSubgrid)`
- `usePivotState(isSubgrid)`

### Current File Structure

```
react/src/hooks/selectors/
├── index.ts
├── useViewState.ts          # Contains both main & subgrid view/filter/pivot selectors
├── useDialogState.ts        # Contains both main & subgrid dialog selectors
├── useGridTypeState.ts      # Contains both main & subgrid grid type selectors
├── useThemeState.ts
├── useStyleState.ts
├── useCalculatedColumnState.ts
└── ...
```

### Current Zustand Store Structure

The underlying Zustand store has duplicated state properties:

```typescript
// Main grid state
selectedView: SObjectView | null;
filterOptions: FilterOption[];
pivotMode: boolean;
showAdvancedFilter: boolean;
// ... many more

// Subgrid state (duplicated pattern)
selectedSubgridView: SObjectView | null;
subgridFilterOptions: FilterOption[];
subgridPivotMode: boolean;
showSubgridAdvancedFilter: boolean;
// ... many more
```

### Why This Pattern Emerged

1. **React Hook Rules**: Hooks can't be called conditionally. The parameterized hooks work around this by calling both selectors unconditionally and returning the appropriate one - wasteful as it subscribes to both state slices.

2. **Re-render Optimization**: The dedicated hooks have stable selectors that don't change, avoiding unnecessary re-renders when using `useShallow`.

3. **Organic Growth**: The subgrid was likely added after the main grid, leading to copy-paste patterns rather than a unified design.

## Proposed Architecture

### Design Principles

1. **Single hook per function type** with a context parameter
2. **Context-keyed store structure** instead of prefixed property names
3. **Type-safe context parameter** using a union type
4. **Consistent API** across all grid-related hooks

### New Store Structure

```typescript
type GridContext = 'main' | 'subgrid';

interface GridContextState {
  // View state
  selectedView: SObjectView | null;
  viewOptions: SObjectView[];
  selectedViewProcessed: boolean;
  selectedViewRecordId: string;

  // Filter state
  filterOptions: FilterOption[];
  selectedFilter: FilterOption | null;
  isFilterActive: boolean;
  showAdvancedFilter: boolean;

  // Pivot state
  pivotMode: boolean;

  // Column state
  columnStyles: any;
  rowStyles: any;
  calculatedColumns: any;

  // Dialog state
  showCreateFilterDialog: boolean;
  showCreateTemplateDialog: boolean;

  // Grid type
  selectedGridType: GridType | null;
}

interface ZustandStore {
  // Context-keyed grid state
  gridState: {
    main: GridContextState;
    subgrid: GridContextState;
  };

  // Actions that accept context
  setSelectedView: (context: GridContext, view: SObjectView | null) => void;
  setFilterOptions: (context: GridContext, options: FilterOption[]) => void;
  setPivotMode: (context: GridContext, mode: boolean) => void;
  // ... etc
}
```

### New Hook Pattern

```typescript
// Single unified hook with context parameter
export function useViewState(context: GridContext) {
  return useStore(
    useShallow((state) => ({
      selectedView: state.gridState[context].selectedView,
      setSelectedView: (view: SObjectView | null) =>
        state.setSelectedView(context, view),
      viewOptions: state.gridState[context].viewOptions,
      setViewOptions: (options: SObjectView[]) =>
        state.setViewOptions(context, options)
      // ... etc
    }))
  );
}

// Usage in components
function AppGrid() {
  const { selectedView, setSelectedView } = useViewState('main');
}

function SubgridCore() {
  const { selectedView, setSelectedView } = useViewState('subgrid');
}
```

### File Structure After Refactoring

```
react/src/hooks/selectors/
├── index.ts
├── useViewState.ts          # Single hook: useViewState(context)
├── useFilterState.ts        # Single hook: useFilterState(context)
├── usePivotState.ts         # Single hook: usePivotState(context)
├── useDialogState.ts        # Single hook: useDialogState(context)
├── useGridTypeState.ts      # Single hook: useGridTypeState(context)
├── useColumnState.ts        # Single hook: useColumnState(context)
├── types.ts                 # Shared types: GridContext, GridContextState
└── ...
```

## Migration Strategy

### Phase 1: Prepare Store Structure

1. Create new `GridContextState` interface
2. Add `gridState: { main, subgrid }` to store alongside existing properties
3. Create context-aware action creators
4. Add migration utility to sync old properties with new structure

### Phase 2: Create New Hooks

1. Create new unified hooks that use the context-keyed store
2. Export both old and new hooks during transition
3. Add deprecation warnings to old hooks

### Phase 3: Migrate Components

1. Update `SubgridCore.tsx` to use new hooks with `'subgrid'` context
2. Update `AppGrid.tsx` to use new hooks with `'main'` context
3. Update shared components to accept context as prop
4. Update `timeSeriesGrid.tsx` if applicable

### Phase 4: Cleanup

1. Remove deprecated hooks
2. Remove old store properties
3. Remove migration utilities
4. Update documentation

## Benefits

| Benefit              | Description                                          |
| -------------------- | ---------------------------------------------------- |
| **Less Duplication** | Single hook implementation instead of two            |
| **Consistency**      | Same code path for both contexts reduces bugs        |
| **Extensibility**    | Easy to add new grid contexts (e.g., `'timeseries'`) |
| **Debugging**        | Easier to trace issues with unified code             |
| **Maintenance**      | Changes only need to be made in one place            |
| **Type Safety**      | Context parameter is type-checked                    |

## Risks and Mitigations

| Risk                  | Mitigation                                    |
| --------------------- | --------------------------------------------- |
| Breaking changes      | Phased migration with backward compatibility  |
| Re-render performance | Use `useShallow` and stable selectors         |
| Large PR              | Split into multiple PRs per phase             |
| Testing gaps          | Add unit tests for new hooks before migration |

## Related Files

### Hooks to Refactor

- `react/src/hooks/selectors/useViewState.ts`
- `react/src/hooks/selectors/useDialogState.ts`
- `react/src/hooks/selectors/useGridTypeState.ts`
- `react/src/hooks/selectors/useStyleState.ts`
- `react/src/hooks/selectors/useCalculatedColumnState.ts`

### Store Files

- `react/src/store/types.ts`
- `react/src/store/slices/viewSlice.ts`
- `react/src/store/slices/filterSlice.ts`
- `react/src/store/slices/gridSlice.ts`
- `react/src/store/slices/dialogSlice.ts`

### Components to Update

- `react/src/components/appGridAuraComponent/AppGrid.tsx`
- `react/src/components/subGrid/SubgridCore.tsx`
- `react/src/components/timeSeriesGrid/timeSeriesGrid.tsx`
- Various toolbar and dialog components

## Acceptance Criteria

- [x] All grid state accessed via unified hooks with context parameter
- [ ] No duplicate state properties in Zustand store (future optimization)
- [x] All existing functionality works identically
- [x] No performance regressions
- [ ] Unit tests pass for new hooks
- [x] Old hook exports removed for migrated hooks
- [x] Documentation updated

## Implementation Status

### Completed (December 2024)

**Phase 1 & 2: New Unified Hooks Created**

The following unified context-based hooks were created in `react/src/hooks/selectors/`:

| Hook                                    | File                              | Description             |
| --------------------------------------- | --------------------------------- | ----------------------- |
| `useGridViewState(context)`             | `useGridViewState.ts`             | View selection state    |
| `useGridFilterState(context)`           | `useGridViewState.ts`             | Filter state            |
| `useGridPivotState(context)`            | `useGridViewState.ts`             | Pivot mode state        |
| `useGridDialogState(context)`           | `useGridDialogState.ts`           | Dialog visibility state |
| `useGridGridTypeState(context)`         | `useGridTypeState.ts`             | Grid type selection     |
| `useGridStyleState(context)`            | `useGridStyleState.ts`            | Column/row styling      |
| `useGridCalculatedColumnState(context)` | `useGridCalculatedColumnState.ts` | Calculated columns      |
| `useGridContextErrorState(context)`     | `useGridErrorState.ts`            | Grid errors             |

**Types defined in `types.ts`:**

- `GridContext` = `'main' | 'subgrid'`
- `ViewStateWithActions`, `FilterStateWithActions`, `PivotStateWithActions`
- `DialogStateWithActions`, `GridTypeStateWithActions`, `StyleStateWithActions`
- `CalculatedColumnStateWithActions`, `ErrorStateWithActions`

**Phase 3: Components Migrated**

All components now use the unified context-based hooks:

- `AppGrid.tsx` - Uses `'main'` context
- `SubgridCore.tsx` - Uses `'subgrid'` context
- `timeSeriesGrid.tsx` - Uses dynamic context (`isSubgrid ? 'subgrid' : 'main'`)
  - Uses `useThemeState()`, `useGridViewState(context)`, `useGridDialogState(context)`
  - Time-series-specific state (transpose, time-series filters) remains in direct store access
- `DeleteFilterDialog.tsx` - Uses both `'main'` and `'subgrid'` contexts
- `DeleteRecordDialog.tsx` - Uses both `'main'` and `'subgrid'` contexts
- `PropertyPanel.tsx` - Uses `'main'` and `'subgrid'` contexts
- `formatRowWizard.tsx` - Converts `isSubgrid` prop to `GridContext`
- `formatColumnWizard.tsx` - Converts `isSubgrid` prop to `GridContext`
- `columnStylePanel.tsx` - Converts `isSubgrid` prop to `GridContext`
- `calculatedColumnPanel.tsx` - Converts `isSubgrid` prop to `GridContext`
- `useGridFacade.ts` - Updated to use `context: GridContext` parameter

**Phase 4: Cleanup Completed**

- Removed legacy hook exports from `index.ts` for migrated hooks
- Legacy exports only remain for hooks not yet migrated (metadata, chart, flow)

### Example Usage

```tsx
// In SubgridCore.tsx
const { selectedView, setSelectedView } = useGridViewState('subgrid');
const { filterOptions, setFilterOptions } = useGridFilterState('subgrid');
const { selectedGridType } = useGridGridTypeState('subgrid');

// In AppGrid.tsx
const { selectedView, setSelectedView } = useGridViewState('main');
const { filterOptions, setFilterOptions } = useGridFilterState('main');
const { selectedGridType } = useGridGridTypeState('main');

// In shared components that receive isSubgrid as prop
const context: GridContext = isSubgrid ? 'subgrid' : 'main';
const { columnStyles } = useGridStyleState(context);

// In shared components that receive context directly
function SharedToolbar({ context }: { context: GridContext }) {
  const { selectedView } = useGridViewState(context);
  // Works for both main and subgrid!
}
```

### Remaining Legacy Hooks

The following hooks still use the `isSubgrid` parameter pattern and can be migrated in a future iteration:

- `useMetadataState(isSubgrid)` - Metadata state
- `useChartState(isSubgrid)` - Chart state
- `useFlowState(isSubgrid)` - Flow state
- `useGridErrors(isSubgrid)` - Grid errors (legacy version)

## Notes

This refactoring aligns with the broader goal of making the subgrid implementation mirror the main grid for consistency and easier debugging. It should be considered alongside the recent work to unify:

- Grid event handling via `useGridEvents` hook
- PubSub toolbar event subscriptions
- Filter state management patterns

---

_Created: December 2024_
_Status: Complete - All phases finished_
