/**
 * Domain-specific selector hooks for Zustand store.
 *
 * These hooks provide focused subsets of the global store state,
 * improving performance and code clarity by:
 * - Reducing the number of state properties each component subscribes to
 * - Providing type-safe, domain-specific APIs
 * - Handling main grid vs subgrid differences internally
 *
 * ## Unified Context-Based Hooks
 *
 * All hooks use a `GridContext` parameter ('main' | 'subgrid') to select
 * which state slice to access. This is clean, type-safe, and maintainable.
 *
 * ```tsx
 * import { useViewState, useFilterState, type GridContext } from './selectors';
 *
 * // In main grid
 * const { selectedView, setSelectedView } = useViewState('main');
 *
 * // In subgrid
 * const { selectedView, setSelectedView } = useViewState('subgrid');
 *
 * // In shared component that receives context as prop
 * function SharedComponent({ context }: { context: GridContext }) {
 *   const { selectedView } = useViewState(context);
 * }
 * ```
 */

// ============================================================
// TYPES
// ============================================================

export type { GridContext } from './types';
export type {
  ViewState,
  ViewStateActions,
  ViewStateWithActions,
  FilterState,
  FilterStateActions,
  FilterStateWithActions,
  PivotState,
  PivotStateActions,
  PivotStateWithActions,
  GridTypeState,
  GridTypeStateActions,
  GridTypeStateWithActions,
  DialogState,
  DialogStateActions,
  DialogStateWithActions,
  StyleState,
  StyleStateActions,
  StyleStateWithActions,
  CalculatedColumnState,
  CalculatedColumnStateActions,
  CalculatedColumnStateWithActions,
  ErrorState,
  ErrorStateActions,
  ErrorStateWithActions,
} from './types';

// ============================================================
// SIMPLIFIED CONTEXT-BASED HOOKS (new pattern)
// ============================================================

// View/Filter/Pivot state
export {
  useViewState,
  useMainViewState,
  useSubgridViewState,
  useFilterState,
  useMainFilterState,
  useSubgridFilterState,
  usePivotState,
  useMainPivotState,
  useSubgridPivotState,
  useViewRetrievalState,
} from './useViewState';

// Style state (column/row styling)
export {
  useStyleState,
  useMainStyleState,
  useSubgridStyleState,
  useStyleData,
  useMainStyleData,
  useSubgridStyleData,
} from './useStyleState';

// Dialog state
export {
  useDialogState,
  useMainDialogState,
  useSubgridDialogState,
  useSharedDialogState,
} from './useDialogState';

// Calculated column state
export {
  useCalculatedColumnState,
  useMainCalculatedColumnState,
  useSubgridCalculatedColumnState,
  useCalculatedColumnData,
  useMainCalculatedColumnData,
  useSubgridCalculatedColumnData,
} from './useCalculatedColumnState';

// Grid type state
export {
  useGridTypeState,
  useMainGridTypeState,
  useSubgridGridTypeState,
  useGridViewTypesConfig,
  useGridGridTypeState, // Legacy alias
} from './useGridTypeState';

// Error state
export {
  useErrorState,
  useMainErrorState,
  useSubgridErrorState,
  useErrorStateWithHelpers,
  useMainErrorStateWithHelpers,
  useSubgridErrorStateWithHelpers,
} from './useErrorState';

// Chart state
export {
  useChartState,
  useMainChartState,
  useSubgridChartState,
  useChartDisplay,
} from './useChartState';

// Flow state
export {
  useFlowState,
  useMainFlowState,
  useSubgridFlowState,
  useFlowConfig,
} from './useFlowState';

// Metadata state
export {
  useMetadataState,
  useMainMetadataState,
  useSubgridMetadataState,
  useOrgMetadata,
  useRecordTypeState,
} from './useMetadataState';

// ============================================================
// LEGACY EXPORTS (backward compatibility)
// ============================================================

// Legacy view state hooks (useGridViewState pattern)
export {
  useGridViewState,
  useGridFilterState,
  useGridPivotState,
  useGridViewFilterPivotState,
} from './useGridViewState';

// Legacy dialog state hook
export { useGridDialogState } from './useGridDialogState';

// Legacy style state hooks
export { useGridStyleState, useGridStyleData } from './useGridStyleState';

// Legacy calculated column state hooks
export {
  useGridCalculatedColumnState,
  useGridCalculatedColumnData,
} from './useGridCalculatedColumnState';

// Legacy error state hooks
export {
  useGridErrorState,
  useMainGridErrorState,
  useGridErrors,
  useSubgridErrors,
  useGridContextErrorState,
  useGridContextErrors,
} from './useGridErrorState';

// UI state (loading, theme, permissions, dialogs)
export {
  useUIState,
  useThemeState,
  useQueryState,
  useGridPermissions,
  useGridPreferenceState,
  useDebugState,
  useRecordTypeState as useRecordTypeUI,
  useChartDisplay as useChartDisplayUI,
  useFlowConfig as useFlowConfigUI,
} from './useUIState';
