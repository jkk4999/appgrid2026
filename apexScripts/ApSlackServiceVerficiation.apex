/**
 * Slack Configuration Verification Script
 *
 * Run this in Anonymous Apex (Developer Console or VS Code) to verify your Slack setup.
 * This will check all configuration steps and help identify what needs to be fixed.
 */

System.debug('========================================');
System.debug('SLACK CONFIGURATION VERIFICATION');
System.debug('========================================\n');

// Step 1: Check Custom Metadata Record
System.debug('Step 1: Checking Custom Metadata Record...');
try {
  AppGridAg__AppGrid_Slack_Config__mdt cfg = AppGridAg__AppGrid_Slack_Config__mdt.getInstance(
    'Default'
  );

  if (cfg == null) {
    System.debug('❌ ERROR: Custom Metadata record "Default" not found!');
    System.debug(
      '   Action: Create AppGridAg__AppGrid_Slack_Config__mdt record with DeveloperName = "Default"'
    );
  } else {
    System.debug('✅ Custom Metadata record "Default" exists');
    System.debug(
      '   Named Credential Name: ' + cfg.AppGridAg__Named_Credential_Name__c
    );
    System.debug('   Default Channel: ' + cfg.AppGridAg__Default_Channel__c);
    System.debug('   Is Active: ' + cfg.AppGridAg__Is_Active__c);

    if (String.isBlank(cfg.AppGridAg__Named_Credential_Name__c)) {
      System.debug('❌ ERROR: Named Credential Name is blank!');
      System.debug(
        '   Action: Set AppGridAg__Named_Credential_Name__c = "AppGridAg__AppGrid_Slack_Integration"'
      );
    } else if (
      cfg.AppGridAg__Named_Credential_Name__c !=
      'AppGridAg__AppGrid_Slack_Integration'
    ) {
      System.debug(
        '⚠️  WARNING: Named Credential Name does not match your existing Named Credential'
      );
      System.debug('   Expected: AppGridAg__AppGrid_Slack_Integration');
      System.debug('   Actual: ' + cfg.AppGridAg__Named_Credential_Name__c);
      System.debug(
        '   Action: Update the Custom Metadata field to match your Named Credential name'
      );
    } else {
      System.debug('✅ Named Credential Name is correctly configured');
    }

    if (cfg.AppGridAg__Is_Active__c != true) {
      System.debug('⚠️  WARNING: Configuration is not active');
      System.debug('   Action: Set AppGridAg__Is_Active__c = true');
    }
  }
} catch (Exception e) {
  System.debug('❌ ERROR reading Custom Metadata: ' + e.getMessage());
}

System.debug('\n========================================');
System.debug('Step 2: Checking AgSlackConfigUtil...');
try {
  AgSlackConfigUtil.SlackConfig config = AgSlackConfigUtil.getConfigStatic();
  System.debug('✅ AgSlackConfigUtil.getConfigStatic() successful');
  System.debug('   Named Credential: ' + config.namedCredentialName);
  System.debug('   Default Channel: ' + config.defaultChannel);
  System.debug('   Is Active: ' + config.isActive);
} catch (Exception e) {
  System.debug('❌ ERROR: ' + e.getMessage());
  System.debug(
    '   This usually means Custom Metadata is not properly configured'
  );
}

System.debug('\n========================================');
System.debug('Step 3: Testing Slack API Connection...');
try {
  String result = AgSlackService.authTest();
  System.debug('✅ SUCCESS! Slack API connection works!');
  System.debug('   Response: ' + result);

  // Parse the response to show key details
  Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(
    result
  );
  if (parsed.containsKey('ok') && parsed.get('ok') == true) {
    System.debug('\n   Workspace: ' + parsed.get('team'));
    System.debug('   Bot User: ' + parsed.get('user'));
    System.debug('   Team ID: ' + parsed.get('team_id'));
    System.debug('   User ID: ' + parsed.get('user_id'));
    if (parsed.containsKey('bot_id')) {
      System.debug('   Bot ID: ' + parsed.get('bot_id'));
    }
  }
} catch (Exception e) {
  System.debug('❌ ERROR: Slack API connection failed');
  System.debug('   Error Message: ' + e.getMessage());
  System.debug('\n   Common Causes:');
  System.debug(
    '   1. External Credential "Slack Auth" does not have a Principal configured'
  );
  System.debug(
    '   2. Principal does not have Authorization header with Bot Token'
  );
  System.debug('   3. Bot Token is invalid or expired');
  System.debug('   4. Named Credential is not properly configured');
  System.debug('\n   Next Steps:');
  System.debug(
    '   1. Go to Setup → Named Credentials → External Credentials → "Slack Auth"'
  );
  System.debug('   2. Check if a Principal exists');
  System.debug('   3. If no Principal exists, create one:');
  System.debug('      - Click New in the Principals section');
  System.debug('      - Set Principal Type = Named Principal');
  System.debug('      - Set Name = Default');
  System.debug(
    '      - Add Custom Header: Authorization = Bearer xoxb-your-bot-token'
  );
  System.debug('   4. Verify the Bot Token starts with "xoxb-"');
  System.debug('   5. Re-run this verification script');
}

System.debug('\n========================================');
System.debug('VERIFICATION COMPLETE');
System.debug('========================================');
