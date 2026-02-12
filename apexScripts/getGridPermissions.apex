string apiPermissionString = AppGridAg.AppGridController.getGridPermissions();
system.debug('permissionString: ' + apiPermissionString);

// Safe deserialization
Object deserialized;
try {
  deserialized = JSON.deserializeUntyped(apiPermissionString);
} catch (JSONException e) {
  System.debug('JSON parsing error: ' + e.getMessage());
  throw new QueryException(
    'Invalid JSON format in permissions data: ' + e.getMessage()
  );
}

if (!(deserialized instanceof List<Object>)) {
  System.debug('Expected a List, but got: ' + deserialized);
  throw new QueryException(
    'Expected a List in permissions data, but got: ' + deserialized
  );
}

// Build the typed list
List<Map<String, Object>> permsList = new List<Map<String, Object>>();
for (Object item : (List<Object>) deserialized) {
  if (item instanceof Map<String, Object>) {
    permsList.add((Map<String, Object>) item);
  } else {
    System.debug('Unexpected item type: ' + item);
    throw new QueryException('Invalid map structure in permissions list');
  }
}

system.debug('permsList: ' + permsList);
