// Define the queryRuleMap with CreatedDate filter
Map<String, Object> queryRuleMap = new Map<String, Object>{
  'condition' => 'and',
  'rules' => new List<Object>{
    new Map<String, Object>{
      'label' => 'Created Date',
      'field' => 'CreatedDate',
      'type' => 'date',
      'operator' => 'greaterthan',
      'value' => '2021-02-13'
    }
  },
  'isNot' => false
};

// Define the paramsObj map
Map<String, Object> paramsObj = new Map<String, Object>{
  'queryType' => 'QueryBuilder',
  'sObjectApiName' => 'Case',
  'sObjectRelatedName' => '',
  'relationName' => '',
  'rawWhereClause' => '',
  'queryRule' => queryRuleMap
};

// Serialize to JSON
String jsonStr = JSON.serialize(paramsObj);

// Fetch metadata and field list
SObjectMetadata metadata = AppGridController.fetchSObjectMetadata('Case');
List<String> soqlFields = AppGridController.getSoqlFields(
  'Case',
  metadata,
  true
);

// Validate fields
Map<String, Schema.SObjectField> caseFieldMap = Schema.SObjectType.Case.fields.getMap();
Set<String> validFields = caseFieldMap.keySet();

// Map relationship fields
Map<String, String> relationshipFieldMap = new Map<String, String>{
  'Contact.Name' => 'ContactId',
  'Account.Name' => 'AccountId',
  'Asset.Name' => 'AssetId',
  'Product.Name' => 'ProductId',
  'Entitlement.Name' => 'EntitlementId',
  'Source.Name' => 'SourceId',
  'Parent.CaseNumber' => 'ParentId',
  'Owner.Name' => 'OwnerId',
  'CreatedBy.Name' => 'CreatedById',
  'LastModifiedBy.Name' => 'LastModifiedById',
  'ServiceContract.Name' => 'ServiceContractId'
};

soqlFields.sort();
System.debug('soqlFields are');
for (String f : soqlFields) {
  System.debug('field: ' + f);
}
System.debug(
  'LastActivityDate Included: ' + soqlFields.contains('LastActivityDate')
);
System.debug('ContactPhone Included: ' + soqlFields.contains('ContactPhone'));
System.debug('ContactMobile Included: ' + soqlFields.contains('ContactMobile'));
System.debug('ContactFax Included: ' + soqlFields.contains('ContactFax'));

// Call executeDynamicSOQL and handle potential errors
AgWrapperQueryResult2 result;
try {
  result = AppGridController.executeDynamicSOQL(jsonStr);
} catch (Exception e) {
  System.debug('Error calling executeDynamicSOQL: ' + e.getMessage());
  return;
}

// Log the overall result status and error message
System.debug('Status: ' + result.status);
System.debug('Error Message: ' + result.errorMessage);
System.debug('Total Records Returned: ' + result.records.size());

system.debug(result.records[0]);

// if (result.records != null && !result.records.isEmpty()) {
//   Map<String, Object> record = (Map<String, Object>) result.records[0]; // Cast to Map<String, Object>
//   Map<String, Object> recordMap = new Map<String, Object>();

//   System.debug('Record 1 Field Values:');
//   for (String field : soqlFields) {
//     Object fieldValue = null;
//     String queryField = field;

//     // Handle relationship fields
//     if (field.contains('.')) {
//       String relationship = field.substringBefore('.');
//       String subField = field.substringAfter('.');
//       if (record.containsKey(relationship)) {
//         Map<String, Object> related = (Map<String, Object>) record.get(
//           relationship
//         );
//         if (related != null) {
//           fieldValue = related.get(subField);
//           System.debug(
//             'Processed relationship field: ' +
//               field +
//               ' = ' +
//               (fieldValue == null ? 'null' : String.valueOf(fieldValue))
//           );
//         } else {
//           System.debug('Relationship ' + relationship + ' is null');
//         }
//       } else {
//         System.debug('Relationship ' + relationship + ' not found in record');
//       }
//       recordMap.put(field, fieldValue);
//       continue;
//     }

//     // Handle simple fields
//     if (relationshipFieldMap.containsKey(field)) {
//       queryField = relationshipFieldMap.get(field);
//       System.debug('Mapped field: ' + field + ' -> ' + queryField);
//     }

//     // Validate field
//     if (
//       !validFields.contains(queryField.toLowerCase()) &&
//       !relationshipFieldMap.containsKey(field)
//     ) {
//       System.debug(
//         'Skipping invalid field: ' + queryField + ' (original: ' + field + ')'
//       );
//       recordMap.put(field, null);
//       continue;
//     }

//     // Get field value from map
//     if (record.containsKey(queryField)) {
//       fieldValue = record.get(queryField);
//       System.debug(
//         'Field: ' +
//           field +
//           ' = ' +
//           (fieldValue == null ? 'null' : String.valueOf(fieldValue))
//       );
//     } else {
//       System.debug('Field ' + queryField + ' not found in record');
//     }
//     recordMap.put(field, fieldValue);
//   }

//   System.debug('Record 1 JSON:');
//   System.debug(JSON.serializePretty(recordMap));
// } else {
//   System.debug('No records returned.');
// }
