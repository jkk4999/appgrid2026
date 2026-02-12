// Get the Standard Price Book ID
Id standardPricebookId = [
  SELECT Id
  FROM Pricebook2
  WHERE IsStandard = TRUE
  LIMIT 1
]
.Id;

// Get all Account IDs that do not have any Orders
List<Id> accountIds = new List<Id>();

// Query all Account IDs that do not have existing orders
for (Account acc : [
  SELECT Id
  FROM Account
  WHERE Id NOT IN (SELECT AccountId FROM Order)
]) {
  accountIds.add(acc.Id);
}

// Shuffle the Account IDs to randomize the selection
accountIds.sort();

// Create a list to store the selected account IDs
List<Id> selectedAccountIds = new List<Id>();

// Get the accounts
for (Integer i = 0; i < accountIds.size(); i++) {
  selectedAccountIds.add(accountIds[i]);
}

// Query the selected accounts to get their names
List<Account> selectedAccounts = [
  SELECT Id, Name
  FROM Account
  WHERE Id IN :selectedAccountIds
];

// Query all active products in the Standard Price Book
List<PricebookEntry> standardPricebookEntries = [
  SELECT Id, Product2Id, UnitPrice
  FROM PricebookEntry
  WHERE Pricebook2Id = :standardPricebookId AND IsActive = TRUE
];

// Query the valid picklist values for the Status field on the Order object
List<String> validStatuses = new List<String>();
Schema.DescribeFieldResult statusFieldDescribe = Order.Status.getDescribe();
for (Schema.PicklistEntry entry : statusFieldDescribe.getPicklistValues()) {
  validStatuses.add(entry.getValue());
}

// List to hold the new orders
List<Order> newOrders = new List<Order>();

// Get the current year and month
Integer currentYear = Date.today().year();
Integer currentMonth = Date.today().month();
Integer daysInMonth = Date.daysInMonth(currentYear, currentMonth);

// Iterate over each account and create 4 orders per account
for (Account acc : selectedAccounts) {
  for (Integer i = 0; i < 4; i++) {
    Order order = new Order();
    order.AccountId = acc.Id;
    order.Pricebook2Id = standardPricebookId; // Set the Standard Price Book ID

    // Generate a random day in the current month
    Integer randomDay = Math.floor(Math.random() * daysInMonth).intValue() + 1;
    Date effectiveDate = Date.newInstance(currentYear, currentMonth, randomDay);

    // Generate random EndDate 1-3 days after EffectiveDate
    Date endDate = effectiveDate.addDays(
      Math.floor(Math.random() * 3 + 1).intValue()
    );

    order.EffectiveDate = effectiveDate;
    order.EndDate = endDate;

    order.Type = 'Product';

    // Generate Order Name: 'Order' + EffectiveDate + abbreviated Account Name
    String abbrevAccountName = acc.Name.length() > 10
      ? acc.Name.substring(0, 10)
      : acc.Name;
    order.Name = 'Order ' + effectiveDate.format() + ' ' + abbrevAccountName;

    // Set initial Status to 'Draft'
    order.Status = 'Draft';

    // Add the order to the list
    newOrders.add(order);
  }
}

// Insert all the orders
if (!newOrders.isEmpty()) {
  insert newOrders;
}

// Now create OrderItems for each order
List<OrderItem> orderItems = new List<OrderItem>();

for (Order ord : newOrders) {
  // Randomly select 1-3 products to add to the order
  Integer numberOfProducts = Math.floor(Math.random() * 3 + 1).intValue();
  List<PricebookEntry> selectedEntries = new List<PricebookEntry>();

  // Randomly pick entries
  while (selectedEntries.size() < numberOfProducts) {
    Integer randomIndex = Math.floor(
        Math.random() * standardPricebookEntries.size()
      )
      .intValue();
    PricebookEntry entry = standardPricebookEntries[randomIndex];
    if (!selectedEntries.contains(entry)) {
      selectedEntries.add(entry);
    }
  }

  for (PricebookEntry pbe : selectedEntries) {
    OrderItem item = new OrderItem();
    item.OrderId = ord.Id;
    item.Product2Id = pbe.Product2Id;
    item.Quantity = 1; // Set Quantity to 1
    item.UnitPrice = pbe.UnitPrice; // Use the UnitPrice from the PricebookEntry
    item.PricebookEntryId = pbe.Id;

    orderItems.add(item);
  }
}

// Insert all OrderItems
if (!orderItems.isEmpty()) {
  insert orderItems;
}

// Now update the status of each order to one of the valid statuses
List<Order> ordersToUpdate = new List<Order>();

for (Order ord : newOrders) {
  // Randomly assign a valid Status
  ord.Status = validStatuses[
    Math.floor(Math.random() * validStatuses.size()).intValue()
  ];
  ordersToUpdate.add(ord);
}

// Update the orders with the new status
if (!ordersToUpdate.isEmpty()) {
  update ordersToUpdate;
}
