/**
 * Metadata State Hooks
 *
 * Provides hooks for accessing metadata-related state with automatic
 * main/subgrid context handling.
 */

import { createContextHooks, createSimpleHook } from './createSelector';
import type { OrgObject, SObjectMetadata } from '../../sObjectMetadataTypes';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Return type for useMetadataState hook */
export interface MetadataStateReturn {
  objMetadata: SObjectMetadata | null;
  setObjMetadata: (metadata: SObjectMetadata | null) => void;
  selectedObject: OrgObject | null;
  setSelectedObject: (obj: OrgObject | null) => void;
}

// ============================================================
// CONTEXT-AWARE HOOKS (main vs subgrid)
// ============================================================

const metadataHooks = createContextHooks<MetadataStateReturn>({
  objMetadata: { main: 'selectedObjMetadata', subgrid: 'selectedSubgridObjMetadata' },
  selectedObject: { main: 'selectedObject', subgrid: 'selectedSubgridObject' },
});

/** Hook for object metadata state - pass 'main' or 'subgrid' context */
export const useMetadataState = metadataHooks.useHook;

/** Hook for main grid metadata state */
export const useMainMetadataState = metadataHooks.useMainHook;

/** Hook for subgrid metadata state */
export const useSubgridMetadataState = metadataHooks.useSubgridHook;

// ============================================================
// SHARED HOOKS (same for main and subgrid)
// ============================================================

/** Hook for organization-level metadata (shared) */
export const useOrgMetadata = createSimpleHook([
  'orgObjects',
  'objectOptions',
  'objectPermissions',
  'objectPreferences',
  'userInfo',
  'userProfile',
]);

/** Hook for record type state (shared) */
export const useRecordTypeState = createSimpleHook([
  'recordTypes',
  'selectedRecordType',
  'showRecordTypeDialog',
]);

export default useMetadataState;
