// Get the picklist values for the 'Type' field using DescribeFieldResult
List<Schema.PicklistEntry> typePicklistValues = 
    Schema.SObjectType.Account.fields.getMap().get('Type').getDescribe().getPicklistValues();

// Get the picklist values for the 'Ownership' field
List<Schema.PicklistEntry> ownershipPicklistValues = 
    Schema.SObjectType.Account.fields.getMap().get('Ownership').getDescribe().getPicklistValues();

// Get the picklist values for the 'AccountSource' field
List<Schema.PicklistEntry> accountSourcePicklistValues = 
    Schema.SObjectType.Account.fields.getMap().get('AccountSource').getDescribe().getPicklistValues();

// Collect active picklist values for 'Type'
List<String> activeTypeValues = new List<String>();
for (Schema.PicklistEntry entry : typePicklistValues) {
    if (entry.isActive()) {
        activeTypeValues.add(entry.getValue());
    }
}

// Collect active picklist values for 'Ownership'
List<String> activeOwnershipValues = new List<String>();
for (Schema.PicklistEntry entry : ownershipPicklistValues) {
    if (entry.isActive()) {
        activeOwnershipValues.add(entry.getValue());
    }
}

// Collect active picklist values for 'AccountSource'
List<String> activeAccountSourceValues = new List<String>();
for (Schema.PicklistEntry entry : accountSourcePicklistValues) {
    if (entry.isActive()) {
        activeAccountSourceValues.add(entry.getValue());
    }
}

// Ensure there are active picklist values for each field
if (activeTypeValues.isEmpty()) {
    throw new DmlException('No active picklist values available for the Type field.');
}
if (activeOwnershipValues.isEmpty()) {
    throw new DmlException('No active picklist values available for the Ownership field.');
}
if (activeAccountSourceValues.isEmpty()) {
    throw new DmlException('No active picklist values available for the AccountSource field.');
}

// Query all Account records
List<Account> accounts = [SELECT Id FROM Account];

// Assign a random Type, Ownership, and AccountSource to each Account
for (Account acc : accounts) {
    // Generate a non-negative random index for Type, Ownership, and AccountSource using Math.abs and Math.mod
    Integer randomTypeIndex = Math.mod(Math.abs(Crypto.getRandomInteger()), activeTypeValues.size());
    Integer randomOwnershipIndex = Math.mod(Math.abs(Crypto.getRandomInteger()), activeOwnershipValues.size());
    Integer randomAccountSourceIndex = Math.mod(Math.abs(Crypto.getRandomInteger()), activeAccountSourceValues.size());

    acc.Type = activeTypeValues[randomTypeIndex];
    acc.Ownership = activeOwnershipValues[randomOwnershipIndex];
    acc.AccountSource = activeAccountSourceValues[randomAccountSourceIndex];
}

// Update the accounts in bulk
if (!accounts.isEmpty()) {
    update accounts;
    System.debug('Updated ' + accounts.size() + ' Account records with random Type, Ownership, and AccountSource values.');
} else {
    System.debug('No Account records found to update.');
}
