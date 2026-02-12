type FieldType =
  | 'BOOLEAN'
  | 'CURRENCY'
  | 'DATE'
  | 'DATETIME'
  | 'DECIMAL'
  | 'DOUBLE'
  | 'INTEGER'
  | 'LONG'
  | 'PERCENTAGE'
  | string;

export interface Formatters {
  dateFormatter: Intl.DateTimeFormat;
  numberFormatter: Intl.NumberFormat;
  currencyFormatter: Intl.NumberFormat;
  percentageFormatter: Intl.NumberFormat;
}

// Utility to consistently format values based on Salesforce field type
export function formatByFieldType(
  value: any,
  fieldType: FieldType,
  { dateFormatter, numberFormatter, currencyFormatter, percentageFormatter }: Formatters
): any {
  try {
    switch (fieldType) {
      case 'BOOLEAN':
        return value;
      case 'CURRENCY':
        return value != null && value !== '' ? currencyFormatter.format(value) : null;
      case 'DATE':
      case 'DATETIME': {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'string') {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
          if (dateRegex.test(value)) {
            const d = new Date(value);
            return dateFormatter.format(d);
          }
          // unknown string format: return original string
          return value;
        }
        // value can be Date or timestamp-like
        const d = value instanceof Date ? value : new Date(value);
        return isNaN(d.getTime()) ? null : dateFormatter.format(d);
      }
      case 'DECIMAL':
      case 'DOUBLE':
      case 'INTEGER':
      case 'LONG': {
        if (value == null || value === '') return null;
        const num = typeof value === 'number' ? value : parseFloat(String(value));
        return isNaN(num) ? null : numberFormatter.format(num);
      }
      case 'PERCENTAGE':
        return value != null && value !== '' ? percentageFormatter.format(value) : null;
      default:
        return value;
    }
  } catch {
    return value;
  }
}

