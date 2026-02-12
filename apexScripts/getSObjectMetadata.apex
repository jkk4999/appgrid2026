// SObjectMetadata metadata = AppGrid.AppGridController.fetchSObjectMetadata(
//   'User'
// );

SObjectMetadata metadata = AppGridAg.AppGridController.getMetadata('AppGridAg__AG_Budget_Item__c');
// system.debug('metadata is ' + metadata);

system.debug('metadata child relationships are ' + metadata.childRelationships);



