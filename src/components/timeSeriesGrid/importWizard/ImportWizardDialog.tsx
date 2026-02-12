import React, { useEffect, useMemo, useState } from 'react';

import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
  Paper,
  InputLabel,
  TextField,
  FormControlLabel,
  Switch,
} from '@mui/material';

import { useTheme } from '@mui/material/styles';

import PubSub from 'pubsub-js';

import { AgGridReact } from 'ag-grid-react';

import { prettyPrint } from '../../../utilities/prettyPrint';
import { useFormatter } from '../../../utilities/useFormatters';
import { createImportPreviewColumns } from './createImportPreviewColumns';
import { buildImportPreviewRows } from './buildImportPreviewRows';
import { normalizeImportRecords } from './normalizeImportRecords';
import { enrichReferenceRelations } from './enrichReferenceRelations';
import type { SObjectMetadata } from '../../../sObjectMetadataTypes';
import { useImportParsers } from './hooks/useImportParsers';

import { useSnackbarAction } from '../../../hooks/useSnackbarAction';
import useAppLocale from '../../../hooks/useAppLocale';

interface ImportWizardDialogProps {
  open: boolean;
  onClose: () => void;
  apiClient: any;
  defaultObjectApiName?: string | null;
}

const steps = ['Object', 'Upload', 'Mapping', 'Preview & Import'];

export default function ImportWizardDialog({ open, onClose, apiClient, defaultObjectApiName }: ImportWizardDialogProps) {
  const theme = useTheme();
  const { enqueueSnackbar, action } = useSnackbarAction();
  const { appLocale } = useAppLocale();
  const { parseDate, parseNumber } = useImportParsers(appLocale);

  const [activeStep, setActiveStep] = useState(0);
  const [objects, setObjects] = useState<Array<{ label: string; qualifiedApiName: string }>>([]);
  const [selectedObject, setSelectedObject] = useState<string | ''>('');
  const [loadingObjects, setLoadingObjects] = useState(false);
  // Transposed (header) column selection (can be any field)
  const [transposedFields, setTransposedFields] = useState<Array<{ apiName: string; label: string; type: string }>>([]);
  const [transposedField, setTransposedField] = useState<string>('');
  const [transposedFieldType, setTransposedFieldType] = useState<string>('');
  const [metaFields, setMetaFields] = useState<any[]>([]);
  const metaFieldsSorted = useMemo(() => {
    const arr = Array.isArray(metaFields) ? [...metaFields] : [];
    return arr.sort((a: any, b: any) => String(a?.label || a?.name || '').localeCompare(String(b?.label || b?.name || '')));
  }, [metaFields]);
  // Upload + parse state
  const [fileName, setFileName] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [headerRowIndex, setHeaderRowIndex] = useState<number>(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parseMsg, setParseMsg] = useState<string>('');
  const [namedRanges, setNamedRanges] = useState<Array<{ name: string; ref: string }>>([]);
  const [selectedNamedRange, setSelectedNamedRange] = useState<string>('');
  const [a1Range, setA1Range] = useState<string>('');
  const [skipHiddenRows, setSkipHiddenRows] = useState<boolean>(false);
  const [skipHiddenCols, setSkipHiddenCols] = useState<boolean>(false);
  const [workbook, setWorkbook] = useState<any>(null);
  const objMetadataMapRef = React.useRef<Map<string, SObjectMetadata>>(new Map());

  // --- Upload + Parse helpers ---
  const resetParse = () => {
    setSheetNames([]);
    setSelectedSheet('');
    setHeaderRowIndex(0);
    setHeaders([]);
    setParsedRows([]);
    setParseMsg('');
  };

  // New transposed parser: first column = Property, header row = transposed values
  const processTransposedSheet = (XLSX: any, sheet: any, headerIdx: number) => {
    const rangeOpt = a1Range && a1Range.trim().length ? { range: a1Range.trim() } : {};

    let aoa: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, ...rangeOpt });

    if (!aoa || aoa.length === 0) {
      setHeaders([]);
      setParsedRows([]);
      setParseMsg('No rows found.');
      return;
    }

    const idx = Math.max(0, Math.min(headerIdx, aoa.length - 1));

    let dataAoA = aoa.slice(idx + 1);

    try {
      const rowsMeta = (sheet['!rows'] || []) as any[];

      if (skipHiddenRows && rowsMeta.length) {
        const base = headerIdx + 1;
        dataAoA = dataAoA.filter((_r, i) => {
          const meta = rowsMeta[base + i];
          return !(meta && meta.hidden === true);
        });
      }
      const colsMeta = (sheet['!cols'] || []) as any[];
      if (skipHiddenCols && colsMeta.length) {
        dataAoA = dataAoA.map((row) => row.filter((_: any, i: number) => !(colsMeta[i]?.hidden)));
      }
    } catch (e: any) {
      enqueueSnackbar(`Unexpected error processing file - ${e?.message || String(e)}`, { action, variant: 'error' })
      return;
    }

    const headerCellsRaw = (aoa[idx] || []);

    const headerCells = headerCellsRaw.map((h: any) => (h === null || h === undefined ? '' : String(h).trim()));

    const propCol = 0;

    const properties: string[] = [];

    for (let r = 0; r < dataAoA.length; r++) {
      const p = String((dataAoA[r] && dataAoA[r][propCol]) ?? '').trim();

      if (p) {
        properties.push(p);
      }
    }
    const dataCols: number[] = [];

    for (let c = 1; c < headerCells.length; c++) {
      if (headerCells[c] && headerCells[c].length) {
        dataCols.push(c);
      }
    }

    const parseHeaderValue = (v: any): any => {
      if (transposedFieldType === 'DATE' || transposedFieldType === 'DATETIME') {
        // Use locale-aware parser from useImportParsers hook
        const parsed = parseDate(v);
        if (parsed.value) {
          return parsed.value; // Returns Date object
        }
        if (parsed.error) {
          prettyPrint('[ImportWizardDialog] Failed to parse transposed header date', {
            value: v,
            error: parsed.error
          }, 'orange');
        }
        return String(v ?? '');
      }
      return v;
    };

    const records: any[] = [];

    for (const c of dataCols) {
      const rec: any = {};

      // Use RAW header value so Excel serials are parsed as dates
      rec[transposedField] = parseHeaderValue(headerCellsRaw[c]);

      for (let r = 0; r < dataAoA.length; r++) {
        const propName = String((dataAoA[r] && dataAoA[r][propCol]) ?? '').trim();

        if (!propName) {
          continue;
        }
        const val = (dataAoA[r] && dataAoA[r][c]) ?? '';

        rec[propName] = val;
      }

      const hasAny = Object.entries(rec).some(([k, v]) => k !== transposedField && v !== undefined && v !== null && String(v).trim() !== '');

      if (hasAny) {
        records.push(rec);
      }
    }

    setHeaders(properties);

    prettyPrint('headers are', properties, 'blue')

    setParsedRows(records);

    prettyPrint('records are', records, 'blue')

    setParseMsg(`${records.length} records built from ${dataCols.length} header columns.`);
  };

  // --- Mapping (Step 3) ---
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const [mappingErrors, setMappingErrors] = useState<Record<string, string>>({});

  // canNext validation - must be after mapping/mappingErrors state declarations
  const canNext = useMemo(() => {
    if (activeStep === 0) return !!selectedObject && !!transposedField;
    if (activeStep === 1) return parsedRows.length > 0 && headers.length > 0;
    if (activeStep === 2) {
      // Mapping step: require all required fields to be mapped
      const hasErrors = Object.keys(mappingErrors).length > 0;
      const hasMappedFields = Object.values(mapping).some(val => val !== '');
      return !hasErrors && hasMappedFields;
    }
    return true;
  }, [activeStep, selectedObject, transposedField, parsedRows, headers, mappingErrors, mapping]);

  const requiredApiNames = useMemo(() => {
    const req: string[] = [];
    for (const f of metaFields || []) {
      if (f?.isNillable === false && f?.isDefaultedOnCreate !== true && f?.isCreateable !== false) req.push(f.name);
    }
    return req;
  }, [metaFields]);

  // ---- Step 4: Preview and client validation ----
  type PreviewRow = { [key: string]: any } & { __status?: string };
  const [previewCols, setPreviewCols] = useState<any[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [previewErrorCount, setPreviewErrorCount] = useState(0);
  const [showIndicators, setShowIndicators] = useState(false);
  const { dateFormatter, numberFormatter, currencyFormatter, percentageFormatter } = useFormatter();
  const currentCellRef = React.useRef<{ data: any } | null>(null);

  // Build final rows for server (mapped API keys + transposed field, remove __status)
  const buildFinalRows = useMemo(() => {
    const apiSet = new Set<string>(Object.values(mapping).filter(Boolean));

    // Ensure transposed field included
    apiSet.add(transposedField);

    const apis = Array.from(apiSet);

    const rows = previewRows.map((r) => {
      const obj: Record<string, any> = {};

      for (const k of apis) obj[k] = (r as any)[k];

      return obj;
    });

    return rows;
  }, [previewRows, mapping, transposedField]);

  // ---- Step 6: Commit (All-or-None Import) ----
  const [importInProgress, setImportInProgress] = useState(false);
  const [importSummary, setImportSummary] = useState<string>('');
  const [, setImportInserted] = useState<number>(0);
  const [importFailed, setImportFailed] = useState<number>(0);
  const [, setImportErrors] = useState<Array<{ rowIndex: number; fieldName?: string | null; message: string }>>([]);

  const runImportCommit = async () => {
    try {
      setImportInProgress(true);
      setImportSummary('');
      setImportErrors([]);
      setImportInserted(0);
      setImportFailed(0);
      if (!selectedObject) {
        setImportSummary('No object selected.');
        return;
      }
      const total = buildFinalRows.length;

      prettyPrint('[ImportWizard] commit rows', {
        numRows: buildFinalRows.length,
        firstRow: buildFinalRows[0]
      }, 'purple');

      const recsToInsert = normalizeImportRecords(metaFields as any, buildFinalRows, { parseNumber });
      const res = await apiClient.importTimeSeriesData({
        sObjectApiName: selectedObject,
        rowsJson: JSON.stringify(recsToInsert),
        dryRun: false,
      });

      prettyPrint('[ImportWizard] commit response', res, 'purple')

      if (res?.status === 'success') {
        const inserted = typeof res.insertedCount === 'number' ? res.insertedCount : total;
        const failed = 0;
        setImportInserted(inserted);
        setImportFailed(failed);
        setImportSummary(`Import complete: inserted ${inserted} of ${total}.`);
        PubSub.publish('RunQuery');
      } else {
        const errs = Array.isArray(res?.errors) ? res.errors : [];
        const failed = errs.length;
        const inserted = Math.max(0, total - failed);
        setImportErrors(errs);
        setImportInserted(inserted);
        setImportFailed(failed);
        setImportSummary(`Import failed: inserted ${inserted}, failed ${failed} of ${total}.`);
        if (errs.length) {
          setShowIndicators(true);
          setPreviewRows((prev) => {
            const next = [...prev];
            for (const e of errs) {
              const idx = typeof e?.rowIndex === 'number' ? e.rowIndex : -1;
              if (idx >= 0 && idx < next.length) {
                const msg = e?.message || 'Unknown error';
                next[idx] = { ...next[idx], __error: msg } as any;
              }
            }
            return next;
          });
        }
      }
    } catch (e: any) {
      setImportSummary(`Import failed: ${e?.message || String(e)}`);
    } finally {
      setImportInProgress(false);
    }
  };

  const detectHeaderIndex = (XLSX: any, sheet: any) => {
    const aoa: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
    if (!aoa || aoa.length === 0) {
      return 0;
    }

    const isDateLike = (v: any): boolean => {
      if (v == null) {
        return false;
      }

      if (typeof v === 'number') {
        // Excel serial range for 1900-01-01..2099 roughly 1..60000
        return v > 10000 && v < 90000;
      }

      if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return false;
        // ISO or locale-friendly
        if (!isNaN(new Date(s).getTime())) return true;
        return !!parseDate(s).value;
      }
      return false;
    };

    let bestIdx = 0; let bestScore = -1;

    const limit = Math.min(10, aoa.length);

    for (let i = 0; i < limit; i++) {
      const row = aoa[i] || [];

      let score = 0;

      if (transposedFieldType === 'DATE' || transposedFieldType === 'DATETIME') {
        // Prefer rows that look like date headers (skip property col 0)
        for (let c = 1; c < row.length; c++) if (isDateLike(row[c])) score++;
      } else {
        // Generic: count non-empty cells from col 1 onward
        for (let c = 1; c < row.length; c++) {
          const v = row[c];
          if (v !== undefined && v !== null && String(v).trim() !== '') score++;
        }
      }

      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    return bestIdx;
  };

  // parse selected xlsx file
  const parseFile = async (file: File) => {
    resetParse();

    setFileName(file.name);

    const ext = file.name.toLowerCase().split('.').pop() || '';

    const XLSX = await import('xlsx');

    if (ext === 'csv') {
      const text = await file.text();
      const wb = XLSX.read(text, { type: 'string' });
      const names: string[] = wb.SheetNames || [];
      setSheetNames(names);
      const first = names[0];
      setSelectedSheet(first);
      const sheet = wb.Sheets[first];
      const hdr = detectHeaderIndex(XLSX, sheet);
      setHeaderRowIndex(hdr);
      processTransposedSheet(XLSX, sheet, hdr);
      setWorkbook(wb);
      setNamedRanges([]); // CSV typically no named ranges
      return;
    }

    // xlsx/xls
    const buf = await file.arrayBuffer();

    const wb = XLSX.read(buf, { type: 'array' });

    const names: string[] = wb.SheetNames || [];

    setSheetNames(names);

    const first = names[0];

    setSelectedSheet(first);

    const sheet = wb.Sheets[first];

    const hdr = detectHeaderIndex(XLSX, sheet);

    setHeaderRowIndex(hdr);

    processTransposedSheet(XLSX, sheet, hdr);

    setWorkbook(wb);

    try {
      const nrs = (wb.Workbook?.Names || [])
        .map((n: any) => ({ name: String(n.Name || ''), ref: String(n.Ref || '') }))
        .filter((n: any) => n.ref && n.name);
      setNamedRanges(nrs);
    } catch { setNamedRanges([]); }
  };

  const onChangeSheet = async (name: string) => {
    try {
      const XLSX = await import('xlsx');
      if (!workbook) {
        return;
      }

      const sheet = workbook.Sheets[name];

      const hdr = detectHeaderIndex(XLSX, sheet);

      setHeaderRowIndex(hdr);

      processTransposedSheet(XLSX, sheet, hdr);
    } catch {
      setParseMsg('Failed to switch sheet.');
    }
  };

  const handleClose = () => {
    // Shift focus to body (not aria-hidden) before closing to avoid warning
    const body = document.body as HTMLElement;
    let prevTabIndex: string | null = null;

    prevTabIndex = body.getAttribute('tabindex');
    if (prevTabIndex === null) body.setAttribute('tabindex', '-1');
    body.focus({ preventScroll: true } as any);

    setTimeout(() => {

      if (prevTabIndex === null) body.removeAttribute('tabindex');
      else body.setAttribute('tabindex', prevTabIndex);

      onClose();
    }, 0);
  };

  // load objects
  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveStep(0);

    setSelectedObject(defaultObjectApiName || '');

    (async () => {
      try {
        setLoadingObjects(true);

        const res = await apiClient.getOrgObjects();

        const list = Array.isArray(res)
          ? res
            .map((o: any) => ({ label: o.label || o.pluralLabel || o.qualifiedApiName, qualifiedApiName: o.qualifiedApiName }))
            .sort((a, b) => String(a.label || '').localeCompare(String(b.label || '')))
          : [];
        setObjects(list);
      } catch {
        enqueueSnackbar('Unexpected error retrieving org objects', { action: action, variant: 'error' })
      } finally {
        setLoadingObjects(false);
      }
    })();
  }, [open, apiClient, defaultObjectApiName, enqueueSnackbar, action]);

  // Fetch metadata when object changes to populate transposable fields (any field)
  useEffect(() => {
    (async () => {
      if (!open || !selectedObject) {
        setTransposedFields([]);
        setTransposedField('');
        setMetaFields([]);
        return;
      }

      try {
        const meta = await apiClient.getMetadata({ sObjectName: selectedObject });

        const flds = Array.isArray(meta?.fields) ? meta.fields : [];

        setMetaFields(flds);

        const all = flds
          .map((f: any) => ({ apiName: f.name, label: f.label, type: f.type }))
          .sort((a: any, b: any) => String(a.label || a.apiName).localeCompare(String(b.label || b.apiName)));

        setTransposedFields(all);

        // Prefer CreatedDate if it exists, else the first field
        const preferred = all.find((d: { apiName: string; label: string; type: string }) => d.apiName === 'CreatedDate') || all[0];

        setTransposedField(preferred ? preferred.apiName : '');

        setTransposedFieldType(preferred ? preferred.type : '');
      } catch {
        setTransposedFields([]);
        setTransposedField('');
        setTransposedFieldType('');
        setMetaFields([]);
      }
    })();
  }, [open, selectedObject, apiClient]);

  // create mapping
  useEffect(() => {
    if (!headers.length || !metaFields.length) return;
    const norm = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const byApi = new Map(metaFields.map((f: any) => [norm(f.name), f.name]));
    const byLabel = new Map(metaFields.map((f: any) => [norm(f.label || ''), f.name]));
    const next: Record<string, string> = {};
    headers.forEach((h) => {
      const hn = norm(h);
      next[h] = byApi.get(hn) || byLabel.get(hn) || '';
    });
    setMapping(next);
  }, [headers, metaFields]);

  // check for required fields
  useEffect(() => {
    const errs: Record<string, string> = {};
    requiredApiNames.forEach((api) => {
      const mapped = Object.values(mapping).includes(api);
      if (!mapped) errs[api] = 'Required field not mapped';
    });
    setMappingErrors(errs);
  }, [mapping, requiredApiNames]);

  // step 3: Build preview columns and rows and enrich reference relations
  useEffect(() => {
    if (activeStep !== 3) return;
    (async () => {
      try {
        const cols = createImportPreviewColumns({
          apiClient,
          metaFields: metaFields as any,
          mapping,
          transposedField,
          showErrorColumn: showIndicators,
          objMetadataMap: objMetadataMapRef,
          currencyFormatter,
          dateFormatter,
          numberFormatter,
          percentageFormatter,
        });
        setPreviewCols(cols);
      } catch {
        setPreviewCols([]);
      }

      const { rows, errorCount } = buildImportPreviewRows({
        parsedRows,
        mapping,
        metaFields: metaFields as any,
        transposedField,
        parseDate,
        parseNumber,
      });

      const enriched = await enrichReferenceRelations({
        apiClient,
        metaFields: metaFields as any,
        rows,
        objMetadataMap: objMetadataMapRef,
      });
      setPreviewRows(enriched);
      setPreviewErrorCount(errorCount);
    })();
  }, [activeStep, parsedRows, mapping, metaFields, transposedField, showIndicators, apiClient, currencyFormatter, dateFormatter, numberFormatter, percentageFormatter, parseDate, parseNumber]);

  useEffect(() => {
    if (importFailed > 0) {
      setShowIndicators(true);
    }
  }, [importFailed]);

  // After user edits/pastes reference Ids, debounce enrichment to attach relation objects
  const enrichTimerRef = React.useRef<number | null>(null);
  const enrichingRef = React.useRef(false);
  useEffect(() => {
    if (activeStep !== 3) return;
    // Detect if there are reference fields with missing relation objects
    const refFields = (metaFields as any[]).filter((f: any) => f.type === 'REFERENCE' && f.relationshipName);
    if (!refFields.length) return;

    const isSalesforceId = (v: any) => typeof v === 'string' && /^[A-Za-z0-9]{15}(?:[A-Za-z0-9]{3})?$/.test(v);
    const needsEnrichment = previewRows?.some((row: any) =>
      refFields.some((f: any) => row && isSalesforceId(row[f.name]) && !row[f.relationshipName])
    );
    if (!needsEnrichment) return;

    if (enrichTimerRef.current) window.clearTimeout(enrichTimerRef.current);
    enrichTimerRef.current = window.setTimeout(async () => {
      if (enrichingRef.current) return;
      enrichingRef.current = true;
      try {
        const enriched = await enrichReferenceRelations({
          apiClient,
          metaFields: metaFields as any,
          rows: previewRows,
          objMetadataMap: objMetadataMapRef,
        });
        setPreviewRows(enriched as any);
      } catch {
        // ignore
      } finally {
        enrichingRef.current = false;
      }
    }, 200);
    return () => {
      if (enrichTimerRef.current) window.clearTimeout(enrichTimerRef.current);
    };
  }, [activeStep, previewRows, metaFields, apiClient]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="lg"
      keepMounted
      disableRestoreFocus
      disableEnforceFocus
      disableAutoFocus
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'transparent',
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        Import Wizard
      </DialogTitle>

      <DialogContent
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Stack spacing={2} sx={{
          mt: 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>
          <Divider />
          {/* step 0 - select object */}
          {activeStep === 0 && (
            <Box sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}>
              <Typography sx={{ mb: 1, color: '#1976d2' }}>
                To import audit fields like CreatedDate, etc. the user must have
                Set Audit Fields upon Record Creation and Update Records with Inactive Owners User Permissions.
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Select SObject</Typography>
              <Select
                fullWidth
                value={selectedObject}
                onChange={(e) => setSelectedObject(String(e.target.value))}
                disabled={loadingObjects}
              >
                {objects.map((o) => (
                  <MenuItem
                    key={o.qualifiedApiName}
                    value={o.qualifiedApiName}>{o.label} ({o.qualifiedApiName})
                  </MenuItem>
                ))}
                {(!loadingObjects && objects.length === 0 && defaultObjectApiName) && (
                  <MenuItem value={defaultObjectApiName}>{defaultObjectApiName}</MenuItem>
                )}
              </Select>
              {loadingObjects && <Typography sx={{ mt: 1 }} color="text.secondary">Loading objects…</Typography>}
              <Box sx={{ mt: 2 }}>
                <InputLabel>Transposed Column (Field whose values appear in headers)</InputLabel>
                <Select
                  fullWidth
                  value={transposedField}
                  onChange={(e) => {
                    const apiName = String(e.target.value);
                    setTransposedField(apiName);
                    const f = transposedFields.find((x) => x.apiName === apiName);
                    setTransposedFieldType(f?.type || '');
                  }}
                  disabled={!selectedObject || transposedFields.length === 0}
                >
                  {transposedFields.map((f) => (
                    <MenuItem key={f.apiName} value={f.apiName}>{f.label} ({f.apiName})</MenuItem>
                  ))}
                </Select>
                {transposedFields.length === 0 && selectedObject && (
                  <Typography sx={{ mt: 1 }} color="text.secondary">No fields found on {selectedObject}.</Typography>
                )}
              </Box>
            </Box>
          )}

          {/* step 1 - upload file */}
          {activeStep === 1 && (
            <Box sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Upload File (.xlsx, .xls, .csv)</Typography>
              {(selectedObject || transposedField) && (
                <Typography sx={{ mb: 1 }} color="text.secondary">
                  Selected Object: <b>{selectedObject}</b> · Transposed Column: <b>{transposedField}</b>{transposedFieldType ? ` (${transposedFieldType})` : ''}
                </Typography>
              )}
              <input id="import-file-input" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  parseFile(f);
                }
              }} />
              {fileName && <Typography sx={{ mt: 1 }} color="text.secondary">File: {fileName}</Typography>}
              {sheetNames.length > 1 && (
                <Box sx={{ mt: 2 }}>
                  <InputLabel>Worksheet</InputLabel>
                  <Select
                    fullWidth
                    value={selectedSheet}
                    onChange={(e) => {
                      setSelectedSheet(String(e.target.value));
                      onChangeSheet(String(e.target.value));
                    }}>
                    {sheetNames.map((n) => (
                      <MenuItem key={n} value={n}>{n}</MenuItem>
                    ))}
                  </Select>
                </Box>
              )}
              {namedRanges.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <InputLabel>Named Range (optional)</InputLabel>
                  <Select
                    fullWidth
                    value={selectedNamedRange}
                    onChange={(e) => {
                      const v = String(e.target.value);
                      setSelectedNamedRange(v);
                      // If named range refers to this sheet, auto fill A1 range
                      const match = namedRanges.find((r) => r.name === v);
                      if (match) {
                        const ref = match.ref || '';
                        const bang = ref.indexOf('!');
                        if (bang > 0) {
                          const [, range] = [ref.substring(0, bang), ref.substring(bang + 1)];
                          setA1Range(range.replace(/\$/g, ''));
                        }
                      }
                    }}
                  >
                    <MenuItem value="">(None)</MenuItem>
                    {namedRanges.map((nr) => (
                      <MenuItem key={nr.name} value={nr.name}>{nr.name} — {nr.ref}</MenuItem>
                    ))}
                  </Select>
                </Box>
              )}
              <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <InputLabel>A1 Range (optional)</InputLabel>
                  <TextField fullWidth placeholder="e.g., A1:Z1000" value={a1Range} onChange={(e) => setA1Range(e.target.value)} />
                </Box>
                <Box>
                  <InputLabel>Header Row Index (0-based)</InputLabel>
                  <TextField type="number" fullWidth value={headerRowIndex} onChange={(e) => setHeaderRowIndex(Number(e.target.value))} />
                </Box>
              </Box>
              <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                <FormControlLabel control={<Switch checked={skipHiddenRows} onChange={(e) => setSkipHiddenRows(e.target.checked)} />} label="Skip hidden rows" />
                <FormControlLabel control={<Switch checked={skipHiddenCols} onChange={(e) => setSkipHiddenCols(e.target.checked)} />} label="Skip hidden columns" />
                <Button variant="outlined" onClick={async () => {
                  try {
                    const XLSX = await import('xlsx');
                    if (!workbook || !selectedSheet) return;
                    const sheet = workbook.Sheets[selectedSheet];
                    processTransposedSheet(XLSX, sheet, headerRowIndex);
                  } catch { setParseMsg('Re-parse failed'); }
                }}>Re-parse</Button>
              </Box>
              {headers.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Detected Header Row: {headerRowIndex + 1}</Typography>
                  <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
                    <Typography variant="caption">Headers: {headers.join(', ')}</Typography>
                  </Paper>
                </Box>
              )}
              {parseMsg && <Typography sx={{ mt: 1 }} color="text.secondary">{parseMsg}</Typography>}
              {parsedRows.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Sample rows</Typography>
                  <Paper variant="outlined" sx={{ p: 1, mt: 1, maxHeight: 200, overflow: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(parsedRows.slice(0, 5), null, 2)}</pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}

          {/* step 2 - map fields */}
          {activeStep === 2 && (
            <Box sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Column Mapping</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Map each Property (from the first column in your sheet) to a {selectedObject} field. Lookup/reference values must be Salesforce Ids (15/18). Required fields must be mapped.
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, alignItems: 'center', maxHeight: 420, overflow: 'auto', pr: 1 }}>
                <Typography variant="overline">Property</Typography>
                <Typography variant="overline">SObject Field</Typography>
                {headers.map((h) => (
                  <React.Fragment key={h}>
                    <Typography>{h}</Typography>
                    <Autocomplete
                      options={metaFieldsSorted}
                      getOptionLabel={(opt: any) => `${opt.label || opt.name} (${opt.name})`}
                      value={metaFieldsSorted.find((f: any) => f.name === mapping[h]) || null}
                      onChange={(_e, val) => setMapping((m) => ({ ...m, [h]: val?.name || '' }))}
                      renderInput={(params) => <TextField {...params} size="small" placeholder="Select field" />}
                    />
                  </React.Fragment>
                ))}
              </Box>
              {Object.keys(mappingErrors).length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography color="error">Missing required mappings:</Typography>
                  <ul>
                    {Object.keys(mappingErrors).map((api) => (
                      <li key={api}><Typography color="error" variant="body2">{api}: {mappingErrors[api]}</Typography></li>
                    ))}
                  </ul>
                </Box>
              )}
            </Box>
          )}

          {/* step 3 - preview data & import */}
          {activeStep === 3 && (
            <Box sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Preview & Import</Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                {`Rows: ${previewRows.length} · Issues: ${previewErrorCount}`}
              </Typography>
              <Box sx={{ height: 420, width: '100%' }}>
                <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
                  <AgGridReact
                    columnDefs={previewCols}
                    rowData={previewRows}
                    defaultColDef={{ editable: true }}
                    cellSelection={{
                      handle: {
                        mode: 'fill',
                        direction: 'xy',
                        setFillValue: (params) => {

                          const field = params.column?.getColDef()?.field as string;
                          if (!field) return false;
                          const f = (metaFields as any[]).find((x: any) => x.name === field);
                          if (f && f.type === 'REFERENCE' && f.relationshipName && params.rowNode.data) {
                            const relationName: string = f.relationshipName;
                            const src = currentCellRef.current?.data;
                            if (src && src[relationName]) {
                              // Copy relation display object so labels stay correct after fill
                              params.rowNode.data[relationName] = src[relationName];
                            } else {
                              // Remove relation; debounced enrichment will repopulate from Ids
                              params.rowNode.data[relationName] = null;
                            }
                            return false; // let grid handle filling the raw Id; we only manage relation object
                          }

                          return false;
                        },
                      },
                    }}
                    onCellValueChanged={(e) => {
                      const idx = e.node?.rowIndex ?? -1;
                      if (idx < 0) return;
                      setPreviewRows((prev) => {
                        if (!prev || idx >= prev.length) return prev;
                        const next = [...prev];
                        const rec = { ...next[idx] } as any;
                        rec[e.colDef.field as string] = e.newValue;
                        next[idx] = rec as any;
                        return next;
                      });

                      // If reference field changed, fetch and attach relation object for display

                      const fieldName = e.colDef.field as string;
                      const f = (metaFields as any[]).find((x) => x.name === fieldName);
                      if (f && f.type === 'REFERENCE') {
                        const id = e.newValue as string;
                        const relationshipName: string | undefined = f.relationshipName;
                        if (relationshipName && id && /^[A-Za-z0-9]{15}(?:[A-Za-z0-9]{3})?$/.test(id)) {
                          (async () => {

                            // Resolve sObject via prefix mapping first; fallback to metadata or API
                            let sObjectName: string | null = null;
                            if (Array.isArray(f.referenceTo) && f.referenceTo.length === 1) {
                              sObjectName = f.referenceTo[0];
                            }
                            if (!sObjectName) {
                              const { guessSObjectFromIdPrefix } = await import('./nameFieldMappings');
                              sObjectName = guessSObjectFromIdPrefix(id);
                            }
                            if (!sObjectName) {
                              const res = await apiClient.getSObjectName({ recordId: id });
                              if (res?.status === 'success') sObjectName = res.sObjectName;
                            }
                            if (!sObjectName) return;
                            const meta = await apiClient.getMetadata({ sObjectName });
                            const defaultNameField = meta?.fields?.find((x: any) => x.isNameField)?.name || 'Name';
                            const { getPreferredNameFieldForObject } = await import('./nameFieldMappings');
                            const nameField = getPreferredNameFieldForObject(sObjectName, defaultNameField);
                            const queryRule = { condition: 'and', rules: [{ field: 'Id', operator: 'equal', type: 'string', value: id }] };
                            const resp = await apiClient.executeDynamicSOQL({ sObjectName, queryRule: JSON.stringify(queryRule), subQueryRule: null, subQueryRelation: null });
                            const rec = Array.isArray(resp?.records) && resp.records[0];
                            const rel = rec ? { Id: String(rec.Id), Name: String(rec[nameField] || rec.Name || id) } : null;
                            if (rel) {
                              setPreviewRows((prev) => {
                                if (!prev || idx >= prev.length) return prev;
                                const copy = [...prev];
                                const r = { ...(copy[idx] as any) };
                                (r as any)[relationshipName] = rel;
                                copy[idx] = r as any;
                                return copy;
                              });
                            }

                          })();
                        }
                      }

                    }}
                    onCellMouseDown={(e) => {
                      try { currentCellRef.current = { data: e?.data }; } catch { currentCellRef.current = null; }
                    }}
                    suppressMenuHide={true}
                    domLayout="normal"
                  />
                </div>
              </Box>

              {(importSummary) && (
                <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
                  <Typography sx={{ mb: 1 }} color={importFailed > 0 ? 'error' : 'success.main'}>
                    {importSummary}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              onClick={handleClose}>
              Close
            </Button>
            <Button
              disabled={activeStep === 0}
              onClick={() => setActiveStep((s) => Math.max(0, s - 1))}>
              Back
            </Button>
            <Button
              disabled={activeStep === steps.length - 1 ? (importInProgress || buildFinalRows.length === 0) : !canNext}
              variant="contained"
              onClick={() => {
                if (activeStep === steps.length - 1) {
                  runImportCommit();
                } else {
                  setActiveStep((s) => Math.min(steps.length - 1, s + 1));
                }
              }}
            >
              {activeStep === steps.length - 1 ? 'Import' : 'Next'}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
