/**
 * TypeScript interfaces for ImportWizard functionality
 * Provides type safety across the import pipeline
 */

import type { SObjectFieldMetadata } from '../../../sObjectMetadataTypes';

// ============================================================================
// API Response Types
// ============================================================================

export interface ImportApiResponse {
   status: 'success' | 'error';
   insertedCount?: number;
   errors?: ImportRecordError[];
   errorMessage?: string;
}

export interface ImportRecordError {
   rowIndex: number;
   fieldName?: string;
   message: string;
   recordId?: string;
}

export interface GetSObjectNameResponse {
   status: 'success' | 'error';
   sObjectName?: string;
}

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationResult<T = any> {
   value?: T;
   error?: string;
}

export interface NormalizationResult {
   value?: any;
   error?: string;
}

// ============================================================================
// Import Data Types
// ============================================================================

export interface ParsedRow {
   [property: string]: any;
}

export interface PreviewRow extends ParsedRow {
   __error?: string;
   __rowIndex?: number;
}

export interface FieldMapping {
   [propertyName: string]: string; // property -> Salesforce API name
}

export interface MappingError {
   field: string;
   message: string;
}

// ============================================================================
// Parser Function Types
// ============================================================================

export interface DateParseResult {
   value?: string | null | Date;
   error?: string;
}

export interface NumberParseResult {
   value?: number | null;
   error?: string;
}

export type DateParser = (raw: any) => DateParseResult;
export type NumberParser = (raw: any) => NumberParseResult;

// ============================================================================
// Import Step Types
// ============================================================================

export interface ImportStepValidation {
   canProceed: boolean;
   errors: string[];
   warnings: string[];
}

// ============================================================================
// Enrichment Types
// ============================================================================

export interface EnrichmentOptions {
   apiClient: any;
   metaFields: SObjectFieldMetadata[];
   previewRows: PreviewRow[];
}

export interface EnrichmentResult {
   enrichedRows: PreviewRow[];
   errors: string[];
}

// ============================================================================
// File Parsing Types
// ============================================================================

export interface ParsedFileData {
   headers: string[];
   rows: ParsedRow[];
   sheetNames: string[];
   namedRanges: NamedRange[];
}

export interface NamedRange {
   name: string;
   ref: string;
}

// ============================================================================
// Normalization Options
// ============================================================================

export interface NormalizationOptions {
   parseNumber: NumberParser;
   parseDate?: DateParser;
   validatePicklists?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const IMPORT_CONSTANTS = {
   EXCEL_SERIAL_DATE_MIN: 10000,
   EXCEL_SERIAL_DATE_MAX: 90000,
   SOQL_BATCH_SIZE: 200,
   ERROR_COLUMN_ID: '__error',
   ROW_INDEX_COLUMN_ID: '__rowIndex',
   ENRICHMENT_DEBOUNCE_MS: 200,
   MAX_PARALLEL_ENRICHMENT: 5,
} as const;

export const TRUTHY_VALUES = ['true', 'yes', 'y', '1'] as const;
export const FALSY_VALUES = ['false', 'no', 'n', '0'] as const;
