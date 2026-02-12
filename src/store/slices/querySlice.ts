/**
 * Query Slice
 *
 * Manages query builder state, rules, and related dialogs.
 * Uses createSliceWithSetters for automatic setter generation.
 */

import { createSliceWithSetters } from '../createSlice';
import type { SObjectQuery, RuleModel } from '../types';

// ============================================================
// INITIAL STATE
// ============================================================

const queryState = {
  queryOptions: [] as SObjectQuery[],
  selectedQuery: null as SObjectQuery | null,
  currentQueryRule: {} as RuleModel,
  queryRuleModified: {} as Record<string, unknown> | null,
  isQueryActive: false,
  runQuery: false,
  showQueryPanel: false,
  showQueryDeleteDialog: false,
  showQueryMetricsPanel: false,
  currentFilterRule: {} as RuleModel,
  currentTimeSeriesFilterRule: {} as RuleModel,
  isRuleValid: false
};

// ============================================================
// SLICE CREATOR
// ============================================================

export const createQuerySlice = createSliceWithSetters(queryState);
