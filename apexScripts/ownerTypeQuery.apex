// Execute Anonymous Apex to query Account with Owner.Name and Owner.Type
List<Account> accounts = [
  SELECT Id, Name, Owner.Name
  FROM Account
  LIMIT 10
]; // You can adjust the LIMIT as needed

for (Account acc : accounts) {
  System.debug('Account Name: ' + acc.Name);
  System.debug('Owner Name: ' + acc.Owner.Name);
}
