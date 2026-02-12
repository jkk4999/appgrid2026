String sObjectApiName = 'AppGrid__AG_Budget_Item__c';
String sObjectFieldApiName = 'AppGrid__AG_Budget__c';

Map<String, Object> metadataMap = new Map<String, Object>();

DescribeSObjectResult objMetadata = Schema.getGlobalDescribe()
  .get(sObjectApiName)
  .getDescribe();

// Adding various serializable describeResult properties
metadataMap.put('apiName', objMetadata.getName());
metadataMap.put('isAccessible', objMetadata.isAccessible());
metadataMap.put('isCreateable', objMetadata.isCreateable());
metadataMap.put('isCustom', objMetadata.isCustom());
metadataMap.put('isCustomSetting', objMetadata.isCustomSetting());
metadataMap.put('isDeleteable', objMetadata.isDeletable());
metadataMap.put('isQueryable', objMetadata.isQueryable());
metadataMap.put('isUpdateable', objMetadata.isUpdateable());
metadataMap.put('isSearchable', objMetadata.isSearchable());
metadataMap.put('keyPrefix', objMetadata.getKeyPrefix());
metadataMap.put('label', objMetadata.getLabel());
metadataMap.put('sobjectType', objMetadata.getSObjectType());

// Extract field information
Map<String, Map<String, Object>> fieldsInfo = new Map<String, Map<String, Object>>();
for (Schema.SObjectField field : objMetadata.fields.getMap().values()) {
  Map<String, Object> fieldInfo = new Map<String, Object>();
  DescribeFieldResult fieldDescribe = field.getDescribe();
  fieldInfo.put('name', fieldDescribe.getName());
  fieldInfo.put('label', fieldDescribe.getLabel());
  fieldInfo.put('type', fieldDescribe.getType());
  fieldInfo.put('length', fieldDescribe.getLength());
  fieldInfo.put('isAccessible', fieldDescribe.isAccessible());
  fieldInfo.put('isCreateable', fieldDescribe.isCreateable());
  fieldInfo.put('isUpdateable', fieldDescribe.isUpdateable());
  fieldsInfo.put(fieldDescribe.getName(), fieldInfo);
}
metadataMap.put('fields', fieldsInfo);

// Get the fields for the SObject
List<Schema.SObjectField> fields = objMetadata.fields.getMap().values();

List<String> accessibleFields = new List<String>();

for (Schema.SObjectField field : fields) {
  Schema.DescribeFieldResult fieldDescribe = field.getDescribe();

  // always add the field name
  String fieldName = fieldDescribe.getName();

  // don't add relation for these fields
  if (
    fieldName == 'BusinessProcessId' ||
    fieldName == 'CallCenterId' ||
    fieldName == 'DandbCompanyId' ||
    fieldName == 'DelegatedApproverId' ||
    fieldName == 'MasterRecordId' ||
    fieldName == 'ParentId' ||
    fieldName == 'RecurrenceActivityId'
  ) {
    continue;
  }
  // for a custom object, this would return something like Custom_Object__r;
  // for special fields like CreatedById, this would return CreatedBy
  //  String fieldRelationName = fieldDescribe.getRelationshipName();

  if (sObjectApiName == 'Opportunity' && fieldName == 'ContactId') {
    continue;
  }

  // HANDLE POLYMORPHIC FIELDS

  // assume name field exists for WhatId reference
  if (fieldName == 'WhatId') {
    String clause = 'TYPEOF What WHEN Account THEN Name ELSE Name END';
    accessibleFields.add(clause);
    continue;
  }

  // assume name field exists for WhoId reference
  if (fieldName == 'WhoId') {
    String clause = 'TYPEOF Who WHEN Lead THEN Name ELSE Name END';
    accessibleFields.add(clause);
    continue;
  }

  if (fieldDescribe.getType() == Schema.DisplayType.REFERENCE) {
    system.debug('getting referenceTo object for ' + fieldName);

    // Get the sObjectType of the referenceTo field
    List<Schema.SObjectType> referenceToObjList = fieldDescribe.getReferenceTo();

    // Check if referenceTo list is empty
    if (referenceToObjList.isEmpty()) {
      continue;
    }

    // TBD: Handle the case when fieldMetadata.getRefereceTo points to more than 1 parent object
    Schema.SObjectType referenceTo = referenceToObjList[0];

    // get relationshipName
    String relationshipName = fieldDescribe.getRelationshipName();
    system.debug('relationshipName is: ' + relationshipName);

    // get parent obj metadata
    Schema.DescribeSObjectResult parentObjMetadata = referenceTo.getDescribe();

    // Loop through the fields of the parent object and find the name field
    String nameField = '';
    for (Schema.SObjectField f : parentObjMetadata.fields.getMap().values()) {
      Schema.DescribeFieldResult fieldDesc = f.getDescribe();
      if (fieldDesc.isNameField()) {
        String refFieldName = relationshipName + '.' + fieldDesc.getName();
        System.debug('refFieldName is ' + refFieldName);
        nameField = refFieldName;
        continue;
      }
    }
    if (!String.isBlank(nameField)) {
      accessibleFields.add(nameField);
    }
  }
}

system.debug('accessibleFields: ' + accessibleFields);
