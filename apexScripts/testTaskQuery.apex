List<Task> tasks = [
  SELECT Id, WhoId, Who.Name
  //  TYPEOF What
  //    WHEN Account THEN Name
  //    WHEN Opportunity THEN Id
  //  END
  FROM Task
];

system.debug(tasks);
