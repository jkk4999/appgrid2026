import React, { useEffect, useCallback, useState, useMemo, memo } from 'react';


// Notifications
import { useSnackbar } from 'notistack';

// MUI
import { Autocomplete, TextField } from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';


import { SObject, SObjectFieldMetadata, SObjectMetadata } from '../../sObjectMetadataTypes';

import { ColDef, Column, RowNode } from 'ag-grid-community';

import { APIClient, QueryServiceParams } from '../../brideDesignPattern/apiInterface';

import { prettyPrint } from '../../utilities/prettyPrint';


interface MUIAutocompleteEditorProps {
  value: string | number | object;
  onValueChange: (value: any) => void;
  eventKey?: string;
  stopEditing: () => void;
  apiClient: APIClient;
  objMetadataMap: React.RefObject<Map<string, SObjectMetadata>>;
  colDef: ColDef;
  column: Column;
  data: SObject;
  node: RowNode;
  fieldMetadata: SObjectFieldMetadata;
}

type RelationRec = {
  Id: string;
  Name: string;
};

const MuiAutocompleteEditor = memo(function MuiAutocompleteEditor({
  apiClient,
  data,
  fieldMetadata,
  objMetadataMap,
  value,
  onValueChange,
  stopEditing,
}: MUIAutocompleteEditorProps) {
  const theme = useTheme();

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const action = useCallback(
    (snackbarId: any) => (
      <>
        <button onClick={() => closeSnackbar(snackbarId)}>Dismiss</button>
      </>
    ),
    [closeSnackbar]
  );

  const domRef = React.useRef<HTMLInputElement>(null);

  const [autocompleteVal, setAutocompleteVal] = useState<RelationRec | null>(null);

  // Local state
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [muiOptions, setMuiOptions] = useState<RelationRec[]>([]);
  const [currentObjectType, setCurrentObjectType] = useState<string | null>(null);

  // Fetch parent metadata (stable reference to avoid effect churn)
  const getReferenceMetadata = useCallback(async (parentObjName: string) => {
    let metadata: SObjectMetadata | undefined = undefined;
    if (!objMetadataMap.current.has(parentObjName)) {
      metadata = await apiClient.getMetadata({ sObjectName: parentObjName });
      objMetadataMap.current.set(parentObjName, metadata);
    } else {
      metadata = objMetadataMap.current.get(parentObjName);
    }
    return metadata;
  }, [apiClient, objMetadataMap]);

  // Helpers for ID/type resolution and display field fallbacks
  const isSalesforceId = useCallback((v: any): boolean => {
    if (!v || typeof v !== 'string') return false;
    return /^[A-Za-z0-9]{15}(?:[A-Za-z0-9]{3})?$/.test(v);
  }, []);

  const resolveTypeByPrefix = useCallback((id: string): string | null => {
    if (!isSalesforceId(id)) return null;
    const p = id.substring(0, 3);
    const table: Record<string, string> = {
      '001': 'Account', '003': 'Contact', '005': 'User', '00G': 'Group', '00Q': 'Lead', '006': 'Opportunity', '500': 'Case', '800': 'Contract', '801': 'Order', '00T': 'Task', '00U': 'Event'
    };
    return table[p] || null;
  }, [isSalesforceId]);

  const altNameFieldByObject: Record<string, string> = useMemo(() => ({ Case: 'CaseNumber', Contract: 'ContractNumber', Order: 'OrderNumber', Task: 'Subject', Event: 'Subject', CampaignMember: 'Id' }), []);


  // Set initial object type based on value
  useEffect(() => {
    const determineObjectType = async (recordId: string) => {
      try {
        const guess = resolveTypeByPrefix(recordId);
        if (guess && fieldMetadata.referenceTo?.includes(guess)) { setCurrentObjectType(guess); return; }
        const apiResult = await apiClient.getSObjectName({ recordId: recordId });
        if (apiResult.status === 'success') { setCurrentObjectType(apiResult.sObjectName); }
        else { throw new Error(apiResult.errorMsg); }
      } catch (error: any) {
        enqueueSnackbar(`Error determining object type: ${error.message}`, { action, variant: 'error' });
      }
    };

    if (value && typeof value === 'string') {
      determineObjectType(value);
    }
  }, [action, apiClient, enqueueSnackbar, value, fieldMetadata.referenceTo, resolveTypeByPrefix]);

  // Fetch autocomplete options
  const getData = async (value: string) => {
    setLoading(true);

    const isPolymorphic = fieldMetadata.referenceTo.length > 1;
    const referenceTo = isPolymorphic && currentObjectType ? currentObjectType : fieldMetadata.referenceTo[0];

    if (isPolymorphic && !currentObjectType) {
      enqueueSnackbar('Cannot fetch options: object type unknown for polymorphic field.', {
        action,
        variant: 'warning',
      });
      setLoading(false);
      return;
    }

    const parentMetadata = await getReferenceMetadata(referenceTo);
    const parentMetadataFields = parentMetadata!.fields;
    const parentNameFieldMetadata = parentMetadataFields.find((f: any) => f.isNameField);
    const parentNameField = parentNameFieldMetadata?.name || altNameFieldByObject[referenceTo] || 'Id';
    const parentNameFieldLabel = parentNameFieldMetadata?.label || parentNameField;

    try {
      const queryRule = {
        condition: 'and',
        rules: [
          {
            label: parentNameFieldLabel,
            field: parentNameField,
            type: 'string',
            operator: 'startswith',
            value: value,
          },
        ],
      };

      const paramsObj: QueryServiceParams = {
        sObjectName: referenceTo,
        queryRule: JSON.stringify(queryRule),
        subQueryRule: null,
        subQueryRelation: null,

      };

      const queryResponse = await apiClient.executeDynamicSOQL(paramsObj);
      prettyPrint('[muiAutocomplete] queryResponse is', queryResponse, 'blue')

      if (queryResponse.status === 'error') {
        console.error('Query service returned error:', JSON.stringify(queryResponse, null, 2));
        throw new Error(queryResponse.errorMessage);
      }

      if (!queryResponse.records) {
        console.error('queryResponse.records is undefined');
        throw new Error('No records returned in queryResponse');
      }


      const suggestData: RelationRec[] = [];
      queryResponse.records.map((rec: any) => {
        suggestData.push({
          Id: String(rec.Id),
          Name: String(rec[parentNameField]),
        });
      })

      prettyPrint('[muiAutocomplete] setting muiOptions to', suggestData, 'blue')

      setMuiOptions(suggestData || []);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setLoading(false);
      enqueueSnackbar(error.message, { action, variant: 'error' });
    }
  };

  // Populate initial options: if relationship object exists use it; otherwise fetch by Id
  useEffect(() => {
    const relationshipName = fieldMetadata!.relationshipName;
    const primeFromRelation = () => {
      if (data && value && relationshipName) {
        const relationRec: RelationRec = (data as any)[relationshipName] as RelationRec;
        if (relationRec && typeof relationRec === 'object' && relationRec.Id) {
          setMuiOptions([relationRec]);
          setAutocompleteVal(relationRec);
          return true;
        }
      }
      return false;
    };
    const primeFromId = async () => {
      try {
        if (!value || typeof value !== 'string' || !isSalesforceId(value)) return;
        const objType = currentObjectType || resolveTypeByPrefix(value) || fieldMetadata.referenceTo?.[0];
        if (!objType) return;
        const parentMeta = await getReferenceMetadata(objType);
        const nameField = parentMeta?.fields.find((f: any) => f.isNameField)?.name || altNameFieldByObject[objType] || 'Id';
        const paramsObj: QueryServiceParams = { sObjectName: objType, queryRule: JSON.stringify({ condition: 'and', rules: [{ field: 'Id', operator: 'equal', type: 'string', value }] }), subQueryRule: null, subQueryRelation: null };
        const res = await apiClient.executeDynamicSOQL(paramsObj);
        if (res.status === 'error' || !res.records?.length) return;
        const rec = res.records[0];
        const rel: RelationRec = { Id: String(rec.Id), Name: String(rec[nameField] || rec.Id) };
        setMuiOptions([rel]);
        setAutocompleteVal(rel);
      } catch { /* swallow */ }
    };
    if (!primeFromRelation()) { void primeFromId(); }
  }, [data, value, fieldMetadata, currentObjectType, getReferenceMetadata, isSalesforceId, resolveTypeByPrefix, altNameFieldByObject, apiClient]);

  // Null-safe helpers mirroring dialog editor
  const safeIsOptionEqualToValue = (option: RelationRec, val: RelationRec | null) => {
    try { return !!val && option?.Id === val?.Id; } catch { return false; }
  };

  const safeGetOptionLabel = (option: RelationRec) => {
    try { return option && typeof option.Name === 'string' ? option.Name : ''; } catch { return ''; }
  };

  const safeOptions = useMemo(() => (Array.isArray(muiOptions)
    ? muiOptions.filter((o: any) => o && typeof o === 'object' && 'Id' in o && 'Name' in o)
    : []
  ), [muiOptions]);

  const safeValue: RelationRec | null = (autocompleteVal && typeof autocompleteVal === 'object' && 'Id' in autocompleteVal && 'Name' in autocompleteVal)
    ? autocompleteVal : null;

  return (
    <Autocomplete
      sx={{
        '& .MuiAutocomplete-popupIndicator': { color: theme.palette.text.primary },
      }}
      autoComplete
      ref={domRef}
      fullWidth
      loading={loading}
      getOptionLabel={safeGetOptionLabel as any}
      inputValue={inputValue}
      onChange={(_event, newValue: RelationRec | null) => {
        try {
          if (newValue === null) {
            setAutocompleteVal(null);
            onValueChange(null);
            stopEditing();
            return;
          }
          setAutocompleteVal(newValue);
          const relation = fieldMetadata!.relationshipName as string;
          if (relation) { (data as any)[relation] = newValue; }
          onValueChange(newValue.Id);
          stopEditing();
        } catch (err) {
          enqueueSnackbar('Selection error', { action, variant: 'error' });
          console.error('[MuiAutocompleteEditor-agGrid] onChange error', err);
        }
      }}
      onInputChange={(_event, value, reason) => {
        if (reason === 'input') {
          setInputValue(value);
          if (value.length > 2) {
            getData(value);
          }
        }
      }}
      options={safeOptions}
      renderInput={(params) => (
        <TextField
          {...params}
          sx={{
            color: theme.palette.text.primary,
            '& .MuiInputBase-input': { color: theme.palette.text.primary },
          }}
        />
      )}
      isOptionEqualToValue={safeIsOptionEqualToValue as any}
      value={safeValue}
    />
  );
});

export { MuiAutocompleteEditor };
