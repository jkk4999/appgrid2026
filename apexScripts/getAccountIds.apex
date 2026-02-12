List <Account> accnts = [SELECT Id, AppGridAg__F500_Rank__c FROM Account ORDER BY AppGridAg__F500_Rank__c];

// Create a list to hold Account Ids
List<Id> accountIds = new List<Id>();

// Iterate through the Accounts and add the Ids to the list
for (Account acc : accnts) {
   accountIds.add(acc.Id);
}

// Debug the list of Account Ids
System.debug(accountIds);