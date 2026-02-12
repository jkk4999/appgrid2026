// Get all Account IDs
List<Id> accountIds = new List<Id>([SELECT Id FROM Account].size());

// Populate the accountIds list
for (Account acc : [SELECT Id FROM Account]) {
  accountIds.add(acc.Id);
}

// Shuffle the Account IDs to randomize the selection
accountIds.sort();

// Create a list to store the selected account IDs
List<Id> selectedAccountIds = new List<Id>();

// Get the first 50 accounts after shuffling
for (Integer i = 0; i < Math.min(50, accountIds.size()); i++) {
  selectedAccountIds.add(accountIds[i]);
}

// Query the selected accounts to get their names
List<Account> selectedAccounts = [
  SELECT Id, Name
  FROM Account
  WHERE Id IN :selectedAccountIds
];

// List to hold the new orders
List<Order> newOrders = new List<Order>();

// Iterate over each account and create 4 orders per account
for (Account acc : selectedAccounts) {
  for (Integer i = 0; i < 4; i++) {
    Order order = new Order();
    order.AccountId = acc.Id;

    // Generate random EffectiveDate within the last 60 days
    Date effectiveDate = Date.today()
      .addDays(-Math.floor(Math.random() * 60).intValue());

    // Generate random EndDate 1-3 days after EffectiveDate
    Date endDate = effectiveDate.addDays(
      Math.floor(Math.random() * 3 + 1).intValue()
    );

    order.EffectiveDate = effectiveDate;
    order.EndDate = endDate;

    order.Type = 'Product';
    order.TotalAmount = Math.floor(Math.random() * (10000 - 1000 + 1) + 1000);

    // Generate Order Name: 'Order' + EffectiveDate + abbreviated Account Name
    String abbrevAccountName = acc.Name.length() > 10
      ? acc.Name.substring(0, 10)
      : acc.Name;
    order.Name = 'Order ' + effectiveDate.format() + ' ' + abbrevAccountName;

    // Randomly assign a Status
    List<String> statuses = new List<String>{
      'Received',
      'Processing',
      'Preparing for shipment',
      'Shipped',
      'In-transit',
      'Out for delivery',
      'Delivered',
      'Attempted Delivery',
      'Cancelled',
      'Delayed'
    };
    order.Status = statuses[
      Math.floor(Math.random() * statuses.size()).intValue()
    ];

    // Add the order to the list
    newOrders.add(order);
  }
}

// Insert all the orders
if (!newOrders.isEmpty()) {
  insert newOrders;
}
