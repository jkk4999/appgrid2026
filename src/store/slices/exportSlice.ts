import { StateCreator } from 'zustand';

import type { Store } from '../types';

import type { ExportSlice, ExportTypeOption } from '../types';

export const createExportSlice: StateCreator<
  Store,
  [['zustand/devtools', never]],
  [],
  ExportSlice
> = (set) => ({
  // State
  selectedExportType: null,

  // Setters
  setSelectedExportType: (exportType: ExportTypeOption | null) =>
    set({ selectedExportType: exportType })
});
