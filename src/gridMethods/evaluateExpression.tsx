// metadata types
import { SObject } from "../sObjectMetadataTypes";

// grid interfaces
import { AgRowStyle } from "../appInterfaces/grid/gridInterfaces";

// AgGrid types
import type {
   RowStyle
} from "ag-grid-community";

// QueryBuilder types
import { RuleModel } from "@syncfusion/ej2-querybuilder";


const evaluateNumberRule = (field: string, operator: string, ruleValue: number | object, data: SObject): boolean => {
   const fieldValue = data[field];

   // Handle null check operators first
   switch (operator) {
      case 'isnull':
         return fieldValue === null || fieldValue === undefined;
      case 'isnotnull':
         return fieldValue !== null && fieldValue !== undefined;
   }

   // For other operators, null/undefined values should return false
   if (fieldValue === null || fieldValue === undefined) {
      return false;
   }

   const fieldNum = Number(fieldValue);

   switch (operator) {
      case 'equal':
         return fieldNum === Number(ruleValue);
      case 'notequal':
         return fieldNum !== Number(ruleValue);
      case 'greaterthan':
         return fieldNum > Number(ruleValue);
      case 'greaterthanorequal':
         return fieldNum >= Number(ruleValue);
      case 'lessthan':
         return fieldNum < Number(ruleValue);
      case 'lessthanorequal':
         return fieldNum <= Number(ruleValue);
      case 'in': {
         // "In" operator expects an array of values
         if (!Array.isArray(ruleValue)) {
            return false;
         }
         return ruleValue.map(Number).includes(fieldNum);
      }
      case 'notin': {
         // "Not In" operator expects an array of values
         if (!Array.isArray(ruleValue)) {
            return false;
         }
         return !ruleValue.map(Number).includes(fieldNum);
      }
      case 'between': {
         if (!Array.isArray(ruleValue) || ruleValue.length !== 2) {
            return false;
         }
         const [firstValue, secondValue] = ruleValue.map(num => Number(num));
         return fieldNum >= firstValue && fieldNum <= secondValue;
      }
      case 'notbetween': {
         if (!Array.isArray(ruleValue) || ruleValue.length !== 2) {
            return false;
         }
         const [firstValue, secondValue] = ruleValue.map(num => Number(num));
         return fieldNum < firstValue || fieldNum > secondValue;
      }
      default:
         return false;
   }
};

const evaluateDateRule = (field: string, operator: string, ruleValue: string | object, data: SObject): boolean => {
   const fieldValue = data[field];

   // Handle null check operators first
   switch (operator) {
      case 'isnull':
         return fieldValue === null || fieldValue === undefined;
      case 'isnotnull':
         return fieldValue !== null && fieldValue !== undefined;
   }

   // For other operators, null/undefined values should return false
   if (fieldValue === null || fieldValue === undefined) {
      return false;
   }

   // Parse the field value as a Date
   const valueDate = fieldValue instanceof Date ? fieldValue : new Date(fieldValue as string);
   if (isNaN(valueDate.getTime())) {
      return false; // Invalid date
   }

   switch (operator) {
      case 'equal': {
         const ruleDate = new Date(ruleValue as string);
         return valueDate.getTime() === ruleDate.getTime();
      }
      case 'notequal': {
         const ruleDate = new Date(ruleValue as string);
         return valueDate.getTime() !== ruleDate.getTime();
      }
      case 'greaterthan': {
         const ruleDate = new Date(ruleValue as string);
         return valueDate.getTime() > ruleDate.getTime();
      }
      case 'greaterthanorequal': {
         const ruleDate = new Date(ruleValue as string);
         return valueDate.getTime() >= ruleDate.getTime();
      }
      case 'lessthan': {
         const ruleDate = new Date(ruleValue as string);
         return valueDate.getTime() < ruleDate.getTime();
      }
      case 'lessthanorequal': {
         const ruleDate = new Date(ruleValue as string);
         return valueDate.getTime() <= ruleDate.getTime();
      }
      case 'between': {
         if (!Array.isArray(ruleValue) || ruleValue.length !== 2) {
            return false;
         }
         const [firstValue, secondValue] = ruleValue.map(dt => new Date(dt));
         return valueDate >= firstValue && valueDate <= secondValue;
      }
      case 'notbetween': {
         if (!Array.isArray(ruleValue) || ruleValue.length !== 2) {
            return false;
         }
         const [firstValue, secondValue] = ruleValue.map(dt => new Date(dt));
         return valueDate < firstValue || valueDate > secondValue;
      }
      default:
         return false;
   }
};

const evaluateStringRule = (field: string, operator: string, ruleValue: string | object, data: SObject): boolean => {
   const valueString = data[field] as string;

   // Handle null/empty check operators first (they work on null values)
   switch (operator) {
      case 'isnull':
         return valueString === null || valueString === undefined;
      case 'isnotnull':
         return valueString !== null && valueString !== undefined;
      case 'isempty':
         return valueString === null || valueString === undefined || valueString === '';
      case 'isnotempty':
         return valueString !== null && valueString !== undefined && valueString !== '';
   }

   // For other operators, null/undefined values should return false
   if (valueString === null || valueString === undefined) {
      return false;
   }

   switch (operator) {
      case 'equal': {
         // Handle both single string and array of strings
         if (Array.isArray(ruleValue)) {
            return ruleValue.includes(valueString);
         }
         return valueString === ruleValue;
      }
      case 'notequal': {
         // Handle both single string and array of strings
         if (Array.isArray(ruleValue)) {
            return !ruleValue.includes(valueString);
         }
         return valueString !== ruleValue;
      }
      case 'in': {
         // "In" operator expects an array of values
         if (!Array.isArray(ruleValue)) {
            return false;
         }
         return ruleValue.includes(valueString);
      }
      case 'notin': {
         // "Not In" operator expects an array of values
         if (!Array.isArray(ruleValue)) {
            return false;
         }
         return !ruleValue.includes(valueString);
      }
      case 'contains': {
         // Contains checks if the field value contains the substring
         if (typeof ruleValue === 'string') {
            return valueString.toLowerCase().includes(ruleValue.toLowerCase());
         }
         // Also support array for backward compatibility
         if (Array.isArray(ruleValue)) {
            return ruleValue.includes(valueString);
         }
         return false;
      }
      case 'notcontains':
      case 'doesnotcontain': {
         // NotContains checks if the field value does not contain the substring
         if (typeof ruleValue === 'string') {
            return !valueString.toLowerCase().includes(ruleValue.toLowerCase());
         }
         // Also support array for backward compatibility
         if (Array.isArray(ruleValue)) {
            return !ruleValue.includes(valueString);
         }
         return false;
      }
      case 'startswith': {
         if (typeof ruleValue !== 'string') {
            return false;
         }
         return valueString.toLowerCase().startsWith(ruleValue.toLowerCase());
      }
      case 'notstartswith': {
         if (typeof ruleValue !== 'string') {
            return false;
         }
         return !valueString.toLowerCase().startsWith(ruleValue.toLowerCase());
      }
      case 'endswith': {
         if (typeof ruleValue !== 'string') {
            return false;
         }
         return valueString.toLowerCase().endsWith(ruleValue.toLowerCase());
      }
      case 'notendswith': {
         if (typeof ruleValue !== 'string') {
            return false;
         }
         return !valueString.toLowerCase().endsWith(ruleValue.toLowerCase());
      }
      default:
         return false;
   }
};

const evaluateBooleanRule = (field: string, operator: string, ruleValue: boolean, data: SObject): boolean => {

   const boolValue = data[field];

   if (typeof boolValue !== 'boolean') {
      return false; // Ensure the field value is actually a boolean
   }

   switch (operator.toLowerCase()) {
      case 'equal':
         return ruleValue === boolValue;
      case 'notequal':
         return ruleValue !== boolValue;
      default:
         return false;
   }
};

// helper function to evaluate the condition ('and', 'or') between evaluated sub-rules
const evaluateCondition = (evaluatedRules: boolean[], condition: string): boolean => {
   switch (condition) {
      case 'and':
         return evaluatedRules.every(result => result === true);
      case 'or':
         return evaluatedRules.some(result => result === true);
      default:
         return false;
   }
};

export const evaluateRule = (rule: RuleModel, data: SObject): boolean => {
   const { condition, rules, not } = rule;

   if (rules && Array.isArray(rules) && rules.length > 0) {
      const evaluatedRules = rules.map(subRule => {
         const result = evaluateRule(subRule, data);
         return result;
      });
      const result = evaluateCondition(evaluatedRules, condition!);
      return not ? !result : result;
   }

   const { field, operator, value, type } = rule;
   const fieldValue = data[field!];

   if (fieldValue === undefined || fieldValue === null) {
      return false;
   }

   switch (type) {
      case 'number':
         return evaluateNumberRule(field!, operator!, value as number | object, data);
      case 'date':
         return evaluateDateRule(field!, operator!, value as Date | object, data);
      case 'string':
         return evaluateStringRule(field!, operator!, value as string | object, data);
      case 'boolean':
         return evaluateBooleanRule(field!, operator!, value as boolean, data);
      default:
         console.log('Unknown rule type:', type);
         return false;
   }
};

export const getValidCssStyle = (rowStyle: AgRowStyle): RowStyle => {
   // Define the allowed CSS properties
   const allowedCssProperties: (keyof RowStyle)[] = [
      'backgroundColor',
      'backgroundColorOpacity',
      'borderColor',
      'borderColorOpacity',
      'color',
      'colorOpacity',
      'fontSize',
      'fontStyle'
   ];

   // Filter out non-CSS properties
   return Object.fromEntries(
      Object.entries(rowStyle)
         .filter(([key]) => allowedCssProperties.includes(key as keyof RowStyle))
   ) as RowStyle;
};


