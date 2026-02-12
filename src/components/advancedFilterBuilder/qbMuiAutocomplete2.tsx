import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';

import { useSnackbar, SnackbarKey } from 'notistack';

import { Autocomplete, TextField, IconButton, Menu, MenuItem, alpha, Box, useTheme } from '@mui/material';

import FileDownloadIcon from '@mui/icons-material/FileDownload';

import useStore from '../../zustandStore';

import { APIClient, QueryServiceParams } from '../../brideDesignPattern/apiInterface';

import { useShallow } from 'zustand/react/shallow';

interface Option {
  id: string;
  name: string;
}

interface WhoIdOption {
  label: string;
  name: string;
}

interface WhatIdOption {
  label: string;
  name: string;
}

interface MuiAutocompleteEditorProps {
  apiClient: APIClient;
  qryBldrRef: React.RefObject<any>;
  rule: any;
  ruleID: string;
  fieldMetadata: {
    referenceTo: string[];
    relationshipName?: string;
    isNillable?: boolean;
    label?: string;
  };
  objMetadataMap?: React.RefObject<Map<string, any>>;
}

const MuiAutocompleteEditor: React.FC<MuiAutocompleteEditorProps> = ({
  apiClient,
  qryBldrRef,
  rule,
  ruleID,
  fieldMetadata,
  objMetadataMap,
}) => {
  const theme = useTheme();

  // Notifications
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // Global state
  const { selectedAccentColor, objectOptions } = useStore(
    useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor,
      objectOptions: state.objectOptions,
    }))
  );

  // Local state
  const [options, setOptions] = useState<Option[]>([]);
  const [value, setValue] = useState<Option | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [parentObjName] = useState<string>('');
  const [selectedWhatObjectType, setSelectedWhatObjectType] = useState<string>('');
  const [selectedWhoObjectType, setSelectedWhoObjectType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const initialDataLoaded = useRef(false);

  // Menu anchors
  const [whoAnchorEl, setWhoAnchorEl] = useState<null | HTMLElement>(null);
  const [whatAnchorEl, setWhatAnchorEl] = useState<null | HTMLElement>(null);

  // Styling
  const disabledLabel = alpha(selectedAccentColor, 0.8);

  // Options for polymorphic fields
  const whatIdOptions: WhatIdOption[] = useMemo(
    () => objectOptions.map((item: any) => ({ name: item.QualifiedApiName, label: item.Label })),
    [objectOptions]
  );

  const whoIdOptions: WhoIdOption[] = [
    { name: 'Lead', label: 'Lead' },
    { name: 'Contact', label: 'Person' },
  ];

  // Menu handlers
  const handleWhoMenuClose = () => setWhoAnchorEl(null);

  const handleWhatMenuClose = () => setWhatAnchorEl(null);

  const handleWhoMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => setWhoAnchorEl(event.currentTarget);

  const handleWhatMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => setWhatAnchorEl(event.currentTarget);

  const handleWhatSelectChange = (option: WhatIdOption) => {
    setSelectedWhatObjectType(option.name);

    setValue(null);

    setOptions([]);

    setInputValue('');

    const elem = document.getElementById(ruleID)?.querySelector('.e-rule-value');

    if (elem) {
      qryBldrRef.current.notifyChange(null, elem, 'value');
    }
    handleWhatMenuClose();
  };

  const handleWhoSelectChange = (option: WhoIdOption) => {
    setSelectedWhoObjectType(option.name);
    setValue(null);
    setOptions([]);
    setInputValue('');
    const elem = document.getElementById(ruleID)?.querySelector('.e-rule-value');
    if (elem) {
      qryBldrRef.current.notifyChange(null, elem, 'value');
    }
    handleWhoMenuClose();
  };

  // Snackbar action
  const action = useCallback(
    (snackbarId: SnackbarKey | undefined) => (
      <button onClick={() => closeSnackbar(snackbarId)}>Dismiss</button>
    ),
    [closeSnackbar]
  );

  // Fetch parent metadata
  const getReferenceMetadata = useCallback(
    async (parentObjName: string) => {
      if (!objMetadataMap?.current?.has(parentObjName)) {
        const metadata = await apiClient.getMetadata({ sObjectName: parentObjName });
        if (metadata) {
          objMetadataMap?.current?.set(parentObjName, metadata);
        }
        return metadata;
      }
      return objMetadataMap?.current?.get(parentObjName);
    },
    [apiClient, objMetadataMap]
  );

  // Fetch autocomplete data
  const getData = useCallback(
    async (value: string) => {
      if (!value) {
        setOptions([]);
        setInputValue('');
        setLoading(false);
        return;
      }

      setLoading(true);

      let referenceTo: string | undefined;
      if (rule.field === 'WhoId' && selectedWhoObjectType) {
        referenceTo = selectedWhoObjectType;
      } else if (rule.field === 'WhatId' && selectedWhatObjectType) {
        referenceTo = selectedWhatObjectType;
      } else if (fieldMetadata.referenceTo.length > 1) {
        if (!parentObjName) {
          setLoading(false);
          setInputValue(value);
          return;
        }
        referenceTo = parentObjName;
      } else {
        referenceTo = fieldMetadata.referenceTo.find((ref: string) => ref !== 'Group') || fieldMetadata.referenceTo[0];
      }

      if (!referenceTo) {
        setLoading(false);
        setInputValue(value);
        enqueueSnackbar('No valid lookup relation found', { action, variant: 'error' });
        return;
      }

      try {
        const parentMetadata = await getReferenceMetadata(referenceTo);

        const parentNameField = parentMetadata?.fields.find((f: any) => f.isNameField)?.name || 'Name';

        if (!parentNameField) {
          throw new Error(`Name field not found for ${referenceTo}`);
        }

        const queryRule = {
          condition: 'and',
          isNot: false,
          rules: [
            {
              field: parentNameField,
              label: parentNameField,
              operator: 'startswith',
              type: 'string',
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

        const apiResult = await apiClient.executeDynamicSOQL(paramsObj);

        if (apiResult.status === 'error') {
          throw new Error(apiResult.errorMessage);
        }

        const result = (apiResult.records!).map((r: any) => ({
          id: String(r.Id || ''),
          name: String(r[parentNameField] || ''),
        }));

        console.log('getData - setting autocomplete options to');
        console.dir(result);

        setOptions([...result]);
      } catch (error: any) {
        console.error(`getData - Query failed for ${referenceTo}: ${error.message}`);
        enqueueSnackbar(`Error fetching options: ${error.message}`, { action, variant: 'error' });
        setOptions([]);
        setInputValue(value);
      } finally {
        setLoading(false);
      }
    },
    [rule.field, selectedWhoObjectType, selectedWhatObjectType, fieldMetadata.referenceTo, parentObjName, enqueueSnackbar, action, getReferenceMetadata, apiClient]
  );

  // Fetch initial data for the rule value
  const getInitialData = useCallback(
    async (value: string) => {
      if (!value) {
        setValue(null);
        setOptions([]);
        setInputValue('');
        return;
      }

      setLoading(true);

      let referenceTo: string;

      if (rule.field === 'WhoId' && selectedWhoObjectType) {
        referenceTo = selectedWhoObjectType;
      } else if (rule.field === 'WhatId' && selectedWhatObjectType) {
        referenceTo = selectedWhatObjectType;
      } else if (fieldMetadata.referenceTo.length > 1) {
        referenceTo = parentObjName;
        if (!referenceTo) {
          setLoading(false);
          setInputValue('');
          return;
        }
      } else {
        referenceTo = fieldMetadata.referenceTo.find((ref: string) => ref !== 'Group') || fieldMetadata.referenceTo[0];
      }

      console.log(`getInitialData - referenceTo is ${referenceTo}`);

      try {
        const parentMetadata = await getReferenceMetadata(referenceTo);

        const parentNameField = parentMetadata?.fields.find((f: any) => f.isNameField)?.name || 'Name';
        console.log('getInitialData - parentNameField is');
        console.dir(parentNameField);

        if (!parentNameField) {
          throw new Error(`Name field not found for ${referenceTo}`);
        }

        const queryRule = {
          condition: 'and',
          rules: [
            {
              label: 'Id',
              field: 'Id',
              type: 'string',
              operator: 'equal',
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

        if (!apiResult) {
          throw new Error('Unexpected error fetching initial data');
        }

        console.log('getInitialData - apiResult is');
        console.dir(apiResult);

        if (apiResult.status === 'error') {
          throw new Error(apiResult.errorMessage);
        }

        if (!apiResult.records) {
          throw new Error('Unexpected error fetching initial data - records property not found');
        }

        const result = (apiResult.records).map((r: any) => ({
          id: String(r.Id || ''),
          name: String(r[parentNameField] || ''),
        }));

        console.log('getInitialData - setting autocomplete options to');
        console.dir(result);
        setOptions(result);

        if (result.length > 0) {
          const initialOption = result[0];
          setValue(initialOption);
          setInputValue(initialOption.name);
          console.log('getInitialData - setting autocomplete value to');
          console.dir(initialOption);
          console.log('getInitialData - setting inputValue to:', initialOption.name);

          const elem = document.getElementById(ruleID)?.querySelector('.e-rule-value');
          if (elem) {
            console.log('getInitialData - Before notifyChange - rule.value:', rule.value);

            qryBldrRef.current.notifyChange(initialOption.id, elem, 'value');

            console.log('getInitialData - After notifyChange - rule.value:', rule.value);
          }
        } else {
          setValue(null);

          setInputValue('');
        }
      } catch (error: any) {
        console.error(`getInitialData - Error: ${error.message}`);

        enqueueSnackbar(`Error retrieving relationship: ${error.message}`, { action, variant: 'error' });

        setValue(null);

        setInputValue('');
      } finally {
        setLoading(false);
      }
    },
    [rule.field, rule.value, selectedWhoObjectType, selectedWhatObjectType, fieldMetadata.referenceTo, parentObjName, getReferenceMetadata, apiClient, ruleID, qryBldrRef, enqueueSnackbar, action]
  );

  // Initialize value and parent object type
  useEffect(() => {
    if (rule && rule.value && !initialDataLoaded.current) {
      console.log('useEffect - calling getInitialData with rule.value:', rule.value);
      initialDataLoaded.current = true;
      getInitialData(rule.value);
    }
  }, [getInitialData, rule]);

  // Handle input change
  const onInputChange = async (_event: React.SyntheticEvent, newInputValue: string, reason: string) => {
    setInputValue(newInputValue);
    if (newInputValue && newInputValue.length > 2 && reason === 'input') {
      console.log(`qbMuiAutocomplete onInputChange() - getting data for ${newInputValue}`);
      await getData(newInputValue);
    } else {
      setOptions([]);
    }
  };

  return (
    <Box>
      {rule.field === 'WhoId' && (
        <>
          <IconButton onClick={handleWhoMenuOpen} sx={{ color: theme.palette.text.primary }}>
            <FileDownloadIcon />
          </IconButton>
          <Menu
            anchorEl={whoAnchorEl}
            open={Boolean(whoAnchorEl)}
            onClose={handleWhoMenuClose}
            sx={{ zIndex: 1000 }}
          >
            {whoIdOptions.map((option, index) => (
              <MenuItem
                key={index}
                onClick={() => handleWhoSelectChange(option)}
                selected={selectedWhoObjectType === option.name}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    color: 'red',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  },
                }}
              >
                {option.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
      {rule.field === 'WhatId' && (
        <>
          <IconButton onClick={handleWhatMenuOpen} sx={{ color: theme.palette.text.primary }}>
            <FileDownloadIcon />
          </IconButton>
          <Menu
            anchorEl={whatAnchorEl}
            open={Boolean(whatAnchorEl)}
            onClose={handleWhatMenuClose}
            sx={{ zIndex: 1000 }}
          >
            {whatIdOptions.map((option, index) => (
              <MenuItem
                key={index}
                onClick={() => handleWhatSelectChange(option)}
                selected={selectedWhatObjectType === option.name}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    color: 'red',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  },
                }}
              >
                {option.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
      <Autocomplete
        disablePortal
        value={value}
        autoComplete
        fullWidth
        getOptionLabel={(option: Option) => option.name}
        onInputChange={onInputChange}
        inputValue={inputValue}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        onChange={(event, value) => {
          const elem = document.getElementById(ruleID)?.querySelector('.e-rule-value');
          if (elem && value) {
            console.log('onChange - setting value to');
            console.dir({
              options: options,
              value: value
            })
            setValue(value);
            qryBldrRef.current.notifyChange(value.id, elem, 'value');
            console.log('onChange - After notifyChange - rule.value:', rule.value);
          }
        }}
        sx={{
          mt: -1,
        }}
        slotProps={{
          popper: {
            sx: {
              zIndex: 3000,
            },
            placement: 'bottom-start', // Position the popper below the control
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label={fieldMetadata.label || rule.field}
            required={!fieldMetadata.isNillable}
            disabled={loading}
            sx={{
              mt: -1,
              '& .MuiInputBase-input': {
                color: theme.palette.text.primary,
              },
              '& .MuiFormLabel-root': {
                color: selectedAccentColor,
                '&&': {
                  color: selectedAccentColor,
                },
              },
              '& .MuiInputBase-input.Mui-disabled': {
                color: '#888888',
                WebkitTextFillColor: '#888888',
              },
              '& .MuiFormLabel-root.Mui-disabled': {
                color: disabledLabel,
              },
            }}
          />
        )}
        size="small"
        options={options}
        loading={loading}
      />
    </Box>
  );
};

export default MuiAutocompleteEditor;