// Test the getSoqlFields method with the Task object in Execute Anonymous
// Schema.DescribeSObjectResult dfr = Schema.SObjectType.Task;

SObjectMetadata result = AppGridController.fetchSObjectMetadata('Account');

// Call the getSoqlFields method and capture the result
List<String> soqlFields = AppGridController.getSoqlFields('Task', result, true);

// Output the result to debug log
for (String field : soqlFields) {
  System.debug('Field: ' + field);
}
