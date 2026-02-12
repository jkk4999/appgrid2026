AgWrapperObjectPermissions apiResponse = AppGridAg.AppGridController.getObjPermissions(
  'dummyArg'
);

// system.debug(apiResponse);

// Create a map to store permissions by objectName
Map<String, ObjectPermissionInfo> permMap = new Map<String, ObjectPermissionInfo>();

for (ObjectPermissionInfo perm : apiResponse.objectPermissions) {
  permMap.put(perm.sObjectType, perm);
}

// Sort object names alphabetically
List<String> sortedNames = new List<String>(permMap.keySet());
sortedNames.sort();

// Print sorted permissions
// + ' => ' + permMap.get(name)

for (String name : sortedNames) {
  System.debug(permMap.get(name).sObjectType);
}
