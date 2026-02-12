// Check if the current user has access to Task and Event
Boolean hasTaskAccess = Schema.sObjectType.Task.isAccessible();
Boolean hasEventAccess = Schema.sObjectType.Event.isAccessible();

if (hasTaskAccess) {
    system.debug('User has access to Task object.');
} else {
    system.debug('User does not have access to Task object.');
}

if (hasEventAccess) {
    system.debug('User has access to Event object.');
} else {
    system.debug('User does not have access to Event object.');
}