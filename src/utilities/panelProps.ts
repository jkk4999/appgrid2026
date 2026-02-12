import type { GridApi } from 'ag-grid-community';
import type { APIClient } from '../brideDesignPattern/apiInterface';
import type { SObject, SObjectMetadata } from '../sObjectMetadataTypes';
import type {
  AgColumnStyle,
  AgRowStyle,
  CustomCalculatedColumnPanelProps,
  CustomStylePanelProps,
} from '../appInterfaces/grid/gridInterfaces';

function toPromiseVoid(fn?: () => Promise<any> | void): () => Promise<void> {
  return async () => { try { await fn?.(); } catch { /* surface via panel flows */ } };
}

export function buildCalculatedColumnPanelProps({
  apiClient,
  gridApi,
  isSubgrid,
  save,
}: {
  apiClient: APIClient;
  gridApi: GridApi;
  isSubgrid: boolean;
  save: () => Promise<any> | void;
}): CustomCalculatedColumnPanelProps {
  return {
    apiClient,
    gridApi,
    isSubgrid,
    saveAgGridState: toPromiseVoid(save),
  };
}

export function buildStylePanelProps({
  apiClient,
  gridApi,
  isSubgrid,
  sObjectApiName,
  save,
  objMetadata,
  objColumnStyles,
  objRowStyles,
  rowData,
  selectedColumnStyle,
  selectedRowStyle,
  setObjColumnStyles,
  setObjRowStyles,
  setSelectedColumnStyle,
  setSelectedRowStyle,
}: {
  apiClient: APIClient;
  gridApi: GridApi;
  isSubgrid: boolean;
  sObjectApiName: string;
  save: () => Promise<any> | void;
  objMetadata: SObjectMetadata;
  objColumnStyles?: AgColumnStyle[];
  objRowStyles?: AgRowStyle[];
  rowData: SObject[];
  selectedColumnStyle?: AgColumnStyle | null;
  selectedRowStyle?: AgRowStyle | null;
  setObjColumnStyles?: (styles: AgColumnStyle[]) => void;
  setObjRowStyles?: (styles: AgRowStyle[]) => void;
  setSelectedColumnStyle?: (style: AgColumnStyle) => void;
  setSelectedRowStyle?: (style: AgRowStyle) => void;
}): CustomStylePanelProps {
  return {
    apiClient,
    gridApi,
    isSubgrid,
    sObjectApiName,
    saveAgGridState: async () => { await save?.(); return undefined as any; },
    objMetadata,
    objColumnStyles,
    objRowStyles,
    rowData,
    selectedColumnStyle,
    selectedRowStyle,
    setObjColumnStyles,
    setObjRowStyles,
    setSelectedColumnStyle,
    setSelectedRowStyle,
  };
}
