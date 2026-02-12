/**
 * Slice Creator Helper
 *
 * Simplifies slice creation by auto-generating setters from initial state.
 * Only define state once - setters are created automatically.
 *
 * @example
 * // Before: 78 lines with manual setters
 * export const createViewSlice: StateCreator<Store, ...> = (set) => ({
 *   selectedView: null,
 *   setSelectedView: (view) => set({ selectedView: view }),
 *   // ... repeated for every property
 * });
 *
 * // After: 25 lines
 * export const createViewSlice = createSliceWithSetters({
 *   selectedView: null,
 *   viewOptions: null,
 * }, (set) => ({
 *   // Only custom setters with special logic
 *   setSelectedView: (view) => set({ selectedView: normalizeView(view) }),
 * }));
 */

import type { StateCreator } from 'zustand';
import type { Store } from './types';

type SetFunction = (partial: Partial<Store> | ((state: Store) => Partial<Store>)) => void;
type GetFunction = () => Store;

/**
 * Creates a Zustand slice with auto-generated setters.
 *
 * @param initialState - Object containing initial state values
 * @param customActions - Optional function returning custom actions/setters that override auto-generated ones
 * @returns A StateCreator function compatible with Zustand's create()
 *
 * @example
 * // Simple slice with no custom logic
 * export const createThemeSlice = createSliceWithSetters({
 *   selectedTheme: defaultTheme,
 *   selectedAccentColor: '#1976d2',
 * });
 *
 * @example
 * // Slice with custom setter logic (hybrid approach)
 * export const createViewSlice = createSliceWithSetters({
 *   selectedView: null,
 *   viewOptions: null,
 * }, (set, get) => ({
 *   setSelectedView: (view) => set({ selectedView: normalizeViewRecord(view) }),
 *   setViewOptions: (options) => set({ viewOptions: normalizeViewArray(options) }),
 * }));
 */
export function createSliceWithSetters<T extends Record<string, unknown>>(
  initialState: T,
  customActions?: (set: SetFunction, get: GetFunction) => Record<string, unknown>
): StateCreator<Store, [['zustand/devtools', never]], [], Record<string, unknown>> {
  return (set, get) => {
    // Auto-generate setters for each state property
    const autoSetters: Record<string, (value: unknown) => void> = {};

    for (const key of Object.keys(initialState)) {
      const setterName = `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      autoSetters[setterName] = (value: unknown) => set({ [key]: value } as Partial<Store>);
    }

    // Get custom actions if provided
    const custom = customActions ? customActions(set, get) : {};

    // Custom actions override auto-generated setters
    return {
      ...initialState,
      ...autoSetters,
      ...custom,
    };
  };
}

/**
 * Capitalizes the first letter of a string.
 * Used internally for setter name generation.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates a setter name from a property name.
 * @example getSetterName('selectedView') // 'setSelectedView'
 */
export function getSetterName(propertyName: string): string {
  return `set${capitalize(propertyName)}`;
}
