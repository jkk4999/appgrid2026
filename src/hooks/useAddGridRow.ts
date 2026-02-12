import { SObjectMetadata } from '../sObjectMetadataTypes';
import createDummyApexId from '../utilities/createDummyApexId';
import { safeJsonDecode } from '../utilities/safeJson';

export interface GuardResult { allowed: boolean; message?: string }

export interface UseAddGridRowOptions {
  guardCreate: () => GuardResult;
  metadata: SObjectMetadata | null | undefined;
  selectedRecordType?: string | null;
  setSelectedRecordType: (id: string) => void;
  setRecordTypes: (rts: any[]) => void;
  setShowRecordTypeDialog: (open: boolean) => void;
  userInfo: { userId: string; name: string } | null | undefined;
  // When a boolean field has no default ('null'), set it to false (subgrid behavior)
  booleanNullAsFalse?: boolean;
}

export interface AddRowResult {
  record?: any; // minimal record seeded with defaults and Id
  openedRecordTypeDialog?: boolean; // true if we opened the dialog and are waiting for user input
}

export function useAddGridRow({
  guardCreate,
  metadata,
  selectedRecordType,
  setSelectedRecordType,
  setRecordTypes,
  setShowRecordTypeDialog,
  userInfo,
  booleanNullAsFalse = false,
}: UseAddGridRowOptions) {
  const addGridRow = async (): Promise<AddRowResult> => {
    // Permissions
    const g = guardCreate();
    if (!g.allowed) {
      throw new Error(g.message || 'Create permission not assigned');
    }

    if (!metadata) throw new Error('Object metadata not available');

    // RecordType handling
    const availableRecordTypes = (metadata.recordTypes || []).filter((rt: any) => rt.isAvailable);
    if (
      availableRecordTypes &&
      availableRecordTypes.length === 1 &&
      !availableRecordTypes[0].isMaster
    ) {
      setSelectedRecordType(availableRecordTypes[0].recordTypeId);
    }

    if (availableRecordTypes && availableRecordTypes.length > 1) {
      const defaultRecordType = availableRecordTypes.find((rt: any) => rt.isDefaultRecordTypeMapping);
      if (defaultRecordType) {
        setSelectedRecordType(defaultRecordType.recordTypeId);
      } else {
        // if user hasn't already selected, prompt
        if (!selectedRecordType) {
          setRecordTypes(availableRecordTypes);
          setShowRecordTypeDialog(true);
          return { openedRecordTypeDialog: true };
        }
      }
    }

    const rec: any = { Id: createDummyApexId() };
    if (selectedRecordType) rec['RecordTypeId'] = selectedRecordType;

    // Seed defaults from metadata
    const fields = metadata.fields || [];
    for (const f of fields) {
      if (f.isAccessible && f.isCreateable) {
        const fieldName = f.name;
        const defaultValue = f.defaultValue;
        const fieldType = f.type ? f.type : null;

        if (fieldType === 'BOOLEAN') {
          if (defaultValue !== 'null') {
            rec[fieldName] = (defaultValue ? safeJsonDecode<any>(defaultValue) : false) ?? false;
          } else if (booleanNullAsFalse) {
            rec[fieldName] = false;
          }
          continue;
        }

        if (
          defaultValue !== 'null' &&
          (fieldType === 'CURRENCY' ||
            fieldType === 'DECIMAL' ||
            fieldType === 'DOUBLE' ||
            fieldType === 'INTEGER' ||
            fieldType === 'LONG')
        ) {
          const convertedValue = Number(safeJsonDecode<any>(defaultValue!) as any);
          rec[fieldName] = convertedValue;
          continue;
        }

        if (f.type === 'REFERENCE' && f.name === 'OwnerId' && userInfo) {
          rec['OwnerId'] = userInfo.userId;
          rec['Owner'] = { Id: userInfo.userId, Name: userInfo.name };
          continue;
        }

        if (defaultValue !== 'null') {
          rec[fieldName] = safeJsonDecode<any>(defaultValue!);
        }
      }
    }

    return { record: rec };
  };

  return { addGridRow };
}

export default useAddGridRow;
