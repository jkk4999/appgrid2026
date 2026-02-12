// Centralized mappings for objects that do not use the standard 'Name' field
// for display, and their correct display fields. Mirrors patterns used in AppGrid/GridView.

export const objectsWithoutNameFieldMap = new Map<string, string>([
  // key: Id prefix (first 3 chars) -> sObject
  ['02i', 'Asset'],
  ['500', 'Case'],
  ['800', 'Contract'],
  ['3tt', 'Invoice'],
  ['801', 'Order'],
  ['01t', 'Product2'],
  ['0Q0', 'Quote'],
  ['501', 'Solution'],
  // Add as needed
]);

export const nameFieldMap = new Map<string, string>([
  // key: sObject -> display field
  ['Asset', 'AssetNumber'],
  ['Case', 'CaseNumber'],
  ['Contract', 'ContractNumber'],
  ['Event', 'Subject'],
  ['Invoice', 'InvoiceNumber'],
  ['Order', 'OrderNumber'],
  ['Product2', 'ProductCode'],
  ['Quote', 'QuoteNumber'],
  ['Solution', 'SolutionNumber'],
  ['Task', 'Subject'],
  // Add as needed
]);

export function guessSObjectFromIdPrefix(id: string): string | null {
  if (!id || id.length < 3) return null;
  const prefix = id.substring(0, 3);
  return objectsWithoutNameFieldMap.get(prefix) || null;
}

export function getPreferredNameFieldForObject(sObjectName: string, fallback: string = 'Name'): string {
  return nameFieldMap.get(sObjectName) || fallback;
}

