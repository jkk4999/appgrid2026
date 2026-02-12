// Anonymous Apex code to update Order Start Date and Order End Date by 1 month

// Query all orders
List<Order> ordersToUpdate = [
  SELECT Id, ActivatedDate, EffectiveDate, EndDate, Status
  FROM Order
];

// List to hold updated orders
List<Order> ordersToUpdateList = new List<Order>();

// Iterate over the orders and update dates
for (Order ord : ordersToUpdate) {
  if (ord.EffectiveDate != null) {
    ord.Status = 'Cancelled';
  }
  ordersToUpdateList.add(ord);
}

// Update the orders in the database
if (!ordersToUpdateList.isEmpty()) {
  update ordersToUpdateList;
}
