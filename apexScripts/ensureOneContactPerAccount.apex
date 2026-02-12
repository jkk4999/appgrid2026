Map<Id, List<Contact>> contactsByAccount = new Map<Id, List<Contact>>();

// Only pull Contacts that have NO Cases
for (Contact c : [
  SELECT Id, AccountId, CreatedDate, (SELECT Id FROM Cases LIMIT 1)
  FROM Contact
  WHERE AccountId != NULL
  ORDER BY AccountId, CreatedDate ASC
]) {
  // Skip contacts that have at least one Case
  if (!c.Cases.isEmpty()) {
    continue;
  }

  if (!contactsByAccount.containsKey(c.AccountId)) {
    contactsByAccount.put(c.AccountId, new List<Contact>());
  }
  contactsByAccount.get(c.AccountId).add(c);
}

// Collect contacts to delete (all but the first per account)
List<Contact> contactsToDelete = new List<Contact>();

for (Id accountId : contactsByAccount.keySet()) {
  List<Contact> accountContacts = contactsByAccount.get(accountId);

  if (accountContacts.size() > 1) {
    for (Integer i = 1; i < accountContacts.size(); i++) {
      contactsToDelete.add(accountContacts[i]);
    }
  }
}

// Partial delete
if (!contactsToDelete.isEmpty()) {
  Database.DeleteResult[] results = Database.delete(contactsToDelete, false);

  for (Integer i = 0; i < results.size(); i++) {
    if (!results[i].isSuccess()) {
      for (Database.Error err : results[i].getErrors()) {
        System.debug(
          'Failed to delete Contact ' +
            contactsToDelete[i].Id +
            ' | ' +
            err.getStatusCode() +
            ' | ' +
            err.getMessage()
        );
      }
    }
  }
}

System.debug('Attempted deletes: ' + contactsToDelete.size());
