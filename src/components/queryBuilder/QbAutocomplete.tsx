import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';

import { useSnackbar, SnackbarKey } from 'notistack';

import { Autocomplete, TextField, IconButton, Menu, MenuItem, Box, useTheme } from '@mui/material';

import FileDownloadIcon from '@mui/icons-material/FileDownload';

import useStore from '../../zustandStore';

import { QueryServiceParams } from '../../brideDesignPattern/apiInterface';

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

interface QbAutocompleteProps {
  apiClient: any;
  qryBldrRef: React.RefObject<any>;
  rule: any;
  ruleID: string;
  fieldMetadata: {
    name?: string;
    referenceTo: string[];
    relationshipName?: string;
    isNillable?: boolean;
    label?: string;
  };
  objMetadataMap?: React.RefObject<Map<string, any>>;
  /**
   * API variant determines which API methods to use:
   * - 'main': Uses apiClient.getMetadata() with sObjectName param (main grid)
   * - 'subgrid': Uses apiClient.getObjMetadata() with sObjectApiName param (subgrid)
   */
  variant?: 'main' | 'subgrid';
}

// Known alternate display fields for objects without a true Name field
const ALT_NAME_FIELDS: Record<string, string> = {
  Case: 'CaseNumber',
  Contract: 'ContractNumber',
  Order: 'OrderNumber',
  Task: 'Subject',
  Event: 'Subject',
  CampaignMember: 'Id',
};

// Common Salesforce ID prefixes for polymorphic field resolution
const ID_PREFIX_MAP: Record<string, string> = {
  '001': 'Account',
  '003': 'Contact',
  '005': 'User',
  '00G': 'Group',
  '00Q': 'Lead',
  '006': 'Opportunity',
  '500': 'Case',
  '800': 'Contract',
  '801': 'Order',
  '00T': 'Task',
  '00U': 'Event',
};

const QbAutocomplete: React.FC<QbAutocompleteProps> = ({
  apiClient,
  qryBldrRef,
  rule,
  ruleID,
  fieldMetadata,
  objMetadataMap,
  variant = 'main',
}) => {
  const theme = useTheme();

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

  const [parentObjName, setParentObjName] = useState<string>('');

  const [selectedWhatObjectType, setSelectedWhatObjectType] = useState<string>('');

  const [selectedWhoObjectType, setSelectedWhoObjectType] = useState<string>('');

  const [loading, setLoading] = useState(false);

  const initialDataLoaded = useRef(false);

  // Menu anchors for polymorphic fields
  const [whoAnchorEl, setWhoAnchorEl] = useState<null | HTMLElement>(null);

  const [whatAnchorEl, setWhatAnchorEl] = useState<null | HTMLElement>(null);

  // Options for polymorphic fields
  const whatIdOptions: WhatIdOption[] = useMemo(
    () => objectOptions.map((item: any) => ({ name: item.QualifiedApiName, label: item.Label })),
    [objectOptions]
  );

  const whoIdOptions: WhoIdOption[] = [
    { name: 'Lead', label: 'Lead' },
    { name: 'Contact', label: 'Person' },
  ];

  // Snackbar action
  const action = useCallback(
    (snackbarId: SnackbarKey | undefined) => (
      <button onClick={() => closeSnackbar(snackbarId)}>Dismiss</button>
    ),
    [closeSnackbar]
  );

  // Utility: validate Salesforce 15/18-char IDs
  const isSalesforceId = useCallback((v: any): boolean => {
    if (!v || typeof v !== 'string') return false;
    return /^[A-Za-z0-9]{15}(?:[A-Za-z0-9]{3})?$/.test(v);
  }, []);

  // Resolve SObject type by ID prefix
  const resolveTypeByPrefix = useCallback((id: string): string | null => {
    if (!isSalesforceId(id)) return null;

    const prefix = id.substring(0, 3);

    return ID_PREFIX_MAP[prefix] || null;
  }, [isSalesforceId]);

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

  // Fetch metadata based on variant
  const getMetadata = useCallback(
    async (sObjectName: string) => {
      // Check cache first
      if (objMetadataMap?.current?.has(sObjectName)) {
        return objMetadataMap.current.get(sObjectName);
      }

      let metadata;

      if (variant === 'subgrid') {
        metadata = await apiClient.getObjMetadata({ sObjectApiName: sObjectName });
      } else {
        metadata = await apiClient.getMetadata({ sObjectName });
      }

      // Cache the result
      if (metadata && objMetadataMap?.current) {
        objMetadataMap.current.set(sObjectName, metadata);
      }

      return metadata;
    },
    [apiClient, objMetadataMap, variant]
  );

  // Execute SOQL query based on variant
  const executeQuery = useCallback(
    async (sObjectName: string, queryRule: any) => {
      const params: QueryServiceParams = variant === 'subgrid'
        ? {
          sObjectApiName: sObjectName,
          queryRule: JSON.stringify(queryRule),
          subQueryRule: null,
          subQueryRelation: null,
        } as any
        : {
          sObjectName,
          queryRule: JSON.stringify(queryRule),
          subQueryRule: null,
          subQueryRelation: null,
        };

      return apiClient.executeDynamicSOQL(params);
    },
    [apiClient, variant]
  );

  // Fetch autocomplete data
  const getData = useCallback(
    async (searchValue: string) => {
      if (!searchValue) {
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
        // Polymorphic field - try to resolve by ID prefix
        const guessed = resolveTypeByPrefix(searchValue);

        if (guessed && fieldMetadata.referenceTo.includes(guessed)) {
          referenceTo = guessed;
        } else if (parentObjName) {
          referenceTo = parentObjName;
        } else {
          referenceTo = fieldMetadata.referenceTo.find((ref: string) => ref !== 'Group') || fieldMetadata.referenceTo[0];
        }
      } else {
        referenceTo = fieldMetadata.referenceTo.find((ref: string) => ref !== 'Group') || fieldMetadata.referenceTo[0];
      }

      if (!referenceTo) {
        setLoading(false);

        setInputValue(searchValue);

        enqueueSnackbar('No valid lookup relation found', { action, variant: 'error' });

        return;
      }

      try {
        const parentMetadata = await getMetadata(referenceTo);

        const parentNameField = parentMetadata?.fields.find((f: any) => f.isNameField)?.name
          || ALT_NAME_FIELDS[referenceTo]
          || 'Id';

        const queryRule = {
          condition: 'and',
          isNot: false,
          rules: [
            {
              field: parentNameField,
              label: parentNameField,
              operator: 'startswith',
              type: 'string',
              value: searchValue,
            },
          ],
        };

        const apiResult = await executeQuery(referenceTo, queryRule);

        if (apiResult.status === 'error') {
          throw new Error(apiResult.errorMessage);
        }

        const mappedOptions = (apiResult.records || []).map((record: any) => ({
          id: String(record.Id || ''),
          name: String(record[parentNameField] || record.Id),
        }));

        setOptions(mappedOptions);

        setInputValue(searchValue);
      } catch (error: any) {
        enqueueSnackbar(`Error fetching options: ${error.message}`, { action, variant: 'error' });

        setOptions([]);

        setInputValue(searchValue);
      } finally {
        setLoading(false);
      }
    },
    [
      action,
      enqueueSnackbar,
      executeQuery,
      fieldMetadata.referenceTo,
      getMetadata,
      parentObjName,
      resolveTypeByPrefix,
      rule.field,
      selectedWhatObjectType,
      selectedWhoObjectType,
    ]
  );

  // Fetch initial data for the rule value
  const getInitialData = useCallback(
    async (initialValue: string) => {
      if (!initialValue) {
        setValue(null);
        setOptions([]);
        setInputValue('');
        return;
      }

      setLoading(true);

      let referenceTo: string | undefined;

      if (rule.field === 'WhoId' && selectedWhoObjectType) {
        referenceTo = selectedWhoObjectType;
      } else if (rule.field === 'WhatId' && selectedWhatObjectType) {
        referenceTo = selectedWhatObjectType;
      } else if (fieldMetadata.referenceTo.length > 1) {
        // Polymorphic field
        if (isSalesforceId(initialValue)) {
          const guessed = resolveTypeByPrefix(initialValue);

          if (guessed && fieldMetadata.referenceTo.includes(guessed)) {
            referenceTo = guessed;
          } else {
            // Need to query Salesforce for the SObject type
            try {
              const typeResult = await apiClient.getSObjectName({ recordId: initialValue });

              if (typeResult.status === 'error') {
                throw new Error(typeResult.errorMsg || 'Failed to determine SObject type');
              }

              referenceTo = typeResult.sObjectName;
              if (referenceTo) {
                setParentObjName(referenceTo);
                if (rule.field === 'WhoId') setSelectedWhoObjectType(referenceTo);
                if (rule.field === 'WhatId') setSelectedWhatObjectType(referenceTo);
              }
            } catch {
              referenceTo = fieldMetadata.referenceTo[0];
            }
          }
        } else {
          referenceTo = fieldMetadata.referenceTo[0];
        }
      } else {
        referenceTo = fieldMetadata.referenceTo.find((ref: string) => ref !== 'Group') || fieldMetadata.referenceTo[0];
      }

      if (!referenceTo) {
        setLoading(false);
        return;
      }

      try {
        const parentMetadata = await getMetadata(referenceTo);
        const parentNameField = parentMetadata?.fields.find((f: any) => f.isNameField)?.name
          || ALT_NAME_FIELDS[referenceTo]
          || 'Id';

        const queryRule = isSalesforceId(initialValue)
          ? {
            condition: 'and',
            isNot: false,
            rules: [{ label: 'Id', field: 'Id', type: 'string', operator: 'equal', value: initialValue }],
          }
          : {
            condition: 'and',
            isNot: false,
            rules: [{ label: parentNameField, field: parentNameField, type: 'string', operator: 'startswith', value: initialValue }],
          };

        const apiResult = await executeQuery(referenceTo, queryRule);

        if (apiResult.status === 'error') {
          throw new Error(apiResult.errorMessage);
        }

        const mappedOptions = (apiResult.records || []).map((record: any) => ({
          id: String(record.Id || ''),
          name: String(record[parentNameField] || record.Id),
        }));

        setOptions(mappedOptions);

        if (mappedOptions.length > 0) {
          const initialOption = mappedOptions[0];
          setValue(initialOption);
          setInputValue(initialOption.name);
        } else {
          setValue(null);
          setInputValue('');
        }
      } catch (error: any) {
        enqueueSnackbar(`Error retrieving relationship: ${error.message}`, { action, variant: 'error' });
        setValue(null);
        setInputValue('');
      } finally {
        setLoading(false);
      }
    },
    [
      action,
      apiClient,
      enqueueSnackbar,
      executeQuery,
      fieldMetadata.referenceTo,
      getMetadata,
      isSalesforceId,
      resolveTypeByPrefix,
      rule.field,
      selectedWhatObjectType,
      selectedWhoObjectType,
    ]
  );

  // Track last loaded value to detect when we need to reload
  const lastLoadedValueRef = useRef<string | null>(null);

  // Initialize value on mount or when rule.value changes
  useEffect(() => {
    // Extract value - handle both single value and array (for backwards compatibility)
    let currentValue = rule?.value;
    if (Array.isArray(currentValue)) {
      currentValue = currentValue[0] || null;
    }

    // Skip if no value or if we already loaded this exact value
    if (!currentValue || lastLoadedValueRef.current === currentValue) {
      return;
    }

    // Mark this value as being loaded
    lastLoadedValueRef.current = currentValue;
    initialDataLoaded.current = true;
    getInitialData(currentValue);
  }, [getInitialData, rule?.value]);

  // Handle input change
  const onInputChange = async (_event: React.SyntheticEvent, newInputValue: string, reason: string) => {
    setInputValue(newInputValue);
    if (newInputValue && newInputValue.length > 2 && reason === 'input') {
      await getData(newInputValue);
    } else if (reason === 'input') {
      setOptions([]);
    }
  };

  // Handle selection change
  const handleChange = (_event: React.SyntheticEvent, newValue: Option | null) => {
    setValue(newValue);
    const elem = document.getElementById(ruleID)?.querySelector('.e-rule-value');
    if (elem && newValue) {
      qryBldrRef.current.notifyChange(newValue.id, elem, 'value');
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {rule.field === 'WhoId' && (
        <>
          <IconButton onClick={handleWhoMenuOpen} sx={{ color: theme.palette.text.primary }}>
            <FileDownloadIcon />
          </IconButton>
          <Menu
            anchorEl={whoAnchorEl}
            open={Boolean(whoAnchorEl)}
            onClose={handleWhoMenuClose}
            sx={{ zIndex: 3000 }}
          >
            {whoIdOptions.map((option, index) => (
              <MenuItem
                key={index}
                onClick={() => handleWhoSelectChange(option)}
                selected={selectedWhoObjectType === option.name}
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
            sx={{ zIndex: 3000 }}
          >
            {whatIdOptions.map((option, index) => (
              <MenuItem
                key={index}
                onClick={() => handleWhatSelectChange(option)}
                selected={selectedWhatObjectType === option.name}
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
        isOptionEqualToValue={(option, val) => option.id === val?.id}
        onChange={handleChange}
        sx={{ width: '100%', minWidth: 0 }}
        slotProps={{
          popper: {
            sx: { zIndex: 3000 },
            placement: 'bottom-start',
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
              },
              '& .MuiInputBase-input.Mui-disabled': {
                color: '#888888',
                WebkitTextFillColor: '#888888',
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

export default QbAutocomplete;
