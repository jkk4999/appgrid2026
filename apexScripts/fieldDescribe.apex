// Global describe map
Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();

// Get the Shared View object
Schema.SObjectType sharedViewType = gd.get('AppGridAg__AG_Shared_View__c');
Schema.DescribeSObjectResult sharedViewDescribe = sharedViewType.getDescribe();

// Directly access the field by name from the Describe API (avoids null)
Schema.DescribeFieldResult f;
try {
  f = sharedViewDescribe.fields.getMap()
    .get('AppGridAg__Source_View__c')
    .getDescribe();
} catch (NullPointerException e) {
  System.debug(
    'Field AppGridAg__Source_View__c not found in this context. Available fields: ' +
    sharedViewDescribe.fields.getMap().keySet()
  );
  return;
}

// Now safe to use
System.debug('Field API Name: ' + f.getName());
System.debug('Field Type: ' + f.getType());
System.debug('Relationship Name: ' + f.getRelationshipName());
System.debug('References To: ' + f.getReferenceTo());
