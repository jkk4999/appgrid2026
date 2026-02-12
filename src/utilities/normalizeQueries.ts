import { SObjectQuery } from '../sObjectMetadataTypes';

// Normalizes raw query records from various sources/field names into a canonical SObjectQuery shape
export function normalizeQueries(raw: any[], fallbackSObjectApiName?: string): SObjectQuery[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((q: any) => {
    const id = q?.id ?? q?.Id;
    const name = q?.name ?? q?.Name ?? '';
    const sObjectApiName =
      q?.sObjectApiName ??
      q?.SObjectApiName ??
      q?.AppGridAg__SobjectApiName__c ??
      fallbackSObjectApiName ?? '';

    const queryRule =
      q?.queryRule ??
      q?.QueryRule ??
      q?.AppGridAg__QueryRule__c ??
      q?.AppGridAg__Query_Rule__c ??
      '';

    const relationQueryRule =
      q?.relationQueryRule ??
      q?.RelationQueryRule ??
      q?.AppGridAg__RelationQueryRule__c ??
      null;

    const relationSObjectApiName =
      q?.relationSObjectApiName ??
      q?.RelationSObjectApiName ??
      q?.AppGridAg__RelationSObjectApiName__c ??
      null;
    const relationRelationshipName =
      q?.relationRelationshipName ??
      q?.RelationRelationshipName ??
      q?.AppGridAg__RelationRelationshipName__c ??
      null;

    return {
      id,
      name,
      sObjectApiName,
      queryRule,
      relationQueryRule: relationQueryRule ?? undefined,
      relationSObjectApiName: relationSObjectApiName ?? undefined,
      relationRelationshipName: relationRelationshipName ?? undefined,
    } as SObjectQuery;
  });
}

export default normalizeQueries;
