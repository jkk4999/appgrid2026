import { ValueSetterParams } from "ag-grid-community";

// Helper function to parse a rule string with bracketed field names
const parseRuleString = (rule: string): { field: string; operator: string; values: any[] } => {
   const trimmedRule = rule.trim();
   const fieldMatch = trimmedRule.match(/^{([^}]+)}/); // Extract field inside {}
   if (!fieldMatch) {
      console.error(`Invalid field format in rule: ${rule}`);
      return { field: "", operator: "", values: [] };
   }

   const field = fieldMatch[1]; // e.g., "AnnualRevenue"
   const remaining = trimmedRule.slice(fieldMatch[0].length).trim(); // e.g., "> 1000"
   const parts = remaining.split(/\s+/);

   if (parts.length < 2) {
      console.error(`Invalid rule format after field: ${remaining}`);
      return { field, operator: "", values: [] };
   }

   let operator = parts[0];
   let values: any[] = [];

   // Handle different operator cases
   if (operator.toLowerCase() === "between" || operator.toLowerCase() === "notbetween") {
      if (parts.length < 4 || parts[2].toLowerCase() !== "and") {
         console.error(`Invalid range rule format: ${rule}`);
         return { field, operator, values: [] };
      }
      values = [parts[1], parts[3]];
   } else {
      values = [parts.slice(1).join(" ")];
   }

   // Normalize operator names
   switch (operator.toLowerCase()) {
      case "=":
         operator = "equals";
         break;
      case "!=":
         operator = "notEquals";
         break;
      case ">":
         operator = "greaterThan";
         break;
      case "<":
         operator = "lessThan";
         break;
      case "between":
      case "notbetween":
         break; // Already set
      default:
         console.warn(`Unsupported operator: ${operator}`);
         operator = "equals"; // Default fallback
   }

   return { field, operator, values };
};

// Helper function to evaluate numeric rules
const evaluateNumericRule = (field: string, operator: string, values: string[], data: any): number => {
   const fieldValue = parseFloat(data[field]);
   if (isNaN(fieldValue)) {
      console.error(`Field value for ${field} is not numeric`);
      return 0;
   }

   const parsedValues = values.map(v => parseFloat(v));
   if (parsedValues.some(v => isNaN(v))) {
      console.error(`Invalid numeric value(s): ${values}`);
      return 0;
   }

   switch (operator) {
      case "equals":
         return fieldValue === parsedValues[0] ? fieldValue : 0;
      case "greaterThan":
         return fieldValue > parsedValues[0] ? fieldValue : 0;
      case "lessThan":
         return fieldValue < parsedValues[0] ? fieldValue : 0;
      case "between":
         return fieldValue >= parsedValues[0] && fieldValue <= parsedValues[1] ? fieldValue : 0;
      case "notBetween":
         return !(fieldValue >= parsedValues[0] && fieldValue <= parsedValues[1]) ? fieldValue : 0;
      default:
         return 0;
   }
};

// Helper function to evaluate date rules
const evaluateDateRule = (field: string, operator: string, values: string[], data: any): Date => {
   const fieldValue = new Date(data[field]);
   if (isNaN(fieldValue.getTime())) {
      console.error(`Field value for ${field} is not a valid date`);
      return new Date();
   }

   const parsedValues = values.map(v => new Date(v));
   if (parsedValues.some(v => isNaN(v.getTime()))) {
      console.error(`Invalid date value(s): ${values}`);
      return new Date();
   }

   switch (operator) {
      case "equals":
         return fieldValue.getTime() === parsedValues[0].getTime() ? fieldValue : new Date();
      case "greaterThan":
         return fieldValue > parsedValues[0] ? fieldValue : new Date();
      case "lessThan":
         return fieldValue < parsedValues[0] ? fieldValue : new Date();
      case "between":
         return fieldValue >= parsedValues[0] && fieldValue <= parsedValues[1] ? fieldValue : new Date();
      case "notBetween":
         return !(fieldValue >= parsedValues[0] && fieldValue <= parsedValues[1]) ? fieldValue : new Date();
      default:
         return new Date();
   }
};

// Helper function to evaluate boolean rules
const evaluateBooleanRule = (field: string, operator: string, values: string[], data: any): boolean => {
   const fieldValue = data[field];
   const ruleValue = values[0].toLowerCase() === "true";

   switch (operator) {
      case "equals":
         return fieldValue === ruleValue;
      case "notEquals":
         return fieldValue !== ruleValue;
      default:
         return false;
   }
};

// Main function to create the value setter
export const createValueSetter = (rule: string) => {
   return (params: ValueSetterParams) => {
      const data = params.data;
      if (!rule) {
         console.error("Rule string is empty or undefined");
         return false;
      }

      const { field, operator, values } = parseRuleString(rule);
      if (!field || !values.length) {
         console.error(`Failed to parse rule: ${rule}`);
         return false;
      }

      const fieldValue = data[field];
      let computedValue: any;

      // Determine the type of the field and evaluate accordingly
      if (typeof fieldValue === "number") {
         computedValue = evaluateNumericRule(field, operator, values, data);
      } else if (fieldValue instanceof Date || !isNaN(new Date(fieldValue).getTime())) {
         computedValue = evaluateDateRule(field, operator, values, data);
      } else if (typeof fieldValue === "boolean") {
         computedValue = evaluateBooleanRule(field, operator, values, data);
      } else {
         console.warn(`Unsupported field type for ${field}: ${typeof fieldValue}`);
         computedValue = fieldValue; // Fallback to original value
      }

      // Set the computed value back to the data
      data[field] = computedValue;

      // Return true to indicate the value was set successfully
      return true;
   };
};