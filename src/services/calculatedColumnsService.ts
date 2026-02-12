import { safeJsonDecode } from '../utilities/safeJson';
import type { SelectedViewLike } from '../viewState/types';
import useStore from '../zustandStore';

// Getter for calculated columns from store
export function getCalculatedColumns(options?: { isSubgrid?: boolean }): any[] {
  const isSubgrid = !!options?.isSubgrid;
  const state = useStore.getState();
  return isSubgrid ? state.objCalculatedSubgridColumns : state.objCalculatedColumns;
}

// Setter for calculated columns to store
export function setCalculatedColumns(cols: any[], options?: { isSubgrid?: boolean }) {
  const isSubgrid = !!options?.isSubgrid;
  const { setObjCalculatedColumns, setObjCalculatedSubgridColumns } = useStore.getState() as any;
  if (isSubgrid) setObjCalculatedSubgridColumns?.(cols ?? []);
  else setObjCalculatedColumns?.(cols ?? []);
}

// Decode from a view record
export function decodeCalculatedColumnsFromView(view: SelectedViewLike | null | undefined): any[] | null {
  if (!view) return null;
  const str = (view as any).calculatedColumns ?? (view as any).AppGridAg__Calculated_Columns__c ?? '';
  return safeJsonDecode<any[]>(str);
}

// Prepare for persistence (stringified)
export function encodeCalculatedColumns(cols: any[] | null | undefined): string {
  return JSON.stringify(cols ?? []);
}

