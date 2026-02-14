import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';

interface PicklistItem {
  name: string;
  label: string;
}

interface QbSelectProps {
  options: PicklistItem[];
  rule: any;
  ruleID: string;
  qryBldrRef: React.RefObject<any>;
}

/**
 * Unified QueryBuilder select component for picklist fields.
 * Supports both single-select (equal/notequal) and multi-select (in/notin) operators.
 */
export default function QbSelect({ options, rule, ruleID, qryBldrRef }: QbSelectProps) {
  const isMultiSelectOperator = useMemo(
    () => rule.operator === 'in' || rule.operator === 'notin',
    [rule.operator]
  );

  const coerceSingleValue = useCallback((v: any): string | null => {
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) return v.length > 0 ? String(v[0]) : null;
    return null;
  }, []);

  const coerceMultiValues = useCallback((v: any): string[] => {
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === 'string' && v) return [v];
    return [];
  }, []);

  const [singleValue, setSingleValue] = useState<string | null>(() => coerceSingleValue(rule.value));
  const [multiValues, setMultiValues] = useState<string[]>(() => coerceMultiValues(rule.value));

  // Sync with external rule.value changes
  useEffect(() => {
    setSingleValue(coerceSingleValue(rule.value));
    setMultiValues(coerceMultiValues(rule.value));
  }, [coerceMultiValues, coerceSingleValue, rule.value]);

  const handleNotify = useCallback(
    (valueToNotify: any) => {
      if (!qryBldrRef.current) return;
      const container = document.getElementById(ruleID);
      const elem: any = container?.querySelector('.e-rule-value') ?? container ?? null;
      qryBldrRef.current.notifyChange(valueToNotify, elem, 'value');
    },
    [qryBldrRef, ruleID]
  );

  const handleChange = useCallback(
    (_event: React.SyntheticEvent, newValue: (string | PicklistItem) | (string | PicklistItem)[] | null) => {
      if (isMultiSelectOperator) {
        let names: string[] = [];
        if (Array.isArray(newValue)) {
          names = newValue.map((item) => (typeof item === 'string' ? item : item.name));
        }
        setMultiValues(names);
        handleNotify(names);
      } else {
        let name: string | null = null;
        if (newValue && !Array.isArray(newValue)) {
          name = typeof newValue === 'string' ? newValue : newValue.name;
        }
        setSingleValue(name);
        handleNotify(name);
      }
    },
    [isMultiSelectOperator, handleNotify]
  );

  const computedValue = useMemo(() => {
    if (isMultiSelectOperator) {
      return options.filter((opt) => multiValues.includes(opt.name));
    }
    const match = options.find((opt) => opt.name === singleValue);
    return match || null;
  }, [isMultiSelectOperator, multiValues, options, singleValue]);

  if (!options) {
    return <div>Loading options...</div>;
  }

  return (
    <div style={{ width: 250, transform: 'translateY(6px)' }}>
      <Autocomplete
        multiple={isMultiSelectOperator}
        fullWidth
        disableClearable={isMultiSelectOperator}
        clearIcon={isMultiSelectOperator ? null : undefined}
        options={options}
        value={computedValue as any}
        onChange={handleChange}
        getOptionLabel={(option: PicklistItem | string) => {
          if (!option) return '';
          if (typeof option === 'string') {
            return options.find((o) => o.name === option)?.label || option;
          }
          return option.label || '';
        }}
        isOptionEqualToValue={(option: any, value: any) => {
          const on = option?.name ?? (typeof option === 'string' ? option : undefined);
          const vn = value?.name ?? (typeof value === 'string' ? value : undefined);
          return !!on && !!vn && on === vn;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            sx={{
              mt: 0,
              width: '100%',
              '& .MuiInputBase-root': {
                minHeight: 32,
                display: 'flex',
                alignItems: 'center',
                transform: 'translateY(-10px)',
              },
              '& .MuiInputBase-input': {
                padding: '4px 0 0 !important',
                lineHeight: '24px',
              },
              '& .MuiInputLabel-root': {
                transform: 'translate(0, -8px) scale(0.75)',
                transformOrigin: 'top left',
              },
            }}
          />
        )}
        slotProps={{
          popper: {
            sx: { zIndex: 5000 },
          },
        }}
      />
    </div>
  );
}
