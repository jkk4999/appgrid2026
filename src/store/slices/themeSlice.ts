/**
 * Theme Slice
 *
 * Manages theme-related state including color themes and accent colors.
 * Uses createSliceWithSetters with a custom toggle action.
 */

import { colorSchemeLight, colorSchemeDark } from 'ag-grid-community';
import { createSliceWithSetters } from '../createSlice';
import type { ThemeOption, GridColorThemeOption } from '../types';

// ============================================================
// CONSTANTS
// ============================================================

export const themeColorOptions: GridColorThemeOption[] = [
  { id: 'colorSchemeLight', value: colorSchemeLight },
  { id: 'colorSchemeDark', value: colorSchemeDark }
];

// ============================================================
// INITIAL STATE
// ============================================================

const themeState = {
  selectedTheme: { label: 'Light', value: 'light' } as ThemeOption,
  selectedAccentColor: '#07c',
  selectedGridColorTheme: themeColorOptions[0] as GridColorThemeOption,
  muiColor: '#000000',
  muiBackgroundColor: '#FFFFFF',
};

// ============================================================
// SLICE CREATOR
// ============================================================

export const createThemeSlice = createSliceWithSetters(themeState, (set, get) => ({
  // Custom action: Toggle between light and dark grid color themes
  toggleGridColorTheme: () => {
    const current = get().selectedGridColorTheme as GridColorThemeOption;
    const isDark = current?.id === 'colorSchemeDark';
    const newTheme = isDark ? themeColorOptions[0] : themeColorOptions[1];
    set({ selectedGridColorTheme: newTheme });
  }
}));
