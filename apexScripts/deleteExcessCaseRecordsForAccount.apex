
       // Step 1: Query all Cases related to Accounts
       List<Case> casesToDelete = new List<Case>();
       
       // Query all Cases with AccountId, ensuring we get relevant fields for deletion logic
       List<Case> cases = [
           SELECT Id, AccountId
           FROM Case
           WHERE AccountId != NULL
       ];

       // Step 2: Group cases by AccountId
       Map<Id, List<Case>> accountCasesMap = new Map<Id, List<Case>>();
       
       for (Case c : cases) {
           if (!accountCasesMap.containsKey(c.AccountId)) {
               accountCasesMap.put(c.AccountId, new List<Case>());
           }
           accountCasesMap.get(c.AccountId).add(c);
       }

       // Step 3: Check each Account for multiple Cases and delete excess ones
       for (Id accountId : accountCasesMap.keySet()) {
           List<Case> accountCases = accountCasesMap.get(accountId);

           // If there are more than 1 Case for an Account, delete the excess
           if (accountCases.size() > 1) {
               // Remove the first Case from the list (keep it)
               accountCases.remove(0);
               
               // Add the remaining Cases to the list of ones to delete
               casesToDelete.addAll(accountCases);
           }
       }

       // Step 4: Delete the excess Cases
       if (!casesToDelete.isEmpty()) {
           delete casesToDelete;
           System.debug('Deleted ' + casesToDelete.size() + ' Cases.');
       } else {
           System.debug('No Cases to delete.');
       }
   

