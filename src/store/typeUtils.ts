/**
 * Type Utilities for Zustand Store (Updated)
 *
 * Adds functional update support to auto-generated setters.
 *
 * @example
 * interface ViewState {
 *   viewOptions: SObjectView[];
 *   selectedView: SObjectView | null;
 * }
 * type ViewSlice = WithFunctionalSetters<ViewState>;
 *
 * // Usage:
 * setViewOptions(prev => [...prev, newView]);
 * setSelectedView(view);
 */

import type { StateCreator } from 'zustand';

/**
 * Updater type: either a new value or a function receiving previous state.
 */
export type Updater<T> = T | ((prev: T) => T);

/**
 * Generates setter function type supporting functional updates.
 */
export type Setter<T> = (value: Updater<T>) => void;

/**
 * Transforms a property name to its setter name.
 * Example: 'selectedView' -> 'setSelectedView'
 */
export type SetterName<K extends string> = `set${Capitalize<K>}`;

/**
 * Generates functional setters for all properties in a state interface.
 * The resulting type includes both the original state and auto-generated setters.
 */
export type WithFunctionalSetters<T> = T & {
  [K in keyof T as SetterName<K & string>]: Setter<T[K]>;
};

/**
 * Extracts just the state properties from a slice (excludes setters and actions).
 */
export type ExtractState<T> = {
  [K in keyof T as K extends `set${string}`
    ? never
    : K extends (...args: any[]) => any
      ? never
      : K]: T[K];
};

/**
 * Extracts just the setter functions from a slice.
 */
export type ExtractSetters<T> = {
  [K in keyof T as K extends `set${string}` ? K : never]: T[K];
};

/**
 * Type for custom actions that can be added to a slice beyond auto-generated setters.
 */
export type CustomActions<T> = {
  [K in keyof T as K extends `set${string}`
    ? never
    : T[K] extends (...args: any[]) => any
      ? K
      : never]: T[K];
};

/**
 * Helper type for the Store. Import this in slices to avoid repeating the full signature.
 */
export type SliceCreator<T, S = any> = StateCreator<
  S,
  [['zustand/devtools', never]],
  [],
  T
>;

/**
 * Grid context type for unified hooks.
 */
export type GridContext = 'main' | 'subgrid';
