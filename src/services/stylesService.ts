import { safeJsonDecode } from '../utilities/safeJson';

import type { SelectedViewLike } from '../viewState/types';

import useStore from '../zustandStore';

export interface StylesBundle<TCol = any, TRow = any> {
  columns?: TCol[] | TCol | null | undefined;
  rows?: TRow[] | TRow | null | undefined;
}

// Centralized getter for current styles from the store
export function getStyles(options?: {
  isSubgrid?: boolean;
}): StylesBundle<any, any> {
  const isSubgrid = !!options?.isSubgrid;
  const state = useStore.getState();
  if (isSubgrid) {
    return {
      columns: state.objSubgridColumnStyles,
      rows: state.objSubgridRowStyles
    };
  }
  return {
    columns: state.objColumnStyles,
    rows: state.objRowStyles
  };
}

// Centralized setter to update both column and row styles in one call
export function setStyles(
  bundle: StylesBundle<any, any>,
  options?: { isSubgrid?: boolean }
) {
  const isSubgrid = !!options?.isSubgrid;
  const {
    setObjColumnStyles,
    setObjRowStyles,
    setObjSubgridColumnStyles,
    setObjSubgridRowStyles
  } = useStore.getState() as any;

  // prettyPrint('[setStyles] Called with:', {
  //   isSubgrid,
  //   hasColumns: bundle.columns !== undefined,
  //   columnsLength: Array.isArray(bundle.columns) ? bundle.columns.length : 'not array',
  //   hasRows: bundle.rows !== undefined,
  //   columnData: bundle.columns
  // }, 'cyan');

  if (isSubgrid) {
    if (bundle.columns !== undefined) {
      // prettyPrint('[setStyles] Setting subgrid column styles', '', 'cyan');

      setObjSubgridColumnStyles?.(bundle.columns ?? []);
    }
    if (bundle.rows !== undefined) {
      // prettyPrint('[setStyles] Setting subgrid row styles', '', 'cyan');

      setObjSubgridRowStyles?.(bundle.rows ?? []);
    }
  } else {
    if (bundle.columns !== undefined) {
      // prettyPrint('[setStyles] Setting main grid column styles:', bundle.columns?.length, 'cyan');

      setObjColumnStyles?.(bundle.columns ?? []);
    }
    if (bundle.rows !== undefined) {
      // prettyPrint('[setStyles] Setting main grid row styles', '', 'cyan');

      setObjRowStyles?.(bundle.rows ?? []);
    }
  }
}

// Decode styles from a view record shape (supports main or AppGridAg__ field names)
export function decodeStylesFromView(
  view: SelectedViewLike | null | undefined
): StylesBundle<any, any> {
  if (!view) return { columns: null, rows: null };
  const colStr =
    (view as any).columnStyles ??
    (view as any).AppGridAg__Column_Styles__c ??
    '';
  const rowStr =
    (view as any).rowStyles ?? (view as any).AppGridAg__Row_Styles__c ?? '';
  const columns = safeJsonDecode<any>(colStr);
  const rows = safeJsonDecode<any>(rowStr);
  return { columns, rows };
}

// Prepare styles for persistence (stringified)
export function encodeStyles(bundle: StylesBundle<any, any>): {
  columnStyles: string;
  rowStyles: string;
} {
  return {
    columnStyles: JSON.stringify(bundle.columns ?? []),
    rowStyles: JSON.stringify(bundle.rows ?? [])
  };
}
