# Lightning Message Service (LMS) Integration

This document describes the architecture for external LWC components to communicate with the AppGrid React application via Lightning Message Service.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Salesforce Lightning Page                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐         LMS Channel         ┌──────────────────┐  │
│  │   External LWC       │    (AppGridChannel__c)      │   AppGridLwcGA   │  │
│  │   Component          │ ──────────────────────────► │   (Host LWC)     │  │
│  │                      │   publish(action, payload)  │                  │  │
│  │                      │ ◄────────────────────────── │                  │  │
│  │                      │   publish(response)         │                  │  │
│  └──────────────────────┘                             └────────┬─────────┘  │
│                                                                 │            │
│                                                                 │            │
│                                                                 ▼            │
│                                                        ┌──────────────────┐  │
│                                                        │   React App      │  │
│                                                        │   (AppWrapper)   │  │
│                                                        │                  │  │
│                                                        │ handleLmsAction()│  │
│                                                        │        │         │  │
│                                                        │        ▼         │  │
│                                                        │   PubSub.publish │  │
│                                                        │   (LMS_* topics) │  │
│                                                        └──────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Message Flow

1. **External LWC** publishes a message to `AppGridChannel__c` with an `action`, `payload`, and optional `requestId`
2. **AppGridLwcGA** (the host LWC) receives the message via its LMS subscription
3. **AppGridLwcGA** forwards the message to the React app via `reactAppInstance.handleLmsAction()`
4. **React AppWrapper** maps the action to an LMS topic and publishes via PubSub
5. **LMS Handler** (useEffect subscriber) processes the action and resolves the Promise with a response
6. If a `requestId` was provided, **AppGridLwcGA** publishes a response back on the same channel

## Internal PubSub Architecture

All LMS actions use a standardized PubSub pattern within React for consistency:

```
handleLmsAction(action, payload)
        │
        ▼
  actionToTopic mapping
        │
        ▼
  PubSub.publish(TOPICS.LMS_*, { payload, resolve })
        │
        ▼
  useEffect handler subscribes to topic
        │
        ▼
  Handler processes action and calls resolve(response)
```

### LMS Topics (defined in `events/topics.ts`)

| Topic                  | Action            | Description                     |
| ---------------------- | ----------------- | ------------------------------- |
| `LMS_GET_CAPABILITIES` | `getCapabilities` | Returns available API actions   |
| `LMS_SELECT_OBJECT`    | `selectObject`    | Selects a Salesforce object     |
| `LMS_GET_VIEWS`        | `getViews`        | Retrieves views for an object   |
| `LMS_GET_QUERIES`      | `getQueries`      | Retrieves queries for an object |
| `LMS_SELECT_VIEW`      | `selectView`      | Selects a saved view            |
| `LMS_EXECUTE_QUERY`    | `executeQuery`    | Runs the current query          |

## Message Channel Schema

The `AppGridChannel__c` message channel has three fields:

| Field       | Type   | Description                                                                                   |
| ----------- | ------ | --------------------------------------------------------------------------------------------- |
| `action`    | String | The action to perform (e.g., `selectObject`, `selectView`, `executeQuery`, `getCapabilities`) |
| `payload`   | Object | JSON payload containing action parameters                                                     |
| `requestId` | String | Optional unique ID for request/response correlation                                           |

## Available Actions

### 1. getCapabilities

Returns the available API actions and their parameter schemas. Use this for runtime API discovery.

**Parameters:** None

**Response:**

```javascript
{
  success: true,
  data: {
    capabilities: {
      getCapabilities: {
        description: "Returns available API actions and their parameter schemas",
        params: null
      },
      selectObject: {
        description: "Select a Salesforce object to display in the grid",
        params: {
          apiName: {
            type: "string",
            required: true,
            description: "SObject API name (e.g., Account, Contact, Opportunity)"
          }
        }
      },
      selectView: {
        description: "Select a saved view for the current object",
        params: {
          viewId: {
            type: "string",
            required: false,
            description: "View record ID (18-character Salesforce ID)"
          },
          viewName: {
            type: "string",
            required: false,
            description: "View name (used if viewId not provided)"
          }
        }
      },
      executeQuery: {
        description: "Execute the current query and refresh grid data",
        params: null
      },
      getViews: {
        description: "Retrieve available views for a Salesforce object",
        params: {
          sObjectName: {
            type: "string",
            required: true,
            description: "SObject API name (e.g., Account, Contact, Opportunity)"
          },
          isSubgridView: {
            type: "boolean",
            required: false,
            description: "Whether to retrieve subgrid views (default: false)"
          }
        }
      },
      getQueries: {
        description: "Retrieve saved queries for a Salesforce object",
        params: {
          sObjectName: {
            type: "string",
            required: true,
            description: "SObject API name (e.g., Account, Contact, Opportunity)"
          }
        }
      }
    }
  }
}
```

### 2. selectObject

Selects a Salesforce object to display in the grid. This triggers the same behavior as selecting an object from the Object Selector dropdown.

**Parameters:**

| Parameter | Type   | Required | Description                                                             |
| --------- | ------ | -------- | ----------------------------------------------------------------------- |
| `apiName` | String | Yes      | The API name of the SObject (e.g., `Account`, `Contact`, `Opportunity`) |

**Success Response:**

```javascript
{
  success: true,
  data: {
    selectedObject: {
      name: "Account",
      label: "Account",
      // ... other object metadata
    }
  }
}
```

**Error Responses:**

```javascript
// Missing parameter
{ success: false, error: "apiName parameter is required" }

// Object not found
{ success: false, error: "Object \"InvalidObject\" not found in available objects" }
```

### 3. selectView

Selects a saved view for the currently selected object. This triggers the same behavior as selecting an view from the View Selector dropdown. You can specify either `viewId` or `viewName`.

**Parameters:**

| Parameter  | Type   | Required | Description                                       |
| ---------- | ------ | -------- | ------------------------------------------------- |
| `viewId`   | String | No\*     | The 18-character Salesforce record ID of the view |
| `viewName` | String | No\*     | The name of the view                              |

\*At least one of `viewId` or `viewName` must be provided.

**Success Response:**

```javascript
{
  success: true,
  data: {
    selectedView: {
      id: "a0B5e00000XXXXXXAAA",
      name: "My Custom View",
      // ... other view properties
    }
  }
}
```

**Error Responses:**

```javascript
// Missing parameters
{ success: false, error: "viewId or viewName parameter is required" }

// View not found
{ success: false, error: "View not found: NonExistentView" }
```

### 4. executeQuery

Executes the current query and refreshes the grid data. This triggers the same behavior as selecting a query from the Query Selector dropdown.
**Parameters:** None

**Success Response:**

```javascript
{
  success: true;
}
```

### 5. getViews

Retrieves available views for a Salesforce object. This allows external components to discover what views are available before selecting one.

**Parameters:**

| Parameter       | Type    | Required | Description                                                             |
| --------------- | ------- | -------- | ----------------------------------------------------------------------- |
| `sObjectName`   | String  | Yes      | The API name of the SObject (e.g., `Account`, `Contact`, `Opportunity`) |
| `isSubgridView` | Boolean | No       | Whether to retrieve subgrid views (default: `false`)                    |

**Success Response:**

```javascript
{
  success: true,
  data: {
    views: [
      {
        Id: "a0B5e00000XXXXXXAAA",
        Name: "All Accounts",
        AG_Object__c: "Account",
        AG_Is_Default__c: true,
        // ... other view properties
      },
      {
        Id: "a0B5e00000YYYYYYYBB",
        Name: "My Custom View",
        AG_Object__c: "Account",
        AG_Is_Default__c: false,
        // ... other view properties
      }
    ]
  }
}
```

**Error Responses:**

```javascript
// Missing parameter
{ success: false, error: "sObjectName parameter is required" }

// Server error
{ success: false, error: "Failed to retrieve views" }
```

### 6. getQueries

Retrieves saved queries for a Salesforce object. This allows external components to discover what saved queries are available.

**Parameters:**

| Parameter     | Type   | Required | Description                                                             |
| ------------- | ------ | -------- | ----------------------------------------------------------------------- |
| `sObjectName` | String | Yes      | The API name of the SObject (e.g., `Account`, `Contact`, `Opportunity`) |

**Success Response:**

```javascript
{
  success: true,
  data: {
    queries: [
      {
        Id: "a0C5e00000XXXXXXAAA",
        Name: "Active Accounts",
        AG_Object__c: "Account",
        AG_Query__c: "SELECT Id, Name FROM Account WHERE IsActive__c = true",
        // ... other query properties
      },
      {
        Id: "a0C5e00000YYYYYYYBB",
        Name: "High Value Opportunities",
        AG_Object__c: "Opportunity",
        AG_Query__c: "SELECT Id, Name, Amount FROM Opportunity WHERE Amount > 100000",
        // ... other query properties
      }
    ]
  }
}
```

**Error Responses:**

```javascript
// Missing parameter
{ success: false, error: "sObjectName parameter is required" }

// Server error
{ success: false, error: "Failed to retrieve queries" }
```

---

## Implementation Examples

### External LWC Component Setup

```javascript
// externalComponent.js
import { LightningElement, wire } from 'lwc';
import {
  subscribe,
  unsubscribe,
  publish,
  MessageContext,
  APPLICATION_SCOPE
} from 'lightning/messageService';
import APP_GRID_CHANNEL from '@salesforce/messageChannel/AppGridChannel__c';

export default class ExternalComponent extends LightningElement {
  @wire(MessageContext)
  messageContext;

  subscription = null;
  pendingRequests = new Map();

  connectedCallback() {
    this.subscribeToChannel();
  }

  disconnectedCallback() {
    this.unsubscribeFromChannel();
  }

  subscribeToChannel() {
    if (!this.subscription) {
      this.subscription = subscribe(
        this.messageContext,
        APP_GRID_CHANNEL,
        (message) => this.handleMessage(message),
        { scope: APPLICATION_SCOPE }
      );
    }
  }

  unsubscribeFromChannel() {
    if (this.subscription) {
      unsubscribe(this.subscription);
      this.subscription = null;
    }
  }

  handleMessage(message) {
    // Handle responses from AppGrid
    if (message.action === 'response' && message.requestId) {
      const resolver = this.pendingRequests.get(message.requestId);
      if (resolver) {
        resolver(message.payload);
        this.pendingRequests.delete(message.requestId);
      }
    }
  }

  /**
   * Send a message to AppGrid and wait for a response
   */
  sendMessage(action, payload = {}) {
    return new Promise((resolve) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store the resolver for this request
      this.pendingRequests.set(requestId, resolve);

      // Set a timeout to clean up if no response
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          resolve({ success: false, error: 'Request timeout' });
        }
      }, 10000); // 10 second timeout

      // Publish the message
      publish(this.messageContext, APP_GRID_CHANNEL, {
        action,
        payload,
        requestId
      });
    });
  }

  /**
   * Send a fire-and-forget message (no response expected)
   */
  sendMessageNoResponse(action, payload = {}) {
    publish(this.messageContext, APP_GRID_CHANNEL, {
      action,
      payload
      // No requestId = no response
    });
  }
}
```

### Example: Get Capabilities

```javascript
// Discover available API actions
async handleGetCapabilities() {
  const result = await this.sendMessage('getCapabilities');

  if (result.success) {
    console.log('Available actions:', Object.keys(result.data.capabilities));
    // Output: ['getCapabilities', 'selectObject', 'selectView', 'executeQuery', 'getViews', 'getQueries']

    // Check parameters for selectObject
    const selectObjectParams = result.data.capabilities.selectObject.params;
    console.log('selectObject requires:', selectObjectParams);

    // Check parameters for getViews
    const getViewsParams = result.data.capabilities.getViews.params;
    console.log('getViews requires:', getViewsParams);
  }
}
```

### Example: Select an Object

```javascript
// Select the Account object
async handleSelectAccount() {
  const result = await this.sendMessage('selectObject', {
    apiName: 'Account'
  });

  if (result.success) {
    console.log('Selected object:', result.data.selectedObject.label);
    // The grid will now display Account records
  } else {
    console.error('Failed to select object:', result.error);
  }
}

// Select a custom object
async handleSelectCustomObject() {
  const result = await this.sendMessage('selectObject', {
    apiName: 'MyCustomObject__c'
  });

  if (result.success) {
    console.log('Selected:', result.data.selectedObject.name);
  }
}
```

### Example: Select a View

```javascript
// Select a view by name
async handleSelectViewByName() {
  const result = await this.sendMessage('selectView', {
    viewName: 'My Custom View'
  });

  if (result.success) {
    console.log('Selected view:', result.data.selectedView.name);
  } else {
    console.error('Failed to select view:', result.error);
  }
}

// Select a view by ID
async handleSelectViewById() {
  const result = await this.sendMessage('selectView', {
    viewId: 'a0B5e00000XXXXXXAAA'
  });

  if (result.success) {
    console.log('View loaded:', result.data.selectedView.name);
  }
}
```

### Example: Execute Query

```javascript
// Refresh the grid data
async handleRefreshGrid() {
  const result = await this.sendMessage('executeQuery');

  if (result.success) {
    console.log('Query executed successfully');
  }
}

// Fire-and-forget version (no response needed)
handleRefreshGridSimple() {
  this.sendMessageNoResponse('executeQuery');
}
```

### Example: Get Views

```javascript
// Get all views for an object
async handleGetViews() {
  const result = await this.sendMessage('getViews', {
    sObjectName: 'Account'
  });

  if (result.success) {
    console.log('Available views:', result.data.views);
    // Populate a combobox with view options
    this.viewOptions = result.data.views.map(view => ({
      label: view.Name,
      value: view.Id
    }));
  } else {
    console.error('Failed to get views:', result.error);
  }
}

// Get subgrid views
async handleGetSubgridViews() {
  const result = await this.sendMessage('getViews', {
    sObjectName: 'Contact',
    isSubgridView: true
  });

  if (result.success) {
    console.log('Subgrid views:', result.data.views);
  }
}
```

### Example: Get Queries

```javascript
// Get saved queries for an object
async handleGetQueries() {
  const result = await this.sendMessage('getQueries', {
    sObjectName: 'Opportunity'
  });

  if (result.success) {
    console.log('Saved queries:', result.data.queries);
    // Populate a combobox with query options
    this.queryOptions = result.data.queries.map(query => ({
      label: query.Name,
      value: query.Id
    }));
  } else {
    console.error('Failed to get queries:', result.error);
  }
}
```

### Example: Complete Workflow

```javascript
// Select an object, then a view, then run the query
async handleCompleteWorkflow() {
  // Step 1: Select the object
  const objectResult = await this.sendMessage('selectObject', {
    apiName: 'Opportunity'
  });

  if (!objectResult.success) {
    console.error('Failed to select object:', objectResult.error);
    return;
  }

  // Step 2: Wait a moment for views to load, then select a view
  await new Promise(resolve => setTimeout(resolve, 500));

  const viewResult = await this.sendMessage('selectView', {
    viewName: 'Open Opportunities'
  });

  if (!viewResult.success) {
    console.error('Failed to select view:', viewResult.error);
    return;
  }

  // Step 3: Execute the query
  const queryResult = await this.sendMessage('executeQuery');

  if (queryResult.success) {
    console.log('Workflow completed successfully!');
  }
}
```

### Example: Dynamic View Discovery Workflow

```javascript
// Discover available views and let user select one
async handleDynamicViewSelection() {
  // Step 1: Select the object
  const objectResult = await this.sendMessage('selectObject', {
    apiName: 'Account'
  });

  if (!objectResult.success) {
    console.error('Failed to select object:', objectResult.error);
    return;
  }

  // Step 2: Get available views for this object
  const viewsResult = await this.sendMessage('getViews', {
    sObjectName: 'Account'
  });

  if (!viewsResult.success) {
    console.error('Failed to get views:', viewsResult.error);
    return;
  }

  // Step 3: Find the default view or first available view
  const views = viewsResult.data.views;
  const defaultView = views.find(v => v.AG_Is_Default__c) || views[0];

  if (!defaultView) {
    console.error('No views available for Account');
    return;
  }

  // Step 4: Select the view by ID
  const viewResult = await this.sendMessage('selectView', {
    viewId: defaultView.Id
  });

  if (!viewResult.success) {
    console.error('Failed to select view:', viewResult.error);
    return;
  }

  // Step 5: Execute the query
  const queryResult = await this.sendMessage('executeQuery');

  if (queryResult.success) {
    console.log(`Loaded ${defaultView.Name} view successfully!`);
  }
}
```

---

## HTML Template Example

```html
<!-- externalComponent.html -->
<template>
  <lightning-card title="AppGrid Controller">
    <div class="slds-p-horizontal_small">
      <!-- Object Selection -->
      <lightning-combobox
        label="Select Object"
        value="{selectedObject}"
        options="{objectOptions}"
        onchange="{handleObjectChange}"
      >
      </lightning-combobox>

      <!-- Action Buttons -->
      <div class="slds-m-top_medium">
        <lightning-button
          label="Get Capabilities"
          onclick="{handleGetCapabilities}"
        >
        </lightning-button>

        <lightning-button
          label="Run Query"
          variant="brand"
          onclick="{handleRefreshGrid}"
          class="slds-m-left_small"
        >
        </lightning-button>
      </div>

      <!-- Response Display -->
      <template if:true="{lastResponse}">
        <div class="slds-m-top_medium">
          <pre>{lastResponseJson}</pre>
        </div>
      </template>
    </div>
  </lightning-card>
</template>
```

---

## Error Handling Best Practices

1. **Always check `result.success`** before accessing `result.data`
2. **Set a timeout** for pending requests to avoid memory leaks
3. **Handle the case** where AppGrid is not on the page (no response will come)
4. **Log errors** from `result.error` for debugging

```javascript
async safeApiCall(action, payload) {
  try {
    const result = await this.sendMessage(action, payload);

    if (!result.success) {
      // Handle API-level error
      this.showToast('Error', result.error, 'error');
      return null;
    }

    return result.data;
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error calling AppGrid:', error);
    this.showToast('Error', 'Failed to communicate with AppGrid', 'error');
    return null;
  }
}
```

---

## Debugging

Enable console logging to see LMS messages:

1. **LWC Host logs** (AppGridLwcGA):

   - `[LWC] Subscribed to AppGrid LMS channel` - Subscription confirmed
   - `[LWC] LMS message received: {action, payload, requestId}` - Incoming message
   - `[LWC] LMS action result: {...}` - Action result

2. **React logs** (AppWrapper):
   - `[AppWrapper] handleLmsAction called {action, payload}` - Action received in React

Open browser DevTools console and filter by `[LWC]` or `[AppWrapper]` to see the message flow.
