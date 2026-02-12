import useStore from '../zustandStore';
import type { OrgObject, SObjectMetadata, SObjectPermission } from '../sObjectMetadataTypes';

export type PermissionAction = 'create' | 'edit' | 'delete';

export interface UseObjectPermissionsOptions {
  // Provide explicit metadata (e.g., for subgrids) instead of store-selected metadata
  metadata?: SObjectMetadata | null;
}

function toApiName(obj: string | OrgObject | null | undefined): string | undefined {
  if (!obj) return undefined;
  return typeof obj === 'string' ? obj : obj.qualifiedApiName;
}

export function useObjectPermissions(
  selectedObject: string | OrgObject | null | undefined,
  opts?: UseObjectPermissionsOptions,
) {
  // Note: intentionally NOT using React hooks here to avoid hook-order risks in host environments.
  // We derive state via Zustand's getState() to keep this helper pure and side-effect free.
  const { objectPermissions, selectedObjMetadata: storeMetadata } = useStore.getState();

  const apiName = toApiName(selectedObject);
  const metadata = opts?.metadata ?? storeMetadata;

  // When metadata exists and refers to Task/Event, use it (those often come via describe vs. perms list)
  const isTaskOrEvent = apiName === 'Task' || apiName === 'Event';

  if (!apiName) {
    return { canCreate: false, canEdit: false, canDelete: false, guard: () => ({ allowed: false, message: 'Permissions record for object was not found' }), getDeniedMessage: () => 'Permission not assigned' };
  }

  if (isTaskOrEvent && metadata && metadata.sobjectType) {
    const canCreate = !!(metadata.isAccessible && metadata.isCreateable);
    const canEdit = !!(metadata.isAccessible && metadata.isUpdateable);
    const canDelete = !!(metadata.isAccessible && metadata.isDeletable);
    return buildReturn(apiName, canCreate, canEdit, canDelete);
  }

  const perm: SObjectPermission | undefined = objectPermissions?.find(
    (p) => p.sObjectType === apiName,
  );

  if (!perm) {
    const denied = { canCreate: false, canEdit: false, canDelete: false };
    return buildReturn(apiName, denied.canCreate, denied.canEdit, denied.canDelete, true);
  }

  // Prefer normalized booleans if present; fall back to source properties
  const canCreate = (perm as any).canCreate ?? !!perm.permissionsCreate;
  const canEdit = (perm as any).canEdit ?? !!perm.permissionsEdit;
  const canDelete = (perm as any).canDelete ?? !!perm.permissionsDelete;

  return buildReturn(apiName, canCreate, canEdit, canDelete);

}

function buildReturn(apiName: string, canCreate: boolean, canEdit: boolean, canDelete: boolean, missing = false) {
  const getDeniedMessage = (action: PermissionAction, obj?: string) => {
    const name = obj ?? apiName ?? 'object';
    switch (action) {
      case 'create':
        return `Create permission for ${name} not assigned`;
      case 'edit':
        return `Edit permission for ${name} not assigned`;
      case 'delete':
        return `Delete permission for ${name} not assigned`;
    }
  };

  const getMissingRecordMessage = (obj?: string) => {
    const name = obj ?? apiName ?? 'object';
    return `Permissions record for ${name} was not found`;
  };

  const guard = (action: PermissionAction) => {
    if (missing) {
      return { allowed: false, message: getMissingRecordMessage(apiName) };
    }
    const allowed = action === 'create' ? canCreate : action === 'edit' ? canEdit : canDelete;
    return allowed ? { allowed: true } : { allowed: false, message: getDeniedMessage(action, apiName) };
  };

  return { canCreate, canEdit, canDelete, guard, getDeniedMessage };
}

export default useObjectPermissions;
