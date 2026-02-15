import { StateCreator } from 'zustand';
import type { SubgridSlice, Store } from '../types';
import { normalizeViewRecord, normalizeViewArray } from './viewSlice';

/**
 * Subgrid Slice
 *
 * Fully functional-update-safe slice.
 */
export const createSubgridSlice: StateCreator<
  Store,
  [['zustand/devtools', never]],
  [],
  SubgridSlice
> = (set) => ({
  // ============================================================
  // STATE
  // ============================================================
  selectedSubgridView: null,
  subgridViewOptions: [],
  subgridViewByRelation: {},
  subgridViewOptionsByRelation: {},
  selectedSubgridFilter: null,
  subgridFilterOptions: [],
  isSubgridFilterActive: false,
  showSubgridAdvancedFilter: false,
  subgridPivotMode: false,
  selectedSubgridType: { name: 'gridView', label: 'Grid' },
  selectedSubgridObject: null,
  selectedSubgridObjMetadata: null,
  activeRelationName: undefined,
  subgridGridPrefIdByRelation: {},
  subgridPrefsLoadedByRelation: {},

  // ============================================================
  // SETTERS - functional update safe
  // ============================================================
  setSelectedSubgridView: (updater) =>
    set((state) => ({
      ...state,
      selectedSubgridView: normalizeViewRecord(
        typeof updater === 'function'
          ? updater(state.selectedSubgridView)
          : updater
      )
    })),

  setSubgridViewOptions: (updater) =>
    set((state) => ({
      ...state,
      subgridViewOptions:
        typeof updater === 'function'
          ? updater(state.subgridViewOptions)
          : normalizeViewArray(updater) || []
    })),

  setSelectedSubgridFilter: (updater) =>
    set((state) => ({
      ...state,
      selectedSubgridFilter:
        typeof updater === 'function'
          ? updater(state.selectedSubgridFilter)
          : updater
    })),

  setSubgridFilterOptions: (updater) =>
    set((state) => ({
      ...state,
      subgridFilterOptions:
        typeof updater === 'function'
          ? updater(state.subgridFilterOptions)
          : updater || []
    })),

  setIsSubgridFilterActive: (updater) =>
    set((state) => ({
      ...state,
      isSubgridFilterActive:
        typeof updater === 'function'
          ? updater(state.isSubgridFilterActive)
          : updater
    })),

  setShowSubgridAdvancedFilter: (updater) =>
    set((state) => ({
      ...state,
      showSubgridAdvancedFilter:
        typeof updater === 'function'
          ? updater(state.showSubgridAdvancedFilter)
          : updater
    })),

  setSubgridPivotMode: (updater) =>
    set((state) => ({
      ...state,
      subgridPivotMode:
        typeof updater === 'function'
          ? updater(state.subgridPivotMode)
          : updater
    })),

  setSelectedSubgridType: (updater) =>
    set((state) => ({
      ...state,
      selectedSubgridType:
        typeof updater === 'function'
          ? updater(state.selectedSubgridType)
          : updater
    })),

  setSelectedSubgridObject: (updater) =>
    set((state) => ({
      ...state,
      selectedSubgridObject:
        typeof updater === 'function'
          ? updater(state.selectedSubgridObject)
          : updater
    })),

  setSelectedSubgridObjMetadata: (updater) =>
    set((state) => ({
      ...state,
      selectedSubgridObjMetadata:
        typeof updater === 'function'
          ? updater(state.selectedSubgridObjMetadata)
          : updater
    })),

  setActiveRelationName: (updater) =>
    set((state) => ({
      ...state,
      activeRelationName:
        typeof updater === 'function'
          ? updater(state.activeRelationName)
          : updater
    })),

  // ============================================================
  // Per-relation setters
  // ============================================================
  setSubgridViewForRelation: (relationName, updater) =>
    set((state) => ({
      ...state,
      subgridViewByRelation: {
        ...state.subgridViewByRelation,
        [relationName]: normalizeViewRecord(
          typeof updater === 'function'
            ? updater(state.subgridViewByRelation[relationName] || null)
            : updater
        )
      }
    })),

  setSubgridViewOptionsForRelation: (relationName, updater) =>
    set((state) => {
      const prevOptions =
        state.subgridViewOptionsByRelation[relationName] || [];
      return {
        ...state,
        subgridViewOptionsByRelation: {
          ...state.subgridViewOptionsByRelation,
          [relationName]:
            typeof updater === 'function'
              ? updater(prevOptions)
              : normalizeViewArray(updater) || []
        }
      };
    }),

  setSubgridGridPrefIdByRelation: (relationName, updater) =>
    set((state) => ({
      ...state,
      subgridGridPrefIdByRelation: {
        ...state.subgridGridPrefIdByRelation,
        [relationName]:
          typeof updater === 'function'
            ? updater(state.subgridGridPrefIdByRelation[relationName])
            : updater
      }
    })),

  setSubgridPrefsLoadedByRelation: (relationName, updater) =>
    set((state) => ({
      ...state,
      subgridPrefsLoadedByRelation: {
        ...state.subgridPrefsLoadedByRelation,
        [relationName]:
          typeof updater === 'function'
            ? updater(state.subgridPrefsLoadedByRelation[relationName])
            : updater
      }
    }))
});
