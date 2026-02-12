// ----------------------------------
// Query last 180 Accounts by Name
// ----------------------------------
List<Account> accounts = [
  SELECT Id, Name, (SELECT Id FROM Tasks), (SELECT Id FROM Events)
  FROM Account
  ORDER BY Name DESC
  LIMIT 225
];

// ----------------------------------
// Collect Tasks & Events
// ----------------------------------
List<Task> tasksToDelete = new List<Task>();
List<Event> eventsToDelete = new List<Event>();

for (Account acct : accounts) {
  if (!acct.Tasks.isEmpty()) {
    tasksToDelete.addAll(acct.Tasks);
  }
  if (!acct.Events.isEmpty()) {
    eventsToDelete.addAll(acct.Events);
  }
}

// ----------------------------------
// Delete Tasks (partial success)
// ----------------------------------
if (!tasksToDelete.isEmpty()) {
  Database.DeleteResult[] taskResults = Database.delete(tasksToDelete, false);

  for (Integer i = 0; i < taskResults.size(); i++) {
    if (!taskResults[i].isSuccess()) {
      for (Database.Error err : taskResults[i].getErrors()) {
        System.debug(
          'Failed to delete Task ' +
            tasksToDelete[i].Id +
            ' | ' +
            err.getStatusCode() +
            ' | ' +
            err.getMessage()
        );
      }
    }
  }
}

// ----------------------------------
// Delete Events (partial success)
// ----------------------------------
if (!eventsToDelete.isEmpty()) {
  Database.DeleteResult[] eventResults = Database.delete(eventsToDelete, false);

  for (Integer i = 0; i < eventResults.size(); i++) {
    if (!eventResults[i].isSuccess()) {
      for (Database.Error err : eventResults[i].getErrors()) {
        System.debug(
          'Failed to delete Event ' +
            eventsToDelete[i].Id +
            ' | ' +
            err.getStatusCode() +
            ' | ' +
            err.getMessage()
        );
      }
    }
  }
}

// ----------------------------------
// Summary
// ----------------------------------
System.debug('Accounts processed: ' + accounts.size());
System.debug('Tasks attempted delete: ' + tasksToDelete.size());
System.debug('Events attempted delete: ' + eventsToDelete.size());
