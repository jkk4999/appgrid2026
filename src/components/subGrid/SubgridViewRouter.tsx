import React from 'react';

import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore';

import Subgrid from './SubgridCore';
import TimeSeriesGrid from '../timeSeriesGrid/timeSeriesGrid';

import type { OrgObject, SObjectFieldPermission, SObjectMetadata, SObjectPermission } from '../../sObjectMetadataTypes';

export interface SubgridViewRouterProps {
  apiClient: any;
  nameFieldMap: Map<string, string>;
  objectsWithoutNameFieldMap: Map<string, string>;
  objFieldPermissionsMap: React.RefObject<Map<string, SObjectFieldPermission>>;
  objMetadataMap: React.RefObject<Map<string, SObjectMetadata>>;
  objPermissionsMap?: React.RefObject<Map<string, SObjectPermission>>;
  selectedObject: OrgObject;
  relation: any;
  parentRow: Record<string, any>;
  isActive: boolean;
  completedRelationsSet: Set<string>;
}

/**
 * SubgridViewRouter - Routes to the appropriate grid component based on grid type.
 *
 * ARCHITECTURE NOTE: MUI TabPanel's keepMounted prop handles keeping components mounted
 * across tab switches. This prevents the expensive unmount/remount cycle that was causing:
 * - In-flight API calls being discarded
 * - Duplicate view records being created
 * - State being lost and re-fetched on every tab switch
 *
 * We pass isActive to child components so they can optimize their behavior when hidden.
 */
const SubgridViewRouter: React.FC<SubgridViewRouterProps> = ({
  apiClient,
  nameFieldMap,
  objectsWithoutNameFieldMap,
  objFieldPermissionsMap,
  objMetadataMap,
  objPermissionsMap,
  selectedObject,
  relation,
  parentRow,
  isActive,
  completedRelationsSet
}) => {
  // Route using the current global selection for the active relation
  const currentType = useStore(useShallow((s) => s.selectedSubgridType));
  const type = (currentType?.name || '').toLowerCase().replace(/\s+/g, '');
  const parentApi = (selectedObject as any)?.qualifiedApiName || (selectedObject as any)?.QualifiedApiName || (selectedObject as any)?.apiName;

  // MUI TabPanel with keepMounted handles visibility via hidden attribute.
  // We just render the appropriate component and pass isActive for optimization.
  if (type === 'timeseriesview' || type === 'timeseriesgrid' || type === 'timeseries') {
    return (
      <TimeSeriesGrid
        key={`tsg:${relation?.name}`}
        apiClient={apiClient}
        isSubgrid={true}
        objFieldPermissionsMap={objFieldPermissionsMap as any}
        objMetadataMap={objMetadataMap as any}
        relation={relation}
        selectedParentRow={parentRow as any}
        parentObjectApiName={parentApi}
        active={isActive}
      />
    );
  }

  return (
    <Subgrid
      key={`sub:${relation?.name}`}
      apiClient={apiClient}
      nameFieldMap={nameFieldMap}
      objectsWithoutNameFieldMap={objectsWithoutNameFieldMap}
      objFieldPermissionsMap={objFieldPermissionsMap}
      objMetadataMap={objMetadataMap}
      objPermissionsMap={objPermissionsMap as any}
      relation={relation}
      selectedParentRow={parentRow!}
      completedRelationsSet={completedRelationsSet}
      isActive={isActive}
    />
  );
};

export default SubgridViewRouter;
