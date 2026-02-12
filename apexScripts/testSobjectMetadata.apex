SObjectMetadata result = AppGridController.fetchSObjectMetadata(
  'AppGrid__AG_Budget_Item__c'
);

// Output each field name on a separate line
for (SObjectFieldMetadata field : result.fields) {
  System.debug(
    'Field Name: ' + field.name + ', Default Value: ' + field.defaultValue
  );
}
