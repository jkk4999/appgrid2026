// AgWrapperCacheKeys apiResult2 = AppGridController.invalidateMetadata(
//   'AppGrid__AG_Config__c'
// );

// AgWrapperCacheKeys apiResult2 = AppGridController.invalidateMetadata(
//   'AppGrid__AG_Forecast__c'
// );

AgWrapperCacheKeys apiResult2 = AppGridController.invalidateMetadata(
  'AppGrid__AG_TreeGrid_Prefs__c'
);

system.debug(apiResult2);
