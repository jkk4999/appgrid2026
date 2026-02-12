/*==========================================
** IMPORTS
==========================================*/

import jsep from "jsep";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import advancedFormat from "dayjs/plugin/advancedFormat";

// Extend dayjs with plugins
dayjs.extend(weekOfYear);
dayjs.extend(advancedFormat);

/*==========================================
** TYPES & INTERFACES
==========================================*/

type CustomFunctionMap = {
  [functionName: string]: {
    fn: (...args: any[]) => any;
    type: "date" | "string" | "number" | "boolean";
  };
};

/*==========================================
** CONSTANTS
==========================================*/

export const customFunctions: CustomFunctionMap = {
  IS_NUMERIC: {
    fn: (value: any) => !isNaN(parseFloat(value)) && isFinite(value),
    type: "boolean",
  },
  ABS: {
    fn: (value: number) => Math.abs(value),
    type: "number",
  },
  CEILING: {
    fn: (value: number) => Math.ceil(value),
    type: "number",
  },
  FLOOR: {
    fn: (value: number) => Math.floor(value),
    type: "number",
  },
  ROUND: {
    fn: (value, decimals = 0) => {
      const factor = Math.pow(10, decimals);
      return Math.round(value * factor) / factor;
    },
    type: "number",
  },
  MIN: {
    fn: (...values: number[]) => Math.min(...values),
    type: "number",
  },
  MAX: {
    fn: (...values: number[]) => Math.max(...values),
    type: "number",
  },
  AVG: {
    fn: (...values: number[]) => values.reduce((sum, val) => sum + val, 0) / values.length,
    type: "number",
  },
  SUB: {
    fn: (a, b) => {
      if (typeof a !== "number" || typeof b !== "number") {
        throw new Error("SUB function expects two numbers");
      }
      return a - b;
    },
    type: "number",
  },
  MUL: {
    fn: (...values) => {
      if (values.length === 0) {
        throw new Error("MUL function requires at least one number");
      }
      if (!values.every((val) => typeof val === "number")) {
        throw new Error("MUL function expects all arguments to be numbers");
      }
      return values.reduce((product, val) => product * val, 1);
    },
    type: "number",
  },
  DIV: {
    fn: (...values) => {
      if (values.length === 0) {
        throw new Error("DIV function requires at least one number");
      }
      if (!values.every((val) => typeof val === "number")) {
        throw new Error("DIV function expects all arguments to be numbers");
      }
      if (values.slice(1).includes(0)) {
        throw new Error("Division by zero is not allowed");
      }
      return values.reduce((quotient, val) => quotient / val);
    },
    type: "number",
  },
  MOD: {
    fn: (value: number, divisor: number) => value % divisor,
    type: "number",
  },
  POW: {
    fn: (base: number, exponent: number) => Math.pow(base, exponent),
    type: "number",
  },
  CONTAINS: {
    fn: (text: string, substring: string) => text.toLowerCase().includes(substring.toLowerCase()),
    type: "boolean",
  },
  STARTS_WITH: {
    fn: (text: string, prefix: string) => text.toLowerCase().startsWith(prefix.toLowerCase()),
    type: "boolean",
  },
  ENDS_WITH: {
    fn: (text: string, suffix: string) => text.toLowerCase().endsWith(suffix.toLowerCase()),
    type: "boolean",
  },
  LEN: {
    fn: (text: string) => text.length,
    type: "number",
  },
  SUBSTRING: {
    fn: (text: string, start: number, length: number) => text.substring(start, start + length),
    type: "string",
  },
  REPLACE: {
    fn: (text: string, search: string, replace: string) => text.split(search).join(replace),
    type: "string",
  },
  CONCAT: {
    fn: (...args: string[]) => args.join(""),
    type: "string",
  },
  ADD_DAYS: {
    fn: (date: Date, days: number) => dayjs(date).add(days, "day").toDate(),
    type: "date",
  },
  ADD_WEEKS: {
    fn: (date: string, weeks: number) => dayjs(date).add(weeks, "week").toDate(),
    type: "date",
  },
  ADD_MONTHS: {
    fn: (date: string, months: number) => dayjs(date).add(months, "month").toDate(),
    type: "date",
  },
  ADD_YEARS: {
    fn: (date: string, years: number) => dayjs(date).add(years, "year").toDate(),
    type: "date",
  },
  DIFF_DAYS: {
    fn: (date1: string, date2: string) => dayjs(date1).diff(dayjs(date2), "day"),
    type: "number",
  },
  DIFF_WEEKS: {
    fn: (date1: string, date2: string) => dayjs(date1).diff(dayjs(date2), "week"),
    type: "number",
  },
  DIFF_MONTHS: {
    fn: (date1: string, date2: string) => dayjs(date1).diff(dayjs(date2), "month"),
    type: "number",
  },
  DIFF_YEARS: {
    fn: (date1: string, date2: string) => dayjs(date1).diff(dayjs(date2), "year"),
    type: "number",
  },
  NOW: {
    fn: () => dayjs().toDate(),
    type: "date",
  },
  DAY: {
    fn: (date: string) => dayjs(date).date(),
    type: "number",
  },
  WEEK: {
    fn: (date: string) => dayjs(date).week(),
    type: "number",
  },
  MONTH: {
    fn: (date: string) => dayjs(date).month() + 1,
    type: "number",
  },
  YEAR: {
    fn: (date: string) => dayjs(date).year(),
    type: "number",
  },
};

/*==========================================
** HELPER FUNCTIONS
==========================================*/

export const customEqual = (a: any, b: any): boolean => {
  if (a == null || b == null) {
    return a == b;
  }
  if (typeof a === "string" || typeof b === "string") {
    return String(a) === String(b);
  }
  if (typeof a === "boolean" || typeof b === "boolean") {
    return Boolean(a) === Boolean(b);
  }
  if (a instanceof Date || b instanceof Date) {
    const dateA = a instanceof Date ? a : new Date(a);
    const dateB = b instanceof Date ? b : new Date(b);
    return !isNaN(dateA.getTime()) && !isNaN(dateB.getTime()) && dateA.getTime() === dateB.getTime();
  }
  return Number(a) === Number(b);
};

// Evaluate expression (adapted to take fieldMap as parameter)
export const evaluateExpression = (
  node: any,
  data: any,
  fieldMap: Record<string, string>
): { value: any; type: string } => {
  if (node.type === "Literal") {
    const value = node.value;
    if (typeof value === "number") return { value, type: "number" };
    if (typeof value === "string") return { value, type: "string" };
    if (typeof value === "boolean") return { value, type: "boolean" };
    return { value, type: "unknown" };
  } else if (node.type === "Identifier") {
    const fieldName = node.name;
    const value = data[fieldName];
    const type = fieldMap[fieldName] || "unknown";
    return { value, type };
  } else if (node.type === "BinaryExpression") {
    const left = evaluateExpression(node.left, data, fieldMap);
    const right = evaluateExpression(node.right, data, fieldMap);
    const operator = node.operator;
    let value;
    switch (operator) {
      case "+":
        if (left.type === "string" || right.type === "string") {
          value = String(left.value) + String(right.value);
          return { value, type: "string" };
        } else {
          value = Number(left.value) + Number(right.value);
          return { value, type: "number" };
        }
      case "-":
        value = Number(left.value) - Number(right.value);
        return { value, type: "number" };
      case "*":
        value = Number(left.value) * Number(right.value);
        return { value, type: "number" };
      case "/":
        value = Number(left.value) / Number(right.value);
        return { value, type: "number" };
      case "&&":
        value = Boolean(left.value) && Boolean(right.value);
        return { value, type: "boolean" };
      case "||":
        value = Boolean(left.value) || Boolean(right.value);
        return { value, type: "boolean" };
      case "==":
        value = customEqual(left.value, right.value);
        return { value, type: "boolean" };
      case "!=":
        value = !customEqual(left.value, right.value);
        return { value, type: "boolean" };
      case "<":
        value = Number(left.value) < Number(right.value);
        return { value, type: "boolean" };
      case "<=":
        value = Number(left.value) <= Number(right.value);
        return { value, type: "boolean" };
      case ">":
        value = Number(left.value) > Number(right.value);
        return { value, type: "boolean" };
      case ">=":
        value = Number(left.value) >= Number(right.value);
        return { value, type: "boolean" };
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  } else if (node.type === "UnaryExpression") {
    const operand = evaluateExpression(node.argument, data, fieldMap);
    if (node.operator === "-") {
      if (operand.type === "number") {
        return { value: -operand.value, type: "number" };
      } else {
        throw new Error("Unary minus can only be applied to numbers");
      }
    } else {
      throw new Error(`Unsupported unary operator: ${node.operator}`);
    }
  } else if (node.type === "CallExpression") {
    const funcName = node.callee.name;
    const args = node.arguments.map((arg: any) => evaluateExpression(arg, data, fieldMap).value);
    if (customFunctions[funcName]) {
      const funcInfo = customFunctions[funcName];
      const value = funcInfo.fn(...args);
      return { value, type: funcInfo.type };
    }
    throw new Error(`Unknown function: ${funcName}`);
  }
  throw new Error(`Unsupported node type: ${node.type}`);
};

// Remove curly braces from expression
export const removeBraces = (expr: string): string => {
  return expr.replace(/\{(\w+)\}/g, "$1");
};

// Parse expression into AST
export const parseExpression = (expr: string): any => {
  const cleanedExpr = removeBraces(expr);
  return jsep(cleanedExpr);
};

// Map Apex types to JS types (copied from ExpressionBuilderGroc)
export const mapApexTypeToJsType = (apexType: string): "string" | "boolean" | "numeric" | "date" | undefined => {
  switch (apexType) {
    case "BOOLEAN":
      return "boolean";
    case "CURRENCY":
    case "DECIMAL":
    case "DOUBLE":
    case "INTEGER":
    case "LONG":
    case "PERCENTAGE":
      return "numeric";
    case "DATE":
    case "DATETIME":
      return "date";
    default:
      return "string";
  }
};

export const getExpressionType = (node: any, fieldMap: Record<string, string>): string => {
   if (node.type === "Literal") {
     const value = node.value;
     if (typeof value === 'number') return 'number';
     if (typeof value === 'string') return 'string';
     if (typeof value === 'boolean') return 'boolean';
     return 'unknown';
   } else if (node.type === "Identifier") {
     return fieldMap[node.name] || 'unknown';
   } else if (node.type === "BinaryExpression") {
     const leftType = getExpressionType(node.left, fieldMap);
     const rightType = getExpressionType(node.right, fieldMap);
     const operator = node.operator;
     switch (operator) {
       case "+":
         return (leftType === 'string' || rightType === 'string') ? 'string' : 'number';
       case "-":
       case "*":
       case "/":
         return 'number';
       case "&&":
       case "||":
       case "==":
       case "!=":
       case "<":
       case "<=":
       case ">":
       case ">=":
         return 'boolean';
       default:
         return 'unknown';
     }
   } else if (node.type === "CallExpression") {
     const funcName = node.callee.name;
     // Assuming customFunctions maps function names to their return types
     return customFunctions[funcName]?.type || 'unknown';
   }
   return 'unknown';
 };