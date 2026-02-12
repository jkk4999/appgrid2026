import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useStore from '../zustandStore';

/**
 * Panel names for all toggleable panels in the application.
 * Using a union type ensures type-safety when managing panels.
 */
export type PanelName =
  | 'charts'
  | 'chartSettings'
  | 'calculatedColumnPanel'
  | 'columnStylePanel'
  | 'deploymentPanel'
  | 'flowConfigPanel'
  | 'ganttViewConfigPanel'
  | 'ganttViewFilterPanel'
  | 'heatmapConfigPanel'
  | 'kanbanConfigPanel'
  | 'metadataPanel'
  | 'objectPrefsPanel'
  | 'permissionsPanel'
  | 'queryPanel'
  | 'schedulerConfigPanel'
  | 'schedulerSettingsDialog'
  | 'slackPanel'
  | 'slackConfigPanel'
  | 'shareToSlackDialog'
  | 'subgridCalculatedColumnPanel'
  | 'subgridColumnStylePanel'
  | 'treegridConfigPanel'
  | 'rowStylePanel'
  | 'subgridRowStylePanel';

/**
 * Mapping from PanelName to the actual store property name.
 * This allows us to use friendly names while mapping to the existing store.
 */
const panelToStoreKey: Record<PanelName, string> = {
  charts: 'showCharts',
  chartSettings: 'showChartSettings',
  calculatedColumnPanel: 'showCalculatedColumnPanel',
  columnStylePanel: 'showColumnStylePanel',
  deploymentPanel: 'showDeploymentPanel',
  flowConfigPanel: 'showFlowConfigPanel',
  ganttViewConfigPanel: 'showGanttViewConfigPanel',
  ganttViewFilterPanel: 'showGanttViewFilterPanel',
  heatmapConfigPanel: 'showHeatmapConfigPanel',
  kanbanConfigPanel: 'showKanbanConfigPanel',
  metadataPanel: 'showMetadataPanel',
  objectPrefsPanel: 'showObjectPrefsPanel',
  permissionsPanel: 'showPermissionsPanel',
  queryPanel: 'showQueryPanel',
  schedulerConfigPanel: 'showSchedulerConfigPanel',
  schedulerSettingsDialog: 'showSchedulerSettingsDialog',
  slackPanel: 'showSlackPanel',
  slackConfigPanel: 'showSlackConfigPanel',
  shareToSlackDialog: 'showShareToSlackDialog',
  subgridCalculatedColumnPanel: 'showSubgridCalculatedColumnPanel',
  subgridColumnStylePanel: 'showSubgridColumnStylePanel',
  treegridConfigPanel: 'showTreegridConfigPanel',
  rowStylePanel: 'showRowStylePanel',
  subgridRowStylePanel: 'showSubgridRowStylePanel',
};

/**
 * Get the setter name for a panel from the store.
 */
function getSetterName(panel: PanelName): string {
  const storeKey = panelToStoreKey[panel];
  // Convert 'showCharts' to 'setShowCharts'
  return 'set' + storeKey.charAt(0).toUpperCase() + storeKey.slice(1);
}

export interface PanelManagerResult {
  /** Check if a panel is currently open */
  isOpen: (panel: PanelName) => boolean;
  /** Open a specific panel */
  open: (panel: PanelName) => void;
  /** Close a specific panel */
  close: (panel: PanelName) => void;
  /** Toggle a panel's visibility */
  toggle: (panel: PanelName) => void;
  /** Close all panels */
  closeAll: () => void;
  /** Open a panel and close all others (exclusive open) */
  openExclusive: (panel: PanelName) => void;
}

/**
 * Hook for managing UI panel visibility.
 * Provides a clean API for opening, closing, and toggling panels.
 *
 * @example
 * const panels = usePanelManager();
 * panels.open('charts');
 * panels.toggle('queryPanel');
 * if (panels.isOpen('slackPanel')) { ... }
 */
export function usePanelManager(): PanelManagerResult {
  // Get all panel states from store
  const panelStates = useStore(
    useShallow((state: any) => {
      const result: Record<string, boolean> = {};
      for (const panel of Object.keys(panelToStoreKey) as PanelName[]) {
        const storeKey = panelToStoreKey[panel];
        result[panel] = !!state[storeKey];
      }
      return result;
    })
  );

  const isOpen = useCallback(
    (panel: PanelName): boolean => !!panelStates[panel],
    [panelStates]
  );

  const open = useCallback((panel: PanelName) => {
    const state = useStore.getState() as any;
    const setterName = getSetterName(panel);
    state[setterName]?.(true);
  }, []);

  const close = useCallback((panel: PanelName) => {
    const state = useStore.getState() as any;
    const setterName = getSetterName(panel);
    state[setterName]?.(false);
  }, []);

  const toggle = useCallback((panel: PanelName) => {
    const state = useStore.getState() as any;
    const storeKey = panelToStoreKey[panel];
    const setterName = getSetterName(panel);
    const currentValue = !!state[storeKey];
    state[setterName]?.(!currentValue);
  }, []);

  const closeAll = useCallback(() => {
    const state = useStore.getState() as any;
    for (const panel of Object.keys(panelToStoreKey) as PanelName[]) {
      const setterName = getSetterName(panel);
      state[setterName]?.(false);
    }
  }, []);

  const openExclusive = useCallback((panel: PanelName) => {
    const state = useStore.getState() as any;
    // Close all panels
    for (const p of Object.keys(panelToStoreKey) as PanelName[]) {
      const setterName = getSetterName(p);
      state[setterName]?.(false);
    }
    // Open the requested panel
    const setterName = getSetterName(panel);
    state[setterName]?.(true);
  }, []);

  return useMemo(() => ({
    isOpen,
    open,
    close,
    toggle,
    closeAll,
    openExclusive,
  }), [isOpen, open, close, toggle, closeAll, openExclusive]);
}

export default usePanelManager;
