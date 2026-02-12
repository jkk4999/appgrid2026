import React, { useEffect, useMemo, useState } from 'react';

// Zustand
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore'

// Mui
import { Box, Stack, IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { useSnackbar } from 'notistack';

// Icons
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PivotTableChartOutlinedIcon from '@mui/icons-material/PivotTableChartOutlined';

// types
import { GridViewType } from '../../appInterfaces/grid/gridInterfaces';

// utilities
import { prettyPrint } from '../../utilities/prettyPrint';

interface SubgridGridTypeSelectorProps {
  disableTimeSeries?: boolean;
  apiClient?: any;
  relationName?: string;
}

const SubgridGridTypeSelector = ({ disableTimeSeries = false, apiClient, relationName }: SubgridGridTypeSelectorProps) => {

  // global state
  const {
    selectedSubgridType,
    setSelectedSubgridType,
    activeRelationName,
    relationPreferences,
    setRelationPreferences,
    relationPreferenceRecId,
    setRelationPreferenceRecId,
    selectedObject,
    selectedSubgridObjMetadata,
    gridPermissions,
  } = useStore(useShallow((state) => ({
    selectedSubgridType: state.selectedSubgridType,
    setSelectedSubgridType: state.setSelectedSubgridType,
    activeRelationName: (state as any).activeRelationName,
    relationPreferences: state.relationPreferences,
    setRelationPreferences: state.setRelationPreferences,
    relationPreferenceRecId: state.relationPreferenceRecId,
    setRelationPreferenceRecId: state.setRelationPreferenceRecId,
    selectedObject: state.selectedObject,
    selectedSubgridObjMetadata: state.selectedSubgridObjMetadata,
    gridPermissions: state.gridPermissions,
  })));

  const { enqueueSnackbar } = useSnackbar();

  // Compute available subgrid view types based on child metadata + permissions
  const hasSelfRef = useMemo(() => {
    try {
      const meta: any = selectedSubgridObjMetadata as any;
      if (!meta?.fields || !meta?.apiName) return false;
      return meta.fields.some((f: any) => f?.type === 'REFERENCE' && Array.isArray(f?.referenceTo) && f.referenceTo.includes(meta.apiName));
    } catch {
      return false;
    }
  }, [selectedSubgridObjMetadata]);

  const viewTypeOptions: GridViewType[] = useMemo(() => {
    const opts: GridViewType[] = [{ name: 'gridView', label: 'Grid' }];
    const timeSeriesEnabled = (gridPermissions?.enableTimeSeriesGrid !== false) && !disableTimeSeries;
    if (timeSeriesEnabled) opts.push({ name: 'timeSeriesView', label: 'Time Series' });
    const treeEnabled = (gridPermissions?.enableTreeGrid !== false) && hasSelfRef;
    if (treeEnabled) opts.push({ name: 'treeGrid', label: 'Tree Grid' });
    return opts;
  }, [gridPermissions?.enableTimeSeriesGrid, gridPermissions?.enableTreeGrid, disableTimeSeries, hasSelfRef]);

  // If Tree Grid becomes unavailable while selected, revert to Grid
  useEffect(() => {
    if (selectedSubgridType?.name === 'treeGrid' && !viewTypeOptions.find(v => v.name === 'treeGrid')) {
      setSelectedSubgridType({ name: 'gridView', label: 'Grid' });
    }
  }, [selectedSubgridType?.name, setSelectedSubgridType, viewTypeOptions]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const iconForType = useMemo(() => {
    const name = selectedSubgridType?.name;
    switch (name) {
      case 'treeGrid':
        return <AccountTreeOutlinedIcon sx={{ fontSize: 29 }} />;
      case 'timeSeriesView':
        return <PivotTableChartOutlinedIcon sx={{ fontSize: 29 }} />;
      case 'gridView':
      default:
        return <ViewListOutlinedIcon sx={{ fontSize: 32 }} />;
    }
  }, [selectedSubgridType?.name]);

  const renderMenuIcon = (name: string) => {
    switch (name) {
      case 'treeGrid':
        return <AccountTreeOutlinedIcon fontSize="small" sx={{ color: 'green' }} />;
      case 'timeSeriesView':
        return <PivotTableChartOutlinedIcon fontSize="small" sx={{ color: 'green' }} />;
      case 'gridView':
      default:
        return <ViewListOutlinedIcon fontSize="small" sx={{ color: 'green' }} />;
    }
  };

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSelect = async (value: GridViewType) => {
    try {
      setSelectedSubgridType(value);

      const targetRelationName = relationName || activeRelationName;

      prettyPrint('[SubgridGridTypeSelector] handleSelect - value:', value, 'blue');
      prettyPrint('[SubgridGridTypeSelector] handleSelect - targetRelationName:', targetRelationName, 'blue');

      // Update in-memory relationPrefs for active relation
      if (targetRelationName) {
        const updated = (relationPreferences || []).map((p: any) =>
          p?.name === targetRelationName ? { ...p, selectedGridType: value.name } : p
        );
        setRelationPreferences(updated as any);

        prettyPrint('[SubgridGridTypeSelector] handleSelect - updated relationPreferences:', updated, 'blue');

        // Persist immediately (avoid global effect loops)
        if (apiClient && selectedObject?.qualifiedApiName) {
          const upsertRec: any = {
            AppGridAg__Preferences__c: JSON.stringify(updated),
            AppGridAg__SObjectApiName__c: selectedObject.qualifiedApiName,
          };
          if (relationPreferenceRecId) upsertRec['Id'] = relationPreferenceRecId;

          prettyPrint('[SubgridGridTypeSelector] handleSelect - upsertRec:', upsertRec, 'blue');
          prettyPrint('[SubgridGridTypeSelector] handleSelect - relationPreferenceRecId:', relationPreferenceRecId, 'blue');

          const params = {
            sObjectName: 'AppGridAg__AG_User_Relation_Prefs__c',
            jsonRecs: JSON.stringify([upsertRec])
          };

          prettyPrint('[SubgridGridTypeSelector] handleSelect - calling apiClient.upsertRecs with params:', params, 'blue');

          try {
            const result = await apiClient.upsertRecs(params);
            prettyPrint('[SubgridGridTypeSelector] handleSelect - upsertRecs result:', result, 'blue');

            if (result.status !== 'success') {
              throw new Error(result.errorMessage || 'Upsert operation failed');
            }

            const first = result.results.length > 0 ? result.results[0] : null;
            if (first?.isSuccess && first?.recordId && first.recordId !== relationPreferenceRecId) {
              setRelationPreferenceRecId(first.recordId);
              prettyPrint('[SubgridGridTypeSelector] handleSelect - updated relationPreferenceRecId to:', first.recordId, 'green');
            }
            if (first && !first.isSuccess) {
              const errorMsg = (first.errorMessages && first.errorMessages[0]) || (first.errors && first.errors[0]) || 'Unknown upsert failure';
              prettyPrint('[SubgridGridTypeSelector] handleSelect - upsert failed:', errorMsg, 'red');
              throw new Error(errorMsg);
            }
          } catch (e) {
            // Non-fatal; UI already updated
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            prettyPrint('[SubgridGridTypeSelector] handleSelect - caught error:', errorMessage, 'red');
            prettyPrint('[SubgridGridTypeSelector] handleSelect - error object:', e, 'red');
            try {
              enqueueSnackbar(`Error saving relation preferences: ${errorMessage}`, {
                variant: 'error',
                persist: true
              });
            } catch (snackbarError) {
              prettyPrint('[SubgridGridTypeSelector] Failed to show error notification:', snackbarError, 'red');
            }
          }
        } else {
          prettyPrint('[SubgridGridTypeSelector] handleSelect - skipping save - apiClient:', !!apiClient, 'orange');
          prettyPrint('[SubgridGridTypeSelector] handleSelect - skipping save - selectedObject:', selectedObject, 'orange');
        }
      } else {
        prettyPrint('[SubgridGridTypeSelector] handleSelect - no targetRelationName', 'orange');
      }
    } finally {
      handleClose();
    }
  };

  // If time series becomes disabled while selected, revert to gridView
  React.useEffect(() => {
    if (disableTimeSeries && selectedSubgridType?.name === 'timeSeriesView') {
      setSelectedSubgridType({ name: 'gridView', label: 'Grid' });
    }
  }, [disableTimeSeries, selectedSubgridType?.name, setSelectedSubgridType]);

  return (
    <Box>
      <Stack direction='row' alignItems='center' spacing={1}>
        <Tooltip title="Grid Type">
          <IconButton color="success" onClick={handleOpen} sx={{ color: 'green' }} aria-label="Select Grid Type">
            {iconForType}
          </IconButton>
        </Tooltip>
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          {viewTypeOptions.map((opt) => (
            <MenuItem key={opt.name} onClick={() => handleSelect(opt)}>
              <ListItemIcon sx={{ color: 'green' }}>{renderMenuIcon(opt.name)}</ListItemIcon>
              <ListItemText>{opt.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Stack>
    </Box>
  );
};

export { SubgridGridTypeSelector }
