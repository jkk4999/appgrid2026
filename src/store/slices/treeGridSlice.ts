import { StateCreator } from 'zustand';
import type { TreeGridSlice, Store } from '../types';

export const createTreeGridSlice: StateCreator<
  Store,
  [['zustand/devtools', never]],
  [],
  TreeGridSlice
> = (set) => ({
  // State
  treegridParentIdField: 'AppGridAg__ParentId__c',
  treeGridPref: null,
  treeGridPreferences: null,
  treeGridPreferenceRecId: '',
  treeGridState: null,
  subgridTreeGridPreferences: null,
  subgridTreeGridPreferenceRecId: '',
  subgridTreeGridPrefsByRelation: {},
  showTreegridConfigPanel: false,

  // Setters
  setTreegridParentIdField: (field) => set({ treegridParentIdField: field }),
  setTreeGridPref: (pref) => set({ treeGridPref: pref }),
  setTreeGridPreferences: (prefs) => set({ treeGridPreferences: prefs }),
  setTreeGridPreferenceRecId: (id) => set({ treeGridPreferenceRecId: id }),
  setTreeGridState: (state) => set({ treeGridState: state }),
  setShowTreegridConfigPanel: (val) => set({ showTreegridConfigPanel: val }),

  setSubgridTreeGridPreferences: (prefs, relationName) => set((state) => {
    const relationKey = relationName || state.activeRelationName || '';
    if (!relationKey) {
      return { subgridTreeGridPreferences: prefs };
    }
    const existing = state.subgridTreeGridPrefsByRelation[relationKey] || { prefs: null, recId: '' };
    const nextMap = {
      ...state.subgridTreeGridPrefsByRelation,
      [relationKey]: { ...existing, prefs },
    };
    const isActive = relationKey === (state.activeRelationName || '');
    return {
      subgridTreeGridPrefsByRelation: nextMap,
      subgridTreeGridPreferences: isActive ? prefs : state.subgridTreeGridPreferences,
    };
  }),

  setSubgridTreeGridPreferenceRecId: (id, relationName) => set((state) => {
    const relationKey = relationName || state.activeRelationName || '';
    if (!relationKey) {
      return { subgridTreeGridPreferenceRecId: id };
    }
    const existing = state.subgridTreeGridPrefsByRelation[relationKey] || { prefs: null, recId: '' };
    const nextMap = {
      ...state.subgridTreeGridPrefsByRelation,
      [relationKey]: { ...existing, recId: id || '' },
    };
    const isActive = relationKey === (state.activeRelationName || '');
    return {
      subgridTreeGridPrefsByRelation: nextMap,
      subgridTreeGridPreferenceRecId: isActive ? id || '' : state.subgridTreeGridPreferenceRecId,
    };
  }),
});
