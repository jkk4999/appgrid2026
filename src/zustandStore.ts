/**
 * @deprecated This file is maintained for backwards compatibility.
 * Import from './store' instead for new code.
 *
 * The store has been refactored into domain-specific slices:
 * - src/store/slices/exportSlice.ts
 * - src/store/slices/themeSlice.ts
 * - src/store/slices/viewSlice.ts
 * - src/store/slices/subgridSlice.ts
 * - src/store/slices/dialogSlice.ts
 * - src/store/slices/metadataSlice.ts
 * - src/store/slices/gridSlice.ts
 * - src/store/slices/chartSlice.ts
 * - src/store/slices/flowSlice.ts
 * - src/store/slices/slackSlice.ts
 * - src/store/slices/schedulerSlice.ts
 * - src/store/slices/ganttSlice.ts
 * - src/store/slices/treeGridSlice.ts
 * - src/store/slices/querySlice.ts
 * - src/store/slices/uiSlice.ts
 */

// Re-export everything from the new store location
export * from './store';
export { useStore, useStore as default } from './store';

// Re-export types that were previously defined here
export type { FilterHierarchyMode, GanttViewType } from './store/types';
