# Zustand State Management Architecture

This document explains the design and implementation of the Zustand state management system in the AppGrid application, including the slice pattern for organizing state and the selector hooks pattern for consuming state.

## Table of Contents

1. [Overview](#overview)
2. [Why Zustand?](#why-zustand)
3. [Store Architecture](#store-architecture)
4. [Slice Pattern](#slice-pattern)
5. [Selector Hooks Pattern](#selector-hooks-pattern)
6. [Best Practices](#best-practices)
7. [Migration Guide](#migration-guide)

---

## Overview

The AppGrid application uses Zustand for global state management. The state is organized into **slices** (logical groupings of related state) and consumed through **selector hooks** (optimized accessors that handle main/subgrid context).

```
┌─────────────────────────────────────────────────────────────┐
│                      Zustand Store                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  View   │ │  Chart  │ │  Flow   │ │  Grid   │  ...      │
│  │  Slice  │ │  Slice  │ │  Slice  │ │  Slice  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Selector Hooks                          │
├─────────────────────────────────────────────────────────────┤
│  useViewState()  useChartState()  useFlowState()  ...      │
│  - Performance optimized (useShallow)                       │
│  - Main/subgrid context handling                            │
│  - Consistent property naming                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Components                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Why Zustand?

Zustand was chosen over alternatives (Redux, MobX, Context API) for several reasons:

| Feature        | Zustand   | Redux | Context API   |
| -------------- | --------- | ----- | ------------- |
| Boilerplate    | Minimal   | High  | Medium        |
| Bundle size    | ~2KB      | ~7KB  | 0 (built-in)  |
| DevTools       | Yes       | Yes   | Limited       |
| Performance    | Excellent | Good  | Poor at scale |
| Learning curve | Low       | High  | Low           |
| Middleware     | Yes       | Yes   | Manual        |

### Key Benefits

1. **Minimal boilerplate** - No action creators, reducers, or dispatch functions
2. **Direct mutations** - State updates are simple function calls
3. **TypeScript support** - Excellent type inference
4. **Selective subscriptions** - Components only re-render when their specific state changes
5. **DevTools integration** - Full Redux DevTools support for debugging

---

## Store Architecture

### Store Location

```
react/src/
├── zustandStore.ts          # Main store creation
└── store/
    ├── types.ts             # All slice type definitions
    ├── typeUtils.ts         # Type utilities (WithSetters<T>)
    ├── createSlice.ts       # Slice creation helper
    └── slices/
        ├── viewSlice.ts
        ├── chartSlice.ts
        ├── flowSlice.ts
        ├── gridSlice.ts
        ├── subgridSlice.ts
        ├── metadataSlice.ts
        ├── dialogSlice.ts
        ├── themeSlice.ts
        ├── querySlice.ts
        ├── exportSlice.ts
        ├── slackSlice.ts
        ├── schedulerSlice.ts
        ├── ganttSlice.ts
        ├── treeGridSlice.ts
        ├── uiSlice.ts
        └── confirmationDialogSlice.ts
```

### Store Creation

The store is created in `zustandStore.ts` by combining all slices:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createViewSlice } from './store/slices/viewSlice';
import { createChartSlice } from './store/slices/chartSlice';
// ... other imports

const useStore = create<Store>()(
  devtools(
    (...args) => ({
      ...createViewSlice(...args),
      ...createChartSlice(...args),
      ...createFlowSlice(...args)
      // ... other slices
    }),
    { name: 'AppGridStore' }
  )
);

export default useStore;
```

---

## Slice Pattern

### What is a Slice?

A **slice** is a logical grouping of related state and its setters. Each slice manages a specific domain of the application (views, charts, flows, etc.).

### Slice Structure

Each slice contains:

1. **State properties** - The actual data
2. **Setters** - Functions to update the state
3. **Custom actions** (optional) - Complex operations involving multiple state updates

### Creating a Slice

#### Simple Slices (Auto-generated Setters)

For slices with straightforward setters, use the `createSliceWithSetters` helper:

```typescript
// store/slices/dialogSlice.ts
import { createSliceWithSetters } from '../createSlice';

const dialogState = {
  showDeleteRecordDialog: false,
  showDeleteViewDialog: false,
  showCloneViewDialog: false,
  showSaveViewDialog: false,
  showApexCodeViewerDialog: false
  // ... more boolean flags
};

export const createDialogSlice = createSliceWithSetters(dialogState);
```

This automatically generates setters like `setShowDeleteRecordDialog`, `setShowDeleteViewDialog`, etc.

#### Type Definition with Auto-generated Setters

```typescript
// store/types.ts
import type { WithSetters } from './typeUtils';

interface DialogState {
  showDeleteRecordDialog: boolean;
  showDeleteViewDialog: boolean;
  // ...
}

// Automatically adds setter types
export type DialogSlice = WithSetters<DialogState>;
// Results in:
// {
//   showDeleteRecordDialog: boolean;
//   setShowDeleteRecordDialog: (value: boolean) => void;
//   showDeleteViewDialog: boolean;
//   setShowDeleteViewDialog: (value: boolean) => void;
//   ...
// }
```

#### Complex Slices (Custom Logic)

For slices that need custom setter logic, use the hybrid approach:

```typescript
// store/slices/viewSlice.ts
import { createSliceWithSetters } from '../createSlice';
import { normalizeViewRecord, normalizeViewArray } from '../../utils/viewUtils';

const viewState = {
  selectedView: null as SObjectView | null,
  viewOptions: null as SObjectView[] | null,
  selectedViewProcessed: false,
  selectedViewRecordId: ''
  // ...
};

export const createViewSlice = createSliceWithSetters(viewState, (set) => ({
  // Override auto-generated setters with custom logic
  setSelectedView: (view: SObjectView | null) =>
    set({ selectedView: normalizeViewRecord(view) }),

  setViewOptions: (options: SObjectView[] | null) =>
    set({
      viewOptions: options == null ? null : normalizeViewArray(options) || []
    })
}));
```

#### Manual Slices (Full Control)

For complex slices with Map/Set operations or compound actions, define manually:

```typescript
// store/slices/gridSlice.ts
import { StateCreator } from 'zustand';
import type { Store, GridSlice } from '../types';

export const createGridSlice: StateCreator<
  Store,
  [['zustand/devtools', never]],
  [],
  GridSlice
> = (set, get) => ({
  // State
  gridErrors: new Map<string, string>(),
  columnDefs: [],

  // Custom actions for Map operations
  setGridError: (rowId: string, error: string) => {
    const newErrors = new Map(get().gridErrors);
    newErrors.set(rowId, error);
    set({ gridErrors: newErrors });
  },

  removeGridError: (rowId: string) => {
    const newErrors = new Map(get().gridErrors);
    newErrors.delete(rowId);
    set({ gridErrors: newErrors });
  },

  clearGridErrors: () => set({ gridErrors: new Map() })

  // ... other state and setters
});
```

### Main Grid vs Subgrid State

The application maintains parallel state for the main grid and subgrid. This is handled by having separate properties in the store:

```typescript
// Main grid state
selectedView: SObjectView | null;
selectedChart: ChartOption | null;
objColumnStyles: AgColumnStyle[];

// Subgrid state (parallel)
selectedSubgridView: SObjectView | null;
selectedSubgridChart: ChartOption | null;
objSubgridColumnStyles: AgColumnStyle[];
```

---

## Selector Hooks Pattern

### Why Selector Hooks?

Using the store directly has several problems:

```typescript
// PROBLEM 1: Re-renders on ANY state change
const { selectedChart, selectedView, loading, ... } = useStore();

// PROBLEM 2: Must know about main/subgrid naming
const chart = isSubgrid ? state.selectedSubgridChart : state.selectedChart;

// PROBLEM 3: Inconsistent property names in store
state.objCharts           // "obj" prefix
state.selectedSubgridChart // "Subgrid" in middle
state.objSubgridColumnStyles // Both!
```

Selector hooks solve all these problems.

### Selector Hook Location

```
react/src/hooks/selectors/
├── index.ts                      # All exports
├── types.ts                      # Type definitions
├── createSelector.ts             # Factory utilities
├── useViewState.ts               # View/filter/pivot hooks
├── useChartState.ts              # Chart hooks
├── useFlowState.ts               # Flow hooks
├── useMetadataState.ts           # Metadata hooks
├── useStyleState.ts              # Column/row style hooks
├── useDialogState.ts             # Dialog visibility hooks
├── useCalculatedColumnState.ts   # Calculated column hooks
├── useGridTypeState.ts           # Grid type selection hooks
├── useErrorState.ts              # Error state hooks
├── useUIState.ts                 # UI state hooks
└── [legacy files]                # Backward compatibility
```

### Creating Selector Hooks

#### Using the Factory (Recommended)

The `createContextHooks` factory creates hooks with automatic main/subgrid handling:

```typescript
// hooks/selectors/useChartState.ts
import { createContextHooks, createSimpleHook } from './createSelector';

// Define property mapping: generic name -> store property names
const chartHooks = createContextHooks({
  charts: { main: 'objCharts', subgrid: 'objSubgridCharts' },
  selectedChart: { main: 'selectedChart', subgrid: 'selectedSubgridChart' },
  showSaveChartDialog: {
    main: 'showSaveChartDialog',
    subgrid: 'showSaveChartSubgridDialog'
  },
  useAllChartData: {
    main: 'useAllChartData',
    subgrid: 'useAllSubgridChartData'
  }
});

// Export context-aware hook
export const useChartState = chartHooks.useHook;

// Export dedicated hooks (no parameter needed)
export const useMainChartState = chartHooks.useMainHook;
export const useSubgridChartState = chartHooks.useSubgridHook;

// Shared state (same for main/subgrid)
export const useChartDisplay = createSimpleHook([
  'chartInfo',
  'chartOptions',
  'showCharts',
  'showChartDialog'
]);
```

#### What the Factory Generates

The factory automatically:

1. Creates pre-bound selectors for referential stability
2. Maps generic names to store property names
3. Auto-generates setter names (`charts` → `setCharts`)
4. Uses `useShallow` for performance optimization
5. Supports both `GridContext` and boolean parameters

```typescript
// Generated hook behavior
const { charts, setCharts, selectedChart, setSelectedChart } =
  useChartState('main');
// OR (legacy boolean support)
const { charts, setCharts } = useChartState(false); // false = main, true = subgrid
```

### Hook Usage Patterns

#### Context-Aware Hook

```typescript
function ChartToolbar({ context }: { context: GridContext }) {
  // Works for both main grid and subgrid
  const { selectedChart, setSelectedChart, charts } = useChartState(context);

  return (
    <Select
      value={selectedChart}
      onChange={setSelectedChart}
      options={charts}
    />
  );
}
```

#### Dedicated Hooks (No Parameter)

```typescript
// Main grid component - always uses main state
function MainGridChartPanel() {
  const { selectedChart, charts } = useMainChartState();
  // ...
}

// Subgrid component - always uses subgrid state
function SubgridChartPanel() {
  const { selectedChart, charts } = useSubgridChartState();
  // ...
}
```

#### Shared State Hook

```typescript
// Shared state doesn't differ between contexts
function ChartSettingsDialog() {
  const { showChartDialog, setShowChartDialog, chartOptions } =
    useChartDisplay();
  // ...
}
```

### Performance Benefits

Selector hooks use `useShallow` from Zustand to prevent unnecessary re-renders:

```typescript
// WITHOUT useShallow - re-renders on ANY store change
const state = useStore();

// WITH useShallow - only re-renders when selected properties change
const { selectedChart, charts } = useStore(
  useShallow((state) => ({
    selectedChart: state.selectedChart,
    charts: state.objCharts
  }))
);
```

The factory handles this automatically - you don't need to think about it.

---

## Best Practices

### DO

1. **Use selector hooks in components**

   ```typescript
   const { selectedView, setSelectedView } = useViewState('main');
   ```

2. **Use dedicated hooks when context is known**

   ```typescript
   // In a component that's always main grid
   const { selectedView } = useMainViewState();
   ```

3. **Group related state access**

   ```typescript
   // Good - one hook for related state
   const { charts, selectedChart, setSelectedChart } = useChartState(context);
   ```

4. **Use `useStore.getState()` in event handlers**
   ```typescript
   const handleSave = () => {
     const { selectedView, columnDefs } = useStore.getState();
     // ... save logic
   };
   ```

### DON'T

1. **Don't use the store directly in render**

   ```typescript
   // Bad - causes re-renders on any state change
   const { selectedChart, selectedView, loading, ... } = useStore();
   ```

2. **Don't destructure more than you need**

   ```typescript
   // Bad - subscribes to everything
   const state = useChartState('main');
   const chart = state.selectedChart;

   // Good - only subscribes to what you use
   const { selectedChart } = useChartState('main');
   ```

3. **Don't create selectors inline**

   ```typescript
   // Bad - creates new selector every render
   const chart = useStore((state) => state.selectedChart);

   // Good - use pre-created selector hooks
   const { selectedChart } = useChartState('main');
   ```

---

## Migration Guide

### From Direct Store Access

Before:

```typescript
const { selectedChart, setSelectedChart, objCharts, setObjCharts } = useStore();

const chart = isSubgrid ? selectedSubgridChart : selectedChart;
```

After:

```typescript
const { selectedChart, setSelectedChart, charts, setCharts } = useChartState(
  isSubgrid ? 'subgrid' : 'main'
);
```

### From Boolean to GridContext

Before:

```typescript
const chartState = useChartState(false); // false = main
const chartState = useChartState(true); // true = subgrid
```

After:

```typescript
const chartState = useChartState('main');
const chartState = useChartState('subgrid');
```

Note: Boolean parameters still work for backward compatibility.

### Creating a New Selector Hook

1. Add property mapping to define main/subgrid property names
2. Use `createContextHooks` for context-aware state
3. Use `createSimpleHook` for shared state
4. Export from `hooks/selectors/index.ts`

```typescript
// 1. Create the hook file
// hooks/selectors/useMyFeatureState.ts

import { createContextHooks, createSimpleHook } from './createSelector';

const myFeatureHooks = createContextHooks({
  items: { main: 'myItems', subgrid: 'mySubgridItems' },
  selectedItem: { main: 'selectedMyItem', subgrid: 'selectedSubgridMyItem' }
});

export const useMyFeatureState = myFeatureHooks.useHook;
export const useMainMyFeatureState = myFeatureHooks.useMainHook;
export const useSubgridMyFeatureState = myFeatureHooks.useSubgridHook;

// 2. Export from index.ts
export {
  useMyFeatureState,
  useMainMyFeatureState,
  useSubgridMyFeatureState
} from './useMyFeatureState';
```

---

## Summary

| Concept            | Purpose                                      | Location                            |
| ------------------ | -------------------------------------------- | ----------------------------------- |
| **Zustand Store**  | Single source of truth for global state      | `zustandStore.ts`                   |
| **Slices**         | Organize state by domain                     | `store/slices/*.ts`                 |
| **Type Utilities** | Auto-generate setter types                   | `store/typeUtils.ts`                |
| **Slice Helper**   | Auto-generate setter implementations         | `store/createSlice.ts`              |
| **Selector Hooks** | Optimized state access with context handling | `hooks/selectors/*.ts`              |
| **Hook Factory**   | Create selector hooks with minimal code      | `hooks/selectors/createSelector.ts` |

This architecture provides:

- **Performance** - Only re-render when specific state changes
- **Maintainability** - Clear separation of concerns
- **Reusability** - Components work in any context
- **Type Safety** - Full TypeScript support
- **Developer Experience** - Minimal boilerplate, consistent patterns
