import { StateCreator } from 'zustand';
import type { UISlice, Store, PanelStateKey } from '../types';

export const createUISlice: StateCreator<
  Store,
  [['zustand/devtools', never]],
  [],
  UISlice
> = (set) => ({
  // ============================================================
  // STATE
  // ============================================================
  loading: true,
  loadingIndicatorText: 'Loading...',
  initialDataLoaded: false,
  showDebugStatements: true,

  // Time series
  transposedColumnOptions: [],
  transposedRowData: [],
  selectedTransposedColumn: null,
  selectedTimeSeriesFilter: null,
  timeSeriesFilterOptions: [],
  isMainTimeSeriesFilterActive: false,
  isSubgridTimeSeriesFilterActive: false,

  // Other panels
  showDeploymentPanel: false,
  showMetadataPanel: false,
  showObjectPrefsPanel: false,
  showPermissionsPanel: false,
  showKanbanConfigPanel: false,

  // View state
  viewStateRecId: '',
  objPreferences: [],

  // ============================================================
  // PANEL TOGGLE
  // ============================================================
  togglePanelState: (panelName: PanelStateKey) =>
    set((state) => {
      // Reset all panels to false
      const newPanels: Partial<Record<PanelStateKey, boolean>> = {};
      (Object.keys(state) as (keyof typeof state)[])
        .filter((key) => key.startsWith('show'))
        .forEach((key) => {
          newPanels[key as PanelStateKey] = false;
        });
      // Toggle the requested panel
      const currentValue = (state as unknown as Record<string, boolean>)[panelName];
      newPanels[panelName] = !currentValue;
      return newPanels;
    }),
  setExclusivePanel: (panelName: PanelStateKey) =>
    set(() => ({
      showCalculatedColumnPanel: panelName === 'showCalculatedColumnPanel',
      showColumnStylePanel: panelName === 'showColumnStylePanel',
      showFlowConfigPanel: panelName === 'showFlowConfigPanel',
      showGanttViewConfigPanel: panelName === 'showGanttViewConfigPanel',
      showGanttViewFilterPanel: panelName === 'showGanttViewFilterPanel',
      showHeatmapConfigPanel: panelName === 'showHeatmapConfigPanel',
      showMetadataPanel: panelName === 'showMetadataPanel',
      showObjectPrefsPanel: panelName === 'showObjectPrefsPanel',
      showPermissionsPanel: panelName === 'showPermissionsPanel',
      showQueryMetricsPanel: panelName === 'showQueryMetricsPanel',
      showSchedulerConfigPanel: panelName === 'showSchedulerConfigPanel',
      showSlackPanel: panelName === 'showSlackPanel',
      showSlackConfigPanel: panelName === 'showSlackConfigPanel',
      showTreegridConfigPanel: panelName === 'showTreegridConfigPanel',
      showDeploymentPanel: panelName === 'showDeploymentPanel',
      showSubgridCalculatedColumnPanel:
        panelName === 'showSubgridCalculatedColumnPanel',
      showSubgridColumnStylePanel:
        panelName === 'showSubgridColumnStylePanel',
    })),

  // ============================================================
  // FUNCTIONAL SETTERS
  // ============================================================
  setLoading: (updater) =>
    set((state) => ({
      loading: typeof updater === 'function' ? updater(state.loading) : updater
    })),
  setLoadingIndicatorText: (updater) =>
    set((state) => ({
      loadingIndicatorText:
        typeof updater === 'function'
          ? updater(state.loadingIndicatorText)
          : updater
    })),
  setInitialDataLoaded: (updater) =>
    set((state) => ({
      initialDataLoaded:
        typeof updater === 'function'
          ? updater(state.initialDataLoaded)
          : updater
    })),
  setShowDebugStatements: (updater) =>
    set((state) => ({
      showDebugStatements:
        typeof updater === 'function'
          ? updater(state.showDebugStatements)
          : updater
    })),

  // Time series setters
  setTransposedColumnOptions: (updater) =>
    set((state) => ({
      transposedColumnOptions:
        typeof updater === 'function'
          ? updater(state.transposedColumnOptions)
          : updater
    })),
  setTransposedRowData: (updater) =>
    set((state) => ({
      transposedRowData:
        typeof updater === 'function'
          ? updater(state.transposedRowData)
          : updater
    })),
  setSelectedTransposedColumn: (updater) =>
    set((state) => ({
      selectedTransposedColumn:
        typeof updater === 'function'
          ? updater(state.selectedTransposedColumn)
          : updater
    })),
  setSelectedTimeSeriesFilter: (updater) =>
    set((state) => ({
      selectedTimeSeriesFilter:
        typeof updater === 'function'
          ? updater(state.selectedTimeSeriesFilter)
          : updater
    })),
  setTimeSeriesFilterOptions: (updater) =>
    set((state) => ({
      timeSeriesFilterOptions:
        typeof updater === 'function'
          ? updater(state.timeSeriesFilterOptions)
          : updater
    })),
  setIsMainTimeSeriesFilterActive: (updater) =>
    set((state) => ({
      isMainTimeSeriesFilterActive:
        typeof updater === 'function'
          ? updater(state.isMainTimeSeriesFilterActive)
          : updater
    })),
  setIsSubgridTimeSeriesFilterActive: (updater) =>
    set((state) => ({
      isSubgridTimeSeriesFilterActive:
        typeof updater === 'function'
          ? updater(state.isSubgridTimeSeriesFilterActive)
          : updater
    })),

  addTimeSeriesFilterOption: (option) =>
    set((state) => ({
      timeSeriesFilterOptions: [...state.timeSeriesFilterOptions, option]
    })),

  deleteTimeSeriesFilterOption: (name) =>
    set((state) => ({
      timeSeriesFilterOptions: state.timeSeriesFilterOptions.filter(
        (o) => o.name !== name
      )
    })),

  updateTimeSeriesFilterOption: (name, newOption) =>
    set((state) => ({
      timeSeriesFilterOptions: state.timeSeriesFilterOptions.map((o) =>
        o.name === name ? { ...o, ...newOption } : o
      )
    })),

  // Panel setters
  setShowDeploymentPanel: (updater) =>
    set((state) => ({
      showDeploymentPanel:
        typeof updater === 'function'
          ? updater(state.showDeploymentPanel)
          : updater
    })),
  setShowMetadataPanel: (updater) =>
    set((state) => ({
      showMetadataPanel:
        typeof updater === 'function'
          ? updater(state.showMetadataPanel)
          : updater
    })),
  setShowObjectPrefsPanel: (updater) =>
    set((state) => ({
      showObjectPrefsPanel:
        typeof updater === 'function'
          ? updater(state.showObjectPrefsPanel)
          : updater
    })),
  setShowPermissionsPanel: (updater) =>
    set((state) => ({
      showPermissionsPanel:
        typeof updater === 'function'
          ? updater(state.showPermissionsPanel)
          : updater
    })),

  // View state setters
  setViewStateRecId: (updater) =>
    set((state) => ({
      viewStateRecId:
        typeof updater === 'function' ? updater(state.viewStateRecId) : updater
    })),
  setObjPreferences: (updater) =>
    set((state) => ({
      objPreferences:
        typeof updater === 'function' ? updater(state.objPreferences) : updater
    }))
});
