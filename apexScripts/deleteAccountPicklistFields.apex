MetadataService.MetadataPort service = createService();             

    // Read Custom Field
    MetadataService.CustomField customField = 
        (MetadataService.CustomField) service.readMetadata('CustomField', 
            new String[] { 'Lead.picklist__c' }).getRecords()[0];       

    // Add pick list values
    metadataservice.PicklistValue two = new metadataservice.PicklistValue();
    two.fullName= 'second';
    two.default_x=false;
    metadataservice.PicklistValue three = new metadataservice.PicklistValue();
    three.fullName= 'third';
    three.default_x=false;
    customField.picklist.picklistValues.add(two);
    customField.picklist.picklistValues.add(three);     

    // Update Custom Field
    handleSaveResults(
        service.updateMetadata(
            new MetadataService.Metadata[] { customField })[0]);        