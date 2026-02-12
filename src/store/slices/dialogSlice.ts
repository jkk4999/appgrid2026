/**
 * Dialog Slice
 *
 * Manages visibility state for all dialogs in the application.
 * Uses createSliceWithSetters for automatic setter generation.
 */

import { createSliceWithSetters } from '../createSlice';

// ============================================================
// INITIAL STATE
// ============================================================

const dialogState = {
  // Main grid dialogs
  showDeleteRecordDialog: false,
  showCreateFilterDialog: false,
  showDeleteFilterDialog: false,
  showCreateTemplateDialog: false,
  showDeleteTemplateDialog: false,
  showGridEditDialog: false,
  showRecordTypeDialog: false,
  showFilterBuilder: false,
  showFormatColumnDialog: false,
  showFormatRowDialog: false,
  showCalculatedColumnDialog: false,
  showAdvancedFilterBuilder: false,

  // Subgrid dialogs
  showSubgridDeleteRecordDialog: false,
  showSubgridCreateFilterDialog: false,
  showSubgridDeleteFilterDialog: false,
  showSubgridCreateTemplateDialog: false,
  showSubgridDeleteTemplateDialog: false,
  showSubgridEditDialog: false,
  showSubgridFormatColumnDialog: false,
  showSubgridFormatRowDialog: false,
  showSubgridCalculatedColumnDialog: false,
  showSubgridAdvancedFilterBuilder: false,

  // Other dialogs
  showCreateProjectDialog: false,
  showCreateTimeSeriesRecordDialog: false,
  showResourceReassignmentDialog: false,
};

// ============================================================
// SLICE CREATOR
// ============================================================

export const createDialogSlice = createSliceWithSetters(dialogState);
