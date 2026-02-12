import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';

import useStore from '../../zustandStore';

import { useShallow } from 'zustand/react/shallow';

import { Box, Tab } from '@mui/material';

import { TabContext, TabList, TabPanel } from '@mui/lab';

// Theme
import { useTheme } from '@mui/material/styles';

import ErrorBoundary from '../errorBoundry/ErrorBoundary';

// import { prettyPrint } from '../../utilities/prettyPrint';

// Eager imports to avoid Suspense wrappers per preference
import SubgridViewRouter from './SubgridViewRouter';

import type { OrgObject, SObjectFieldPermission, SObjectMetadata, SObjectPermission } from '../../sObjectMetadataTypes';

import { enqueueSnackbar } from 'notistack';

// Note: Direct import of Subgrid (no Suspense/lazy) to match prior working implementation

interface DetailCellRendererProps {
  apiClient: any;
  isQueryActive: boolean;
  nameFieldMap: Map<string, string>;
  objectsWithoutNameFieldMap: Map<string, string>;
  objFieldPermissionsMap: React.RefObject<Map<string, SObjectFieldPermission>>;
  objMetadataMap: React.RefObject<Map<string, SObjectMetadata>>;
  objPermissionsMap?: React.RefObject<Map<string, SObjectPermission>>;
  selectedObject: OrgObject;
  data?: Record<string, any>;
}

const DetailCellRenderer: React.FC<DetailCellRendererProps> = ({
  apiClient,
  nameFieldMap,
  objectsWithoutNameFieldMap,
  objFieldPermissionsMap,
  objMetadataMap,
  objPermissionsMap,
  selectedObject,
  ...props
}) => {
  const theme = useTheme();

  // Track which relations have completed view loading (persists across component instances)
  const completedRelationsSet = new Set<string>();

  const parentRow = props.data;

  const {
    selectedAccentColor,
    relationPreferences,
    setSelectedSubgridType,
    setActiveRelationName,
    selectedSubgridType,
    activeRelationName,
  } = useStore(useShallow((s) => ({
    selectedAccentColor: s.selectedAccentColor,
    relationPreferences: s.relationPreferences,
    setSelectedSubgridType: s.setSelectedSubgridType,
    setActiveRelationName: s.setActiveRelationName,
    selectedSubgridType: s.selectedSubgridType,
    activeRelationName: s.activeRelationName,
  })));

  const [value, setValue] = useState('1');

  const handleChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    // Determine the relation switching to
    const visible = relationPreferences.filter((r: any) => r.checked === true);

    const idx = Math.max(0, Number(newValue) - 1);

    const rel = visible[idx];

    if (rel?.name) {
      setActiveRelationName?.(rel.name);
    }

    // Always start with gridView when switching relations to ensure views are loaded first
    // User can manually switch to timeSeriesView after views are loaded
    setSelectedSubgridType?.({ name: 'gridView', label: 'Grid' });

    setValue(newValue);
  }, [relationPreferences, setActiveRelationName, setSelectedSubgridType]);

  // Keep activeRelationName in sync when tab changes
  // Always start with gridView to ensure views are loaded before switching to other grid types
  const prevRelationRef = useRef<string | null>(null);

  const initializedRef = useRef(false);

  useEffect(() => {
    try {
      const visible = (relationPreferences || []).filter((r: any) => r.checked === true);

      if (!visible.length) return;

      const idx = Math.max(0, Number(value) - 1);

      const rel = visible[idx];

      if (!rel?.name) return;

      const relationChanged = prevRelationRef.current !== rel.name || activeRelationName !== rel.name;

      if (relationChanged) {
        setActiveRelationName?.(rel.name);

        prevRelationRef.current = rel.name;

        // Always start with gridView when relation changes to ensure views are loaded first
        // This prevents timeSeriesView from loading before a default view exists
        setSelectedSubgridType?.({ name: 'gridView', label: 'Grid' });

      } else if (!initializedRef.current) {
        // On initial mount, always start with gridView
        initializedRef.current = true;

        if (selectedSubgridType?.name !== 'gridView') {
          setSelectedSubgridType?.({ name: 'gridView', label: 'Grid' });
        }
      }
    } catch (e: any) {
      enqueueSnackbar('Error in relation sync effect', { variant: 'error', autoHideDuration: 0 })
    }
  }, [activeRelationName, relationPreferences, value, selectedSubgridType?.name, setActiveRelationName, setSelectedSubgridType]);

  // Stable list of visible relations to prevent re-renders from identity churn
  const visibleRelations = useMemo(() => (relationPreferences || []).filter((r: any) => r.checked === true), [relationPreferences]);

  // SubgridViewRouter moved to a separate module to keep component identity stable

  return (
    <ErrorBoundary>
      <TabContext value={value}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            border: 0,
            borderColor: 'divider',
            margin: 0,
            padding: 0,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}>
          <TabList
            sx={{
              '& .Mui-selected': { color: selectedAccentColor },
              '& .MuiTab-root': { color: theme.palette.text.primary },
              minHeight: '48px',
              ml: 2
            }}
            onChange={handleChange}
            aria-label="subgrid tabs"
          >
            {visibleRelations.map((item: any, index: number) => (
              <Tab key={item.name} label={item.label} value={String(index + 1)} />
            ))}
          </TabList>

          {visibleRelations.map((item: any, index: number) => (
            <TabPanel
              key={item.name}
              value={String(index + 1)}
              keepMounted={true}
              sx={{
                flexGrow: 1,
                padding: 0,
                margin: 0,
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary, overflow: 'auto'
              }}
            >
              <Box
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  height: 440,
                  minHeight: 400,
                  width: '100%',
                  padding: 0,
                  margin: 0,
                  border: 0
                }}>
                <SubgridViewRouter
                  apiClient={apiClient}
                  nameFieldMap={nameFieldMap}
                  objectsWithoutNameFieldMap={objectsWithoutNameFieldMap}
                  objFieldPermissionsMap={objFieldPermissionsMap}
                  objMetadataMap={objMetadataMap}
                  objPermissionsMap={objPermissionsMap}
                  selectedObject={selectedObject}
                  relation={item}
                  parentRow={parentRow!}
                  isActive={String(index + 1) === value}
                  completedRelationsSet={completedRelationsSet}
                />
              </Box>
            </TabPanel>
          ))}
        </Box>
      </TabContext>
    </ErrorBoundary>
  );
};

export default React.memo(DetailCellRenderer);
