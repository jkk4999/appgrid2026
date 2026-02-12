
       // Step 1: Query all Contacts related to Accounts
       List<Contact> contactsToDelete = new List<Contact>();

       // Query all Contacts with AccountId, ensuring we get relevant fields for deletion logic
       List<Contact> contacts = [
           SELECT Id, AccountId
           FROM Contact
           WHERE AccountId != NULL
       ];

       // Step 2: Group contacts by AccountId
       Map<Id, List<Contact>> accountContactsMap = new Map<Id, List<Contact>>();
       
       for (Contact c : contacts) {
           if (!accountContactsMap.containsKey(c.AccountId)) {
               accountContactsMap.put(c.AccountId, new List<Contact>());
           }
           accountContactsMap.get(c.AccountId).add(c);
       }

       // Step 3: Check each Account for multiple Contacts and delete excess ones
       for (Id accountId : accountContactsMap.keySet()) {
           List<Contact> accountContacts = accountContactsMap.get(accountId);

           // If there are more than 2 Contacts for an Account, delete the excess
           if (accountContacts.size() > 2) {
               // Remove the first two Contacts from the list (keep them)
               accountContacts.remove(0);
               accountContacts.remove(0);

               // Add the remaining Contacts to the list of ones to delete
               contactsToDelete.addAll(accountContacts);
           }
       }

       // Step 4: Delete the excess Contacts
       if (!contactsToDelete.isEmpty()) {
           delete contactsToDelete;
           System.debug('Deleted ' + contactsToDelete.size() + ' Contacts.');
       } else {
           System.debug('No Contacts to delete.');
       }
