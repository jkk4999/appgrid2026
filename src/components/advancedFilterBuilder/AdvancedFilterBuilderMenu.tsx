/**
 * Menu component for the Advanced Filter Builder
 * Provides Run, Save, Save As, and Delete buttons
 */
import React from 'react';

// PubSubJS
import PubSub from 'pubsub-js';

// MUI
import { Button, Stack, useTheme } from '@mui/material';

// MUI icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';

import SaveIcon from '@mui/icons-material/CheckOutlined';

import SaveAsOutlinedIcon from '@mui/icons-material/SaveAsOutlined';

import ClearAllOutlinedIcon from '@mui/icons-material/ClearAllOutlined';

// PubSub event topics for filter operations
export const ADVANCED_FILTER_EVENTS = {
  RUN_FILTER: 'AdvancedFilterBuilder:RunFilter',
  SAVE_FILTER: 'AdvancedFilterBuilder:SaveFilter',
  SAVE_AS_FILTER: 'AdvancedFilterBuilder:SaveAsFilter',
  DELETE_FILTER: 'AdvancedFilterBuilder:DeleteFilter',
  CLEAR_FILTER: 'AdvancedFilterBuilder:ClearFilter',
  // Subgrid events
  SUBGRID_RUN_FILTER: 'SubgridAdvancedFilterBuilder:RunFilter',
  SUBGRID_SAVE_FILTER: 'SubgridAdvancedFilterBuilder:SaveFilter',
  SUBGRID_SAVE_AS_FILTER: 'SubgridAdvancedFilterBuilder:SaveAsFilter',
  SUBGRID_DELETE_FILTER: 'SubgridAdvancedFilterBuilder:DeleteFilter',
  SUBGRID_CLEAR_FILTER: 'SubgridAdvancedFilterBuilder:ClearFilter',
};

interface AdvancedFilterBuilderMenuProps {
  /** Whether this is for a subgrid (uses different event topics) */
  isSubgrid?: boolean;
  /** Whether a filter is currently selected (enables Save button) */
  hasSelectedFilter?: boolean;
}

const AdvancedFilterBuilderMenu: React.FC<AdvancedFilterBuilderMenuProps> = ({
  isSubgrid = false,
  hasSelectedFilter = false,
}) => {
  const theme = useTheme();

  // Get the appropriate event prefix
  const events = isSubgrid
    ? {
      run: ADVANCED_FILTER_EVENTS.SUBGRID_RUN_FILTER,
      save: ADVANCED_FILTER_EVENTS.SUBGRID_SAVE_FILTER,
      saveAs: ADVANCED_FILTER_EVENTS.SUBGRID_SAVE_AS_FILTER,
      delete: ADVANCED_FILTER_EVENTS.SUBGRID_DELETE_FILTER,
      clear: ADVANCED_FILTER_EVENTS.SUBGRID_CLEAR_FILTER,
    }
    : {
      run: ADVANCED_FILTER_EVENTS.RUN_FILTER,
      save: ADVANCED_FILTER_EVENTS.SAVE_FILTER,
      saveAs: ADVANCED_FILTER_EVENTS.SAVE_AS_FILTER,
      delete: ADVANCED_FILTER_EVENTS.DELETE_FILTER,
      clear: ADVANCED_FILTER_EVENTS.CLEAR_FILTER,
    };

  const buttonSx = {
    color: theme.palette.text.primary,
    '&:hover': {
      color: theme.palette.text.primary,
    },
  };

  return (
    <Stack direction="row" spacing={1} alignItems="flex-start">
      {/* Apply/Run filter */}
      <Button
        variant="text"
        startIcon={<DirectionsRunOutlinedIcon />}
        sx={buttonSx}
        onClick={() => PubSub.publish(events.run)}
      >
        Apply
      </Button>

      {/* Clear filter */}
      <Button
        variant="text"
        startIcon={<ClearAllOutlinedIcon />}
        sx={buttonSx}
        onClick={() => PubSub.publish(events.clear)}
      >
        Clear
      </Button>

      {/* Save (only if a filter is selected) */}
      {hasSelectedFilter && (
        <Button
          variant="text"
          startIcon={<SaveIcon />}
          sx={buttonSx}
          onClick={() => PubSub.publish(events.save)}
        >
          Save
        </Button>
      )}

      {/* Save As */}
      <Button
        variant="text"
        startIcon={<SaveAsOutlinedIcon />}
        sx={buttonSx}
        onClick={() => PubSub.publish(events.saveAs)}
      >
        Save As
      </Button>

      {/* Delete (only if a filter is selected) */}
      {hasSelectedFilter && (
        <Button
          variant="text"
          startIcon={<DeleteOutlinedIcon />}
          sx={buttonSx}
          onClick={() => PubSub.publish(events.delete)}
        >
          Delete
        </Button>
      )}
    </Stack>
  );
};

export { AdvancedFilterBuilderMenu };
export default AdvancedFilterBuilderMenu;
