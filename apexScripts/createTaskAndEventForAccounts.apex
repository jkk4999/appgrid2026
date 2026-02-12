// ----------------------------------
// Helper: random picklist value
// ----------------------------------
String getRandomPicklistValue(Schema.DescribeFieldResult fieldDesc) {
  List<Schema.PicklistEntry> values = fieldDesc.getPicklistValues();
  if (values.isEmpty())
    return null;

  Integer idx = Math.mod(Math.abs(Crypto.getRandomInteger()), values.size());
  return values[idx].getValue();
}

// ----------------------------------
// Describe metadata
// ----------------------------------
Schema.DescribeFieldResult taskStatusDesc = Task.Status.getDescribe();
Schema.DescribeFieldResult taskPriorityDesc = Task.Priority.getDescribe();
Schema.DescribeFieldResult taskTypeDesc = Task.Type.getDescribe();

Schema.DescribeFieldResult eventTypeDesc = Event.Type.getDescribe();
Schema.DescribeFieldResult eventShowAsDesc = Event.ShowAs.getDescribe();

// ----------------------------------
// Query Accounts WITH existing activity info
// ----------------------------------
List<Account> accounts = [
  SELECT
    Id,
    Name,
    (SELECT Id FROM Tasks LIMIT 1),
    (SELECT Id FROM Events LIMIT 1)
  FROM Account
];

// ----------------------------------
// Build Tasks & Events
// ----------------------------------
List<Task> tasksToInsert = new List<Task>();
List<Event> eventsToInsert = new List<Event>();

for (Account acct : accounts) {
  Boolean hasTask = !acct.Tasks.isEmpty();
  Boolean hasEvent = !acct.Events.isEmpty();

  // Skip if account already has BOTH
  if (hasTask && hasEvent) {
    continue;
  }

  // -----------------
  // Task
  // -----------------
  if (!hasTask) {
    Task t = new Task();
    t.WhatId = acct.Id;
    t.Subject = 'Auto Task for ' + acct.Name;

    t.ActivityDate = Date.today()
      .addDays(Math.mod(Math.abs(Crypto.getRandomInteger()), 30));

    t.Status = getRandomPicklistValue(taskStatusDesc);
    t.Priority = getRandomPicklistValue(taskPriorityDesc);
    t.Type = getRandomPicklistValue(taskTypeDesc);

    tasksToInsert.add(t);
  }

  // -----------------
  // Event
  // -----------------
  if (!hasEvent) {
    Event e = new Event();
    e.WhatId = acct.Id;
    e.Subject = 'Auto Event for ' + acct.Name;

    DateTime start = DateTime.now()
      .addDays(Math.mod(Math.abs(Crypto.getRandomInteger()), 30));
    e.StartDateTime = start;
    e.EndDateTime = start.addHours(1);

    e.Type = getRandomPicklistValue(eventTypeDesc);
    e.ShowAs = getRandomPicklistValue(eventShowAsDesc);

    eventsToInsert.add(e);
  }
}

// ----------------------------------
// Insert (partial success)
// ----------------------------------
if (!tasksToInsert.isEmpty()) {
  Database.insert(tasksToInsert, false);
}

if (!eventsToInsert.isEmpty()) {
  Database.insert(eventsToInsert, false);
}

System.debug('Tasks created: ' + tasksToInsert.size());
System.debug('Events created: ' + eventsToInsert.size());
