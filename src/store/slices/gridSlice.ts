import { StateCreator } from 'zustand';
import type { GridSlice, Store, GridViewType } from '../types';

export const allGridViewTypes: GridViewType[] = [
  { name: 'gridView', label: 'Grid' },
  { name: 'timeSeriesView', label: 'Time Series' },
  { name: 'treeGrid', label: 'Tree Grid' },
];

const defaultGridPermissions = {
  enableAccentColorPicker: true,
  enableCalculatedColumnWizard: true,
  enableDeploymentWizardAction: true,
  enableFlowWizardAction: true,
  enableGridTypeSelector: true,
  enableObjectPreferencesAction: true,
  enablePermissionsAction: true,
  enablePivoting: true,
  enableQueryBuilderAction: true,
  enableSlack: true,
  enableStylesWizard: true,
  enableTeamSharing: false,
  enableThemeSelector: true,
  enableTimeSeriesGrid: true,
  enableTreeGrid: true,
};

export const createGridSlice: StateCreator<
  Store,
  [['zustand/devtools', never]],
  [],
  GridSlice
> = (set, get) => ({
  // State
  columnDefs: [],
  gridErrors: new Map<string, string>(),
  subgridErrors: new Map<string, string>(),
  gridEditDialogState: { show: false, gridId: null, isSubgrid: false, selectedView: null },
  gridPermissions: defaultGridPermissions,
  gridPermissionsRecId: null,
  gridViewTypes: allGridViewTypes,
  selectedGridType: { name: 'gridView', label: 'Grid' },
  showGridViewTypes: true,
  objGridPreference: { lastViewId: null, lastQueryId: null, gridPreferenceRecId: null },

  // Calculated columns
  objCalculatedColumns: [],
  objCalculatedSubgridColumns: [],
  selectedCalculatedColumn: null,
  selectedSubgridCalculatedColumn: null,
  showCalculatedColumnPanel: false,
  showSubgridCalculatedColumnPanel: false,

  // Column/Row styles
  objColumnStyles: [],
  objRowStyles: [],
  objSubgridColumnStyles: [],
  objSubgridRowStyles: [],
  selectedColumnStyle: null,
  selectedRowStyle: null,
  selectedSubgridColumnStyle: null,
  selectedSubgridRowStyle: null,
  showColumnStylePanel: false,
  showSubgridColumnStylePanel: false,

  // Custom panel props
  customStylePanelProps: null,
  customCalculatedColumnPanelProps: null,

  // Setters
  setColumnDefs: (cols) => set({ columnDefs: cols }),

  setGridError: (rowId, errorMsg) => set((state) => {
    const newErrors = new Map(state.gridErrors).set(rowId, errorMsg);
    return { gridErrors: newErrors };
  }),

  removeGridError: (rowId) => set((state) => {
    const newErrors = new Map(state.gridErrors);
    newErrors.delete(rowId);
    return { gridErrors: newErrors };
  }),

  clearGridErrors: () => set({ gridErrors: new Map() }),

  setSubgridError: (rowId, errorMsg) => set((state) => {
    const newErrors = new Map(state.subgridErrors).set(rowId, errorMsg);
    return { subgridErrors: newErrors };
  }),

  removeSubgridError: (rowId) => set((state) => {
    const newErrors = new Map(state.subgridErrors);
    newErrors.delete(rowId);
    return { subgridErrors: newErrors };
  }),

  clearSubgridErrors: () => set({ subgridErrors: new Map() }),

  setGridEditDialogState: (state) => set({ gridEditDialogState: state }),
  setGridPermissions: (perms) => set({ gridPermissions: perms }),
  setGridPermissionsRecId: (id) => set({ gridPermissionsRecId: id }),
  setGridViewTypes: (types) => set({ gridViewTypes: types }),
  setSelectedGridType: (type) => set({ selectedGridType: type }),
  setShowGridViewTypes: (val) => set({ showGridViewTypes: val }),

  setObjGridPreference: (pref) => set({ objGridPreference: pref }),

  resetObjGridPreference: () => set({
    objGridPreference: { lastViewId: null, lastQueryId: null, gridPreferenceRecId: null },
  }),

  setLastViewId: (viewId) => set((state) => {
    if (state.objGridPreference.lastViewId === viewId) return state;
    return { objGridPreference: { ...state.objGridPreference, lastViewId: viewId } };
  }),

  setLastQueryId: (queryId) => set((state) => {
    if (state.objGridPreference.lastQueryId === queryId) return state;
    return { objGridPreference: { ...state.objGridPreference, lastQueryId: queryId } };
  }),

  setGridPreferenceRecId: (id) => set((state) => {
    if (state.objGridPreference.gridPreferenceRecId === id) return state;
    return { objGridPreference: { ...state.objGridPreference, gridPreferenceRecId: id } };
  }),

  // Calculated columns
  setObjCalculatedColumns: (cols) => set({ objCalculatedColumns: cols }),
  setObjCalculatedSubgridColumns: (cols) => set({ objCalculatedSubgridColumns: cols }),
  setSelectedCalculatedColumn: (col) => set({ selectedCalculatedColumn: col }),
  setSelectedSubgridCalculatedColumn: (col) => set({ selectedSubgridCalculatedColumn: col }),
  setShowCalculatedColumnPanel: (val) => set({ showCalculatedColumnPanel: val }),
  setShowSubgridCalculatedColumnPanel: (val) => set({ showSubgridCalculatedColumnPanel: val }),

  // Column/Row styles with customStylePanelProps sync
  setObjColumnStyles: (styles) => {
    const state = get();
    if (state.customStylePanelProps && !state.customStylePanelProps.isSubgrid) {
      set({
        objColumnStyles: styles,
        customStylePanelProps: { ...state.customStylePanelProps, objColumnStyles: styles },
      });
    } else {
      set({ objColumnStyles: styles });
    }
  },

  setObjRowStyles: (styles) => {
    const state = get();
    if (state.customStylePanelProps && !state.customStylePanelProps.isSubgrid) {
      set({
        objRowStyles: styles,
        customStylePanelProps: { ...state.customStylePanelProps, objRowStyles: styles },
      });
    } else {
      set({ objRowStyles: styles });
    }
  },

  setObjSubgridColumnStyles: (styles) => {
    const state = get();
    if (state.customStylePanelProps && state.customStylePanelProps.isSubgrid) {
      set({
        objSubgridColumnStyles: styles,
        customStylePanelProps: { ...state.customStylePanelProps, objColumnStyles: styles },
      });
    } else {
      set({ objSubgridColumnStyles: styles });
    }
  },

  setObjSubgridRowStyles: (styles) => {
    const state = get();
    if (state.customStylePanelProps && state.customStylePanelProps.isSubgrid) {
      set({
        objSubgridRowStyles: styles,
        customStylePanelProps: { ...state.customStylePanelProps, objRowStyles: styles },
      });
    } else {
      set({ objSubgridRowStyles: styles });
    }
  },

  setSelectedColumnStyle: (style) => set((state) => {
    const newState: Partial<Store> = { selectedColumnStyle: style };
    if (state.customStylePanelProps && !state.customStylePanelProps.isSubgrid) {
      newState.customStylePanelProps = { ...state.customStylePanelProps, selectedColumnStyle: style };
    }
    return newState;
  }),

  setSelectedRowStyle: (style) => set((state) => {
    const newState: Partial<Store> = { selectedRowStyle: style };
    if (state.customStylePanelProps && !state.customStylePanelProps.isSubgrid) {
      newState.customStylePanelProps = { ...state.customStylePanelProps, selectedRowStyle: style };
    }
    return newState;
  }),

  setSelectedSubgridColumnStyle: (style) => set((state) => {
    const newState: Partial<Store> = { selectedSubgridColumnStyle: style };
    if (state.customStylePanelProps && state.customStylePanelProps.isSubgrid) {
      newState.customStylePanelProps = { ...state.customStylePanelProps, selectedColumnStyle: style };
    }
    return newState;
  }),

  setSelectedSubgridRowStyle: (style) => set((state) => {
    const newState: Partial<Store> = { selectedSubgridRowStyle: style };
    if (state.customStylePanelProps && state.customStylePanelProps.isSubgrid) {
      newState.customStylePanelProps = { ...state.customStylePanelProps, selectedRowStyle: style };
    }
    return newState;
  }),

  setShowColumnStylePanel: (val) => set({ showColumnStylePanel: val }),
  setShowSubgridColumnStylePanel: (val) => set({ showSubgridColumnStylePanel: val }),

  setCustomStylePanelProps: (props) => set({ customStylePanelProps: props }),
  setCustomCalculatedColumnPanelProps: (props) => set({ customCalculatedColumnPanelProps: props }),

  // Grid permissions
  updateGridPermissions: (name, checked) => set((state) => ({
    gridPermissions: { ...state.gridPermissions, [name]: checked },
  })),

  // Grid view types
  enableGridView: (name) => set((state) => {
    if (state.gridViewTypes.some((v) => v.name === name)) return state;
    const view = allGridViewTypes.find((v) => v.name === name);
    if (!view) return state;
    return { gridViewTypes: [...state.gridViewTypes, view] };
  }),

  disableGridView: (name) => set((state) => ({
    gridViewTypes: state.gridViewTypes.filter((v) => v.name !== name),
  })),

  enableAllGridViews: () => set({ gridViewTypes: [...allGridViewTypes] }),
  restoreAllGridViews: () => set({ gridViewTypes: [...allGridViewTypes] }),
});
