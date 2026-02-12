// Fetch all accounts
List<Account> accounts = [SELECT Id, Name FROM Account];

// Fetch all products
List<Product2> products = [SELECT Id FROM Product2];

// Fetch active price book entries (PriceBookEntries) for the Standard Price Book
Pricebook2 standardPriceBook = [
    SELECT Id
    FROM Pricebook2
    WHERE IsStandard = TRUE
    LIMIT 1
];

// Fetch all active PriceBookEntry records for the products in the Standard Price Book
List<PricebookEntry> priceBookEntries = [
    SELECT Id, Product2Id, UnitPrice
    FROM PricebookEntry
    WHERE Pricebook2Id = :standardPriceBook.Id AND IsActive = TRUE
];

// Helper function to get picklist values dynamically for the Opportunity object fields
Map<String, List<String>> getOpportunityPicklistValues() {
    Map<String, List<String>> picklistMap = new Map<String, List<String>>();

    Schema.DescribeSObjectResult opportunityDescribe = Opportunity.sObjectType.getDescribe();

    // Get picklist values for StageName, excluding "Closed Won"
    Schema.DescribeFieldResult stageField = opportunityDescribe.fields.getMap()
        .get('StageName')
        .getDescribe();
    List<String> stageValues = new List<String>();
    for (Schema.PicklistEntry entry : stageField.getPicklistValues()) {
        if (entry.isActive() && entry.getValue() != 'Closed Won') {
            stageValues.add(entry.getValue());
        }
    }

    // Get picklist values for Type and LeadSource fields
    List<String> typeValues = new List<String>();
    for (Schema.PicklistEntry entry : opportunityDescribe.fields.getMap().get('Type').getDescribe().getPicklistValues()) {
        if (entry.isActive()) {
            typeValues.add(entry.getValue());
        }
    }

    List<String> leadSourceValues = new List<String>();
    for (Schema.PicklistEntry entry : opportunityDescribe.fields.getMap().get('LeadSource').getDescribe().getPicklistValues()) {
        if (entry.isActive()) {
            leadSourceValues.add(entry.getValue());
        }
    }

    picklistMap.put('StageName', stageValues);
    picklistMap.put('Type', typeValues);
    picklistMap.put('LeadSource', leadSourceValues);

    return picklistMap;
}

// Get the picklist values dynamically for the Opportunity object fields
Map<String, List<String>> oppPicklistValues = getOpportunityPicklistValues();

// List to hold opportunities to be inserted
List<Opportunity> opportunitiesToInsert = new List<Opportunity>();

// List to hold opportunity line items to be inserted
List<OpportunityLineItem> opportunityLineItemsToInsert = new List<OpportunityLineItem>();

// Iterate through each account to create opportunities
for (Account acc : accounts) {
    Integer numOpportunities = 1 + Math.mod(Math.abs(Crypto.getRandomInteger()), 3); // Randomly 1 to 3 Opportunities

    for (Integer i = 0; i < numOpportunities; i++) {
        Opportunity opp = new Opportunity();
        opp.AccountId = acc.Id;
        opp.Name = 'Opp - ' + acc.Name + ' - ' + (i + 1);
        opp.CloseDate = System.today()
            .addDays(Math.mod(Math.abs(Crypto.getRandomInteger()), 121)); // today to +90 days

        // Randomly assign picklist values for Opportunity fields
        opp.StageName = oppPicklistValues.get('StageName')[
            Math.mod(Math.abs(Crypto.getRandomInteger()), oppPicklistValues.get('StageName').size())
        ];
        opp.Type = oppPicklistValues.get('Type')[
            Math.mod(Math.abs(Crypto.getRandomInteger()), oppPicklistValues.get('Type').size())
        ];
        opp.LeadSource = oppPicklistValues.get('LeadSource')[
            Math.mod(Math.abs(Crypto.getRandomInteger()), oppPicklistValues.get('LeadSource').size())
        ];

        opportunitiesToInsert.add(opp);
    }
}

// Insert the opportunities
if (!opportunitiesToInsert.isEmpty()) {
    insert opportunitiesToInsert;
}

// Query the newly inserted Opportunities
List<Opportunity> insertedOpportunities = [
    SELECT Id, AccountId
    FROM Opportunity
    WHERE AccountId IN :accounts
];

// Create OpportunityLineItem records for each Opportunity
for (Opportunity opp : insertedOpportunities) {
    Integer numLineItems = 1 + Math.mod(Math.abs(Crypto.getRandomInteger()), 3); // Randomly 1 to 3 Line Items

    for (Integer i = 0; i < numLineItems; i++) {
        if (!priceBookEntries.isEmpty()) {
            PricebookEntry selectedPbe = priceBookEntries[
                Math.mod(Math.abs(Crypto.getRandomInteger()), priceBookEntries.size())
            ];

            OpportunityLineItem oli = new OpportunityLineItem();
            oli.OpportunityId = opp.Id;
            oli.PricebookEntryId = selectedPbe.Id;
            oli.Quantity = 1;
            oli.UnitPrice = selectedPbe.UnitPrice;

            opportunityLineItemsToInsert.add(oli);
        }
    }
}

// Insert opportunity line items
if (!opportunityLineItemsToInsert.isEmpty()) {
    insert opportunityLineItemsToInsert;
}
