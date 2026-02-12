import type { RowStyle, IRowNode, CellStyle } from 'ag-grid-community';
import {
  AgRowStyle,
  AgColumnStyle,
  FontSize,
  TargetDataType
} from '../appInterfaces/grid/gridInterfaces';
import { evaluateRule } from './evaluateExpression';

// Map our enum-like font sizes to CSS pixel values
const fontSizeMap: Record<FontSize, string> = {
  Default: '16px',
  XSmall: '10px',
  Small: '12px',
  Medium: '14px',
  Large: '18px',
  XLarge: '24px'
};

const clamp = (val: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, val));

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (!hex) return null;
  let clean = hex.trim();
  if (clean.startsWith('#')) clean = clean.slice(1);
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
};

export const toRgba = (color: string, opacity?: number): string => {
  if (opacity === undefined || opacity === null) return color;
  const rgb = hexToRgb(color);
  if (!rgb) return color; // fallback to original if not hex
  const a = clamp(opacity);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
};

export const fontSizeToCss = (
  size: FontSize | undefined
): string | undefined => {
  if (!size) return undefined;
  return fontSizeMap[size];
};

// Keep index signature strict (string | number) to satisfy AG Grid's CellStyle/RowStyle
// Avoid Partial<> here because it widens the index signature to include undefined
export type RowStyleCSS = RowStyle;

export const buildRowStyleCss = (cfg: AgRowStyle): RowStyleCSS => {
  const style: RowStyleCSS = {};

  // Apply color styles only if checked flag is true (or undefined for backward compatibility)
  if (cfg.backgroundColorChecked !== false && cfg.backgroundColor) {
    style.backgroundColor = toRgba(
      cfg.backgroundColor,
      cfg.backgroundColorOpacity
    );
  }
  if (cfg.colorChecked !== false && cfg.color) {
    style.color = toRgba(cfg.color, cfg.colorOpacity);
  }
  if (cfg.borderColorChecked !== false && cfg.borderColor) {
    style.borderColor = toRgba(cfg.borderColor, cfg.borderColorOpacity);
  }

  if (cfg.fontSizeChecked && cfg.fontSize) {
    const cssSize = fontSizeToCss(cfg.fontSize);
    if (cssSize) style.fontSize = cssSize;
  }

  if (cfg.fontStyleChecked && cfg.fontStyle) {
    if (cfg.fontStyle === 'italic') {
      (style as any).fontStyle = 'italic';
    } else if (cfg.fontStyle === 'bold') {
      (style as any).fontWeight = 'bold';
    }
  }

  return style;
};

export const shouldApplyRowStyleForNode = (
  cfg: AgRowStyle,
  node?: IRowNode | any
): boolean => {
  if (!node) return true;
  if (cfg.excludeGroupRows && node.group) return false;
  if (cfg.excludeRowSummaries && (node.footer || node.rowPinned)) return false;
  return true;
};

export const findFirstMatchingRowStyle = (
  styles: AgRowStyle[] | undefined,
  data: Record<string, any> | undefined,
  node?: IRowNode | any
): AgRowStyle | undefined => {
  if (!styles || styles.length === 0) return undefined;

  return styles.find((s) => {
    if (!s?.active) return false;
    if (!shouldApplyRowStyleForNode(s, node)) return false;
    if (s.rule) {
      if (!data) return false;
      try {
        return evaluateRule(s.rule as any, data as any);
      } catch {
        return false;
      }
    }
    return true; // match-all when no rule
  });
};

// Column styles
// Align with AG Grid's CellStyle type to avoid undefined in index signature
export type CellStyleCSS = CellStyle;

export const buildCellStyleCss = (cfg: AgColumnStyle): CellStyleCSS => {
  const style: CellStyleCSS = {};

  // Apply color styles only if checked flag is true (or undefined for backward compatibility)
  if (cfg.backgroundColorChecked !== false && cfg.backgroundColor) {
    style.backgroundColor = toRgba(
      cfg.backgroundColor,
      cfg.backgroundColorOpacity
    );
  }
  if (cfg.colorChecked !== false && cfg.color) {
    style.color = toRgba(cfg.color, cfg.colorOpacity);
  }
  if (cfg.borderColorChecked !== false && cfg.borderColor) {
    style.borderColor = toRgba(cfg.borderColor, cfg.borderColorOpacity);
  }

  if (cfg.fontSizeChecked && cfg.fontSize) {
    const cssSize = fontSizeToCss(cfg.fontSize);
    if (cssSize) style.fontSize = cssSize;
  }

  if (cfg.fontStyleChecked && cfg.fontStyle) {
    if (cfg.fontStyle === 'italic') {
      (style as any).fontStyle = 'italic';
    } else if (cfg.fontStyle === 'bold') {
      (style as any).fontWeight = 'bold';
    }
  }

  if (cfg.cellAlignmentChecked && cfg.cellAlignment) {
    (style as any).textAlign = cfg.cellAlignment;
  }

  if (typeof cfg.borderRadius === 'number') {
    (style as any).borderRadius = cfg.borderRadius;
  }

  return style;
};

export const shouldApplyColumnStyleForNode = (
  cfg: AgColumnStyle,
  node?: IRowNode | any
): boolean => {
  if (!node) {
    return true;
  }

  if (cfg.excludeGroupRows && node.group) {
    return false;
  }

  if (cfg.excludeRowSummaries && (node.footer || node.rowPinned)) {
    return false;
  }

  return true;
};

export const findFirstMatchingColumnStyle = (
  styles: AgColumnStyle[] | undefined,
  data: Record<string, any> | undefined,
  node: IRowNode | any,
  field?: string,
  dataType?: TargetDataType | string
): AgColumnStyle | undefined => {
  if (!styles || styles.length === 0) {
    return undefined;
  }

  return styles.find((s) => {
    if (!s?.active) {
      return false;
    }

    if (!shouldApplyColumnStyleForNode(s, node)) {
      return false;
    }

    // Column targeting rules: either targetColumns OR targetDataType (not both)

    // If targetColumns is specified, use that exclusively
    // Otherwise, use targetDataType if specified

    let matchesColumn = true;

    if (s.targetColumns && s.targetColumns.length) {
      // Specific columns specified - ignore targetDataType
      matchesColumn = !!field && s.targetColumns.includes(field);
    } else if (s.targetDataType) {
      // No specific columns, use data type matching
      matchesColumn = !!dataType && s.targetDataType === (dataType as any);
    }

    if (!matchesColumn) {
      return false;
    }

    if (s.rule) {
      if (!data) {
        return false;
      }

      const ruleResult = evaluateRule(s.rule as any, data as any);

      return ruleResult;
    }

    return true;
  });
};
