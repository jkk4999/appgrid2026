// Anonymous Apex code to create Case records for all Accounts

// Fetch all accounts and related contacts (including FirstName and LastName)
List<Account> accounts = [SELECT Id, (SELECT Id, FirstName, LastName FROM Contacts) FROM Account];

// Fetch all product records
List<Product2> products = [SELECT Id FROM Product2];

// Helper function to get picklist values dynamically for the Case object fields
Map<String, List<String>> getPicklistValues() {
    Map<String, List<String>> picklistMap = new Map<String, List<String>>();

    // Describe Case object
    Schema.DescribeSObjectResult caseDescribe = Case.sObjectType.getDescribe();

    // Loop through relevant fields and get picklist values for each field
    for (String fieldName : new List<String>{'Origin', 'Priority', 'Status', 'Type', 'Reason'}) {
        Schema.DescribeFieldResult field = caseDescribe.fields.getMap().get(fieldName).getDescribe();
        List<Schema.PicklistEntry> entries = field.getPicklistValues();
        List<String> fieldValues = new List<String>();

        for (Schema.PicklistEntry entry : entries) {
            if (entry.isActive() && (fieldName != 'Status' || entry.getValue() != 'Closed')) {
                fieldValues.add(entry.getValue());
            }
        }
        picklistMap.put(fieldName, fieldValues);
    }
    return picklistMap;
}

// Get the picklist values dynamically for the required fields
Map<String, List<String>> picklistValues = getPicklistValues();

// List to hold cases to be inserted
List<Case> casesToInsert = new List<Case>();

// Iterate through each account
for (Account acc : accounts) {
    // Generate a random number of cases per account (1 to 3 cases)
    Integer numberOfCases = Math.mod(Math.abs(Crypto.getRandomInteger()), 3) + 1; // 1 to 3 cases

    // Create the specified number of cases for each account
    for (Integer i = 0; i < 1; i++) {
        Case caseRecord = new Case();

        // Set AccountId
        caseRecord.AccountId = acc.Id;

        // Randomly assign picklist values for various fields
        caseRecord.Origin = picklistValues.get('Origin')[Math.mod(Math.abs(Crypto.getRandomInteger()), picklistValues.get('Origin').size())];
        caseRecord.Priority = picklistValues.get('Priority')[Math.mod(Math.abs(Crypto.getRandomInteger()), picklistValues.get('Priority').size())];
        caseRecord.Status = picklistValues.get('Status')[Math.mod(Math.abs(Crypto.getRandomInteger()), picklistValues.get('Status').size())];
        caseRecord.Type = picklistValues.get('Type')[Math.mod(Math.abs(Crypto.getRandomInteger()), picklistValues.get('Type').size())];
        caseRecord.Reason = picklistValues.get('Reason')[Math.mod(Math.abs(Crypto.getRandomInteger()), picklistValues.get('Reason').size())];

        // Randomly assign Escalated (true or false)
        caseRecord.IsEscalated = (Math.mod(Math.abs(Crypto.getRandomInteger()), 2) == 0);

        // If the account has contacts, randomly assign ContactId to one of them
        if (!acc.Contacts.isEmpty()) {
            caseRecord.ContactId = acc.Contacts[Math.mod(Math.abs(Crypto.getRandomInteger()), acc.Contacts.size())].Id;
        }

        // Add case to list of cases to insert
        casesToInsert.add(caseRecord);
    }
}

// Insert cases
if (!casesToInsert.isEmpty()) {
    System.debug('Inserting ' + casesToInsert.size() + ' cases');
    insert casesToInsert;
} else {
    System.debug('No cases inserted');
}
