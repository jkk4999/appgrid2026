import React, { useCallback } from 'react';

import { TextField, useTheme } from '@mui/material';

import { DatePicker } from '@mui/x-date-pickers';

import dayjs, { Dayjs } from 'dayjs';

import { SObjectFieldMetadata } from '../../sObjectMetadataTypes';

interface QbMuiDateEditorProps {
  field: SObjectFieldMetadata;
  rule?: any; // Syncfusion RuleModel
  ruleID: string;
  qryBldrRef: React.RefObject<any>;
}

export default function QbMuiDateEditor({ field, rule, ruleID, qryBldrRef }: QbMuiDateEditorProps) {
  const theme = useTheme();

  const isBetween = rule?.operator === 'between' || rule?.operator === 'notbetween';

  // Normalize ISO UTC strings saved by Apex back to local date-only to avoid off-by-one day when rendering
  const toLocalDay = (v: any): Dayjs | null => {
    if (!v) return null;
    if (v instanceof Date) return dayjs(new Date(v.getFullYear(), v.getMonth(), v.getDate()));
    if (typeof v === 'string') {
      // If value is ISO with 'Z', parse as UTC and reconstruct a local date with the same UTC Y-M-D
      const iso = String(v);
      const d = new Date(iso);
      if (iso.endsWith('Z') && !isNaN(d.getTime())) {
        const y = d.getUTCFullYear();
        const m = d.getUTCMonth();
        const dd = d.getUTCDate();
        return dayjs(new Date(y, m, dd));
      }
      // Fallback to direct parse (date-only or local ISO)
      const d2 = new Date(iso);
      return isNaN(d2.getTime()) ? null : dayjs(new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()));
    }
    return null;
  };

  const initialSingle: Dayjs | null = toLocalDay(rule?.value);
  const initialMin: Dayjs | null = Array.isArray(rule?.value) && rule.value[0] ? toLocalDay(rule.value[0]) : null;
  const initialMax: Dayjs | null = Array.isArray(rule?.value) && rule.value[1] ? toLocalDay(rule.value[1]) : null;

  const [singleVal, setSingleVal] = React.useState<Dayjs | null>(initialSingle);
  const [minVal, setMinVal] = React.useState<Dayjs | null>(initialMin);
  const [maxVal, setMaxVal] = React.useState<Dayjs | null>(initialMax);

  React.useEffect(() => {
    if (isBetween) {
      const nextMin = Array.isArray(rule?.value) ? rule.value[0] : null;
      const nextMax = Array.isArray(rule?.value) ? rule.value[1] : null;
      setMinVal(nextMin ? dayjs(nextMin) : null);
      setMaxVal(nextMax ? dayjs(nextMax) : null);
    } else {
      const next = rule?.value ?? null;
      setSingleVal(next ? dayjs(next) : null);
    }
  }, [rule.value, rule.operator, isBetween]);

  const notify = useCallback((payload: any) => {
    const elem = document.getElementById(ruleID)?.querySelector('.e-rule-value');
    if (elem && qryBldrRef?.current && typeof qryBldrRef.current.notifyChange === 'function') {
      qryBldrRef.current.notifyChange(payload, elem as Element, 'value');
    }
  }, [qryBldrRef, ruleID]);

  const scheduleRangeCommit = React.useCallback(
    (min: Dayjs | null, max: Dayjs | null) => {
      const hasMin = !!min;
      const hasMax = !!max;

      if (hasMin && hasMax) {
        const minDate = min.toDate();
        const maxDate = max.toDate();
        setTimeout(() => notify([minDate, maxDate]), 30);
        return;
      }

      if (!hasMin && !hasMax) {
        setTimeout(() => notify([]), 30);
      }
      // Skip notifying when only one value is present to avoid Syncfusion deleting the rule.
    },
    [notify]
  );

  // Use portal-to-body to avoid clipping by scroll containers; raise z-index
  const popperSlotProps = {
    sx: { zIndex: 20000 },
    placement: 'bottom-start' as const,
    modifiers: [
      { name: 'flip', enabled: true },
      { name: 'offset', options: { offset: [0, 8] } },
      // Use non-adaptive positioning to avoid initial jump before layout settles
      { name: 'computeStyles', options: { adaptive: false } },
      { name: 'preventOverflow', options: { boundary: 'viewport', altBoundary: true, tether: true, rootBoundary: 'viewport' } },
    ],
    container: document.body as HTMLElement,
  };

  const sharedTextFieldProps = {
    variant: 'standard',
    InputLabelProps: { shrink: true },
    sx: {
      mt: 0,
      width: '100%',
      '& .MuiInputBase-root': {
        minHeight: 32,
        display: 'flex',
        alignItems: 'center',
        paddingBottom: 0,
        paddingRight: 0,
        paddingLeft: 0,
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
    },
  } as const;

  if (isBetween) {
    return (
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'baseline',
          width: '100%',
          minWidth: 0,
        }}>
        <div style={{
          width: '100%',
          minWidth: 0,
          flex: 1,
          transform: 'translateY(6px)'
        }}>
          <DatePicker
            enableAccessibleFieldDOMStructure={false}
            reduceAnimations
            value={minVal}
            onChange={(v) => {
              setMinVal(v);
              scheduleRangeCommit(v, maxVal);
            }}
            slots={{ textField: TextField }}
            slotProps={{
              textField: {
                label: 'Start',
                placeholder: 'Start',
                ...sharedTextFieldProps,
              },
              popper: popperSlotProps,
            }}
            sx={{
              '& .MuiIconButton-root': {
                color: theme.palette.text.primary
              }
            }}
          />
        </div>
        <div
          style={{
            width: '100%',
            minWidth: 0,
            flex: 1,
            transform: 'translateY(6px)'
          }}>
          <DatePicker
            enableAccessibleFieldDOMStructure={false}
            reduceAnimations
            value={maxVal}
            onChange={(v) => {
              setMaxVal(v);
              scheduleRangeCommit(minVal, v);
            }}
            slots={{ textField: TextField }}
            slotProps={{
              textField: {
                label: 'End',
                placeholder: 'End',
                ...sharedTextFieldProps,
              },
              popper: popperSlotProps,
            }}
            sx={{
              '& .MuiIconButton-root': {
                color: theme.palette.text.primary
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        minWidth: 0,
        flex: 1,
        display: 'flex',
        alignItems: 'baseline',
        transform: 'translateY(6px)'
      }}>
      <DatePicker
        enableAccessibleFieldDOMStructure={false}
        reduceAnimations
        value={singleVal}
        onChange={(v) => {
          setSingleVal(v);
          setTimeout(() => notify(v ? v.toDate() : null), 30);
        }}
        slots={{ textField: TextField }}
        slotProps={{
          textField: {
            label: field?.label || field?.name,
            placeholder: field?.label || field?.name,
            ...sharedTextFieldProps,
            sx: {
              '& .MuiInputBase-input': {
                color: theme.palette.text.primary,
              },
              '& .MuiInputBase-input.Mui-disabled': {
                color: '#888888',
                WebkitTextFillColor: '#888888',
              },
              '& .MuiSvgIcon-root': {
                color: theme.palette.text.primary,
              },
              '& .MuiSvgIcon-root.Mui-disabled': {
                color: `${theme.palette.text.primary}80`,
              },
            },
          },
          popper: popperSlotProps,
        }}
        sx={{
          '& .MuiIconButton-root': { color: theme.palette.text.primary },
          '& .MuiIconButton-root.Mui-disabled': { color: `${theme.palette.text.primary}80` },
          '& .MuiInput-underline:before': { borderBottomColor: theme.palette.text.primary },
          '& .MuiInput-underline:hover:before': { borderBottomColor: theme.palette.text.primary },
          '& .MuiInput-underline:after': { borderBottomColor: theme.palette.text.primary },
        }}
      />
    </div>
  );
}
