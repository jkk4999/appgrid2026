/**
 * Selector Hook Factory
 *
 * Provides utilities for creating context-aware selector hooks that
 * automatically map between main grid and subgrid state.
 *
 * This reduces boilerplate by:
 * 1. Auto-generating selectors from property mappings
 * 2. Creating pre-bound main/subgrid selectors for referential stability
 * 3. Providing a consistent hook pattern across all domains
 */

import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore';
import type { GridContext } from './types';

type AnyRecord = Record<string, any>;

/**
 * Property mapping for main/subgrid state.
 * Maps generic property names to actual store property names.
 */
export interface PropertyMapping {
  /** Generic property name used in the hook return type */
  [genericName: string]: {
    /** Store property name for main grid */
    main: string;
    /** Store property name for subgrid */
    subgrid: string;
  };
}

/**
 * Creates a selector function from a property mapping.
 */
function createSelectorFromMapping(
  mapping: PropertyMapping,
  context: GridContext
): (state: AnyRecord) => AnyRecord {
  return (state: AnyRecord) => {
    const result: AnyRecord = {};
    for (const [genericName, paths] of Object.entries(mapping)) {
      const storeProp = context === 'main' ? paths.main : paths.subgrid;
      result[genericName] = state[storeProp];
      // Auto-generate setter name
      const setterName = `set${genericName.charAt(0).toUpperCase()}${genericName.slice(1)}`;
      const storeSetterName = `set${storeProp.charAt(0).toUpperCase()}${storeProp.slice(1)}`;
      result[setterName] = state[storeSetterName];
    }
    return result;
  };
}

/**
 * Creates a simple selector that picks properties directly from state.
 * Use for shared state that doesn't differ between main/subgrid.
 */
export function createSimpleSelector<T extends AnyRecord>(
  propertyNames: string[]
): (state: AnyRecord) => T {
  return (state: AnyRecord) => {
    const result: AnyRecord = {};
    for (const prop of propertyNames) {
      result[prop] = state[prop];
      // Auto-add setter if it exists
      const setterName = `set${prop.charAt(0).toUpperCase()}${prop.slice(1)}`;
      if (setterName in state) {
        result[setterName] = state[setterName];
      }
    }
    return result as T;
  };
}

/**
 * Creates a context-aware hook that returns different state based on context.
 *
 * @param mapping Property mapping defining main/subgrid property names
 * @returns A hook function that accepts GridContext and returns mapped state
 *
 * @example
 * const useChartState = createContextHook({
 *   charts: { main: 'objCharts', subgrid: 'objSubgridCharts' },
 *   selectedChart: { main: 'selectedChart', subgrid: 'selectedSubgridChart' },
 * });
 *
 * // Usage
 * const { charts, setCharts, selectedChart } = useChartState('main');
 */
export function createContextHook<T>(mapping: PropertyMapping) {
  // Pre-create selectors for referential stability
  const mainSelector = createSelectorFromMapping(mapping, 'main');
  const subgridSelector = createSelectorFromMapping(mapping, 'subgrid');

  return function useContextHook(context: GridContext): T {
    const selector = context === 'main' ? mainSelector : subgridSelector;
    return useStore(useShallow(selector)) as T;
  };
}

/**
 * Creates a simple hook that returns state directly from the store.
 * Use for shared state that doesn't differ between contexts.
 *
 * @param propertyNames Array of property names to select
 * @returns A hook function that returns the selected state
 *
 * @example
 * const useChartDisplay = createSimpleHook([
 *   'chartInfo', 'chartOptions', 'showCharts', 'showChartDialog'
 * ]);
 */
export function createSimpleHook<T extends AnyRecord>(propertyNames: string[]) {
  const selector = createSimpleSelector<T>(propertyNames);

  return function useSimpleHook(): T {
    return useStore(useShallow(selector));
  };
}

/**
 * Context parameter type - accepts either GridContext string or boolean for backward compatibility.
 * - 'main' or false -> main grid
 * - 'subgrid' or true -> subgrid
 */
export type ContextParam = GridContext | boolean;

/**
 * Normalizes context parameter to GridContext.
 * Supports both new string format ('main' | 'subgrid') and legacy boolean (isSubgrid).
 */
function normalizeContext(context: ContextParam): GridContext {
  if (typeof context === 'boolean') {
    return context ? 'subgrid' : 'main';
  }
  return context;
}

/**
 * Creates both a context-aware hook and dedicated main/subgrid hooks.
 * This is the recommended way to create selector hooks.
 *
 * @param mapping Property mapping defining main/subgrid property names
 * @returns Object containing useHook, useMainHook, and useSubgridHook
 *
 * @example
 * const { useHook, useMainHook, useSubgridHook } = createContextHooks({
 *   charts: { main: 'objCharts', subgrid: 'objSubgridCharts' },
 * });
 *
 * export const useChartState = useHook;
 * export const useMainChartState = useMainHook;
 * export const useSubgridChartState = useSubgridHook;
 *
 * // Both usages work:
 * useChartState('main')     // new pattern
 * useChartState(false)      // legacy pattern (false = main, true = subgrid)
 */
export function createContextHooks<T>(mapping: PropertyMapping) {
  const mainSelector = createSelectorFromMapping(mapping, 'main');
  const subgridSelector = createSelectorFromMapping(mapping, 'subgrid');

  const useHook = (context: ContextParam = 'main'): T => {
    const normalized = normalizeContext(context);
    const selector = normalized === 'main' ? mainSelector : subgridSelector;
    return useStore(useShallow(selector)) as T;
  };

  const useMainHook = (): T => {
    return useStore(useShallow(mainSelector)) as T;
  };

  const useSubgridHook = (): T => {
    return useStore(useShallow(subgridSelector)) as T;
  };

  return { useHook, useMainHook, useSubgridHook };
}
