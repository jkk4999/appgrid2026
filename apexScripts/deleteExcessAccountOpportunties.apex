// Query all opportunities grouped by AccountId
List<Opportunity> opportunitiesToDelete = new List<Opportunity>();

// Find all Accounts that have more than one Opportunity
Map<Id, List<Opportunity>> accountOpportunitiesMap = new Map<Id, List<Opportunity>>();

// Query opportunities, including AccountId to group by Account
List<Opportunity> opportunities = [
    SELECT Id, AccountId
    FROM Opportunity
    WHERE AccountId != NULL
];

// Group opportunities by AccountId
for (Opportunity opp : opportunities) {
    if (!accountOpportunitiesMap.containsKey(opp.AccountId)) {
        accountOpportunitiesMap.put(opp.AccountId, new List<Opportunity>());
    }
    accountOpportunitiesMap.get(opp.AccountId).add(opp);
}

// Iterate through each Account and check if more than one Opportunity exists
for (Id accountId : accountOpportunitiesMap.keySet()) {
    List<Opportunity> accountOpportunities = accountOpportunitiesMap.get(accountId);

    // If there are more than 1 Opportunity, delete the extra ones
    if (accountOpportunities.size() > 1) {
        // Exclude the first Opportunity (keep one) and add the rest to the delete list
        accountOpportunities.remove(0); // Keep the first Opportunity
        opportunitiesToDelete.addAll(accountOpportunities);
    }
}

// Delete excess Opportunities
if (!opportunitiesToDelete.isEmpty()) {
    delete opportunitiesToDelete;
    System.debug('Deleted ' + opportunitiesToDelete.size() + ' Opportunities.');
} else {
    System.debug('No Opportunities to delete.');
}