/**
 * Metadata Slice
 *
 * Manages org metadata, object permissions, preferences, and user info.
 * Uses createSliceWithSetters for automatic setter generation.
 */

import { createSliceWithSetters } from '../createSlice';
import type {
  OrgObject,
  SObjectMetadata,
  SObjectPermission,
  ObjectPreference,
  UserInfo,
  UserProfile,
  RelationPreference
} from '../types';

// ============================================================
// INITIAL STATE
// ============================================================

const metadataState = {
  orgObjects: [] as OrgObject[],
  objectOptions: [] as OrgObject[],
  objectPermissions: [] as SObjectPermission[],
  objectPreferences: [] as ObjectPreference[],
  objectPreferenceRecId: '',
  selectedObject: null as OrgObject | null,
  selectedObjMetadata: null as SObjectMetadata | null,
  userInfo: null as UserInfo | null,
  userProfile: null as UserProfile | null,
  recordTypes: [] as unknown,
  selectedRecordType: '',
  relationPreferences: [] as RelationPreference[],
  relationPreferenceRecId: '',
};

// ============================================================
// SLICE CREATOR
// ============================================================

export const createMetadataSlice = createSliceWithSetters(metadataState);
