/**
 * Flow State Hooks
 *
 * Provides hooks for accessing flow-related state with automatic
 * main/subgrid context handling.
 */

import { createContextHooks, createSimpleHook } from './createSelector';
import type { SObjectFlow } from '../../sObjectMetadataTypes';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Return type for useFlowState hook */
export interface FlowStateReturn {
  flows: SObjectFlow[];
  setFlows: (flows: SObjectFlow[]) => void;
  selectedFlow: SObjectFlow | null;
  setSelectedFlow: (flow: SObjectFlow | null) => void;
}

// ============================================================
// CONTEXT-AWARE HOOKS (main vs subgrid)
// ============================================================

const flowHooks = createContextHooks<FlowStateReturn>({
  flows: { main: 'objFlows', subgrid: 'subgridObjFlows' },
  selectedFlow: { main: 'selectedFlow', subgrid: 'selectedSubgridFlow' },
});

/** Hook for flow state - pass 'main' or 'subgrid' context */
export const useFlowState = flowHooks.useHook;

/** Hook for main grid flow state */
export const useMainFlowState = flowHooks.useMainHook;

/** Hook for subgrid flow state */
export const useSubgridFlowState = flowHooks.useSubgridHook;

// ============================================================
// SHARED HOOKS (same for main and subgrid)
// ============================================================

/** Hook for flow config panel state (shared) */
export const useFlowConfig = createSimpleHook([
  'showFlowConfigPanel',
  'flowEventSource',
]);

export default useFlowState;
