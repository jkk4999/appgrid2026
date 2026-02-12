List<Task> tasks = [
  SELECT Id, Name
  FROM Account
  WHERE
    AccountSource = 'Web'
    AND Id IN (SELECT WhatId FROM Task WHERE Status = 'Deferred')
  LIMIT 10
];

system.debug(tasks);
