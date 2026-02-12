/**
 * Conversion utilities between Syncfusion QueryBuilder RuleModel and AG Grid AdvancedFilterModel
 *
 * Syncfusion RuleModel structure:
 * {
 *   condition: 'and' | 'or',
 *   rules: [{ field, operator, value, type? }]
 * }
 *
 * AG Grid AdvancedFilterModel structure:
 * {
 *   filterType: 'join',
 *   type: 'AND' | 'OR',
 *   conditions: [{ filterType, colId, type, filter }]
 * }
 */

import type { RuleModel } from '@syncfusion/ej2-querybuilder';

import type { AdvancedFilterModel } from 'ag-grid-community';

import { prettyPrint } from './prettyPrint';

// AG Grid filter condition types
interface AgGridTextCondition {
  filterType: 'text';
  colId: string;
  type:
    | 'equals'
    | 'notEqual'
    | 'contains'
    | 'notContains'
    | 'startsWith'
    | 'endsWith'
    | 'blank'
    | 'notBlank';
  filter?: string;
}

interface AgGridNumberCondition {
  filterType: 'number';
  colId: string;
  type:
    | 'equals'
    | 'notEqual'
    | 'greaterThan'
    | 'greaterThanOrEqual'
    | 'lessThan'
    | 'lessThanOrEqual'
    | 'blank'
    | 'notBlank';
  filter?: number;
}

interface AgGridDateCondition {
  filterType: 'date';
  colId: string;
  type:
    | 'equals'
    | 'notEqual'
    | 'greaterThan'
    | 'lessThan'
    | 'blank'
    | 'notBlank';
  dateFrom?: string;
}

interface AgGridBooleanCondition {
  filterType: 'boolean';
  colId: string;
  type: 'true' | 'false';
}

interface AgGridJoinCondition {
  filterType: 'join';
  type: 'AND' | 'OR';
  conditions: AgGridFilterCondition[];
}

type AgGridFilterCondition =
  | AgGridTextCondition
  | AgGridNumberCondition
  | AgGridDateCondition
  | AgGridBooleanCondition
  | AgGridJoinCondition;

// Syncfusion to AG Grid operator mapping
const syncfusionToAgGridOperatorMap: Record<
  string,
  { agOperator: string; filterType: string }
> = {
  // Text operators
  equal: { agOperator: 'equals', filterType: 'text' },
  notequal: { agOperator: 'notEqual', filterType: 'text' },
  contains: { agOperator: 'contains', filterType: 'text' },
  notcontains: { agOperator: 'notContains', filterType: 'text' },
  startswith: { agOperator: 'startsWith', filterType: 'text' },
  endswith: { agOperator: 'endsWith', filterType: 'text' },
  isempty: { agOperator: 'blank', filterType: 'text' },
  isnotempty: { agOperator: 'notBlank', filterType: 'text' },

  // Number operators
  greaterthan: { agOperator: 'greaterThan', filterType: 'number' },
  greaterthanorequal: {
    agOperator: 'greaterThanOrEqual',
    filterType: 'number'
  },
  lessthan: { agOperator: 'lessThan', filterType: 'number' },
  lessthanorequal: { agOperator: 'lessThanOrEqual', filterType: 'number' }
};

// AG Grid to Syncfusion operator mapping (reverse)
const agGridToSyncfusionOperatorMap: Record<string, string> = {
  equals: 'equal',
  notEqual: 'notequal',
  contains: 'contains',
  notContains: 'notcontains',
  startsWith: 'startswith',
  endsWith: 'endswith',
  blank: 'isempty',
  notBlank: 'isnotempty',
  greaterThan: 'greaterthan',
  greaterThanOrEqual: 'greaterthanorequal',
  lessThan: 'lessthan',
  lessThanOrEqual: 'lessthanorequal'
};

/**
 * Determines the AG Grid filterType based on the Syncfusion operator and value type
 */
function determineFilterType(
  operator: string,
  value: any,
  fieldType?: string
): string {
  // Check if it's a date field
  if (fieldType === 'date' || fieldType === 'datetime') {
    return 'date';
  }

  // Check if it's a boolean
  if (typeof value === 'boolean' || fieldType === 'boolean') {
    return 'boolean';
  }

  // Check if it's a number
  if (typeof value === 'number' || fieldType === 'number') {
    return 'number';
  }

  // Check operator for number-specific operators
  const numberOperators = [
    'greaterthan',
    'greaterthanorequal',
    'lessthan',
    'lessthanorequal',
    'between',
    'notbetween'
  ];
  if (numberOperators.includes(operator.toLowerCase())) {
    return 'number';
  }

  // Default to text
  return 'text';
}

/**
 * Convert a single Syncfusion rule to AG Grid condition
 */
function convertSingleRule(
  rule: any,
  fieldTypeMap?: Map<string, string>
): AgGridFilterCondition | AgGridFilterCondition[] | null {
  if (!rule.field || !rule.operator) {
    return null;
  }

  const operator = rule.operator.toLowerCase();
  const fieldType = fieldTypeMap?.get(rule.field);
  const filterType = determineFilterType(operator, rule.value, fieldType);

  // Handle 'in' operator - convert to multiple equals with OR
  if (operator === 'in' && Array.isArray(rule.value)) {
    if (rule.value.length === 0) return null;
    if (rule.value.length === 1) {
      return {
        filterType: 'text',
        colId: rule.field,
        type: 'equals',
        filter: rule.value[0]
      } as AgGridTextCondition;
    }
    // Multiple values - create OR join
    return {
      filterType: 'join',
      type: 'OR',
      conditions: rule.value.map((val: any) => ({
        filterType: 'text',
        colId: rule.field,
        type: 'equals',
        filter: val
      }))
    } as AgGridJoinCondition;
  }

  // Handle 'notin' operator - convert to multiple notEquals with AND
  if (operator === 'notin' && Array.isArray(rule.value)) {
    if (rule.value.length === 0) return null;
    if (rule.value.length === 1) {
      return {
        filterType: 'text',
        colId: rule.field,
        type: 'notEqual',
        filter: rule.value[0]
      } as AgGridTextCondition;
    }
    // Multiple values - create AND join
    return {
      filterType: 'join',
      type: 'AND',
      conditions: rule.value.map((val: any) => ({
        filterType: 'text',
        colId: rule.field,
        type: 'notEqual',
        filter: val
      }))
    } as AgGridJoinCondition;
  }

  // Handle boolean type
  if (filterType === 'boolean') {
    return {
      filterType: 'boolean',
      colId: rule.field,
      type: rule.value === true || rule.value === 'true' ? 'true' : 'false'
    } as AgGridBooleanCondition;
  }

  // Handle date type
  if (filterType === 'date') {
    const mapping = syncfusionToAgGridOperatorMap[operator];
    return {
      filterType: 'date',
      colId: rule.field,
      type: (mapping?.agOperator || 'equals') as any,
      dateFrom: rule.value
    } as AgGridDateCondition;
  }

  // Handle number type
  if (filterType === 'number') {
    const mapping = syncfusionToAgGridOperatorMap[operator];
    return {
      filterType: 'number',
      colId: rule.field,
      type: (mapping?.agOperator || 'equals') as any,
      filter:
        typeof rule.value === 'number' ? rule.value : parseFloat(rule.value)
    } as AgGridNumberCondition;
  }

  // Default: text type
  const mapping = syncfusionToAgGridOperatorMap[operator];
  return {
    filterType: 'text',
    colId: rule.field,
    type: (mapping?.agOperator || 'equals') as any,
    filter: String(rule.value ?? '')
  } as AgGridTextCondition;
}

/**
 * Convert Syncfusion RuleModel to AG Grid AdvancedFilterModel
 *
 * @param ruleModel - Syncfusion QueryBuilder RuleModel
 * @param fieldTypeMap - Optional map of field names to their data types (for better type inference)
 * @returns AG Grid AdvancedFilterModel or null if empty/invalid
 */
export function syncfusionRuleToAdvancedFilterModel(
  ruleModel: RuleModel | null | undefined,
  fieldTypeMap?: Map<string, string>
): AdvancedFilterModel | null {
  if (!ruleModel || !ruleModel.rules || ruleModel.rules.length === 0) {
    return null;
  }

  prettyPrint(
    '[syncfusionRuleToAdvancedFilterModel] Converting Syncfusion rule',
    ruleModel,
    'blue'
  );

  const conditions: AgGridFilterCondition[] = [];

  for (const rule of ruleModel.rules) {
    // Check if it's a nested group (has 'rules' property)
    if ('rules' in rule && Array.isArray((rule as any).rules)) {
      // Recursive call for nested groups
      const nestedModel = syncfusionRuleToAdvancedFilterModel(
        rule as RuleModel,
        fieldTypeMap
      );
      if (nestedModel) {
        conditions.push(nestedModel as AgGridJoinCondition);
      }
    } else {
      // Single rule
      const converted = convertSingleRule(rule, fieldTypeMap);
      if (converted) {
        if (Array.isArray(converted)) {
          conditions.push(...converted);
        } else {
          conditions.push(converted);
        }
      }
    }
  }

  if (conditions.length === 0) {
    return null;
  }

  // If only one condition, return it directly (AG Grid allows this)
  if (conditions.length === 1 && conditions[0].filterType !== 'join') {
    return conditions[0] as AdvancedFilterModel;
  }

  const result: AdvancedFilterModel = {
    filterType: 'join',
    type: (ruleModel.condition?.toUpperCase() || 'AND') as 'AND' | 'OR',
    conditions: conditions
  } as any;

  prettyPrint(
    '[syncfusionRuleToAdvancedFilterModel] Converted to AG Grid model',
    result,
    'green'
  );

  return result;
}

/**
 * Convert AG Grid AdvancedFilterModel to Syncfusion RuleModel
 *
 * @param advancedFilterModel - AG Grid AdvancedFilterModel
 * @returns Syncfusion QueryBuilder RuleModel or null if empty/invalid
 */
export function advancedFilterModelToSyncfusionRule(
  advancedFilterModel: AdvancedFilterModel | null | undefined
): RuleModel | null {
  if (!advancedFilterModel) {
    return null;
  }

  prettyPrint(
    '[advancedFilterModelToSyncfusionRule] Converting AG Grid model',
    advancedFilterModel,
    'blue'
  );

  const model = advancedFilterModel as any;

  // Handle join type (group of conditions)
  if (model.filterType === 'join') {
    const rules: any[] = [];

    for (const condition of model.conditions || []) {
      if (condition.filterType === 'join') {
        // Nested group - recursive call
        const nestedRule = advancedFilterModelToSyncfusionRule(condition);
        if (nestedRule) {
          rules.push(nestedRule);
        }
      } else {
        // Single condition
        const converted = convertAgGridConditionToRule(condition);
        if (converted) {
          rules.push(converted);
        }
      }
    }

    const result: RuleModel = {
      condition: model.type?.toLowerCase() || 'and',
      rules: rules
    };

    prettyPrint(
      '[advancedFilterModelToSyncfusionRule] Converted to Syncfusion rule',
      result,
      'green'
    );

    return result;
  }

  // Single condition (not a join)
  const converted = convertAgGridConditionToRule(model);
  if (converted) {
    return {
      condition: 'and',
      rules: [converted]
    };
  }

  return null;
}

/**
 * Convert a single AG Grid condition to Syncfusion rule
 */
function convertAgGridConditionToRule(condition: any): any | null {
  if (!condition || !condition.colId) {
    return null;
  }

  const syncfusionOperator =
    agGridToSyncfusionOperatorMap[condition.type] || 'equal';

  let value: any;

  switch (condition.filterType) {
    case 'boolean':
      value = condition.type === 'true';
      break;
    case 'date':
      value = condition.dateFrom;
      break;
    case 'number':
      value = condition.filter;
      break;
    case 'text':
    default:
      value = condition.filter;
      break;
  }

  // Note: Syncfusion 'equal'/'notequal' expect single values, NOT arrays.
  // Only 'in'/'notin' operators expect arrays.
  // The value should remain as-is (single value for equals, array for in/notin).

  return {
    field: condition.colId,
    operator: syncfusionOperator,
    value,
    type:
      condition.filterType === 'number'
        ? 'number'
        : condition.filterType === 'date'
          ? 'date'
          : condition.filterType === 'boolean'
            ? 'boolean'
            : 'string'
  };
}

/**
 * Check if an AdvancedFilterModel has any active conditions
 */
export function hasActiveFilter(
  model: AdvancedFilterModel | null | undefined
): boolean {
  if (!model) return false;

  const m = model as any;

  if (m.filterType === 'join') {
    return Array.isArray(m.conditions) && m.conditions.length > 0;
  }

  // Single condition
  return !!m.colId;
}

/**
 * Create an empty Syncfusion RuleModel
 */
export function createEmptyRuleModel(): RuleModel {
  return {
    condition: 'and',
    rules: []
  };
}
