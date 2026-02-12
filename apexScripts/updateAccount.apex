// Anonymous Apex code to update Order Start Date and Order End Date by 1 month

// Query all orders
List<Account> accountsToUpdate = [
  SELECT Id, AppGrid__Active__c, AppGrid__EstimatedRevenue__c
  FROM Account
];

// List to hold updated orders
List<Account> accountsToUpdateList = new List<Account>();

// Iterate over the orders and update dates
for (Account acc : accountsToUpdate) {
  if (acc.AppGrid__EstimatedRevenue__c < 1000000) {
    acc.AppGrid__EstimatedRevenue__c =
      acc.AppGrid__EstimatedRevenue__c + 1000000;
  }
  acc.AppGrid__Active__c = 'Yes';
  accountsToUpdateList.add(acc);
}

// Update the orders in the database
if (!accountsToUpdateList.isEmpty()) {
  update accountsToUpdateList;
}
