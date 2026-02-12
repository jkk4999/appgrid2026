/**
 * @description Public method to be called to start the deduplication process.
 * This is safe to run multiple times.
 */

// Step 1: Use an aggregate query to find all Account Ids that have more
// than one associated Contact. This is highly efficient.
List<AggregateResult> accountsWithMultipleContacts = [
  SELECT AccountId, COUNT(Id) contactCount
  FROM Contact
  WHERE AccountId != NULL
  GROUP BY AccountId
  HAVING COUNT(Id) > 1
];

if (accountsWithMultipleContacts.isEmpty()) {
  System.debug('No accounts with duplicate contacts found. Exiting.');
  return;
}

// Collect the Ids of the affected accounts into a Set for the next query.
Set<Id> accountIdsToProcess = new Set<Id>();
for (AggregateResult ar : accountsWithMultipleContacts) {
  accountIdsToProcess.add((Id) ar.get('AccountId'));
}

// Step 2: Query all contacts for the affected accounts.
// It's crucial to order by AccountId and then by CreatedDate descending.
// This ensures the first record we see for any account is the newest one.
List<Contact> contactsForProcessing = [
  SELECT Id, AccountId, CreatedDate
  FROM Contact
  WHERE AccountId IN :accountIdsToProcess
  ORDER BY AccountId, CreatedDate DESC
];

List<Contact> contactsToDelete = new List<Contact>();
Set<Id> accountsProcessed = new Set<Id>(); // A Set to track which accounts we've already "kept" a contact for.

// Step 3: Iterate through the sorted list to identify duplicates.
for (Contact c : contactsForProcessing) {
  if (accountsProcessed.contains(c.AccountId)) {
    // If we have already processed this AccountId, it means we've already
    // kept the newest contact. This one is therefore an older duplicate.
    contactsToDelete.add(c);
    System.debug(
      'Marking for deletion (older contact): ' +
        c.Id +
        ' for Account: ' +
        c.AccountId
    );
  } else {
    // This is the first time we're seeing this AccountId in the loop.
    // Because of our sorting, this is the newest contact. We keep it.
    accountsProcessed.add(c.AccountId);
    System.debug(
      'Keeping (newest contact): ' + c.Id + ' for Account: ' + c.AccountId
    );
  }
}

// Step 4: Filter out any contacts from the deletion list that are associated with Cases.
List<Contact> finalContactsToDelete = new List<Contact>();
if (!contactsToDelete.isEmpty()) {
  Set<Id> contactsToDeleteIds = new Map<Id, SObject>(contactsToDelete).keySet();

  // Find which of these candidate contacts are linked to cases.
  Set<Id> contactsWithCases = new Set<Id>();
  for (Case cs : [
    SELECT ContactId
    FROM Case
    WHERE ContactId IN :contactsToDeleteIds
  ]) {
    contactsWithCases.add(cs.ContactId);
  }

  // Create the final list, excluding contacts linked to cases.
  for (Contact c : contactsToDelete) {
    if (!contactsWithCases.contains(c.Id)) {
      finalContactsToDelete.add(c);
    } else {
      System.debug(
        'Skipping deletion of Contact ' +
          c.Id +
          ' because it is associated with a Case.'
      );
    }
  }
}

// Step 5: Perform a single, bulk DML operation on the filtered list.
if (!finalContactsToDelete.isEmpty()) {
  try {
    delete finalContactsToDelete;
    System.debug(
      'Success: Deleted ' +
        finalContactsToDelete.size() +
        ' duplicate contact(s).'
    );
  } catch (DmlException e) {
    System.debug('An error occurred during deletion: ' + e.getMessage());
    // In a real-world scenario, you might add more robust error handling here.
  }
} else {
  System.debug(
    'No duplicate contacts were ultimately identified for deletion (or all were protected by cases).'
  );
}
