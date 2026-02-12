// Convert the list of excluded keywords to a Set for faster lookup
Set<String> excludedKeywords = new Set<String>{
  'Activity',
  'Action',
  'Apex',
  'AIInsightValue',
  'AIRecordInsight',
  'AppAnalyticsQueryRequest',
  'Assignment',
  'AssociatedLocation',
  'Authorization',
  'Attachment',
  'Clean',
  'ChangeEvent',
  'Collab',
  'ContactPoint',
  'Content',
  'Consent',
  'Document',
  'Digital',
  'DuplicateRecord',
  'Email',
  'Feed',
  'Flow',
  'History',
  'Gateway',
  'Image',
  'Macro',
  'Memo',
  'MsgChannelLanguageKeyword',
  'Messaging',
  'NamespaceRegistry',
  'Network',
  'Oauth',
  'OrgDelete',
  'OrgMetric',
  'Permission',
  'Process',
  'PushTopic',
  'QueueSobject',
  'QuickText',
  'Redirect',
  'Request',
  'RegisteredExternalServic',
  'ResourcePreference',
  'Scratch',
  'Session',
  'SetupAssistantStep',
  'SetupEntityAccess',
  'Share',
  'Snapshot',
  'StoreIntegratedService',
  'StreamingChannel',
  'Subscription',
  'Template',
  'TodayGoal',
  'Transaction',
  'UserApp',
  'UserPrioritizedRecord',
  'VoiceCall',
  'Vote',
  'Waitlist',
  'WebCart',
  'WebStore'
};

// Set to track already processed child relationship names
Set<String> processedNames = new Set<String>();

DescribeSObjectResult describeResult = Schema.getGlobalDescribe()
  .get('Account')
  .getDescribe();

// Iterate over the child relationships
for (
  Schema.ChildRelationship childRel : describeResult.getChildRelationships()
) {
  String childSObjectName = childRel.getChildSObject().getDescribe().getName();

  // Check if any excluded keyword is part of the childSObjectName
  Boolean exclude = false;
  for (String keyword : excludedKeywords) {
    if (childSObjectName.contains(keyword)) {
      exclude = true;
      break;
    }
  }

  // If not excluded and not already processed, output the childSObjectName
  if (!exclude && !processedNames.contains(childSObjectName)) {
    System.debug(childSObjectName);
    processedNames.add(childSObjectName);
  }
}
