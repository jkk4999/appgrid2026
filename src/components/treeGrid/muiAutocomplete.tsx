import React, { useEffect, useCallback, useState, memo } from 'react';

import useStore from '../../zustandStore';

import { useShallow } from 'zustand/react/shallow';

import { useSnackbar } from 'notistack';

import { Autocomplete, TextField } from '@mui/material';

import { SObject, SObjectFieldMetadata, SObjectMetadata } from '../../sObjectMetadataTypes';

import { ColDef, Column, RowNode } from 'ag-grid-community';

import { APIClient } from '../../brideDesignPattern/apiInterface';

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
  const domRef = React.useRef<HTMLInputElement>(null);

  const [autocompleteVal, setAutocompleteVal] = useState<RelationRec | null>(null);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const action = useCallback(
    (snackbarId: any) => (
      <>
        <button onClick={() => closeSnackbar(snackbarId)}>Dismiss</button>
      </>
    ),
    [closeSnackbar]
  );

  const { muiColor } = useStore(
    useShallow((state) => ({
      muiColor: state.muiColor,
      selectedObjMetadata: state.selectedObjMetadata,
    }))
  );

  // Local state
  const [inputValue, setInputValue] = useState('');

  const [loading, setLoading] = useState(false);

  const [muiOptions, setMuiOptions] = useState<RelationRec[]>([]);

  const [currentObjectType, setCurrentObjectType] = useState<string | null>(null);

  // Fetch parent metadata
  const getReferenceMetadata = async (parentObjName: string) => {
    let metadata = null;
    if (!objMetadataMap.current.has(parentObjName)) {
      metadata = await apiClient.getMetadata({ sObjectName: parentObjName });
      objMetadataMap.current.set(parentObjName, metadata);
    } else {
      metadata = objMetadataMap.current.get(parentObjName);
    }
    return metadata;
  };

  // Set initial object type based on value
  useEffect(() => {
    // Determine object type from record ID
    const determineObjectType = async (recordId: string) => {
      try {
        const apiResult = await apiClient.getSObjectName({ recordId });
        if (apiResult.status === 'success') {
          setCurrentObjectType(apiResult.sObjectName);
        } else {
          throw new Error(apiResult.errorMsg);
        }
      } catch (error: any) {
        enqueueSnackbar(`Error determining object type: ${error.message}`, { action, variant: 'error' });
      }
    };
    if (value && typeof value === 'string') {
      determineObjectType(value);
    }
  }, [action, apiClient, enqueueSnackbar, value]);

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

    const parentNameField = parentNameFieldMetadata!.name;

    const parentNameFieldLabel = parentNameFieldMetadata!.label;

    try {
      const queryRule = {
        condition: 'and',
        rules: [
          {
            label: parentNameFieldLabel,
            field: parentNameField,
            type: 'string',
            operator: 'beginswith',
            value: value,
          },
        ],
      };

      const paramsObj = {
        sObjectName: referenceTo,
        queryRule: JSON.stringify(queryRule),
        subQueryRule: null,
        subQueryRelation: null,
      };

      const apiResult = await apiClient.executeDynamicSOQL(paramsObj);

      if (apiResult.status === 'error') {
        throw new Error(apiResult.errorMessage);
      }

      const suggestData: RelationRec[] = [];

      if (apiResult.records) {
        apiResult.records.map((rec: any) => {
          suggestData.push({
            Id: String(rec.Id),
            Name: String(rec[parentNameField]),
          });
        });
      }

      setMuiOptions(suggestData || []);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setLoading(false);
      enqueueSnackbar(error.message, { action, variant: 'error' });
    }
  };

  // Populate initial options
  useEffect(() => {
    const relationshipName = fieldMetadata!.relationshipName;
    if (data && value && relationshipName) {
      const relationRec: RelationRec = data[relationshipName] as RelationRec;
      if (relationRec) {
        setMuiOptions([relationRec]);
        setAutocompleteVal(relationRec);
      } else {
        enqueueSnackbar('Relation not found on record', { action, variant: 'error' });
      }
    }
  }, [action, data, enqueueSnackbar, fieldMetadata, value]);

  return (
    <Autocomplete
      sx={{
        '& .MuiAutocomplete-popupIndicator': { color: muiColor },
      }}
      autoComplete
      ref={domRef}
      fullWidth
      loading={loading}
      getOptionLabel={(option) => (option ? option.Name : '')}
      inputValue={inputValue}
      onChange={(_event, newValue: RelationRec | null) => {
        if (newValue === null) {
          setAutocompleteVal(null);
          return;
        }
        setAutocompleteVal(newValue);
        const relation = fieldMetadata?.relationshipName;
        if (relation) {
          data[relation as keyof typeof data] = newValue as any;
        }
        onValueChange(newValue.Id);
        stopEditing();
      }}
      onInputChange={(_event, value, reason) => {
        if (reason === 'input') {
          setInputValue(value);
          if (value.length > 2) {
            getData(value);
          }
        }
      }}
      options={muiOptions ?? []}
      renderInput={(params) => (
        <TextField
          {...params}
          sx={{
            color: muiColor,
            '& .MuiInputBase-input': { color: muiColor },
          }}
        />
      )}
      value={autocompleteVal}
    />
  );
});

export { MuiAutocompleteEditor };