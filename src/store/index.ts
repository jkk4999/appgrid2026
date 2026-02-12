import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Import all slice creators
import {
  createExportSlice,
  createThemeSlice,
  createViewSlice,
  createSubgridSlice,
  createDialogSlice,
  createMetadataSlice,
  createGridSlice,
  createChartSlice,
  createFlowSlice,
  createSlackSlice,
  createTreeGridSlice,
  createQuerySlice,
  createUISlice,
  createConfirmationDialogSlice,
  createViewSharingSlice,
  createQuerySharingSlice
} from './slices';

// Import types
import type { Store } from './types';

// Re-export types for convenience
export type { Store } from './types';
export * from './types';

// Re-export slice utilities
export {
  themeColorOptions,
  allGridViewTypes,
  normalizeViewRecord,
  normalizeViewArray
} from './slices';

// Create the combined store
export const useStore = create<Store>()(
  devtools(
    (...a) => ({
      ...createExportSlice(...a),
      ...createThemeSlice(...a),
      ...createViewSlice(...a),
      ...createSubgridSlice(...a),
      ...createDialogSlice(...a),
      ...createMetadataSlice(...a),
      ...createGridSlice(...a),
      ...createChartSlice(...a),
      ...createFlowSlice(...a),
      ...createSlackSlice(...a),
      ...createTreeGridSlice(...a),
      ...createQuerySlice(...a),
      ...createUISlice(...a),
      ...createConfirmationDialogSlice(...a),
      ...createViewSharingSlice(...a),
      ...createQuerySharingSlice(...a)
    }),
    { name: 'AppGridStore' }
  )
);

export default useStore;
