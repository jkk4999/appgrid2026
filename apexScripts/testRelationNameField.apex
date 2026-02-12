String sObjectApiName = 'AppGrid__AG_Budget_Item__c';
String sObjectFieldApiName = 'AppGrid__AG_Budget__c';

Map<String, Object> metadataMap = new Map<String, Object>();

DescribeSObjectResult objMetadata = Schema.getGlobalDescribe()
  .get(sObjectApiName)
  .getDescribe();

// Adding various serializable describeResult properties
metadataMap.put('sobjectName', objMetadata.getName());
metadataMap.put('sobjectLabel', objMetadata.getLabel());
metadataMap.put('sobjectPluralLabel', objMetadata.getLabelPlural());
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

for (String key : metadataMap.keySet()) {
  // Get the field name (key) and its value
  Object fieldValue = metadatamap.get(key);

  // Output the field name and value to the debug log
  System.debug(key + ': ' + fieldValue);
}
