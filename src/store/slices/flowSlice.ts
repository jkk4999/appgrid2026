/**
 * Flow Slice
 *
 * Manages flow configuration state.
 * Uses createSliceWithSetters for automatic setter generation.
 */

import { createSliceWithSetters } from '../createSlice';
import type { SObjectFlow, FlowEventSource } from '../types';

// ============================================================
// INITIAL STATE
// ============================================================

const flowState = {
  objFlows: [] as SObjectFlow[],
  subgridObjFlows: [] as SObjectFlow[],
  selectedFlow: null as SObjectFlow | null,
  selectedSubgridFlow: null as SObjectFlow | null,
  flowEventSource: 'gridView' as FlowEventSource,
  showFlowConfigPanel: false,
};

// ============================================================
// SLICE CREATOR
// ============================================================

export const createFlowSlice = createSliceWithSetters(flowState);
