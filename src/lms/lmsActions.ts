/**
 * Lightning Message Service (LMS) Action Definitions
 *
 * This module defines the available actions that external LWC components
 * can invoke via the AppGrid LMS channel.
 */

export interface ActionParam {
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
  description: string;
}

export interface ActionDefinition {
  description: string;
  params: Record<string, ActionParam> | null;
}

export const LMS_ACTIONS: Record<string, ActionDefinition> = {
  getCapabilities: {
    description: 'Returns available API actions and their parameter schemas',
    params: null
  },
  selectObject: {
    description: 'Select a Salesforce object to display in the grid',
    params: {
      apiName: {
        type: 'string',
        required: true,
        description: 'SObject API name (e.g., Account, Contact, Opportunity)'
      }
    }
  },
  selectView: {
    description: 'Select a saved view for a Salesforce object',
    params: {
      sObjectName: {
        type: 'string',
        required: true,
        description: 'SObject API name (e.g., Account, Contact, Opportunity)'
      },
      viewId: {
        type: 'string',
        required: false,
        description: 'View record ID (18-character Salesforce ID)'
      },
      viewName: {
        type: 'string',
        required: false,
        description: 'View name (used if viewId not provided)'
      }
    }
  },
  executeQuery: {
    description: 'Execute the current query and refresh grid data',
    params: null
  },
  getViews: {
    description: 'Retrieve available views for a Salesforce object',
    params: {
      sObjectName: {
        type: 'string',
        required: true,
        description: 'SObject API name (e.g., Account, Contact, Opportunity)'
      },
      isSubgridView: {
        type: 'boolean',
        required: false,
        description: 'Whether to retrieve subgrid views (default: false)'
      }
    }
  },
  getQueries: {
    description: 'Retrieve saved queries for a Salesforce object',
    params: {
      sObjectName: {
        type: 'string',
        required: true,
        description: 'SObject API name (e.g., Account, Contact, Opportunity)'
      }
    }
  },
  getOrgObjects: {
    description: 'Retrieve available Salesforce objects for the org',
    params: null
  },
  selectQuery: {
    description: 'Select a saved query for a Salesforce object',
    params: {
      sObjectName: {
        type: 'string',
        required: true,
        description: 'SObject API name (e.g., Account, Contact, Opportunity)'
      },
      queryId: {
        type: 'string',
        required: false,
        description: 'Query record ID (18-character Salesforce ID)'
      },
      queryName: {
        type: 'string',
        required: false,
        description: 'Query name (used if queryId not provided)'
      }
    }
  },
  getFilters: {
    description: 'Retrieve available advanced filters for the current view',
    params: {
      sObjectName: {
        type: 'string',
        required: true,
        description: 'SObject API name (e.g., Account, Contact, Opportunity)'
      }
    }
  },
  setAdvancedFilter: {
    description: 'Apply an advanced filter to the grid',
    params: {
      sObjectName: {
        type: 'string',
        required: true,
        description: 'SObject API name (e.g., Account, Contact, Opportunity)'
      },
      filterName: {
        type: 'string',
        required: true,
        description: 'Name of the saved advanced filter to apply'
      }
    }
  },
  clearFilters: {
    description: 'Clear all column and advanced filters from the grid',
    params: {
      sObjectName: {
        type: 'string',
        required: true,
        description: 'SObject API name (e.g., Account, Contact, Opportunity)'
      }
    }
  },
  getColumnStyles: {
    description: 'Retrieve available column styles for a Salesforce object',
    params: {
      sObjectName: {
        type: 'string',
        required: true,
        description: 'SObject API name (e.g., Account, Contact, Opportunity)'
      }
    }
  },
  setColumnStyle: {
    description: 'Apply a column style to the grid',
    params: {
      sObjectName: {
        type: 'string',
        required: true,
        description: 'SObject API name (e.g., Account, Contact, Opportunity)'
      },
      styleName: {
        type: 'string',
        required: true,
        description: 'Name of the column style to apply'
      }
    }
  },
  clearColumnStyles: {
    description: 'Clear all column styles from the grid',
    params: {
      sObjectName: {
        type: 'string',
        required: true,
        description: 'SObject API name (e.g., Account, Contact, Opportunity)'
      }
    }
  },
  getRowStyles: {
    description: 'Retrieve available row styles for a Salesforce object',
    params: {
      sObjectName: {
        type: 'string',
        required: true,
        description: 'SObject API name (e.g., Account, Contact, Opportunity)'
      }
    }
  },
  setRowStyle: {
    description: 'Apply a row style to the grid',
    params: {
      sObjectName: {
        type: 'string',
        required: true,
        description: 'SObject API name (e.g., Account, Contact, Opportunity)'
      },
      styleName: {
        type: 'string',
        required: true,
        description: 'Name of the row style to apply'
      }
    }
  },
  clearRowStyles: {
    description: 'Clear all row styles from the grid',
    params: {
      sObjectName: {
        type: 'string',
        required: true,
        description: 'SObject API name (e.g., Account, Contact, Opportunity)'
      }
    }
  }
} as const;

export type LmsAction = keyof typeof LMS_ACTIONS;

export interface LmsMessage {
  action: LmsAction;
  payload?: Record<string, unknown>;
  requestId?: string;
}

export interface LmsResponse {
  success: boolean;
  requestId?: string;
  data?: unknown;
  error?: string;
}
