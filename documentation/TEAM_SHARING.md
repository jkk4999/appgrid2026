# Team View Sharing

This document describes the design and implementation of the Team View Sharing feature, which allows users to share grid views with other users in the organization.

## Table of Contents

1. [Overview](#overview)
2. [Feature Summary](#feature-summary)
3. [Data Model](#data-model)
4. [Sharing Workflow](#sharing-workflow)
5. [Import Workflow](#import-workflow)
6. [Update Synchronization](#update-synchronization)
7. [User Interface](#user-interface)
8. [API Reference](#api-reference)
9. [State Management](#state-management)
10. [Security Considerations](#security-considerations)
11. [Edge Cases](#edge-cases)

---

## Overview

Team View Sharing enables users to share their saved grid views with colleagues. This feature is inspired by AdaptableTools' Team Sharing functionality and provides a collaborative way to distribute standardized views across teams.

### Key Concepts

- **Source View**: The original view owned by the sharing user
- **Shared View Record**: A junction record (`AG_Shared_View__c`) that tracks who shared what with whom
- **Imported View**: A copy of the shared view in the recipient's view library
- **Version Tracking**: Mechanism to detect when source views have been updated

### Sharing Modes

Users can choose how imported views behave:

| Mode             | Description                                    | Use Case                              |
| ---------------- | ---------------------------------------------- | ------------------------------------- |
| **Keep in Sync** | Recipient can pull updates when source changes | Team standards that evolve over time  |
| **Snapshot**     | One-time copy with no future updates           | Personal customization starting point |

---

## Feature Summary

### What Gets Shared

When a view is shared, all of the following are included:

| Component          | Description                                 |
| ------------------ | ------------------------------------------- |
| Grid State         | Column order, widths, sorting, filtering    |
| Column State       | Visibility, pinning, grouping configuration |
| Calculated Columns | Formula columns defined in the view         |
| Column Styles      | Conditional formatting on columns           |
| Row Styles         | Conditional formatting on rows              |
| Filter Options     | Saved filter configurations                 |
| Pivot Mode         | Pivot mode settings and pivot columns       |
| Parent Fields      | Related object field selections             |

### What Is NOT Shared

| Item             | Reason                                      |
| ---------------- | ------------------------------------------- |
| Queries          | Out of scope for initial release            |
| User Preferences | Personal settings remain individual         |
| Data             | Only view configuration, not actual records |

### Restrictions

- Recipients **cannot re-share** views they have imported
- Sharing is limited to **individual users** (no groups/queues)
- Views are scoped to a **specific SObject** (e.g., Account views only shared with Account users)

### Permission Control

Team sharing is controlled by a grid permission setting:

| Permission              | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| **Enable Team Sharing** | Controls visibility of Share button, Shared With Me tab, and update notifications |

When **disabled**:

- Share button is hidden in Column Manager
- "Shared With Me" tab is not displayed
- No snackbar notifications for shared view updates
- Users cannot share views or see views shared with them

**System Administrator Override:**
Users with the "System Administrator" profile always have access to team sharing functionality, regardless of the permission setting. This ensures administrators can always manage and troubleshoot sharing across the organization.

---

## Data Model

### AG_Shared_View\_\_c (New Object)

Junction object that tracks sharing relationships.

```
┌─────────────────────────────────────────────────────────────────┐
│                      AG_Shared_View__c                          │
├─────────────────────────────────────────────────────────────────┤
│ Field                  │ Type              │ Description        │
├────────────────────────┼───────────────────┼────────────────────┤
│ Source_View__c         │ Lookup(AG_View__c)│ Original view      │
│ Shared_By__c           │ Lookup(User)      │ Who shared it      │
│ Shared_With__c         │ Lookup(User)      │ Recipient (or null)│
│ Share_Type__c          │ Picklist          │ Individual/All     │
│ Version__c             │ Number(18,0)      │ Change counter     │
│ Shared_Date__c         │ DateTime          │ When shared        │
│ Is_Active__c           │ Checkbox          │ Active flag        │
└─────────────────────────────────────────────────────────────────┘
```

**Share_Type\_\_c Values:**

- `Individual` - Shared with specific user (Shared_With\_\_c populated)
- `All Users` - Shared with everyone (Shared_With\_\_c is null)

### AG_View\_\_c (Updated Object)

New fields added to existing view object.

```
┌─────────────────────────────────────────────────────────────────┐
│                    AG_View__c (New Fields)                      │
├─────────────────────────────────────────────────────────────────┤
│ Field                    │ Type                   │ Description │
├──────────────────────────┼────────────────────────┼─────────────┤
│ Source_Shared_View__c    │ Lookup(AG_Shared_View) │ Import link │
│ Imported_Version__c      │ Number(18,0)           │ Version     │
│ Is_Shared__c             │ Checkbox               │ Has shares  │
│ Sync_Mode__c             │ Picklist               │ Sync/Snap   │
└─────────────────────────────────────────────────────────────────┘
```

**Sync_Mode\_\_c Values:**

- `Sync` - Keep in sync with source view
- `Snapshot` - One-time copy, no updates

### Entity Relationship Diagram

```
┌──────────────┐         ┌───────────────────┐         ┌──────────────┐
│    User      │         │  AG_Shared_View   │         │   AG_View    │
│  (Sharer)    │         │                   │         │   (Source)   │
└──────┬───────┘         └─────────┬─────────┘         └──────┬───────┘
       │                           │                          │
       │    Shared_By__c           │    Source_View__c        │
       └──────────────────────────►│◄─────────────────────────┘
                                   │
       ┌──────────────────────────►│
       │    Shared_With__c         │
┌──────┴───────┐                   │
│    User      │                   │
│ (Recipient)  │                   │
└──────────────┘                   │
                                   │
                                   ▼
                          ┌──────────────────┐
                          │    AG_View       │
                          │   (Imported)     │
                          │                  │
                          │ Source_Shared_   │
                          │ View__c ─────────┘
                          │
                          │ Imported_
                          │ Version__c
                          │
                          │ Sync_Mode__c
                          └──────────────────┘
```

---

## Sharing Workflow

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     SHARE VIEW WORKFLOW                         │
└─────────────────────────────────────────────────────────────────┘

User clicks "Share" button in Column Manager
                    │
                    ▼
         ┌──────────────────┐
         │  Share Dialog    │
         │  Opens           │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Load Users &    │
         │  Current Shares  │
         └────────┬─────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
    ▼                           ▼
┌────────────┐          ┌────────────────┐
│ Select     │          │ Check "Share   │
│ Individual │          │ with all       │
│ Users      │          │ users"         │
└─────┬──────┘          └───────┬────────┘
      │                         │
      └────────────┬────────────┘
                   │
                   ▼
         ┌──────────────────┐
         │  Click "Share"   │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Create/Update   │
         │  AG_Shared_View  │
         │  Records         │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Set Is_Shared   │
         │  = true on view  │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Show Success    │
         │  Snackbar        │
         └──────────────────┘
```

### Sharing Rules

1. **Ownership Validation**: Only the view owner can share their view
2. **Duplicate Prevention**: Cannot share the same view with the same user twice
3. **Self-Sharing**: Cannot share a view with yourself
4. **Imported Views**: Cannot share a view that was imported from someone else

### Revoking Shares

When a user unchecks a previously shared user:

1. The `AG_Shared_View__c` record's `Is_Active__c` is set to `false`
2. Existing imported copies remain functional but lose update capability
3. The imported view shows "Source no longer shared" status

---

## Import Workflow

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPORT VIEW WORKFLOW                         │
└─────────────────────────────────────────────────────────────────┘

User opens "Shared With Me" tab in Column Manager
                    │
                    ▼
         ┌──────────────────┐
         │  Load Shared     │
         │  Views List      │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Display Grid    │
         │  with Status     │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  User clicks     │
         │  [Import]        │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Import Dialog   │
         │  Opens           │
         └────────┬─────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
    ▼                           ▼
┌────────────┐          ┌────────────────┐
│ Enter view │          │ Select sync    │
│ name       │          │ preference     │
└─────┬──────┘          └───────┬────────┘
      │                         │
      └────────────┬────────────┘
                   │
                   ▼
         ┌──────────────────┐
         │  Click "Import"  │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Clone AG_View   │
         │  with new owner  │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Set metadata:   │
         │  - Source link   │
         │  - Version       │
         │  - Sync mode     │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Auto-select     │
         │  imported view   │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Show Success    │
         │  Snackbar        │
         └──────────────────┘
```

### Import Details

When a view is imported:

1. **New AG_View\_\_c Created**: Full copy of source view with recipient as owner
2. **Metadata Set**:
   - `Source_Shared_View__c` = The sharing record ID
   - `Imported_Version__c` = Current `Version__c` from sharing record
   - `Sync_Mode__c` = User's selected preference
3. **Auto-Selection**: The imported view becomes the active view
4. **Name Handling**: Default name is source view name; user can customize

---

## Update Synchronization

### Version Tracking

```
┌─────────────────────────────────────────────────────────────────┐
│                    VERSION TRACKING FLOW                        │
└─────────────────────────────────────────────────────────────────┘

Owner saves changes to shared view
                    │
                    ▼
         ┌──────────────────┐
         │  View upsert     │
         │  completes       │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Check if view   │
         │  Is_Shared__c    │
         └────────┬─────────┘
                  │
          Yes ────┴
                  │
                  ▼
         ┌──────────────────┐
         │  Increment       │
         │  Version__c on   │
         │  all shares      │
         └────────┬─────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              RECIPIENT LOADS GRID LATER                         │
└─────────────────────────────────────────────────────────────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Fetch shared    │
         │  views           │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Compare:        │
         │  Share.Version   │
         │  vs              │
         │  View.Imported_  │
         │  Version         │
         └────────┬─────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
    ▼                           ▼
┌────────────┐          ┌────────────────┐
│ Versions   │          │ Share version  │
│ match      │          │ is higher      │
│            │          │                │
│ Status:    │          │ Status:        │
│ "Imported" │          │ "Update        │
│            │          │  Available"    │
└────────────┘          └───────┬────────┘
                                │
                                ▼
                        ┌────────────────┐
                        │ Show persist   │
                        │ snackbar       │
                        │ notification   │
                        └────────────────┘
```

### Update Detection Logic

```typescript
// Pseudocode for update detection
const hasUpdate = (sharedView: SharedViewDTO, importedView: SObjectView) => {
  // Only check for Sync mode views
  if (importedView.syncMode === 'Snapshot') {
    return false;
  }

  // Compare versions
  return sharedView.version > (importedView.importedVersion ?? 0);
};
```

### Pulling Updates

When user clicks "Update":

1. Fetch latest source view data via `Source_Shared_View__c.Source_View__c`
2. Copy all view fields to the imported view
3. Update `Imported_Version__c` to match current `Version__c`
4. Refresh the grid if the updated view is currently active

---

## User Interface

### Column Manager Integration

```
┌─────────────────────────────────────────────────────────────────┐
│  Column Manager                                    [Share] [X]  │
├─────────────────────────────────────────────────────────────────┤
│  [Columns]  [Parent Fields]  [Shared With Me]                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  (Tab content based on selection)                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Share Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│  Share View: "My Sales Pipeline View"                      [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │ Filter by profile  [▼]  │  │ Search users...        [▼]  │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
│                                                                 │
│  [ ] Share with all users                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑ │ Name              │ Email              │ Profile    │   │
│  ├───┼───────────────────┼────────────────────┼────────────┤   │
│  │ ☑ │ John Smith        │ john@company.com   │ Sales User │   │
│  │ ☐ │ Jane Doe          │ jane@company.com   │ Marketing  │   │
│  │ ☑ │ Bob Wilson        │ bob@company.com    │ Sales User │   │
│  │ ☐ │ Alice Chen        │ alice@company.com  │ Sales User │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Currently shared with: 2 users                                 │
│                                                                 │
│                              [Cancel]  [Share]                  │
└─────────────────────────────────────────────────────────────────┘
```

**Components:**

- MUI Autocomplete for **profile filter** (filters grid to show only users of selected profile)
- MUI Autocomplete for **user search** (filters grid by name as you type)
- AG Grid with checkbox selection for users
- Checkbox for "Share with all users" (disables grid when checked)
- Share button triggers API call

**Profile Filter Behavior:**

- Populated via existing `getAllProfiles()` Apex method
- Selecting a profile filters the user grid to only show users with that profile
- Can be combined with user search for further filtering
- Clearing the profile filter shows all users again

### Shared With Me Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  Shared With Me                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Filter by user...                                  [▼]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ View Name        │ Shared By    │ Date     │ Status    │   │
│  ├──────────────────┼──────────────┼──────────┼───────────┤   │
│  │ Sales Pipeline   │ John Smith   │ Jan 15   │ [Import]  │   │
│  │ Q4 Forecast      │ Jane Doe     │ Jan 12   │ Imported  │   │
│  │ Territory View   │ John Smith   │ Jan 10   │ [Update]  │   │
│  │ Executive Sum... │ Bob Wilson   │ Jan 8    │ [Import]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Status Column Rendering:**

| Status             | Display                             | Action              |
| ------------------ | ----------------------------------- | ------------------- |
| Not imported       | `[Import]` button                   | Opens Import Dialog |
| Imported (current) | "Imported" with checkmark           | None                |
| Update available   | `[Update]` button with warning icon | Triggers update     |
| Source deleted     | "Source unavailable" (disabled)     | None                |

### Import Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│  Import View: "Sales Pipeline"                             [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Shared by: John Smith                                          │
│  Shared on: January 15, 2026                                    │
│                                                                 │
│  View name in your library:                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Sales Pipeline                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Sync preference:                                               │
│  ● Keep in sync - Receive updates when the owner modifies      │
│  ○ Snapshot - One-time copy, no future updates                 │
│                                                                 │
│                              [Cancel]  [Import]                 │
└─────────────────────────────────────────────────────────────────┘
```

### Notifications

**On Grid Load (if updates available):**

```
┌─────────────────────────────────────────────────────────────────┐
│  ℹ️  2 shared view(s) have updates available    [View] [Dismiss]│
└─────────────────────────────────────────────────────────────────┘
```

- Uses `enqueueSnackbar` with `persist: true`
- "View" button opens Column Manager to Shared With Me tab
- "Dismiss" closes the notification
- **Single notification**: Only one snackbar appears regardless of how many shared views have updates (displays count in message)
- **Permission controlled**: Notification only appears if "Enable Team Sharing" permission is enabled

---

## API Reference

### Apex Methods

#### getSharedViews

Retrieves views shared with the current user.

```apex
@AuraEnabled(cacheable=false)
public static List<AgSharedViewDTO> getSharedViews(Map<String, Object> params)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| sObjectName | String | API name of the object |

**Returns:** `List<AgSharedViewDTO>` - Shared views with status

**Query Logic:**

```sql
SELECT Id, Source_View__c, Source_View__r.Name, Shared_By__c,
       Shared_By__r.Name, Version__c, Shared_Date__c
FROM AG_Shared_View__c
WHERE (Shared_With__c = :currentUserId OR Share_Type__c = 'All Users')
  AND Is_Active__c = true
  AND Source_View__r.SObjectApiName__c = :sObjectName
```

---

#### shareView

Shares a view with specified users.

```apex
@AuraEnabled
public static Map<String, Object> shareView(Map<String, Object> params)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| viewId | String | ID of view to share |
| userIds | List<String> | User IDs to share with |
| shareWithAll | Boolean | Share with all users |

**Returns:** `{ status: 'success' | 'error', errorMessage?: String }`

---

#### unshareView

Removes sharing from specified users.

```apex
@AuraEnabled
public static Map<String, Object> unshareView(Map<String, Object> params)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| viewId | String | ID of view |
| userIds | List<String> | Users to unshare (optional) |

**Returns:** `{ status: 'success' | 'error', errorMessage?: String }`

---

#### getViewShareRecipients

Gets list of users a view is currently shared with.

```apex
@AuraEnabled(cacheable=false)
public static List<AgSharedViewDTO> getViewShareRecipients(Map<String, Object> params)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| viewId | String | ID of the view |

**Returns:** `List<AgSharedViewDTO>` - Current share recipients

---

#### importSharedView

Creates a copy of a shared view for the current user.

```apex
@AuraEnabled
public static Map<String, Object> importSharedView(Map<String, Object> params)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| sharedViewId | String | AG_Shared_View\_\_c ID |
| viewName | String | Name for imported view |
| syncMode | String | 'Sync' or 'Snapshot' |

**Returns:** `{ status: 'success' | 'error', view?: AgObjViewDTO, errorMessage?: String }`

---

#### updateImportedView

Pulls latest changes from source view.

```apex
@AuraEnabled
public static Map<String, Object> updateImportedView(Map<String, Object> params)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| viewId | String | Imported view ID |

**Returns:** `{ status: 'success' | 'error', view?: AgObjViewDTO, errorMessage?: String }`

---

#### incrementShareVersion

Increments version on all shares when source view is saved.

```apex
@AuraEnabled
public static void incrementShareVersion(Map<String, Object> params)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| viewId | String | Source view ID |

**Called automatically** when a shared view is saved.

---

### TypeScript Interfaces

```typescript
// Shared view data transfer object
export interface SharedViewDTO {
  id: string;
  sourceViewId: string;
  sourceViewName: string;
  sharedById: string;
  sharedByName: string;
  sharedWithId: string | null;
  sharedWithName: string | null;
  shareType: 'Individual' | 'All Users';
  version: number;
  sharedDate: string;
  isActive: boolean;
  hasUpdate: boolean;
  importedVersion: number | null;
  importedViewId: string | null;
  // Source view data (for import)
  gridState?: string;
  columnState?: string;
  calculatedColumns?: string;
  columnStyles?: string;
  rowStyles?: string;
  sObjectApiName?: string;
}

// Parameters for sharing
export interface ShareViewParams {
  viewId: string;
  userIds: string[];
  shareWithAll: boolean;
}

// Parameters for import
export interface SharedViewImportParams {
  sharedViewId: string;
  viewName: string;
  syncMode: 'Sync' | 'Snapshot';
}
```

---

## State Management

### View Sharing Slice

New Zustand slice for managing sharing state.

```typescript
interface ViewSharingState {
  // Shared with me
  sharedWithMeViews: SharedViewDTO[];
  sharedWithMeLoading: boolean;

  // Share dialog
  showShareViewDialog: boolean;
  shareDialogViewId: string | null;
  shareDialogRecipients: SharedViewDTO[];

  // Import dialog
  showImportViewDialog: boolean;
  importDialogSharedView: SharedViewDTO | null;

  // Notifications
  pendingViewUpdates: SharedViewDTO[];

  // Filters
  sharedByUserFilter: string | null;
}
```

### State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      State Flow Diagram                         │
└─────────────────────────────────────────────────────────────────┘

Grid Loads
    │
    ▼
┌──────────────────┐
│ loadSharedViews  │──────────► sharedWithMeViews
└──────────────────┘                    │
                                        │
                                        ▼
                               ┌──────────────────┐
                               │ Check for        │
                               │ updates          │
                               └────────┬─────────┘
                                        │
                                        ▼
                               pendingViewUpdates
                                        │
                                        ▼
                               ┌──────────────────┐
                               │ Show snackbar    │
                               │ if updates exist │
                               └──────────────────┘

User clicks Share
    │
    ▼
┌──────────────────┐
│ setShowShare     │
│ ViewDialog(true) │
└──────────────────┘
    │
    ▼
┌──────────────────┐
│ Load recipients  │──────────► shareDialogRecipients
└──────────────────┘

User clicks Import
    │
    ▼
┌──────────────────┐
│ setShowImport    │
│ ViewDialog(true) │
└──────────────────┘
    │
    ▼
importDialogSharedView
```

---

## Security Considerations

### Grid Permission

The "Enable Team Sharing" permission controls access to all sharing functionality:

```typescript
// Check permission before rendering sharing UI
const { enableTeamSharing } = usePermissionState();
const { userProfile } = useUserState();

// System Administrator always has access
const isSystemAdmin = userProfile?.name === 'System Administrator';
const canAccessTeamSharing = enableTeamSharing || isSystemAdmin;

if (!canAccessTeamSharing) {
  // Hide Share button
  // Hide "Shared With Me" tab
  // Skip loading shared views
  // Skip update notifications
}
```

This permission is managed through the existing grid permissions system (AG_Grid_Permission\_\_c or similar).

**System Administrator Override:** Users with the "System Administrator" profile bypass the permission check and always have full access to team sharing functionality.

### Permission Checks

All Apex methods enforce:

1. **Grid Permission**: "Enable Team Sharing" must be enabled for the user
2. **CRUD Permissions**: User must have Create/Read/Update/Delete on relevant objects
3. **FLS (Field-Level Security)**: Field access validated before read/write
4. **Ownership Validation**: Only view owner can share their views
5. **Record Access**: Users can only see shares intended for them

### Sharing Model

- `AG_Shared_View__c` uses **Private** OWD with sharing rules
- `AG_View__c` remains **Private** (user owns their views)
- Sharing junction records controlled by Apex (not Salesforce sharing)

### Data Protection

- View data is copied, not referenced (imported views are independent)
- Revoking share doesn't delete recipient's imported copy
- Source view deletion leaves imported views functional but unlinked

---

## Edge Cases

### Scenario Handling

| Scenario                                             | Behavior                                                |
| ---------------------------------------------------- | ------------------------------------------------------- |
| Owner deletes source view                            | Imported views remain; show "Source unavailable" status |
| Owner deactivates sharing                            | Imported views remain; no more updates available        |
| Recipient already has view with same name            | Append " (from [Owner])" or prompt for rename           |
| User tries to share imported view                    | Block with error: "Cannot share imported views"         |
| User shares view then imports another with same name | Allow both (different IDs)                              |
| Network error during import                          | Show error snackbar, no partial state                   |
| User imports then owner updates then user updates    | User's customizations replaced with source              |

### Conflict Resolution

Since updates are user-initiated (not automatic):

1. User sees "Update Available" indicator
2. User decides whether to pull update
3. If they pull, their local customizations are replaced
4. If they want to keep customizations, they can choose not to update

This gives users control over when changes are applied.

---

## File Structure

```
react/
├── src/
│   ├── components/
│   │   └── viewSharing/
│   │       ├── ShareViewDialog.tsx      # Share dialog component
│   │       ├── SharedWithMeTab.tsx      # Shared views tab content
│   │       ├── ImportViewDialog.tsx     # Import dialog component
│   │       └── index.ts                 # Exports
│   ├── hooks/
│   │   └── useViewSharing.ts            # Sharing operations hook
│   ├── store/
│   │   └── slices/
│   │       └── viewSharingSlice.ts      # Zustand slice
│   └── sObjectMetadataTypes.ts          # Updated interfaces

force-app/
└── main/
    └── default/
        ├── classes/
        │   ├── AgSharedViewDTO.cls      # New DTO
        │   └── AppGridController.cls    # New methods
        └── objects/
            ├── AG_Shared_View__c/       # New object
            │   ├── AG_Shared_View__c.object-meta.xml
            │   └── fields/
            └── AG_View__c/
                └── fields/              # New fields
```

---

## Future Enhancements (Out of Scope)

The following are explicitly not included in this implementation:

1. **Query Sharing** - Sharing saved queries/filters
2. **Re-sharing** - Allowing recipients to share imported views
3. **Group Sharing** - Sharing with Salesforce Groups or Queues
4. **Audit Trail** - Tracking share/import/update history
5. **Permissions** - Granular read-only vs edit access on shared views
6. **Comments** - Adding notes or descriptions to shares
7. **Notifications** - Email or in-app notifications beyond snackbar

These may be considered for future releases based on user feedback.
