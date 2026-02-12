import React, { useEffect, useCallback, useState, memo } from 'react';

// Zustand
import useStore from '../../../zustandStore';
import { useShallow } from 'zustand/react/shallow';


// Notifications
import { useSnackbar } from 'notistack';

// MUI
import { Autocomplete, TextField } from '@mui/material';

import { useTheme } from '@mui/material';

import { SObject, SObjectFieldMetadata, SObjectMetadata } from '../../../sObjectMetadataTypes';

import { Column, GridApi } from 'ag-grid-community';

import { APIClient } from '../../../brideDesignPattern/apiInterface';

interface TimeSeriesAutocompleteEditorProps {
  api: GridApi;
  apiClient: APIClient;
  column: Column;
  data: SObject;
  initialValue: boolean;
  objMetadataMap: React.RefObject<Map<string, SObjectMetadata>>;
  onValueChange: (value: any) => void;
  rowDataCopy: SObject[];
  setRowDataCopy: (value: any) => void;
  stopEditing: () => void;
  value: string | number | object;
}

type RelationRec = {
  Id: string;
  Name: string;
};

const TimeSeriesAutocompleteEditor = memo(function TimeSeriesAutocompleteEditor({
  api,
  apiClient,
  column,
  data,
  initialValue,
  objMetadataMap,
  onValueChange,
  rowDataCopy,
  setRowDataCopy,
  stopEditing,
  value,
}: TimeSeriesAutocompleteEditorProps) {
  console.log('TimeSeriesAutocompleteEditor props are');
  console.dir({
    column: column,
    data: data,
    initialValue: initialValue,
    objMetadataMap: objMetadataMap.current,
    rowDataCopy: rowDataCopy,
    value: value
  });

  const theme = useTheme();

  const domRef = React.useRef<HTMLInputElement>(null);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const action = useCallback(
    (snackbarId: any) => (
      <>
        <button onClick={() => closeSnackbar(snackbarId)}>Dismiss</button>
      </>
    ),
    [closeSnackbar]
  );

  const {
    transposedRowData,
    selectedObjMetadata } = useStore(
      useShallow((state) => ({
        transposedRowData: state.transposedRowData,
        selectedObjMetadata: state.selectedObjMetadata,
      }))
    );

  // Local state
  const [autocompleteVal, setAutocompleteVal] = useState<RelationRec | null>(null);

  const [inputValue, setInputValue] = useState('');

  const [loading, setLoading] = useState(false);

  const [muiOptions, setMuiOptions] = useState<RelationRec[]>([]);

  const [currentObjectType, setCurrentObjectType] = useState<string | null>(null);

  // Helper function to fetch parent metadata
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

    const fieldMetadata = selectedObjMetadata?.fields.find((f: SObjectFieldMetadata) => f.name === data.property);

    if (!fieldMetadata) {
      enqueueSnackbar('Field metadata not found.', { action, variant: 'error' });
      setLoading(false);
      return;
    }

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
        queryType: 'QueryBuilder',
        sObjectName: referenceTo,
        queryRule: JSON.stringify(queryRule),
        subQueryRule: null,
        subQueryRelation: null
      };

      const apiResult = await apiClient.executeDynamicSOQL(paramsObj);

      if (apiResult.status === 'error') {
        throw new Error(apiResult.errorMessage)
      }

      const suggestData: RelationRec[] = [];

      if (apiResult.records) {
        apiResult.records.map((r: any) => {
          suggestData.push({
            Id: String(r.Id),
            Name: String(r[parentNameField])
          })
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
  // note: we need to get the relation from the normalized data
  useEffect(() => {
    try {
      // data is the transposed row
      const fieldName = data.property;

      const fieldMetadata = selectedObjMetadata?.fields.find((f: SObjectFieldMetadata) => f.name === fieldName);

      const relationshipName = fieldMetadata?.relationshipName;

      if (value && relationshipName) {
        // get the transposed id row
        const idRow = transposedRowData.find((r: any) => r.property === 'Id');

        if (!idRow) {
          throw new Error('unexpected error: did not find Id row')
        }

        const colName = column.getColId();

        const rowId = idRow[colName!]

        // now get the normalized row
        const normalizedRow = rowDataCopy.find((f: SObject) => f.Id === rowId);

        if (!normalizedRow) {
          throw new Error('unexpected error: did not find normalized Id row')
        }

        // get the relation
        const relationObj = normalizedRow[relationshipName] as RelationRec

        if (!relationObj) {
          throw new Error('unexpected error: did not find relation')
        }

        setMuiOptions([relationObj]);
        setAutocompleteVal(relationObj);

      }
    } catch (error: any) {
      enqueueSnackbar(error.message, {
        action: action,
        variant: 'error',
      });
    }
  }, [action, api, column, data.property, enqueueSnackbar, rowDataCopy, selectedObjMetadata?.fields, transposedRowData, value]);

  return (
    <Autocomplete
      sx={{
        '& .MuiAutocomplete-popupIndicator': { color: theme.palette.text.primary },
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

        const fieldMetadata = selectedObjMetadata?.fields.find((f: SObjectFieldMetadata) => f.name === data.property);
        setAutocompleteVal(newValue);
        const relation = fieldMetadata?.relationshipName;

        // Find the Id column
        const idObj = transposedRowData.find((f: any) => f.property === 'Id');

        const colName = column.getColId()!;

        const idVal = idObj?.[colName];

        // Find the normalized row with this Id
        const dataRow = rowDataCopy.find((f: SObject) => f.Id === idVal);

        // Update the relation in the data row
        if (dataRow && relation) {
          const dataRowCopy = { ...dataRow };
          dataRowCopy[relation] = newValue;
          dataRowCopy[data.property as string] = newValue.Id;

          setRowDataCopy((prevData: any) =>
            prevData.map((item: SObject) =>
              item.Id === dataRowCopy.Id ? { ...item, ...dataRowCopy } : item
            )
          );
        }

        // Notify grid of value change
        onValueChange(newValue!.Id);
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
            color: theme.palette.text.primary,
            '& .MuiInputBase-input': { color: theme.palette.text.primary },
          }}
        />
      )}
      value={autocompleteVal}
    />
  );
});

export { TimeSeriesAutocompleteEditor };