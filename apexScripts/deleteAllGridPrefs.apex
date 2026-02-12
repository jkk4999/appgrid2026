Integer batchSize = 200;
List<AppGridAg__AG_Grid_Prefs__c> prefs;

do {
  prefs = [
    SELECT Id
    FROM AppGridAg__AG_Grid_Prefs__c
    LIMIT :batchSize
  ];

  if (!prefs.isEmpty()) {
    delete prefs;
  }
} while (!prefs.isEmpty());
