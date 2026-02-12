import { colorSchemeDarkBlue, colorSchemeLight } from 'ag-grid-community';

export type Theme = typeof colorSchemeDarkBlue | typeof colorSchemeLight;
export type ThemeKey = 'darkBlue' | 'light';

export interface SelectedTheme {
  label: ThemeKey;
  value: ThemeKey;
}

export const themeMapping: Record<ThemeKey, Theme> = {
  darkBlue: colorSchemeDarkBlue,
  light: colorSchemeLight,
};

