DescribeSObjectResult describeResult = Schema.getGlobalDescribe()
  .get('AppGrid__AG_Budget_Item__c')
  .getDescribe();

for (Schema.SObjectField field : describeResult.fields.getMap().values()) {
  DescribeFieldResult fieldDescribe = field.getDescribe();
  System.debug(
    'Field Name: ' +
      fieldDescribe.getName() +
      ', Default Value: ' +
      fieldDescribe.getDefaultValueFormula()
  );
}
