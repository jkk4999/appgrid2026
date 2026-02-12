Integer batchSize = 1000;
List<AppGridAg__AG_View__c> prefs;

do {
  prefs = [
    SELECT Id
    FROM AppGridAg__AG_View__c
    LIMIT :batchSize
  ];

  if (!prefs.isEmpty()) {
    delete prefs;
  }
} while (!prefs.isEmpty());
