import type { GridApi, ColDef, ColumnState } from 'ag-grid-community';

import { ColumnItem as DragData } from '../appInterfaces/grid/gridTypes';

export interface SimpleColumnItem {
  id: string;
  name: string;
  visible: boolean;
}

const isFixedColId = (id: string) =>
  id === 'ag-Grid-SelectionColumn' ||
  id === 'error' ||
  id === 'editAction' ||
  id.includes('AutoColumn');

// Builds the "Columns" list in the same order and visibility as the grid's current state,
// while preserving friendly names from a previous list when available.
export function buildColumnsListFromGrid(
  api: GridApi,
  prevList: DragData[] = []
): DragData[] {
  const prevMap = new Map(prevList.map((c) => [c.id, c]));

  const colState: ColumnState[] = (api.getColumnState?.() ??
    []) as ColumnState[];
  const gridColDefs: ColDef[] = ((api.getColumnDefs?.() as ColDef[]) ??
    []) as ColDef[];

  // Fast path: if no defs, return previous list
  if (!gridColDefs.length) return prevList;

  const orderIndex = new Map<string, number>();
  const hideMap = new Map<string, boolean>();
  colState.forEach((s, idx) => {
    if (s?.colId) {
      orderIndex.set(String(s.colId), idx);
      hideMap.set(String(s.colId), !!s.hide);
    }
  });

  // Sort column defs by: visible first, then state order, then header alpha
  const sortedDefs = gridColDefs
    .filter((def) => {
      const id = def.colId ?? def.field ?? '';
      return id && !isFixedColId(id);
    })
    .sort((a, b) => {
      const idA = a.colId ?? a.field ?? '';
      const idB = b.colId ?? b.field ?? '';
      const hiddenA = hideMap.has(idA)
        ? (hideMap.get(idA) as boolean)
        : !!a.hide;
      const hiddenB = hideMap.has(idB)
        ? (hideMap.get(idB) as boolean)
        : !!b.hide;
      if (hiddenA !== hiddenB) return Number(hiddenA) - Number(hiddenB);
      const ia = orderIndex.has(idA)
        ? (orderIndex.get(idA) as number)
        : Number.MAX_SAFE_INTEGER;
      const ib = orderIndex.has(idB)
        ? (orderIndex.get(idB) as number)
        : Number.MAX_SAFE_INTEGER;
      if (ia !== ib) return ia - ib;
      const nameA = (a.headerName ?? a.field ?? '').toLowerCase();
      const nameB = (b.headerName ?? b.field ?? '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

  return sortedDefs.map((def) => {
    const id = String(def.colId ?? def.field ?? '');
    const st = colState.find((s) => String(s.colId) === id);
    const visible = st ? !st.hide : def.hide ? !def.hide : true;
    const prev = prevMap.get(id);
    return {
      id,
      name: prev?.name || (def.headerName ?? def.field ?? id),
      visible
    };
  });
}
